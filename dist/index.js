// src/index.ts
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// src/github-api.ts
var GRAPHQL_QUERY = `
  query($username: String!, $from: DateTime!) {
    user(login: $username) {
      createdAt
      lastYearContributions: contributionsCollection(from: $from) {
        totalCommitContributions
        totalIssueContributions
        totalPullRequestContributions
        totalPullRequestReviewContributions
        totalRepositoriesWithContributedCommits
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
        commitContributionsByRepository(maxRepositories: 100) {
          repository {
            name
            owner { login }
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges { size node { name } }
            }
          }
          contributions(first: 1) { totalCount }
        }
      }
      ownRepositories: repositories(first: 100, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false) {
        nodes {
          stargazerCount
          forkCount
          owner { login }
          languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
            edges { size node { name } }
          }
        }
      }
    }
  }
`;
async function graphql(token, query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "User-Agent": "github-stats-enhanced"
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok)
    throw new Error(`GraphQL request failed: ${res.status}`);
  const data = await res.json();
  if (data.errors)
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  return data.data;
}
async function fetchYearCommits(token, username, year, excludeRepos) {
  const yearStart = new Date(`${year}-01-01T00:00:00Z`).toISOString();
  const yearEnd = new Date(`${year}-12-31T23:59:59Z`).toISOString();
  const query = `
    query($username: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $username) {
        contributionsCollection(from: $from, to: $to) {
          totalCommitContributions
          commitContributionsByRepository(maxRepositories: 100) {
            repository { nameWithOwner }
            contributions(first: 1) { totalCount }
          }
        }
      }
    }
  `;
  const data = await graphql(token, query, { username, from: yearStart, to: yearEnd });
  const col = data.user?.contributionsCollection;
  const total = col?.totalCommitContributions ?? 0;
  const repos = col?.commitContributionsByRepository ?? [];
  const excluded = repos.filter((r) => excludeRepos.has(r.repository?.nameWithOwner ?? "")).reduce((s, r) => s + (r.contributions?.totalCount ?? 0), 0);
  return total - excluded;
}
async function fetchGitHubStats(token, username, options = {}) {
  const excludeLanguages = new Set(options.excludeLanguages ?? []);
  const excludeRepos = new Set(options.excludeRepos ?? []);
  const userRes = await fetch(`https://api.github.com/users/${username}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "github-stats-enhanced"
    }
  });
  if (!userRes.ok)
    throw new Error(`Failed to fetch user: ${userRes.status}`);
  const userData = await userRes.json();
  const oneYearAgo = new Date;
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const data = await graphql(token, GRAPHQL_QUERY, {
    username,
    from: oneYearAgo.toISOString()
  });
  const gqlUser = data.user;
  const ownRepos = gqlUser.ownRepositories.nodes;
  const lastYear = gqlUser.lastYearContributions;
  const createdYear = new Date(gqlUser.createdAt).getFullYear();
  const currentYear = new Date().getFullYear();
  let totalCommits = 0;
  for (let y = createdYear;y <= currentYear; y++) {
    totalCommits += await fetchYearCommits(token, username, y, excludeRepos);
  }
  const totalStars = ownRepos.reduce((s, r) => s + (r.stargazerCount ?? 0), 0);
  const totalForks = ownRepos.reduce((s, r) => s + (r.forkCount ?? 0), 0);
  const langMap = new Map;
  for (const repo of ownRepos) {
    for (const edge of repo.languages?.edges ?? []) {
      const lang = edge.node.name;
      if (!excludeLanguages.has(lang)) {
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size);
      }
    }
  }
  for (const contrib of lastYear.commitContributionsByRepository ?? []) {
    const repoName = `${contrib.repository?.owner?.login}/${contrib.repository?.name}`;
    if (excludeRepos.has(repoName))
      continue;
    const commits = contrib.contributions?.totalCount ?? 0;
    if (commits === 0)
      continue;
    const weight = Math.min(commits / 100, 0.8);
    for (const edge of contrib.repository?.languages?.edges ?? []) {
      const lang = edge.node.name;
      if (!excludeLanguages.has(lang)) {
        langMap.set(lang, (langMap.get(lang) ?? 0) + edge.size * weight);
      }
    }
  }
  const totalLangSize = Array.from(langMap.values()).reduce((s, v) => s + v, 0);
  const languageStats = Array.from(langMap.entries()).map(([language, count]) => ({
    language,
    count,
    percentage: totalLangSize > 0 ? Math.round(count / totalLangSize * 1e4) / 100 : 0
  })).sort((a, b) => b.count - a.count).slice(0, 8);
  return {
    user: {
      login: userData.login,
      name: userData.name,
      avatar_url: userData.avatar_url,
      bio: userData.bio,
      location: userData.location,
      public_repos: userData.public_repos,
      followers: userData.followers,
      following: userData.following,
      created_at: userData.created_at
    },
    stats: {
      totalStars,
      totalForks,
      totalCommits,
      contributedRepos: lastYear.totalRepositoriesWithContributedCommits ?? 0,
      languageStats,
      yearlyContributions: {
        year: currentYear,
        total: lastYear.contributionCalendar?.totalContributions ?? 0,
        commits: lastYear.totalCommitContributions ?? 0,
        issues: lastYear.totalIssueContributions ?? 0,
        pullRequests: lastYear.totalPullRequestContributions ?? 0,
        reviews: lastYear.totalPullRequestReviewContributions ?? 0,
        weeks: lastYear.contributionCalendar?.weeks ?? []
      }
    }
  };
}

// src/svg/utils.ts
var THEMES = {
  dark: {
    bg: "#0d1117",
    border: "#30363d",
    titleColor: "#58a6ff",
    textColor: "#e6edf3",
    subTextColor: "#8b949e",
    statNumberColor: "#58a6ff",
    progressBg: "#21262d",
    heatmapColor: "#58a6ff"
  },
  light: {
    bg: "#ffffff",
    border: "#d0d7de",
    titleColor: "#0969da",
    textColor: "#1f2328",
    subTextColor: "#57606a",
    statNumberColor: "#0969da",
    progressBg: "#eaeef2",
    heatmapColor: "#0969da"
  }
};
var ADAPTIVE_COLORS = {
  bg: "var(--s-bg)",
  border: "var(--s-bd)",
  titleColor: "var(--s-ti)",
  textColor: "var(--s-tx)",
  subTextColor: "var(--s-st)",
  statNumberColor: "var(--s-nu)",
  progressBg: "var(--s-pb)",
  heatmapColor: "var(--s-hm)"
};
function getAdaptiveStyle(theme) {
  if (theme !== "adaptive")
    return "";
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
function getColors(theme) {
  return theme === "adaptive" ? ADAPTIVE_COLORS : THEMES[theme];
}
var LANGUAGE_COLORS = {
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
  Dockerfile: "#384d54"
};
function getLangColor(lang) {
  return LANGUAGE_COLORS[lang] ?? "#586069";
}
function escapeXml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function formatNumber(n) {
  if (n >= 1e6)
    return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000)
    return `${(n / 1000).toFixed(1)}k`;
  return n.toLocaleString();
}

// src/svg/stats-card.ts
function generateStatsCard(stats, theme = "adaptive") {
  const c = getColors(theme);
  const { user, stats: s } = stats;
  const title = escapeXml(user.name ?? user.login);
  const items = [
    { label: "Total Stars", value: formatNumber(s.totalStars) },
    { label: "Total Forks", value: formatNumber(s.totalForks) },
    { label: "Total Commits", value: formatNumber(s.totalCommits) },
    { label: "Contributed To", value: formatNumber(s.contributedRepos) },
    { label: "Repositories", value: formatNumber(user.public_repos) },
    { label: "Followers", value: formatNumber(user.followers) }
  ];
  const cols = 3;
  const cellW = 155;
  const cellH = 70;
  const startX = 20;
  const startY = 65;
  const cells = items.map((item, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * cellW;
    const y = startY + row * cellH;
    return `
    <g transform="translate(${x}, ${y})">
      <text x="0" y="0" fill="${c.statNumberColor}" font-size="22" font-weight="700"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${item.value}</text>
      <text x="0" y="20" fill="${c.subTextColor}" font-size="12"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(item.label)}</text>
    </g>`;
  }).join("");
  const fixedAnim = theme !== "adaptive" ? `<style>.hdr{animation:fadeIn .8s ease-in-out forwards}@keyframes fadeIn{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}</style>` : "";
  return `<svg width="495" height="195" viewBox="0 0 495 195" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}${fixedAnim}
  <rect width="495" height="195" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <g class="hdr">
    <text x="25" y="35" fill="${c.titleColor}" font-size="14" font-weight="600"
      font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${title}&apos;s GitHub Stats</text>
    <line x1="25" y1="45" x2="470" y2="45" stroke="${c.border}" stroke-width="1"/>
  </g>
  ${cells}
