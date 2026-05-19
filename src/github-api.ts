export interface LanguageStat {
  language: string;
  count: number;
  percentage: number;
}

export interface YearlyContributions {
  year: number;
  total: number;
  commits: number;
  issues: number;
  pullRequests: number;
  reviews: number;
  weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>;
}

export interface GitHubStats {
  user: {
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    location: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
  };
  stats: {
    totalStars: number;
    totalForks: number;
    totalCommits: number;
    contributedRepos: number;
    languageStats: LanguageStat[];
    yearlyContributions: YearlyContributions;
  };
}

const GRAPHQL_QUERY = `
  query($username: String!, $from: DateTime!) {
    user(login: $username) {
      createdAt
      lastYearContributions: contributionsCollection(from: $from) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name } }
            }
          }
          contributions(first: 1) { totalCount }
        }
      }
      ownRepositories: repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false) {
        nodes {
          stargazerCount
          forkCount
          owner { login }
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;

async function graphql(token: string, query: string, variables: Record<string, unknown>) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-stats-enhanced",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL request failed: ${res.status}`);
  const data = await res.json() as { data?: unknown; errors?: unknown[] };
  if (data.errors) throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  return data.data as Record<string, unknown>;
}

async function fetchYearCommits(
  token: string,
  username: string,
  year: number,
  excludeRepos: Set<string>
): Promise<number> {
  const yearStart = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const yearEnd = new Date(`${year}-12-31T23:59:59Z`).toISOString();
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          commitContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner }
            contributions(first: 1) { totalCount }
          }
        }
      }
    }
  `;
  const data = await graphql(token, query, { username, from: yearStart, to: yearEnd });
  const col = (data as any).user?.contributionsCollection;
  const total: number = col?.totalCommitContributions ?? 0;
  const repos: any[] = col?.commitContributionsByRepository ?? [];
  const excluded = repos
    .filter((r: any) => excludeRepos.has(r.repository?.nameWithOwner ?? ""))
    .reduce((s: number, r: any) => s + (r.contributions?.totalCount ?? 0), 0);
  return total - excluded;
}

export async function fetchGitHubStats(
  token: string,
  username: string,
  options: { excludeLanguages?: string[]; excludeRepos?: string[] } = {}
): Promise<GitHubStats> {
  const excludeLanguages = new Set(options.excludeLanguages ?? []);
  const excludeRepos = new Set(options.excludeRepos ?? []);

  const userRes = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "github-stats-enhanced",
    },
  });
  if (!userRes.ok) throw new Error(`Failed to fetch user: ${userRes.status}`);
  const userData = await userRes.json() as any;

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const data = await graphql(token, GRAPHQL_QUERY, {
    username,
    from: oneYearAgo.toISOString(),
  });

  const gqlUser = (data as any).user;
  const ownRepos: any[] = gqlUser.ownRepositories.nodes;
  const lastYear = gqlUser.lastYearContributions;

  // Cumulative commits across all years
  const createdYear = new Date(gqlUser.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  let totalCommits = 0;
  for (let y = createdYear; y <= currentYear; y++) {
    totalCommits += await fetchYearCommits(token, username, y, excludeRepos);
  }

  // Stars and forks from own repos
  const totalStars = ownRepos.reduce((s: number, r: any) => s + (r.stargazerCount ?? 0), 0);
  const totalForks = ownRepos.reduce((s: number, r: any) => s + (r.forkCount ?? 0), 0);

  // Language stats
  const langMap = new Map<string, number>();
  for (const repo of ownRepos) {
    for (const edge of repo.languages?.edges ?? []) {
      const lang: string = edge.node.name;
      if (!excludeLanguages.has(lang)) {
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size);
      }
    }
  }
  for (const contrib of lastYear.commitContributionsByRepository ?? []) {
    const repoName = `${contrib.repository?.owner?.login}/${contrib.repository?.name}`;
    if (excludeRepos.has(repoName)) continue;
    const commits: number = contrib.contributions?.totalCount ?? 0;
    if (commits === 0) continue;
    const weight = Math.min(commits / 100, 0.8);
    for (const edge of contrib.repository?.languages?.edges ?? []) {
      const lang: string = edge.node.name;
      if (!excludeLanguages.has(lang)) {
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size * weight);
      }
    }
  }

  const totalLangSize = Array.from(langMap.values()).reduce((s, v) => s + v, 0);
  const languageStats: LanguageStat[] = Array.from(langMap.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalLangSize > 0 ? Math.round((count / totalLangSize) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return {
    user: {
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at,
    },
    stats: {
      totalStars,
      totalForks,
      totalCommits,
      contributedRepos: lastYear.totalRepositoriesWithContributedCommits ?? 0,
      languageStats,
      yearlyContributions: {
        year: currentYear,
        total: lastYear.contributionCalendar?.totalContributions ?? 0,
        commits: lastYear.totalCommitContributions ?? 0,
        issues: lastYear.totalIssueContributions ?? 0,
        pullRequests: lastYear.totalPullRequestContributions ?? 0,
        reviews: lastYear.totalPullRequestReviewContributions ?? 0,
        weeks: lastYear.contributionCalendar?.weeks ?? [],
      },
    },
  };
}
