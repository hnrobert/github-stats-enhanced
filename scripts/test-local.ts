#!/usr/bin/env bun
// Local test runner — outputs SVGs + demo.html + report.md to ./output/
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

const ro = { responsive: true };

// Responsive SVGs — same filenames as fixed, written last so they overwrite
const svgs = [
  { name: "stats1-adaptive.svg",        content: generateStatsCard1(stats, "adaptive") },
  { name: "stats1-dark.svg",            content: generateStatsCard1(stats, "dark") },
  { name: "stats1-light.svg",           content: generateStatsCard1(stats, "light") },
  { name: "stats2-adaptive.svg",        content: generateStatsCard2(stats, "adaptive") },
  { name: "stats2-dark.svg",            content: generateStatsCard2(stats, "dark") },
  { name: "stats2-light.svg",           content: generateStatsCard2(stats, "light") },
  { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive") },
  { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark") },
  { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light") },
  { name: "languages-adaptive.svg",     content: generateLanguagesCard(stats, "adaptive") },
  { name: "languages-dark.svg",         content: generateLanguagesCard(stats, "dark") },
  { name: "languages-light.svg",        content: generateLanguagesCard(stats, "light") },
];

// Responsive variants — same names, overwrite the fixed ones above
const responsiveSvgs = [
  { name: "stats1-adaptive.svg",        content: generateStatsCard1(stats, "adaptive", ro) },
  { name: "stats2-adaptive.svg",        content: generateStatsCard2(stats, "adaptive", ro) },
  { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive", ro) },
  { name: "languages-adaptive.svg",     content: generateLanguagesCard(stats, "adaptive", ro) },
];

for (const { name, content } of svgs) {
  writeFileSync(`${outDir}/${name}`, content, "utf-8");
}

// Build demo HTML with both versions inlined before overwriting the adaptive files
const demoHtml = buildDemo(stats, username, {
  stats1Responsive:   generateStatsCard1(stats, "adaptive", ro),
  stats2Responsive:   generateStatsCard2(stats, "adaptive", ro),
  contribResponsive:  generateContributionsCard(stats, "adaptive", ro),
  langsResponsive:    generateLanguagesCard(stats, "adaptive", ro),
});
writeFileSync(`${outDir}/demo.html`, demoHtml, "utf-8");
console.log(`Wrote ./${outDir}/demo.html`);

for (const { name, content } of responsiveSvgs) {
  writeFileSync(`${outDir}/${name}`, content, "utf-8");
}
console.log(`Wrote ${svgs.length} SVGs to ./${outDir}/ (adaptive replaced with responsive)`);

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

function buildDemo(_s: GitHubStats, user: string, cards: {
  stats1Responsive: string; stats2Responsive: string; contribResponsive: string; langsResponsive: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Stats Enhanced — Demo (${user})</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a; --surface: rgba(255,255,255,0.05);
      --border: rgba(255,255,255,0.1); --text: #f8fafc; --muted: #94a3b8; --accent: #60a5fa;
    }
    @media (prefers-color-scheme: light) {
      :root { --bg: #f1f5f9; --surface: rgba(255,255,255,0.8);
        --border: rgba(0,0,0,0.08); --text: #1e293b; --muted: #64748b; --accent: #3b82f6; }
    }
    body { background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 2rem 1.5rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 3rem; }
    section { margin-bottom: 3.5rem; }
    h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.4rem; }
    .desc { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.25rem; }
    code { background: rgba(128,128,128,0.15); border-radius: 3px; padding: 1px 5px; font-size: 0.85em; }
    .tag { display: inline-block; background: rgba(96,165,250,0.15); color: var(--accent);
      border: 1px solid rgba(96,165,250,0.3); border-radius: 4px;
      font-size: 0.75rem; font-weight: 600; padding: 1px 7px; margin-left: 8px; vertical-align: middle; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 1.25rem; }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
    .resizable { resize: horizontal; overflow: hidden;
      border: 1px dashed var(--border); border-radius: 12px;
      padding: 1.25rem; min-width: 280px; max-width: 100%; width: 100%; }
    .resize-hint { color: var(--muted); font-size: 0.78rem; margin-bottom: 1rem; }
    .spacer { margin-top: 1.25rem; }
  </style>
</head>
<body>
  <h1>GitHub Stats Enhanced</h1>
  <p class="subtitle">Local preview for <strong>${user}</strong> — drag the box corner to resize and see aspect ratio changes</p>

  <section>
    <h2>Responsive cards <span class="tag">responsive: true</span></h2>
    <p class="desc">SVGs use <code>width="100%"</code> — scales with container width while preserving aspect ratio. Drag the right edge of the box below.</p>
    <div class="resizable">
      <p class="resize-hint">↔ drag right edge to resize</p>
      <div class="stats-grid">
        <div>${cards.stats1Responsive}</div>
        <div>${cards.stats2Responsive}</div>
        <div>${cards.contribResponsive}</div>
      </div>
      <div class="spacer">${cards.langsResponsive}</div>
    </div>
  </section>
</body>
</html>`;
}
