// HMAC helpers shared by the Netlify functions. Server-side only — never import this
// from browser code, it uses node:crypto.
//
// Set FORM_SECRET to pin the signing key. It otherwise derives from RESEND_API_KEY,
// which means rotating that key invalidates outstanding unsubscribe links — set
// FORM_SECRET explicitly before rotating.

import crypto from 'node:crypto';

const secret = () => {
  const s = process.env.FORM_SECRET || process.env.RESEND_API_KEY;
  // Fail closed. Deriving from an empty string would yield sha256("") — a published
  // constant — making every nonce and unsubscribe token forgeable by anyone.
  if (!s) throw new Error('Neither FORM_SECRET nor RESEND_API_KEY is set; refusing to sign with a known-empty secret');
  return process.env.FORM_SECRET || crypto.createHash('sha256').update(s).digest('hex');
};

// Every signature is scoped. One secret covers two different token types (a submission
// nonce over a timestamp, an unsubscribe token over an address); without a scope tag,
// a token minted for one could in principle be replayed as the other. Today that's
// blocked only by a numeric coincidence — the prefix makes it structural.
const mac = (scope, value) =>
  crypto.createHmac('sha256', secret()).update(`${scope}:${value}`).digest('hex');

/** Constant-time comparison against the expected MAC for this scope. */
const check = (scope, value, supplied) => {
  if (typeof supplied !== 'string') return false;
  const expected = mac(scope, value);
  if (supplied.length !== expected.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(supplied, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    // Non-hex input truncates, so timingSafeEqual throws on the length mismatch.
    return false;
  }
};

// --- form-submission nonce ---------------------------------------------------------
export const signNonce = (ts) => mac('n', ts);
export const verifyNonce = (ts, supplied) => check('n', ts, supplied);

// --- unsubscribe links -------------------------------------------------------------
// Base64url so an address survives a query string without escaping surprises.
export const encodeEmail = (email) => Buffer.from(String(email), 'utf8').toString('base64url');
export const decodeEmail = (token) => {
  try {
    return Buffer.from(String(token), 'base64url').toString('utf8');
  } catch {
    return '';
  }
};

export const verifyEmailToken = (encoded, supplied) => check('u', encoded, supplied);

/** Absolute, signed unsubscribe URL for a given address. */
export const unsubscribeUrl = (siteUrl, email) => {
  const e = encodeEmail(email);
  return `${siteUrl}/api/unsubscribe?e=${e}&t=${mac('u', e)}`;
};
