import { GitGatewayBackend } from 'decap-cms-backend-git-gateway';
import { ProxyBackend } from 'decap-cms-backend-proxy';
import { config } from '../../cms/config.js';
import {
  NEWSLETTER_FOLDER,
  NEWSLETTER_EXTENSION,
  parseIssue,
} from './format.js';

// Storage for the composer: the SAME backend classes Decap uses, not a hand-rolled GitHub
// client. In production that's git-gateway authenticated by the Netlify Identity session —
// the code path the Decap admin already runs on, so volunteers keep their logins and no one
// needs a GitHub account. Locally it's the decap-server proxy (`npm run cms`), which is what
// makes this testable end to end without signing in.
//
// Neither backend guards against two people editing one file: persistEntry commits
// whatever it's handed, so the last save silently wins. Given this project started with an
// editor losing someone's work, the editor re-reads the file before every save and merges
// field by field (mergeRemoteChanges), only stopping to ask when two people changed the
// same field.

const LOCAL_PROXY_URL = 'http://localhost:8081/api/v1';

// Decap constructs every backend with its first editorial-workflow state ("draft" — Decap's
// own review workflow, nothing to do with a newsletter's `status` field). The local proxy
// rejects a save without it ("params.options.status is required"), so build them the same way.
const BACKEND_OPTIONS = { initialWorkflowStatus: 'draft' };
const isLocalHost = () => ['localhost', '127.0.0.1'].includes(window.location.hostname);

// Mirrors Decap's own local_backend switch: only on localhost, and only if the proxy
// actually answers — otherwise fall through to git-gateway, same as the Decap admin.
async function localProxyAvailable() {
  if (!config.local_backend || !isLocalHost()) return false;
  try {
    const res = await fetch(LOCAL_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'info' }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function connect() {
  if (await localProxyAvailable()) {
    const backend = new ProxyBackend(
      { ...config, backend: { ...config.backend, name: 'proxy', proxy_url: LOCAL_PROXY_URL } },
      BACKEND_OPTIONS,
    );
    await backend.authenticate();
    return { backend, mode: 'local', user: { name: 'Local editing' } };
  }

  const backend = new GitGatewayBackend(config, BACKEND_OPTIONS);
  try {
    const user = await backend.restoreUser();
    return { backend, mode: 'netlify', user };
  } catch {
    return { backend, mode: 'netlify', user: null };
  }
}

// Opens the Netlify Identity login modal and resolves once someone has signed in.
export function signIn(backend) {
  return new Promise((resolve, reject) => {
    const widget = window.netlifyIdentity;
    if (!widget) {
      reject(new Error('The sign-in service did not load. Check your connection and reload the page.'));
      return;
    }
    const onLogin = async (gotrueUser) => {
      widget.off('login', onLogin);
      widget.close();
      try {
        resolve(await backend.authenticate(gotrueUser));
      } catch (e) {
        reject(e);
      }
    };
    widget.on('login', onLogin);
    widget.open('login');
  });
}

export async function signOut(backend) {
  await backend.logout();
}

const pathFor = (slug) => `${NEWSLETTER_FOLDER}/${slug}.${NEWSLETTER_EXTENSION}`;
const slugOf = (path) => path.split('/').pop().replace(/\.(md|mdx)$/, '');

export async function listIssues(backend) {
  const entries = await backend.entriesByFolder(NEWSLETTER_FOLDER, NEWSLETTER_EXTENSION, 1);
  return entries
    .map((e) => {
      try {
        return { path: e.file.path, slug: slugOf(e.file.path), raw: e.data, ...parseIssue(e.data) };
      } catch (err) {
        // One malformed file shouldn't take the whole list down with it.
        return { path: e.file.path, slug: slugOf(e.file.path), raw: e.data, data: {}, body: '', error: err.message };
      }
    })
    .sort((a, b) => String(b.data.sendDate || '').localeCompare(String(a.data.sendDate || '')));
}

export async function loadIssue(backend, path) {
  const entry = await backend.getEntry(path);
  return { path, slug: slugOf(path), raw: entry.data, ...parseIssue(entry.data) };
}

export { mergeRemoteChanges } from './merge.js';

export async function saveIssue(backend, { path, slug, raw, isNew, subject }) {
  const commitMessage = isNew
    ? `Create Newsletter Issue “${slug}”`
    : `Update Newsletter Issue “${slug}”`;
  await backend.persistEntry(
    { dataFiles: [{ path, slug, raw }], assets: [] },
    { commitMessage, newEntry: isNew, collectionName: 'newsletters', useWorkflow: false, unpublished: false },
  );
  return { path, slug, raw, subject };
}

export { pathFor, slugOf };

const MEDIA_FOLDER = config.media_folder; // public/assets/images
const PUBLIC_FOLDER = config.public_folder; // /assets/images

const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

// Uploads go where Decap's image and file widgets put them, so an issue edited in either
// tool points at the same place and push-newsletter.mjs's /public check still finds them.
export async function uploadFile(backend, file) {
  const dot = file.name.lastIndexOf('.');
  const stem = dot > 0 ? file.name.slice(0, dot) : file.name;
  const ext = dot > 0 ? file.name.slice(dot).toLowerCase() : '';
  const safe = `${stem.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'file'}-${Date.now().toString(36)}${ext}`;
  const repoPath = `${MEDIA_FOLDER}/${safe}`;
  const base64 = await toBase64(file);
  await backend.persistMedia(
    { path: repoPath, fileObj: file, toBase64: () => Promise.resolve(base64) },
    { commitMessage: `Upload “${safe}”` },
  );
  // The uploaded file isn't on the live site until the next deploy, so the preview needs
  // its own copy. A data: URL rather than a blob: URL, because the preview renders in a
  // sandboxed frame with an opaque origin, and blob URLs only resolve for the origin that
  // created them.
  return { publicPath: `${PUBLIC_FOLDER}/${safe}`, localUrl: `data:${file.type || 'application/octet-stream'};base64,${base64}` };
}
