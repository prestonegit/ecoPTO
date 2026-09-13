import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { connect, listIssues, loadIssue, pathFor, signIn, signOut } from './backend.js';
import IssueEditor, { STATUS_LABEL } from './IssueEditor.jsx';
import { isDateOnly, toDate } from './format.js';

// The newsletter composer: a dedicated page for the one workflow that's frequent,
// high-stakes, and done by non-technical volunteers. Everything else on the site is still
// edited in Decap at /admin, and the two read and write the very same files.
//
// Routing is in the URL hash (#/new, #/issue/<slug>) so a refresh keeps your place and a
// link can point straight at an issue.

const IN_PROGRESS = new Set(['draft', 'send-test', 'ready-to-send', 'in-resend', 'send-now', 'send-now-confirmed']);

const parseRoute = () => {
  const h = window.location.hash;
  if (h === '#/new') return { view: 'new' };
  const m = h.match(/^#\/issue\/(.+)$/);
  return m ? { view: 'issue', slug: decodeURIComponent(m[1]) } : { view: 'list' };
};

const go = (hash) => {
  if (window.location.hash !== hash) window.location.hash = hash;
};

const dateLabel = (v) => {
  const d = toDate(v);
  if (!d) return v ? String(v) : 'No date';
  // Timestamps are shown in Eastern, like the email; a date-only value is already a
  // calendar day and must not be shifted into any zone.
  return d.toLocaleDateString(undefined, {
    month: 'long', day: 'numeric', year: 'numeric',
    ...(isDateOnly(v) ? {} : { timeZone: 'America/New_York' }),
  });
};

function IssueCard({ issue }) {
  const s = issue.data.status || 'draft';
  return (
    <a className="cmp-issue" href={`#/issue/${encodeURIComponent(issue.slug)}`}>
      <div className="cmp-issue-main">
        <div className="cmp-issue-subject">{issue.data.subject || <em>Untitled</em>}</div>
        <div className="cmp-issue-meta">{dateLabel(issue.data.sendDate)}{issue.data.preheader ? ` · ${issue.data.preheader}` : ''}</div>
        {issue.error && <div className="cmp-error">This file couldn’t be read: {issue.error}</div>}
      </div>
      <span className={`cmp-pill is-${s}`}>{STATUS_LABEL[s] || s}</span>
    </a>
  );
}

export default function Composer() {
  const [conn, setConn] = useState(null); // { backend, mode, user }
  const [phase, setPhase] = useState('connecting'); // connecting | signed-out | ready | error
  const [issues, setIssues] = useState(null);
  const [route, setRoute] = useState(parseRoute);
  const [open, setOpen] = useState(null); // the issue being edited, freshly loaded
  const [err, setErr] = useState(null);

  useEffect(() => {
    const onHash = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    connect()
      .then((c) => {
        setConn(c);
        setPhase(c.user ? 'ready' : 'signed-out');
      })
      .catch((e) => {
        setErr(e.message || String(e));
        setPhase('error');
      });
  }, []);

  const refreshList = useCallback(async () => {
    if (!conn) return;
    try {
      setIssues(await listIssues(conn.backend));
    } catch (e) {
      setErr(`Couldn’t load the issues: ${e.message || e}`);
    }
  }, [conn]);

  useEffect(() => {
    if (phase === 'ready') refreshList();
  }, [phase, refreshList]);

  // Always open an issue from a fresh read, never from the list's copy, so the editor's
  // "last version I saw" is genuinely the latest.
  useEffect(() => {
    if (phase !== 'ready' || route.view !== 'issue') {
      setOpen(null);
      return;
    }
    let cancelled = false;
    setOpen({ loading: true });
    loadIssue(conn.backend, pathFor(route.slug))
      .then((issue) => !cancelled && setOpen(issue))
      .catch((e) => !cancelled && setOpen({ missing: true, message: e.message }));
    return () => { cancelled = true; };
  }, [phase, route, conn]);

  const existingSlugs = useMemo(() => new Set((issues || []).map((i) => i.slug)), [issues]);

  const onSaved = useCallback((saved, isNew) => {
    if (isNew) {
      // Swap #/new for the real address without leaving a history entry for the empty form.
      window.history.replaceState(null, '', `#/issue/${encodeURIComponent(saved.slug)}`);
    }
    refreshList();
  }, [refreshList]);

  const doSignIn = async () => {
    try {
      const user = await signIn(conn.backend);
      setConn((c) => ({ ...c, user }));
      setPhase('ready');
    } catch (e) {
      setErr(e.message || String(e));
    }
  };

  const doSignOut = async () => {
    await signOut(conn.backend);
    setConn((c) => ({ ...c, user: null }));
    setIssues(null);
    setPhase('signed-out');
    go('#/');
  };

  const inProgress = (issues || []).filter((i) => IN_PROGRESS.has(i.data.status || 'draft'));
  const sent = (issues || []).filter((i) => !IN_PROGRESS.has(i.data.status || 'draft'));

  return (
    <div className="cmp-app">
      <header className="cmp-top">
        <a className="cmp-brand" href="#/">
          <span className="cmp-brand-mark" aria-hidden="true">✉</span>
          <span>YEWsletter</span>
        </a>
        <nav className="cmp-top-nav">
          <a href="/admin">Other site content</a>
          {conn && conn.mode === 'local' && <span className="cmp-local">Local test copy</span>}
          {phase === 'ready' && conn.mode === 'netlify' && (
            <button type="button" className="cmp-top-btn" onClick={doSignOut}>Sign out</button>
          )}
        </nav>
      </header>

      <main className="cmp-main">
        {phase === 'connecting' && <p className="cmp-loading">Loading…</p>}

        {phase === 'error' && (
          <div className="cmp-banner is-danger"><strong>Something went wrong.</strong> {err}</div>
        )}

        {phase === 'signed-out' && (
          <div className="cmp-signin">
            <h1>Newsletter</h1>
            <p>Sign in with the same account you use for the site editor.</p>
            <button type="button" className="cmp-btn cmp-btn-primary" onClick={doSignIn}>Sign in</button>
            {err && <p className="cmp-error">{err}</p>}
          </div>
        )}

        {phase === 'ready' && route.view === 'list' && (
          <div className="cmp-list">
            <div className="cmp-list-head">
              <div>
                <h1>Newsletter</h1>
                <p>Write an issue, send yourself a test, then hand it off.</p>
              </div>
              <a className="cmp-btn cmp-btn-primary" href="#/new">Start a new issue</a>
            </div>
            {err && <div className="cmp-banner is-danger">{err}</div>}
            {issues === null ? (
              <p className="cmp-loading">Loading issues…</p>
            ) : (
              <>
                <h2 className="cmp-group">In progress</h2>
                {inProgress.length ? inProgress.map((i) => <IssueCard key={i.path} issue={i} />) : <p className="cmp-empty">Nothing in progress.</p>}
                <h2 className="cmp-group">Sent</h2>
                {sent.length ? sent.map((i) => <IssueCard key={i.path} issue={i} />) : <p className="cmp-empty">Nothing sent yet.</p>}
              </>
            )}
          </div>
        )}

        {phase === 'ready' && route.view === 'new' && (
          <IssueEditor key="new" backend={conn.backend} issue={null} existingSlugs={existingSlugs} onSaved={onSaved} onBack={() => go('#/')} />
        )}

        {phase === 'ready' && route.view === 'issue' && open && (
          open.loading ? <p className="cmp-loading">Opening…</p>
            : open.missing ? (
              <div className="cmp-banner is-danger">
                <strong>That issue couldn’t be found.</strong> It may have been renamed or deleted. <a href="#/">Back to all issues</a>
              </div>
            ) : (
              <IssueEditor key={open.path} backend={conn.backend} issue={open} existingSlugs={existingSlugs} onSaved={onSaved} onBack={() => go('#/')} />
            )
        )}
      </main>
    </div>
  );
}
