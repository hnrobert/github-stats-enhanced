import octicons from "@primer/octicons";
import type { GitHubStats } from "../github-api.ts";
import { getColors, getAdaptiveStyle, formatNumber, escapeXml, type Theme, FONT } from "./utils.ts";

function octiconAt(name: string, color: string, x: number, y: number, size = 16): string {
  const icon = octicons[name as keyof typeof octicons];
  if (!icon) return "";
  const raw = icon.toSVG({ width: size, height: size });
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<g transform="translate(${x},${y})" fill="${color}">${inner}</g>`;
}

// Approximate rendered width of bold text at given font-size
function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

function statBox(
  items: Array<{ number: string; label: string; icon: string }>,
  c: ReturnType<typeof getColors>,
  W: number,
  H: number
): string {
  const iconSize = 16;
  const iconGap = 7;
  const numFontSize = 28;
  const labelFontSize = 13;
  const numLabelGap = 10;

  // Group height: number (cap ~numFontSize*0.72) + gap + label cap
  const numCapH = numFontSize * 0.72;
  const labelCapH = labelFontSize * 0.72;
  const groupH = numCapH + numLabelGap + labelCapH;

  return items.map((item, i) => {
    const cy = (i + 0.5) * (H / items.length);

    // Vertical: center the group at cy
    const groupTop = cy - groupH / 2;
    const numBaseline = groupTop + numCapH;
    const labelBaseline = numBaseline + numLabelGap + labelCapH;

    // Icon vertically centered with number cap
    const iconTop = groupTop + (numCapH - iconSize) / 2;

    // Horizontal: center icon+gap+number as a unit
    const numW = estimateWidth(item.number, numFontSize);
    const groupW = iconSize + iconGap + numW;
    const iconX = W / 2 - groupW / 2;
    const numX = iconX + iconSize + iconGap;

    return `
    ${octiconAt(item.icon, c.textSecondary, iconX, iconTop, iconSize)}
    <text x="${numX}" y="${numBaseline}" fill="${c.accentBlue}" font-size="${numFontSize}" font-weight="700"
      text-anchor="start" font-family="${FONT}">${item.number}</text>
    <text x="${W / 2}" y="${labelBaseline}" fill="${c.textSecondary}" font-size="${labelFontSize}" font-weight="500"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>`;
  }).join("");
}

// Card 1: Followers + Total Stars
export function generateStatsCard1(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const W = 220; const H = 200;
  const items = [
    { number: formatNumber(stats.user.followers),   label: "Followers",   icon: "people" },
    { number: formatNumber(stats.stats.totalStars), label: "Total Stars", icon: "star" },
  ];
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${statBox(items, c, W, H)}
</svg>`;
}

// Card 2: Public Repos + Contributed Repos
export function generateStatsCard2(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const W = 220; const H = 200;
  const items = [
    { number: formatNumber(stats.user.public_repos),      label: "Public Repos",      icon: "repo" },
    { number: formatNumber(stats.stats.contributedRepos), label: "Contributed Repos", icon: "git-pull-request" },
  ];
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${statBox(items, c, W, H)}
</svg>`;
}

export function generateStatsCard(stats: GitHubStats, theme: Theme = "adaptive"): string {
  return generateStatsCard1(stats, theme);
}
