import { REPOS_PAGE_QUERY, YEAR_COMMITS_QUERY } from "./queries.ts";

const HEADERS = (token: string) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "User-Agent": "github-stats-enhanced",
});

export async function graphql(
  token: string,
  query: string,
  variables: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: HEADERS(token),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
  const data = await res.json() as { data?: unknown; errors?: unknown[] };
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  return data.data as Record<string, unknown>;
}

export async function fetchUser(token: string, username: string): Promise<any> {
  const res = await fetch(`https://api.github.com/users/${username}`, {
    headers: { ...HEADERS(token), Accept: "application/vnd.github.v3+json" },
  });
  if (!res.ok) throw new Error(`Failed to fetch user: ${res.status}`);
  return res.json();
}

export async function fetchAllRepos(token: string, username: string): Promise<any[]> {
  const repos: any[] = [];
  let cursor: string | null = null;
  do {
    const page = await graphql(token, REPOS_PAGE_QUERY, { username, after: cursor }) as any;
    const repoPage = page.user.repositories;
    repos.push(...repoPage.nodes);
    cursor = repoPage.pageInfo.hasNextPage ? repoPage.pageInfo.endCursor : null;
  } while (cursor);
  return repos;
}

export async function fetchYearCommits(
  token: string,
  username: string,
  year: number,
  excludeRepos: Set<string>
): Promise<number> {
  const from = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const to   = new Date(`${year}-12-31T23:59:59Z`).toISOString();
  const data = await graphql(token, YEAR_COMMITS_QUERY, { username, from, to }) as any;
  const col = data.user?.contributionsCollection;
  const total: number = col?.totalCommitContributions ?? 0;
  const excluded = (col?.commitContributionsByRepository ?? [] as any[])
    .filter((r: any) => excludeRepos.has(r.repository?.nameWithOwner ?? ""))
    .reduce((s: number, r: any) => s + (r.contributions?.totalCount ?? 0), 0);
  return total - excluded;
}
