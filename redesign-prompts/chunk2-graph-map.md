# Chunk 2 — The visual graph: React Flow map + Map/List tabs + guided tour

You are editing the RepoMap Web app in ~/workspace/repo-map (React + Vite +
TypeScript + Tailwind, static, no backend). The graph data layer from chunk 1
already exists: `src/lib/graph.ts` (or in `analyze.ts`) exports
`buildGraph(map: RepoMap): RepoGraph` with `nodes: GraphNode[]`
(`id` = file path, `partId`, `label`, `description`, `language`, `size`,
`kind: 'entry' | 'hub' | 'big' | 'file'`, `degree`, `inDegree`, `outDegree`,
`isEndpoint`, `isLarge`) and `edges: GraphEdge[]` (`from`, `to`), plus
`partOrder`. Read those files first and use exactly that data — do not
re-derive edges yourself.

Installed and ready to use: `@xyflow/react` (React Flow), `dagre`,
`lucide-react`. No other new dependencies.

## Work

### 1. New component `src/components/GraphMap.tsx`

Props: `{ map: RepoMap; graph: RepoGraph; dark: boolean }`.

A real interactive dependency graph, the centrepiece of the product:

- **Library:** React Flow (`@xyflow/react`). Use `ReactFlow`, `Background`
  (fine grid/lines), `Controls`, `MiniMap`, `useNodesState`,
  `useEdgesState`, `MarkerType`. `fitView` on load.
- **Layout:** deterministic, computed with `dagre`. Entry-point node(s) at
  the top/centre. Parts must read as visual clusters: implement parts as
  React Flow parent (group) nodes with their file nodes inside, and lay out
  each part's files with dagre inside the group, then arrange the groups
  themselves in a clean flow (entry part first, biggest parts prominent).
  If nested dagre proves impractical, fall back to a two-stage layout you
  compute yourself (dagre per part + grid of parts) — but parts MUST be
  visible clusters, not a flat soup of nodes. Node cap is already 150 from
  the data layer; edge cap 400 (keep highest-degree edges first).
- **Node cards (custom node type):** file name in mono, one-line description
  clamped to 2 lines, a language colour dot, and small badges:
  `ENTRY` (accent fill), `HUB` (most-connected), `BIG` (large file),
  endpoint method chip when `isEndpoint`. Hub nodes render larger and with
  a stronger border. Entry nodes get a distinct accent ring.
- **Edges:** thin, muted lines with arrow markers. Edges of the selected /
  hovered node animate (animated dashed) and are accent-coloured; all other
  edges dim.
- **Interaction:**
  - Pan + zoom (wheel, pinch on touch, drag). Tap/click a node: centre it,
    highlight it and all its connections, dim the rest, and open its detail
    panel.
  - Hover a node: highlight its connected nodes and edges, dim the rest.
  - Click empty canvas: clear selection/highlight.
  - Search box above the map: typing filters/highlights matching nodes
    (by file name or description); Enter jumps to the first match and
    centres it, highlighting its connection path.
  - Minimap (bottom-right) and zoom controls. A "Fit view" button.
  - A parts legend: one row per part (name + file count + colour dot);
    clicking a part highlights all its nodes.
- **Detail panel:** when a node is selected, show its file name, description,
  language, size, in/out degree, imports (resolved file names) and exports,
  a "View on GitHub" link, and any health flag for that file (large file
  warning). On desktop this is a side panel beside the map; on mobile it
  stacks below the map. Never a modal that blocks the map.
- **Guided tour (Where to start):** a tour bar under the map header:
  "Start here — step 1 of N" showing the current `map.startHere` file and
  its reason, with Prev / Next buttons and a progress indicator. Clicking
  Next centres and highlights that step's node on the map. A "Start tour"
  button begins at step 1. The tour must work even if a startHere file is
  not a graph node (then show the step but centre the nearest part).
- **Canvas look:** dark mode = very dark canvas with a fine grid and thin
  lines; light mode = clean light canvas with a faint dotted grid. One
  restrained blue accent (`#0969da` light / `#2f81f7` dark, already the app
  tokens). No gradients, no purple/cyan, no sparkle, no robot imagery.
- **Mobile (360px):** the map container is full-width, ~68vh tall, touch
  works (pinch-zoom, drag, tap). Controls are thumb-reachable. Nothing
  overflows horizontally. The search box and tour bar stack cleanly.
- **Performance:** memoise node/edge construction; do not re-run dagre on
  every render. Handle the empty-graph case gracefully (a repo with no
  resolved edges still shows its part clusters and files).

### 2. Map/List tabs in `src/components/Results.tsx`

- Add a tab bar above the map section: **Map** (default, the star) and
  **List**. The Map tab renders `<GraphMap map={map} graph={buildGraph(map)} dark={...} />`.
- The List tab renders the EXISTING grouped-parts list view exactly as it
  is today (same markup, same expand/collapse, same file click behaviour) —
  just moved under the tab. Do not redesign the list in this chunk.
- `Results` needs the current theme: accept a `dark: boolean` prop from
  `App` (wire it through in `App.tsx` — `App` already tracks `theme`).
- Everything else in Results (overview, Where-to-start section, explorer,
  endpoints, health) stays exactly as it is in this chunk — chunk 3
  redesigns their visuals.

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until it
passes clean. Do not run any dev server. Report the exact files you changed
and the build result.
