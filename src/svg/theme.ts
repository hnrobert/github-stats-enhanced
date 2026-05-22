export type Theme = "dark" | "light" | "adaptive";

export interface ThemeColors {
  bg: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accentBlue: string;
  progressBg: string;
}

export const THEMES: Record<"dark" | "light", ThemeColors> = {
  dark: {
    bg:           "rgba(15,23,42,0.8)",
    border:       "rgba(255,255,255,0.1)",
    textPrimary:  "#f8fafc",
    textSecondary:"#cbd5e1",
    accentBlue:   "#60a5fa",
    progressBg:   "#334155",
  },
  light: {
    bg:           "rgba(255,255,255,0.8)",
    border:       "rgba(0,0,0,0.1)",
    textPrimary:  "#1f2937",
    textSecondary:"#6b7280",
    accentBlue:   "#3b82f6",
    progressBg:   "#fae8ff",
  },
};

export const ADAPTIVE_COLORS: ThemeColors = {
  bg:           "var(--s-bg)",
  border:       "var(--s-bd)",
  textPrimary:  "var(--s-tp)",
  textSecondary:"var(--s-ts)",
  accentBlue:   "var(--s-ac)",
  progressBg:   "var(--s-pb)",
};

export function getColors(theme: Theme): ThemeColors {
  return theme === "adaptive" ? ADAPTIVE_COLORS : THEMES[theme];
}

export function getCardStyle(theme: Theme): string {
  const l = THEMES.light;
  const d = THEMES.dark;
  const themeBlock = theme === "adaptive" ? `
    svg{--s-bg:${l.bg};--s-bd:${l.border};--s-tp:${l.textPrimary};
      --s-ts:${l.textSecondary};--s-ac:${l.accentBlue};--s-pb:${l.progressBg};}
    @media(prefers-color-scheme:dark){svg{
      --s-bg:${d.bg};--s-bd:${d.border};--s-tp:${d.textPrimary};
      --s-ts:${d.textSecondary};--s-ac:${d.accentBlue};--s-pb:${d.progressBg};}}` : "";
  const ease = "cubic-bezier(.33,1,.68,1)";
  return `<style>
    ${themeBlock}
    @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .card{animation:fadeUp .5s ${ease} both}
    .title{animation:fadeUp .45s .08s ${ease} both}
    .i0{animation:fadeUp .45s .14s ${ease} both}
    .i1{animation:fadeUp .45s .24s ${ease} both}
    .i2{animation:fadeUp .45s .34s ${ease} both}
    .i3{animation:fadeUp .45s .44s ${ease} both}
    .i4{animation:fadeUp .45s .54s ${ease} both}
    .bar{animation:fadeIn .3s .25s ease both}
  </style>`;
}
