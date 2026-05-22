import octicons from "@primer/octicons";
import type { GitHubStats } from "../api/types.ts";
import { getColors, getCardStyle, type Theme } from "./theme.ts";
import { svgOpen, formatNumber, escapeXml, responsiveWrap, type CardOptions, FONT } from "./helpers.ts";

const STATS_MIN_W = 160;

function octiconAt(name: string, color: string, x: number, y: number, size = 16): string {
  const icon = octicons[name as keyof typeof octicons];
  if (!icon) return "";
  const raw = icon.toSVG({ width: size, height: size });
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<g transform="translate(${x},${y})" fill="${color}">${inner}</g>`;
}

function estimateWidth(text: string, fontSize: number): number {
  return text.length * fontSize * 0.6;
}

const NUM_FONT = 28;
const LABEL_FONT = 13;
const NUM_LABEL_GAP = 10;
const ROW_PAD = 24; // vertical padding per row (top+bottom)

function calcStatsHeight(rowCount: number): number {
  const rowH = NUM_FONT + NUM_LABEL_GAP + LABEL_FONT;
  return rowH * rowCount + ROW_PAD * rowCount;
}

function statBox(
  items: Array<{ number: string; label: string; icon: string }>,
  c: ReturnType<typeof getColors>,
  W: number,
  H: number
): string {
  const iconSize = 16;
  const iconGap = 7;
  const groupH = NUM_FONT + NUM_LABEL_GAP + LABEL_FONT;

  return items.map((item, i) => {
    const cy = (i + 0.5) * (H / items.length);
    const groupTop = cy - groupH / 2;
    const numCY = groupTop + NUM_FONT / 2;
    const labelCY = groupTop + NUM_FONT + NUM_LABEL_GAP + LABEL_FONT / 2;
    const iconTop = numCY - iconSize / 2;
    const numW = estimateWidth(item.number, NUM_FONT);
    const groupW = iconSize + iconGap + numW;
    const iconX = W / 2 - groupW / 2;
    const numX = iconX + iconSize + iconGap;

    return `
    <g class="i${i}">
    ${octiconAt(item.icon, c.textSecondary, iconX, iconTop, iconSize)}
    <text x="${numX}" y="${numCY}" dominant-baseline="central" fill="${c.textPrimary}" font-size="${NUM_FONT}" font-weight="700"
      text-anchor="start" font-family="${FONT}">${item.number}</text>
    <text x="${W / 2}" y="${labelCY}" dominant-baseline="central" fill="${c.textSecondary}" font-size="${LABEL_FONT}" font-weight="500"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>
    </g>`;
  }).join("");
}

export function generateStatsCard1(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const W = opts.width ?? 220;
  const responsive = !!(opts.responsive);
  const items = [
    { number: formatNumber(stats.user.followers),   label: "Followers",   icon: "people" },
    { number: formatNumber(stats.stats.totalStars), label: "Total Stars", icon: "star" },
  ];
  const H = opts.height ?? calcStatsHeight(items.length);
  const [wOpen, wClose] = responsiveWrap(W, responsive);
  return `${svgOpen(W, H, responsive, STATS_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${responsive ? '100%' : W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}${statBox(items, c, W, H)}${wClose}
</svg>`;
}

export function generateStatsCard2(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const W = opts.width ?? 220;
  const responsive = !!(opts.responsive);
  const items = [
    { number: formatNumber(stats.user.public_repos),      label: "Public Repos",      icon: "repo" },
    { number: formatNumber(stats.stats.contributedRepos), label: "Contributed Repos", icon: "git-pull-request" },
  ];
  const H = opts.height ?? calcStatsHeight(items.length);
  const [wOpen, wClose] = responsiveWrap(W, responsive);
  return `${svgOpen(W, H, responsive, STATS_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${responsive ? '100%' : W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}${statBox(items, c, W, H)}${wClose}
</svg>`;
}

export function generateStatsCard(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  return generateStatsCard1(stats, theme, opts);
}
