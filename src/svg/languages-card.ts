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
    const H = opts.height ?? 100;
    const [wOpen, wClose] = responsiveWrap(W, responsive);
    return `${svgOpen(W, H, responsive, LANG_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${bgW}" height="${H}" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="0.5"/>
  ${wOpen}<text x="${W / 2}" y="${H / 2 + 5}" fill="${c.textSecondary}" font-size="13" text-anchor="middle" font-family="${FONT}">No language data</text>${wClose}
</svg>`;
  }

  const titleY = 24;
  const barY = 36;
  const barH = 8;

  const totalPct = langs.reduce((s, l) => s + l.percentage, 0);

  let barCursor = padX;
  const barSegments = langs.map((lang, i) => {
    const color = getLangColor(lang.language);
    const normalizedPct = totalPct > 0 ? (lang.percentage / totalPct) * 100 : 0;
    const isLast = i === langs.length - 1;
    const segW = isLast
      ? (padX + innerW - barCursor)
      : Math.max(2, Math.round((normalizedPct / 100) * innerW));
    const seg = `<rect x="${barCursor}" y="${barY}" width="${segW}" height="${barH}" fill="${color}"/>`;
    barCursor += segW;
    return seg;
  }).join("");

  const legendStartY = barY + barH + 10;
  const itemPadX = 6;
  const itemPadY = 3;
  const dotR = 4;
  const fontSize = 10;
  const charW = 6.0;

  const itemWidths = langs.map(lang => {
    const nameLen = lang.language.length * charW;
    const pctLen = `${lang.percentage.toFixed(1)}%`.length * charW;
    return Math.ceil(dotR * 2 + 6 + nameLen + 4 + pctLen + itemPadX * 2 + 4);
  });

  const rowGap = 6;
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

  const H = opts.height ?? (legendStartY + rows.length * (itemH + rowGap) - rowGap + 14);

  const legendItems = rows.map((row, ri) => {
    const rowY = legendStartY + ri * (itemH + rowGap);
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
        <rect x="${cx}" y="${rowY}" width="${iW}" height="${itemH}" rx="6"
          fill="rgba(128,128,128,0.07)" stroke="rgba(128,128,128,0.15)" stroke-width="1"/>
        <circle cx="${cx + itemPadX + dotR}" cy="${rowY + itemH / 2}" r="${dotR}" fill="${color}"/>
        <text x="${nameX}" y="${rowY + itemH / 2 + 4}" fill="${c.textPrimary}" font-size="${fontSize}"
          font-weight="500" font-family="${FONT}">${escapeXml(lang.language)}</text>
        <text x="${pctX}" y="${rowY + itemH / 2 + 4}" fill="${c.textSecondary}" font-size="${fontSize - 1}"
          font-weight="600" text-anchor="end" font-family="${FONT}">${pct}</text>
      </g>`;
    }).join("");
  }).join("");

  const [wOpen, wClose] = responsiveWrap(W, responsive);

  return `${svgOpen(W, H, responsive, LANG_MIN_W)}
  ${getCardStyle(theme)}
  <rect class="card" width="${bgW}" height="${H}" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="0.5"/>
  ${wOpen}
  <g class="title">
  <text x="${W / 2}" y="${titleY}" fill="${c.textPrimary}" font-size="14" font-weight="600"
    text-anchor="middle" font-family="${FONT}">Most Used Languages</text>
  </g>
  <rect x="${padX}" y="${barY}" width="${innerW}" height="${barH}" rx="5" fill="${c.progressBg}" class="bar"/>
  <clipPath id="bc">
    <rect x="${padX}" y="${barY}" width="0" height="${barH}" rx="5">
      <animate attributeName="width" from="0" to="${innerW}" dur="0.7s" begin="0.2s"
        calcMode="spline" keySplines="0.4 0 0.2 1" fill="freeze"/>
    </rect>
  </clipPath>
  <g clip-path="url(#bc)" class="bar">${barSegments}</g>
  ${legendItems}
  ${wClose}
</svg>`;
}


