import type { GitHubStats } from "../github-api.ts";
import { getColors, getAdaptiveStyle, formatNumber, escapeXml, type Theme } from "./utils.ts";

export function generateStatsCard(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const { user, stats: s } = stats;
  const title = escapeXml(user.name ?? user.login);

  const items = [
    { label: "Total Stars", value: formatNumber(s.totalStars) },
    { label: "Total Forks", value: formatNumber(s.totalForks) },
    { label: "Total Commits", value: formatNumber(s.totalCommits) },
    { label: "Contributed To", value: formatNumber(s.contributedRepos) },
    { label: "Repositories", value: formatNumber(user.public_repos) },
    { label: "Followers", value: formatNumber(user.followers) },
  ];

  const cols = 3;
  const cellW = 155;
  const cellH = 70;
  const startX = 20;
  const startY = 65;

  const cells = items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    return `
    <g transform="translate(${x}, ${y})">
      <text x="0" y="0" fill="${c.statNumberColor}" font-size="22" font-weight="700"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${item.value}</text>
      <text x="0" y="20" fill="${c.subTextColor}" font-size="12"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(item.label)}</text>
    </g>`;
  }).join("");

  // Fixed themes get the fadeIn animation inline; adaptive gets it via getAdaptiveStyle
  const fixedAnim = theme !== "adaptive"
    ? `<style>.hdr{animation:fadeIn .8s ease-in-out forwards}@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}</style>`
    : "";

  return `<svg width="495" height="195" viewBox="0 0 495 195" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}${fixedAnim}
  <rect width="495" height="195" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <g class="hdr">
    <text x="25" y="35" fill="${c.titleColor}" font-size="14" font-weight="600"
      font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${title}&apos;s GitHub Stats</text>
    <line x1="25" y1="45" x2="470" y2="45" stroke="${c.border}" stroke-width="1"/>
  </g>
  ${cells}
</svg>`;
}
