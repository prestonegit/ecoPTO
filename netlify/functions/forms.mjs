// Single front door for every form on the site. Replaces Netlify Forms entirely:
// the browser POSTs JSON here, and this function talks to Resend directly.
//
// Handles three forms:
//   signup        → adds a Resend contact (with properties), welcomes them, notifies the team
//   staff-support → receipt to the sender, detailed notification to the team
//   contact       → receipt to the sender, detailed notification to the team
//
// Required env:  RESEND_API_KEY, RESEND_AUDIENCE_ID, RESEND_FROM
// Optional env:  NOTIFY_EMAIL (catch-all), NOTIFY_SIGNUP, NOTIFY_STAFF, NOTIFY_CONTACT

import crypto from 'node:crypto';
import { Resend } from 'resend';
import { render } from '@react-email/render';
import React from 'react';
import { SignupWelcome, FormReceipt, InternalNotification } from '../../src/emails/Transactional.jsx';
import { ORG } from '../../src/config/org.js';

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;

// Netlify Forms gave us Akismet. In its place: a honeypot, a server-issued nonce that
// proves a minimum fill time, and a per-instance IP throttle.
const MIN_FILL_MS = 2500;
const MAX_NONCE_AGE_MS = 2 * 60 * 60 * 1000; // a long form fill, but not an infinite replay window

// The nonce is minted by GET /api/forms and verified here. An earlier version trusted a
// client-supplied timestamp, which an attacker bypassed simply by omitting the field
// (`Number(undefined || 0)` made the form look two thousand years old). Deriving the time
// server-side also fixes real users whose device clock is skewed.
const nonceSecret = () =>
  process.env.FORM_SECRET || crypto.createHash('sha256').update(process.env.RESEND_API_KEY || '').digest('hex');

const sign = (ts) => crypto.createHmac('sha256', nonceSecret()).update(String(ts)).digest('hex');
const mintNonce = () => { const ts = Date.now(); return `${ts}.${sign(ts)}`; };

const checkNonce = (nonce) => {
  if (typeof nonce !== 'string') return 'missing';
  const [tsRaw, mac] = nonce.split('.');
  const ts = Number(tsRaw);
  if (!Number.isFinite(ts) || !mac) return 'malformed';
  const expected = sign(ts);
  // Constant-time compare; lengths are fixed so the length check can't leak.
  if (mac.length !== expected.length ||
      !crypto.timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'))) return 'bad-signature';
  const age = Date.now() - ts;
  if (age < MIN_FILL_MS) return 'too-fast';
  if (age > MAX_NONCE_AGE_MS) return 'expired';
  return null;
};

// Best-effort throttle. Netlify may run several instances, so this is a speed bump
// rather than a guarantee — it exists to blunt a trivial loop, not a determined attacker.
const RATE_LIMIT = { windowMs: 60_000, max: 5 };
const hits = new Map();
const rateLimited = (ip) => {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < RATE_LIMIT.windowMs);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // bound memory on a long-lived instance
  return recent.length > RATE_LIMIT.max;
};

// Header values must never carry a newline from user input.
const headerSafe = (v) => String(v || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 200);

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const notifyTo = (formName) => {
  const perForm = {
    signup: process.env.NOTIFY_SIGNUP,
    'staff-support': process.env.NOTIFY_STAFF,
    contact: process.env.NOTIFY_CONTACT,
  }[formName];
  const chosen = perForm || process.env.NOTIFY_EMAIL || ORG.email;
  // Any of these may be a comma-separated list.
  return chosen.split(',').map((s) => s.trim()).filter(Boolean);
};

// resend@6 never rejects: fetchRequest catches everything and returns {data, error}.
// Discarding that return value made a failed send indistinguishable from success — the
// submitter saw "Thanks, we got it" while nothing was sent and nothing was recorded.
// That matters a lot now that the notification email IS the submission archive.
const sendOrThrow = async (resend, opts) => {
  const res = await resend.emails.send(opts);
  if (res?.error) throw new Error(`send to ${[].concat(opts.to).join(', ')} failed: ${res.error.message}`);
  return res;
};

