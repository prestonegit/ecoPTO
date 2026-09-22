// Build-time guard: every field inside a form must actually reach the server.
//
// A mismatched tag inside a <form> (e.g. <fieldset> closed with </div>) makes the HTML
// parser drop the elements after it out of the form. The page still looks correct, the
// build still passes, and the fields silently stop being submitted — which is exactly
// how `receive-updates` and `impact-focus` went missing and stopped new volunteers
// being subscribed. Nothing about that is visible in review.
//
// So: parse the BUILT html, and assert that each form still contains the field names
// the server reads. Run after `astro build`.

import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from 'node-html-parser';

const DIST = path.resolve('dist');

// Field names netlify/functions/forms.mjs reads for each form.
const REQUIRED = {
  signup: ['first-name', 'last-name', 'email', 'school', 'strengths', 'receive-updates', 'impact-focus'],
  'staff-support': ['staff-name', 'staff-email', 'staff-school', 'staff-help'],
  contact: ['name', 'email', 'message'],
};

const htmlFiles = async (dir) => {
  const out = [];
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...await htmlFiles(full));
    else if (e.name.endsWith('.html')) out.push(full);
  }
  return out;
};

const problems = [];
const seen = new Map();

for (const file of await htmlFiles(DIST)) {
  const root = parse(await fs.readFile(file, 'utf8'));
  for (const form of root.querySelectorAll('form[data-resend-form]')) {
    const name = form.getAttribute('data-resend-form');
    const want = REQUIRED[name];
    if (!want) { problems.push(`${path.relative(DIST, file)}: unknown form "${name}"`); continue; }
    const have = new Set(
      form.querySelectorAll('input[name], select[name], textarea[name]').map((el) => el.getAttribute('name')),
    );
    const missing = want.filter((f) => !have.has(f));
    seen.set(name, (seen.get(name) || 0) + 1);
    if (missing.length) {
      problems.push(
        `${path.relative(DIST, file)}: form "${name}" is missing ${missing.map((m) => `"${m}"`).join(', ')}\n` +
        `      Usually a mismatched tag inside the form — the parser drops everything after it.`,
      );
    }
  }
}

for (const name of Object.keys(REQUIRED)) {
  if (!seen.has(name)) problems.push(`form "${name}" was not found in any built page`);
}

if (problems.length) {
  console.error('\n✗ Form field check FAILED:\n');
  problems.forEach((p) => console.error(`  • ${p}`));
  console.error('');
  process.exit(1);
}
console.log(`✓ Form fields intact (${[...seen].map(([k, v]) => `${k}×${v}`).join(', ')})`);
