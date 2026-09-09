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

// Must match the properties declared in Resend (see scripts/resend-setup.mjs).
const PROPERTY_COLUMNS = ['schools', 'impact_focus', 'volunteer_roles', 'wants_active_role', 'signed_up_at'];

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

    // Carry across any columns matching the contact properties the signup form writes,
    // so imported people are segmentable the same way new signups are.
    const properties = {};
    for (const key of PROPERTY_COLUMNS) {
      const idx = pickCol(headers, [key]);
      if (idx >= 0 && (row[idx] || '').trim()) properties[key] = row[idx].trim();
    }

    contacts.push({
      email,
      firstName: firstName || undefined,
      lastName: rest.join(' ') || undefined,
      ...(Object.keys(properties).length ? { properties } : {}),
    });
  }

  // De-dupe by email (CSV may have multiple submissions per person)
  const seen = new Map();
  for (const c of contacts) seen.set(c.email, c); // later row wins: newer info
  const unique = [...seen.values()];

  console.log(`Parsed ${rows.length - 1} rows → ${unique.length} unique email addresses to import.`);

  if (dryRun) {
    console.log('\nDry run. First 10:');
    unique.slice(0, 10).forEach((c) => console.log(`  ${c.email}${c.firstName ? ` (${c.firstName} ${c.lastName || ''})` : ''}${c.properties ? ` [${Object.keys(c.properties).join(', ')}]` : ''}`));
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

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let done = 0;

  for (const c of unique) {
    // Resend's default limit is 2 requests/second, so pace under it and back off on 429
    // rather than firing 20/s and losing contacts to rate-limit errors.
    for (let attempt = 1; attempt <= 4; attempt++) {
      try {
        const res = await resend.contacts.create({ audienceId, ...c, unsubscribed: false });
        if (!res.error) { added++; break; }
        if (/already exists|duplicate/i.test(res.error.message)) { skipped++; break; }
        if (/rate.?limit|too many/i.test(res.error.message) && attempt < 4) {
          await sleep(1000 * attempt);
          continue;
        }
        console.error(`  ${c.email}: ${res.error.message}`);
        failed++;
        break;
      } catch (err) {
        if (attempt === 4) { console.error(`  ${c.email}: ${err.message}`); failed++; break; }
        await sleep(1000 * attempt);
      }
    }
    done++;
    if (done % 25 === 0) console.log(`  …${done}/${unique.length}`);
    await sleep(600);
  }

  console.log(`\nDone. Added: ${added} · Already in audience: ${skipped} · Failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