const asArray = (v) => (Array.isArray(v) ? v : v == null || v === '' ? [] : [v]);
// Some checkboxes are paired with a hidden default (active-role sends "No" always, plus
// "Yes" when ticked), so the value can arrive as either a string or an array.
const hasValue = (v, wanted) => asArray(v).includes(wanted);
const isChecked = (v) => v === true || hasValue(v, 'on') || hasValue(v, 'true');
const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const splitName = (full) => {
  const [first, ...rest] = String(full || '').trim().split(/\s+/);
  return { firstName: first || undefined, lastName: rest.join(' ') || undefined };
};

// Merge the "Other" checkbox with its write-in field so the team sees one clean value.
const schoolList = (schools, other) => {
  const list = asArray(schools).filter((s) => s !== 'Other');
  if (asArray(schools).includes('Other') && other) list.push(`Other: ${other}`);
  else if (asArray(schools).includes('Other')) list.push('Other');
  return list;
};

export default async (req) => {
  // The browser calls this on page load to get a nonce it must hand back on submit.
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ nonce: mintNonce() }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  if (!apiKey || !from) {
    console.error('Missing RESEND_API_KEY or RESEND_FROM');
    return json({ error: 'Form handling is not configured. Please email us instead.' }, 500);
  }

  // A form-encoded body means JavaScript didn't run, so there's no nonce and we can't
  // tell a person from a bot. Say so plainly rather than dropping the submission or
  // bouncing them to a JSON error page.
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return new Response(
      `<!doctype html><meta charset="utf-8"><title>JavaScript required</title>` +
      `<body style="font-family:system-ui;max-width:34rem;margin:4rem auto;padding:0 1rem;line-height:1.6">` +
      `<h1>We couldn't submit that form</h1>` +
      `<p>This form needs JavaScript enabled. Please turn it on and try again, or just email us directly at ` +
      `<a href="mailto:${ORG.email}">${ORG.email}</a> — we'll pick it up either way.</p>` +
      `<p><a href="${SITE_URL}">Back to ${ORG.shortName}</a></p></body>`,
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    );
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request' }, 400);
  }

  const formName = body?.form;
  const f = body?.fields ?? {};

  if (!['signup', 'staff-support', 'contact'].includes(formName)) {
    return json({ error: 'Unknown form' }, 400);
  }

  // Spam checks. All answer 200 so a bot learns nothing from the response.
  if (clean(body?._hp)) {
    console.log(`Honeypot tripped on ${formName}`);
    return json({ ok: true });
  }
  const nonceProblem = checkNonce(body?._nonce);
  if (nonceProblem) {
    console.log(`Rejected ${formName} submission: nonce ${nonceProblem}`);
    return json({ ok: true });
  }
  const ip = req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'unknown';
  if (rateLimited(ip)) {
    console.log(`Rate limited ${formName} from ${ip}`);
    return json({ ok: true });
  }

  const resend = new Resend(apiKey);
  const to = notifyTo(formName);

  try {
    if (formName === 'signup') {
      const email = String(clean(f.email) || '').toLowerCase();
      if (!email.includes('@')) return json({ error: 'Please enter a valid email address.' }, 400);

      const name = clean(f['first-name']) || '';
      const { firstName, lastName } = splitName(name);
      const schools = schoolList(f.school, clean(f['school-other']));
      const roles = asArray(f['selected-volunteer-roles']).filter((r) => r && r !== 'None');
      const wantsUpdates = isChecked(f['receive-updates']);
      const activeRole = f['active-role'] === true || hasValue(f['active-role'], 'Yes');
      const impactFocus = clean(f['impact-focus']) || '';

      // Only people who ticked the updates box go into the mailing audience.
      // Everyone else is still forwarded to the team; they just aren't subscribed.
      if (wantsUpdates) {
        const audienceId = process.env.RESEND_AUDIENCE_ID;
        if (!audienceId) {
          console.error('Missing RESEND_AUDIENCE_ID — contact not added');
        } else {
          const properties = {
            schools: schools.join(', '),
            impact_focus: impactFocus,
            volunteer_roles: roles.join(', '),
            wants_active_role: activeRole ? 'yes' : 'no',
            signed_up_at: new Date().toISOString(),
          };
          const res = await resend.contacts.create({
            audienceId, email, firstName, lastName, unsubscribed: false, properties,
          });
          if (res.error) {
            if (/already exists|duplicate/i.test(res.error.message)) {
              // A repeat signup is normal — someone updating their schools or the roles
              // they can help with. Refresh the record instead of dropping the new info.
              const upd = await resend.contacts.update({ audienceId, email, firstName, lastName, properties });
              if (upd.error) console.error('Resend contact update failed:', upd.error.message);
            } else {
              console.error('Resend contact create failed:', res.error.message);
            }
          }
        }

        await sendOrThrow(resend, {
          from,
          to: [email],
          subject: `Welcome to the ${ORG.newsletterName}`,
          html: await render(React.createElement(SignupWelcome, { firstName, siteUrl: SITE_URL })),
          text: await render(React.createElement(SignupWelcome, { firstName, siteUrl: SITE_URL }), { plainText: true }),
        });
      }

      const fields = [
        ['Name', name],
        ['Email', email],
        ['School / affiliation', schools.join(', ')],
        ['What they care about', impactFocus],
        ['Wants newsletter', wantsUpdates ? 'Yes' : 'No'],
        ['Wants an active role', activeRole ? 'Yes' : 'No'],
        ['Volunteer roles', roles.join('\n')],
      ];
      await sendOrThrow(resend, {
        from,
        to,
        replyTo: email,
        subject: headerSafe(`New signup: ${name || email}`),
        html: await render(React.createElement(InternalNotification, { title: 'New ecoPTO signup', fields, siteUrl: SITE_URL })),
        text: await render(React.createElement(InternalNotification, { title: 'New ecoPTO signup', fields, siteUrl: SITE_URL }), { plainText: true }),
      });

      return json({ ok: true });
    }

    if (formName === 'staff-support') {
      const email = String(clean(f['staff-email']) || '').toLowerCase();
      const name = clean(f['staff-name']) || '';
      const school = clean(f['staff-school']) === 'Other'
        ? `Other: ${clean(f['staff-other-school']) || '(unspecified)'}`
        : clean(f['staff-school']) || '';

      const fields = [
        ['Name', name],
        ['Email', email],
        ['Phone', clean(f['staff-phone'])],
        ['Date needed', clean(f['staff-date'])],
        ['Time needed', clean(f['staff-time'])],
        ['School / affiliation', school],
        ['How we can help', clean(f['staff-help'])],
      ];

      await sendOrThrow(resend, {
        from,
        to,
        replyTo: email || undefined,
        subject: headerSafe(`Staff support request: ${name || email}`),
        html: await render(React.createElement(InternalNotification, { title: 'Staff support request', fields, siteUrl: SITE_URL })),
        text: await render(React.createElement(InternalNotification, { title: 'Staff support request', fields, siteUrl: SITE_URL }), { plainText: true }),
      });

      if (email.includes('@')) {
        const { firstName } = splitName(name);
        await sendOrThrow(resend, {
          from,
          to: [email],
          replyTo: to[0],
          subject: 'We received your support request',
          html: await render(React.createElement(FormReceipt, { firstName, kind: 'support request', siteUrl: SITE_URL })),
          text: await render(React.createElement(FormReceipt, { firstName, kind: 'support request', siteUrl: SITE_URL }), { plainText: true }),
        });
      }

      return json({ ok: true });
    }

    // contact
    const email = String(clean(f.email) || '').toLowerCase();
    const name = clean(f.name) || '';
    const message = clean(f.message) || '';
    if (!message) return json({ error: 'Please include a message.' }, 400);

    const fields = [['Name', name], ['Email', email], ['Message', message]];
    await sendOrThrow(resend, {
      from,
      to,
      replyTo: email || undefined,
      subject: headerSafe(`Contact form: ${name || email || 'no name given'}`),
      html: await render(React.createElement(InternalNotification, { title: 'Contact form message', fields, siteUrl: SITE_URL })),
      text: await render(React.createElement(InternalNotification, { title: 'Contact form message', fields, siteUrl: SITE_URL }), { plainText: true }),
    });

    if (email.includes('@')) {
      const { firstName } = splitName(name);
      await sendOrThrow(resend, {
        from,
        to: [email],
        replyTo: to[0],
        subject: 'We received your message',
        html: await render(React.createElement(FormReceipt, { firstName, kind: 'message', siteUrl: SITE_URL })),
        text: await render(React.createElement(FormReceipt, { firstName, kind: 'message', siteUrl: SITE_URL }), { plainText: true }),
      });
    }

    return json({ ok: true });
  } catch (err) {
    console.error(`${formName} submission failed:`, err);
    return json({ error: 'Something went wrong on our end. Please email us directly.' }, 500);
  }
};

export const config = { path: '/api/forms' };
