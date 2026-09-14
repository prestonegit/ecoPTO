import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DateTimeField, MarkdownField, TextField, Toggle, UploadField, BlocksEditor, AttachmentsEditor,
} from './fields.jsx';
import SendSteps from './SendSteps.jsx';
import EmailPreview from './EmailPreview.jsx';
import {
  cleanForSave, normalizeData, parseIssue, slugForNewIssue, stringifyIssue,
} from './format.js';
import { freeSlugForNewIssue, loadIssue, mergeRemoteChanges, pathFor, saveIssue, uploadFile } from './backend.js';
import { contentFingerprint } from '../../utils/newsletter-fingerprint.js';
import { BOT_KEYS } from './merge.js';

// Same defaults Decap writes into a brand-new issue, so a file created here is
// indistinguishable from one created there.
const NEW_ISSUE = { includeEvents: true, includeNews: true, status: 'draft' };

export const STATUS_LABEL = {
  draft: 'Draft',
  'send-test': 'Test on its way',
  'ready-to-send': 'Going to Resend',
  'in-resend': 'Waiting in Resend',
  'send-now': 'Sending to everyone',
  'send-now-confirmed': 'Sending to everyone',
  sent: 'Sent',
};

// Statuses that make CI send something. Only an explicit send action may write one.
const ARMED = new Set(['send-test', 'ready-to-send', 'send-now', 'send-now-confirmed']);

const backupKey = (path) => `ecopto-composer:${path || 'new'}`;

// Read synchronously, before the first render. It used to be read in an effect, and the
// effect below that mirrors edits to storage ran in the same pass: it saw a clean form (the
// restore offer's state update hadn't landed yet) and deleted the backup the offer was
// about to present. The banner still appeared once, from memory — but reload again without
// choosing and the edits were gone for good.
function readBackup(issue) {
  const key = backupKey(issue && issue.path);
  let b;
  try {
    b = JSON.parse(window.localStorage.getItem(key) || 'null');
  } catch {
    return null; // unreadable; leave it rather than risk deleting something recoverable
  }
  if (!b || !b.data) return null;
  const body = issue ? issue.body : '';
  const theirs = stringifyIssue(cleanForSave(normalizeData(b.data), issue ? issue.data : {}), body);
  const saved = issue ? stringifyIssue(cleanForSave(normalizeData(issue.data), issue.data), body) : null;
  if (issue && theirs === saved) {
    window.localStorage.removeItem(key); // identical to what's saved; nothing to offer
    return null;
  }
  return { ...b, stale: issue ? b.baseRaw !== issue.raw : false };
}

function validate(data) {
  const errors = {};
  if (!String(data.subject || '').trim()) errors.subject = 'Give the email a subject before saving.';
  if (!data.sendDate) errors.sendDate = 'Pick a send date before saving.';
  return errors;
}

