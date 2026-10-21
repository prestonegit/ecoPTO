import { createHash } from 'node:crypto';

// Keep accepted names unchanged so existing broadcasts remain discoverable.
// Long names keep a readable prefix plus a hash of the full identity, so issues
// sharing a long prefix still have different names on retries.
export function broadcastName(newsletterName, slug) {
  const fullName = `${newsletterName} — ${slug}`;
  if (fullName.length <= 70) return fullName;
  const suffix = createHash('sha256').update(fullName).digest('hex').slice(0, 16);
  return `${fullName.slice(0, 53)}-${suffix}`;
}
