import yaml from 'yaml1';
import { config } from '../../cms/config.js';

// Newsletter files are shared between this composer and Decap, so they must come out
// byte-identical whichever one saved them last — otherwise every save churns the diff and
// a file bounced between the two editors never settles.
//
// This mirrors decap-cms-core/src/formats/yaml.ts exactly: the same yaml v1 line (Decap
// imports `yaml/types`, a v1-only entry point), the same createNode + Document.toString
// serialisation, and the same custom tag that turns ISO timestamps into Dates and back. The
// top-level `yaml` in node_modules is v2 and formats differently — it re-flows long
// strings and switches `>-` to `|-` — which is why this imports the `yaml1` alias.
// Verified by round-tripping every existing issue: identical output, byte for byte.

const timestampTag = {
  identify: (value) => value instanceof Date,
  default: true,
  tag: '!timestamp',
  test: /^([0-9]{4})-([0-9]{2})-([0-9]{2})T([0-9]{2}):([0-9]{2}):([0-9]{2}(\.[0-9]+)?)Z$/,
  resolve: (str) => new Date(str),
  stringify: (node) => node.value.toISOString(),
};

const newsletters = config.collections.find((c) => c.name === 'newsletters');

export const NEWSLETTER_FOLDER = newsletters.folder;
export const NEWSLETTER_EXTENSION = newsletters.extension;

// Decap orders frontmatter keys by the collection's field order. Section dividers carry no
// data, so they're left out; anything not listed keeps its existing relative position.
export const FIELD_ORDER = newsletters.fields
  .filter((f) => f.widget !== 'section')
  .map((f) => f.name);

// The closing fence must start its own line, so a value containing "---" mid-sentence
// cannot end the block early.
const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseIssue(raw) {
  const m = String(raw || '').match(FRONTMATTER);
  if (!m) return { data: {}, body: String(raw || '') };
  const doc = yaml.parseDocument(m[1], { customTags: [timestampTag] });
  if (doc.errors.length) {
    throw new Error(`This issue's file has a formatting problem: ${doc.errors[0].message}`);
  }
  return { data: doc.toJSON() || {}, body: m[2] };
}

const sortKeys = (order) => (a, b) => {
  const ia = order.indexOf(a.key && a.key.toString());
  const ib = order.indexOf(b.key && b.key.toString());
  if (ia === -1 || ib === -1) return 0;
  return ia - ib;
};

export function stringifyIssue(data, body = '') {
  const node = yaml.createNode(data);
  node.items.sort(sortKeys(FIELD_ORDER));
  const doc = new yaml.Document();
  doc.contents = node;
  return `---\n${doc.toString()}---\n${body}`;
}

// Decap drops empty optional values rather than writing `key: ""`, except where a field
// already had one. Matching that keeps a composer save from sprouting empty keys.
export function cleanForSave(data, original = {}) {
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    const empty = v === undefined || v === null || (typeof v === 'string' && v === '');
    if (empty && !(k in original)) continue;
    out[k] = v;
  }
  return out;
}

export const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'issue';

// Same shape as the collection's `{{year}}-{{month}}-{{slug}}`, keyed off the send date so
// the filename sorts with the issue rather than with whenever someone started drafting it.
export function slugForNewIssue(data, existingSlugs) {
  const d = data.sendDate ? new Date(data.sendDate) : new Date();
  const base = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${slugify(data.subject)}`;
  let slug = base;
  for (let n = 2; existingSlugs.has(slug); n += 1) slug = `${base}-${n}`;
  return slug;
}

// Keep timestamps as Dates in memory. Anything that has been through JSON (the in-browser
// backup) comes back as a string, and the date picker needs one consistent type to convert
// from. (It is not needed for file format: yaml v1 writes an ISO string unquoted too,
// checked, so either form serialises identically.)
const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;
export function normalizeData(data) {
  const out = { ...data };
  if (typeof out.sendDate === 'string' && ISO_Z.test(out.sendDate)) out.sendDate = new Date(out.sendDate);
  if (typeof out.lastTestSentAt === 'string' && ISO_Z.test(out.lastTestSentAt)) out.lastTestSentAt = new Date(out.lastTestSentAt);
  return out;
}

// A bare date like `2026-05-15` has no time or zone. `new Date('2026-05-15')` reads it as
// UTC midnight, which in Eastern time is the evening before, so May 15 displays as May 14.
// Read date-only values as local calendar dates instead; full timestamps stay instants.
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;
export function toDate(v) {
  if (!v) return null;
  if (v instanceof Date) return v;
  const m = String(v).match(DATE_ONLY);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}
export const isDateOnly = (v) => typeof v === 'string' && DATE_ONLY.test(v);
