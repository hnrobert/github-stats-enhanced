export type Theme = "dark" | "light" | "adaptive";

export interface ThemeColors {
  bg: string;
  border: string;
  titleColor: string;
  textColor: string;
  subTextColor: string;
  statNumberColor: string;
  progressBg: string;
  heatmapColor: string;
}

export const THEMES: Record<"dark" | "light", ThemeColors> = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    titleColor: "#58a6ff",
    textColor: "#e6edf3",
    subTextColor: "#8b949e",
    statNumberColor: "#58a6ff",
    progressBg: "#21262d",
    heatmapColor: "#58a6ff",
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    titleColor: "#0969da",
    textColor: "#1f2328",
    subTextColor: "#57606a",
    statNumberColor: "#0969da",
    progressBg: "#eaeef2",
    heatmapColor: "#0969da",
  },
};

// CSS variable references used when theme === "adaptive"
export const ADAPTIVE_COLORS: ThemeColors = {
  bg: "var(--s-bg)",
  border: "var(--s-bd)",
  titleColor: "var(--s-ti)",
  textColor: "var(--s-tx)",
  subTextColor: "var(--s-st)",
  statNumberColor: "var(--s-nu)",
  progressBg: "var(--s-pb)",
  heatmapColor: "var(--s-hm)",
};

/** Returns the <style> block for adaptive SVGs; empty string for fixed themes. */
export function getAdaptiveStyle(theme: Theme): string {
  if (theme !== "adaptive") return "";
  const l = THEMES.light;
  const d = THEMES.dark;
  return `
  <style>
    :root {
      --s-bg:${l.bg};--s-bd:${l.border};--s-ti:${l.titleColor};
      --s-tx:${l.textColor};--s-st:${l.subTextColor};
      --s-nu:${l.statNumberColor};--s-pb:${l.progressBg};--s-hm:${l.heatmapColor};
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --s-bg:${d.bg};--s-bd:${d.border};--s-ti:${d.titleColor};
        --s-tx:${d.textColor};--s-st:${d.subTextColor};
        --s-nu:${d.statNumberColor};--s-pb:${d.progressBg};--s-hm:${d.heatmapColor};
      }
    }
    .hdr{animation:fadeIn .8s ease-in-out forwards}
    @keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
  </style>`;
}

export function getColors(theme: Theme): ThemeColors {
  return theme === "adaptive" ? ADAPTIVE_COLORS : THEMES[theme];
}

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
