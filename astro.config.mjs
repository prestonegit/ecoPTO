import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import fs from 'node:fs';
import matter from 'gray-matter';

// Events with an externalUrl build as a redirect stub rather than a real page.
const EXTERNAL_EVENTS = new Set(
  fs.readdirSync('./src/content/events')
    .filter((f) => /\.mdx?$/.test(f))
    .filter((f) => matter(fs.readFileSync(`./src/content/events/${f}`, 'utf8')).data.externalUrl)
    .map((f) => f.replace(/\.mdx?$/, '')),
);

// https://astro.build/config
export default defineConfig({
  // Required for sitemap generation and absolute canonical URLs.
  site: 'https://ecopto.org',
  integrations: [
    tailwind(),
    mdx(),
    react(),
    sitemap({
      // Exclude the CMS, the email-linked endpoints, and events whose page is only a
      // redirect stub to an external host (Punchbowl, Eventbrite). Astro already marks
      // those noindex; listing a redirect in a sitemap is just noise for crawlers.
      filter: (page) => {
        const { pathname } = new URL(page);
        if (/\/(admin|unsubscribe)(\/|$)/.test(pathname)) return false;
        const slug = pathname.replace(/^\/events\/|\/$/g, '');
        return !(pathname.startsWith('/events/') && EXTERNAL_EVENTS.has(slug));
      },
    }),
  ],
});