</svg>`;
}

// src/svg/languages-card.ts
function generateLanguagesCard(stats, theme = "adaptive") {
  const c = getColors(theme);
  const langs = stats.stats.languageStats.slice(0, 8);
  if (langs.length === 0) {
    return `<svg width="495" height="195" viewBox="0 0 495 195" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="495" height="195" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="247" y="105" fill="${c.subTextColor}" font-size="14" text-anchor="middle"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">No language data available</text>
</svg>`;
  }
  const cols = 2;
  const colW = 220;
  const rowH = 42;
  const startX = 25;
  const startY = 60;
  const barW = 190;
  const langItems = langs.map((lang, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (colW + 10);
    const y = startY + row * rowH;
    const color = getLangColor(lang.language);
    const pct = Math.min(lang.percentage, 100);
    const filledW = Math.round(pct / 100 * barW);
    return `
    <g transform="translate(${x}, ${y})">
      <circle cx="6" cy="6" r="6" fill="${color}"/>
      <text x="18" y="10" fill="${c.textColor}" font-size="12" font-weight="500"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${escapeXml(lang.language)}</text>
      <text x="${barW}" y="10" fill="${c.subTextColor}" font-size="11" text-anchor="end"
        font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">${pct.toFixed(1)}%</text>
      <rect x="0" y="18" width="${barW}" height="5" rx="3" fill="${c.progressBg}"/>
      <rect x="0" y="18" width="${filledW}" height="5" rx="3" fill="${color}"/>
    </g>`;
  }).join("");
  const height = startY + Math.ceil(langs.length / cols) * rowH + 20;
  return `<svg width="495" height="${height}" viewBox="0 0 495 ${height}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
  <rect width="495" height="${height}" rx="10" fill="${c.bg}" stroke="${c.border}" stroke-width="1"/>
  <text x="25" y="35" fill="${c.titleColor}" font-size="14" font-weight="600"
    font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">Most Used Languages</text>
  <line x1="25" y1="45" x2="470" y2="45" stroke="${c.border}" stroke-width="1"/>
  ${langItems}
