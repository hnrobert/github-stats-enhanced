import type { CardOptions } from "../svg/helpers.ts";

export function getInput(name: string): string {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
}

export function getIntInput(name: string): number | undefined {
  const v = getInput(name).trim();
  if (!v) return undefined;
  const n = parseInt(v, 10);
  return isNaN(n) ? undefined : n;
}

export function getBoolInput(name: string): boolean {
  return getInput(name).trim().toLowerCase() === "true";
}

export function buildCardOpts(responsive: boolean): {
  statsOpts: CardOptions;
  contribOpts: CardOptions;
  langOpts: CardOptions;
} {
  return {
    statsOpts: {
      width:    getIntInput("stats_width"),
      height:   getIntInput("stats_height"),
      responsive,
    },
    contribOpts: {
      width:    getIntInput("contributions_width"),
      height:   getIntInput("contributions_height"),
      responsive,
    },
    langOpts: {
      width:         getIntInput("languages_width"),
      languageCount: getIntInput("languages_count"),
      responsive,
    },
  };
}
