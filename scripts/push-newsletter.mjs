// Renders newsletter issues through the React Email template and pushes them to Resend.
//
// Status drives the behaviour (set it in Decap CMS):
//   draft         → ignored
//   send-test     → one-off email to testEmail, then resets to draft so it can't re-fire
//   ready-to-send → creates a DRAFT broadcast in Resend; you press Send there
//   send-now      → creates AND sends a broadcast to the whole audience (needs confirmSend)
//   in-resend     → a draft is waiting in Resend; ignored by this script
//   sent          → done; ignored, and the issue appears in the public archive
//
// Usage:
//   RESEND_API_KEY=... RESEND_AUDIENCE_ID=... RESEND_FROM='ecoPTO <news@ecopto.org>' \
//     node scripts/push-newsletter.mjs
//
// Optional flags:
//   --dry-run        Render and print to stdout, don't call Resend
//   --file <path>    Push a specific file instead of scanning for actionable issues

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { render } from '@react-email/render';
import React from 'react';
import { Resend } from 'resend';
import Newsletter from '../src/emails/Newsletter.jsx';
import { ORG, hasPostalAddress } from '../src/config/org.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NEWSLETTERS_DIR = path.join(REPO_ROOT, 'src/content/newsletters');
const EVENTS_DIR = path.join(REPO_ROOT, 'src/content/events');
const NEWS_DIR = path.join(REPO_ROOT, 'src/content/news');
// Snapshots of what actually went out, so the public archive matches the email
// forever instead of re-deriving events/news from whatever content exists at build time.
const SNAPSHOT_DIR = path.join(REPO_ROOT, 'src/data/sent-newsletters');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArgIdx = args.indexOf('--file');
const fileArg = fileArgIdx >= 0 ? args[fileArgIdx + 1] : null;

const SITE_URL = process.env.SITE_URL || ORG.siteUrl;

async function readCollection(dir) {
  const files = await fs.readdir(dir);
  const items = [];
  for (const f of files) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const raw = await fs.readFile(path.join(dir, f), 'utf8');
    const { data } = matter(raw);
    const slug = f.replace(/\.(md|mdx)$/, '');
    items.push({ slug, data });
  }
  return items;
}

async function loadEvents() {
  const all = await readCollection(EVENTS_DIR);
  const now = Date.now();
  return all
    .filter((e) => new Date(e.data.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.data.eventDate) - new Date(b.data.eventDate))
    .slice(0, 4)
    .map((e) => ({
      slug: e.slug,
      title: e.data.title,
      eventDate: e.data.eventDate instanceof Date ? e.data.eventDate.toISOString() : e.data.eventDate,
      dateOverride: e.data.dateOverride ?? null,
      location: e.data.location ?? null,
      cardDescription: e.data.cardDescription ?? e.data.description ?? '',
      image: e.data.image ?? null,
      externalUrl: e.data.externalUrl ?? null,
    }));
}

async function loadNews() {
  const all = await readCollection(NEWS_DIR);
  return all
    .sort((a, b) => new Date(b.data.pubDate) - new Date(a.data.pubDate))
    .slice(0, 3)
    .map((n) => ({
      slug: n.slug,
      title: n.data.title,
      author: n.data.author,
      pubDate: n.data.pubDate instanceof Date ? n.data.pubDate.toISOString() : n.data.pubDate,
      description: n.data.description ?? '',
    }));
}

const ACTIONABLE = new Set(['ready-to-send', 'send-test', 'send-now']);

// Every broadcast we create is named deterministically from the issue slug, which makes
// Resend itself the durable record of what has gone out. Git cannot be trusted for this:
// a workflow run can check out a stale commit, the status commit-back can fail, and a
// Decap save can revert the bot's edit — each of which would otherwise re-blast an issue.
const broadcastName = (slug) => `${ORG.newsletterName} — ${slug}`;

async function findExistingBroadcast(resend, slug) {
  const wanted = broadcastName(slug);
  let cursor;
  do {
    const res = await resend.broadcasts.list(cursor ? { after: cursor, limit: 100 } : { limit: 100 });
    if (res.error) throw new Error(`Could not list broadcasts (refusing to send blind): ${res.error.message}`);
    const page = res.data?.data ?? [];
    const hit = page.find((b) => b.name === wanted);
    if (hit) return hit;
    cursor = res.data?.has_more ? page[page.length - 1]?.id : null;
  } while (cursor);
  return null;
}

async function findIssues() {
  if (fileArg) return [path.resolve(fileArg)];
  const files = await fs.readdir(NEWSLETTERS_DIR);
  const ready = [];
  for (const f of files) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const full = path.join(NEWSLETTERS_DIR, f);
    const { data } = matter(await fs.readFile(full, 'utf8'));
    if (ACTIONABLE.has(data.status)) ready.push(full);
  }
  return ready;
}

