// One-shot import: takes a CSV exported from Netlify (Forms → signup → "Export to CSV")
// and adds each contact to the Resend Audience.
//
// Usage:
//   RESEND_API_KEY=... RESEND_AUDIENCE_ID=... node scripts/import-subscribers.mjs path/to/signup.csv
//
// Flags:
//   --dry-run                       Preview what would be imported, don't call Resend
//   --only-opted-in                 Skip rows where receive-updates is not "true"/"on" (default: import all rows with an email)
//   --email-col <name>              Override the email column name (default: tries "email", "Email")
//   --name-col <name>               Override the name column name (default: tries "name", "Name", "first-name")
//
// Re-runs are safe — Resend treats duplicate-email creates as no-ops (returns an error we ignore).

import fs from 'node:fs/promises';
import { Resend } from 'resend';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const onlyOptedIn = args.includes('--only-opted-in');
const emailColIdx = args.indexOf('--email-col');
const nameColIdx = args.indexOf('--name-col');
const emailColOverride = emailColIdx >= 0 ? args[emailColIdx + 1] : null;
const nameColOverride = nameColIdx >= 0 ? args[nameColIdx + 1] : null;
const csvPath = args.find((a) => !a.startsWith('--') && a !== emailColOverride && a !== nameColOverride);

if (!csvPath) {
  console.error('Usage: node scripts/import-subscribers.mjs <path-to-csv> [--dry-run] [--only-opted-in]');
  process.exit(1);
}

// Minimal CSV parser handling quoted fields and embedded commas/quotes.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { cell += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (cell !== '' || row.length) { row.push(cell); rows.push(row); row = []; cell = ''; }
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else { cell += c; }
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function pickCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.findIndex((h) => h.trim().toLowerCase() === c.toLowerCase());
    if (idx >= 0) return idx;
  }
  return -1;
}

async function main() {
  const raw = await fs.readFile(csvPath, 'utf8');
  const rows = parseCSV(raw);
  if (rows.length < 2) {
    console.error('CSV is empty or missing data rows.');
    process.exit(1);
  }

  const headers = rows[0];
  const emailIdx = emailColOverride
    ? headers.findIndex((h) => h.trim() === emailColOverride)
    : pickCol(headers, ['email', 'Email', 'email-address', 'e-mail']);
  const nameIdx = nameColOverride
    ? headers.findIndex((h) => h.trim() === nameColOverride)
    : pickCol(headers, ['name', 'Name', 'first-name', 'firstName', 'full-name']);
  const updatesIdx = pickCol(headers, ['receive-updates', 'Receive Updates', 'updates']);

  if (emailIdx < 0) {
    console.error(`Couldn't find email column. Headers were: ${headers.join(', ')}`);
    console.error(`Try --email-col "<exact column name>"`);
    process.exit(1);
  }

  console.log(`Headers: ${headers.join(' | ')}`);
  console.log(`Using email col: "${headers[emailIdx]}"${nameIdx >= 0 ? `, name col: "${headers[nameIdx]}"` : ''}`);
  if (updatesIdx >= 0 && onlyOptedIn) console.log(`Filtering to rows where "${headers[updatesIdx]}" is truthy`);

  const contacts = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const email = (row[emailIdx] || '').trim().toLowerCase();
    if (!email || !email.includes('@')) continue;

    if (onlyOptedIn && updatesIdx >= 0) {
      const v = (row[updatesIdx] || '').trim().toLowerCase();
      if (!['on', 'true', 'yes', '1', 'checked'].includes(v)) continue;
    }

    const fullName = nameIdx >= 0 ? (row[nameIdx] || '').trim() : '';
    const [firstName, ...rest] = fullName.split(/\s+/);
    contacts.push({ email, firstName: firstName || undefined, lastName: rest.join(' ') || undefined });
  }

  // De-dupe by email (CSV may have multiple submissions per person)
  const seen = new Map();
  for (const c of contacts) if (!seen.has(c.email)) seen.set(c.email, c);
  const unique = [...seen.values()];

  console.log(`Parsed ${rows.length - 1} rows → ${unique.length} unique email addresses to import.`);

  if (dryRun) {
    console.log('\nDry run. First 10:');
    unique.slice(0, 10).forEach((c) => console.log(`  ${c.email}${c.firstName ? ` (${c.firstName} ${c.lastName || ''})` : ''}`));
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  if (!apiKey || !audienceId) {
    console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID');
    process.exit(1);
  }

  const resend = new Resend(apiKey);
  let added = 0, skipped = 0, failed = 0;

  for (const c of unique) {
    try {
      const res = await resend.contacts.create({ audienceId, ...c, unsubscribed: false });
      if (res.error) {
        // Already exists is fine
        if (/already exists|duplicate/i.test(res.error.message)) { skipped++; }
        else { console.error(`  ${c.email}: ${res.error.message}`); failed++; }
      } else {
        added++;
      }
    } catch (err) {
      console.error(`  ${c.email}: ${err.message}`);
      failed++;
    }
    // Gentle pacing — Resend rate limit is generous but be polite
    await new Promise((r) => setTimeout(r, 50));
  }

  console.log(`\nDone. Added: ${added} · Already in audience: ${skipped} · Failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
