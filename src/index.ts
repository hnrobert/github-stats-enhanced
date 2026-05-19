import * as fs from "node:fs";
import * as path from "node:path";
import { fetchGitHubStats } from "./api/index.ts";
import { writeStatsYaml, readStatsYaml } from "./data.ts";
import { generateSvgs } from "./generate.ts";
import { getInput, getBoolInput, buildCardOpts, log, setFailed } from "./action/index.ts";
import type { Theme } from "./svg/theme.ts";

(async () => {
  try {
    const mode      = getInput("mode") || "all";
    const outputDir = getInput("output_dir") || "dist";
    const dataFile  = getInput("data_file") || path.join(outputDir, "stats.yml");
    const theme     = (getInput("theme") || "adaptive") as Theme;
    const { statsOpts, contribOpts, langOpts } = buildCardOpts(getBoolInput("responsive"));

    fs.mkdirSync(outputDir, { recursive: true });

    if (mode === "fetch" || mode === "all") {
      const username        = getInput("github_user_name") || process.env.GITHUB_USER_NAME || "";
      const token           = process.env.GITHUB_TOKEN || getInput("github_token");
      const excludeLanguages = getInput("exclude_languages").split(",").map((s) => s.trim()).filter(Boolean);
      const excludeRepos     = getInput("exclude_repos").split(",").map((s) => s.trim()).filter(Boolean);

      if (!username) throw new Error("github_user_name is required");
      if (!token)    throw new Error("GITHUB_TOKEN is required");

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
