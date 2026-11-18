# Chunk 3a — UI redesign, part 1: tokens, header, hero, footer (App.tsx + index.css)

You are editing the RepoMap Web app in ~/workspace/repo-map (React + Vite +
TypeScript + Tailwind, static, no backend). The visual graph from chunk 2
already exists and works — do NOT touch it in this chunk.

Installed and ready: `lucide-react`. No other new dependencies.

## Design system (apply in this chunk)

- shadcn/ui-style: 8px radius scale, hairline borders (`border-line`), solid
  surfaces (no glass, no gradients), subtle shadows only, clear focus rings
  (accent, 2px).
- Typography: Inter/system stack (already in tokens). Strong type scale:
  hero 40–56px tight tracking, section titles 20–24px semibold, body
  15–16px relaxed, mono only for file paths / code.
- Icons: Lucide icons everywhere. Replace ALL unicode glyphs in the files
  you touch (★ ⑂ ✓ ! − +) with Lucide icons. No emoji anywhere.
- Colour: one restrained blue accent (`#0969da` light / `#2f81f7` dark,
  already the app tokens). Neutrals only otherwise. Refine the dark palette
  in `src/index.css`: near-black page (`#0b0e13`-ish), panels
  (`#12161d`-ish), muted text with real contrast (WCAG AA on panels).
  Light mode: clean white page, `#f6f8fa` surfaces. No gradients, no
  purple/cyan, no sparkle/robot imagery, no "AI-powered" wording anywhere.
- Spacing: generous whitespace on desktop (`max-w-6xl`, section gaps
  40–64px), tight but breathable on mobile. Consistent 8/16/24px rhythm.

## Work — ONLY these two files

1. **`src/index.css`:** refine the token set (light + dark) as above; add
   reusable component classes if useful (`.btn-primary`, `.btn-ghost`,
   `.card`, `.input`, `.badge`) — keep Tailwind utilities as the main tool.
   Keep the `.panel` and `.chip` classes working (Results.tsx uses them)
   or update their call sites consistently — but do NOT edit Results.tsx
   in this chunk, so keep `.panel`/`.chip` working as-is.
2. **Header (`App.tsx`):** sticky top header, solid background with a
   hairline bottom border. Refined logo mark (keep the map-pin/list motif,
   cleaner geometry), wordmark "RepoMap" + muted "Web". Nav: How it works,
   GitHub (with the `Github` Lucide icon), theme toggle as an icon button
   (Sun/Moon) with an accessible label. On mobile the header stays one
   clean row, no wrapping, no overflow.
3. **Hero + repo input (`App.tsx`):** stronger hierarchy — a small eyebrow
   badge ("Free forever · No signup · No API key"), the headline, one tight
   sub-line, then the input as a large composed control (search icon inside,
   clear button when text is present, big primary button). On mobile the
   input and button stack full-width with 48px tap targets and the input
   stays thumb-reachable. Example repos become refined chips with a
   "Try one:" label. Token field: a proper disclosure with a `KeyRound`
   icon, the rate-limit line as a small status row with a `Gauge` icon.
   Loading state: a proper progress panel (spinner + current step). Error
   state: a clear alert card with an icon and the "Try the demo repo" action.
4. **How-it-works + footer (`App.tsx`):** three steps as refined cards with
   numbered Lucide icons; the two explainer cards tightened; footer as a
   clean single row (brand line + links), same on every state.

## Hard constraints

- Every v1 feature keeps working exactly as it does. Do NOT remove or break
  any feature. Do NOT add placeholder content. Do NOT use unslop. Do NOT add
  "AI-powered" wording, gradients, purple/cyan heroes, sparkle/robot imagery.
- Touch ONLY `src/App.tsx` and `src/index.css` in this chunk.
- Mobile 360px: no horizontal overflow anywhere, no text clipped, tap
  targets ≥ 44px. Desktop 1280px: generous whitespace, clear hierarchy.

## Verify

Run `npm run build` in the repo root after your edits. Fix failures until
it passes clean. Do not run any dev server. Report the exact files you
changed and the build result. Keep your reply short.
