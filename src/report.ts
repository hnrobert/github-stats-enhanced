import type { GitHubStats } from "./api/types.ts";

export function buildReport(stats: GitHubStats): string {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const u  = stats.user;
  const st = stats.stats;

  const bar = (pct: number, width = 20) => {
    const filled = Math.round((pct / 100) * width);
    return "█".repeat(filled) + "░".repeat(width - filled);
  };

  const lines: string[] = [
    `# GitHub Stats Report — ${u.login}`,
    ``,
    `> Generated: ${now}  `,
    `> Profile: [@${u.login}](https://github.com/${u.login})  `,
    `> Powered by [@hnrobert/github-stats-enhanced](https://github.com/hnrobert/github-stats-enhanced)`,
    ``,
    `## Summary`,
    ``,
    `| | |`,
    `|---|---|`,
    `| Name | ${u.name ?? u.login} |`,
    `| Followers | ${u.followers} |`,
    `| Public Repos | ${u.public_repos} |`,
    `| Total Stars | ${st.totalStars} |`,
    `| Total Forks | ${st.totalForks} |`,
    `| Total Commits | ${st.totalCommits} |`,
    `| Contributed Repos (last year) | ${st.contributedRepos} |`,
    `| Commits (last year) | ${st.yearlyContributions.commits} |`,
    `| PRs (last year) | ${st.yearlyContributions.pullRequests} |`,
    `| Issues (last year) | ${st.yearlyContributions.issues} |`,
    `| Reviews (last year) | ${st.yearlyContributions.reviews} |`,
    ``,
    `## Language Breakdown (weighted across all repos)`,
    ``,
    `| Language | Bytes (weighted) | % | Distribution |`,
    `|---|---|---|---|`,
    ...st.languageStats.map((l) =>
      `| ${l.language} | ${Math.round(l.count).toLocaleString()} | ${l.percentage.toFixed(2)}% | \`${bar(l.percentage)}\` |`
    ),
    ``,
    `## Repositories (${stats.repos.length} scanned)`,
    ``,
  ];

  for (const r of stats.repos) {
    lines.push(`### [${r.owner}/${r.name}](https://github.com/${r.owner}/${r.name})`);
    lines.push(``);
    lines.push(`⭐ ${r.stars}  🍴 ${r.forks}`);
    lines.push(``);
    if (r.languages.length > 0) {
      lines.push(`| Language | Bytes | % | Distribution |`);
      lines.push(`|---|---|---|---|`);
      for (const l of r.languages) {
        lines.push(`| ${l.name} | ${l.size.toLocaleString()} | ${l.percentage}% | \`${bar(l.percentage)}\` |`);
      }
    } else {
      lines.push(`_No language data_`);
    }
    lines.push(``);
  }

  return lines.join("\n") + "\n";
}