const ago = (t) => {
  const s = Math.round((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  return new Date(t).toLocaleString(undefined, { hour: 'numeric', minute: '2-digit', month: 'short', day: 'numeric' });
};

export default function IssueEditor({ backend, issue, existingSlugs, onSaved, onBack }) {
  const [base, setBase] = useState(issue || null); // the version on the server we last saw
  const [data, setData] = useState(() => normalizeData(issue ? issue.data : NEW_ISSUE));
  const [body] = useState(issue ? issue.body : '');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null); // { tone, text }
  const [errors, setErrors] = useState({});
  const [conflict, setConflict] = useState(null); // { remote, changed, pending }
  const [restore, setRestore] = useState(() => readBackup(issue)); // backup offer
  const [savedAt, setSavedAt] = useState(null);
  const [localUrls, setLocalUrls] = useState({});

  // Is the most recent test a test of what's in the form right now? Recomputed as they type;
  // SHA-256 of a few kilobytes is instant. 'none' = never tested, 'legacy' = tested before
  // tests were fingerprinted (the send script will ask for a fresh one), 'stale' = edited since.
  const [testState, setTestState] = useState('none');
  useEffect(() => {
    let cancelled = false;
    if (!data.lastTestSentAt || !base) {
      setTestState('none');
      return undefined;
    }
    if (!data.lastTestHash) {
      setTestState('legacy');
      return undefined;
    }
    contentFingerprint(base.slug, data).then((fp) => {
      if (!cancelled) setTestState(fp === data.lastTestHash ? 'current' : 'stale');
    });
    return () => { cancelled = true; };
  }, [data, base]);

  // The freshest data, readable from inside async save code without a stale closure.
  const latest = useRef(data);
  latest.current = data;

  const draftRaw = useMemo(
    () => stringifyIssue(cleanForSave(normalizeData(data), base ? base.data : {}), body),
    [data, base, body],
  );
  // Compare against the saved version run through the same serialiser, not its raw bytes.
  // The send script's write-back appends keys (confirmSend, lastTestSentAt) at the end of
  // the frontmatter, out of field order, so a byte comparison reported unsaved changes on
  // an issue nobody had touched, right after every test.
  const baseCanonical = useMemo(
    () => (base ? stringifyIssue(cleanForSave(normalizeData(base.data), base.data), base.body) : null),
    [base],
  );
  const dirty = base ? draftRaw !== baseCanonical : JSON.stringify(data) !== JSON.stringify(normalizeData(NEW_ISSUE));

  const update = useCallback((patch) => {
    setData((d) => ({ ...d, ...patch }));
    setNotice(null); // a "Saved." from before this edit is no longer true
    setErrors((e) => {
      const next = { ...e };
      Object.keys(patch).forEach((k) => delete next[k]);
      return next;
    });
  }, []);

  // ---- Crash-proof backup -------------------------------------------------------------
  // Every change is mirrored to this browser within a second. If the tab crashes, the
  // laptop dies, or someone closes the window, reopening the issue offers it back.
  useEffect(() => {
    if (restore) return undefined; // don't clobber the backup before they've decided
    const key = backupKey(base && base.path);
    if (!dirty) {
      window.localStorage.removeItem(key);
      return undefined;
    }
    const t = setTimeout(() => {
      try {
        window.localStorage.setItem(key, JSON.stringify({ data, body, at: Date.now(), baseRaw: base ? base.raw : null }));
      } catch {
        /* storage full or disabled; the save button still works */
      }
    }, 800);
    return () => clearTimeout(t);
  }, [data, dirty, base, body, restore]);

  useEffect(() => {
    const warn = (e) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ---- Saving ---------------------------------------------------------------------------
  const persist = useCallback(
    async (nextData, { successText = 'Saved.', overrideBase, status: sendStatus } = {}) => {
      const v = validate(nextData);
      setErrors(v);
      if (Object.keys(v).length) {
        setNotice({ tone: 'error', text: 'A couple of things need filling in first.' });
        document.querySelector('.cmp-field.has-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
      setSaving(true);
      setNotice(null);
      const snapshot = nextData;
      const baseline = overrideBase || base;
      try {
        // A send's status is a parameter of THIS save, never part of the form. It used to be
        // written into the form first, so when the save hit a conflict (or failed) the form
        // was left holding an unsaved 'send-now-confirmed', with no cancel button shown for
        // that state, and the next ordinary Save or Cmd+S emailed the whole list.
        let toWrite = normalizeData(sendStatus ? { ...nextData, status: sendStatus } : nextData);
        let cleanAgainst = baseline ? baseline.data : {};
        let serverStatus = baseline ? baseline.data.status : undefined;
        let mergedKeys = [];
        let bodyToWrite = body;
        let path;
        let slug;
        const isNew = !baseline;

        if (isNew) {
          slug = await freeSlugForNewIssue(backend, toWrite, slugForNewIssue);
          path = pathFor(slug);
        } else {
          ({ path, slug } = baseline);
          // Never overwrite a version we haven't seen.
          const remote = await loadIssue(backend, path);
          if (remote.raw !== baseline.raw) {
            const m = mergeRemoteChanges({ base: baseline, remote, local: { data: toWrite, body } });
            if (!m.ok) {
              // `nextData` never carries the send status (see above), so resolving the
              // conflict can't quietly re-arm a send. `interruptedSend` is only for the message.
              setConflict({ remote, changed: m.remoteChanged, pending: nextData, against: baseline, interruptedSend: sendStatus });
              return false;
            }
            toWrite = normalizeData(m.data);
            bodyToWrite = m.body;
            cleanAgainst = remote.data;
            mergedKeys = m.merged || [];
          }
          serverStatus = remote.data.status;
        }

        // Invariant, whatever path the form state took to get here (a restored backup, a
        // merge, a resolved conflict): only an explicit send action can set a send in motion.
        // An ordinary save keeps whatever status the file already has on the server.
        if (!sendStatus && ARMED.has(toWrite.status) && toWrite.status !== serverStatus) {
          toWrite = { ...toWrite, status: serverStatus || 'draft' };
        }

        const raw = stringifyIssue(cleanForSave(toWrite, cleanAgainst), bodyToWrite);
        await saveIssue(backend, { path, slug, raw, isNew });
        const parsed = parseIssue(raw);
        const nextBase = { path, slug, raw, data: parsed.data, body: bodyToWrite };

        window.localStorage.removeItem(backupKey(baseline && baseline.path));
        window.localStorage.removeItem(backupKey(path));
        setBase(nextBase);
        // If they kept typing while the save was in flight, keep their newer text; only
        // fold in what the save itself changed (the status it set, bot bookkeeping).
        setData((current) => {
          if (current === snapshot) return normalizeData(parsed.data);
          const carried = { ...current };
          ['status', ...mergedKeys].forEach((k) => {
            if (parsed.data[k] === undefined) delete carried[k];
            else carried[k] = parsed.data[k];
          });
          return normalizeData(carried);
        });
        setSavedAt(Date.now());
        const others = mergedKeys.filter((k) => !BOT_KEYS.has(k));
        setNotice({
          tone: 'ok',
          text: others.length
            ? `${successText} Someone else had also changed ${others.join(', ')}; their edits were kept alongside yours.`
            : successText,
        });
        onSaved(nextBase, isNew);
        return true;
      } catch (e) {
        const why = String(e.message || e).replace(/[.\s]+$/, '');
        setNotice({ tone: 'error', text: `Couldn’t save: ${why}. Your changes are still here and backed up in this browser.` });
        return false;
      } finally {
        setSaving(false);
      }
    },
    [backend, base, body, onSaved],
  );

  const save = useCallback(() => persist(latest.current), [persist]);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!saving) save();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, saving]);

  const onSend = (status) => {
    const text = {
      'send-test': 'Saved. Your test is on its way.',
      'ready-to-send': 'Saved. The draft is being created in Resend.',
      'send-now-confirmed': 'Saved. Sending to everyone.',
      sent: 'Marked as sent.',
      draft: 'Back to draft.',
    }[status];
    return persist(latest.current, { successText: text, status });
  };

  const refresh = async () => {
    if (!base) return;
    setSaving(true);
    try {
      const remote = await loadIssue(backend, base.path);
      if (remote.raw === base.raw) {
        setNotice({ tone: 'info', text: 'No news yet. Give it another minute.' });
        return;
      }
      if (!dirty) {
        setBase(remote);
        setData(normalizeData(remote.data));
        setNotice({ tone: 'ok', text: 'Updated.' });
        return;
      }
      const m = mergeRemoteChanges({ base, remote, local: { data: latest.current, body } });
      if (!m.ok) {
        setConflict({ remote, changed: m.remoteChanged, pending: latest.current, against: base });
        return;
      }
      setBase(remote);
      setData(normalizeData(m.data));
      setNotice({ tone: 'ok', text: 'Updated.' });
    } catch (e) {
      setNotice({ tone: 'error', text: `Couldn’t check: ${e.message || e}` });
    } finally {
      setSaving(false);
    }
  };

  // Settle only the colliding fields; everyone's other edits stay. Choosing "theirs" loads
  // the combined result without saving, so it can be looked over first; "mine" saves.
  const resolveConflict = (prefer) => {
    const { remote, pending, against, interruptedSend } = conflict;
    const m = mergeRemoteChanges({ base: against, remote, local: { data: normalizeData(pending), body }, prefer });
    setConflict(null);
    setBase(remote);
    // Take the status from the server, never from the form: resolving a conflict must not be
    // what starts or re-starts a send.
    const merged = normalizeData({ ...m.data, status: remote.data.status });
    setData(merged);
    const sendNote = interruptedSend ? ' Nothing was sent. Look it over, then use the send step again.' : '';
    if (prefer === 'local') {
      persist(merged, { overrideBase: remote, successText: `Saved with your version.${sendNote}` });
    } else {
      setNotice({ tone: 'info', text: `Using their version of that. Your other changes are still here; save when ready.${sendNote}` });
    }
  };

  // A backup is restored the same way: merged against the version it was made from, so an
  // edit saved by someone else in the meantime survives the restore.
  const restoreBackup = () => {
    const saved = normalizeData(restore.data);
    setRestore(null);
    if (!restore.stale || !restore.baseRaw || !base) {
      setData(saved);
      return;
    }
    let against;
    try {
      against = parseIssue(restore.baseRaw);
    } catch {
      setData(saved);
      return;
    }
    const m = mergeRemoteChanges({ base: against, remote: base, local: { data: saved, body } });
    if (m.ok) {
      setData(normalizeData(m.data));
      setNotice({ tone: 'info', text: m.merged.length ? `Restored your changes and kept what was saved since (${m.merged.join(', ')}).` : 'Restored your changes.' });
    } else {
      setData(saved);
      setConflict({ remote: base, changed: m.remoteChanged, pending: saved, against });
    }
  };

  const onUpload = async (file, kind) => {
    const { publicPath, localUrl } = await uploadFile(backend, file, kind);
    setLocalUrls((u) => ({ ...u, [publicPath]: localUrl }));
    return publicPath;
  };

  const status = data.status || 'draft';
  const locked = status === 'sent';

  return (
    <div className="cmp-editor">
      <div className="cmp-editor-head">
        <button type="button" className="cmp-back" onClick={onBack}>← All issues</button>
        <div className="cmp-editor-title">
          <h1>{data.subject || (base ? 'Untitled issue' : 'New issue')}</h1>
          <span className={`cmp-pill is-${status}`}>{STATUS_LABEL[status] || status}</span>
        </div>
      </div>

      {restore && (
        <div className="cmp-banner is-warn" role="alert">
          <div>
            <strong>You have unsaved changes from {ago(restore.at)}.</strong>{' '}
            {restore.stale
              ? 'The issue has been saved since then too. Restoring combines your edits with those changes.'
              : 'They were kept in this browser when the page closed.'}
          </div>
          <div className="cmp-row">
            <button type="button" className="cmp-btn cmp-btn-primary" onClick={restoreBackup}>Restore my changes</button>
            <button type="button" className="cmp-btn cmp-btn-link" onClick={() => { window.localStorage.removeItem(backupKey(base && base.path)); setRestore(null); }}>Discard them</button>
          </div>
        </div>
      )}

      {conflict && (
        <div className="cmp-banner is-danger" role="alert">
          <div>
            <strong>You and someone else both changed the same thing.</strong> While you were editing,
            they saved a different version of: {conflict.changed.join(', ')}. Everything else you both
            changed can be combined; this can’t. Nothing has been overwritten yet.
          </div>
          <div className="cmp-row">
            <button type="button" className="cmp-btn cmp-btn-quiet" onClick={() => resolveConflict('remote')}>
              Use their version of {conflict.changed.length === 1 ? 'it' : 'these'}
            </button>
            <button type="button" className="cmp-btn cmp-btn-primary" onClick={() => resolveConflict('local')}>
              Keep my version of {conflict.changed.length === 1 ? 'it' : 'these'}
            </button>
          </div>
        </div>
      )}

      <div className="cmp-split">
        <div className="cmp-form">
          <section className="cmp-card">
            <h2><span>1</span> Write it</h2>
            <TextField label="Subject" hint="What people see in their inbox." value={data.subject} error={errors.subject} onChange={(v) => update({ subject: v })} maxLength={150} />
            <TextField label="Preview text" optional hint="The short line shown next to the subject in most inboxes." value={data.preheader} onChange={(v) => update({ preheader: v })} maxLength={200} />
            <DateTimeField label="Send date" hint="The date shown on the issue and in the archive." value={data.sendDate} error={errors.sendDate} onChange={(v) => update({ sendDate: v })} />
            <UploadField label="Banner image" optional hint="Appears across the top of the email." value={data.heroImage} onChange={(v) => update({ heroImage: v })} onUpload={onUpload} localUrls={localUrls} />
            <MarkdownField label="Opening note" optional hint="A note from the team at the top." value={data.intro} onChange={(v) => update({ intro: v })} rows={6} />
          </section>

          <section className="cmp-card">
            <h2><span>2</span> What’s in it</h2>
            <Toggle label="Include upcoming events" hint="Pulled from the Events section of the site automatically." checked={data.includeEvents} onChange={(v) => update({ includeEvents: v })} />
            {data.includeEvents !== false && (
              <TextField label="Line above the events" optional placeholder="Mark your calendars:" value={data.eventsIntro} onChange={(v) => update({ eventsIntro: v })} />
            )}
            <Toggle label="Include latest news" hint="Recent posts from the News section." checked={data.includeNews} onChange={(v) => update({ includeNews: v })} />
            {data.includeNews !== false && (
              <TextField label="Line above the news" optional value={data.newsIntro} onChange={(v) => update({ newsIntro: v })} />
            )}
            <div className="cmp-subhead">Extra blocks</div>
            <BlocksEditor blocks={data.customBlocks || []} onChange={(v) => update({ customBlocks: v })} onUpload={onUpload} localUrls={localUrls} />
          </section>

          <section className="cmp-card">
            <h2><span>3</span> Files and sign-off</h2>
            <div className="cmp-subhead">Linked files</div>
            <AttachmentsEditor items={data.attachments || []} onChange={(v) => update({ attachments: v })} onUpload={onUpload} localUrls={localUrls} />
            <MarkdownField label="Closing note" optional value={data.closing} onChange={(v) => update({ closing: v })} rows={3} />
          </section>

          <section className="cmp-card">
            <h2><span>4</span> Send</h2>
            <SendSteps
              data={data}
              testState={testState}
              update={update}
              onSend={onSend}
              onRefresh={refresh}
              busy={saving}
              blocked={Boolean(conflict) || locked}
            />
          </section>
        </div>

        <aside className="cmp-side">
          <EmailPreview data={data} localUrls={localUrls} />
        </aside>
      </div>

      <div className="cmp-savebar">
        <div className={`cmp-save-state${notice ? ` is-${notice.tone}` : ''}`} aria-live="polite">
          {saving
            ? 'Saving…'
            : notice
              ? notice.text
              : dirty
                ? 'Not saved yet. Your changes are backed up in this browser.'
                : savedAt
                  ? `All changes saved ${ago(savedAt)}.`
                  : base
                    ? 'No changes.'
                    : 'Nothing saved yet.'}
        </div>
        <button type="button" className="cmp-btn cmp-btn-primary cmp-btn-save" disabled={saving || (!dirty && Boolean(base)) || Boolean(conflict)} onClick={save}>
          {saving ? 'Saving…' : status === 'draft' ? 'Save draft' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}
