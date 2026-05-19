import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fetchGitHubStats } from "./github-api.ts";
import { generateStatsCard, generateStatsCard1, generateStatsCard2 } from "./svg/stats-card.ts";
import { generateLanguagesCard } from "./svg/languages-card.ts";
import { generateContributionsCard } from "./svg/contributions-card.ts";
import type { Theme } from "./svg/utils.ts";

function getInput(name: string): string {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
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

    if (!username) throw new Error("github_user_name is required");
    if (!token) throw new Error("GITHUB_TOKEN is required");

    log(`📊 Fetching GitHub stats for: ${username}`);
    const stats = await fetchGitHubStats(token, username, { excludeLanguages, excludeRepos });
    log(`✅ Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

    fs.mkdirSync(outputDir, { recursive: true });

    const outputs: Array<{ name: string; content: string }> = [
      // Card 1: Followers + Total Stars
      { name: "stats1.svg",              content: generateStatsCard1(stats, theme) },
      { name: "stats1-adaptive.svg",     content: generateStatsCard1(stats, "adaptive") },
      { name: "stats1-dark.svg",         content: generateStatsCard1(stats, "dark") },
      { name: "stats1-light.svg",        content: generateStatsCard1(stats, "light") },
      // Card 2: Public Repos + Contributed Repos
      { name: "stats2.svg",              content: generateStatsCard2(stats, theme) },
      { name: "stats2-adaptive.svg",     content: generateStatsCard2(stats, "adaptive") },
      { name: "stats2-dark.svg",         content: generateStatsCard2(stats, "dark") },
      { name: "stats2-light.svg",        content: generateStatsCard2(stats, "light") },
      // Card 3: Total Commits + contributions breakdown
      { name: "contributions.svg",          content: generateContributionsCard(stats, theme) },
      { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive") },
      { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark") },
      { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light") },
      // Languages
      { name: "languages.svg",          content: generateLanguagesCard(stats, theme) },
      { name: "languages-adaptive.svg", content: generateLanguagesCard(stats, "adaptive") },
      { name: "languages-dark.svg",     content: generateLanguagesCard(stats, "dark") },
      { name: "languages-light.svg",    content: generateLanguagesCard(stats, "light") },
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
