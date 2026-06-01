// Bootstraps Resend for the newsletter: creates an Audience and registers the
// sending domain, then prints the DNS records you need to add and the env vars
// you need to set. Re-runnable — it reuses an existing audience/domain by name.
//
// Usage:
//   RESEND_API_KEY=re_... node scripts/resend-setup.mjs --domain ecopto.org --audience "Newsletter Subscribers"
//
// Flags:
//   --domain <name>      Sending domain to register (e.g. ecopto.org)
//   --audience <name>    Audience name to create/find (default: "Newsletter Subscribers")
//   --check              Skip creation; just print current domain verification status

import { Resend } from 'resend';

const args = process.argv.slice(2);
const getFlag = (name, def = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const domain = getFlag('--domain');
const audienceName = getFlag('--audience', 'Newsletter Subscribers');
const checkOnly = args.includes('--check');

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error('Set RESEND_API_KEY first (create one in the Resend dashboard → API Keys).');
  process.exit(1);
}
if (!domain) {
  console.error('Pass --domain <your-domain>, e.g. --domain ecopto.org');
  process.exit(1);
}

const resend = new Resend(apiKey);
const line = '─'.repeat(60);

async function ensureAudience() {
  const { data: list } = await resend.audiences.list();
  const existing = (list?.data || []).find((a) => a.name === audienceName);
  if (existing) {
    console.log(`✓ Audience "${audienceName}" already exists.`);
    return existing.id;
  }
  const { data, error } = await resend.audiences.create({ name: audienceName });
  if (error) throw new Error(`Audience create failed: ${error.message}`);
  console.log(`✓ Created audience "${audienceName}".`);
  return data.id;
}

async function ensureDomain() {
  const { data: list } = await resend.domains.list();
  let existing = (list?.data || []).find((d) => d.name === domain);
  if (!existing && !checkOnly) {
    const { data, error } = await resend.domains.create({ name: domain });
    if (error) throw new Error(`Domain create failed: ${error.message}`);
    existing = data;
    console.log(`✓ Registered domain "${domain}".`);
  }
  if (!existing) {
    console.log(`Domain "${domain}" not registered yet. Run without --check to create it.`);
    return null;
  }
  // Fetch full record (includes DNS records + status)
  const { data: full, error } = await resend.domains.get(existing.id);
  if (error) throw new Error(`Domain get failed: ${error.message}`);
  return full;
}

function printDns(d) {
  console.log(`\n${line}\nDNS RECORDS — add these at your DNS provider for ${domain}\n${line}`);
  for (const r of d.records || []) {
    console.log(`  ${r.type.padEnd(5)} ${r.name}`);
    console.log(`        → ${r.value}`);
    if (r.priority) console.log(`        priority: ${r.priority}`);
    console.log('');
  }
  console.log(`Current status: ${d.status}`);
  console.log(`(Run with --check later to re-poll: it flips to "verified" once DNS propagates.)`);
}

async function main() {
  const audienceId = await ensureAudience();
  const d = await ensureDomain();

  if (d) printDns(d);

  console.log(`\n${line}\nENV VARS — set these in Netlify + GitHub secrets\n${line}`);
  console.log(`  RESEND_API_KEY      = (the key you already created)`);
  console.log(`  RESEND_AUDIENCE_ID  = ${audienceId}`);
  console.log(`  RESEND_FROM         = ecoPTO <news@${domain}>`);

  if (d && d.status !== 'verified') {
    console.log(`\n⏳ Domain not verified yet. Add the DNS records above, then run:`);
    console.log(`   RESEND_API_KEY=... node scripts/resend-setup.mjs --domain ${domain} --check`);
  } else if (d && d.status === 'verified') {
    console.log(`\n✅ Domain verified — you're ready to send.`);
  }
}

main().catch((err) => { console.error('\n✗', err.message); process.exit(1); });
