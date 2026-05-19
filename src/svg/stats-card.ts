import octicons from "@primer/octicons";
import type { GitHubStats } from "../github-api.ts";
import { getColors, getAdaptiveStyle, formatNumber, escapeXml, type Theme, FONT } from "./utils.ts";

// Extract inner SVG content (paths) from an octicon and wrap in a positioned <g>
function octiconAt(name: string, color: string, x: number, y: number, size = 16): string {
  const icon = octicons[name as keyof typeof octicons];
  if (!icon) return "";
  // toSVG returns full <svg>…</svg>; extract everything inside it
  const raw = icon.toSVG({ width: size, height: size });
  const inner = raw.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  return `<g transform="translate(${x},${y})" fill="${color}">${inner}</g>`;
}

function statBox(
  items: Array<{ number: string; label: string; icon: string; iconColor: string }>,
  c: ReturnType<typeof getColors>,
  W: number,
  H: number
): string {
  const iconSize = 16;
  const itemH = H / items.length;
  return items.map((item, i) => {
    const cy = i * itemH + itemH / 2;
    const iconX = W / 2 - iconSize / 2;
    const iconY = cy - 46;
    return `
    ${octiconAt(item.icon, item.iconColor, iconX, iconY, iconSize)}
    <text x="${W / 2}" y="${cy - 8}" fill="${c.accentBlue}" font-size="29" font-weight="700"
      text-anchor="middle" font-family="${FONT}">${item.number}</text>
    <text x="${W / 2}" y="${cy + 14}" fill="${c.textSecondary}" font-size="13" font-weight="500"
      text-anchor="middle" font-family="${FONT}">${escapeXml(item.label)}</text>`;
  }).join("");
}

// Card 1: Followers + Total Stars
export function generateStatsCard1(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const W = 220; const H = 200;
  const items = [
    { number: formatNumber(stats.user.followers), label: "Followers",   icon: "people",       iconColor: c.textSecondary },
    { number: formatNumber(stats.stats.totalStars), label: "Total Stars", icon: "star",        iconColor: c.textSecondary },
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
    { number: formatNumber(stats.user.public_repos),      label: "Public Repos",      icon: "repo",              iconColor: c.textSecondary },
    { number: formatNumber(stats.stats.contributedRepos), label: "Contributed Repos", icon: "git-pull-request",  iconColor: c.textSecondary },
  ];
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${statBox(items, c, W, H)}
</svg>`;
}

// Legacy alias
export function generateStatsCard(stats: GitHubStats, theme: Theme = "adaptive"): string {
  return generateStatsCard1(stats, theme);
}
