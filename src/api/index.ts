import { graphql, fetchUser, fetchAllRepos, fetchYearCommits } from "./client.ts";
import { CONTRIBUTIONS_QUERY } from "./queries.ts";
import type { GitHubStats, LanguageStat, RepoInfo } from "./types.ts";

export type { GitHubStats, LanguageStat, RepoInfo, YearlyContributions } from "./types.ts";

export async function fetchGitHubStats(
  token: string,
  username: string,
  options: { excludeLanguages?: string[]; excludeRepos?: string[] } = {}
): Promise<GitHubStats> {
  const excludeLanguages = new Set(options.excludeLanguages ?? []);
  const excludeRepos     = new Set(options.excludeRepos ?? []);

  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [userData, data, ownRepos] = await Promise.all([
    fetchUser(token, username),
    graphql(token, CONTRIBUTIONS_QUERY, { username, from: oneYearAgo.toISOString() }),
    fetchAllRepos(token, username),
  ]);

  const gqlUser  = (data as any).user;
  const lastYear = gqlUser.lastYearContributions;

  const createdYear = new Date(gqlUser.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  let totalCommits = 0;
  for (let y = createdYear; y <= currentYear; y++) {
    totalCommits += await fetchYearCommits(token, username, y, excludeRepos);
  }

  const totalStars = ownRepos.reduce((s: number, r: any) => s + (r.stargazerCount ?? 0), 0);
  const totalForks = ownRepos.reduce((s: number, r: any) => s + (r.forkCount ?? 0), 0);

  const langMap = new Map<string, number>();

  for (const repo of ownRepos) {
    if (excludeRepos.has(`${repo.owner?.login}/${repo.name}`)) continue;
    for (const edge of repo.languages?.edges ?? []) {
      const lang: string = edge.node.name;
      if (!excludeLanguages.has(lang))
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size);
    }
  }

  for (const cr of lastYear.commitContributionsByRepository ?? []) {
    const repoName = `${cr.repository?.owner?.login}/${cr.repository?.name}`;
    if (excludeRepos.has(repoName)) continue;
    const commits: number = cr.contributions?.totalCount ?? 0;
    if (commits === 0) continue;
    const weight = Math.min(commits / 100, 0.8);
    for (const edge of cr.repository?.languages?.edges ?? []) {
      const lang: string = edge.node.name;
      if (!excludeLanguages.has(lang))
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size * weight);
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

  const repos: RepoInfo[] = ownRepos
    .filter((r: any) => !excludeRepos.has(`${r.owner?.login}/${r.name}`))
    .map((r: any) => {
      const edges: any[] = r.languages?.edges ?? [];
      const repoTotal = edges.reduce((s: number, e: any) => s + e.size, 0);
      return {
        name:  r.name ?? "",
        owner: r.owner?.login ?? username,
        stars: r.stargazerCount ?? 0,
        forks: r.forkCount ?? 0,
        languages: edges
          .filter((e: any) => !excludeLanguages.has(e.node.name))
          .map((e: any) => ({
            name: e.node.name,
            size: e.size,
            percentage: repoTotal > 0 ? Math.round((e.size / repoTotal) * 1000) / 10 : 0,
          })),
      };
    })
    .sort((a: RepoInfo, b: RepoInfo) => b.stars - a.stars);

  return {
    user: {
      login:        userData.login,
      name:         userData.name,
      avatar_url:   userData.avatar_url,
      bio:          userData.bio,
      location:     userData.location,
      public_repos: userData.public_repos,
      followers:    userData.followers,
      following:    userData.following,
      created_at:   userData.created_at,
    },
    stats: {
      totalStars,
      totalForks,
      totalCommits,
      contributedRepos: lastYear.totalRepositoriesWithContributedCommits ?? 0,
      languageStats,
      yearlyContributions: {
        year:    currentYear,
        total:   lastYear.contributionCalendar?.totalContributions ?? 0,
        commits: lastYear.totalCommitContributions ?? 0,
        issues:  lastYear.totalIssueContributions ?? 0,
        pullRequests: lastYear.totalPullRequestContributions ?? 0,
        reviews: lastYear.totalPullRequestReviewContributions ?? 0,
        weeks:   lastYear.contributionCalendar?.weeks ?? [],
      },
    },
    repos,
  };
}
