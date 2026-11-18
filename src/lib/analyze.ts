import type { RepoMeta, TreeEntry } from './github';

export interface AnalyzedFile {
  path: string;
  name: string;
  dir: string;
  ext: string;
  language: string;
  size: number;
  description: string;
  imports: string[];
  exports: string[];
}

export interface Part {
  id: string;
  name: string;
  purpose: string;
  paths: string[];
  files: AnalyzedFile[];
}

export interface Endpoint {
  method: string;
  path: string;
  file: string;
  purpose: string;
}

export interface HealthNote {
  level: 'good' | 'warn' | 'info';
  title: string;
  detail: string;
}

export interface StartHereItem {
  path: string;
  reason: string;
}

export interface RepoMap {
  meta: RepoMeta;
  totalFiles: number;
  totalSize: number;
  skippedCount: number;
  truncated: boolean;
  languages: { name: string; files: number; bytes: number; pct: number }[];
  frameworks: string[];
  parts: Part[];
  files: AnalyzedFile[];
  endpoints: Endpoint[];
  health: HealthNote[];
  startHere: StartHereItem[];
  readmeExcerpt: string | null;
}

/* ------------------------------------------------------------------ */
/* Language + extension tables                                         */
/* ------------------------------------------------------------------ */

const EXT_LANG: Record<string, string> = {
  ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
  mjs: 'JavaScript', cjs: 'JavaScript', py: 'Python', go: 'Go',
  rs: 'Rust', java: 'Java', kt: 'Kotlin', kts: 'Kotlin', swift: 'Swift',
  cs: 'C#', php: 'PHP', rb: 'Ruby', c: 'C', h: 'C', cpp: 'C++', cc: 'C++',
  hpp: 'C++', css: 'CSS', scss: 'CSS', less: 'CSS', html: 'HTML',
  vue: 'Vue', svelte: 'Svelte', astro: 'Astro', md: 'Markdown',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', toml: 'TOML', sh: 'Shell',
  sql: 'SQL', lua: 'Lua', dart: 'Dart', scala: 'Scala', ex: 'Elixir',
  exs: 'Elixir', hs: 'Haskell', clj: 'Clojure', zig: 'Zig',
};

export const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572a5', Go: '#00add8',
  Rust: '#dea584', Java: '#b07219', Kotlin: '#a97bff', Swift: '#f05138',
  'C#': '#178600', PHP: '#4f5d95', Ruby: '#701516', C: '#555555',
  'C++': '#f34b7d', CSS: '#663399', HTML: '#e34c26', Vue: '#41b883',
  Svelte: '#ff3e00', Astro: '#ff5d01', Markdown: '#083fa1', JSON: '#292929',
  YAML: '#cb171e', Shell: '#89e051', SQL: '#e38c00', Dart: '#00b4ab',
  Scala: '#c22d40', Elixir: '#6e4a7e', Zig: '#ec915c',
};

const CODE_EXTS = new Set(Object.keys(EXT_LANG).filter((e) => !['md', 'json', 'yaml', 'yml', 'toml'].includes(e)));

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'coverage',
  '__pycache__', '.venv', 'venv', 'target', 'out', '.turbo', '.cache',
  'Pods', '.idea', '.vscode', 'bin', 'obj', 'tmp', '.terraform',
]);

