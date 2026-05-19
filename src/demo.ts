export interface DemoCards {
  stats1: string;
  stats2: string;
  contrib: string;
  langs: string;
}

export function buildDemo(user: string, cards: DemoCards): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GitHub Stats — ${user}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg: #0f172a; --border: rgba(255,255,255,0.1); --text: #f8fafc; --muted: #94a3b8; --accent: #60a5fa;
    }
    @media (prefers-color-scheme: light) {
      :root { --bg: #f1f5f9; --border: rgba(0,0,0,0.08); --text: #1e293b; --muted: #64748b; --accent: #3b82f6; }
    }
    body { background: var(--bg); color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 2rem 1.5rem; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
    .subtitle { color: var(--muted); font-size: 0.9rem; margin-bottom: 3rem; }
    h2 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.4rem; }
    .desc { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.25rem; }
    code { background: rgba(128,128,128,0.15); border-radius: 3px; padding: 1px 5px; font-size: 0.85em; }
    .tag { display: inline-block; background: rgba(96,165,250,0.15); color: var(--accent);
      border: 1px solid rgba(96,165,250,0.3); border-radius: 4px;
      font-size: 0.75rem; font-weight: 600; padding: 1px 7px; margin-left: 8px; vertical-align: middle; }
    .stats-grid { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 1.25rem; }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
    .resizable { resize: horizontal; overflow: hidden;
      border: 1px dashed var(--border); border-radius: 12px;
      padding: 1.25rem; min-width: 280px; max-width: 100%; width: 100%; }
    .resize-hint { color: var(--muted); font-size: 0.78rem; margin-bottom: 1rem; }
    .spacer { margin-top: 1.25rem; }
  </style>
</head>
<body>
  <h1>GitHub Stats Enhanced</h1>
  <p class="subtitle">Preview for <strong>${user}</strong> — drag the right edge to see responsive scaling</p>

  <h2>Cards <span class="tag">responsive</span></h2>
  <p class="desc">SVGs use <code>width="100%"</code> and scale with their container.</p>
  <div class="resizable">
    <p class="resize-hint">↔ drag right edge to resize</p>
    <div class="stats-grid">
      <div>${cards.stats1}</div>
      <div>${cards.stats2}</div>
      <div>${cards.contrib}</div>
    </div>
    <div class="spacer">${cards.langs}</div>
  </div>
</body>
</html>`;
}
