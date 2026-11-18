# Fix chunk 2 — three remaining @xyflow/react 13.0.2 errors in GraphMap.tsx

You are editing ONLY `src/components/GraphMap.tsx` in ~/workspace/repo-map.
`npm run build` still fails with exactly these errors. Fix each one with
the exact replacement given below — do not rework anything else:

1. Line ~437 — `<Background variant={dark ? 'dots' : 'lines'} ... />`:
   `BackgroundVariant` must be imported from `@xyflow/react` and used as
   `variant={dark ? BackgroundVariant.Dots : BackgroundVariant.Lines}`.
   Add `BackgroundVariant` to the existing `@xyflow/react` import.

2. Line ~443 — `<MiniMap panning={false} position="bottom-right" ... />`:
   v13 has no `panning` prop. Change it to `pannable={false}`.

3. Line ~529 — `reactFlowInstance.centerOn(partNodes[0].path, { duration: 300 })`:
   v13 has no `centerOn`. Use the SAME centring approach already used at
   the other call sites in this file (the ones fixed in the previous round
   — look at how they centre on a node, e.g. `setCenter` with the node's
   position or `fitView({ nodes: [...] })`) and apply it here.

4. If `fitViewOnInit={false}` is still present on the `<ReactFlow>` element,
   remove it (v13 uses the `fitView` prop instead).

Rules: touch ONLY `src/components/GraphMap.tsx`. Do not change behaviour,
layout, features, or any other file.

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until
it passes clean. Do not run any dev server. Report the build result.
