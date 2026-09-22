// Shared branded page shell for the public Netlify Function endpoints (unsubscribe
// request + confirmation). Server-side only.
//
// These pages are reached from email, so they carry no site chrome and no scripts —
// just a card that looks like it belongs to ecoPTO.

import { ORG, BRAND } from '../config/org.js';

/** Escape anything interpolated into the HTML below. */
export const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const brandedPage = ({ title, body, action = '', status = 200, siteUrl = ORG.siteUrl }) =>
  new Response(
    `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${esc(title)} · ${esc(ORG.shortName)}</title>
<style>
  /* Tokens, so the dark block only has to restate colours rather than whole rules. */
  :root {
    color-scheme: light dark;
    --bg:${BRAND.bgMuted}; --card:${BRAND.bg}; --text:${BRAND.text};
    --muted:${BRAND.textMuted}; --accent:${BRAND.primary}; --rule:rgba(0,0,0,.08);
    --field:#ffffff; --border:#d6d3d1;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#1c1917; --card:#292524; --text:#e7e5e4;
      /* Light-mode values failed WCAG AA on the dark card — the muted tone measured
         2.03:1 and the heading a muddy 3.18:1. These clear AA in both modes. */
      --muted:#b8b2ad; --accent:#F0A183; --rule:transparent;
      --field:#1c1917; --border:#57534e;
    }
  }
  /* The brand webfonts aren't loaded here, so name the fallbacks we actually get
     instead of declaring faces that silently resolve to system defaults. */
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:var(--bg); color:var(--text); padding:24px; box-sizing:border-box;
         font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
  .card { background:var(--card); max-width:480px; width:100%; border-radius:16px; padding:40px 32px;
          text-align:center; box-shadow:0 2px 16px var(--rule); }
  img { width:72px; height:72px; margin-bottom:20px; }
  h1 { font-family:Georgia,'Times New Roman',serif; color:var(--accent); font-size:26px; margin:0 0 12px; }
  p { line-height:1.6; margin:0 0 20px; color:var(--muted); font-size:15px; }
  strong { color:var(--text); }
  a { color:var(--accent); }
  label { display:block; text-align:left; font-size:13px; font-weight:700; margin:0 0 6px; color:var(--text); }
  input[type=email] { width:100%; box-sizing:border-box; padding:13px 14px; font-size:16px;
    border:1px solid var(--border); border-radius:10px; background:var(--field); color:var(--text);
    font-family:inherit; margin:0 0 18px; }
  button { background:${BRAND.primary}; color:#fff; border:0; border-radius:999px;
           padding:14px 32px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit;
           min-height:44px; }
  button:hover { opacity:.9; }
  button:focus-visible, a:focus-visible, input:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
  a.back { display:inline-block; margin-top:20px; color:var(--muted); font-size:13px; }
</style></head><body><div class="card">
<img src="${siteUrl}/email-logo.png" alt="${esc(ORG.shortName)}">
<h1>${esc(title)}</h1>${body}${action}
<a class="back" href="${siteUrl}">Back to ${esc(ORG.shortName)}</a>
</div></body></html>`,
    {
      status,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        // A signed unsubscribe URL is a bearer credential — don't leak it to the logo
        // host or via the back-link, and don't let the page be framed or sniffed.
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
      },
    },
  );
