export type Theme = "dark" | "light" | "adaptive";

export interface ThemeColors {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accentBlue: string;
  progressBg: string;
}

// Exact values from homepage theme.css
export const THEMES: Record<"dark" | "light", ThemeColors> = {
  dark: {
    bg: "rgba(15,23,42,0.8)",       // --glass-bg dark
    border: "rgba(255,255,255,0.1)", // --glass-border dark
    textPrimary: "#f8fafc",          // --text-primary dark
    textSecondary: "#cbd5e1",        // --text-secondary dark
    accentBlue: "#60a5fa",           // --accent-blue dark
    progressBg: "#334155",           // --bg-tertiary dark
  },
  light: {
    bg: "rgba(255,255,255,0.8)",     // --glass-bg light
    border: "rgba(255,255,255,0.2)", // --glass-border light
    textPrimary: "#1f2937",          // --text-primary light
    textSecondary: "#6b7280",        // --text-secondary light
    accentBlue: "#3b82f6",           // --accent-blue light
    progressBg: "#fae8ff",           // --bg-tertiary light
  },
};

export const ADAPTIVE_COLORS: ThemeColors = {
  bg: "var(--s-bg)",
  border: "var(--s-bd)",
  textPrimary: "var(--s-tp)",
  textSecondary: "var(--s-ts)",
  accentBlue: "var(--s-ac)",
  progressBg: "var(--s-pb)",
};

export function getAdaptiveStyle(theme: Theme): string {
  if (theme !== "adaptive") return "";
  const l = THEMES.light;
  const d = THEMES.dark;
  return `<style>
    :root{--s-bg:${l.bg};--s-bd:${l.border};--s-tp:${l.textPrimary};
      --s-ts:${l.textSecondary};--s-ac:${l.accentBlue};--s-pb:${l.progressBg};}
    @media(prefers-color-scheme:dark){:root{
      --s-bg:${d.bg};--s-bd:${d.border};--s-tp:${d.textPrimary};
      --s-ts:${d.textSecondary};--s-ac:${d.accentBlue};--s-pb:${d.progressBg};}}
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
  React: "#61DAFB",
  Shell: "#89e051",
  Dockerfile: "#384d54",
  YAML: "#cb171e",
  JSON: "#292929",
  Markdown: "#083fa1",
  SQL: "#e38c00",
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
  return n.toLocaleString();
}

export const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;
