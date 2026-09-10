// HMAC helpers shared by the Netlify functions. Server-side only — never import this
// from browser code, it uses node:crypto.
//
// One secret covers both the form-submission nonce and unsubscribe links. Set
// FORM_SECRET to pin it; otherwise it derives from RESEND_API_KEY, which means
// rotating that key silently invalidates outstanding unsubscribe links. Set
// FORM_SECRET explicitly before rotating.

import crypto from 'node:crypto';

const secret = () =>
  process.env.FORM_SECRET ||
  crypto.createHash('sha256').update(process.env.RESEND_API_KEY || '').digest('hex');

export const sign = (value) =>
  crypto.createHmac('sha256', secret()).update(String(value)).digest('hex');

/** Constant-time comparison of a supplied MAC against the expected one. */
export const verify = (value, mac) => {
  if (typeof mac !== 'string') return false;
  const expected = sign(value);
  if (mac.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(mac, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
};

// Base64url so an address survives a query string without escaping surprises.
export const encodeEmail = (email) => Buffer.from(String(email), 'utf8').toString('base64url');
export const decodeEmail = (token) => {
  try {
    return Buffer.from(String(token), 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

/** Absolute, signed unsubscribe URL for a given address. */
export const unsubscribeUrl = (siteUrl, email) => {
  const e = encodeEmail(email);
  return `${siteUrl}/api/unsubscribe?e=${e}&t=${sign(e)}`;
};
