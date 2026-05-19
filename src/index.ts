import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fetchGitHubStats } from "./github-api.ts";
import { generateStatsCard1, generateStatsCard2 } from "./svg/stats-card.ts";
import { generateLanguagesCard } from "./svg/languages-card.ts";
import { generateContributionsCard } from "./svg/contributions-card.ts";
import { writeStatsYaml, readStatsYaml } from "./data.ts";
import type { Theme, CardOptions } from "./svg/utils.ts";
import type { GitHubStats } from "./github-api.ts";

function getInput(name: string): string {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
}

function getIntInput(name: string): number | undefined {
  const v = getInput(name).trim();
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}

function getBoolInput(name: string): boolean {
  return getInput(name).trim().toLowerCase() === "true";
}

function setFailed(message: string): void {
  process.exitCode = 1;
  process.stdout.write(`::error::${message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}${os.EOL}`);
}

function log(message: string): void {
  process.stdout.write(`${message}${os.EOL}`);
}

function buildCardOpts(responsive: boolean): { statsOpts: CardOptions; contribOpts: CardOptions; langOpts: CardOptions } {
  return {
    statsOpts: {
      width: getIntInput("stats_width"),
      height: getIntInput("stats_height"),
      responsive,
    },
    contribOpts: {
      width: getIntInput("contributions_width"),
      height: getIntInput("contributions_height"),
      responsive,
    },
    langOpts: {
      width: getIntInput("languages_width"),
      languageCount: getIntInput("languages_count"),
      responsive,
    },
  };
}

function generateSvgs(stats: GitHubStats, outputDir: string, theme: Theme, statsOpts: CardOptions, contribOpts: CardOptions, langOpts: CardOptions): void {
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
    log(`💾 ${filePath}`);
  }
  log(`\n🎉 Done! ${outputs.length} SVG files in ./${outputDir}/`);
}

(async () => {
  try {
    // mode: "fetch" | "generate" | "all" (default)
    const mode = getInput("mode") || "all";
    const outputDir = getInput("output_dir") || "dist";
    const dataFile = getInput("data_file") || path.join(outputDir, "stats.yml");
    const theme = (getInput("theme") || "adaptive") as Theme;
    const responsive = getBoolInput("responsive");
    const { statsOpts, contribOpts, langOpts } = buildCardOpts(responsive);

    fs.mkdirSync(outputDir, { recursive: true });

    if (mode === "fetch" || mode === "all") {
      const username = getInput("github_user_name") || process.env.GITHUB_USER_NAME || "";
      const token = process.env.GITHUB_TOKEN || getInput("github_token");
      const excludeLanguages = getInput("exclude_languages").split(",").map((s) => s.trim()).filter(Boolean);
      const excludeRepos = getInput("exclude_repos").split(",").map((s) => s.trim()).filter(Boolean);

      if (!username) throw new Error("github_user_name is required");
      if (!token) throw new Error("GITHUB_TOKEN is required");

      log(`📊 Fetching GitHub stats for: ${username}`);
      const stats = await fetchGitHubStats(token, username, { excludeLanguages, excludeRepos });
      log(`✅ Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

      writeStatsYaml(dataFile, stats);
      log(`📄 Stats saved to ${dataFile}`);

      if (mode === "all") {
        generateSvgs(stats, outputDir, theme, statsOpts, contribOpts, langOpts);
        log(`\nREADME usage (adaptive theme):`);
        log(`  ![Stats1](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/stats1-adaptive.svg)`);
        log(`  ![Stats2](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/stats2-adaptive.svg)`);
        log(`  ![Contributions](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/contributions-adaptive.svg)`);
        log(`  ![Languages](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/languages-adaptive.svg)`);
      }
    } else if (mode === "generate") {
      if (!fs.existsSync(dataFile)) throw new Error(`data_file not found: ${dataFile}`);
      log(`📄 Loading stats from ${dataFile}`);
      const stats = readStatsYaml(dataFile);
      generateSvgs(stats, outputDir, theme, statsOpts, contribOpts, langOpts);
    } else {
      throw new Error(`Unknown mode: "${mode}". Use "fetch", "generate", or "all".`);
    }
  } catch (e: any) {
    setFailed(`Action failed: ${e.message}`);
  }
})();