</svg>`;
}

// src/svg/contributions-card.ts
function generateContributionsCard(stats, theme = "adaptive") {
  const c = getColors(theme);
  const { yearlyContributions: yc, totalCommits } = stats.stats;
  const weeks = yc.weeks.slice(-26);
  const maxCount = Math.max(1, ...weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)));
  const cellSize = 10;
  const cellGap = 2;
  const heatmapX = 25;
  const heatmapY = 110;
  const heatmapCells = weeks.map((week, wi) => {
    return week.contributionDays.map((day, di) => {
      const x = heatmapX + wi * (cellSize + cellGap);
      const y = heatmapY + di * (cellSize + cellGap);
      const intensity = day.contributionCount / maxCount;
      const opacity = intensity === 0 ? 0.1 : (0.2 + intensity * 0.8).toFixed(2);
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="2"
        fill="${c.heatmapColor}" opacity="${opacity}"><title>${day.date}: ${day.contributionCount}</title></rect>`;
    }).join("");
  }).join("");
  const contribItems = [
    { label: "Commits", value: formatNumber(yc.commits) },
    { label: "Pull Requests", value: formatNumber(yc.pullRequests) },
    { label: "Issues", value: formatNumber(yc.issues) },
    { label: "Reviews", value: formatNumber(yc.reviews) }
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
  const height = heatmapY + 7 * (cellSize + cellGap) + 20;
  return `<svg width="495" height="${height}" viewBox="0 0 495 ${height}" xmlns="http://www.w3.org/2000/svg">
  ${getAdaptiveStyle(theme)}
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

// src/index.ts
function getInput(name) {
  return process.env[`INPUT_${name.replace(/ /g, "_").toUpperCase()}`] ?? "";
}
function setFailed(message) {
  process.exitCode = 1;
  process.stdout.write(`::error::${message.replace(/%/g, "%25").replace(/\r/g, "%0D").replace(/\n/g, "%0A")}${os.EOL}`);
}
function log(message) {
  process.stdout.write(`${message}${os.EOL}`);
}
(async () => {
  try {
    const username = getInput("github_user_name") || process.env.GITHUB_USER_NAME || "";
    const token = process.env.GITHUB_TOKEN || getInput("github_token");
    const outputDir = getInput("output_dir") || "dist";
    const theme = getInput("theme") || "adaptive";
    const excludeLanguages = getInput("exclude_languages").split(",").map((s) => s.trim()).filter(Boolean);
    const excludeRepos = getInput("exclude_repos").split(",").map((s) => s.trim()).filter(Boolean);
    if (!username)
      throw new Error("github_user_name is required");
    if (!token)
      throw new Error("GITHUB_TOKEN is required");
    log(`\uD83D\uDCCA Fetching GitHub stats for: ${username}`);
    const stats = await fetchGitHubStats(token, username, { excludeLanguages, excludeRepos });
    log(`✅ Fetched — ${stats.stats.totalCommits} commits, ${stats.stats.totalStars} stars`);
    fs.mkdirSync(outputDir, { recursive: true });
    const outputs = [
      { name: "stats.svg", content: generateStatsCard(stats, theme) },
      { name: "stats-adaptive.svg", content: generateStatsCard(stats, "adaptive") },
      { name: "stats-dark.svg", content: generateStatsCard(stats, "dark") },
      { name: "stats-light.svg", content: generateStatsCard(stats, "light") },
      { name: "languages.svg", content: generateLanguagesCard(stats, theme) },
      { name: "languages-adaptive.svg", content: generateLanguagesCard(stats, "adaptive") },
      { name: "languages-dark.svg", content: generateLanguagesCard(stats, "dark") },
      { name: "languages-light.svg", content: generateLanguagesCard(stats, "light") },
      { name: "contributions.svg", content: generateContributionsCard(stats, theme) },
      { name: "contributions-adaptive.svg", content: generateContributionsCard(stats, "adaptive") },
      { name: "contributions-dark.svg", content: generateContributionsCard(stats, "dark") },
      { name: "contributions-light.svg", content: generateContributionsCard(stats, "light") }
    ];
    for (const { name, content } of outputs) {
      const filePath = path.join(outputDir, name);
      fs.writeFileSync(filePath, content, "utf-8");
      log(`\uD83D\uDCBE ${filePath}`);
    }
    log(`
\uD83C\uDF89 Done! ${outputs.length} SVG files in ./${outputDir}/`);
    log(`
Recommended README usage (auto dark/light):`);
    log(`  ![Stats](https://raw.githubusercontent.com/${username}/${username}/output/stats-adaptive.svg)`);
    log(`  ![Languages](https://raw.githubusercontent.com/${username}/${username}/output/languages-adaptive.svg)`);
    log(`  ![Contributions](https://raw.githubusercontent.com/${username}/${username}/output/contributions-adaptive.svg)`);
  } catch (e) {
    setFailed(`Action failed: ${e.message}`);
  }
})();
