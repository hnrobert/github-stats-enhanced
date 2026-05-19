import type { GitHubStats } from "../github-api.ts";
import { getColors, getAdaptiveStyle, getLangColor, escapeXml, type Theme, FONT } from "./utils.ts";

// Matches homepage LanguagesCard:
// - Title centered
// - Composite color bar (languages-bar-container, h=12, rounded)
// - Legend items: dot + name + percentage, flex-wrap rows
export function generateLanguagesCard(stats: GitHubStats, theme: Theme = "adaptive"): string {
  const c = getColors(theme);
  const langs = stats.stats.languageStats.slice(0, 8);
  const W = 500;
  const padX = 28;
  const innerW = W - padX * 2;

  if (langs.length === 0) {
    return `<svg width="${W}" height="100" viewBox="0 0 ${W} 100" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="100" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="${W / 2}" y="56" fill="${c.textSecondary}" font-size="13" text-anchor="middle" font-family="${FONT}">No language data</text>
</svg>`;
  }

  // Title
  const titleY = 36;

  // Normalize percentages to fill 100% of bar width (same as homepage normalizedPercentage)
  const totalPct = langs.reduce((s, l) => s + l.percentage, 0);

  // Color bar (y=54, h=12, rounded)
  const barY = 54;
  const barH = 12;
  let barCursor = padX;
  const barSegments = langs.map((lang) => {
    const color = getLangColor(lang.language);
    const normalizedPct = totalPct > 0 ? (lang.percentage / totalPct) * 100 : 0;
    const segW = Math.max(2, Math.round((normalizedPct / 100) * innerW));
    const seg = `<rect x="${barCursor}" y="${barY}" width="${segW}" height="${barH}" fill="${color}"/>`;
    barCursor += segW;
    return seg;
  }).join("");

  // Legend: flex-wrap simulation — items per row based on label length
  // Each legend item: 12px dot + name + percentage, padded pill
  const legendStartY = barY + barH + 20;
  const itemPadX = 10;
  const itemPadY = 6;
  const dotR = 6;
  const fontSize = 13;
  const charW = 7.5; // approximate char width at font-size 13

  // Measure each item width: dot(12) + gap(6) + name + gap(4) + pct + padding(20)
  const itemWidths = langs.map(lang => {
    const nameLen = lang.language.length * charW;
    const pctLen = `${lang.percentage.toFixed(1)}%`.length * charW;
    return Math.ceil(dotR * 2 + 6 + nameLen + 4 + pctLen + itemPadX * 2 + 4);
  });

  // Lay out items into rows
  const rowGap = 10;
  const itemH = fontSize + itemPadY * 2;
  const rows: number[][] = [];
  let currentRow: number[] = [];
  let rowWidth = 0;

  langs.forEach((_, i) => {
    const w = itemWidths[i];
    if (currentRow.length > 0 && rowWidth + 8 + w > innerW) {
      rows.push(currentRow);
      currentRow = [i];
      rowWidth = w;
    } else {
      currentRow.push(i);
      rowWidth += (currentRow.length > 1 ? 8 : 0) + w;
    }
  });
  if (currentRow.length > 0) rows.push(currentRow);

  const legendItems = rows.map((row, ri) => {
    const rowY = legendStartY + ri * (itemH + rowGap);
    // Center the row
    const totalRowW = row.reduce((s, i) => s + itemWidths[i], 0) + (row.length - 1) * 8;
    let itemX = padX + (innerW - totalRowW) / 2;

    return row.map((idx) => {
      const lang = langs[idx];
      const color = getLangColor(lang.language);
      const iW = itemWidths[idx];
      const cx = itemX;
      itemX += iW + 8;

      const pct = `${lang.percentage.toFixed(1)}%`;
      const nameX = cx + itemPadX + dotR * 2 + 6;
      const pctX = cx + iW - itemPadX;

      return `<g>
        <rect x="${cx}" y="${rowY}" width="${iW}" height="${itemH}" rx="8"
          fill="rgba(128,128,128,0.07)" stroke="rgba(128,128,128,0.15)" stroke-width="1"/>
        <circle cx="${cx + itemPadX + dotR}" cy="${rowY + itemH / 2}" r="${dotR}" fill="${color}"/>
        <text x="${nameX}" y="${rowY + itemH / 2 + 4}" fill="${c.textPrimary}" font-size="${fontSize}"
          font-weight="500" font-family="${FONT}">${escapeXml(lang.language)}</text>
        <text x="${pctX}" y="${rowY + itemH / 2 + 4}" fill="${c.textSecondary}" font-size="${fontSize - 1}"
          font-weight="600" text-anchor="end" font-family="${FONT}">${pct}</text>
      </g>`;
    }).join("");
  }).join("");

  const H = legendStartY + rows.length * (itemH + rowGap) - rowGap + 20;

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="${W}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="${W / 2}" y="${titleY}" fill="${c.textPrimary}" font-size="20" font-weight="600"
    text-anchor="middle" font-family="${FONT}">Most Used Languages</text>
  <rect x="${padX}" y="${barY}" width="${innerW}" height="${barH}" rx="6" fill="${c.progressBg}"/>
  <clipPath id="bc"><rect x="${padX}" y="${barY}" width="${innerW}" height="${barH}" rx="6"/></clipPath>
  <g clip-path="url(#bc)">${barSegments}</g>
  ${legendItems}
</svg>`;
}
