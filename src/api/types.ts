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
  repos: RepoInfo[];
}
