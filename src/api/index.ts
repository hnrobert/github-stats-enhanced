import { graphql, fetchUser, fetchAllRepos, fetchYearCommits, fetchCommitCount } from "./client.ts";
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
  username: string,
  weightContributed = true
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

  // Collect all unique repos
  const allRepoKeys = new Set<string>();
  for (const r of ownRepos) allRepoKeys.add(`${r.owner.login}/${r.name}`);
  for (const cr of lastYear.commitContributionsByRepository) {
    allRepoKeys.add(`${cr.repository.owner.login}/${cr.repository.name}`);
  }

  // Fetch total commits for all repos + user's own all-time commits for own repos (parallel)
  const totalCommitsMap   = new Map<string, number>();
  const userCommitsOwnMap = new Map<string, number>();
  await Promise.all([
    ...Array.from(allRepoKeys).map(async (key) => {
      const slash = key.indexOf("/");
      const count = await fetchCommitCount(token, key.slice(0, slash), key.slice(slash + 1));
      totalCommitsMap.set(key, count);
    }),
    ...ownRepos.map(async (r) => {
      const key   = `${r.owner.login}/${r.name}`;
      const count = await fetchCommitCount(token, r.owner.login, r.name, username);
      userCommitsOwnMap.set(key, count);
    }),
  ]);

  // Build commitMap: own repos use REST all-time counts; contributed repos use last-year counts
  const commitMap = new Map<string, { userCommits: number; totalCommits: number }>();
  for (const r of ownRepos) {
    const key = `${r.owner.login}/${r.name}`;
    commitMap.set(key, {
      userCommits:  userCommitsOwnMap.get(key) ?? 0,
      totalCommits: totalCommitsMap.get(key) ?? 0,
    });
  }
  for (const cr of lastYear.commitContributionsByRepository) {
    const key = `${cr.repository.owner.login}/${cr.repository.name}`;
    if (commitMap.has(key)) continue;
    commitMap.set(key, {
      userCommits:  cr.contributions.totalCount,
      totalCommits: totalCommitsMap.get(key) ?? 0,
    });
  }

  // Own repos: always full weight
  for (const repo of ownRepos) {
    if (repo.languages.edges.length === 0) continue;
    for (const edge of repo.languages.edges) {
      langMap.set(edge.node.name, (langMap.get(edge.node.name) ?? 0) + edge.size);
    }
  }

  // Contributed repos: weight by commit ratio if weightContributed, else full weight
  for (const cr of lastYear.commitContributionsByRepository) {
    const key = `${cr.repository.owner.login}/${cr.repository.name}`;
    if (cr.repository.owner.login === username) continue;
    let weight = 1;
    if (weightContributed) {
      const cm = commitMap.get(key);
      weight = cm && cm.totalCommits > 0 ? Math.min(cm.userCommits / cm.totalCommits, 1) : 0;
    }
    if (weight === 0) continue;
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
      const key = `${r.owner.login}/${r.name}`;
      const cm  = commitMap.get(key);
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
        userCommits:  cm?.userCommits  ?? 0,
        totalCommits: cm?.totalCommits ?? 0,
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
