import { useCallback, useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Sun,
  Moon,
  Search,
  X,
  KeyRound,
  Gauge,
  Loader2,
  AlertCircle,
  Play,
} from 'lucide-react';
import Results from './components/Results';
import { analyzeRepo, pickFilesToFetch } from './lib/analyze';
import type { RepoMap } from './lib/analyze';
import {
  GithubError,
  fetchRateLimit,
  fetchRawFile,
  fetchRepoMeta,
  fetchTree,
  parseRepoInput,
} from './lib/github';
import type { RateLimit } from './lib/github';

/** The real GitHub mark (Octocat) — Lucide has no GitHub brand icon, and the
    generic folder-git glyph did not read as GitHub. */
function GithubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.29 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

const EXAMPLES = [
  { label: 'floorplan — codebase maps for agents', value: 'haydenschmitty/floorplan' },
  { label: 'unslop — de-slop your UI', value: 'heydamir/unslop' },
  { label: 'solid-glass — a design system', value: 'deeplethe/solid-glass' },
];

const DEMO_REPO = 'haydenschmitty/floorplan';

type Status = 'idle' | 'loading' | 'done' | 'error';

function getTheme(): 'light' | 'dark' {
  const saved = localStorage.getItem('repomap-theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [input, setInput] = useState('');
  const [token, setToken] = useState(() => localStorage.getItem('repomap-token') ?? '');
  const [showToken, setShowToken] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getTheme());
  const [status, setStatus] = useState<Status>('idle');
  const [step, setStep] = useState('');
  const [error, setError] = useState('');
  const [map, setMap] = useState<RepoMap | null>(null);
  const [rate, setRate] = useState<RateLimit | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoLoaded = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('repomap-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchRateLimit(token || null).then(setRate).catch(() => undefined);
  }, [token]);

  const load = useCallback(
    async (rawInput: string) => {
      const parsed = parseRepoInput(rawInput);
      if (!parsed) {
        setError('That does not look like a GitHub repo. Try owner/repo or a full github.com URL.');
        setStatus('error');
        return;
      }
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const tok = token.trim() || null;
      setError('');
      setMap(null);
      setStatus('loading');
      try {
        setStep(`Reading ${parsed.owner}/${parsed.repo}…`);
        const meta = await fetchRepoMeta(parsed.owner, parsed.repo, tok, ctrl.signal);
        if (meta.isPrivate) throw new GithubError('That repo is private. RepoMap Web only reads public repos.', 403);
        setStep('Reading the file tree…');
        const { entries, truncated } = await fetchTree(parsed.owner, parsed.repo, meta.defaultBranch, tok, ctrl.signal);
        const toFetch = pickFilesToFetch(entries);
        setStep(`Reading ${toFetch.length} key files…`);
        const contents = new Map<string, string>();
        // Fetch in small batches so the page stays responsive.
        for (let i = 0; i < toFetch.length; i += 8) {
          const batch = toFetch.slice(i, i + 8);
          const results = await Promise.all(
            batch.map(async (p) => [p, await fetchRawFile(parsed.owner, parsed.repo, meta.defaultBranch, p, ctrl.signal)] as const),
          );
          for (const [p, text] of results) if (text !== null) contents.set(p, text);
          setStep(`Reading key files… ${Math.min(i + 8, toFetch.length)} of ${toFetch.length}`);
        }
        setStep('Drawing the map…');
        const result = analyzeRepo({ meta, entries, truncated, contents });
        setMap(result);
        setStatus('done');
        const url = new URL(window.location.href);
        url.searchParams.set('repo', `${parsed.owner}/${parsed.repo}`);
        window.history.replaceState(null, '', url);
        fetchRateLimit(tok).then(setRate).catch(() => undefined);
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        setError(e instanceof GithubError ? e.message : 'Something went wrong while talking to GitHub. Check your connection and try again.');
        setStatus('error');
      }
    },
    [token],
  );

  // Auto-load from ?repo= so shared links open straight into the map.
  useEffect(() => {
    if (autoLoaded.current) return;
    autoLoaded.current = true;
    const repo = new URLSearchParams(window.location.search).get('repo');
    if (repo) {
      setInput(repo);
      void load(repo);
    }
  }, [load]);

  const saveToken = (value: string) => {
    setToken(value);
    if (value.trim()) localStorage.setItem('repomap-token', value.trim());
    else localStorage.removeItem('repomap-token');
  };

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <a href={window.location.pathname} className="flex items-center gap-2.5">
            <MapPin className="h-5 w-5 text-accent" aria-hidden />
            <span className="font-display text-[18px] font-semibold tracking-tight">RepoMap <span className="font-normal text-muted">Web</span></span>
          </a>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a href="#how" className="btn-ghost hidden sm:block">
              How it works
            </a>
            <a
              href="https://github.com/ryoaonetsuki/repo-map"
              target="_blank"
              rel="noreferrer"
              className="btn-ghost btn-icon"
              aria-label="GitHub"
            >
              <GithubMark className="h-5 w-5" />
            </a>
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="btn-ghost btn-icon"
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero / input */}
      <main>
        <section className="mx-auto w-full max-w-6xl px-4 pt-10 sm:pt-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 text-xs font-bold text-violet-700 dark:border-violet-400/30 dark:bg-violet-400/10 dark:text-violet-300">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Free forever
            <span className="h-1 w-1 rounded-full bg-accent mx-1" aria-hidden />
            No signup
            <span className="h-1 w-1 rounded-full bg-accent mx-1" aria-hidden />
            No API key
          </div>
          <h1 className="mt-3 max-w-2xl text-[40px] font-semibold leading-[1.1] tracking-tight sm:text-56">
            See how any GitHub repo actually <em className="italic text-accent-lilac">fits together.</em>
          </h1>
          <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted">
            Paste a repo URL and get an interactive, plain-English map in about 30 seconds.
            Runs entirely in your browser — no agent, no install, no signup.
          </p>

          <form
            className="mt-6"
            onSubmit={(e) => {
              e.preventDefault();
              void load(input);
            }}
          >
            <div className="relative flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-faint" aria-hidden />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="github.com/owner/repo  or  owner/repo"
                  aria-label="GitHub repo URL or owner/repo"
                  className="input pl-9 h-11 sm:h-12 text-[15px] sm:text-[16px]"
                />
                {input.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-faint hover:text-ink"
                    aria-label="Clear"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={status === 'loading'}
                className="btn-primary btn-cta w-full sm:w-auto px-6"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden />
                    Mapping…
                  </>
                ) : (
                  'Map this repo'
                )}
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-faint">Try one:</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex.value}
                onClick={() => {
                  setInput(ex.value);
                  void load(ex.value);
                }}
                className="badge cursor-pointer hover:bg-accent hover:text-accent-ink hover:border-accent transition-colors"
              >
                {ex.value}
              </button>
            ))}
          </div>

          <div className="mt-6">
            <button
              onClick={() => setShowToken(!showToken)}
              className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors"
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              {showToken ? 'Hide token field' : 'Using a big repo, or hitting the rate limit? Add a free GitHub token (optional)'}
            </button>
            {showToken && (
              <div className="panel mt-3 max-w-xl p-4">
                <div className="flex items-start gap-3">
                  <KeyRound className="h-4 w-4 mt-0.5 text-accent flex-shrink-0" aria-hidden />
                  <div>
                    <label htmlFor="token" className="text-sm font-medium text-ink block">
                      Personal access token <span className="font-normal text-muted">(optional)</span>
                    </label>
                    <input
                      id="token"
                      type="password"
                      value={token}
                      onChange={(e) => saveToken(e.target.value)}
                      placeholder="ghp_…"
                      autoComplete="off"
                      className="mt-1 w-full input text-sm"
                    />
                    <p className="mt-2 text-xs leading-relaxed text-muted">
                      Without a key, GitHub allows 60 requests an hour. A token raises that to 5,000.
                      It is stored only in your browser's local storage and sent only to api.github.com —
                      never to any other server, because there is no other server.
                    </p>
                    {rate && rate.remaining >= 0 && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                        <Gauge className="h-3.5 w-3.5" aria-hidden />
                        <span>GitHub requests left this hour: {rate.remaining} of {rate.limit}</span>
                        {rate.resetAt ? (
                          <span> resets {new Date(rate.resetAt).toLocaleTimeString()}</span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {status === 'loading' && (
            <div className="panel mt-6 flex items-start gap-3 p-4" role="status">
              <Loader2 className="h-5 w-5 text-accent animate-spin flex-shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-ink">{step}</p>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="mt-6 card" role="alert">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-bad mt-0.5 flex-shrink-0" aria-hidden />
                <div>
                  <p className="text-sm font-medium text-bad">Could not map that repo.</p>
                  <p className="mt-1 text-sm text-muted">{error}</p>
                </div>
              </div>
              <button
                onClick={() => void load(DEMO_REPO)}
                className="mt-4 btn-ghost w-auto"
              >
                <Play className="h-4 w-4 mr-2" aria-hidden />
                Try the demo repo instead
              </button>
            </div>
          )}
        </section>

        {status === 'done' && map && <Results map={map} dark={theme === 'dark'} />}

        {status !== 'done' && (
          <>
            {/* How it works */}
            <section id="how" className="mx-auto w-full max-w-6xl px-4 py-16">
              <h2 className="text-[24px] font-semibold tracking-tight">How it works</h2>
              <p className="mt-2 text-sm text-muted">Three steps to understand any repository.</p>
              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    n: '1',
                    t: 'Paste a repo URL',
                    d: 'Any public repo on GitHub. The file list comes straight from GitHub’s public API — nothing is uploaded anywhere.',
                  },
                  {
                    n: '2',
                    t: 'It reads the code',
                    d: 'It groups files by what they do, spots the frameworks and entry points, and finds the endpoints the repo serves.',
                  },
                  {
                    n: '3',
                    t: 'You get a map in plain English',
                    d: '“Takes card payments at checkout”, not “Stripe API wrapper”. Start with the five files that explain the whole repo.',
                  },
                ].map((s) => (
                  <article key={s.n} className="card">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper text-sm font-bold">
                        {s.n}
                      </div>
                      <h3 className="text-[15px] font-semibold text-ink">{s.t}</h3>
                    </div>
                    <p className="text-sm leading-relaxed text-muted">{s.d}</p>
                  </article>
                ))}
              </div>

              <div className="mt-10 grid gap-4 md:grid-cols-2">
                <article className="card">
                  <h3 className="text-[15px] font-semibold text-ink">Why a web map, not a plugin?</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    Agent plugins map the code on your machine — after you install the agent, the plugin,
                    and the project. RepoMap Web maps any public repo from a link, in the browser, in
                    about 30 seconds. Nothing to install, nothing to sign in to, and nothing of yours
                    ever leaves the browser.
                  </p>
                </article>
                <article className="card">
                  <h3 className="text-[15px] font-semibold text-ink">What it does not do</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    It does not run your code, change your files, or send your code to any model.
                    The descriptions are rule-based — written from file names, paths, imports and
                    exports — so the map is honest about what it knows and what it only guessed.
                    Private repos stay private: they are never fetched.
                  </p>
                </article>
              </div>
            </section>

          </>
        )}
      </main>

      <footer className="border-t border-line">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-5 text-sm text-muted">
          <p>
            RepoMap Web — free forever, MIT licensed. Inspired by the idea behind{' '}
            <a className="text-accent hover:underline" href="https://github.com/haydenschmitty/floorplan" target="_blank" rel="noreferrer">
              Floorplan
            </a>
            , rebuilt for the browser. Not affiliated with Floorplan.
          </p>
          <p>
            <a className="text-accent hover:underline" href="https://github.com/ryoaonetsuki/repo-map" target="_blank" rel="noreferrer">
              Star it on GitHub
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
