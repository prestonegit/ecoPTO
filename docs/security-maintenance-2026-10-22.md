# Security maintenance — October 22, 2026

This is a dependency and runtime maintenance check, not a full security audit or
proof that the deployed site is free of vulnerabilities.

## Updates

- Astro 4.16.19 → 7.4.2; Sharp 0.35.5; matching MDX, React and sitemap integrations.
- sanitize-html 2.17.7 → 2.18.1; Decap CMS 3.16.2 → 3.17.1 and current backends.
- Compatible transitive security updates, tsx 4.23.15, and a narrow trim 0.0.3
  override. trim retains the CommonJS function and left/right helpers used by
  Decap's older Markdown parser.
- Node 24 LTS selected by .nvmrc and the newsletter workflow, with a minimum
  of 24.22.1 in package.json. The workflow checks for current 24.x releases.
- Migrated legacy content collections to loaders, replaced entry.render() and
  entry.slug with render(entry) and entry.id, and renamed ViewTransitions to
  ClientRouter. JSON collection IDs and public URLs are preserved.
- Kept Tailwind 3 styles using PostCSS because the old Astro Tailwind integration
  does not support Astro 7. Preserved HTML whitespace behavior and fixed a missing
  closing div rejected by the newer compiler.

## Verification

- Clean npm ci and production build on Node 24.22.1; existing form-field checks.
- Before importing newer upstream newsletter content, all 46 HTML routes matched
  the previous build in normalized visible text, link targets and image sources;
  newsletter-data.json also matched exactly.
- Newsletter name tests: 3 passed. Newsletter previews rendered locally.
- Seven function smoke checks passed with fake credentials and external fetch
  blocked, covering nonce signing, invalid input, method handling, and unsubscribe
  confirmation. No subscriber changes or emails were made by these checks.
- Browser check: signup modal opens, client navigation works, and newsletter
  composer reaches sign-in. Authenticated editing and real email delivery were
  not exercised. A local Identity-widget load error was observed; the unchanged
  public-page initialization assumes that external script loads successfully.

## Remaining advisories

npm audit: 62 affected packages (1 critical, 28 high, 30 moderate, 3 low) before;
37 (0 critical, 5 high, 32 moderate, 0 low) after. Counts include dependency
chains and are not counts of independently exploitable production bugs.

The five high package warnings originate in braces and propagate through
micromatch, fast-glob, chokidar and Tailwind 3. This is a deeply nested glob-pattern
stack-exhaustion issue in build/development tooling. No public request path to
that pattern parser was established. Tailwind 4 migration is deferred because it
changes the styling toolchain and needs separate visual regression work.

Moderate warnings remain in Decap's Plate HTML deserializer, uuid buffer APIs,
postcss-selector-parser and sprintf-js (and their dependent packages). Current
Decap still brings these dependencies; forcing major versions or npm audit fix
--force can break editors or even downgrade Decap. No exploit through this site's
configuration was validated. Editors should only paste/import trusted content
until the affected CMS dependencies receive compatible fixes.

## Hosting runtime

The pre-update deployed functions reported nodejs22.x, without a patch version.
Netlify manages the Lambda patch level; selecting Node 24 does not independently
prove which exact patch AWS is executing. AWS_LAMBDA_JS_RUNTIME must be set via
Netlify's UI/CLI/API, not netlify.toml. Check deployed metadata after redeployment.

Sources:
- https://nodejs.org/en/blog/vulnerability/october-2026-security-releases
- https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2
- https://github.com/advisories/GHSA-x3q4-9hxx-gx8m
- https://docs.netlify.com/build/functions/configuration/
