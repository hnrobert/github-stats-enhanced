# github-stats-enhanced

A GitHub Action that generates beautiful SVG stat cards for your GitHub profile README — stats card, language distribution, and contribution heatmap.

## Cards

| Card | Description |
|------|-------------|
| `stats-dark.svg` / `stats-light.svg` | Stars, forks, commits, repos, followers |
| `languages-dark.svg` / `languages-light.svg` | Top 8 languages with progress bars |
| `contributions-dark.svg` / `contributions-light.svg` | Yearly breakdown + 26-week heatmap |

## Setup

### 1. Create a profile repository

Create a repo named `<your-username>/<your-username>` (e.g. `hnrobert/hnrobert`).

### 2. Add the workflow

Copy `.github/workflows/generate-stats.yml` to your profile repo, or reference this action:

```yaml
- name: Generate GitHub Stats SVGs
  uses: hnrobert/github-stats-enhanced@main
  with:
    github_user_name: ${{ github.repository_owner }}
    github_token: ${{ secrets.GITHUB_TOKEN }}
    output_dir: dist
    theme: dark
```

### 3. Use in your README

After the first run, SVGs are pushed to the `output` branch:

```markdown
![GitHub Stats](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/stats-dark.svg)
![Top Languages](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/languages-dark.svg)
![Contributions](https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_USERNAME/output/contributions-dark.svg)
```

For automatic dark/light switching:

```html
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
| `theme` | no | `dark` | `dark` or `light` |
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
# Outputs dist/index.js — committed and used by action.yml
```
