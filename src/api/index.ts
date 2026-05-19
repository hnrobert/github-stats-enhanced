import { graphql, fetchUser, fetchAllRepos, fetchYearCommits } from "./client.ts";
import { CONTRIBUTIONS_QUERY } from "./queries.ts";
import type {
  GitHubStats,
  LanguageStat,
  RepoInfo,
  RawRepo,
  RawContributionsResponse,
} from "./types.ts";

export type { GitHubStats, LanguageStat, RepoInfo, YearlyContributions } from "./types.ts";

export async function fetchGitHubStats(
  token: string,
  username: string
): Promise<GitHubStats> {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  const [userData, data, ownRepos] = await Promise.all([
    fetchUser(token, username),
    graphql<RawContributionsResponse>(token, CONTRIBUTIONS_QUERY, { username, from: oneYearAgo.toISOString() }),
    fetchAllRepos(token, username),
  ]);

  const gqlUser  = data.user;
  const lastYear = gqlUser.lastYearContributions;

  const createdYear = new Date(gqlUser.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  let totalCommits = 0;
  for (let y = createdYear; y <= currentYear; y++) {
    totalCommits += await fetchYearCommits(token, username, y);
  }

  const totalStars = ownRepos.reduce((s, r) => s + r.stargazerCount, 0);
  const totalForks = ownRepos.reduce((s, r) => s + r.forkCount, 0);

  const langMap = new Map<string, number>();

  for (const repo of ownRepos) {
    for (const edge of repo.languages.edges) {
      langMap.set(edge.node.name, (langMap.get(edge.node.name) ?? 0) + edge.size);
    }
  }

  for (const cr of lastYear.commitContributionsByRepository) {
    const commits = cr.contributions.totalCount;
    if (commits === 0) continue;
    const weight = Math.min(commits / 100, 0.8);
    for (const edge of cr.repository.languages.edges) {
      langMap.set(edge.node.name, (langMap.get(edge.node.name) ?? 0) + edge.size * weight);
    }
  }

  const totalLangSize = Array.from(langMap.values()).reduce((s, v) => s + v, 0);
  const languageStats: LanguageStat[] = Array.from(langMap.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalLangSize > 0 ? Math.round((count / totalLangSize) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const repos: RepoInfo[] = ownRepos
    .map((r: RawRepo) => {
      const edges = r.languages.edges;
      const repoTotal = edges.reduce((s, e) => s + e.size, 0);
      return {
        name:  r.name,
        owner: r.owner.login,
        stars: r.stargazerCount,
        forks: r.forkCount,
        languages: edges.map((e) => ({
          name: e.node.name,
          size: e.size,
          percentage: repoTotal > 0 ? Math.round((e.size / repoTotal) * 1000) / 10 : 0,
        })),
      };
    })
    .sort((a, b) => b.stars - a.stars);

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
      contributedRepos: lastYear.totalRepositoriesWithContributedCommits,
      languageStats,
      yearlyContributions: {
        year:         currentYear,
        total:        lastYear.contributionCalendar.totalContributions,
        commits:      lastYear.totalCommitContributions,
        issues:       lastYear.totalIssueContributions,
        pullRequests: lastYear.totalPullRequestContributions,
        reviews:      lastYear.totalPullRequestReviewContributions,
        weeks:        lastYear.contributionCalendar.weeks,
      },
    },
    repos,
  };
}
