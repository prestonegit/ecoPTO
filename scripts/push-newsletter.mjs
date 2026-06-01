// Reads newsletter issues with status: ready-to-send,
// renders them through the React Email template,
// and pushes each as a DRAFT broadcast in Resend.
// The editor then opens Resend, previews, and clicks Send.
//
// Usage:
//   RESEND_API_KEY=... RESEND_AUDIENCE_ID=... RESEND_FROM='ecoPTO <news@ecopto.org>' \
//     node scripts/push-newsletter.mjs
//
// Optional flags:
//   --dry-run        Render and print to stdout, don't call Resend
//   --file <path>    Push a specific file instead of scanning for ready-to-send

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { render } from '@react-email/render';
import React from 'react';
import { Resend } from 'resend';
import Newsletter from '../src/emails/Newsletter.jsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NEWSLETTERS_DIR = path.join(REPO_ROOT, 'src/content/newsletters');
const EVENTS_DIR = path.join(REPO_ROOT, 'src/content/events');
const NEWS_DIR = path.join(REPO_ROOT, 'src/content/news');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const fileArgIdx = args.indexOf('--file');
const fileArg = fileArgIdx >= 0 ? args[fileArgIdx + 1] : null;

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
      eventDate: e.data.eventDate,
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
      pubDate: n.data.pubDate,
      description: n.data.description ?? '',
    }));
}

const ACTIONABLE = new Set(['ready-to-send', 'send-test', 'send-now']);

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

async function setStatus(filePath, status) {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = matter(raw);
  parsed.data.status = status;
  if (status === 'sent') parsed.data.confirmSend = false; // reset the safety so it can't re-fire
  const updated = matter.stringify(parsed.content, parsed.data);
  await fs.writeFile(filePath, updated);
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

  for (const filePath of issues) {
    const raw = await fs.readFile(filePath, 'utf8');
    const { data } = matter(raw);

    const html = await render(React.createElement(Newsletter, { data, events, news }));
    const text = await render(React.createElement(Newsletter, { data, events, news }), { plainText: true });

    // Resolve attachments — files referenced from /public via a path like /assets/foo.pdf
    const attachments = [];
    let totalBytes = 0;
    for (const a of data.attachments || []) {
      const rel = a.file.startsWith('/') ? a.file.slice(1) : a.file;
      const abs = path.join(REPO_ROOT, 'public', rel);
      try {
        const buf = await fs.readFile(abs);
        totalBytes += buf.length;
        attachments.push({
          filename: path.basename(abs),
          content: buf.toString('base64'),
        });
      } catch (err) {
        console.warn(`  Could not read attachment ${a.file}: ${err.message}`);
      }
    }
    if (totalBytes > 25 * 1024 * 1024) {
      console.warn(`  WARNING: attachments total ${(totalBytes / 1024 / 1024).toFixed(1)}MB — may exceed inbox limits.`);
    }

    if (dryRun) {
      console.log(`\n=== ${path.basename(filePath)} ===`);
      console.log(`Status: ${data.status}${data.status === 'send-now' ? ` (confirmSend: ${data.confirmSend === true})` : ''}`);
      console.log(`Subject: ${data.subject}`);
      console.log(`HTML length: ${html.length} chars`);
      console.log(`Attachments: ${attachments.length}${attachments.length ? ` (${(totalBytes / 1024).toFixed(1)} KB)` : ''}`);
      attachments.forEach((a) => console.log(`  · ${a.filename}`));
      console.log('--- first 600 chars of HTML ---');
      console.log(html.slice(0, 600));
      continue;
    }

    const attachOpt = attachments.length > 0 ? { attachments } : {};
    const label = path.basename(filePath);

    // --- SEND TEST: one-off email to the test address only ---
    if (data.status === 'send-test') {
      const to = (data.testEmail || '').trim();
      if (!to) {
        console.error(`  ${label}: status is 'send-test' but no testEmail is set. Skipping.`);
        continue;
      }
      console.log(`Sending TEST of "${data.subject}" to ${to}...`);
      const res = await resend.emails.send({ from, to: [to], subject: `[TEST] ${data.subject}`, html, text, ...attachOpt });
      if (res.error) { console.error(`  Failed: ${res.error.message}`); continue; }
      console.log(`  Test sent. Status left unchanged so you can iterate, then switch to 'SEND NOW' when ready.`);
      continue;
    }

    // --- SEND NOW: to all subscribers, but only with explicit confirmation ---
    if (data.status === 'send-now') {
      if (data.confirmSend !== true) {
        console.error(`  ${label}: status is 'SEND NOW' but the confirmation box is not checked. Refusing to send.`);
        console.error(`  Check "I confirm: SEND NOW will email ALL subscribers" in the editor, then re-run.`);
        continue;
      }
      console.log(`SENDING "${data.subject}" to ALL subscribers in audience ${audienceId}...`);
      const created = await resend.broadcasts.create({ audienceId, from, subject: data.subject, html, text, ...attachOpt });
      if (created.error) { console.error(`  Create failed: ${created.error.message}`); continue; }
      const sent = await resend.broadcasts.send({ broadcastId: created.data.id });
      if (sent.error) { console.error(`  Send failed: ${sent.error.message}`); continue; }
      console.log(`  Sent (broadcast id: ${created.data.id}).`);
      await setStatus(filePath, 'sent');
      console.log(`  Marked ${label} as sent.`);
      continue;
    }

    // --- READY-TO-SEND: create a draft in Resend; editor presses Send there ---
    console.log(`Creating draft in Resend: ${data.subject}${attachments.length ? ` (with ${attachments.length} attachment${attachments.length > 1 ? 's' : ''})` : ''}`);
    const result = await resend.broadcasts.create({ audienceId, from, subject: data.subject, html, text, ...attachOpt });
    if (result.error) { console.error(`  Failed: ${result.error.message}`); continue; }
    console.log(`  Draft created (id: ${result.data.id}). Open Resend to preview & press Send.`);
    // Note: we do NOT auto-mark 'sent' here — the actual send happens in the Resend dashboard.
    // Leaving status as 'ready-to-send' would re-create a draft on the next push, so bump to a terminal-ish state.
    await setStatus(filePath, 'sent');
    console.log(`  Marked ${label} as sent (draft is waiting in Resend).`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
