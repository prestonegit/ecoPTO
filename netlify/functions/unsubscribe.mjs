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
import React from 'react';
import { render } from '@react-email/render';
import { verifyEmailToken, decodeEmail } from '../../src/lib/sign.js';
import { InternalNotification } from '../../src/emails/Transactional.jsx';
import { ORG } from '../../src/config/org.js';
import { brandedPage, esc } from '../../src/lib/page.js';

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;

// Resend interpolates the address straight into the request path, so refuse anything
// that could steer it somewhere else. Real addresses never contain these.
const routable = (email) =>
  email.includes('@') && email.length <= 254 && !/[\s/?#\\%]/.test(email);

const page = (opts) => brandedPage({ ...opts, siteUrl: SITE_URL });

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

  // Tell the team. Resend already skips this contact on broadcasts, but while the
  // YEWsletter is still going out by hand from a separate Gmail list, an unsubscribe
  // that nobody sees means the person keeps receiving it — which is how a polite
  // opt-out turns into a spam complaint. Best-effort: never fail the unsubscribe
  // itself because the notification didn't send.
  try {
    const to = (process.env.NOTIFY_UNSUBSCRIBE || process.env.NOTIFY_EMAIL || ORG.email)
      .split(',').map((x) => x.trim()).filter(Boolean);
    const fields = [
      ['Email', email],
      ['Unsubscribed at', new Date().toISOString()],
      ['Action needed', 'Remove this address from any hand-maintained list (Gmail BCC, Google Contacts). Resend will already skip them on broadcasts.'],
    ];
    const props = { title: `Unsubscribed: ${email}`, fields, siteUrl: SITE_URL };
    const from = process.env.RESEND_FROM;
    if (from) {
      const note = await resend.emails.send({
        from,
        to,
        subject: `Unsubscribed: ${email}`.replace(/[\r\n]+/g, ' ').slice(0, 200),
        html: await render(React.createElement(InternalNotification, props)),
        text: await render(React.createElement(InternalNotification, props), { plainText: true }),
      });
      if (note.error) console.error('Unsubscribe notification failed:', note.error.message);
    }
  } catch (err) {
    console.error('Unsubscribe notification threw:', err.message);
  }
  return page({
    title: 'You’re unsubscribed',
    body: `<p><strong>${shown}</strong> has been removed from the ${ORG.newsletterName}.
      You won’t receive any more issues.</p>
      <p>Changed your mind? You can sign up again any time on our website.</p>`,
  });
};

export const config = { path: '/api/unsubscribe' };
