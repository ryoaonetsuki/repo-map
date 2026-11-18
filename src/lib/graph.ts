import type { RepoMap } from './analyze';

const RESOLVABLE_EXTS = [
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.rs', '.java', '.kt', '.vue', '.svelte', '.css',
];

export interface GraphNode {
  id: string;
  partId: string;
  label: string;
  description: string;
  language: string;
  size: number;
  kind: 'entry' | 'hub' | 'big' | 'file';
  degree: number;
  inDegree: number;
  outDegree: number;
  isEndpoint: boolean;
  isLarge: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
}

export interface RepoGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  partOrder: string[];
}

function pathSet(paths: string[]): Set<string> {
  return new Set(paths);
}

function tryResolveFile(specifier: string, paths: Set<string>): string | null {
  if (paths.has(specifier)) return specifier;
  for (const ext of RESOLVABLE_EXTS) {
    const withExt = specifier + ext;
    if (paths.has(withExt)) return withExt;
    const withIndex = specifier + '/index' + ext;
    if (paths.has(withIndex)) return withIndex;
  }
  return null;
}

function resolvePythonImport(specifier: string, paths: Set<string>): string | null {
  const parts = specifier.split('.');
  const asPath = parts.join('/') + '.py';
  if (paths.has(asPath)) return asPath;
  const asInit = parts.join('/') + '/__init__.py';
  if (paths.has(asInit)) return asInit;
  if (parts.length > 1) {
    const first = parts[0] + '.py';
    if (paths.has(first)) return first;
  }
  return null;
}

function resolveGoImport(
  specifier: string,
  goModulePath: string | null,
  paths: Set<string>,
): string | null {
  if (!goModulePath) return null;
  if (!specifier.startsWith(goModulePath)) return null;
  const relative = specifier.slice(goModulePath.length).replace(/^\//, '');
  if (!relative) return null;
  return tryResolveFile(relative, paths);
}

/** Collapse `.` / `..` segments: 'src/routes/../lib/db' -> 'src/lib/db'. */
function normalizePath(p: string): string {
  const out: string[] = [];
  for (const seg of p.split('/')) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') {
      out.pop();
      continue;
    }
    out.push(seg);
  }
  return out.join('/');
}

export function resolveImport(
  specifier: string,
  fromPath: string,
  allPaths: string[],
  goModulePath: string | null,
  language: string,
): string | null {
  const paths = pathSet(allPaths);

  if (language === 'Python') {
    return resolvePythonImport(specifier, paths);
  }

  if (language === 'Go') {
    return resolveGoImport(specifier, goModulePath, paths);
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    // Relative to the IMPORTING file's directory, not the repo root.
    const dir = fromPath.includes('/') ? fromPath.slice(0, fromPath.lastIndexOf('/')) : '';
    const joined = normalizePath(dir ? `${dir}/${specifier}` : specifier);
    return tryResolveFile(joined, paths);
  }

  if (specifier.startsWith('@/')) {
    const srcPath = 'src/' + specifier.slice(2);
    return tryResolveFile(srcPath, paths);
  }

  // Bare specifier that names a file inside the repo (e.g. 'src/utils').
  return tryResolveFile(specifier, paths);
}

