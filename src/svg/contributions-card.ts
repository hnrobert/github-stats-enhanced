import type { GitHubStats } from "../github-api.ts";
import { getColors, getCardStyle, svgOpen, formatNumber, escapeXml, type Theme, type CardOptions, FONT } from "./utils.ts";

export function generateContributionsCard(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const { yearlyContributions: yc, totalCommits } = stats.stats;

  const W = opts.width ?? 460;
  const H = opts.height ?? 180;
  const halfW = W / 2;

  // Left: Total Commits — vertically centered
  const leftCX = halfW / 2;
  const numFontSize = 28;
  const labelFontSize = 13;
  const numCapH = numFontSize * 0.72;
  const labelCapH = labelFontSize * 0.72;
  const groupH = numCapH + 10 + labelCapH;
  const groupTop = H / 2 - groupH / 2;
  const numY = groupTop + numCapH;
  const labelY = numY + 10 + labelCapH;

  const leftSection = `
    <g class="i0">
    <text x="${leftCX}" y="${numY}" fill="${c.textPrimary}" font-size="${numFontSize}" font-weight="700"
      text-anchor="middle" font-family="${FONT}">${formatNumber(totalCommits)}</text>
    <text x="${leftCX}" y="${labelY}" fill="${c.textSecondary}" font-size="${labelFontSize}" font-weight="500"
      text-anchor="middle" font-family="${FONT}">Total Commits</text>
    </g>`;

  // Right: title + 2x2 grid — all centered within right half
  const rightCX = halfW + halfW / 2;
  const titleFontSize = 14;
  const titleCapH = titleFontSize * 0.72;

  // Grid layout: title at top, then 2 rows × 2 cols
  const gridNumFontSize = 19;
  const gridLabelFontSize = 11;
  const gridNumCapH = gridNumFontSize * 0.72;
  const gridLabelCapH = gridLabelFontSize * 0.72;
  const gridItemH = gridNumCapH + 6 + gridLabelCapH;

  const titleToGrid = 14;
  const rowGap = 12;
  const totalRightH = titleCapH + titleToGrid + gridItemH + rowGap + gridItemH;
  const rightGroupTop = H / 2 - totalRightH / 2;

  const titleY2 = rightGroupTop + titleCapH;
  const gridStartY = titleY2 + titleToGrid;

  const breakdown = [
    { label: "Commits", value: formatNumber(yc.commits) },
    { label: "PRs",     value: formatNumber(yc.pullRequests) },
    { label: "Issues",  value: formatNumber(yc.issues) },
    { label: "Reviews", value: formatNumber(yc.reviews) },
  ];

  const cellW = halfW / 2;
  const gridCells = breakdown.map((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cx = halfW + col * cellW + cellW / 2;
    const rowTop = gridStartY + row * (gridItemH + rowGap);
    const nY = rowTop + gridNumCapH;
    const lY = nY + 6 + gridLabelCapH;
    return `
    <g class="i${i + 1}">
    <text x="${cx}" y="${nY}" fill="${c.textPrimary}" font-size="${gridNumFontSize}" font-weight="600"
      text-anchor="middle" font-family="${FONT}">${item.value}</text>
    <text x="${cx}" y="${lY}" fill="${c.textSecondary}" font-size="${gridLabelFontSize}"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>
    </g>`;
  }).join("");

  const rightSection = `
    <g class="title">
    <text x="${rightCX}" y="${titleY2}" fill="${c.textPrimary}" font-size="${titleFontSize}" font-weight="600"
      text-anchor="middle" font-family="${FONT}">Contributions Last Year</text>
    </g>
    ${gridCells}`;

  return `${svgOpen(W, H, opts.responsive)}
  ${getCardStyle(theme)}
  <rect class="card" width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${leftSection}
  ${rightSection}
</svg>`;
}
