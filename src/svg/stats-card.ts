import octicons from "@primer/octicons";
import type { GitHubStats } from "../api/types.ts";
import { getColors, getCardStyle, type Theme } from "./theme.ts";
import { svgOpen, formatNumber, escapeXml, responsiveWrap, type CardOptions, FONT } from "./helpers.ts";

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

  // Use em-square heights so dominant-baseline="central" aligns correctly
  const groupH = numFontSize + numLabelGap + labelFontSize;

  return items.map((item, i) => {
    const cy = (i + 0.5) * (H / items.length);
    const groupTop = cy - groupH / 2;

    // Center y for each row — matches dominant-baseline="central"
    const numCY = groupTop + numFontSize / 2;
    const labelCY = groupTop + numFontSize + numLabelGap + labelFontSize / 2;

    // Icon center aligned to numCY
    const iconTop = numCY - iconSize / 2;

    // Horizontal: center icon+gap+number as a unit
    const numW = estimateWidth(item.number, numFontSize);
    const groupW = iconSize + iconGap + numW;
    const iconX = W / 2 - groupW / 2;
    const numX = iconX + iconSize + iconGap;

    return `
    <g class="i${i}">
    ${octiconAt(item.icon, c.textSecondary, iconX, iconTop, iconSize)}
    <text x="${numX}" y="${numCY}" dominant-baseline="central" fill="${c.textPrimary}" font-size="${numFontSize}" font-weight="700"
      text-anchor="start" font-family="${FONT}">${item.number}</text>
    <text x="${W / 2}" y="${labelCY}" dominant-baseline="central" fill="${c.textSecondary}" font-size="${labelFontSize}" font-weight="500"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>
    </g>`;
  }).join("");
}

export function generateStatsCard1(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const W = opts.width ?? 220;
  const H = opts.height ?? 200;
  const responsive = !!(opts.responsive);
  const [wOpen, wClose] = responsiveWrap(W, responsive);
  const items = [
    { number: formatNumber(stats.user.followers),   label: "Followers",   icon: "people" },
    { number: formatNumber(stats.stats.totalStars), label: "Total Stars", icon: "star" },
  ];
  return `${svgOpen(W, H, responsive)}
  ${getCardStyle(theme)}
  <rect class="card" width="${responsive ? '100%' : W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}${statBox(items, c, W, H)}${wClose}
</svg>`;
}

// Card 2: Public Repos + Contributed Repos
export function generateStatsCard2(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const W = opts.width ?? 220;
  const H = opts.height ?? 200;
  const responsive = !!(opts.responsive);
  const [wOpen, wClose] = responsiveWrap(W, responsive);
  const items = [
    { number: formatNumber(stats.user.public_repos),      label: "Public Repos",      icon: "repo" },
    { number: formatNumber(stats.stats.contributedRepos), label: "Contributed Repos", icon: "git-pull-request" },
  ];
  return `${svgOpen(W, H, responsive)}
  ${getCardStyle(theme)}
  <rect class="card" width="${responsive ? '100%' : W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}${statBox(items, c, W, H)}${wClose}
</svg>`;
}

export function generateStatsCard(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  return generateStatsCard1(stats, theme, opts);
}
