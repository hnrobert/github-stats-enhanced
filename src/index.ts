import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fetchGitHubStats } from "./github-api.ts";
import { generateStatsCard } from "./svg/stats-card.ts";
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

    // Always generate all three variants; "stats.svg" uses the configured theme
    const outputs: Array<{ name: string; content: string }> = [
      { name: "stats.svg",              content: generateStatsCard(stats, theme) },
      { name: "stats-adaptive.svg",     content: generateStatsCard(stats, "adaptive") },
      { name: "stats-dark.svg",         content: generateStatsCard(stats, "dark") },
      { name: "stats-light.svg",        content: generateStatsCard(stats, "light") },
      { name: "languages.svg",          content: generateLanguagesCard(stats, theme) },
      { name: "languages-adaptive.svg", content: generateLanguagesCard(stats, "adaptive") },
      { name: "languages-dark.svg",     content: generateLanguagesCard(stats, "dark") },
      { name: "languages-light.svg",    content: generateLanguagesCard(stats, "light") },
      { name: "contributions.svg",          content: generateContributionsCard(stats, theme) },
      { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive") },
      { name: "contributions-dark.svg",     content: generateContributionsCard(stats, "dark") },
      { name: "contributions-light.svg",    content: generateContributionsCard(stats, "light") },
    ];

    for (const { name, content } of outputs) {
      const filePath = path.join(outputDir, name);
      fs.writeFileSync(filePath, content, "utf-8");
      log(`💾 ${filePath}`);
    }

    log(`\n🎉 Done! ${outputs.length} SVG files in ./${outputDir}/`);
    log(`\nRecommended README usage (auto dark/light):`);
    log(`  ![Stats](https://raw.githubusercontent.com/${username}/${username}/output/stats-adaptive.svg)`);
    log(`  ![Languages](https://raw.githubusercontent.com/${username}/${username}/output/languages-adaptive.svg)`);
    log(`  ![Contributions](https://raw.githubusercontent.com/${username}/${username}/output/contributions-adaptive.svg)`);
  } catch (e: any) {
    setFailed(`Action failed: ${e.message}`);
  }
})();
