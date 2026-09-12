import React, { useEffect, useMemo, useRef, useState } from 'react';
import { render } from '@react-email/render';
import Newsletter from '../emails/Newsletter.jsx';
import { ORG } from '../config/org.js';

// Decap CMS preview pane. Renders the *actual* email component into a sandboxed iframe
// rather than re-implementing the layout, so an editor sees the real thing — same
// markup and same inline styles Resend will send. Previously this file was a
// hand-maintained copy of the template and the two drifted apart on every change.
// Statuses that email the whole list on publish, and the reasons push-newsletter.mjs
// will refuse to. Kept in sync with the gates in that script.
const BULK = new Set(['send-now', 'send-now-confirmed']);
const blockedReason = (data) => {
  if (!BULK.has(data.status)) return '';
  if (data.status === 'send-now' && !data.confirmSend) return ' — confirmation box not checked, will not send';
  if (!data.lastTestSentAt) return ' — no test sent yet, will not send';
  return '';
};

const NewsletterPreview = ({ entry, getAsset }) => {
  const data = entry.get('data').toJS();
  const [siteData, setSiteData] = useState({ events: [], news: [] });
  const [html, setHtml] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState(null);

  // Decap mounts this component inside the preview pane's own iframe, and that
  // document gets no height and keeps the default 8px body margin. Both break the
  // full-height layout below: `height: 100%` on the root resolves against an
  // auto-height body and collapses to content height, leaving the email iframe a
  // ~150px sliver of the pane. Reach the frame's document through the mounted node —
  // this component's code runs in the *parent* window, so a bare `document` here is
  // the admin page, not the preview. The root below is sized in `vh` rather than `%`
  // because Decap nests the template in its own auto-height wrappers, which break any
  // percentage chain; inside the frame, `vh` is the pane's own viewport. The margin
  // reset keeps that 100vh from overflowing into a scrollbar. Undo on unmount.
  const rootRef = useRef(null);
  useEffect(() => {
    const doc = rootRef.current?.ownerDocument;
    if (!doc) return undefined;
    const html = doc.documentElement;
    const { body } = doc;
    const prev = { html: html.style.height, height: body.style.height, margin: body.style.margin };
    html.style.height = '100%';
    body.style.height = '100%';
    body.style.margin = '0';
    return () => {
      html.style.height = prev.html;
      body.style.height = prev.height;
      body.style.margin = prev.margin;
    };
  }, []);

  useEffect(() => {
    fetch('/newsletter-data.json')
      .then((r) => (r.ok ? r.json() : { events: [], news: [] }))
      .then(setSiteData)
      .catch(() => {});
  }, []);

  // Images uploaded in this editing session aren't committed or deployed yet, so their
  // stored path 404s. Decap's getAsset resolves those to a local blob URL.
  const resolved = useMemo(() => {
    if (!getAsset) return data;
    const url = (v) => (v ? String(getAsset(v)?.toString?.() ?? v) : v);
    return {
      ...data,
      heroImage: url(data.heroImage),
      customBlocks: (data.customBlocks || []).map((b) => (b?.image ? { ...b, image: url(b.image) } : b)),
    };
  }, [JSON.stringify(data), getAsset]);

  // Re-render on every keystroke in the editor; cheap enough at this size.
  // Keyed on the serialized value, since `data` is a new object identity every render.
  const key = useMemo(() => JSON.stringify([resolved, siteData]), [resolved, siteData]);

  useEffect(() => {
    let cancelled = false;
    render(
      <Newsletter
        data={resolved}
        events={resolved.includeEvents === false ? [] : siteData.events}
        news={resolved.includeNews === false ? [] : siteData.news}
        siteUrl={window.location.origin}
        unsubscribeUrl="#"
      />,
    )
      .then((out) => { if (!cancelled) { setHtml(out); setError(null); } })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [key]);

  // Feed the frame a blob URL rather than `srcDoc`. React updates the srcDoc attribute
  // fine, but a sandboxed frame does not re-navigate on that change, so the pane kept
  // showing whatever it loaded first — in practice the empty string from the initial
  // render, i.e. a blank preview for the whole session. Assigning a fresh src does
  // navigate. Debounced so typing doesn't thrash the frame on every keystroke.
  useEffect(() => {
    if (!html) return undefined;
    let url;
    const timer = setTimeout(() => {
      url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
      setPreviewUrl(url);
    }, 250);
    return () => {
      clearTimeout(timer);
      // Safe once the frame has loaded it; revoking only frees the handle.
      if (url) URL.revokeObjectURL(url);
    };
  }, [html]);

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#b91c1c' }}>
        <strong>Preview failed to render.</strong>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{error}</pre>
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* Inbox chrome — the bits an editor can't see inside the email body itself. */}
      <div style={{ background: '#fafafa', padding: '12px 20px', borderBottom: '1px solid #e5e5e5', fontSize: 12, color: '#666', fontFamily: 'system-ui, sans-serif' }}>
        <div><strong style={{ color: '#333' }}>From:</strong> {ORG.name}</div>
        <div style={{ marginTop: 2 }}><strong style={{ color: '#333' }}>Subject:</strong> {data.subject || <em>(no subject yet)</em>}</div>
        <div style={{ marginTop: 2 }}><strong style={{ color: '#333' }}>Inbox preview:</strong> {data.preheader || <em>(none)</em>}</div>
        {data.status && data.status !== 'draft' && (
          <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: BULK.has(data.status) ? '#fee2e2' : '#e0f2fe', color: BULK.has(data.status) ? '#b91c1c' : '#075985', fontWeight: 700 }}>
            status: {data.status}{blockedReason(data)}
          </div>
        )}
      </div>
      <iframe
        title="Email preview"
        sandbox=""
        src={previewUrl}
        style={{ flex: 1, minHeight: 0, width: '100%', border: 0, background: '#f5f5f5' }}
      />
    </div>
  );
};

export default NewsletterPreview;