// gray-matter hands back `sendDate` as a JS Date, and re-serializing it writes a full
// UTC timestamp — which renders as the *previous* day in US Eastern. Rewrite only the
// status lines textually so every other byte of the frontmatter is left untouched.
async function setStatus(filePath, status, extraLines = {}) {
  const raw = await fs.readFile(filePath, 'utf8');
  // Split off the frontmatter so the rewrite can never reach into the markdown body:
  // an unscoped /^key:/m would happily rewrite a body line that starts with "status:".
  const m = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
  if (!m) throw new Error(`${path.basename(filePath)}: could not locate YAML frontmatter`);
  let [, open, front, close, body] = m;

  const setKey = (text, key, value) => {
    // Top-level keys only — a leading space means it's nested under customBlocks etc.
    const re = new RegExp(`^${key}:.*$`, 'm');
    return re.test(text) ? text.replace(re, () => `${key}: ${value}`) : `${text}\n${key}: ${value}`;
  };

  front = setKey(front, 'status', status);
  if (status === 'sent' || status === 'draft') front = setKey(front, 'confirmSend', 'false');
  for (const [k, v] of Object.entries(extraLines)) front = setKey(front, k, v);

  await fs.writeFile(filePath, open + front + close + body);
}

async function writeSnapshot(slug, payload) {
  await fs.mkdir(SNAPSHOT_DIR, { recursive: true });
  await fs.writeFile(path.join(SNAPSHOT_DIR, `${slug}.json`), JSON.stringify(payload, null, 2) + '\n');
}

// Files are linked, never attached: Resend broadcasts carry no attachments, and a
// linked PDF keeps the message small and out of spam filters. Verify each one exists
// in /public so the email never ships a dead link.
async function checkFiles(data) {
  const missing = [];
  for (const a of data.attachments || []) {
    // The CMS file widget can be left empty, leaving a row with a label and no file.
    if (!a || !a.file) { missing.push(a?.label ? `(no file chosen for "${a.label}")` : '(empty file row)'); continue; }
    const rel = a.file.startsWith('/') ? a.file.slice(1) : a.file;
    try {
      await fs.access(path.join(REPO_ROOT, 'public', rel));
    } catch {
      missing.push(a.file);
    }
  }
  return missing;
}

