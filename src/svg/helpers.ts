export interface CardOptions {
  width?: number;
  height?: number;
  minWidth?: number;
  responsive?: boolean;
  languageCount?: number;
}

export const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

export function svgOpen(w: number, h: number, responsive = false, minW?: number): string {
  if (responsive) {
    const minStyle = minW ? ` style="min-width:${minW}px"` : "";
    return `<svg width="100%" viewBox="-1 -1 ${w + 2} ${h + 2}"${minStyle} xmlns="http://www.w3.org/2000/svg">`;
  }
  return `<svg width="${w + 2}" height="${h + 2}" viewBox="-1 -1 ${w + 2} ${h + 2}" xmlns="http://www.w3.org/2000/svg">`;
}

// Wraps content so background stretches but text/layout stays fixed-size and centered
export function responsiveWrap(w: number, responsive: boolean): [string, string] {
  if (!responsive) return ['', ''];
  return [
    `<svg x="50%" y="0" width="${w}" height="100%" overflow="visible"><g transform="translate(-${w / 2}, 0)">`,
    `</g></svg>`,
  ];
}

export function formatNumber(n: number): string {
  return n.toLocaleString();
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
