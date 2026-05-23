export const CONTRIBUTIONS_QUERY = `
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
            pushedAt
            owner { login }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name } }
            }
          }
          contributions(first: 1) { totalCount }
        }
      }
    }
  }
`;

export const REPOS_PAGE_QUERY = `
  query($username: String!, $after: String) {
    user(login: $username) {
      repositories(first: 50, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes {
          name
          pushedAt
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

export const YEAR_COMMITS_QUERY = `
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
