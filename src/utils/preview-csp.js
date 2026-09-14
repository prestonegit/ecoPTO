// Locks down a rendered email before it's shown as an editor preview.
//
// The preview is a sandboxed iframe (sandbox=""), which already blocks script — but only
// while it stays embedded. A blob: URL opened in its own tab ("Open frame in new tab") takes
// the ORIGIN THAT CREATED IT, with no sandbox: script in newsletter content (marked passes raw
// HTML through, e.g. an onerror attribute pasted into a callout) would then run as ecopto.org
// and could read the Netlify Identity session. A CSP carried inside the document itself goes
// wherever the document goes, so it still applies in a new tab.
//
// No script-src at all, so nothing executes. Images may come from anywhere, including the
// data: URLs used for not-yet-deployed uploads; styles are inline (email CSS) plus Google Fonts.
const PREVIEW_CSP = [
  "default-src 'none'",
  'img-src * data: blob:',
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com data:',
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

export function lockDownPreviewHtml(html) {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_CSP}">`;
  // The CSP must come before anything it's meant to govern, so put it first in <head>.
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${meta}`);
  return `${meta}${html}`;
}
