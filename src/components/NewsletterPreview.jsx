import React, { useEffect, useMemo, useState } from 'react';
import { render } from '@react-email/render';
import Newsletter from '../emails/Newsletter.jsx';
import { ORG } from '../config/org.js';

// Decap CMS preview pane. Renders the *actual* email component into a sandboxed iframe
// rather than re-implementing the layout, so an editor sees the real thing — same
// markup and same inline styles Resend will send. Previously this file was a
// hand-maintained copy of the template and the two drifted apart on every change.
const NewsletterPreview = ({ entry, getAsset }) => {
  const data = entry.get('data').toJS();
  const [siteData, setSiteData] = useState({ events: [], news: [] });
  const [html, setHtml] = useState('');
  const [error, setError] = useState(null);

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

  if (error) {
    return (
      <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#b91c1c' }}>
        <strong>Preview failed to render.</strong>
        <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12 }}>{error}</pre>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
      {/* Inbox chrome — the bits an editor can't see inside the email body itself. */}
      <div style={{ background: '#fafafa', padding: '12px 20px', borderBottom: '1px solid #e5e5e5', fontSize: 12, color: '#666', fontFamily: 'system-ui, sans-serif' }}>
        <div><strong style={{ color: '#333' }}>From:</strong> {ORG.name}</div>
        <div style={{ marginTop: 2 }}><strong style={{ color: '#333' }}>Subject:</strong> {data.subject || <em>(no subject yet)</em>}</div>
        <div style={{ marginTop: 2 }}><strong style={{ color: '#333' }}>Inbox preview:</strong> {data.preheader || <em>(none)</em>}</div>
        {data.status && data.status !== 'draft' && (
          <div style={{ marginTop: 6, display: 'inline-block', padding: '2px 8px', borderRadius: 999, background: data.status === 'send-now' ? '#fee2e2' : '#e0f2fe', color: data.status === 'send-now' ? '#b91c1c' : '#075985', fontWeight: 700 }}>
            status: {data.status}{data.status === 'send-now' && !data.confirmSend ? ' — confirmation box not checked, will not send' : ''}
          </div>
        )}
      </div>
      <iframe
        title="Email preview"
        sandbox=""
        srcDoc={html}
        style={{ flex: 1, width: '100%', border: 0, background: '#f5f5f5' }}
      />
    </div>
  );
};

export default NewsletterPreview;
