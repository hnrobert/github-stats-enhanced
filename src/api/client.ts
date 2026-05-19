import { REPOS_PAGE_QUERY, YEAR_COMMITS_QUERY } from "./queries.ts";
import type {
  RawUserResponse,
  RawRepo,
  RawReposResponse,
  RawYearCommitsResponse,
} from "./types.ts";

const HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "User-Agent": "github-stats-enhanced",
});

export async function graphql<T>(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: HEADERS(token),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GraphQL request failed: ${res.status}\n${text}`);
  }
  const body = await res.json() as { data?: T; errors?: unknown[] };
  if (body.errors) throw new Error(`GraphQL errors: ${JSON.stringify(body.errors)}`);
  if (body.data === undefined) throw new Error("GraphQL response missing data");
  return body.data;
}

export async function fetchUser(token: string, username: string): Promise<RawUserResponse> {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { ...HEADERS(token), Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json() as Promise<RawUserResponse>;
}

export async function fetchAllRepos(token: string, username: string): Promise<RawRepo[]> {
  const repos: RawRepo[] = [];
  let cursor: string | null = null;
  do {
    const page: RawReposResponse = await graphql<RawReposResponse>(token, REPOS_PAGE_QUERY, { username, after: cursor });
    const repoPage = page.user.repositories;
    repos.push(...repoPage.nodes);
    cursor = repoPage.pageInfo.hasNextPage ? repoPage.pageInfo.endCursor : null;
  } while (cursor);
  return repos;
}

export async function fetchCommitCount(
  token: string, owner: string, repo: string
): Promise<number> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`,
    { headers: HEADERS(token) }
  );
  if (!res.ok) return 0;
  const link = res.headers.get("link") ?? "";
  const match = link.match(/[?&]page=(\d+)>; rel="last"/);
  if (match) return parseInt(match[1], 10);
  const body = await res.json() as unknown[];
  return body.length;
}

export async function fetchUserCommitCount(
  token: string, owner: string, repo: string, username: string
): Promise<number> {
  const searchHeaders = { ...HEADERS(token), Accept: "application/vnd.github+json" };
  const base = `https://api.github.com/search/commits?per_page=1&q=${encodeURIComponent(`repo:${owner}/${repo}`)}`;
  const [authorRes, coAuthorRes] = await Promise.all([
    fetch(`${base}+author:${encodeURIComponent(username)}`,    { headers: searchHeaders }),
    fetch(`${base}+co-author:${encodeURIComponent(username)}`, { headers: searchHeaders }),
  ]);
  const authorCount   = authorRes.ok   ? ((await authorRes.json()   as { total_count?: number }).total_count ?? 0) : 0;
  const coAuthorCount = coAuthorRes.ok ? ((await coAuthorRes.json() as { total_count?: number }).total_count ?? 0) : 0;
  return authorCount + coAuthorCount;
}

export async function fetchYearCommits(
  token: string,
  username: string,
  year: number
): Promise<number> {
  const from = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const to   = new Date(`${year}-12-31T23:59:59Z`).toISOString();
  const data = await graphql<RawYearCommitsResponse>(token, YEAR_COMMITS_QUERY, { username, from, to });
  return data.user.contributionsCollection.totalCommitContributions;
}
