import type { GitHubStats } from "../github-api.ts";
import { THEMES, getLangColor, escapeXml, type Theme } from "./utils.ts";

export function generateLanguagesCard(stats: GitHubStats, theme: Theme = "dark"): string {
  const c = THEMES[theme];
  const langs = stats.stats.languageStats.slice(0, 8);

  if (langs.length === 0) {
    return `<svg width="495" height="195" viewBox="0 0 495 195" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="195" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="247" y="105" fill="${c.subTextColor}" font-size="14" text-anchor="middle"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">No language data available</text>
</svg>`;
  }

  // Two-column layout
  const cols = 2;
  const colW = 220;
  const rowH = 42;
  const startX = 25;
  const startY = 60;
  const barW = 190;

  const langItems = langs.map((lang, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (colW + 10);
    const y = startY + row * rowH;
    const color = getLangColor(lang.language);
    const pct = Math.min(lang.percentage, 100);
    const filledW = Math.round((pct / 100) * barW);

    return `
    <g transform="translate(${x}, ${y})">
      <circle cx="6" cy="6" r="6" fill="${color}"/>
      <text x="18" y="10" fill="${c.textColor}" font-size="12" font-weight="500"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(lang.language)}</text>
      <text x="${barW}" y="10" fill="${c.subTextColor}" font-size="11" text-anchor="end"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${pct.toFixed(1)}%</text>
      <rect x="0" y="18" width="${barW}" height="5" rx="3" fill="${c.progressBg}"/>
      <rect x="0" y="18" width="${filledW}" height="5" rx="3" fill="${color}"/>
    </g>`;
  }).join("");

  const height = startY + Math.ceil(langs.length / cols) * rowH + 20;

  return `<svg width="495" height="${height}" viewBox="0 0 495 ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="${height}" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="25" y="35" fill="${c.titleColor}" font-size="14" font-weight="600"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Most Used Languages</text>
  <line x1="25" y1="45" x2="470" y2="45" stroke="${c.border}" stroke-width="1"/>
  ${langItems}
</svg>`;
}