export function buildGraph(map: RepoMap, goModulePath: string | null = null): RepoGraph {
  const { files, startHere, endpoints, parts } = map;
  const allPaths = files.map((f) => f.path);
  const endpointFiles = new Set(endpoints.map((e) => e.file));
  const entryPaths = new Set(startHere.map((s) => s.path));

  const rawEdges = new Set<string>();
  const outDegree = new Map<string, number>();
  const inDegree = new Map<string, number>();

  for (const f of files) {
    if (f.imports.length === 0) continue;
    for (const spec of f.imports) {
      const target = resolveImport(spec, f.path, allPaths, goModulePath, f.language);
      if (!target) continue;
      if (target === f.path) continue;
      const key = `${f.path}->${target}`;
      if (rawEdges.has(key)) continue;
      rawEdges.add(key);
      outDegree.set(f.path, (outDegree.get(f.path) ?? 0) + 1);
      inDegree.set(target, (inDegree.get(target) ?? 0) + 1);
    }
  }

  const edges: GraphEdge[] = [...rawEdges].map((key) => {
    const [from, to] = key.split('->');
    return { from, to };
  });

  const fetchedWithImports = new Set(files.filter((f) => f.imports.length > 0).map((f) => f.path));
  const candidatePaths = new Set<string>();
  for (const p of fetchedWithImports) candidatePaths.add(p);
  for (const p of entryPaths) candidatePaths.add(p);
  for (const p of endpointFiles) candidatePaths.add(p);
  for (const e of edges) {
    candidatePaths.add(e.from);
    candidatePaths.add(e.to);
  }

  const degree = new Map<string, number>();
  for (const p of candidatePaths) {
    degree.set(p, (inDegree.get(p) ?? 0) + (outDegree.get(p) ?? 0));
  }

  const MAX_NODES = 150;
  const selected = new Set<string>();

  for (const p of entryPaths) selected.add(p);
  for (const p of endpointFiles) selected.add(p);

  if (selected.size < MAX_NODES) {
    const byDegree = [...candidatePaths]
      .filter((p) => !selected.has(p))
      .sort((a, b) => (degree.get(b) ?? 0) - (degree.get(a) ?? 0) || a.localeCompare(b));
    for (const p of byDegree) {
      if (selected.size >= MAX_NODES) break;
      selected.add(p);
    }
  }

  if (selected.size < MAX_NODES) {
    const bySize = [...candidatePaths]
      .filter((p) => !selected.has(p))
      .sort((a, b) => {
        const fa = files.find((file) => file.path === a);
        const fb = files.find((file) => file.path === b);
        return (fb?.size ?? 0) - (fa?.size ?? 0) || a.localeCompare(b);
      });
    for (const p of bySize) {
      if (selected.size >= MAX_NODES) break;
      selected.add(p);
    }
  }

  if (selected.size < MAX_NODES) {
    const rest = [...candidatePaths]
      .filter((p) => !selected.has(p))
      .sort((a, b) => a.localeCompare(b));
    for (const p of rest) {
      if (selected.size >= MAX_NODES) break;
      selected.add(p);
    }
  }

  const finalEdges = edges.filter((e) => selected.has(e.from) && selected.has(e.to));

  const finalInDegree = new Map<string, number>();
  const finalOutDegree = new Map<string, number>();
  for (const e of finalEdges) {
    finalOutDegree.set(e.from, (finalOutDegree.get(e.from) ?? 0) + 1);
    finalInDegree.set(e.to, (finalInDegree.get(e.to) ?? 0) + 1);
  }
  const finalDegree = new Map<string, number>();
  for (const p of selected) {
    finalDegree.set(p, (finalInDegree.get(p) ?? 0) + (finalOutDegree.get(p) ?? 0));
  }

  const topDegree = [...selected]
    .sort((a, b) => (finalDegree.get(b) ?? 0) - (finalDegree.get(a) ?? 0) || a.localeCompare(b));
  const hubSet = new Set(topDegree.slice(0, 5).filter((p) => (finalDegree.get(p) ?? 0) >= 3));

  const topSize = [...selected]
    .sort((a, b) => {
      const fa = files.find((file) => file.path === a);
      const fb = files.find((file) => file.path === b);
      return (fb?.size ?? 0) - (fa?.size ?? 0) || a.localeCompare(b);
    });
  const bigBySizeSet = new Set(topSize.slice(0, 3));

  const partById = new Map(parts.map((p) => [p.id, p]));
  const nodes: GraphNode[] = [...selected].map((path) => {
    const f = files.find((file) => file.path === path)!;
    const topDir = f.dir === '' ? '' : f.dir.split('/')[0];
    const part = partById.get(topDir);
    const partId = part?.id ?? 'root';
    const deg = finalDegree.get(path) ?? 0;
    const isEntry = entryPaths.has(path);
    const isHub = hubSet.has(path);
    const isBig = bigBySizeSet.has(path) || f.size > 500_000;

    let kind: GraphNode['kind'] = 'file';
    if (isEntry) kind = 'entry';
    else if (isHub) kind = 'hub';
    else if (isBig) kind = 'big';

    return {
      id: path,
      partId,
      label: f.name,
      description: f.description,
      language: f.language,
      size: f.size,
      kind,
      degree: deg,
      inDegree: finalInDegree.get(path) ?? 0,
      outDegree: finalOutDegree.get(path) ?? 0,
      isEndpoint: endpointFiles.has(path),
      isLarge: f.size > 500_000,
    };
  });

  return {
    nodes,
    edges: finalEdges,
    partOrder: parts.map((p) => p.id),
  };
}
