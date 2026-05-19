import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fetchGitHubStats } from "./github-api.ts";
import { generateStatsCard, generateStatsCard1, generateStatsCard2 } from "./svg/stats-card.ts";
import { generateLanguagesCard } from "./svg/languages-card.ts";
import { generateContributionsCard } from "./svg/contributions-card.ts";
import type { Theme, CardOptions } from "./svg/utils.ts";

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

(async () => {
  try {
    const username = getInput("github_user_name") || process.env.GITHUB_USER_NAME || "";
    const token = process.env.GITHUB_TOKEN || getInput("github_token");
    const outputDir = getInput("output_dir") || "dist";
    const theme = (getInput("theme") || "adaptive") as Theme;
    const excludeLanguages = getInput("exclude_languages")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const excludeRepos = getInput("exclude_repos")
      .split(",").map((s) => s.trim()).filter(Boolean);

    const responsive = getBoolInput("responsive");
    const statsOpts: CardOptions = {
      width: getIntInput("stats_width"),
      height: getIntInput("stats_height"),
      responsive,
    };
    const contribOpts: CardOptions = {
      width: getIntInput("contributions_width"),
      height: getIntInput("contributions_height"),
      responsive,
    };
    const langOpts: CardOptions = {
      width: getIntInput("languages_width"),
      responsive,
    };

    if (!username) throw new Error("github_user_name is required");
    if (!token) throw new Error("GITHUB_TOKEN is required");

    log(`📊 Fetching GitHub stats for: ${username}`);
    const stats = await fetchGitHubStats(token, username, { excludeLanguages, excludeRepos });
    log(`✅ Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

    fs.mkdirSync(outputDir, { recursive: true });

    const outputs: Array<{ name: string; content: string }> = [
      { name: "stats1.svg",              content: generateStatsCard1(stats, theme, statsOpts) },
      { name: "stats1-adaptive.svg",     content: generateStatsCard1(stats, "adaptive", statsOpts) },
      { name: "stats1-dark.svg",         content: generateStatsCard1(stats, "dark", statsOpts) },
      { name: "stats1-light.svg",        content: generateStatsCard1(stats, "light", statsOpts) },
      { name: "stats2.svg",              content: generateStatsCard2(stats, theme, statsOpts) },
      { name: "stats2-adaptive.svg",     content: generateStatsCard2(stats, "adaptive", statsOpts) },
      { name: "stats2-dark.svg",         content: generateStatsCard2(stats, "dark", statsOpts) },
      { name: "stats2-light.svg",        content: generateStatsCard2(stats, "light", statsOpts) },
      { name: "contributions.svg",          content: generateContributionsCard(stats, theme, contribOpts) },
      { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive", contribOpts) },
      { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark", contribOpts) },
      { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light", contribOpts) },
      { name: "languages.svg",          content: generateLanguagesCard(stats, theme, langOpts) },
      { name: "languages-adaptive.svg", content: generateLanguagesCard(stats, "adaptive", langOpts) },
      { name: "languages-dark.svg",     content: generateLanguagesCard(stats, "dark", langOpts) },
      { name: "languages-light.svg",    content: generateLanguagesCard(stats, "light", langOpts) },
    ];

    for (const { name, content } of outputs) {
      const filePath = path.join(outputDir, name);
      fs.writeFileSync(filePath, content, "utf-8");
      log(`💾 ${filePath}`);
    }

    log(`\n🎉 Done! ${outputs.length} SVG files in ./${outputDir}/`);
    log(`\nREADME usage (adaptive theme, auto dark/light):`);
    log(`  ![Stats1](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/stats1-adaptive.svg)`);
    log(`  ![Stats2](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/stats2-adaptive.svg)`);
    log(`  ![Contributions](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/contributions-adaptive.svg)`);
    log(`  ![Languages](https://raw.githubusercontent.com/${username}/${username}/github-stats-enhanced/languages-adaptive.svg)`);
  } catch (e: any) {
    setFailed(`Action failed: ${e.message}`);
  }
})();
