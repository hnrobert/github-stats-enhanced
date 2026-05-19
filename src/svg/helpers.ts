export interface CardOptions {
  width?: number;
  height?: number;
  responsive?: boolean;
  languageCount?: number;
}

export const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

export function svgOpen(w: number, h: number, responsive = false): string {
  const wAttr = responsive ? `width="100%"` : `width="${w}"`;
  const hAttr = responsive ? `` : `height="${h}"`;
  return `<svg ${wAttr} ${hAttr} viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">`;
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
