import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { fetchGitHubStats } from "./github-api.ts";
import { generateStatsCard } from "./svg/stats-card.ts";
import { generateLanguagesCard } from "./svg/languages-card.ts";
import { generateContributionsCard } from "./svg/contributions-card.ts";
import type { Theme } from "./svg/utils.ts";

// Re-implement @actions/core getInput without the bloat (same pattern as snk)
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
    const theme = (getInput("theme") || "dark") as Theme;
    const excludeLanguages = getInput("exclude_languages")
      .split(",").map((s) => s.trim()).filter(Boolean);
    const excludeRepos = getInput("exclude_repos")
      .split(",").map((s) => s.trim()).filter(Boolean);

    if (!username) throw new Error("github_user_name is required");
    if (!token) throw new Error("GITHUB_TOKEN is required");

    log(`📊 Fetching GitHub stats for: ${username}`);
    const stats = await fetchGitHubStats(token, username, { excludeLanguages, excludeRepos });

    log(`✅ Fetched stats — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

    fs.mkdirSync(outputDir, { recursive: true });

    const outputs: Array<{ name: string; content: string }> = [
      { name: "stats.svg", content: generateStatsCard(stats, theme) },
      { name: "stats-dark.svg", content: generateStatsCard(stats, "dark") },
      { name: "stats-light.svg", content: generateStatsCard(stats, "light") },
      { name: "languages.svg", content: generateLanguagesCard(stats, theme) },
      { name: "languages-dark.svg", content: generateLanguagesCard(stats, "dark") },
      { name: "languages-light.svg", content: generateLanguagesCard(stats, "light") },
      { name: "contributions.svg", content: generateContributionsCard(stats, theme) },
      { name: "contributions-dark.svg", content: generateContributionsCard(stats, "dark") },
      { name: "contributions-light.svg", content: generateContributionsCard(stats, "light") },
    ];

    for (const { name, content } of outputs) {
      const filePath = path.join(outputDir, name);
      fs.writeFileSync(filePath, content, "utf-8");
      log(`💾 Written: ${filePath}`);
    }

    log(`\n🎉 Done! ${outputs.length} SVG files generated in ./${outputDir}/`);
    log(`\nUsage in README.md:`);
    log(`  ![Stats](https://raw.githubusercontent.com/${username}/${username}/output/stats-dark.svg)`);
    log(`  ![Languages](https://raw.githubusercontent.com/${username}/${username}/output/languages-dark.svg)`);
    log(`  ![Contributions](https://raw.githubusercontent.com/${username}/${username}/output/contributions-dark.svg)`);
  } catch (e: any) {
    setFailed(`Action failed: ${e.message}`);
  }
})();
