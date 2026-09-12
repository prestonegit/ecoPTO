import React, { useEffect, useState } from 'react';

// Staged replacement for the raw `status` dropdown + `confirmSend` checkbox.
//
// The CMS cannot send anything itself — publishing only commits the file, and
// scripts/push-newsletter.mjs does the sending from CI afterwards. So this widget is a
// staged *control*: it decides which status the file is committed with, and shows in
// plain language what will happen on publish. The real gates stay in the script, which
// is the only thing standing between a volunteer and 400 inboxes.
//
// The confirmation is encoded in the status value itself ('send-now-confirmed') rather
// than a sibling checkbox, because a widget only owns its own field. Legacy 'send-now'
// + confirmSend still works for anything written before this widget existed.

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const C = {
  ink: '#1f2328',
  muted: '#57606a',
  line: '#d8dee4',
  blue: '#0969da',
  green: '#1a7f37',
  greenBg: '#dafbe1',
  red: '#cf222e',
  redBg: '#ffebe9',
  amberBg: '#fff8c5',
};

const box = { border: `1px solid ${C.line}`, borderRadius: 6, padding: 14, background: '#fff' };
const btn = (bg, fg = '#fff') => ({
  background: bg, color: fg, border: 0, borderRadius: 6, padding: '9px 14px',
  fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
});
const ghost = {
  ...btn('#fff', C.ink), border: `1px solid ${C.line}`, fontWeight: 500,
};

function Step({ n, of, title, children }) {
  return (
    <div style={box}>
      <div style={{ fontSize: 11, letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, fontWeight: 700 }}>
        Step {n} of {of}
      </div>
      <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, margin: '2px 0 10px' }}>{title}</div>
      {children}
    </div>
  );
}

function Banner({ tone, children }) {
  const bg = { ok: C.greenBg, warn: C.amberBg, danger: C.redBg }[tone] || '#f6f8fa';
  return (
    <div style={{ background: bg, borderRadius: 6, padding: '8px 10px', fontSize: 13, color: C.ink, marginBottom: 10 }}>
      {children}
    </div>
  );
}

const fmt = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso) : d.toLocaleString();
};

