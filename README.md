# GitHub Stats Enhanced

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-GitHub%20Stats%20Enhanced-blue.svg?colorA=24292e&colorB=0366d6&style=flat&longCache=true&logo=github)](https://github.com/marketplace/actions/github-stats-enhanced)
[![License](https://img.shields.io/github/license/hnrobert/github-stats-enhanced)](https://github.com/hnrobert/github-stats-enhanced/blob/main/LICENSE)

A GitHub Action that generates beautiful SVG stat cards for your GitHub profile README — stats card, language distribution, and contribution heatmap.

<div align="center" style="max-width:800px;margin:0 auto">
<a href="https://github.com/hnrobert/hnrobert/tree/github-stats-enhanced"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/stats1-dark.svg" /><img src="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/stats1-light.svg" width="22%" alt="Stats 1" hspace="4" /></picture></a><a href="https://github.com/hnrobert/hnrobert/tree/github-stats-enhanced"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/stats2-dark.svg" /><img src="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/stats2-light.svg" width="22%" alt="Stats 2" hspace="4" /></picture></a><a href="https://github.com/hnrobert/hnrobert/tree/github-stats-enhanced"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/contributions-dark.svg" /><img src="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/contributions-light.svg" width="51%" alt="Contributions" hspace="4" /></picture></a>

<br/>

<a href="https://github.com/hnrobert/hnrobert/tree/github-stats-enhanced"><picture><source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/languages-dark.svg" /><img src="https://raw.githubusercontent.com/hnrobert/hnrobert/github-stats-enhanced/languages-light.svg" width="97%" alt="Languages" /></picture></a>
</div>

## Cards

Each card is generated in three theme variants (`adaptive`, `dark`, `light`) plus a `-responsive` variant (when `responsive: "true"`).

| File | Description |
|------|-------------|
| `stats1.svg` | Followers + Total Stars |
| `stats2.svg` | Public Repos + Contributed Repos |
| `contributions.svg` | Total commits + yearly breakdown (commits, PRs, issues, reviews) |
| `languages.svg` | Top languages with color-coded bar and percentage legend |

`stats1.svg` / `stats2.svg` / `contributions.svg` / `languages.svg` use the configured `theme` (default: `adaptive`).  
`*-adaptive.svg`, `*-dark.svg`, `*-light.svg` are always generated regardless of theme.  
`*-responsive.svg` (e.g. `stats1-adaptive-responsive.svg`) are generated when `responsive: "true"` — these use `width="100%"` and scale to the container.

## Themes

| Theme | Behavior |
|-------|----------|
| `adaptive` | Single SVG with embedded CSS variables + `@media (prefers-color-scheme: dark)` — auto-switches with the viewer's OS/browser setting |
| `dark` | Fixed dark background (#0d1117) |
| `light` | Fixed light background (#ffffff) |

**`adaptive` is the default and recommended theme.** One URL works everywhere — no `<picture>` wrapper needed.

## Setup

### 1. Create a profile repository

Create a repo named `<your-username>/<your-username>` (e.g. `hnrobert/hnrobert`).

### 2. Add the workflow

Copy [`examples/github-stats.yml`](examples/github-stats.yml) to `.github/workflows/github-stats.yml` in your profile repo:

```yaml
name: GitHub Stats

on:
  schedule:
    - cron: "30 0 * * *" # daily at 00:30 UTC
  push:
    paths:
      - ".github/workflows/github-stats.yml"
  workflow_dispatch:
    inputs:
      username:
        description: "GitHub username (defaults to repo owner)"
        required: false
      theme:
        description: "Card theme: adaptive, dark, or light"
        required: false
        default: "adaptive"

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@main

      - name: Generate GitHub Stats SVGs
        uses: hnrobert/github-stats-enhanced@main
        with:
          github_user_name: ${{ inputs.username || github.repository_owner }}
          # Token priority: SELF_GITHUB_TOKEN > GITHUB_TOKEN (auto-provided)
          # self_github_token: ${{ secrets.SELF_GITHUB_TOKEN }}  # uncomment to use PAT
          github_token: ${{ secrets.GITHUB_TOKEN }}

          # Pipeline mode: "all" | "fetch" | "generate"
          mode: "all"

          # Output directory for generated SVG files
          output_dir: dist

          # Card theme: adaptive (follows system dark/light), dark, light
          theme: ${{ inputs.theme || 'adaptive' }}

          # Responsive SVGs (width="100%", scales to container)
          # Set to "false" for fixed pixel dimensions
          responsive: "true"
          generate_report: "true"   # also writes README.md + index.html

          # --- Card dimensions (pixels) ---
          # stats_width: "220"
          # stats_height: "200"
          # contributions_width: "460"
          # contributions_height: "180"
          # languages_width: "500"

          # Number of languages to display (default: 8)
          # languages_count: "8"

          # Comma-separated languages to exclude from language stats
          # exclude_languages: "HTML,CSS,SCSS"

          # Comma-separated owner/repo pairs to exclude from language stats
          # exclude_repos: "your-username/some-private-repo"

          # Comma-separated owner/repo pairs to exclude from contribution stats only
          # contrib_exclude_repos: "your-username/some-private-repo"

          # Weight contributed (non-own) repo languages by your commit ratio
          # Set to "false" to count all languages at full weight
          # weight_contributed_repos: "true"

          # Repository where SVGs are stored (defaults to current repo name, then github_user_name)
          # target_repo: "your-username"

          # Branch where SVGs are pushed and served from
          # target_branch: "github-stats-enhanced"

      - name: Deploy to github-stats-enhanced branch
        uses: crazy-max/ghaction-github-pages@v5
        with:
          target_branch: github-stats-enhanced
          build_dir: dist
          commit_message: "chore: update GitHub stats [skip ci]"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Use in your README

**Recommended — adaptive (auto dark/light, works everywhere):**

```markdown
![Stats 1](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats1-adaptive.svg)
![Stats 2](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats2-adaptive.svg)
![Contributions](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/contributions-adaptive.svg)
![Languages](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/languages-adaptive.svg)
```

**Responsive variants (scale to container width, generated when `responsive: "true"`):**

```markdown
![Stats 1](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats1-adaptive-responsive.svg)
![Stats 2](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats2-adaptive-responsive.svg)
![Contributions](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/contributions-adaptive-responsive.svg)
![Languages](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/languages-adaptive-responsive.svg)
```

**Fixed dark/light variants (explicit control with `<picture>`):**

```html
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats1-dark.svg">
  <img src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/YOUR_BRANCH/stats1-light.svg">
</picture>
```

## Token setup

The action looks for a token in this priority order:

1. `self_github_token` input (or `SELF_GITHUB_TOKEN` env var) — your personal access token
2. `github_token` input (or `GITHUB_TOKEN` env var) — the auto-provided Actions token

The default `GITHUB_TOKEN` works for public profile stats. Use a PAT (`self_github_token`) if you want:

- Private repository language data
- Organization contribution stats
- More accurate data across repos you don't own

To create a PAT: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens.  
Required scopes: **Contents** (read) on your repos + **Metadata** (read).

Add it as a secret named `SELF_GITHUB_TOKEN` in your profile repo, then:

```yaml
with:
  self_github_token: ${{ secrets.SELF_GITHUB_TOKEN }}
```

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `github_user_name` | repo owner | GitHub username to generate stats for |
| `self_github_token` | — | Personal access token. Takes priority over `GITHUB_TOKEN`. Use for private repos or org stats |
| `github_token` | — | Fallback token. The auto-provided `GITHUB_TOKEN` is used if neither token is set |
| `mode` | `all` | `all` (fetch + generate), `fetch` (API → stats.yml), `generate` (stats.yml → SVGs) |
| `output_dir` | `dist` | Output directory for generated SVGs |
| `theme` | `adaptive` | `adaptive`, `dark`, or `light` |
| `responsive` | `true` | Generate `-responsive` suffixed SVGs with `width="100%"`. Fixed-size files are always generated |
| `exclude_languages` | — | Comma-separated languages to exclude from the languages card |
| `exclude_repos` | — | Comma-separated `owner/repo` to exclude from language stats |
| `contrib_exclude_repos` | — | Comma-separated `owner/repo` to exclude from contribution stats only |
| `weight_contributed_repos` | `true` | Set to `false` to count contributed repo languages at full weight instead of by commit ratio |
| `languages_count` | `8` | Number of languages to display |
| `stats_width` | `220` | Stats card width (px) |
| `stats_height` | auto | Stats card height (px). Computed from content if not set |
| `contributions_width` | `460` | Contributions card width (px) |
| `contributions_height` | auto | Contributions card height (px). Computed from content if not set |
| `languages_width` | `500` | Languages card width (px) |
| `stats_min_width` | `160` | Minimum width for stats cards in responsive mode (px) |
| `contributions_min_width` | `280` | Minimum width for contributions card in responsive mode (px) |
| `languages_min_width` | `300` | Minimum width for languages card in responsive mode (px) |
| `generate_report` | `true` | Also write `README.md` (stats report) and `index.html` (demo page) |
| `target_repo` | repo name / username | Repository name where SVGs are stored |
| `target_branch` | `github-stats-enhanced` | Branch where SVGs are pushed and served from |
| `data_file` | `{output_dir}/stats.yml` | Path to the stats YAML file (used by `fetch` to write, `generate` to read) |

## Local development

```bash
bun install
# Fetch stats and generate SVGs to ./output/
GITHUB_TOKEN=your_token bun scripts/test-local.ts your_username

# Use cached stats (skip API call)
bun scripts/test-local.ts --from-cache

# Fetch only (no SVG generation)
GITHUB_TOKEN=your_token bun scripts/test-local.ts your_username --fetch-only
```

Open `output/index.html` to preview the generated cards.

## Build for action deployment

```bash
bun run build
# Outputs dist/index.js — referenced by action.yml
```
