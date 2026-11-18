# Contributing to RepoMap Web

Issues and pull requests are welcome. RepoMap Web is a small, free tool — the best contributions are small, focused, and easy to review.

## How to contribute

1. Fork the repo and create a branch from `main`, named `fix/<short-name>` or `feat/<short-name>`.
2. Make one focused change per pull request. Do not mix a bug fix with a redesign.
3. Run the checks before opening the PR:

   ```bash
   npm install
   npm run build
   ```

4. In the PR, say what you changed, why, and how you tested it. If your change affects how a repo is mapped, name a real public repo you tested it against and what changed in its map.

## What makes a good contribution here

- **Better descriptions.** The map's descriptions are rule-based. If a common file or folder pattern gets a wrong or vague description, a fix in `src/lib/analyze.ts` is the highest-value change you can make.
- **More languages and frameworks.** A new language in the extension table, a framework detected from its manifest, or a route pattern for a framework we do not cover yet.
- **Real bugs, with a repo that shows them.** Link the repo, describe what the map got wrong, and show the before/after.
- **Small UI fixes.** The interface should stay clean and professional: solid colours, one accent, no gradients, no "AI" styling. If a change makes the page look like a generic AI demo, it will not be merged.

## What not to send

- No new dependencies without a reason in the PR description. The app is deliberately dependency-light.
- No analytics, tracking, or anything that phones home. The app has no backend by design.
- No changes that send code to any model or external service. Descriptions stay rule-based.
- No placeholder or fake content. Every button must work, every example must be a real repo.

## Code style

- TypeScript, strict. No `any` where a real type fits.
- Keep functions small and named after what they do.
- Leave the code better than you found it, but do not reformat unrelated files.
