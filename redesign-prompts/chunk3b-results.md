# Chunk 3b — UI redesign, part 2: results sections + graph polish

You are editing the RepoMap Web app in ~/workspace/repo-map (React + Vite +
TypeScript + Tailwind, static, no backend). The shell redesign from chunk 3a
(header, hero, tokens in `src/index.css`) already exists — read the current
files first and match that design system exactly (same radius, borders, type
scale, Lucide icon set, one blue accent, no gradients).

Installed and ready: `lucide-react`. No other new dependencies.

## Work — ONLY these two files

1. **Overview (`src/components/Results.tsx`):** turn the stats into a clean
   stat row (stars / forks / files / size / licence / main language as
   labelled stats with Lucide icons — `Star`, `GitFork`, `FileCode2`,
   `Scale`, `Code2` — not a chip soup). Language bar: slimmer, with a tidy
   legend. README excerpt: a proper quote card. Copy summary / Copy share
   link: primary + ghost buttons with icons and a "Copied" confirmation
   state.
2. **Where-to-start (`Results.tsx`):** a numbered vertical timeline with a
   connecting line, each step a file path (mono, accent) + reason. Same
   files and order as the graph tour.
3. **Explorer / Endpoints / Health (`Results.tsx`):** refined list rows
   (hover states, selected state with accent left border), a cleaner
   endpoints table (method chips coloured by verb: GET green, POST blue,
   PUT/PATCH amber, DELETE red — muted tones), health notes with Lucide
   status icons (`CheckCircle2` good / `AlertTriangle` warn / `Info` info)
   and clear hierarchy. Keep every feature: search, language filter, file
   detail (imports/exports, View on GitHub), copy summary, share link.
   Replace ALL unicode glyphs (★ ⑂ ✓ ! − +) with Lucide icons. No emoji.
4. **GraphMap polish (`src/components/GraphMap.tsx`):** restyle node cards,
   edges, controls, minimap, legend, tour bar and detail panel to the same
   design system (same radius, borders, type scale, icon set). Dark canvas:
   fine grid, crisp cards, thin lines. Light canvas: faint dots, clean
   cards. Do NOT change the layout math, the graph data, or any interaction
   (pan/zoom, click-to-focus, hover highlight, search, tour, minimap,
   controls, detail panel all stay working).

## Hard constraints

- Every v1 feature keeps working exactly as it does: overview,
  Where-to-start, Map/List tabs, explorer search/filter, endpoint detection,
  health notes, copy summary, shareable `?repo=` link, optional token +
  rate-limit display, light/dark toggle. Do NOT remove or break any feature.
  Do NOT add placeholder content. Do NOT use unslop. Do NOT add "AI-powered"
  wording, gradients, purple/cyan heroes, sparkle/robot imagery.
- Touch ONLY `src/components/Results.tsx` and `src/components/GraphMap.tsx`.
  Do NOT touch the data layer (`analyze.ts`, `graph.ts`) or `App.tsx`.
- Mobile 360px: no horizontal overflow anywhere, no text clipped, tap
  targets ≥ 44px, stacked cards, the map usable with one thumb. Desktop
  1280px: generous whitespace, clear hierarchy.

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until
it passes clean. Do not run any dev server. Report the exact files you
changed and the build result. Keep your reply short.
