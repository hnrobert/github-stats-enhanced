#!/usr/bin/env bun
// Local test runner — outputs SVGs + report.md to ./output/
// Usage: bun scripts/test-local.ts [username] [theme]
// Requires GITHUB_TOKEN in env or .env.local

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { fetchGitHubStats } from "../src/github-api.ts";
import { generateStatsCard1, generateStatsCard2 } from "../src/svg/stats-card.ts";
import { generateLanguagesCard } from "../src/svg/languages-card.ts";
import { generateContributionsCard } from "../src/svg/contributions-card.ts";
import type { Theme } from "../src/svg/utils.ts";
import type { GitHubStats } from "../src/github-api.ts";

if (existsSync(".env.local")) {
  const text = await Bun.file(".env.local").text();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] ??= val;
  }
}

const username = process.argv[2] || process.env.GITHUB_USER_NAME || process.env.GITHUB_ACTOR;
const theme = (process.argv[3] || "adaptive") as Theme;
const token = process.env.GITHUB_TOKEN || "";

if (!username) {
  console.error("Usage: bun scripts/test-local.ts <username> [theme]");
  console.error("  or set GITHUB_USER_NAME in .env.local");
  process.exit(1);
}
if (!token) {
  console.error("GITHUB_TOKEN is required in .env.local or environment");
  process.exit(1);
}

console.log(`Fetching stats for: ${username}`);
const stats = await fetchGitHubStats(token, username);
console.log(`Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

const outDir = "output";
mkdirSync(outDir, { recursive: true });

const svgs = [
  { name: "stats1.svg",              content: generateStatsCard1(stats, theme) },
  { name: "stats1-adaptive.svg",     content: generateStatsCard1(stats, "adaptive") },
  { name: "stats1-dark.svg",         content: generateStatsCard1(stats, "dark") },
  { name: "stats1-light.svg",        content: generateStatsCard1(stats, "light") },
  { name: "stats2.svg",              content: generateStatsCard2(stats, theme) },
  { name: "stats2-adaptive.svg",     content: generateStatsCard2(stats, "adaptive") },
  { name: "stats2-dark.svg",         content: generateStatsCard2(stats, "dark") },
  { name: "stats2-light.svg",        content: generateStatsCard2(stats, "light") },
  { name: "contributions.svg",          content: generateContributionsCard(stats, theme) },
  { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive") },
  { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark") },
  { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light") },
  { name: "languages.svg",          content: generateLanguagesCard(stats, theme) },
  { name: "languages-adaptive.svg", content: generateLanguagesCard(stats, "adaptive") },
  { name: "languages-dark.svg",     content: generateLanguagesCard(stats, "dark") },
  { name: "languages-light.svg",    content: generateLanguagesCard(stats, "light") },
];

for (const { name, content } of svgs) {
  writeFileSync(`${outDir}/${name}`, content, "utf-8");
}
console.log(`Wrote ${svgs.length} SVGs to ./${outDir}/`);

writeFileSync(`${outDir}/report.md`, buildReport(stats), "utf-8");
console.log(`Wrote ./${outDir}/report.md`);

function buildReport(s: GitHubStats): string {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const u = s.user;
  const st = s.stats;

  const bar = (pct: number, width = 20) => {
    const filled = Math.round((pct / 100) * width);
    return "█".repeat(filled) + "░".repeat(width - filled);
  };

  const lines: string[] = [
    `# GitHub Stats Report — ${u.login}`,
    ``,
    `> Generated: ${now}`,
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
    ...st.languageStats.map(l =>
      `| ${l.language} | ${Math.round(l.count).toLocaleString()} | ${l.percentage.toFixed(2)}% | \`${bar(l.percentage)}\` |`
    ),
    ``,
    `## Repositories (${s.repos.length} scanned)`,
    ``,
  ];

  for (const r of s.repos) {
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
