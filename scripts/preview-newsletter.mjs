// Renders a newsletter issue to a local HTML file and prints the path, so you can
// eyeball the real email in a browser without sending anything or pushing to Resend.
//
// Usage:
//   npm run newsletter:preview                     # every issue that isn't 'sent'
//   npm run newsletter:preview -- <path-to-issue>  # one specific file

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { render } from '@react-email/render';
import React from 'react';
import Newsletter from '../src/emails/Newsletter.jsx';
import { ORG } from '../src/config/org.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const NEWSLETTERS_DIR = path.join(REPO_ROOT, 'src/content/newsletters');
const OUT_DIR = path.join(REPO_ROOT, '.preview');

const readAll = async (dir, map) => {
  const out = [];
  for (const f of await fs.readdir(dir)) {
    if (!/\.(md|mdx)$/.test(f)) continue;
    const { data } = matter(await fs.readFile(path.join(dir, f), 'utf8'));
    out.push(map({ slug: f.replace(/\.(md|mdx)$/, ''), data }));
  }
  return out;
};

const main = async () => {
  const arg = process.argv[2];
  const files = arg
    ? [path.resolve(arg)]
    : (await fs.readdir(NEWSLETTERS_DIR))
        .filter((f) => /\.(md|mdx)$/.test(f))
        .map((f) => path.join(NEWSLETTERS_DIR, f));

  const now = Date.now();
  const events = (await readAll(path.join(REPO_ROOT, 'src/content/events'), (e) => ({
    slug: e.slug, title: e.data.title, eventDate: e.data.eventDate,
    dateOverride: e.data.dateOverride ?? null, location: e.data.location ?? null,
    cardDescription: e.data.cardDescription ?? e.data.description ?? '',
    externalUrl: e.data.externalUrl ?? null,
  })))
    .filter((e) => new Date(e.eventDate).getTime() >= now)
    .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate))
    .slice(0, 4);

  const news = (await readAll(path.join(REPO_ROOT, 'src/content/news'), (n) => ({
    slug: n.slug, title: n.data.title, author: n.data.author,
    pubDate: n.data.pubDate, description: n.data.description ?? '',
  })))
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
    .slice(0, 3);

  await fs.mkdir(OUT_DIR, { recursive: true });

  for (const file of files) {
    const { data } = matter(await fs.readFile(file, 'utf8'));
    const status = data.status || 'draft';
    if (!arg && status === 'sent') continue;
    const slug = path.basename(file).replace(/\.(md|mdx)$/, '');
    const html = await render(React.createElement(Newsletter, {
      data, events, news, siteUrl: ORG.siteUrl, unsubscribeUrl: '#',
    }));
    const out = path.join(OUT_DIR, `${slug}.html`);
    await fs.writeFile(out, html);
    console.log(`${status.padEnd(13)} ${path.relative(REPO_ROOT, out)}`);
  }
  console.log(`\nOpen one in a browser, e.g.:  open ${path.relative(REPO_ROOT, OUT_DIR)}/<file>.html`);
};

main().catch((e) => { console.error(e); process.exit(1); });
