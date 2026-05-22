import type { GitHubStats } from "../api/types.ts";
import { getColors, getCardStyle, type Theme } from "./theme.ts";
import { getLangColor } from "./colors.ts";
import { svgOpen, escapeXml, responsiveWrap, type CardOptions, FONT } from "./helpers.ts";

const LANG_MIN_W = 300;

export function generateLanguagesCard(stats: GitHubStats, theme: Theme = "adaptive", opts: CardOptions = {}): string {
  const c = getColors(theme);
  const langs = stats.stats.languageStats.slice(0, opts.languageCount ?? 8);
  const W = opts.width ?? 500;
  const padX = 28;
  const innerW = W - padX * 2;
  const responsive = !!(opts.responsive);
  const bgW = responsive ? '100%' : `${W}`;

  if (langs.length === 0) {
    const [wOpen, wClose] = responsiveWrap(W, responsive);
    return `${svgOpen(W, 100, responsive, LANG_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${bgW}" height="100" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}<text x="${W / 2}" y="56" fill="${c.textSecondary}" font-size="13" text-anchor="middle" font-family="${FONT}">No language data</text>${wClose}
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

      const delay = (0.3 + idx * 0.07).toFixed(2);
      return `<g style="animation:fadeUp .4s ${delay}s cubic-bezier(.33,1,.68,1) both">
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
  const [wOpen, wClose] = responsiveWrap(W, responsive);

  return `${svgOpen(W, H, responsive, LANG_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${bgW}" height="${H}" rx="16" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  ${wOpen}
  <g class="title">
  <text x="${W / 2}" y="${titleY}" fill="${c.textPrimary}" font-size="20" font-weight="600"
    text-anchor="middle" font-family="${FONT}">Most Used Languages</text>
  </g>
  <rect x="${padX}" y="${barY}" width="${innerW}" height="${barH}" rx="6" fill="${c.progressBg}" class="bar"/>
  <clipPath id="bc">
    <rect x="${padX}" y="${barY}" width="0" height="${barH}" rx="6">
      <animate attributeName="width" from="0" to="${innerW}" dur="0.7s" begin="0.2s"
        calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
    </rect>
  </clipPath>
  <g clip-path="url(#bc)" class="bar">${barSegments}</g>
  ${legendItems}
  ${wClose}
</svg>`;
}
