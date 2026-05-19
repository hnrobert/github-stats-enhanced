#!/usr/bin/env bun
// Local test runner — outputs SVGs + README.md + index.html to ./output/
//
// Usage:
//   bun scripts/test-local.ts [username]   — fetch + generate everything
//   bun scripts/test-local.ts --fetch-only — fetch API → output/stats.yml only
//   bun scripts/test-local.ts --from-cache — generate from existing output/stats.yml
//
// Requires GITHUB_TOKEN in env or .env.local

import { existsSync, mkdirSync } from "node:fs";
import { fetchGitHubStats } from "../src/api/index.ts";
import { writeStatsYaml, readStatsYaml } from "../src/data.ts";
import { generateSvgs, generateReport, generateDemo } from "../src/generate.ts";
import type { GitHubStats } from "../src/api/types.ts";

// ── Load .env.local ───────────────────────────────────────────────────────────

if (existsSync(".env.local")) {
  const text = await Bun.file(".env.local").text();
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    process.env[trimmed.slice(0, eq).trim()] ??=
      trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
}

// ── Args ──────────────────────────────────────────────────────────────────────

const args        = process.argv.slice(2);
const fetchOnly   = args.includes("--fetch-only");
const fromCache   = args.includes("--from-cache");
const username    = args.find((a) => !a.startsWith("--")) ?? process.env.GITHUB_USER_NAME ?? process.env.GITHUB_ACTOR;
const token       = process.env.GITHUB_TOKEN ?? "";
const outDir      = "output";
const dataFile    = `${outDir}/stats.yml`;

mkdirSync(outDir, { recursive: true });

// ── Fetch or load ─────────────────────────────────────────────────────────────

let stats: GitHubStats;

if (fromCache) {
  if (!existsSync(dataFile)) {
    console.error(`${dataFile} not found — run without --from-cache first`);
    process.exit(1);
  }
  console.log(`Loading stats from ${dataFile}`);
  stats = readStatsYaml(dataFile);
} else {
  if (!username) {
    console.error("Usage: bun scripts/test-local.ts <username> [--fetch-only]");
    console.error("  or set GITHUB_USER_NAME in .env.local");
    process.exit(1);
  }
  if (!token) {
    console.error("GITHUB_TOKEN is required in .env.local or environment");
    process.exit(1);
  }
  console.log(`Fetching stats for: ${username}`);
  stats = await fetchGitHubStats(token, username);
  console.log(`Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);
  writeStatsYaml(dataFile, stats);
  console.log(`Wrote ${dataFile}`);
  if (fetchOnly) process.exit(0);
}

// ── Generate ──────────────────────────────────────────────────────────────────

const ro = { responsive: true };
generateSvgs(stats, outDir, "adaptive", ro, ro, ro);
generateReport(stats, outDir);
generateDemo(stats);
console.log(`\nDone — open output/index.html to preview`);
