import { useMemo, useState } from 'react';
import type { AnalyzedFile, RepoMap } from '../lib/analyze';
import { LANG_COLORS, formatBytes } from '../lib/analyze';
import { buildGraph } from '../lib/graph';
import GraphMap from './GraphMap';
import {
  Star,
  GitFork,
  FileCode2,
  Scale,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Copy,
  Link,
} from 'lucide-react';

function fmt(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function buildSummary(map: RepoMap): string {
  const lines: string[] = [];
  lines.push(`# ${map.meta.fullName} — code map`);
  if (map.meta.description) lines.push('', map.meta.description);
  lines.push('', `Stars: ${map.meta.stars} · Forks: ${map.meta.forks} · Files: ${map.totalFiles}`);
  if (map.frameworks.length) lines.push(`Frameworks: ${map.frameworks.join(', ')}`);
  lines.push('', '## Where to start');
  map.startHere.forEach((s, i) => lines.push(`${i + 1}. ${s.path} — ${s.reason}`));
  lines.push('', '## Parts');
  for (const p of map.parts) lines.push(`- ${p.name} (${p.files.length} files) — ${p.purpose}`);
  if (map.endpoints.length) {
    lines.push('', '## Endpoints');
    for (const e of map.endpoints) lines.push(`- ${e.method} ${e.path} — ${e.purpose}`);
  }
  lines.push('', `Made with RepoMap Web — free, in the browser, no agent needed.`);
  return lines.join('\n');
}

export default function Results({ map, dark }: { map: RepoMap; dark: boolean }) {
  const [query, setQuery] = useState('');
  const [langFilter, setLangFilter] = useState('All');
  const [selected, setSelected] = useState<AnalyzedFile | null>(null);
  const [copied, setCopied] = useState('');
  const [openParts, setOpenParts] = useState<Set<string>>(new Set([map.parts[0]?.id ?? 'root']));
  const [tab, setTab] = useState<'map' | 'list'>('map');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return map.files.filter((f) => {
      if (langFilter !== 'All' && f.language !== langFilter) return false;
      if (!q) return true;
      return f.path.toLowerCase().includes(q) || f.description.toLowerCase().includes(q);
    });
  }, [map.files, query, langFilter]);

  const languages = useMemo(() => [...new Set(map.files.map((f) => f.language))].sort(), [map.files]);

  const togglePart = (id: string) => {
    setOpenParts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 2000);
    } catch {
      setCopied('Copy failed — select the text manually.');
    }
  };

  const shareUrl = `${window.location.origin}${window.location.pathname}?repo=${encodeURIComponent(map.meta.fullName)}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      {/* Overview */}
      <section className="panel mt-6 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              <a
                className="text-accent hover:underline"
                href={`https://github.com/${map.meta.fullName}`}
                target="_blank"
                rel="noreferrer"
              >
                {map.meta.fullName}
              </a>
            </h2>
            {map.meta.description && <p className="mt-1 max-w-2xl text-[15px] text-muted">{map.meta.description}</p>}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                <Star className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-faint">Stars</p>
                  <p className="text-sm font-semibold text-ink">{fmt(map.meta.stars)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                <GitFork className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-faint">Forks</p>
                  <p className="text-sm font-semibold text-ink">{fmt(map.meta.forks)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                <FileCode2 className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-faint">Files</p>
                  <p className="text-sm font-semibold text-ink">{map.totalFiles.toLocaleString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                <Scale className="h-4 w-4 text-accent" />
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-faint">Size</p>
                  <p className="text-sm font-semibold text-ink">{formatBytes(map.totalSize)}</p>
                </div>
              </div>
              {map.meta.license && (
                <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                  <Code2 className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-faint">Licence</p>
                    <p className="text-sm font-semibold text-ink">{map.meta.license}</p>
                  </div>
                </div>
              )}
              {map.meta.language && (
                <div className="flex items-center gap-2 p-2 rounded-[14px] border border-line bg-surface shadow-sm">
                  <Code2 className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-faint">Main language</p>
                    <p className="text-sm font-semibold text-ink">{map.meta.language}</p>
                  </div>
                </div>
              )}
            </div>
            {map.frameworks.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {map.frameworks.map((f) => (
                  <span key={f} className="rounded-full border border-line-strong bg-surface px-3 py-1 text-xs font-semibold text-ink shadow-sm hover:bg-accent-soft transition-colors">
                    {f}
                  </span>
                ))}
              </div>
            )}
            {map.meta.topics.length > 0 && (
              <p className="mt-4 text-sm text-faint">{map.meta.topics.map((t) => `#${t}`).join(' ')}</p>
            )}
            {map.truncated && (
              <p className="mt-4 text-sm text-warn">Tree truncated — very large repo, map covers the first part of the tree.</p>
            )}
          </div>
          <div className="flex gap-2 sm:flex-col sm:items-start">
            <button
              onClick={() => copy(buildSummary(map), 'Summary copied.')}
              className="btn-ghost whitespace-nowrap"
            >
              <Copy className="h-4 w-4" />
              <span>Copy summary</span>
            </button>
            <button
              onClick={() => copy(shareUrl, 'Share link copied.')}
              className="btn-primary"
            >
              <Link className="h-4 w-4" />
              <span>Copy share link</span>
            </button>
          </div>
        </div>
        {copied && <p className="mt-4 text-sm text-good">{copied}</p>}
        {map.languages.length > 0 && (
          <div className="mt-6">
            <p className="text-[10px] uppercase tracking-wider text-faint mb-2">Languages</p>
            <div className="flex h-2 w-full overflow-hidden rounded-full bg-surface">
              {map.languages.map((l) => (
                <div
                  key={l.name}
                  style={{ width: `${l.pct}%`, background: LANG_COLORS[l.name] ?? '#8a949e' }}
                  title={`${l.name} ${l.pct}%`}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
              {map.languages.map((l) => (
                <span key={l.name} className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: LANG_COLORS[l.name] ?? '#8a949e' }}
                  />
                  {l.name} {l.pct}% · {l.files} files
                </span>
              ))}
            </div>
          </div>
        )}
        {map.readmeExcerpt && (
          <div className="mt-6 p-4 rounded-[14px] border border-line-strong bg-surface">
            <p className="text-[10px] uppercase tracking-wider text-faint mb-2">Readme excerpt</p>
            <p className="text-sm text-muted italic">{map.readmeExcerpt}…</p>
          </div>
        )}
      </section>

      {/* Where to start */}
      <section className="panel mt-4 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-ink">Where to start</h3>
        <p className="mt-0.5 text-sm text-muted">Read these first, in this order — they explain the whole repo.</p>
        <div className="mt-4 relative">
          <div className="absolute left-2.5 top-0 bottom-0 w-0.5 bg-line/50" />
          {map.startHere.map((s, i) => (
            <div key={s.path} className="relative flex gap-3">
              <div className="relative shrink-0 mt-0.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-paper text-xs font-bold z-10">
                  {i + 1}
                </span>
              </div>
              <div>
                <code className="font-mono text-[13px] text-accent block">{s.path}</code>
                <p className="text-sm text-muted">{s.reason}</p>
              </div>
            </div>
          ))}
          {map.startHere.length === 0 && <p className="text-sm text-muted">No clear starting point found — browse the parts below.</p>}
        </div>
      </section>

      <div className="mt-4 inline-flex gap-1 rounded-full border border-line bg-surface p-1 shadow-sm">
        <button
          onClick={() => setTab('map')}
          className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${tab === 'map' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
        >
          Map
        </button>
        <button
          onClick={() => setTab('list')}
          className={`px-4 py-1.5 text-sm font-bold rounded-full transition-colors ${tab === 'list' ? 'bg-ink text-paper' : 'text-muted hover:text-ink'}`}
        >
          List
        </button>
      </div>
      {tab === 'map' && (
        <div className="graph-frame mt-4 h-[70vh] min-h-[400px]">
          <GraphMap map={map} graph={buildGraph(map)} dark={dark} />
        </div>
      )}
      {tab === 'list' && (
        <section className="mt-4">
          <h3 className="px-1 text-base font-semibold text-ink">The map — {map.parts.length} parts</h3>
          <p className="px-1 text-sm text-muted">Each part is a group of files with one job, named in plain English.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {map.parts.map((part) => (
              <article key={part.id} className="panel overflow-hidden">
                <button onClick={() => togglePart(part.id)} className="flex w-full items-start justify-between gap-3 p-4 text-left">
                  <span>
                    <span className="block text-[15px] font-semibold text-ink">
                      {part.name} <span className="ml-1 font-normal text-faint">· {part.files.length} files</span>
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">{part.purpose}</span>
                  </span>
                  <span className="mt-1 shrink-0 text-muted">{openParts.has(part.id) ? '−' : '+'}</span>
                </button>
                {openParts.has(part.id) && (
                  <ul className="border-t border-line px-4 py-2">
                    {part.files.slice(0, 25).map((f) => (
                      <li key={f.path} className="border-b border-line/60 py-2 last:border-0">
                        <button
                          onClick={() => setSelected(f)}
                          className="block w-full text-left"
                        >
                          <span className="font-mono text-[13px] text-accent hover:underline">{f.path}</span>
                          <span className="block text-[13px] text-muted">{f.description}</span>
                        </button>
                      </li>
                    ))}
                    {part.files.length > 25 && (
                      <li className="py-2 text-[13px] text-faint">
                        + {part.files.length - 25} more files — find them in the explorer below.
                      </li>
                    )}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Explorer */}
      <section className="panel mt-4 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-ink">File explorer</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search files or descriptions…"
            className="input min-w-56 flex-1 text-sm"
          />
          <select
            value={langFilter}
            onChange={(e) => setLangFilter(e.target.value)}
            className="h-10 rounded-[10px] border border-line-strong bg-raised px-3 text-sm text-ink outline-none focus:border-ink"
          >
            <option value="All">All languages</option>
            {languages.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="max-h-[480px] overflow-auto rounded-[14px] border border-line-strong">
            {filtered.length === 0 && <p className="p-4 text-sm text-muted">Nothing matches that search.</p>}
            <ul>
              {filtered.slice(0, 300).map((f) => {
                const isSelected = selected?.path === f.path;
                return (
                  <li key={f.path}>
                    <button
                      onClick={() => setSelected(f)}
                      className={`block w-full border-b border-line/50 px-3 py-2.5 text-left text-[13px] transition-colors ${
                        isSelected
                          ? 'bg-accent-soft border-l-2 border-accent text-ink'
                          : 'hover:bg-surface text-ink'
                      }`}
                    >
                      <span className="flex items-baseline gap-2">
                        <span className="min-w-0 flex-1 truncate font-mono text-ink">{f.path}</span>
                        <span className="shrink-0 whitespace-nowrap text-faint">
                          {f.language} · {formatBytes(f.size)}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            {filtered.length > 300 && (
              <p className="p-3 text-xs text-faint">Showing 300 of {filtered.length} matches — narrow the search.</p>
            )}
          </div>
          <div className="rounded-[14px] border border-line-strong p-4">
            {selected ? (
              <div>
                <div className="flex items-start gap-3 mb-3">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ background: LANG_COLORS[selected.language] ?? '#8a949e' }} />
                  <div>
                    <code className="font-mono text-sm text-accent block">{selected.path}</code>
                    <p className="text-sm text-ink">{selected.description}</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted">
                  {selected.language} · {formatBytes(selected.size)} ·{' '}
                  <a
                    className="text-accent hover:underline"
                    href={`https://github.com/${map.meta.fullName}/blob/${map.meta.defaultBranch}/${selected.path}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on GitHub
                  </a>
                </p>
                {selected.imports.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint mb-1">Uses</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selected.imports.map((i) => (
                        <code key={i} className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
                          {i}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                {selected.exports.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-faint mb-1">Provides</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selected.exports.map((e) => (
                        <code key={e} className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink">
                          {e}
                        </code>
                      ))}
                    </div>
                  </div>
                )}
                {selected.imports.length === 0 && selected.exports.length === 0 && (
                  <p className="mt-4 text-xs text-faint">Imports and exports were not read for this file.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Click a file on the left to see what it does, what it uses, and what it provides.</p>
            )}
          </div>
        </div>
      </section>

      {/* Endpoints */}
      {map.endpoints.length > 0 && (
        <section className="panel mt-4 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-ink">Endpoints &amp; screens — {map.endpoints.length}</h3>
          <p className="mt-0.5 text-sm text-muted">The URLs this repo serves, and what each one does.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-faint">
                  <th className="py-2 pr-3">Method</th>
                  <th className="py-2 pr-3">Path</th>
                  <th className="py-2 pr-3">Does</th>
                  <th className="py-2">In file</th>
                </tr>
              </thead>
              <tbody>
                {map.endpoints.map((e) => {
                  const methodStyles: Record<string, string> = {
                    GET: 'bg-good/10 text-good border border-good/30',
                    POST: 'bg-accent-soft text-accent border border-accent/30',
                    PUT: 'bg-warn/10 text-warn border border-warn/20',
                    PATCH: 'bg-warn/10 text-warn border border-warn/20',
                    DELETE: 'bg-bad/10 text-bad border border-bad/20',
                  };
                  return (
                    <tr key={`${e.method} ${e.path} ${e.file}`} className="border-b border-line/50 last:border-0">
                      <td className="py-2 pr-3">
                        <span className={`rounded border px-1.5 py-0.5 font-mono text-xs font-semibold ${methodStyles[e.method] ?? 'border-line text-muted'}`}>
                          {e.method}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-mono text-[13px] text-ink">{e.path}</td>
                      <td className="py-2 pr-3 text-muted">{e.purpose}</td>
                      <td className="py-2 font-mono text-xs text-faint">{e.file}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Health */}
      <section className="panel mt-4 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-ink">Health notes</h3>
        <p className="mt-0.5 text-sm text-muted">Small things worth knowing before you use or change this repo. Secret values are never shown — only locations.</p>
        <ul className="mt-3 space-y-2.5">
          {map.health.map((h) => {
            const icon = h.level === 'good' ? <CheckCircle2 className="h-4 w-4" /> : h.level === 'warn' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />;
            const badge = h.level === 'good' ? 'bg-good/10 text-good' : h.level === 'warn' ? 'bg-warn/10 text-warn' : 'bg-surface text-muted';
            return (
              <li key={h.title} className="flex gap-3 text-sm">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${badge}`}>
                  {icon}
                </span>
                <span>
                  <strong className="font-semibold text-ink">{h.title}.</strong> <span className="text-muted">{h.detail}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
