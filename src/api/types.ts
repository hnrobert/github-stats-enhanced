export interface LanguageStat {
  language: string;
  count: number;
  percentage: number;
}

export interface RepoInfo {
  name: string;
  owner: string;
  stars: number;
  forks: number;
  languages: Array<{ name: string; size: number; percentage: number }>;
  userCommits: number;
  totalCommits: number;
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
  generatedAt?: string;
  repoTotalCommits?: Record<string, number>;
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
  repos: RepoInfo[];
}

// ── Raw GitHub API response shapes ───────────────────────────────────────────

export interface RawLanguageEdge {
  size: number;
  node: { name: string };
}

export interface RawRepo {
  name: string;
  pushedAt: string;
  stargazerCount: number;
  forkCount: number;
  owner: { login: string };
  languages: { edges: RawLanguageEdge[] };
}

export interface RawRepoPage {
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
  nodes: RawRepo[];
}

export interface RawCommitContribution {
  repository: {
    name: string;
    pushedAt: string;
    nameWithOwner?: string;
    owner: { login: string };
    languages: { edges: RawLanguageEdge[] };
  };
  contributions: { totalCount: number };
}

export interface RawContributionCalendar {
  totalContributions: number;
  weeks: Array<{ contributionDays: Array<{ contributionCount: number; date: string }> }>;
}

export interface RawLastYearContributions {
  totalCommitContributions: number;
  totalIssueContributions: number;
  totalPullRequestContributions: number;
  totalPullRequestReviewContributions: number;
  totalRepositoriesWithContributedCommits: number;
  contributionCalendar: RawContributionCalendar;
  commitContributionsByRepository: RawCommitContribution[];
}

export interface RawContributionsResponse {
  user: {
    createdAt: string;
    lastYearContributions: RawLastYearContributions;
  };
}

export interface RawReposResponse {
  user: { repositories: RawRepoPage };
}

export interface RawYearCommitsResponse {
  user: {
    contributionsCollection: {
      totalCommitContributions: number;
      commitContributionsByRepository: Array<{
        repository: { nameWithOwner: string };
        contributions: { totalCount: number };
      }>;
    };
  };
}

export interface RawUserResponse {
  login: string;
  name: string | null;
  avatar_url: string;
  bio: string | null;
  location: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
}

