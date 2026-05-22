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
import type { GitHubStats, LanguageStat } from "./api/types.ts";

export interface FilterOptions {
  excludeLanguages?: string[];
  excludeRepos?: string[];
}

export function filterLanguageStats(stats: GitHubStats, opts: FilterOptions): GitHubStats {
  const exLangs = new Set(opts.excludeLanguages ?? []);
  const exRepos = new Set(opts.excludeRepos ?? []);
  if (exLangs.size === 0 && exRepos.size === 0) return stats;

  const filteredRepos = stats.repos.filter((r) => !exRepos.has(`${r.owner}/${r.name}`));
  const totalStars    = filteredRepos.reduce((s, r) => s + r.stars, 0);
  const totalForks    = filteredRepos.reduce((s, r) => s + r.forks, 0);

  const langMap = new Map<string, number>();
  for (const repo of filteredRepos) {
    for (const lang of repo.languages) {
      if (exLangs.has(lang.name)) continue;
      langMap.set(lang.name, (langMap.get(lang.name) ?? 0) + lang.size);
    }
  }
  const totalSize = Array.from(langMap.values()).reduce((s, v) => s + v, 0);
  const languageStats: LanguageStat[] = Array.from(langMap.entries())
    .map(([language, count]) => ({
      language,
      count,
      percentage: totalSize > 0 ? Math.round((count / totalSize) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    ...stats,
    stats: { ...stats.stats, totalStars, totalForks, languageStats },
    repos: filteredRepos,
  };
}

export function filterContributionStats(stats: GitHubStats, opts: FilterOptions): GitHubStats {
  const exRepos = new Set(opts.excludeRepos ?? []);
  if (exRepos.size === 0) return stats;

  const filteredRepos = stats.repos.filter((r) => !exRepos.has(`${r.owner}/${r.name}`));
  const totalStars    = filteredRepos.reduce((s, r) => s + r.stars, 0);
  const totalForks    = filteredRepos.reduce((s, r) => s + r.forks, 0);

  return {
    ...stats,
    stats: { ...stats.stats, totalStars, totalForks },
    repos: filteredRepos,
  };
}

export function generateSvgs(
  langStats: GitHubStats,
  contribStats: GitHubStats,
  outputDir: string,
  theme: Theme,
  statsOpts: CardOptions,
  contribOpts: CardOptions,
  langOpts: CardOptions
): void {
  const withResponsive = !!(statsOpts.responsive || contribOpts.responsive || langOpts.responsive);
  const fixed = (o: CardOptions): CardOptions => ({ ...o, responsive: false });
  const resp  = (o: CardOptions): CardOptions => ({ ...o, responsive: true });

  const outputs: Array<{ name: string; content: string }> = [
    { name: "stats1.svg",                 content: generateStatsCard1(langStats, theme,       fixed(statsOpts)) },
    { name: "stats1-adaptive.svg",        content: generateStatsCard1(langStats, "adaptive",  fixed(statsOpts)) },
    { name: "stats1-dark.svg",            content: generateStatsCard1(langStats, "dark",       fixed(statsOpts)) },
    { name: "stats1-light.svg",           content: generateStatsCard1(langStats, "light",      fixed(statsOpts)) },
    { name: "stats2.svg",                 content: generateStatsCard2(langStats, theme,       fixed(statsOpts)) },
    { name: "stats2-adaptive.svg",        content: generateStatsCard2(langStats, "adaptive",  fixed(statsOpts)) },
    { name: "stats2-dark.svg",            content: generateStatsCard2(langStats, "dark",       fixed(statsOpts)) },
    { name: "stats2-light.svg",           content: generateStatsCard2(langStats, "light",      fixed(statsOpts)) },
    { name: "contributions.svg",          content: generateContributionsCard(contribStats, theme,      fixed(contribOpts)) },
    { name: "contributions-adaptive.svg", content: generateContributionsCard(contribStats, "adaptive", fixed(contribOpts)) },
    { name: "contributions-dark.svg",     content: generateContributionsCard(contribStats, "dark",      fixed(contribOpts)) },
    { name: "contributions-light.svg",    content: generateContributionsCard(contribStats, "light",     fixed(contribOpts)) },
    { name: "languages.svg",              content: generateLanguagesCard(langStats, theme,      fixed(langOpts)) },
    { name: "languages-adaptive.svg",     content: generateLanguagesCard(langStats, "adaptive", fixed(langOpts)) },
    { name: "languages-dark.svg",         content: generateLanguagesCard(langStats, "dark",      fixed(langOpts)) },
    { name: "languages-light.svg",        content: generateLanguagesCard(langStats, "light",     fixed(langOpts)) },
  ];

  if (withResponsive) {
    outputs.push(
      { name: "stats1-responsive.svg",                  content: generateStatsCard1(langStats, theme,       resp(statsOpts)) },
      { name: "stats1-adaptive-responsive.svg",         content: generateStatsCard1(langStats, "adaptive",  resp(statsOpts)) },
      { name: "stats1-dark-responsive.svg",             content: generateStatsCard1(langStats, "dark",       resp(statsOpts)) },
      { name: "stats1-light-responsive.svg",            content: generateStatsCard1(langStats, "light",      resp(statsOpts)) },
      { name: "stats2-responsive.svg",                  content: generateStatsCard2(langStats, theme,       resp(statsOpts)) },
      { name: "stats2-adaptive-responsive.svg",         content: generateStatsCard2(langStats, "adaptive",  resp(statsOpts)) },
      { name: "stats2-dark-responsive.svg",             content: generateStatsCard2(langStats, "dark",       resp(statsOpts)) },
      { name: "stats2-light-responsive.svg",            content: generateStatsCard2(langStats, "light",      resp(statsOpts)) },
      { name: "contributions-responsive.svg",           content: generateContributionsCard(contribStats, theme,      resp(contribOpts)) },
      { name: "contributions-adaptive-responsive.svg",  content: generateContributionsCard(contribStats, "adaptive", resp(contribOpts)) },
      { name: "contributions-dark-responsive.svg",      content: generateContributionsCard(contribStats, "dark",      resp(contribOpts)) },
      { name: "contributions-light-responsive.svg",     content: generateContributionsCard(contribStats, "light",     resp(contribOpts)) },
      { name: "languages-responsive.svg",               content: generateLanguagesCard(langStats, theme,      resp(langOpts)) },
      { name: "languages-adaptive-responsive.svg",      content: generateLanguagesCard(langStats, "adaptive", resp(langOpts)) },
      { name: "languages-dark-responsive.svg",          content: generateLanguagesCard(langStats, "dark",      resp(langOpts)) },
      { name: "languages-light-responsive.svg",         content: generateLanguagesCard(langStats, "light",     resp(langOpts)) },
    );
  }

  for (const { name, content } of outputs) {
    const filePath = path.join(outputDir, name);
    fs.writeFileSync(filePath, content, "utf-8");
    log(`- ${filePath}`);
  }
  log(`\n${outputs.length} svg files generated in ./${outputDir}/`);
}

export function generateReport(stats: GitHubStats, outputDir: string, targetRepo?: string, targetBranch?: string): void {
  const filePath = path.join(outputDir, "README.md");
  const u = stats.user;
  const baseUrl = targetRepo && targetBranch
    ? `https://raw.githubusercontent.com/${u.login}/${targetRepo}/${targetBranch}`
    : ".";
  const treeUrl = targetRepo && targetBranch
    ? `https://github.com/${u.login}/${targetRepo}/tree/${targetBranch}`
    : ".";
  fs.writeFileSync(filePath, buildReport(stats, baseUrl, treeUrl), "utf-8");
  log(`- ${filePath}`);
}

export function generateDemo(stats: GitHubStats, outputDir: string = ".", targetRepo = stats.user.login, targetBranch = "github-stats-enhanced"): void {
  const filePath = path.join(outputDir, "index.html");
  const displayName = stats.user.name ?? stats.user.login;
  fs.writeFileSync(filePath, buildDemo(stats.user.login, displayName, targetRepo, targetBranch), "utf-8");
  log(`- ${filePath}`);
}
