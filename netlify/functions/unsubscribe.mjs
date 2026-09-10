// Real one-click unsubscribe for transactional mail (the welcome email).
//
// Newsletter *broadcasts* don't use this — Resend substitutes its own
// {{{RESEND_UNSUBSCRIBE_URL}}} token there, which is wired into its suppression
// list. This covers the emails we send ourselves, which Resend can't annotate.
//
// GET  → a confirmation page with one button (never unsubscribes on its own:
//        mail clients and security scanners prefetch links, and a GET that acted
//        would silently unsubscribe people who never clicked).
// POST → performs it. Also satisfies RFC 8058 one-click, so Gmail's own
//        "Unsubscribe" button works via the List-Unsubscribe headers we set.
//
// Authorisation is the signed `t` parameter, so nobody can unsubscribe an
// arbitrary address by editing the query string.

import { Resend } from 'resend';
import { verifyEmailToken, decodeEmail } from '../../src/lib/sign.js';
import { ORG, BRAND } from '../../src/config/org.js';

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;

// The masked address is interpolated into the page. The signature gates it today, but
// the mask keeps the whole domain verbatim, so an address like
// `a@example.com"><script>…` would otherwise emit live markup on this origin.
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Resend interpolates the address straight into the request path, so refuse anything
// that could steer it somewhere else. Real addresses never contain these.
const routable = (email) =>
  email.includes('@') && email.length <= 254 && !/[\s/?#\\%]/.test(email);

const page = ({ title, body, action, status = 200 }) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title} · ${ORG.shortName}</title>
<style>
  /* Tokens, so the dark block only has to restate colours rather than whole rules. */
  :root {
    color-scheme: light dark;
    --bg:${BRAND.bgMuted}; --card:${BRAND.bg}; --text:${BRAND.text};
    --muted:${BRAND.textMuted}; --accent:${BRAND.primary}; --rule:rgba(0,0,0,.08);
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --bg:#1c1917; --card:#292524; --text:#e7e5e4;
      /* Both of these failed WCAG AA on the dark card before: the back link measured
         2.03:1 and was effectively invisible, and the heading was a muddy 3.18:1. */
      --muted:#b8b2ad; --accent:#F0A183; --rule:transparent;
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
  button { background:${BRAND.primary}; color:#fff; border:0; border-radius:999px;
           padding:14px 32px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit;
           min-height:44px; }
  button:hover { opacity:.9; }
  button:focus-visible, a:focus-visible { outline:3px solid var(--accent); outline-offset:3px; }
  a.back { display:inline-block; margin-top:20px; color:var(--muted); font-size:13px; }
</style></head><body><div class="card">
<img src="${SITE_URL}/email-logo.png" alt="${ORG.shortName}">
<h1>${title}</h1>${body}${action || ''}
<a class="back" href="${SITE_URL}">Back to ${ORG.shortName}</a>
</div></body></html>`,
  {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      // The signed URL is the credential — don't leak it to the logo host or via
      // the back-link, and don't let anything on the page be framed or sniffed.
      'Referrer-Policy': 'no-referrer',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
);

const invalid = () => page({
  status: 400,
  title: 'This link isn’t valid',
  body: `<p>The unsubscribe link looks incomplete or has been altered. Email
    <strong><a href="mailto:${ORG.email}">${ORG.email}</a></strong> and we’ll take care of it.</p>`,
});

export default async (req) => {
  const url = new URL(req.url);
  const e = url.searchParams.get('e') || '';
  const t = url.searchParams.get('t') || '';

  if (!e || !t || !verifyEmailToken(e, t)) return invalid();
  const email = decodeEmail(e);
  if (!routable(email)) return invalid();

  const shown = esc(email.replace(/^(.).*(@.*)$/, (_, a, b) => `${a}•••${b}`));

  if (req.method === 'GET' || req.method === 'HEAD') {
    return page({
      title: 'Unsubscribe?',
      body: `<p>You’re about to stop receiving the <strong>${ORG.newsletterName}</strong> at
        <strong>${shown}</strong>.</p>`,
      action: `<form method="post"><button type="submit">Yes, unsubscribe me</button></form>`,
    });
  }

  if (req.method !== 'POST') return page({ status: 405, title: 'Not allowed', body: '<p>Unsupported method.</p>' });

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID');
    return page({
      status: 500, title: 'Something went wrong',
      body: `<p>We couldn’t process that just now. Email <strong><a href="mailto:${ORG.email}">${ORG.email}</a></strong> and we’ll remove you by hand.</p>`,
    });
  }

  const resend = new Resend(apiKey);
  const failed = () => page({
    status: 500, title: 'Something went wrong',
    body: `<p>We couldn’t process that just now. Email <strong><a href="mailto:${ORG.email}">${ORG.email}</a></strong> and we’ll remove you by hand.</p>`,
  });

  let res;
  try {
    res = await resend.contacts.update({ audienceId, email, unsubscribed: true });
  } catch (err) {
    console.error('Unsubscribe threw:', err.message);
    return failed();
  }

  if (res.error) {
    // Resend returns the SAME error — not_found / 404 / "Contact not found" — both when
    // the person isn't in the audience AND when the audience id itself is wrong. Matching
    // on the message would report success to someone who stays subscribed, so confirm the
    // audience actually exists before treating this as "already gone".
    if (res.error.statusCode === 404) {
      const aud = await resend.segments.get(audienceId);
      if (aud.error) {
        console.error(`Unsubscribe failed: audience ${audienceId} is not reachable (${aud.error.message})`);
        return failed();
      }
      console.log(`Unsubscribe: ${email} was not in the audience — nothing to do`);
    } else {
      console.error('Unsubscribe failed:', res.error.message);
      return failed();
    }
  } else {
    console.log(`Unsubscribed ${email}`);
  }
  return page({
    title: 'You’re unsubscribed',
    body: `<p><strong>${shown}</strong> has been removed from the ${ORG.newsletterName}.
      You won’t receive any more issues.</p>
      <p>Changed your mind? You can sign up again any time on our website.</p>`,
  });
};

export const config = { path: '/api/unsubscribe' };
