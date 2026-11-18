# Chunk 3 — Full professional UI redesign (mobile-first, light + dark)

You are editing the RepoMap Web app in ~/workspace/repo-map (React + Vite +
TypeScript + Tailwind, static, no backend). The visual graph from chunk 2
already exists (`src/components/GraphMap.tsx`, React Flow). Read the current
files first. Your job is the VISUAL redesign of everything — make this look
like a polished Linear/GitHub-grade product on both 360px mobile and 1280px
desktop, in both light and dark mode.

Installed and ready to use: `lucide-react` (icons), `@xyflow/react`,
`dagre`. No other new dependencies.

## Design system (apply everywhere)

- **shadcn/ui-style components:** consistent 8px radius scale, hairline
  borders (`border-line`), solid surfaces (no glass, no gradients), subtle
  shadows only (`0 1px 2px` range), clear focus rings (accent, 2px).
- **Typography:** Inter/system stack (already in tokens). Strong type scale:
  hero 40–56px tight tracking, section titles 20–24px semibold, body
  15–16px relaxed, mono only for file paths / code. No cramped text.
- **Icons:** Lucide icons everywhere (`Star`, `GitFork`, `FileCode2`,
  `FolderGit2`, `Search`, `Sun`, `Moon`, `Copy`, `Share2`, `CheckCircle2`,
  `AlertTriangle`, `Info`, `Map`, `List`, `Play`, `ChevronRight`,
  `ArrowRight`, …). Replace ALL unicode glyphs in the UI (★ ⑂ ✓ ! − +)
  with Lucide icons. No emoji anywhere.
- **Colour:** one restrained blue accent (`#0969da` light / `#2f81f7` dark,
  already the app tokens). Neutrals only otherwise. Refine the dark
  palette in `src/index.css`: near-black page (`#0b0e13`-ish), panels
  (`#12161d`-ish), muted text with real contrast (WCAG AA on panels).
  Light mode: clean white page, `#f6f8fa` surfaces. No gradients, no
  purple/cyan, no sparkle/robot imagery, no "AI-powered" wording anywhere.
- **Spacing:** generous whitespace on desktop (`max-w-6xl`, section gaps
  40–64px), tight but breathable on mobile. Consistent 8/16/24px rhythm.

## Work, screen by screen

1. **`src/index.css`:** refine the token set (light + dark) as above; add
   reusable component classes if useful (`.btn-primary`, `.btn-ghost`,
   `.card`, `.input`, `.badge`) — but keep Tailwind utilities as the main
   tool. Keep the `.panel` and `.chip` classes working (Results uses them)
   or update their call sites consistently.
2. **Header (`App.tsx`):** sticky top header, solid background with a
   hairline bottom border. Refined logo mark (keep the map-pin/list motif,
   cleaner geometry), wordmark "RepoMap" + muted "Web". Nav: How it works,
   GitHub (with `Github` icon — lucide has one), theme toggle as an icon
   button (Sun/Moon) with an accessible label. On mobile the header stays
   one clean row, no wrapping, no overflow.
3. **Hero + repo input (`App.tsx`):** stronger hierarchy — a small eyebrow
   badge ("Free forever · No signup · No API key"), the headline, one tight
   sub-line, then the input as a large composed control (search icon inside,
   clear button when text is present, big primary button). On mobile the
   input and button stack full-width with 48px tap targets and the input
   stays thumb-reachable. Example repos become refined chips with a
   "Try one:" label. Token field: a proper disclosure with a `KeyRound`
   icon, the rate-limit line as a small status row with a `Gauge` icon.
   Loading state: a proper progress panel (spinner + current step + a thin
   progress feel). Error state: a clear alert card with an icon and the
   "Try the demo repo" action.
4. **Overview (`Results.tsx`):** turn the stats into a clean stat row
   (stars / forks / files / size / licence / main language as labelled
   stats with icons, not a chip soup). Language bar: slimmer, with a tidy
   legend. README excerpt: a proper quote card. Copy summary / Copy share
   link: primary + ghost buttons with icons and a "Copied" confirmation
   state.
5. **Where-to-start (`Results.tsx`):** a numbered vertical timeline with
   connecting line, each step a file path (mono, accent) + reason. This
   section and the graph tour (chunk 2) must agree — same files, same order.
6. **Explorer / Endpoints / Health (`Results.tsx`):** refined list rows
   (hover states, selected state with accent left border), a cleaner
   endpoints table (method chips coloured by verb: GET green, POST blue,
   PUT/PATCH amber, DELETE red — muted tones), health notes with Lucide
   status icons (`CheckCircle2` good / `AlertTriangle` warn / `Info` info)
   and clear hierarchy. Keep every feature: search, language filter, file
   detail (imports/exports, View on GitHub), copy summary, share link.
7. **GraphMap polish (`GraphMap.tsx`):** restyle node cards, edges,
   controls, minimap, legend, tour bar and detail panel to the same design
   system (same radius, borders, type scale, icon set). Dark canvas: fine
   grid, crisp cards, thin lines. Light canvas: faint dots, clean cards.
8. **How-it-works + footer (`App.tsx`):** three steps as refined cards with
   numbered Lucide icons; the two explainer cards tightened; footer as a
   clean single row (brand line + links), same on every state.
9. **Mobile 360px (verify mentally as you write):** no horizontal overflow
   anywhere, no text clipped, tap targets ≥ 44px, stacked cards, the map
   usable with one thumb. Desktop 1280px: generous whitespace, clear
   hierarchy, nothing stretched edge-to-edge.

## Hard constraints

- Every v1 feature keeps working exactly as it does: paste URL → map,
  overview, Where-to-start, Map/List tabs, explorer search/filter, endpoint
  detection, health notes, copy summary, shareable `?repo=` link, optional
  token + rate-limit display, light/dark toggle. Do NOT remove or break any
  feature. Do NOT add placeholder content. Do NOT use unslop. Do NOT add
  "AI-powered" wording, gradients, purple/cyan heroes, sparkle/robot
  imagery.
- Keep the data layer (`analyze.ts`, `graph.ts`) untouched in this chunk
  except for imports if you rename something — and if you must, say so in
  your report.

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until it
passes clean. Do not run any dev server. Report the exact files you changed
and the build result.
