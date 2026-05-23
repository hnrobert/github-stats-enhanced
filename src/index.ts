import * as fs from "node:fs";
import * as path from "node:path";
import { fetchGitHubStats } from "./api/index.ts";
import { writeStatsYaml, readStatsYaml } from "./data.ts";
import { generateSvgs, generateReport, generateDemo, filterLanguageStats, filterContributionStats } from "./generate.ts";
import type { FilterOptions } from "./generate.ts";
import { getInput, getBoolInput, buildCardOpts, log, setFailed, appendSummary } from "./action/index.ts";
import type { Theme } from "./svg/theme.ts";

function parseList(input: string): string[] {
  return input.split(",").map((s) => s.trim()).filter(Boolean);
}

function readFilterOptions(): { langFilter: FilterOptions; contribFilter: FilterOptions } {
  return {
    langFilter: {
      excludeLanguages: parseList(getInput("exclude_languages")),
      excludeRepos:     parseList(getInput("exclude_repos")),
    },
    contribFilter: {
      excludeRepos: parseList(getInput("contrib_exclude_repos")),
    },
  };
}

(async () => {
  try {
    const mode       = getInput("mode") || "all";
    const outputDir  = getInput("output_dir") || "dist";
    const dataFile   = getInput("data_file") || path.join(outputDir, "stats.yml");
    const theme      = (getInput("theme") || "adaptive") as Theme;
    const withReport = getInput("generate_report").toLowerCase() !== "false";
    const { statsOpts, contribOpts, langOpts } = buildCardOpts(getBoolInput("responsive"));

    fs.mkdirSync(outputDir, { recursive: true });

    if (mode === "fetch" || mode === "all") {
      const username = getInput("github_user_name") || process.env.GITHUB_USER_NAME || process.env.GITHUB_REPOSITORY_OWNER || "";
      const token =
        process.env.SELF_GITHUB_TOKEN ||
        getInput("self_github_token")  ||
        process.env.GITHUB_TOKEN       ||
        getInput("github_token");
      if (!username) throw new Error("github_user_name is required");
      if (!token)    throw new Error("GITHUB_TOKEN is required");

      const fetchMode = getInput("fetch_mode") || "incremental";
      let cachedStats = undefined;
      if (fetchMode === "incremental" && fs.existsSync(dataFile)) {
        log(`📄 Loading cached stats from ${dataFile}`);
        cachedStats = readStatsYaml(dataFile);
        if (cachedStats.generatedAt) log(`📅 Cache generated at: ${cachedStats.generatedAt}`);
      }

      log(`📊 Fetching GitHub stats for: ${username}${fetchMode === "incremental" ? " (incremental)" : ""}`);
      const weightContributed = getInput("weight_contributed_repos").toLowerCase() !== "false";
      const targetRepo   = getInput("target_repo") || process.env.GITHUB_REPOSITORY_NAME || username;
      const targetBranch = getInput("target_branch") || "github-stats-enhanced";
      const stats = await fetchGitHubStats(token, username, weightContributed, cachedStats);
      log(`✅ Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);

      writeStatsYaml(dataFile, stats);
      log(`📄 Stats saved to ${dataFile}`);

      if (mode === "all") {
        const { langFilter, contribFilter } = readFilterOptions();
        const langFiltered    = filterLanguageStats(stats, langFilter);
        const contribFiltered = filterContributionStats(stats, contribFilter);
        generateSvgs(langFiltered, contribFiltered, outputDir, theme, statsOpts, contribOpts, langOpts);
        if (withReport) {
          generateReport(langFiltered, outputDir, targetRepo, targetBranch);
          generateDemo(langFiltered, outputDir, targetRepo, targetBranch);
        }
        const base = `https://raw.githubusercontent.com/${username}/${targetRepo}/${targetBranch}`;
        const branchUrl = `https://github.com/${username}/${targetRepo}/tree/${targetBranch}`;
        const reportUrl = `https://github.com/${username}/${targetRepo}/blob/${targetBranch}/README.md`;
        const responsive = getBoolInput("responsive");
        const suffix = responsive ? "-responsive" : "";
        log(`\nREADME usage (adaptive theme):`);
        log(`  ![Stats1](${base}/stats1-adaptive${suffix}.svg)`);
        log(`  ![Stats2](${base}/stats2-adaptive${suffix}.svg)`);
        log(`  ![Contributions](${base}/contributions-adaptive${suffix}.svg)`);
        log(`  ![Languages](${base}/languages-adaptive${suffix}.svg)`);
        const summaryLines: string[] = [
          `## GitHub Stats Generated`,
          ``,
          `**User:** [${username}](https://github.com/${username})`,
          `**Target Branch:** [\`${targetBranch}\`](${branchUrl})`,
          `**Report:** [README.md](${reportUrl})`,
          ``,
          `### Preview`,
          ``,
          `<div align="center" style="max-width:800px;margin:0 auto">`,
          `<img src="${base}/stats1-adaptive.svg" width="21.75%" alt="Stats 1" hspace="4">`,
          `<img src="${base}/stats2-adaptive.svg" width="21.75%" alt="Stats 2" hspace="4">`,
          `<img src="${base}/contributions-adaptive.svg" width="50.5%" alt="Contributions" hspace="4">`,
          ``,
          `<br/>`,
          ``,
          `<img src="${base}/languages-adaptive.svg" width="96.5%" alt="Languages">`,
          `</div>`,
          ``,
          `### Markdown Usage`,
          ``,
          `\`\`\`markdown`,
          `![Stats1](${base}/stats1-adaptive.svg)`,
          `![Stats2](${base}/stats2-adaptive.svg)`,
          `![Contributions](${base}/contributions-adaptive.svg)`,
          `![Languages](${base}/languages-adaptive.svg)`,
          `\`\`\``,
          ``,
          `### HTML Usage (with dark/light theme support)`,
          ``,
          `\`\`\`html`,
          `<div align="center" style="max-width:800px;margin:0 auto">`,
          `<picture>`,
          `  <source media="(prefers-color-scheme: dark)" srcset="${base}/stats1-dark.svg" />`,
          `  <img src="${base}/stats1-light.svg" width="21.75%" alt="Stats 1" hspace="4" />`,
          `</picture>`,
          `<picture>`,
          `  <source media="(prefers-color-scheme: dark)" srcset="${base}/stats2-dark.svg" />`,
          `  <img src="${base}/stats2-light.svg" width="21.75%" alt="Stats 2" hspace="4" />`,
          `</picture>`,
          `<picture>`,
          `  <source media="(prefers-color-scheme: dark)" srcset="${base}/contributions-dark.svg" />`,
          `  <img src="${base}/contributions-light.svg" width="50.5%" alt="Contributions" hspace="4" />`,
          `</picture>`,
          ``,
          `<br/>`,
          ``,
          `<picture>`,
          `  <source media="(prefers-color-scheme: dark)" srcset="${base}/languages-dark.svg" />`,
          `  <img src="${base}/languages-light.svg" width="96.5%" alt="Languages" />`,
          `</picture>`,
          `</div>`,
          `\`\`\``,
        ];
        if (responsive) {
          summaryLines.push(
            ``,
            `### Markdown Usage (responsive)`,
            ``,
            `\`\`\`markdown`,
            `![Stats1](${base}/stats1-adaptive-responsive.svg)`,
            `![Stats2](${base}/stats2-adaptive-responsive.svg)`,
            `![Contributions](${base}/contributions-adaptive-responsive.svg)`,
            `![Languages](${base}/languages-adaptive-responsive.svg)`,
            `\`\`\``,
            ``,
            `### HTML Usage (responsive, with dark/light theme support)`,
            ``,
            `\`\`\`html`,
            `<div align="center" style="max-width:800px;margin:0 auto">`,
            `<picture>`,
            `  <source media="(prefers-color-scheme: dark)" srcset="${base}/stats1-dark-responsive.svg" />`,
            `  <img src="${base}/stats1-light-responsive.svg" width="21.75%" alt="Stats 1" hspace="4" />`,
            `</picture>`,
            `<picture>`,
            `  <source media="(prefers-color-scheme: dark)" srcset="${base}/stats2-dark-responsive.svg" />`,
            `  <img src="${base}/stats2-light-responsive.svg" width="21.75%" alt="Stats 2" hspace="4" />`,
            `</picture>`,
            `<picture>`,
            `  <source media="(prefers-color-scheme: dark)" srcset="${base}/contributions-dark-responsive.svg" />`,
            `  <img src="${base}/contributions-light-responsive.svg" width="50.5%" alt="Contributions" hspace="4" />`,
            `</picture>`,
            ``,
            `<br/>`,
            ``,
            `<picture>`,
            `  <source media="(prefers-color-scheme: dark)" srcset="${base}/languages-dark-responsive.svg" />`,
            `  <img src="${base}/languages-light-responsive.svg" width="96.5%" alt="Languages" />`,
            `</picture>`,
            `</div>`,
            `\`\`\``,
          );
        }
        appendSummary(summaryLines.join("\n"));
      }
    } else if (mode === "generate") {
      if (!fs.existsSync(dataFile)) throw new Error(`data_file not found: ${dataFile}`);
      log(`📄 Loading stats from ${dataFile}`);
      const raw = readStatsYaml(dataFile);
      const { langFilter, contribFilter } = readFilterOptions();
      const langFiltered    = filterLanguageStats(raw, langFilter);
      const contribFiltered = filterContributionStats(raw, contribFilter);
      const genRepo   = getInput("target_repo") || process.env.GITHUB_REPOSITORY_NAME || raw.user.login;
      const genBranch = getInput("target_branch") || "github-stats-enhanced";
      generateSvgs(langFiltered, contribFiltered, outputDir, theme, statsOpts, contribOpts, langOpts);
      if (withReport) {
        generateReport(langFiltered, outputDir, genRepo, genBranch);
        generateDemo(langFiltered, outputDir, genRepo, genBranch);
      }
    } else {
      throw new Error(`Unknown mode: "${mode}". Use "fetch", "generate", or "all".`);
    }
  } catch (e) {
    setFailed(`Action failed: ${e instanceof Error ? e.message : String(e)}`);
  }
})();

