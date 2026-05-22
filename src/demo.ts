import _template from "../index.html" with { type: "text" };

const template = _template as unknown as string;

const TEMPLATE_BASE = "https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced";

export function buildDemo(username: string, displayName: string, targetRepo: string, targetBranch: string): string {
  const baseUrl = targetRepo === "." || targetBranch === "."
    ? "."
    : `https://raw.githubusercontent.com/${username}/${targetRepo}/${targetBranch}`;
  return template
    .replaceAll("Robert He", displayName)
    .replaceAll(`"https://github.com/hnrobert"`, `"https://github.com/${username}"`)
    .replaceAll(`>@hnrobert ↗<`, `>@${username} ↗<`)
    .replaceAll(TEMPLATE_BASE, baseUrl);
}
