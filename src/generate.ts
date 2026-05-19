import * as fs from "node:fs";
import * as path from "node:path";
import { generateStatsCard1, generateStatsCard2 } from "./svg/stats-card.ts";
import { generateLanguagesCard } from "./svg/languages-card.ts";
import { generateContributionsCard } from "./svg/contributions-card.ts";
import { buildReport } from "./report.ts";
import { buildDemo } from "./demo.ts";
import { log } from "./action/logger.ts";
import type { Theme } from "./svg/theme.ts";
import type { CardOptions } from "./svg/helpers.ts";
import type { GitHubStats } from "./api/types.ts";

export function generateSvgs(
  stats: GitHubStats,
  outputDir: string,
  theme: Theme,
  statsOpts: CardOptions,
  contribOpts: CardOptions,
  langOpts: CardOptions
): void {
  const outputs: Array<{ name: string; content: string }> = [
    { name: "stats1.svg",                 content: generateStatsCard1(stats, theme, statsOpts) },
    { name: "stats1-adaptive.svg",        content: generateStatsCard1(stats, "adaptive", statsOpts) },
    { name: "stats1-dark.svg",            content: generateStatsCard1(stats, "dark", statsOpts) },
    { name: "stats1-light.svg",           content: generateStatsCard1(stats, "light", statsOpts) },
    { name: "stats2.svg",                 content: generateStatsCard2(stats, theme, statsOpts) },
    { name: "stats2-adaptive.svg",        content: generateStatsCard2(stats, "adaptive", statsOpts) },
    { name: "stats2-dark.svg",            content: generateStatsCard2(stats, "dark", statsOpts) },
    { name: "stats2-light.svg",           content: generateStatsCard2(stats, "light", statsOpts) },
    { name: "contributions.svg",          content: generateContributionsCard(stats, theme, contribOpts) },
    { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive", contribOpts) },
    { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark", contribOpts) },
    { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light", contribOpts) },
    { name: "languages.svg",              content: generateLanguagesCard(stats, theme, langOpts) },
    { name: "languages-adaptive.svg",     content: generateLanguagesCard(stats, "adaptive", langOpts) },
    { name: "languages-dark.svg",         content: generateLanguagesCard(stats, "dark", langOpts) },
    { name: "languages-light.svg",        content: generateLanguagesCard(stats, "light", langOpts) },
  ];

  for (const { name, content } of outputs) {
    const filePath = path.join(outputDir, name);
    fs.writeFileSync(filePath, content, "utf-8");
    log(`- ${filePath}`);
  }
  log(`\n${outputs.length} svg files generated in ./${outputDir}/`);
}

export function generateReport(stats: GitHubStats, outputDir: string): void {
  const filePath = path.join(outputDir, "README.md");
  fs.writeFileSync(filePath, buildReport(stats), "utf-8");
  log(`- ${filePath}`);
}

export function generateDemo(stats: GitHubStats, rootDir: string = "."): void {
  const filePath = path.join(rootDir, "index.html");
  const displayName = stats.user.name ?? stats.user.login;
  fs.writeFileSync(filePath, buildDemo(stats.user.login, displayName), "utf-8");
  log(`- ${filePath}`);
}
