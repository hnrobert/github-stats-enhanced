export const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python:     "#3572A5",
  Java:       "#b07219",
  "C++":      "#f34b7d",
  C:          "#555555",
  "C#":       "#239120",
  Go:         "#00ADD8",
  Rust:       "#dea584",
  Swift:      "#ffac45",
  Kotlin:     "#A97BFF",
  PHP:        "#4F5D95",
  Ruby:       "#701516",
  HTML:       "#e34c26",
  CSS:        "#1572B6",
  Vue:        "#4FC08D",
  React:      "#61DAFB",
  Shell:      "#89e051",
  Dockerfile: "#384d54",
  YAML:       "#cb171e",
  JSON:       "#292929",
  Markdown:   "#083fa1",
  SQL:        "#e38c00",
};

export function getLangColor(lang: string): string {
  return LANGUAGE_COLORS[lang] ?? "#586069";
}
