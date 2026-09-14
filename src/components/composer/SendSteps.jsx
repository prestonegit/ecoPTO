import React, { useEffect, useState } from 'react';

// Test → hand to Resend → (or) send to everyone.
//
// Unlike the Decap widget this replaces for most people, each action here SAVES — there's
// no separate "now remember to press Save" step to forget. The status semantics are
// unchanged and the real gates still live in push-newsletter.mjs, which runs in CI a
// minute or so after the save lands: no bulk send without a delivered test of the content
// as it is now (lastTestHash), and 'send-now-confirmed' is only ever written after typing SEND.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const when = (v) => {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime())
    ? String(v)
    : d.toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
};

function Step({ n, title, state, children }) {
  return (
    <section className={`cmp-step is-${state}`}>
      <div className="cmp-step-num" aria-hidden="true">{state === 'done' ? '✓' : n}</div>
      <div className="cmp-step-body">
        <h3>{title}</h3>
        {children}
      </div>
    </section>
  );
}

const SLOW_AFTER_MS = 5 * 60 * 1000;

export default function SendSteps({ data, testState = 'none', queuedAt, update, onSend, onRefresh, busy, blocked }) {
  // Re-render every 30s while queued, so "taking longer than usual" appears on its own.
  const [, tick] = useState(0);
  useEffect(() => {
    if (!queuedAt) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [queuedAt]);
  const slow = queuedAt && Date.now() - queuedAt > SLOW_AFTER_MS;
  const status = data.status || 'draft';
  const testEmail = (data.testEmail || '').trim();
  // Unlocked only by a test of the content as it is NOW. A test of an earlier version (or one
  // from before tests were fingerprinted) doesn't count, and the send script agrees: it
  // refuses a bulk send whose content no longer matches its test.
  const tested = testState === 'current';
  const outdated = testState === 'stale' || testState === 'legacy';
  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');
  const canTest = EMAIL_RE.test(testEmail);
  const disabled = busy || blocked;

  // Set by the send script when a test or send failed or was refused. Status is already back
  // at draft by then, so this is what tells the person why nothing arrived.
  const problem = data.lastError ? (
    <div className="cmp-callout is-danger" role="alert">
      <h3>The last attempt didn’t go through</h3>
      <p>{data.lastError}{data.lastErrorAt ? ` (${when(data.lastErrorAt)})` : ''}</p>
      <p className="cmp-step-text" style={{ marginTop: 6 }}>Fix what it says, then try the step again. Nothing was sent.</p>
    </div>
  ) : null;

  if (status === 'sent') {
    return (
      <div className="cmp-callout is-ok">
        <h3>This issue has been sent</h3>
        <p>It’s in the public newsletter archive. Saving it again won’t send it again.</p>
      </div>
    );
  }

  const queued = {
    'send-test': {
      tone: 'info',
      title: 'Your test is on its way',
      body: <>A copy is going to <strong>{testEmail || 'the test address'}</strong>. It usually arrives within two minutes, and this page updates on its own when it has.</>,
    },
    'ready-to-send': {
      tone: 'info',
      title: 'Being set up in Resend',
      body: <>A draft is being created in Resend. No one is emailed until an admin opens Resend and presses Send.</>,
    },
    'in-resend': {
      tone: 'info',
      title: 'Waiting in Resend',
      body: <>The draft is in Resend. Once someone presses Send there, mark it as sent here.</>,
    },
    'send-now-confirmed': {
      tone: 'danger',
      title: 'Sending to everyone',
      body: <>This issue is going to every subscriber. It usually starts within two minutes. If that hasn’t happened yet, you can still stop it.</>,
    },
    'send-now': {
      tone: 'danger',
      title: 'Sending to everyone',
      body: <>This issue is queued to go to every subscriber. If it hasn’t started yet, you can still stop it.</>,
    },
  }[status];

  if (queued) {
    return (
      <div className={`cmp-callout is-${queued.tone}`}>
        <h3>{queued.title}</h3>
        <p>{queued.body}</p>
        {slow && status !== 'in-resend' && (
          <p className="cmp-note is-warn" style={{ marginTop: 10 }}>
            This is taking longer than usual. The site checks automatically, but if nothing changes
            soon, ask an admin to look at the newsletter job in GitHub Actions.
          </p>
        )}
        {status !== 'in-resend' && !slow && (
          <p className="cmp-step-text" style={{ marginTop: 8, marginBottom: 0 }}>This page checks for the result on its own.</p>
        )}
        <div className="cmp-row">
          <button type="button" className="cmp-btn cmp-btn-quiet" onClick={onRefresh} disabled={busy}>Check again</button>
          {status === 'in-resend' && (
            <button type="button" className="cmp-btn cmp-btn-quiet" onClick={() => onSend('sent')} disabled={disabled}>Mark as sent</button>
          )}
          {/* Always offered. It used to be hidden for a queued send to everyone, which is the
              one moment a mistake most needs stopping, and it left an issue the send script
              refused (say, no postal address) stuck with no way back. If the send has already
              gone out, the script's Resend check marks the issue sent regardless. */}
          <button
            type="button"
            className={status === 'send-now-confirmed' || status === 'send-now' ? 'cmp-btn cmp-btn-danger' : 'cmp-btn cmp-btn-link'}
            onClick={() => onSend('draft')}
            disabled={busy}
          >
            {status === 'send-now-confirmed' || status === 'send-now' ? 'Stop, go back to draft' : 'Cancel and go back to draft'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cmp-steps">
      {problem}
      <Step n={1} title="Send yourself a test" state={tested ? 'done' : 'current'}>
        {tested && <p className="cmp-note is-ok">Last test sent {when(data.lastTestSentAt)}. Nothing has changed since.</p>}
        {outdated && (
          <p className="cmp-note is-warn">
            {testState === 'legacy'
              ? `A test was sent ${when(data.lastTestSentAt)}, before tests were matched to content. Send a fresh one to continue.`
              : `You’ve changed this issue since the last test (${when(data.lastTestSentAt)}). Send a fresh test of this version before handing it off.`}
          </p>
        )}
        <p className="cmp-step-text">Check it in a real inbox before it goes to the list. Only you get this copy.</p>
        <div className="cmp-inline">
          <input
            className="cmp-input"
            type="email"
            aria-label="Your email address"
            placeholder="you@example.com"
            value={data.testEmail || ''}
            onChange={(e) => update({ testEmail: e.target.value })}
          />
          <button type="button" className="cmp-btn cmp-btn-primary" disabled={disabled || !canTest} onClick={() => onSend('send-test')}>
            {tested ? 'Send another test' : outdated ? 'Send a fresh test' : 'Send me a test'}
          </button>
        </div>
        {testEmail && !canTest && <p className="cmp-error">That doesn’t look like an email address.</p>}
      </Step>

      <Step n={2} title="Hand it to Resend for a final look" state={tested ? 'current' : 'locked'}>
        {tested ? (
          <>
            <p className="cmp-step-text">Recommended. Creates the broadcast in Resend without sending it, so an admin can check it and press Send there.</p>
            <button type="button" className="cmp-btn cmp-btn-primary" disabled={disabled} onClick={() => onSend('ready-to-send')}>
              Create the draft in Resend
            </button>
          </>
        ) : (
          <p className="cmp-step-text">{outdated ? 'Send a fresh test of this version first.' : 'Unlocks once a test has arrived.'}</p>
        )}
      </Step>

      <Step n={3} title="Or send it to everyone now" state={tested ? 'current' : 'locked'}>
        {!tested ? (
          <p className="cmp-step-text">{outdated ? 'Send a fresh test of this version first.' : 'Unlocks once a test has arrived.'}</p>
        ) : !confirming ? (
          <>
            <p className="cmp-step-text">Skips the check in Resend and emails the whole list right away.</p>
            <button type="button" className="cmp-btn cmp-btn-quiet" disabled={disabled} onClick={() => setConfirming(true)}>Send to everyone…</button>
          </>
        ) : (
          <div className="cmp-confirm">
            <p>
              This emails <strong>every subscriber</strong>
              {data.subject ? <> with the subject “{data.subject}”</> : null}. It can’t be recalled.
            </p>
            <label>
              Type <strong>SEND</strong> to confirm
              <input className="cmp-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </label>
            <div className="cmp-row">
              <button
                type="button"
                className="cmp-btn cmp-btn-danger"
                disabled={disabled || typed.trim().toUpperCase() !== 'SEND'}
                onClick={() => { setConfirming(false); setTyped(''); onSend('send-now-confirmed'); }}
              >
                Send to everyone
              </button>
              <button type="button" className="cmp-btn cmp-btn-link" onClick={() => { setConfirming(false); setTyped(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </Step>
    </div>
  );
}
