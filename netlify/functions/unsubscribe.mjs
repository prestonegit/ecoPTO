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
import { verify, decodeEmail } from '../../src/lib/sign.js';
import { ORG, BRAND } from '../../src/config/org.js';

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;

const page = ({ title, body, action, status = 200 }) => new Response(
  `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<title>${title} · ${ORG.shortName}</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:${BRAND.bgMuted}; color:${BRAND.text};
         font-family:${BRAND.fontSans}; padding:24px; box-sizing:border-box; }
  .card { background:${BRAND.bg}; max-width:480px; width:100%; border-radius:16px; padding:40px 32px;
          text-align:center; box-shadow:0 2px 16px rgba(0,0,0,.08); }
  img { width:72px; height:72px; margin-bottom:20px; }
  h1 { font-family:${BRAND.fontSerif}; color:${BRAND.primary}; font-size:26px; margin:0 0 12px; }
  p { line-height:1.6; margin:0 0 20px; color:${BRAND.textMuted}; font-size:15px; }
  strong { color:${BRAND.text}; }
  button { background:${BRAND.primary}; color:#fff; border:0; border-radius:999px;
           padding:14px 32px; font-size:15px; font-weight:700; cursor:pointer; font-family:inherit; }
  button:hover { opacity:.9; }
  a.back { display:inline-block; margin-top:20px; color:${BRAND.textMuted}; font-size:13px; }
  @media (prefers-color-scheme: dark) {
    body { background:#1c1917; color:#e7e5e4; }
    .card { background:#292524; box-shadow:none; }
    p { color:#a8a29e; } strong { color:#e7e5e4; }
  }
</style></head><body><div class="card">
<img src="${SITE_URL}/email-logo.png" alt="${ORG.shortName}">
<h1>${title}</h1>${body}${action || ''}
<a class="back" href="${SITE_URL}">Back to ${ORG.shortName}</a>
</div></body></html>`,
  { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
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

  if (!e || !t || !verify(e, t)) return invalid();
  const email = decodeEmail(e);
  if (!email.includes('@')) return invalid();

  const shown = email.replace(/^(.).*(@.*)$/, (_, a, b) => `${a}•••${b}`);

  if (req.method === 'GET') {
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
  const res = await resend.contacts.update({ audienceId, email, unsubscribed: true });

  // An address that was never in the audience is already "unsubscribed" as far as the
  // person is concerned — don't show them an error for the outcome they asked for.
  if (res.error && !/not found/i.test(res.error.message)) {
    console.error('Unsubscribe failed:', res.error.message);
    return page({
      status: 500, title: 'Something went wrong',
      body: `<p>We couldn’t process that just now. Email <strong><a href="mailto:${ORG.email}">${ORG.email}</a></strong> and we’ll remove you by hand.</p>`,
    });
  }

  console.log(`Unsubscribed ${email}`);
  return page({
    title: 'You’re unsubscribed',
    body: `<p><strong>${shown}</strong> has been removed from the ${ORG.newsletterName}.
      You won’t receive any more issues.</p>
      <p>Changed your mind? You can sign up again any time on our website.</p>`,
  });
};

export const config = { path: '/api/unsubscribe' };
