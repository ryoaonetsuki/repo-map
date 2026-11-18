<div align="center">

# RepoMap Web

**See how any GitHub repo actually fits together.**

Paste any GitHub repo URL and get an interactive, plain-English map in about 30 seconds.
Free forever. No agent, no install, no signup, no API key — it runs entirely in your browser.

[![License: MIT](https://img.shields.io/badge/license-MIT-111?style=flat-square)](LICENSE)
[![Free forever](https://img.shields.io/badge/free-forever-1a7f37?style=flat-square)](#why-repomap-web)
[![No install](https://img.shields.io/badge/install-none-1a7f37?style=flat-square)](#quick-start)
[![No signup](https://img.shields.io/badge/signup-none-1a7f37?style=flat-square)](#quick-start)
[![No API key](https://img.shields.io/badge/api%20key-none-1a7f37?style=flat-square)](#quick-start)
[![React + TypeScript](https://img.shields.io/badge/React%20%2B%20TypeScript-Vite-0969da?style=flat-square)](package.json)

**[Try the live demo](https://repo-map.pages.dev/)** · [How it works](#how-it-works) · [Features](#features) · [Compared](#repomap-web-floorplan-archify-or-understand-anything) · [FAQ](#faq)

> **Star this repo if it saved you an afternoon of reading code.** That is the whole business model — there is no paid plan, no account, and no data to sell. If RepoMap Web ever asks you for money or a login, it is not RepoMap Web.

</div>

## Why RepoMap Web?

You found a repo. Maybe you want to use it, fix a bug in it, or just understand what it does before you star it. The README tells you what the author *wants* you to think it does. The code tells the truth — but reading a whole codebase to find it takes an afternoon.

RepoMap Web gives you the diagram nobody drew. Paste the URL, and half a minute later you have a map you can explore: every part named in plain English, every file described in one line, and the five files to read first, in order.

- **For builders:** understand a repo you did not write, in your own words, without reading the code.
- **For teams:** onboard someone in minutes, from the big picture down to the exact file.
- **For maintainers:** see your own project the way a first-time contributor sees it — and spot the parts that confuse people.

## RepoMap Web, Floorplan, Archify or Understand Anything?

All four turn code into something you can see, and all four are worth knowing. They answer different questions:

| | **RepoMap Web** | **[Floorplan](https://github.com/haydenschmitty/floorplan)** | **[Archify](https://github.com/tt-a1i/archify)** | **[Understand Anything](https://github.com/Egonex-AI/Understand-Anything)** |
|---|---|---|---|---|
| **The question it answers** | What is in this repo, and where do I start? | How does the app I built actually work, and what should I worry about? | How do I show this clearly? | How does this big codebase work, down to the functions? |
| **Made for** | Anyone opening a repo for the first time | People who build with AI and don't read the code | Anyone explaining a system, a process or an idea | Developers getting to know a large codebase |
| **What you get** | A map of any public repo in your browser: parts, files, endpoints and health notes, in plain English | A zoomable map of your whole app, health check, recent work, blueprints from a PRD | A polished diagram in one of 10 types, or a one-page explainer | A knowledge graph of every file, function and class, with guided tours |
| **Only here** | **Free, in the browser, no agent** — no install, no signup, no API key, no credits spent | Health check, Recent work, blueprints | 10 diagram types, image and video exports | Diff impact, a dashboard that adapts to your role |
| **Runs in** | Any browser | Claude Code, Codex | Claude Code, Codex, Cursor, OpenCode and more | Claude Code, Codex, Cursor, Copilot, Gemini CLI and more |

**Pick RepoMap Web** to understand any public repo right now, for free, from a link. **Pick Floorplan** to map and check an app you own, deeply, with an agent. They work together: map a repo here first, then use Floorplan to live with it.

RepoMap Web is inspired by the idea behind Floorplan, rebuilt for the browser. It is not affiliated with Floorplan, Archify or Understand Anything.

## Features

<table>
<tr>
<td width="50%" valign="top">

**🗺️ A map at every zoom**<br>
Start with the whole repo, then open a part, then a file. Each view shows what it is for, in plain English.

</td>
<td width="50%" valign="top">

**💬 Plain English everywhere**<br>
"Takes card payments at checkout", not "Stripe API wrapper". Every file gets a one-line description from its name, path, imports and exports.

</td>
</tr>
<tr>
<td valign="top">

**🧭 Where to start**<br>
The five files to read first, in order — README, manifest, entry point, routes, and the biggest part of the project.

</td>
<td valign="top">

**🔍 A real file explorer**<br>
Search every file by name or description, filter by language, and click any file to see what it uses and what it provides.

</td>
</tr>
<tr>
<td valign="top">

**🔌 Endpoints, listed**<br>
Express, Fastify, Next.js, Flask, FastAPI, Django and Go routes show up as method + path + what each one does.

</td>
<td valign="top">

**🩺 Health notes**<br>
No README, no licence, no tests, no CI, files over 500 KB, a tracked `.env` file. Problems are named; secret values are never shown.

</td>
</tr>
<tr>
<td valign="top">

**🔗 Shareable maps**<br>
Every map has a link (`?repo=owner/name`) that opens straight into it, and a copyable plain-text summary for a chat or a doc.

</td>
<td valign="top">

**🌗 Light and dark, mobile and desktop**<br>
A clean, professional interface that works on a phone. No tracking, no analytics, no cookies beyond your own settings.

</td>
</tr>
</table>

## Quick start

No install. No account. Open the site, paste a repo, press **Map this repo**.

```
https://github.com/facebook/react
facebook/react
```

Try these to see it work:

- `haydenschmitty/floorplan` — a codebase-mapping plugin (the idea that inspired this)
- `heydamir/unslop` — a small, fast-moving JavaScript project
- `deeplethe/solid-glass` — a design system for AI apps

### Rate limits, honestly

Without a key, GitHub's public API allows 60 requests an hour per visitor. A repo map uses 2 of them (repo + file tree); file contents come from `raw.githubusercontent.com` and do not count. If you hit the limit, the page says so and tells you when it resets — or you can add a free personal access token in the page, which raises the limit to 5,000/hour. The token is stored only in your browser and sent only to `api.github.com`.

### Run it yourself

```bash
git clone https://github.com/ryoaonetsuki/repo-map.git
cd repo-map
npm install
npm run dev      # local preview
npm run build    # static output in dist/ — host it anywhere, e.g. Cloudflare Pages
```

## How it works

```
repo URL ──► GitHub API (repo + file tree) ──► raw files (key files only)
        ──► rule-based analysis ──► map in your browser
```

The analysis is rule-based, not a model call: it groups files by folder and purpose, detects frameworks from manifests, finds entry points and routes with patterns, and writes each description from the file's name, path, imports and exports. That keeps the map fast, free, and honest about what it knows — no code is ever sent to any model, because there is no model and no server.

**Languages:** TypeScript, JavaScript, Python, Go, Rust, Java, Kotlin, Swift, C#, PHP, Ruby, C, C++, Vue, Svelte, Astro and more, with lighter support for others.
**Endpoints:** Express, Fastify, Koa, Hono, NestJS, Next.js App Router and Pages API routes, Flask, FastAPI, Django, and Go's `net/http` handlers.
**Frameworks spotted:** React, Next.js, Vue, Svelte, Astro, Express, Fastify, NestJS, Django, Flask, FastAPI, Laravel, Rails, Tailwind CSS, Vite and more.

## What it does not do

- It does not run your code, change your files, or send your code anywhere. Everything happens in your browser.
- It does not read private repos. They are never fetched, and a private URL is refused up front.
- It does not pretend to understand your business logic. A description that comes from a file name says what the file is *for*, not what every line does.
- It does not use the unslop plugin or any AI service. There is no AI in this tool at all.

## Privacy

- The site has no backend. The only requests it makes are to `api.github.com` (repo + tree) and `raw.githubusercontent.com` (file contents), both public GitHub endpoints.
- No analytics, no tracking, no cookies. Your theme choice and optional token live in your browser's local storage and nowhere else.
- Your token, if you add one, is sent only to `api.github.com` with the request it belongs to.

## FAQ

<details>
<summary><b>Is it really free? What is the catch?</b></summary>

There is no catch and no paid tier. The site is a static page; the only cost is GitHub's public API, which is free at 60 requests an hour without a key. The code is MIT licensed — host your own copy if you like.
</details>

<details>
<summary><b>Do I need an agent, a plugin, or an API key?</b></summary>

No. That is the point. Agent plugins map code on your machine after you install the agent, the plugin and the project. RepoMap Web maps any public repo from a link, in the browser, in about 30 seconds.
</details>

<details>
<summary><b>Does my code leave my computer?</b></summary>

Only the way browsing GitHub always works: your browser asks GitHub for the public repo's file list and the files it needs to describe. Nothing is uploaded, nothing is stored on any server, and no model ever sees the code.
</details>

<details>
<summary><b>Why is a description wrong?</b></summary>

Descriptions are written by rules from file names, paths, imports and exports — not by reading the code line by line. A file named `routes.ts` in a `billing` folder will be described as billing routes; a file with a misleading name will be described misleadingly. If a description is wrong, the file itself is one click away on GitHub. Pull requests that improve the rules are welcome.
</details>

<details>
<summary><b>What about very large repos?</b></summary>

GitHub truncates the file tree for very large repos, and the map says so when it happens. The map still covers the first part of the tree. For repos with tens of thousands of files, the explorer's search is the fastest way in.
</details>

<details>
<summary><b>Can I map a private repo?</b></summary>

Not in the browser version — it would need your credentials, and this tool deliberately has nowhere safe to put them. Clone the repo and map it locally, or use an agent plugin like Floorplan for private code.
</details>

## Star history

<a href="https://star-history.com/#ryoaonetsuki/repo-map&Date">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=ryoaonetsuki/repo-map&type=Date&theme=dark">
    <img src="https://api.star-history.com/svg?repos=ryoaonetsuki/repo-map&type=Date" alt="RepoMap Web's GitHub stars over time" width="100%">
  </picture>
</a>

## Contributing

Issues and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 [Salman Biswas](https://github.com/ryoaonetsuki)
