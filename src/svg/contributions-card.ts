import type { GitHubStats } from "../github-api.ts";
import { THEMES, formatNumber, type Theme } from "./utils.ts";

export function generateContributionsCard(stats: GitHubStats, theme: Theme = "dark"): string {
  const c = THEMES[theme];
  const { yearlyContributions: yc, totalCommits } = stats.stats;

  // Build contribution heatmap from weeks data
  const weeks = yc.weeks.slice(-26); // last 26 weeks
  const maxCount = Math.max(
    1,
    ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount))
  );

  const cellSize = 10;
  const cellGap = 2;
  const heatmapX = 25;
  const heatmapY = 110;

  const heatmapCells = weeks.map((week, wi) => {
    return week.contributionDays.map((day, di) => {
      const x = heatmapX + wi * (cellSize + cellGap);
      const y = heatmapY + di * (cellSize + cellGap);
      const intensity = day.contributionCount / maxCount;
      const alpha = intensity === 0 ? 0.1 : 0.2 + intensity * 0.8;
      const fill = theme === "dark"
        ? `rgba(88,166,255,${alpha.toFixed(2)})`
        : `rgba(9,105,218,${alpha.toFixed(2)})`;
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2" fill="${fill}">
        <title>${day.date}: ${day.contributionCount}</title>
      </rect>`;
    }).join("");
  }).join("");

  const contribItems = [
    { label: "Commits", value: formatNumber(yc.commits) },
    { label: "Pull Requests", value: formatNumber(yc.pullRequests) },
    { label: "Issues", value: formatNumber(yc.issues) },
    { label: "Reviews", value: formatNumber(yc.reviews) },
  ];

  const itemW = 110;
  const contribRow = contribItems.map((item, i) => {
    const x = 25 + i * itemW;
    return `
    <g transform="translate(${x}, 65)">
      <text x="0" y="0" fill="${c.statNumberColor}" font-size="18" font-weight="700"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${item.value}</text>
      <text x="0" y="18" fill="${c.subTextColor}" font-size="11"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${item.label}</text>
    </g>`;
  }).join("");

  const heatmapW = weeks.length * (cellSize + cellGap);
  const height = heatmapY + 7 * (cellSize + cellGap) + 20;

  return `<svg width="495" height="${height}" viewBox="0 0 495 ${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="495" height="${height}" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="25" y="35" fill="${c.titleColor}" font-size="14" font-weight="600"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Contributions (Last Year)</text>
  <text x="470" y="35" fill="${c.subTextColor}" font-size="12" text-anchor="end"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Total: ${formatNumber(totalCommits)} commits</text>
  <line x1="25" y1="45" x2="470" y2="45" stroke="${c.border}" stroke-width="1"/>
  ${contribRow}
  <text x="25" y="105" fill="${c.subTextColor}" font-size="11"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Activity — last 26 weeks</text>
  ${heatmapCells}
</svg>`;
}