const SKIP_FILES = new Set(['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'composer.lock', 'Gemfile.lock', 'poetry.lock']);

export function languageOf(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (path.endsWith('Dockerfile') || path.endsWith('.dockerfile')) return 'Dockerfile';
  if (path.endsWith('Makefile') || path.endsWith('.mk')) return 'Makefile';
  return EXT_LANG[ext] ?? 'Other';
}

function isSkipped(path: string): boolean {
  const parts = path.split('/');
  if (parts.some((p) => SKIP_DIRS.has(p))) return true;
  return SKIP_FILES.has(parts[parts.length - 1]);
}

function humanize(name: string): string {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* ------------------------------------------------------------------ */
/* Plain-English descriptions                                          */
/* ------------------------------------------------------------------ */

const DIR_PURPOSE: Record<string, string> = {
  src: 'The main source code — where the app is actually built.',
  app: 'The app itself — screens, pages and the code that runs them.',
  components: 'The reusable interface pieces — buttons, cards, dialogs and forms.',
  pages: 'One file per screen — each file is a page the user can open.',
  routes: 'The pages and endpoints — what each URL on the site does.',
  api: 'The server side — code that answers requests from the app.',
  server: 'The server — the code that runs away from the browser.',
  client: 'The part that runs in the browser.',
  lib: 'Shared helpers — small utilities the rest of the code calls on.',
  utils: 'Small helper functions used all over the codebase.',
  hooks: 'Reusable behaviour — logic shared between screens.',
  store: 'Shared state — the data every screen reads from.',
  state: 'Shared state — the data every screen reads from.',
  services: 'Connections to the outside world — databases, APIs and other services.',
  models: 'The shape of the data — what a user, an order or a post looks like.',
  views: 'The screens — what the user actually sees.',
  controllers: 'The request handlers — one per thing the app can do.',
  tests: 'Automated checks — they prove the code still works.',
  test: 'Automated checks — they prove the code still works.',
  __tests__: 'Automated checks — they prove the code still works.',
  e2e: 'End-to-end checks — they drive the real app like a user would.',
  docs: 'Documentation — guides and explanations for people working on this.',
  examples: 'Working examples — small demos of how to use this.',
  demo: 'A live demo — a small working version to try out.',
  scripts: 'Automation scripts — small jobs run by hand or by CI.',
  tools: 'Developer tools — helpers for building and maintaining this.',
  config: 'Configuration — settings that change how the app behaves.',
  public: 'Static files served as-is — images, icons and the site shell.',
  static: 'Static files served as-is — images, fonts and other assets.',
  assets: 'Images, icons and other files the app shows.',
  styles: 'The look of the app — colours, spacing and typography.',
  css: 'The look of the app — colours, spacing and typography.',
  middleware: 'Code that runs before a request reaches its handler.',
  plugins: 'Add-ons — optional pieces that extend the app.',
  skills: 'Instructions that teach an agent how to do a specific job.',
  workflows: 'Automation — jobs that run on their own when code changes.',
  '.github': 'Automation and checks — what runs when code is pushed.',
  database: 'The data layer — tables, migrations and queries.',
  migrations: 'Database changes over time — each file is one step.',
  prisma: 'The database layer — schema and generated client.',
  infra: 'Infrastructure — how the app is deployed and hosted.',
  deploy: 'Deployment — how the app gets from code to a live site.',
  docker: 'Container setup — how the app runs in Docker.',
  cmd: 'Command-line entry points — one small program per folder.',
  internal: 'Private code — used only inside this project.',
  pkg: 'Reusable packages — libraries this project ships.',
  crates: 'Rust crates — the building blocks of this project.',
  android: 'The Android app.',
  ios: 'The iOS app.',
  web: 'The website.',
  backend: 'The backend — the server the app talks to.',
  frontend: 'The frontend — what runs in the browser.',
};

function partPurpose(dir: string): string {
  const key = dir.split('/').pop()?.toLowerCase() ?? dir;
  if (DIR_PURPOSE[key]) return DIR_PURPOSE[key];
  if (dir === '' || dir === '.') return 'The project root — setup, config and the front door of the repo.';
  return `Everything under ${dir} — ${humanize(key).toLowerCase()} for this project.`;
}

const SPECIAL_FILES: Record<string, string> = {
  'README.md': 'Start here — what this project is, and how to set it up.',
  'README': 'Start here — what this project is, and how to set it up.',
  'package.json': 'Project manifest — dependencies, scripts and metadata.',
  'LICENSE': 'The licence — what anyone is allowed to do with this code.',
  'LICENSE.md': 'The licence — what anyone is allowed to do with this code.',
  'CONTRIBUTING.md': 'How to contribute — the rules for sending changes.',
  'CHANGELOG.md': 'What changed in each release, newest first.',
  'Dockerfile': 'How to run this app in a container.',
  'docker-compose.yml': 'How to run the app and its services together locally.',
  'Makefile': 'Shortcuts — common jobs run with one command.',
  '.gitignore': 'Which files Git should ignore.',
  'tsconfig.json': 'TypeScript settings for this project.',
  'vite.config.ts': 'Build settings — how the app is bundled for the browser.',
  'next.config.js': 'Next.js settings for this project.',
  'tailwind.config.js': 'Design settings — colours, fonts and spacing.',
  'pyproject.toml': 'Python project settings — dependencies and tooling.',
  'requirements.txt': 'Python dependencies — the libraries this needs.',
  'go.mod': 'Go module — dependencies and the Go version.',
  'Cargo.toml': 'Rust project manifest — dependencies and metadata.',
  'Gemfile': 'Ruby dependencies.',
  'composer.json': 'PHP dependencies and project settings.',
};

function describeFile(f: AnalyzedFile, endpoint?: Endpoint): string {
  const base = f.name;
  if (SPECIAL_FILES[base]) return SPECIAL_FILES[base];
  if (endpoint) return `Serves ${endpoint.method} ${endpoint.path} — ${endpoint.purpose.toLowerCase()}`;
  const lower = base.toLowerCase();
  if (lower.includes('.test.') || lower.includes('.spec.') || lower.endsWith('_test.go') || lower.startsWith('test_')) {
    const subject = base.replace(/(\.test|\.spec|_test)/, '').replace(/\.[^.]+$/, '');
    return `Tests for ${humanize(subject) || 'this part'} — checks it still works.`;
  }
  if (f.dir.includes('routes') || f.dir.includes('api')) {
    return `Endpoint code — answers requests for ${f.dir.split('/').pop() ?? 'the app'}.`;
  }
  if (f.dir.includes('components') || /^[A-Z]/.test(base)) {
    return `Interface piece — the ${humanize(base.replace(/\.[^.]+$/, ''))} part of the screen.`;
  }
  if (f.dir.includes('pages') || f.dir.includes('screens') || f.dir.includes('views')) {
    return `A screen — the ${humanize(base.replace(/\.[^.]+$/, ''))} page.`;
  }
  if (base === 'index.ts' || base === 'index.tsx' || base === 'index.js' || base === '__init__.py') {
    return `Front door of ${f.dir || 'the project'} — re-exports what lives here.`;
  }
  if (base.startsWith('main.') || base.startsWith('app.') || base === 'index.html') {
    return 'Entry point — where the app starts running.';
  }
  if (lower.endsWith('.config.js') || lower.endsWith('.config.ts') || lower.endsWith('.config.mjs')) {
    return `Configuration for ${humanize(base.replace(/\.config\..+$/, ''))}.`;
  }
  if (f.language === 'Markdown') return `Notes about ${humanize(base.replace(/\.md$/, ''))}.`;
  return `A ${f.language} file in ${f.dir || 'the project root'}.`;
}

/* ------------------------------------------------------------------ */
/* Imports / exports (first 300 lines, cheap regexes)                  */
/* ------------------------------------------------------------------ */

function parseImportsExports(text: string, language: string): { imports: string[]; exports: string[] } {
  const imports = new Set<string>();
  const exports = new Set<string>();
  const lines = text.split('\n').slice(0, 300);
  for (const line of lines) {
    let m: RegExpExecArray | null;
    if (language === 'TypeScript' || language === 'JavaScript') {
      m = /import\s+(?:[\w*{}\s,]+from\s+)?['"]([^'"]+)['"]/.exec(line);
      if (m) imports.add(m[1]);
      m = /require\(\s*['"]([^'"]+)['"]\s*\)/.exec(line);
      if (m) imports.add(m[1]);
      m = /export\s+(?:default\s+)?(?:function|const|class|interface|type|enum)\s+(\w+)/.exec(line);
      if (m) exports.add(m[1]);
      m = /export\s*\{([^}]+)\}/.exec(line);
      if (m) m[1].split(',').forEach((s) => exports.add(s.trim().split(/\s+as\s+/)[0].trim()));
    } else if (language === 'Python') {
      m = /^\s*(?:from\s+([\w.]+)\s+import|import\s+([\w.]+))/.exec(line);
      if (m) imports.add(m[1] ?? m[2]);
      m = /^(?:def|class)\s+(\w+)/.exec(line);
      if (m) exports.add(m[1]);
    } else if (language === 'Go') {
      m = /^\s*"([\w./-]+)"/.exec(line);
      if (m && line.includes('"')) imports.add(m[1]);
      m = /^func\s+(?:\([^)]+\)\s+)?([A-Z]\w*)/.exec(line);
      if (m) exports.add(m[1]);
    }
  }
  return { imports: [...imports].slice(0, 12), exports: [...exports].slice(0, 12) };
}

/* ------------------------------------------------------------------ */
/* Endpoint detection                                                  */
/* ------------------------------------------------------------------ */

const ENDPOINT_PATTERNS: { re: RegExp; kind: string }[] = [
  { re: /(?:app|router)\.(get|post|put|patch|delete|all)\s*\(\s*['"`]([^'"`]+)['"`]/g, kind: 'js' },
  { re: /@(?:app|router)\.(get|post|put|patch|delete)\(\s*['"]([^'"]+)['"]/g, kind: 'py' },
  { re: /@blueprint\.route\(\s*['"]([^'"]+)['"]/g, kind: 'py-route' },
  { re: /path\(\s*['"]([^'"]+)['"]/g, kind: 'django' },
  { re: /(?:mux\.)?HandleFunc\(\s*"(?:(GET|POST|PUT|PATCH|DELETE)\s+)?([^"]+)"/g, kind: 'go' },
];

function purposeForEndpoint(method: string, path: string): string {
  const clean = path.replace(/^\//, '').replace(/[{}:][\w-]+/g, 'an item').replace(/[-_]/g, ' ');
  const parts = clean.split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? 'the app';
  switch (method) {
    case 'GET': return `Reads ${last}`;
    case 'POST': return `Creates ${last}`;
    case 'PUT':
    case 'PATCH': return `Updates ${last}`;
    case 'DELETE': return `Deletes ${last}`;
    default: return `Handles ${last}`;
  }
}

function detectEndpoints(files: { path: string; text: string }[]): Endpoint[] {
  const out: Endpoint[] = [];
  const seen = new Set<string>();
  for (const { path, text } of files) {
    for (const { re, kind } of ENDPOINT_PATTERNS) {
      re.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = re.exec(text)) !== null && out.length < 120) {
        let method = 'GET';
        let p = '';
        if (kind === 'js' || kind === 'py') { method = m[1].toUpperCase(); p = m[2]; }
        else if (kind === 'py-route') { method = 'ANY'; p = m[1]; }
        else if (kind === 'django') { method = 'ANY'; p = `/${m[1]}`; }
        else if (kind === 'go') { method = (m[1] ?? 'ANY').toUpperCase(); p = m[2]; }
        if (!p.startsWith('/')) p = `/${p}`;
        const key = `${method} ${p}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ method, path: p, file: path, purpose: purposeForEndpoint(method, p) });
      }
    }
    // Next.js App Router route handlers: app/**/route.ts exports GET/POST…
    if (/\/app\//.test(path) && /route\.(ts|js)$/.test(path)) {
      const urlPath = '/' + path.replace(/^.*?\/app\//, '').replace(/\/route\.(ts|js)$/, '').replace(/\[([^\]]+)\]/g, ':$1');
      for (const method of ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']) {
        if (new RegExp(`export\\s+(?:async\\s+)?function\\s+${method}\\b`).test(text)) {
          const key = `${method} ${urlPath}`;
          if (!seen.has(key)) {
            seen.add(key);
            out.push({ method, path: urlPath === '/' ? '/' : urlPath, file: path, purpose: purposeForEndpoint(method, urlPath) });
          }
        }
      }
    }
    // Next.js Pages API routes: pages/api/**.ts
    if (/\/pages\/api\//.test(path) || path.startsWith('pages/api/')) {
      const urlPath = '/api/' + path.replace(/^.*?pages\/api\//, '').replace(/\.(ts|js)$/, '').replace(/\[([^\]]+)\]/g, ':$1').replace(/\/index$/, '');
      const key = `ANY ${urlPath}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push({ method: 'ANY', path: urlPath, file: path, purpose: purposeForEndpoint('GET', urlPath) });
      }
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path) || a.method.localeCompare(b.method));
}

/* ------------------------------------------------------------------ */
/* Framework detection                                                 */
/* ------------------------------------------------------------------ */

function detectFrameworks(manifests: Record<string, string>, paths: string[]): string[] {
  const found = new Set<string>();
  const pkg = manifests['package.json'];
  if (pkg) {
    try {
      const j = JSON.parse(pkg);
      const deps = { ...(j.dependencies ?? {}), ...(j.devDependencies ?? {}) };
      const has = (...names: string[]) => names.some((n) => n in deps);
      if (has('react')) found.add('React');
      if (has('next')) found.add('Next.js');
      if (has('vue')) found.add('Vue');
      if (has('svelte')) found.add('Svelte');
      if (has('express')) found.add('Express');
      if (has('fastify')) found.add('Fastify');
      if (has('koa')) found.add('Koa');
      if (has('hono')) found.add('Hono');
      if (has('@nestjs/core')) found.add('NestJS');
      if (has('@angular/core')) found.add('Angular');
      if (has('astro')) found.add('Astro');
      if (has('remix', '@remix-run/react')) found.add('Remix');
      if (has('electron')) found.add('Electron');
      if (has('tailwindcss')) found.add('Tailwind CSS');
      if (has('vite')) found.add('Vite');
      if (has('typescript')) found.add('TypeScript');
    } catch {
      /* ignore malformed package.json */
    }
  }
  const req = manifests['requirements.txt'] ?? '';
  const pyproject = manifests['pyproject.toml'] ?? '';
  const py = `${req}\n${pyproject}`.toLowerCase();
  if (/django/.test(py)) found.add('Django');
  if (/flask/.test(py)) found.add('Flask');
  if (/fastapi/.test(py)) found.add('FastAPI');
  if (/streamlit/.test(py)) found.add('Streamlit');
  if (paths.some((p) => p.endsWith('go.mod'))) found.add('Go');
  if (paths.some((p) => p.endsWith('Cargo.toml'))) found.add('Rust');
  if ((manifests['Gemfile'] ?? '').toLowerCase().includes('rails')) found.add('Rails');
  if ((manifests['composer.json'] ?? '').toLowerCase().includes('laravel/framework')) found.add('Laravel');
  if (paths.some((p) => /androidmanifest\.xml$/i.test(p))) found.add('Android');
  if (paths.some((p) => /\.xcodeproj|\.swift$/.test(p))) found.add('iOS');
  return [...found];
}

/* ------------------------------------------------------------------ */
/* Main analysis                                                       */
/* ------------------------------------------------------------------ */

export interface AnalyzeInput {
  meta: RepoMeta;
  entries: TreeEntry[];
  truncated: boolean;
  contents: Map<string, string>;
}

export function analyzeRepo(input: AnalyzeInput): RepoMap {
  const { meta, entries, truncated } = input;
  const blobs = entries.filter((e) => e.type === 'blob');
  const kept = blobs.filter((b) => !isSkipped(b.path));
  const skippedCount = blobs.length - kept.length;
  const totalSize = kept.reduce((s, b) => s + (b.size ?? 0), 0);

  // Languages
  const langMap = new Map<string, { files: number; bytes: number }>();
  for (const b of kept) {
    const lang = languageOf(b.path);
    if (lang === 'Other' || lang === 'JSON' || lang === 'Markdown') continue;
    const cur = langMap.get(lang) ?? { files: 0, bytes: 0 };
    cur.files += 1;
    cur.bytes += b.size ?? 0;
    langMap.set(lang, cur);
  }
  const langTotal = [...langMap.values()].reduce((s, l) => s + l.bytes, 0) || 1;
  const languages = [...langMap.entries()]
    .map(([name, v]) => ({ name, files: v.files, bytes: v.bytes, pct: Math.round((v.bytes / langTotal) * 100) }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 8);

  // Manifests for framework detection
  const manifests: Record<string, string> = {};
  // Manifests for framework detection — only real project manifests, never
  // test fixtures or examples (a Laravel fixture does not make the repo Laravel).
  const MANIFEST_EXCLUDE = new Set(['tests', 'test', 'fixtures', 'fixture', 'examples', 'example', 'demo', 'docs']);
  const isManifestCandidate = (p: string) => {
    const segs = p.split('/');
    return segs.length <= 2 && !segs.some((s) => MANIFEST_EXCLUDE.has(s));
  };
  for (const name of ['package.json', 'requirements.txt', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'composer.json', 'Gemfile']) {
    const hit = kept.find((b) => b.path === name || (b.path.endsWith(`/${name}`) && isManifestCandidate(b.path)));
    if (hit && input.contents.has(hit.path)) manifests[name] = input.contents.get(hit.path) ?? '';
  }
  const frameworks = detectFrameworks(
    manifests,
    kept.map((b) => b.path).filter((p) => isManifestCandidate(p)),
  );

  // Analyzed files
  const endpointByFile = new Map<string, Endpoint>();
  const contentsArr = [...input.contents.entries()].map(([path, text]) => ({ path, text }));
  const endpoints = detectEndpoints(contentsArr);
  for (const ep of endpoints) if (!endpointByFile.has(ep.file)) endpointByFile.set(ep.file, ep);

  const files: AnalyzedFile[] = kept.map((b) => {
    const name = b.path.split('/').pop() ?? b.path;
    const dir = b.path.includes('/') ? b.path.slice(0, b.path.lastIndexOf('/')) : '';
    const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
    const language = languageOf(b.path);
    const text = input.contents.get(b.path);
    const { imports, exports } = text ? parseImportsExports(text, language) : { imports: [], exports: [] };
    const f: AnalyzedFile = {
      path: b.path, name, dir, ext, language, size: b.size ?? 0,
      description: '', imports, exports,
    };
    f.description = describeFile(f, endpointByFile.get(b.path));
    return f;
  });

  // Parts: group by first directory segment
  const partMap = new Map<string, AnalyzedFile[]>();
  for (const f of files) {
    const top = f.dir === '' ? '' : f.dir.split('/')[0];
    const arr = partMap.get(top) ?? [];
    arr.push(f);
    partMap.set(top, arr);
  }
  const parts: Part[] = [...partMap.entries()]
    .map(([dir, fs]) => ({
      id: dir === '' ? 'root' : dir,
      name: dir === '' ? 'Project root' : humanize(dir),
      purpose: partPurpose(dir),
      paths: [...new Set(fs.map((f) => f.dir))],
      files: fs.sort((a, b) => a.path.localeCompare(b.path)),
    }))
    .sort((a, b) => b.files.length - a.files.length);

  // Where to start
  const startHere: StartHereItem[] = [];
  const byPath = (p: string) => files.find((f) => f.path === p);
  const readme = byPath('README.md') ?? byPath('README');
  if (readme) startHere.push({ path: readme.path, reason: 'What this project is, and how to set it up.' });
  const manifest = byPath('package.json') ?? byPath('pyproject.toml') ?? byPath('go.mod') ?? byPath('Cargo.toml');
  if (manifest) startHere.push({ path: manifest.path, reason: 'Dependencies and scripts — what the project is built from.' });
  const entryNames = ['src/index.ts', 'src/index.tsx', 'src/main.ts', 'src/main.tsx', 'src/index.js', 'src/main.js', 'src/App.tsx', 'src/App.ts', 'main.py', 'app.py', 'src/main.py', 'manage.py', 'index.html', 'src/main.rs', 'cmd/server/main.go'];
  for (const p of entryNames) {
    const f = byPath(p);
    if (f) { startHere.push({ path: f.path, reason: 'Entry point — where the app starts running.' }); break; }
  }
  const routeFile = files.find((f) => /routes?|router/i.test(f.path) && CODE_EXTS.has(f.ext));
  if (routeFile) startHere.push({ path: routeFile.path, reason: 'Where the URLs are wired up.' });
  const biggestPart = parts.find(
    (p) => p.id !== 'root' && !/test/i.test(p.id) && p.files.some((f) => CODE_EXTS.has(f.ext) && !/test|spec/i.test(f.path)),
  );
  if (biggestPart && biggestPart.files.length > 0) {
    const first = biggestPart.files.find((f) => CODE_EXTS.has(f.ext) && !/test|spec/i.test(f.path));
    if (first && !startHere.some((s) => s.path === first.path)) {
      startHere.push({ path: first.path, reason: `Inside ${biggestPart.name} — the biggest part of the project.` });
    }
  }

  // Health notes
  const health: HealthNote[] = [];
  const has = (pred: (f: AnalyzedFile) => boolean) => files.some(pred);
  if (!readme) health.push({ level: 'warn', title: 'No README', detail: 'There is no README file — a new visitor has nothing to read first.' });
  else health.push({ level: 'good', title: 'README present', detail: 'The project explains itself up front.' });
  if (!has((f) => /^LICENSE/i.test(f.name))) health.push({ level: 'warn', title: 'No licence', detail: 'No LICENCE file found — others cannot safely reuse this code.' });
  if (has((f) => /test|spec/i.test(f.path))) health.push({ level: 'good', title: 'Tests exist', detail: `${files.filter((f) => /test|spec/i.test(f.path)).length} test files found.` });
  else health.push({ level: 'warn', title: 'No tests found', detail: 'No test files detected — changes cannot be checked automatically.' });
  if (has((f) => f.path.startsWith('.github/workflows/'))) health.push({ level: 'good', title: 'CI configured', detail: 'GitHub Actions workflows run checks on every change.' });
  else health.push({ level: 'info', title: 'No CI workflows', detail: 'No .github/workflows found — nothing checks the code automatically.' });
  const large = files.filter((f) => f.size > 500_000).sort((a, b) => b.size - a.size).slice(0, 3);
  if (large.length > 0) {
    health.push({ level: 'warn', title: `${large.length} large file${large.length > 1 ? 's' : ''} over 500 KB`, detail: large.map((f) => `${f.path} (${Math.round(f.size / 1024)} KB)`).join(', ') });
  }
  if (has((f) => f.name === '.env' || f.name.startsWith('.env.'))) {
    health.push({ level: 'warn', title: 'A .env file is tracked', detail: 'Check it holds no real secrets — only its location is shown here, never its contents.' });
  }
  if (truncated) {
    health.push({ level: 'info', title: 'Very large repo', detail: 'GitHub truncated the file list — the map covers the first part of the tree.' });
  }

  const readmeText = readme ? input.contents.get(readme.path) ?? null : null;
  const readmeExcerpt = readmeText
    ? readmeText
        .replace(/<[^>]+>/g, ' ')
        .replace(/!?\[[^\]]*\]\([^)]+\)/g, '')
        .replace(/\]\([^)]+\)/g, '')
        .replace(/https?:\/\/\S+/g, '')
        .replace(/\*\*/g, '')
        .replace(/^#+\s*/gm, '')
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith('[!') && !l.startsWith('<'))
        .slice(0, 4)
        .join(' ')
        .replace(/\s+/g, ' ')
        .slice(0, 400)
    : null;

  return {
    meta, totalFiles: kept.length, totalSize, skippedCount, truncated,
    languages, frameworks, parts, files, endpoints, health, startHere, readmeExcerpt,
  };
}

/** Which files are worth fetching content for (bounded, cheapest first). */
export function pickFilesToFetch(entries: TreeEntry[]): string[] {
  const blobs = entries.filter((e) => e.type === 'blob' && !isSkipped(e.path));
  const score = (p: string): number => {
    const base = p.split('/').pop() ?? '';
    if (['package.json', 'README.md', 'pyproject.toml', 'go.mod', 'Cargo.toml', 'requirements.txt', 'composer.json'].includes(base)) return 0;
    if (/route|router|urls?\.py|app\.py|main\.py|server\.(ts|js)/i.test(p)) return 1;
    if (/src\/(index|main|app)\.(ts|tsx|js|jsx)/i.test(p)) return 2;
    if (/\.(ts|tsx|js|jsx|py|go)$/.test(p) && !/test|spec/i.test(p)) return 3;
    return 4;
  };
  return blobs
    .filter((b) => (b.size ?? 0) < 120_000)
    .sort((a, b) => score(a.path) - score(b.path) || a.path.localeCompare(b.path))
    .slice(0, 120)
    .map((b) => b.path);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
