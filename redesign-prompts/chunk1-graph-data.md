# Chunk 1 — Graph data layer: real import edges for the visual map

You are editing the RepoMap Web app in ~/workspace/repo-map (React + Vite +
TypeScript + Tailwind, static, no backend). Read the files listed as editable
first. Do NOT change any UI in this chunk — this chunk is data only.

## Context

`src/lib/analyze.ts` already analyses a repo into a `RepoMap`: `parts`
(grouped by first directory), `files: AnalyzedFile[]` (each with `path`,
`name`, `dir`, `language`, `size`, `description`, `imports: string[]` —
RAW import specifiers as written in the code, up to 12 per file — and
`exports: string[]`), `endpoints`, `health`, `startHere`, `languages`,
`frameworks`, `meta`. `pickFilesToFetch` currently caps fetched file
contents at 40 files; imports/exports are only parsed for fetched files.

The product is getting a real interactive visual graph (next chunk): nodes =
parts and files, edges = REAL import/dependency relationships. This chunk
builds the graph data. The graph must be honest: edges only where an import
actually resolves to a file in the repo.

## Work

1. **Resolve imports to real files.** Add a resolver in `src/lib/analyze.ts`
   (or a new file `src/lib/graph.ts` imported by analyze.ts — your choice,
   keep it tidy) that maps a raw import specifier to a repo file path:
   - Only relative imports (`./`, `../`) and the common `@/` alias (which
     means the repo `src/` root). Drop bare package imports (`react`,
     `lodash`, `express`, …) — they are external, not edges.
   - Resolve against the full list of repo file paths (not just fetched
     files): try the specifier as-is, then with extensions
     `.ts .tsx .js .jsx .mjs .cjs .py .go .rs .java .kt .vue .svelte .css`
     appended, then `<specifier>/index.<ext>` for each extension.
   - Python: `from x.y import z` / `import x.y` — map dotted module paths to
     file paths (`x/y.py`, `x/y/__init__.py`, `x.py`).
   - Go: only resolve imports that start with the repo's own module path
     (from `go.mod` if fetched); drop everything else.
   - The resolver must be pure and total: unknown specifiers resolve to
     `null`, never throw.

2. **Build the graph.** Export from the graph module:
   ```ts
   export interface GraphNode {
     id: string;          // file path
     partId: string;
     label: string;       // file name
     description: string;
     language: string;
     size: number;
     kind: 'entry' | 'hub' | 'big' | 'file';
     degree: number;      // in + out edges
     inDegree: number;
     outDegree: number;
     isEndpoint: boolean; // serves an HTTP endpoint
     isLarge: boolean;    // size > 500_000
   }
   export interface GraphEdge { from: string; to: string; }
   export interface RepoGraph {
     nodes: GraphNode[];
     edges: GraphEdge[];
     partOrder: string[]; // part ids, biggest first (same order as map.parts)
   }
   export function buildGraph(map: RepoMap): RepoGraph;
   ```
   - Nodes: one per analyzed file that is either (a) a fetched file with
     parsed imports/exports, (b) in `startHere`, (c) an endpoint file, or
     (d) the target of a resolved edge. Cap nodes at 150: if there are more,
     keep all of (b) and (c), then the highest-degree files, then the largest
     files, then the rest in path order. Every edge endpoint must be a node.
   - Edges: one per resolved import between two nodes. De-duplicate.
     Never create an edge to a file that is not a node.
   - `kind`: `entry` if the file is in `startHere` (entry point); else
     `hub` if it is in the top 5 by degree (and degree >= 3); else `big`
     if `size > 500_000` or it is in the top 3 by size among nodes; else
     `file`. Entry wins over hub, hub wins over big.
   - `partOrder`: the part ids in `map.parts` order.

3. **Richer edges — fetch more files.** `pickFilesToFetch` currently caps at
   40 files, which starves the graph. Raise the cap to 120, keeping the
   existing scoring order (manifests first, then routes/entry, then code)
   and the `< 120_000` byte filter. Raw file fetches go to
   `raw.githubusercontent.com` and do NOT burn the GitHub API quota, so
   this is cheap. Keep the batch fetching in `App.tsx` untouched (it already
   fetches in batches of 8).

4. **Do not break anything.** Every existing export of `analyze.ts` keeps
   its name and shape (`analyzeRepo`, `pickFilesToFetch`, `formatBytes`,
   `LANG_COLORS`, all interfaces). `Results.tsx` and `App.tsx` must keep
   compiling unchanged. No new dependencies. No UI changes in this chunk.

## Verify

After your edits, run `npm run build` in the repo root. If it fails, fix it
until it passes clean. Do not run any dev server. Report the exact files you
changed and the build result.
