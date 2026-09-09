# HVRSD ecoPTO Website

This website is built with Astro, Tailwind CSS, and Decap CMS to be fast, secure, and easy for volunteers to update.

## Prerequisites

-   Node.js (version 18 or higher)
-   A GitHub account
-   A Netlify account

## 🚀 Project Setup & Local Development

1.  **Install Dependencies:** Open your terminal, navigate to the project folder, and run:
    ```bash
    npm install
    ```

2.  **Run the Website:** To start the live development server for the website, run:
    ```bash
    npm run dev
    ```
    You can now view your site at `http://localhost:4321`. Changes to your code will update live in the browser.

3.  **Run the Admin Panel:** The Decap CMS Admin Panel needs a local proxy to work during development. Open a **second, separate terminal window** and run:
    ```bash
    npx decap-server
    ```
    Now you can access the admin panel at `http://localhost:4321/admin/`. You can log in, create and edit content, and see the changes reflected on your local website after a page refresh.

## 🚀 Deployment to Netlify (To Go Live!)

Deploying this site is free and handles the admin panel authentication automatically.

1.  **Push to GitHub:** Create a new repository on GitHub and push this entire project to it.

2.  **Create a New Site on Netlify:**
    -   Log in to your Netlify account.
    -   Click "Add new site" -> "Import an existing project".
    -   Connect to GitHub and select your new repository.

3.  **Configure Build Settings:** Netlify will auto-detect that it's an Astro site. The default settings should be correct:
    -   **Build command:** `npm run build`
    -   **Publish directory:** `dist`

4.  **Enable Identity & Git Gateway:** This is the magic step that lets your volunteers log in to the admin panel.
    -   In your new Netlify site's dashboard, go to the **`Identity`** tab and click **`Enable Identity`**.
    -   Scroll down to **`Registration`** and set it to **`Invite only`**. This is important for security.
    -   Now, go to the **`Site configuration > Git Gateway`** tab.
    -   Click **`Enable Git Gateway`**.

5.  **Invite Your Volunteers:**
    -   Go back to the **`Identity`** tab.
    -   Click **`Invite users`** to send email invitations to the ecoPTO members who will be updating the site. Once they accept and set a password, they will be able to log in at `your-new-site-url.netlify.app/admin/`.

You now have a fully functional, easy-to-update website for your ecoPTO!

---

## 📬 YEWsletter

The newsletter is written in Decap CMS (**Newsletter - Issues**), rendered by a React Email
template, and delivered by Resend. `FORM_SUBMISSION.md` covers the signup side; this covers
sending.

### One-time setup

1. Create an API key in the Resend dashboard → API Keys.
2. Register the sending domain and create the audience:
   ```bash
   RESEND_API_KEY=re_... node scripts/resend-setup.mjs --domain ecopto.org --audience "Newsletter Subscribers"
   ```
3. Add the DNS records it prints (SPF + DKIM), then re-run with `--check` until it reports
   `verified`.
4. **Fill in `postalAddress` in `src/config/org.js`.** CAN-SPAM requires a physical postal
   address in bulk email; the send script refuses to send to the audience until it's set.
5. Set these as **GitHub Actions secrets** (for the send workflow) and in **Netlify env vars**
   (for the form function): `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `RESEND_FROM`.
6. Optionally import the existing list — see `FORM_SUBMISSION.md`.

### Sending an issue

Write the issue in Decap CMS, then set **Status**:

| Status | What happens on the next push to `main` |
|---|---|
| `Draft` | Nothing. |
| `Send test` | Emails only the test address, then **resets itself to Draft** so it can't re-fire. Iterate as often as you like. |
| `Ready` | Creates a **draft broadcast** in Resend and marks the issue `Waiting in Resend`. You open Resend, preview, and press Send — then set the status to `Sent`. |
| `SEND NOW` | Creates *and sends* a broadcast to every subscriber. Requires the confirmation checkbox. |
| `Sent` | Done. The issue appears in the public archive at `/newsletter`. |

The usual path is **Send test → check your inbox → Ready → press Send in Resend → Sent**.

### Previewing locally

```bash
npm run newsletter:preview
```

Renders every unsent issue to `.preview/*.html` — open one in a browser to see the real
email. The Decap preview pane renders the same component in a sandboxed iframe, so both
show what actually gets sent. Always follow up with a real **Send test** before a bulk
send: only a genuine inbox shows you how Gmail and Outlook will treat it.

### Things worth knowing

- **Files are linked, not attached.** Resend broadcasts can't carry attachments. Anything in
  "Files & Downloads" is uploaded to the site and linked; the send script warns if a linked
  file is missing from `/public`.
- **The archive is a snapshot.** When an issue is pushed, the issue data plus the events
  and news that went into it are saved to `src/data/sent-newsletters/`, so the archived copy
  keeps matching the email even after the events pass. The GitHub Action commits these for
  you; if you ever run `npm run newsletter:push` locally, commit them yourself.
- **One template, three surfaces.** `src/emails/Newsletter.jsx` is rendered by the send
  script, the CMS preview pane, and the public archive page. Change it once. The archive
  page lifts only the email's `<body>`, so its typography is restated (and its HTML
  sanitized) in `[slug].astro` — content matches exactly, fonts are approximated.
- **Logos in email must be raster.** `public/email-logo.png` exists because Gmail, Outlook,
  and Yahoo all strip inline SVG. Regenerate it if the logo changes.
- **An issue cannot go out twice.** Before sending, the script asks Resend whether a
  broadcast named `YEWsletter — <slug>` already exists and has left draft state; if so it
  refuses and repairs the local status. Git alone isn't trustworthy here — a workflow can
  check out a stale commit, the status commit-back can fail, and a CMS save can revert it.

