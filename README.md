# github-stats-enhanced

A GitHub Action that generates beautiful SVG stat cards for your GitHub profile README — stats card, language distribution, and contribution heatmap.

## Cards

Each card is generated in three variants: `adaptive`, `dark`, and `light`.

| File | Description |
|------|-------------|
| `stats.svg` | Stars, forks, commits, repos, followers (with Octicons icons) |
| `languages.svg` | Top 8 languages with color-coded progress bars |
| `contributions.svg` | Yearly breakdown + 26-week activity heatmap |

`stats.svg` / `languages.svg` / `contributions.svg` use the configured `theme` (default: `adaptive`).  
`*-adaptive.svg`, `*-dark.svg`, `*-light.svg` are always generated regardless of theme.

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
    - cron: "30 0 * * *"   # daily at 00:30 UTC
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
      - uses: actions/checkout@v4

      - name: Generate GitHub Stats SVGs
        uses: hnrobert/github-stats-enhanced@main
        with:
          github_user_name: ${{ inputs.username || github.repository_owner }}
          github_token: ${{ secrets.GITHUB_TOKEN }}
          output_dir: dist
          theme: ${{ inputs.theme || 'adaptive' }}
          # Optional: comma-separated languages to exclude from the languages card
          # exclude_languages: "HTML,CSS,SCSS"
          # Optional: comma-separated owner/repo pairs to exclude from stats
          # exclude_repos: "your-username/some-private-repo"

      - name: Deploy to output branch
        uses: crazy-max/ghaction-github-pages@v4
        with:
          target_branch: output
          build_dir: dist
          commit_message: "chore: update GitHub stats [skip ci]"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### 3. Use in your README

**Recommended — adaptive (works in all themes automatically):**

```markdown
![GitHub Stats](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/stats-adaptive.svg)
![Top Languages](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/languages-adaptive.svg)
![Contributions](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/contributions-adaptive.svg)
```

**Fixed dark/light variants (if you prefer explicit control):**

```markdown
![GitHub Stats](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/stats-dark.svg)
```

```html
<!-- Manual dark/light switch with <picture> -->
<picture>
  <source media="(prefers-color-scheme: dark)"
    srcset="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/stats-dark.svg">
  <img src="https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/stats-light.svg">
</picture>
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `github_user_name` | yes | — | GitHub username |
| `github_token` | yes | — | Use `secrets.GITHUB_TOKEN` |
| `output_dir` | no | `dist` | Output directory |
| `theme` | no | `adaptive` | `adaptive`, `dark`, or `light` |
| `exclude_languages` | no | — | Comma-separated languages to exclude |
| `exclude_repos` | no | — | Comma-separated `owner/repo` to exclude |

## Local development

```bash
bun install
GITHUB_TOKEN=your_token GITHUB_USER_NAME=your_username bun src/index.ts
```

## Build for action deployment

```bash
bun run build
# Outputs dist/index.js — referenced by action.yml
```
