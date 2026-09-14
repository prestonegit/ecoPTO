// A fingerprint of what a newsletter issue actually says, so "a test was sent" can mean "a
// test of THIS content was sent".
//
// Before this, a bulk send only required lastTestSentAt to exist. That let untested content
// reach the whole list in two ordinary ways: edit an issue after testing it, or duplicate a
// tested issue in Decap (Duplicate copies every field, hidden ones included). The send script
// now stamps lastTestHash when a test goes out and refuses a bulk send unless the issue still
// hashes to it; the composer and the Decap widget use the same function to show "changed
// since your test".
//
// It runs in three places that parse the same file differently, so it canonicalises first:
//   - push-newsletter.mjs reads files with gray-matter (js-yaml), which turns BOTH
//     `2026-05-15` and `2026-09-23T16:00:00.000Z` into Dates;
//   - the composer and Decap read with yaml v1, which leaves the date-only one a string;
//   - the composer's in-memory form carries empty strings and missing defaults the file omits.
// Uses Web Crypto, which browsers and Node 19+ (CI runs Node 20) both provide globally.

// Bookkeeping, not content. testEmail is excluded so changing where the test goes doesn't
// demand a fresh test of an unchanged issue.
const IGNORED = new Set([
  'status', 'confirmSend', 'lastTestSentAt', 'lastTestHash', 'resendBroadcastId', 'testEmail',
  'lastError', 'lastErrorAt',
]);

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})$/;

function canonicalValue(v) {
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v.toISOString();
  if (typeof v === 'string') {
    // js-yaml reads a bare date as UTC midnight; yaml v1 keeps the string. Meet in the middle.
    if (DATE_ONLY.test(v)) return `${v}T00:00:00.000Z`;
    if (ISO.test(v)) {
      const d = new Date(v);
      if (!Number.isNaN(d.getTime())) return d.toISOString();
    }
    return v;
  }
  if (Array.isArray(v)) return v.map(canonicalValue);
  if (v && typeof v === 'object') return canonicalObject(v);
  return v;
}

const isEmpty = (v) =>
  v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

function canonicalObject(obj, top = false) {
  const out = {};
  for (const key of Object.keys(obj).sort()) {
    if (top && IGNORED.has(key)) continue;
    const v = canonicalValue(obj[key]);
    if (isEmpty(v)) continue; // "" in the form and "no key" in the file mean the same thing
    out[key] = v;
  }
  return out;
}

export function canonicalContent(data) {
  // The template includes events and news unless explicitly false; a missing key and `true`
  // render the same email, so they must hash the same. Set before canonicalising, so the keys
  // land in sorted position: appended afterwards they came last in the JSON, and "missing"
  // and `true` hashed differently.
  return canonicalObject(
    { ...(data || {}), includeEvents: data?.includeEvents !== false, includeNews: data?.includeNews !== false },
    true,
  );
}

// The slug is part of the fingerprint: a duplicated issue has identical content but a new
// filename, and must not inherit the original's test.
export async function contentFingerprint(slug, data) {
  const payload = JSON.stringify({ slug, content: canonicalContent(data) });
  const bytes = new TextEncoder().encode(payload);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
  // Prefixed so YAML can never read it as a number (an all-digit or "1e5"-like hex string would be).
  return `sha256-${hex}`;
}