async function main() {
  const issues = await findIssues();
  if (issues.length === 0) {
    console.log('No newsletter issues awaiting action (ready-to-send / send-test / send-now). Nothing to do.');
    return;
  }

  const [events, news] = await Promise.all([loadEvents(), loadNews()]);

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;
  const from = process.env.RESEND_FROM;

  if (!dryRun && (!apiKey || !audienceId || !from)) {
    console.error('Missing one of: RESEND_API_KEY, RESEND_AUDIENCE_ID, RESEND_FROM');
    process.exit(1);
  }

  const resend = !dryRun ? new Resend(apiKey) : null;

  let failures = 0;
  for (const filePath of issues) {
   try {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);
    const label = path.basename(filePath);
    const slug = label.replace(/\.(md|mdx)$/, '');

    // --file selects which file to look at; it does not override the status gate.
    // Without this, `--file <already-sent>.md` would create a fresh broadcast and
    // knock the issue back out of the public archive.
    if (!ACTIONABLE.has(data.status) && !dryRun) {
      console.log(`  ${label}: status is '${data.status}' — nothing to do.`);
      continue;
    }

    const missing = await checkFiles(data);
    missing.forEach((f) => console.warn(`  ${label}: linked file not found in /public: ${f}`));

    const props = { data, events, news, siteUrl: SITE_URL };
    const html = await render(React.createElement(Newsletter, props));
    const text = await render(React.createElement(Newsletter, props), { plainText: true });

    if (dryRun) {
      console.log(`\n=== ${label} ===`);
      console.log(`Status: ${data.status}${data.status === 'send-now' ? ` (confirmSend: ${data.confirmSend === true})` : ''}`);
      console.log(`Subject: ${data.subject}`);
      console.log(`HTML length: ${html.length} chars`);
      console.log(`Events: ${data.includeEvents ? events.length : 0} · News: ${data.includeNews ? news.length : 0}`);
      console.log(`Linked files: ${(data.attachments || []).length}${missing.length ? ` (${missing.length} MISSING)` : ''}`);
      console.log(`Postal address: ${hasPostalAddress() ? ORG.postalAddress : 'NOT SET — bulk sends are blocked'}`);
      console.log('--- first 600 chars of HTML ---');
      console.log(html.slice(0, 600));
      continue;
    }

    // --- SEND TEST: one-off email to the test address only ---
    if (data.status === 'send-test') {
      const to = (data.testEmail || '').trim();
      if (!to) {
        console.error(`  ${label}: status is 'send-test' but no testEmail is set. Skipping.`);
        continue;
      }
      // One-off sends don't get Resend's unsubscribe substitution, so point the link
      // somewhere real rather than shipping a literal {{{...}}} token.
      const testProps = { ...props, unsubscribeUrl: `${SITE_URL}/#contact` };
      const testHtml = await render(React.createElement(Newsletter, testProps));
      const testText = await render(React.createElement(Newsletter, testProps), { plainText: true });
      console.log(`Sending TEST of "${data.subject}" to ${to}...`);
      const res = await resend.emails.send({ from, to: [to], subject: `[TEST] ${data.subject}`, html: testHtml, text: testText });
      if (res.error) { console.error(`  Failed: ${res.error.message}`); continue; }
      // Reset to draft: leaving it on 'send-test' re-fires on every later push.
      await setStatus(filePath, 'draft');
      console.log(`  Test sent, status reset to draft. Edit and re-test, or switch to 'SEND NOW' when ready.`);
      continue;
    }

    // Everything below is a bulk send to real subscribers.
    if (!hasPostalAddress()) {
      console.error(`  ${label}: ORG.postalAddress is not set in src/config/org.js.`);
      console.error(`  CAN-SPAM requires a physical postal address in bulk email. Refusing to send.`);
      continue;
    }

    // Ask Resend what already happened to this issue before doing anything irreversible.
    const existing = await findExistingBroadcast(resend, slug);
    if (existing && existing.status !== 'draft') {
      console.error(`  ${label}: Resend already has a broadcast "${existing.name}" with status '${existing.status}'.`);
      console.error(`  This issue has already gone out (broadcast ${existing.id}). Refusing to send it again.`);
      // Repair whatever git state let us get here, so the next run is quiet.
      await setStatus(filePath, 'sent', { resendBroadcastId: existing.id });
      continue;
    }

    const commonFields = {
      audienceId, from, subject: data.subject, name: broadcastName(slug),
      previewText: data.preheader, html, text,
    };
    // Stable across retries of the same issue, so a lost response can't double-send.
    const idempotencyKey = `newsletter-${slug}`;

    // --- SEND NOW: to all subscribers, but only with explicit confirmation ---
    if (data.status === 'send-now') {
      if (data.confirmSend !== true) {
        console.error(`  ${label}: status is 'SEND NOW' but the confirmation box is not checked. Refusing to send.`);
        console.error(`  Check "I confirm: SEND NOW will email ALL subscribers" in the editor, then re-run.`);
        continue;
      }
      console.log(`SENDING "${data.subject}" to ALL subscribers in audience ${audienceId}...`);

      let broadcastId;
      if (existing) {
        // A draft from an earlier 'ready-to-send' pass — send that one rather than
        // creating a near-duplicate second broadcast.
        const upd = await resend.broadcasts.update(existing.id, commonFields);
        if (upd.error) { console.error(`  Update failed: ${upd.error.message}`); continue; }
        const sent = await resend.broadcasts.send(existing.id);
        if (sent.error) { console.error(`  Send failed: ${sent.error.message}`); continue; }
        broadcastId = existing.id;
      } else {
        // Atomic create-and-send: two separate calls leave a window where the send
        // succeeded but we didn't hear about it, and the retry blasts everyone twice.
        const created = await resend.broadcasts.create({ ...commonFields, send: true }, { idempotencyKey });
        if (created.error) { console.error(`  Send failed: ${created.error.message}`); continue; }
        broadcastId = created.data.id;
      }

      await writeSnapshot(slug, { slug, data, broadcastId, sentAt: new Date().toISOString(), events, news });
      await setStatus(filePath, 'sent', { resendBroadcastId: broadcastId });
      console.log(`  Sent (broadcast id: ${broadcastId}) and marked ${label} as sent.`);
      continue;
    }

    // --- READY-TO-SEND: create a draft in Resend; the editor presses Send there ---
    let draftId;
    if (existing) {
      // Re-running 'ready-to-send' after an edit updates the existing draft instead of
      // leaving two near-identical drafts in the dashboard for someone to send twice.
      console.log(`Updating existing Resend draft for ${slug}`);
      const upd = await resend.broadcasts.update(existing.id, commonFields);
      if (upd.error) { console.error(`  Update failed: ${upd.error.message}`); continue; }
      draftId = existing.id;
    } else {
      console.log(`Creating draft in Resend: ${data.subject}`);
      const result = await resend.broadcasts.create(commonFields, { idempotencyKey });
      if (result.error) { console.error(`  Failed: ${result.error.message}`); continue; }
      draftId = result.data.id;
    }

    await writeSnapshot(slug, { slug, data, broadcastId: draftId, preparedAt: new Date().toISOString(), events, news });
    // 'in-resend', not 'sent': nothing has actually gone out yet, and marking it sent
    // would publish it to the public archive before a single subscriber sees it.
    await setStatus(filePath, 'in-resend', { resendBroadcastId: draftId });
    console.log(`  Draft ready (id: ${draftId}). Open Resend to preview & press Send.`);
    console.log(`  Marked ${label} as 'in-resend'. Set it to 'Sent' once you've pressed Send in Resend.`);
   } catch (err) {
    failures++;
    console.error(`  ${path.basename(filePath)}: ${err.message}`);
   }
  }

  // Fail the job so the problem is visible, but only after every issue has been tried
  // and every status update has been written to disk for the commit-back step.
  if (failures > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
