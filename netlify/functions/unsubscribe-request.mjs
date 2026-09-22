// Self-service unsubscribe at /unsubscribe — a single URL that is safe to paste into
// a BCC'd email, a website footer, or anywhere else.
//
// The signed links at /api/unsubscribe are per-address: pasting one into a mass email
// would unsubscribe whoever's address is baked into it, no matter who clicked. This
// page asks for an address instead and emails *that address* its own signed link, so
// possessing the URL removes nobody. Control of the inbox is the authorisation.
//
// GET  → the form.
// POST → always answers "if that address is on the list, check your inbox", whether or
//        not it is. Saying "not found" would turn this into a membership oracle anyone
//        could use to test whether a given person subscribed.

import { Resend } from 'resend';
import React from 'react';
import { render } from '@react-email/render';
import { unsubscribeUrl } from '../../src/lib/sign.js';
import { brandedPage, esc } from '../../src/lib/page.js';
import { UnsubscribeRequest } from '../../src/emails/Transactional.jsx';
import { ORG } from '../../src/config/org.js';

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;
const page = (opts) => brandedPage({ ...opts, siteUrl: SITE_URL });

// This endpoint sends mail to an address a stranger typed, so it is an email-bomb
// vector if left open. Per-instance, so a speed bump rather than a guarantee.
const RATE = { windowMs: 10 * 60_000, maxPerIp: 5, maxPerEmail: 2 };
const ipHits = new Map();
const emailHits = new Map();
const bump = (map, key, max, windowMs) => {
  const now = Date.now();
  const recent = (map.get(key) || []).filter((t) => now - t < windowMs);
  recent.push(now);
  map.set(key, recent);
  if (map.size > 5000) map.clear();
  return recent.length > max;
};

const routable = (email) =>
  email.includes('@') && email.length <= 254 && !/[\s/?#\\%]/.test(email);

const form = ({ error } = {}) => page({
  status: error ? 400 : 200,
  title: 'Unsubscribe',
  body: `<p>Enter the email address that receives the ${esc(ORG.newsletterName)} and we'll
    send you a link to confirm.</p>
    ${error ? `<p style="color:#b91c1c"><strong>${esc(error)}</strong></p>` : ''}`,
  action: `<form method="post">
      <label for="email">Email address</label>
      <input id="email" type="email" name="email" required autocomplete="email"
             inputmode="email" placeholder="you@example.com">
      <button type="submit">Send me the link</button>
    </form>`,
});

const sent = (address) => page({
  title: 'Check your inbox',
  body: `<p>If <strong>${esc(address)}</strong> is on our list, a confirmation link is on its
    way. Click it and you'll be unsubscribed straight away.</p>
    <p>Nothing arrived after a few minutes? Check your spam folder, or email
    <a href="mailto:${esc(ORG.email)}">${esc(ORG.email)}</a> and we'll remove you by hand.</p>`,
});

export default async (req) => {
  if (req.method === 'GET' || req.method === 'HEAD') return form();
  if (req.method !== 'POST') return page({ status: 405, title: 'Not allowed', body: '<p>Unsupported method.</p>' });

  let address = '';
  try {
    const ct = req.headers.get('content-type') || '';
    if (ct.includes('application/json')) address = (await req.json())?.email ?? '';
    else address = (await req.formData()).get('email') ?? '';
  } catch {
    return form({ error: 'Something went wrong reading that. Please try again.' });
  }
  address = String(address).trim().toLowerCase();

  if (!routable(address)) return form({ error: 'That doesn’t look like a valid email address.' });

  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  // Answer as though it worked — a rate-limit message would leak that the address exists.
  if (bump(ipHits, ip, RATE.maxPerIp, RATE.windowMs)) {
    console.log(`Unsubscribe-request rate limited by IP ${ip}`);
    return sent(address);
  }
  if (bump(emailHits, address, RATE.maxPerEmail, RATE.windowMs)) {
    console.log(`Unsubscribe-request rate limited for ${address}`);
    return sent(address);
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !audienceId || !from) {
    console.error('Missing RESEND_API_KEY / RESEND_AUDIENCE_ID / RESEND_FROM');
    return page({
      status: 500, title: 'Something went wrong',
      body: `<p>We couldn’t process that just now. Email
        <a href="mailto:${esc(ORG.email)}">${esc(ORG.email)}</a> and we’ll remove you by hand.</p>`,
    });
  }

  const resend = new Resend(apiKey);
  try {
    const found = await resend.contacts.get({ audienceId, email: address });
    // Not on the list, or already unsubscribed: send nothing, but say the same thing.
    if (found.error || found.data?.unsubscribed) {
      console.log(`Unsubscribe-request for ${address}: ${found.error ? 'not in audience' : 'already unsubscribed'} — no email sent`);
      return sent(address);
    }

    const url = unsubscribeUrl(SITE_URL, address);
    const props = { url, siteUrl: SITE_URL };
    const res = await resend.emails.send({
      from,
      to: [address],
      subject: `Confirm your ${ORG.newsletterName} unsubscribe`,
      headers: {
        'List-Unsubscribe': `<${url}>, <mailto:${ORG.email}?subject=Unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      html: await render(React.createElement(UnsubscribeRequest, props)),
      text: await render(React.createElement(UnsubscribeRequest, props), { plainText: true }),
    });
    if (res.error) throw new Error(res.error.message);
    console.log(`Unsubscribe link sent to ${address}`);
  } catch (err) {
    console.error(`Unsubscribe-request failed for ${address}:`, err.message);
    return page({
      status: 500, title: 'Something went wrong',
      body: `<p>We couldn’t send that link. Email
        <a href="mailto:${esc(ORG.email)}">${esc(ORG.email)}</a> and we’ll remove you by hand.</p>`,
    });
  }

  return sent(address);
};

export const config = { path: '/unsubscribe' };
