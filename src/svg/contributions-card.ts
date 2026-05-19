import type { GitHubStats } from "../github-api.ts";
import { getColors, getAdaptiveStyle, formatNumber, escapeXml, type Theme, FONT } from "./utils.ts";

// Matches homepage ContributionsCard (stat-box stat-box-wide)
// Left half: Total Commits (stat-item centered)
// Right half: "Contributions Last Year" title + 2x2 grid (commits/prs/issues/reviews)
export function generateContributionsCard(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const { yearlyContributions: yc, totalCommits } = stats.stats;

  const W = 460; const H = 180;
  const divX = W / 2;
  const pad = 24;

  // Left: Total Commits centered
  const leftCX = divX / 2;
  const leftSection = `
    <text x="${leftCX}" y="${H / 2 - 12}" fill="${c.accentBlue}" font-size="29" font-weight="700"
      text-anchor="middle" font-family="${FONT}">${formatNumber(totalCommits)}</text>
    <text x="${leftCX}" y="${H / 2 + 12}" fill="${c.textSecondary}" font-size="13" font-weight="500"
      text-anchor="middle" font-family="${FONT}">Total Commits</text>`;

  // Right: title + 2x2 grid
  const rightX = divX + pad;
  const rightW = W - divX - pad;
  const titleY = 38;
  const gridStartY = 62;
  const cellW = rightW / 2;
  const cellH = (H - gridStartY - pad) / 2;

  const breakdown = [
    { label: "Commits",  value: formatNumber(yc.commits) },
    { label: "PRs",      value: formatNumber(yc.pullRequests) },
    { label: "Issues",   value: formatNumber(yc.issues) },
    { label: "Reviews",  value: formatNumber(yc.reviews) },
  ];

  const gridCells = breakdown.map((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = rightX + col * cellW + cellW / 2;
    const cy = gridStartY + row * cellH + cellH / 2;
    return `
    <text x="${cx}" y="${cy - 6}" fill="${c.accentBlue}" font-size="19" font-weight="600"
      text-anchor="middle" font-family="${FONT}">${item.value}</text>
    <text x="${cx}" y="${cy + 12}" fill="${c.textSecondary}" font-size="11"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>`;
  }).join("");

  const rightSection = `
    <text x="${rightX + rightW / 2}" y="${titleY}" fill="${c.textPrimary}" font-size="14" font-weight="600"
      text-anchor="middle" font-family="${FONT}">Contributions Last Year</text>
    ${gridCells}`;

  // Divider
  const divider = `<line x1="${divX}" y1="${pad}" x2="${divX}" y2="${H - pad}"
    stroke="${c.border}" stroke-width="1"/>`;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${leftSection}
  ${divider}
  ${rightSection}
</svg>`;
}
