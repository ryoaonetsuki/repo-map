export interface RepoMeta {
  owner: string;
  repo: string;
  fullName: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  defaultBranch: string;
  language: string | null;
  license: string | null;
  topics: string[];
  openIssues: number;
  createdAt: string;
  updatedAt: string;
  sizeKb: number;
  homepage: string | null;
  isPrivate: boolean;
}

export interface TreeEntry {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
  sha: string;
}

export interface RateLimit {
  remaining: number;
  limit: number;
  resetAt: number | null;
}

export class GithubError extends Error {
  status: number;
  rateLimited: boolean;
  constructor(message: string, status: number, rateLimited = false) {
    super(message);
    this.status = status;
    this.rateLimited = rateLimited;
  }
}

const API = 'https://api.github.com';

export function parseRepoInput(input: string): { owner: string; repo: string } | null {
  const trimmed = input.trim().replace(/\/$/, '');
  if (!trimmed) return null;
  const urlMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+?)(?:\.git)?(?:\/.*)?$/i,
  );
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
  const short = trimmed.match(/^([\w.-]+)\/([\w.-]+)$/);
  if (short) return { owner: short[1], repo: short[2] };
  return null;
}

async function gh<T>(url: string, token: string | null, signal?: AbortSignal): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, signal });
  if (!res.ok) {
    const remaining = res.headers.get('x-ratelimit-remaining');
    const rateLimited = res.status === 403 && remaining === '0';
    if (res.status === 404) {
      throw new GithubError('Repo not found. Check the owner and repo name — it must be a public repo.', 404);
    }
    if (rateLimited) {
      const reset = Number(res.headers.get('x-ratelimit-reset') ?? 0) * 1000;
      const when = reset ? new Date(reset).toLocaleTimeString() : 'within the hour';
      throw new GithubError(
        `GitHub's free rate limit (60 requests/hour without a key) is used up. It resets ${when}. Add a free personal access token below to keep going — it never leaves your browser.`,
        403,
        true,
      );
    }
    throw new GithubError(`GitHub returned ${res.status}. Try again in a moment.`, res.status);
  }
  return (await res.json()) as T;
}

export async function fetchRateLimit(token: string | null): Promise<RateLimit> {
  try {
    const data = await gh<{ resources: { core: { remaining: number; limit: number; reset: number } } }>(
      `${API}/rate_limit`,
      token,
    );
    const core = data.resources.core;
    return { remaining: core.remaining, limit: core.limit, resetAt: core.reset * 1000 };
  } catch {
    return { remaining: -1, limit: 60, resetAt: null };
  }
}

export async function fetchRepoMeta(
  owner: string,
  repo: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<RepoMeta> {
  const data = await gh<{
    full_name: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    subscribers_count: number;
    default_branch: string;
    language: string | null;
    license: { spdx_id: string | null } | null;
    topics: string[];
    open_issues_count: number;
    created_at: string;
    updated_at: string;
    size: number;
    homepage: string | null;
    private: boolean;
  }>(`${API}/repos/${owner}/${repo}`, token, signal);
  return {
    owner,
    repo,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.subscribers_count,
    defaultBranch: data.default_branch,
    language: data.language,
    license: data.license?.spdx_id ?? null,
    topics: data.topics ?? [],
    openIssues: data.open_issues_count,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    sizeKb: data.size,
    homepage: data.homepage || null,
    isPrivate: data.private,
  };
}

export async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
  token: string | null,
  signal?: AbortSignal,
): Promise<{ entries: TreeEntry[]; truncated: boolean }> {
  const data = await gh<{
    tree: { path: string; type: string; size?: number; sha: string }[];
    truncated: boolean;
  }>(`${API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`, token, signal);
  return {
    entries: data.tree.map((e) => ({
      path: e.path,
      type: e.type === 'blob' ? 'blob' : 'tree',
      size: e.size,
      sha: e.sha,
    })),
    truncated: data.truncated,
  };
}

/** File contents come from raw.githubusercontent.com — no API quota used. */
export async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  signal?: AbortSignal,
): Promise<string | null> {
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${encodeURIComponent(branch)}/${path
        .split('/')
        .map(encodeURIComponent)
        .join('/')}`,
      { signal },
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
