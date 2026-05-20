import _template from "../index.html" with { type: "text" };

const template = _template as unknown as string;

export function buildDemo(username: string, displayName: string, targetRepo: string, targetBranch: string): string {
  return template
    .replaceAll("Robert He", displayName)
    .replaceAll(`"https://github.com/hnrobert"`, `"https://github.com/${username}"`)
    .replaceAll(`>@hnrobert ↗<`, `>@${username} ↗<`)
    .replaceAll(`hnrobert/hnrobert/github-stats-enhanced`, `${username}/${targetRepo}/${targetBranch}`);
}
