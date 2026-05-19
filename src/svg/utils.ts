export type Theme = "dark" | "light";

export interface ThemeColors {
  bg: string;
  border: string;
  titleColor: string;
  textColor: string;
  subTextColor: string;
  statNumberColor: string;
  progressBg: string;
}

export const THEMES: Record<Theme, ThemeColors> = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    titleColor: "#58a6ff",
    textColor: "#e6edf3",
    subTextColor: "#8b949e",
    statNumberColor: "#58a6ff",
    progressBg: "#21262d",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    titleColor: "#0969da",
    textColor: "#1f2328",
    subTextColor: "#57606a",
    statNumberColor: "#0969da",
    progressBg: "#eaeef2",
  },
};

export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#239120",
  Go: "#00ADD8",
  Rust: "#dea584",
  Swift: "#ffac45",
  Kotlin: "#A97BFF",
  PHP: "#4F5D95",
  Ruby: "#701516",
  HTML: "#e34c26",
  CSS: "#1572B6",
  Vue: "#4FC08D",
  Shell: "#89e051",
  Dockerfile: "#384d54",
};

export function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "#586069";
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}
