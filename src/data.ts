// Serialization helpers for GitHubStats ↔ YAML
import { dump, load } from "js-yaml";
import { readFileSync, writeFileSync } from "node:fs";
import type { GitHubStats } from "./github-api.ts";

export function statsToYaml(stats: GitHubStats): string {
  return dump(stats, { lineWidth: 120, noRefs: true });
}

export function statsFromYaml(yaml: string): GitHubStats {
  return load(yaml) as GitHubStats;
}

export function writeStatsYaml(filePath: string, stats: GitHubStats): void {
  writeFileSync(filePath, statsToYaml(stats), "utf-8");
}

export function readStatsYaml(filePath: string): GitHubStats {
  return statsFromYaml(readFileSync(filePath, "utf-8"));
}
