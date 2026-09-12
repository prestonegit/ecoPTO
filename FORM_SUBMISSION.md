# Forms & Email

Everything the site sends or collects goes through **Resend**. Netlify hosts the site and
runs one function; Netlify Forms is no longer used.

> Historical note: this site used to use Netlify Forms (`data-netlify="true"`). That was
> replaced because it capped out at 100 submissions/month, captured only the email address
> into the mailing list, and couldn't send confirmation or notification emails.

---

## How a form submission flows

```
Browser form  ──POST /api/forms──▶  netlify/functions/forms.mjs  ──▶  Resend
                                            │
                                            ├─▶ contact added to the audience (signup only)
                                            ├─▶ confirmation email to the submitter
                                            └─▶ notification email to the ecoPTO team
```

There are three forms, all handled by the same function:

| Form | Where | What happens |
|---|---|---|
| `signup` | Get Involved modal | Adds a Resend contact with school/interests/volunteer roles as contact properties, sends a welcome email, notifies the team |
| `staff-support` | Get Involved modal | Receipt to the sender, detailed notification to the team |
| `contact` | Home page contact section | Receipt to the sender, detailed notification to the team |

**The notification email is the submission archive.** There is no dashboard to log into —
every submission arrives in the team inbox with every field, and `Reply-To` is set to the
sender so you can answer directly.

Only people who tick "receive updates" are added to the mailing audience. Everyone else
still generates a notification; they just aren't subscribed.

### Spam handling

Netlify Forms provided Akismet. In its place the function uses three checks, all of which
return `200 {"ok":true}` so a bot learns nothing:

- a **honeypot** field positioned off-screen that humans never see
- a **signed nonce**: the page fetches one from `GET /api/forms` on load and submits it
  back. The server signs the issue time, so it can enforce a 2.5s minimum fill and a 2h
  expiry without trusting the visitor's clock — and without a bot being able to skip the
  check by omitting a field
- a **per-instance rate limit** of 5 submissions per minute per IP

This is a public endpoint that sends email, so those matter: without them anyone could
use it to mail arbitrary addresses from your verified domain and burn your Resend quota.
It is a speed bump, not a guarantee. If you ever see abuse, put Netlify's rate limiting
or a CAPTCHA in front of it.

### Contact properties

Each contact carries these, so the audience stays sortable:

| Property | Set by |
|---|---|
| `schools`, `impact_focus`, `volunteer_roles`, `wants_active_role`, `signed_up_at` | the signup form |
| `source` | `website-form` for form signups; `legacy-manual` / `meeting-signin` for contacts imported from the pre-website Google Contacts lists |
| `list_group` | `general` for form signups; `admin` / `partners` / `ptos` for the imported groups |

They must exist in Resend before a contact can carry them — `scripts/resend-setup.mjs`
creates them all.

### Unsubscribing

The welcome email carries a real unsubscribe link to `/api/unsubscribe`, handled by
`netlify/functions/unsubscribe.mjs`:

- The address is **signed** (HMAC), so nobody can unsubscribe someone else by editing the
  query string.
- `GET` shows a confirmation page with one button. It deliberately does *not* unsubscribe
  on its own — mail clients and security scanners prefetch links, and a GET that acted
  would quietly unsubscribe people who never clicked.
- `POST` performs it. That also satisfies RFC 8058 one-click, so the `List-Unsubscribe`
  and `List-Unsubscribe-Post` headers we set make Gmail's and Apple Mail's own
  Unsubscribe button work.

Newsletter **broadcasts** don't use this endpoint — Resend substitutes its own
`{{{RESEND_UNSUBSCRIBE_URL}}}` token there, wired into its suppression list.

Signatures are **scoped** (`n:` for nonces, `u:` for unsubscribe links), so a token minted
for one purpose can't be replayed as the other. Unsubscribe links deliberately **never
expire** — a link in an old email should still work, per RFC 8058. The trade-off is that
if someone resubscribes, an old link still unsubscribes them again; changing
`FORM_SECRET` is the way to invalidate every outstanding link at once.

> `FORM_SECRET` signs both submission nonces and unsubscribe links. It defaults to a hash
> of `RESEND_API_KEY`, so **rotating that key invalidates every outstanding unsubscribe
> link**. Set `FORM_SECRET` explicitly before rotating. If neither is set the code now
> throws rather than signing with a known-empty secret.

### If a send fails

The function checks the result of every Resend call and returns a 500 the visitor can
see, rather than reporting success for an email that never left. Failures are in the
Netlify function logs (Site → Logs → Functions).

### Adding a field to a form

1. Add the input to the `.astro` component. Everything inside the `<form>` is collected
   automatically by `src/lib/forms.js` — no wiring needed.
2. Add it to the relevant `fields` array in `netlify/functions/forms.mjs` so it shows up in
   the notification email.
3. For signup only: add it to `properties` in the same file if it should live on the Resend
   contact record for segmenting later.

---

## Environment variables (set in Netlify → Site settings → Environment variables)

| Variable | Required | Purpose |
|---|---|---|
| `RESEND_API_KEY` | yes | Resend API key |
| `RESEND_FROM` | yes | e.g. `ecoPTO <news@ecopto.org>` — the domain must be verified in Resend |
| `RESEND_AUDIENCE_ID` | yes | Audience new subscribers are added to |
| `NOTIFY_EMAIL` | no | Catch-all recipient for all three forms. Defaults to the address in `src/config/org.js` |
| `NOTIFY_SIGNUP` | no | Overrides `NOTIFY_EMAIL` for signups |
| `NOTIFY_STAFF` | no | Overrides `NOTIFY_EMAIL` for staff support requests |
| `NOTIFY_CONTACT` | no | Overrides `NOTIFY_EMAIL` for contact messages |
| `SITE_URL` | no | Base URL for images and links in the emails. Defaults to `siteUrl` in `src/config/org.js` |
| `FORM_SECRET` | no | Key used to sign submission nonces. Defaults to a hash of `RESEND_API_KEY`; set it explicitly if you ever rotate that key mid-session |

Each `NOTIFY_*` accepts a comma-separated list.

---

## Importing subscribers

The 111 signups Netlify Forms collected between Aug 2025 and Sep 2026 have **already been
imported** — 103 unique opted-in addresses, merged with the 41 the old hook had added, for
103 contacts total with no duplicates. Resend upserts by email, so re-running an import is
safe.

To import another list (e.g. the historical YEWsletter BCC list), put it in a CSV and run:

```bash
RESEND_API_KEY=... RESEND_AUDIENCE_ID=... npm run subscribers:import -- signup.csv --dry-run
```

Add `--only-opted-in` to skip rows where "receive updates" wasn't ticked — do that unless
you have another basis for mailing them.

The `email` column is required; `name` is used if present. Any column named `schools`,
`impact_focus`, `volunteer_roles`, `wants_active_role`, or `signed_up_at` is carried across
as a Resend contact property, matching what the signup form writes. When the same address
appears more than once, the last row wins.

Netlify Forms submissions can also be read straight from the Netlify API without exporting
a CSV, which is how the initial import was done.

Drop `--dry-run` once the preview looks right. Re-running is safe — duplicates are skipped.

---

## If you outgrow this

Resend stores *contacts*, not *submissions*. If you ever need to answer questions like
"how many Bear Tavern parents signed up last spring?", that wants a real table — Supabase
is the natural fit, and would slot in beside the Resend calls in the same function.