const NewsletterSendControl = (props) => {
  const { value, onChange, entry, classNameWrapper } = props;
  const status = value || 'draft';

  // Sibling values are read-only here; the widget only ever writes its own field.
  const data = entry && entry.get ? entry.get('data') : null;
  const read = (k) => {
    const v = data && data.get ? data.get(k) : undefined;
    return v == null ? '' : String(v);
  };
  const lastTestSentAt = read('lastTestSentAt').trim();
  const subject = read('subject').trim();

  // `entry` is only as fresh as the last time Decap re-rendered *this* widget, and it
  // does not re-render one field when a sibling changes. So the address someone just
  // typed into "Send a test to" is invisible here — which would leave step 1 disabled
  // while the box visibly has an address in it. Track the live input instead, falling
  // back to the entry. Decap ids inputs as `<fieldName>-field-<n>`; the suffix moves
  // around, the prefix doesn't.
  const [liveTestEmail, setLiveTestEmail] = useState(null);
  useEffect(() => {
    const sel = 'input[id^="testEmail-field-"]';
    const sync = () => {
      const el = document.querySelector(sel);
      setLiveTestEmail(el ? el.value : null);
    };
    sync();
    const onInput = (e) => { if (e.target && e.target.matches && e.target.matches(sel)) setLiveTestEmail(e.target.value); };
    document.addEventListener('input', onInput, true);
    return () => document.removeEventListener('input', onInput, true);
  }, []);
  const testEmail = (liveTestEmail == null ? read('testEmail') : liveTestEmail).trim();

  const [confirming, setConfirming] = useState(false);
  const [typed, setTyped] = useState('');

  const testable = EMAIL_RE.test(testEmail) || liveTestEmail === null;
  const tested = Boolean(lastTestSentAt);

  const set = (next) => { setConfirming(false); setTyped(''); onChange(next); };

  // --- Terminal states: nothing to do here, just report and offer a way back. ---
  if (status === 'sent' || status === 'in-resend') {
    const sent = status === 'sent';
    return (
      <div className={classNameWrapper} style={{ ...box, borderColor: sent ? C.green : C.blue }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: sent ? C.green : C.blue }}>
          {sent ? 'Sent' : 'Waiting in Resend'}
        </div>
        <p style={{ fontSize: 13, color: C.muted, margin: '6px 0 12px' }}>
          {sent
            ? 'This issue has gone out and now appears in the public archive. Publishing again will not re-send it.'
            : 'A draft broadcast is sitting in Resend. Open Resend and press Send there. Then set this to Sent.'}
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {!sent && <button type="button" style={btn(C.green)} onClick={() => set('sent')}>Mark as sent</button>}
          <button type="button" style={ghost} onClick={() => set('draft')}>Move back to draft</button>
        </div>
      </div>
    );
  }

  // --- Queued actions: publishing is what actually fires them. ---
  if (status === 'send-test' || status === 'ready-to-send' || status === 'send-now-confirmed') {
    const copy = {
      'send-test': {
        tone: 'ok',
        title: 'Test queued',
        body: <>On publish, one test copy goes to <strong>{testEmail || '(no address set)'}</strong> and nothing else happens. The status resets itself to Draft afterwards.</>,
      },
      'ready-to-send': {
        tone: 'warn',
        title: 'Draft queued in Resend',
        body: <>On publish, a <strong>draft</strong> broadcast is created in Resend. No one is emailed until you open Resend and press Send there.</>,
      },
      'send-now-confirmed': {
        tone: 'danger',
        title: 'Sending to everyone on publish',
        body: <>On publish, this emails <strong>every subscriber</strong> immediately. This cannot be undone.</>,
      },
    }[status];
    return (
      <div className={classNameWrapper} style={{ ...box, borderColor: copy.tone === 'danger' ? C.red : C.line }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: copy.tone === 'danger' ? C.red : C.ink, marginBottom: 8 }}>
          {copy.title}
        </div>
        <Banner tone={copy.tone}>{copy.body}</Banner>
        <button type="button" style={ghost} onClick={() => set('draft')}>Cancel — back to draft</button>
      </div>
    );
  }

  // --- Draft: the wizard proper. ---
  return (
    <div className={classNameWrapper} style={{ display: 'grid', gap: 10 }}>
      <Step n={1} of={3} title="Send yourself a test">
        {tested ? (
          <Banner tone="ok">Last test sent {fmt(lastTestSentAt)}{testEmail ? <> to <strong>{testEmail}</strong></> : null}.</Banner>
        ) : (
          <Banner tone="warn">No test has been sent yet. Check it in a real inbox before it goes to the list.</Banner>
        )}
        {!testable && (
          <p style={{ fontSize: 13, color: C.red, margin: '0 0 10px' }}>
            Fill in <strong>“Send a test to”</strong> above with a valid email address to enable this.
          </p>
        )}
        <button type="button" disabled={!testable} style={{ ...btn(testable ? C.blue : '#8c959f'), cursor: testable ? 'pointer' : 'not-allowed' }} onClick={() => set('send-test')}>
          {tested ? 'Send another test' : 'Send a test'}
        </button>
      </Step>

      <Step n={2} of={3} title="Put it in front of the group">
        {!tested ? (
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>
            Locked until a test has actually been delivered. Finish step 1 and publish first.
          </p>
        ) : (
          <>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px' }}>
              The safe choice: build the broadcast in Resend and leave it unsent, so an admin can look it
              over and press Send there.
            </p>
            <button type="button" style={btn(C.green)} onClick={() => set('ready-to-send')}>
              Create the draft in Resend
            </button>
          </>
        )}
      </Step>

      <Step n={3} of={3} title="Or send to everyone from here">
        {!tested ? (
          <p style={{ fontSize: 13, color: C.muted, margin: 0 }}>Locked until a test has been delivered.</p>
        ) : !confirming ? (
          <>
            <p style={{ fontSize: 13, color: C.muted, margin: '0 0 10px' }}>
              Skips the review step in Resend and emails the whole list on publish.
            </p>
            <button type="button" style={ghost} onClick={() => setConfirming(true)}>Send to everyone…</button>
          </>
        ) : (
          <>
            <Banner tone="danger">
              This emails <strong>every subscriber</strong>{subject ? <> with the subject “{subject}”</> : null} as soon as
              you publish. There is no recall.
            </Banner>
            <p style={{ fontSize: 13, color: C.ink, margin: '0 0 6px' }}>Type <strong>SEND</strong> to confirm:</p>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              style={{ border: `1px solid ${C.line}`, borderRadius: 6, padding: '7px 9px', fontSize: 14, width: 120, fontFamily: 'inherit' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                type="button"
                disabled={typed.trim().toUpperCase() !== 'SEND'}
                style={{ ...btn(typed.trim().toUpperCase() === 'SEND' ? C.red : '#8c959f'), cursor: typed.trim().toUpperCase() === 'SEND' ? 'pointer' : 'not-allowed' }}
                onClick={() => set('send-now-confirmed')}
              >
                Confirm — send to everyone
              </button>
              <button type="button" style={ghost} onClick={() => { setConfirming(false); setTyped(''); }}>Cancel</button>
            </div>
          </>
        )}
      </Step>
    </div>
  );
};

export const NewsletterSendPreview = ({ value }) => (
  <span>{value || 'draft'}</span>
);

export default NewsletterSendControl;
