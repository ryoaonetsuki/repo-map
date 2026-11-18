# Fix chunk — make GraphMap.tsx compile against @xyflow/react 13.0.2

You are editing the RepoMap Web app in ~/workspace/repo-map. The installed
`@xyflow/react` version is **13.0.2** (check
`node_modules/@xyflow/react/dist/` types if you are unsure of an API — do
not guess from v11 docs). `npm run build` currently fails ONLY in
`src/components/GraphMap.tsx` with these TypeScript errors — fix all of
them, changing nothing else about the component's behaviour:

- `TS1484`: `Node` and `Edge` are types — import them with `import type`
  (the project uses `verbatimModuleSyntax`).
- `TS6133` / `TS6196`: remove unused declarations — `Position`,
  `GraphEdge`, `AnalyzedFile`, `FileNode`, `highlightedIds`, `onTourClose`
  (delete them, or use them if they belong in the logic — deleting is fine).
- `TS2561`: group/parent nodes use `parentId`, not `parentNode`.
- `TS2339`: `ReactFlowInstance` has no `centerOn` — use the v13 way to
  centre on a node (e.g. `setCenter(x, y, { zoom, duration })` with the
  node's position, or `fitView({ nodes: [node], ... })`). Fix all four
  call sites (lines ~285, ~311, ~337, ~529).
- `TS2322` on `<ReactFlow>`: `fitViewOnInit` does not exist in v13 — use
  the v13 prop (`fitView`).
- `TS2322` on `<Background>`: `variant` accepts `BackgroundVariant`
  (import it from `@xyflow/react` and use `BackgroundVariant.Dots` /
  `BackgroundVariant.Lines`), not the strings `"dots"` / `"lines"`.
- `TS2322` on `<MiniMap>`: there is no `panning` prop in v13 — use the
  v13 prop name (`pannable`).

Rules: touch ONLY `src/components/GraphMap.tsx`. Do not change the graph
data layer, the layout, the features, or any other file. Keep every
feature working (pan/zoom, click-to-focus, hover highlight, search, tour,
minimap, controls, detail panel).

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until
it passes clean. Do not run any dev server. Report the build result.
