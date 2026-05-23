import type { GitHubStats } from "./api/types.ts";

export function buildReport(stats: GitHubStats, baseUrl = ".", treeUrl = "."): string {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const u = stats.user;
  const st = stats.stats;
  const base = baseUrl;
  const tree = treeUrl;

  const card = (dark: string, light: string, width: string, alt: string, hspace?: string) =>
    `<a href="${tree}"><picture>` +
    `<source media="(prefers-color-scheme: dark)" srcset="${base}/${dark}" />` +
    `<img src="${base}/${light}" width="${width}" alt="${alt}"${hspace ? ` hspace="${hspace}"` : ""} />` +
    `</picture></a>`;

  const bar = (pct: number, width = 20) => {
    const filled = Math.round((pct / 100) * width);
    return "█".repeat(filled) + "░".repeat(width - filled);
  };

  // Build a map: language → top repos sorted by bytes for that language
  const langRepoMap = new Map<string, { entries: Array<{ repo: string; size: number; pct: number; repoPct: number }>; total: number }>();
  for (const lang of st.languageStats) {
    const entries: Array<{ repo: string; size: number; pct: number; repoPct: number }> = [];
    for (const r of stats.repos) {
      const match = r.languages.find((l) => l.name === lang.language);
      if (!match) continue;
      entries.push({
        repo: `${r.owner}/${r.name}`,
        size: match.size,
        pct: lang.count > 0 ? Math.round((match.size / lang.count) * 10000) / 100 : 0,
        repoPct: match.percentage,
      });
    }
    entries.sort((a, b) => b.size - a.size);
    langRepoMap.set(lang.language, { entries: entries.slice(0, 10), total: entries.length });
  }

  const lines: string[] = [
    `# GitHub Stats Report — ${u.login}`,
    ``,
    `> Generated: ${now}  `,
    `> Profile: [@${u.login}](https://github.com/${u.login})  `,
    `> Powered by [@hnrobert/github-stats-enhanced](https://github.com/hnrobert/github-stats-enhanced)`,
    ``,
    `<div align="center" style="max-width:800px;margin:0 auto">`,
    card("stats1-dark.svg", "stats1-light.svg", "21.75%", "Stats 1", "4") +
    card("stats2-dark.svg", "stats2-light.svg", "21.75%", "Stats 2", "4") +
    card("contributions-dark.svg", "contributions-light.svg", "50.5%", "Contributions", "4"),
    ``,
    `<br/>`,
    ``,
    card("languages-dark.svg", "languages-light.svg", "96.5%", "Languages"),
    `</div>`,
    ``,
    `## Summary`,
    ``,
    `| Name | ${u.name ?? u.login} |`,
    `|---|---|`,
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
  ];

  for (const l of st.languageStats) {
    lines.push(`### ${l.language} — ${l.percentage.toFixed(2)}% \`${bar(l.percentage)}\``);
    lines.push(``);
    lines.push(`**${Math.round(l.count).toLocaleString()} bytes** (weighted)`);
    const { entries: topRepos, total } = langRepoMap.get(l.language) ?? { entries: [], total: 0 };
    if (topRepos.length > 0) {
      const heading = total > 10 ? `Top 10 repos (of ${total})` : `Repos (${total})`;
      lines.push(``);
      lines.push(`#### ${heading}`);
      lines.push(``);
      lines.push(`| Repo | Bytes | % in repo | % of language |`);
      lines.push(`|---|---|---|---|`);
      for (const r of topRepos) {
        lines.push(`| [${r.repo}](https://github.com/${r.repo}) | ${r.size.toLocaleString()} | ${r.repoPct.toFixed(1)}% | ${r.pct.toFixed(1)}% |`);
      }
    }
    lines.push(``);
  }

  lines.push(`## Repositories (${stats.repos.length} scanned)`);
  lines.push(``);

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

  return lines.join("\n").trimEnd() + "\n";
}
