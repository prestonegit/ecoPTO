import React, { useEffect, useMemo, useState } from 'react';
import { render } from '@react-email/render';
import Newsletter from '../../emails/Newsletter.jsx';
import { ORG } from '../../config/org.js';

// Renders the real email component, the same one push-newsletter.mjs sends, so what an
// editor sees here is what subscribers get.
//
// Two lessons carried over from the Decap preview pane (NewsletterPreview.jsx):
// the frame is fed a blob URL rather than srcDoc, because a sandboxed frame does not
// re-navigate when srcDoc changes; and the sandbox stays fully locked, so newsletter
// content can never run script in the page that holds the editor's session.

const WIDTHS = { desktop: '100%', phone: '390px' };

export default function EmailPreview({ data, localUrls }) {
  const [siteData, setSiteData] = useState({ events: [], news: [] });
  const [url, setUrl] = useState('');
  const [error, setError] = useState(null);
  const [device, setDevice] = useState('desktop');

  useEffect(() => {
    fetch('/newsletter-data.json')
      .then((r) => (r.ok ? r.json() : { events: [], news: [] }))
      .then(setSiteData)
      .catch(() => {});
  }, []);

  // Swap in local copies of anything uploaded this session, which isn't deployed yet.
  const resolved = useMemo(() => {
    const swap = (p) => (p && localUrls[p]) || p;
    return {
      ...data,
      heroImage: swap(data.heroImage),
      customBlocks: (data.customBlocks || []).map((b) => (b && b.image ? { ...b, image: swap(b.image) } : b)),
    };
  }, [data, localUrls]);

  const key = JSON.stringify([resolved, siteData]);

  useEffect(() => {
    let cancelled = false;
    let made;
    const timer = setTimeout(() => {
      render(
        <Newsletter
          data={resolved}
          events={resolved.includeEvents === false ? [] : siteData.events}
          news={resolved.includeNews === false ? [] : siteData.news}
          siteUrl={window.location.origin}
          unsubscribeUrl="#"
        />,
      )
        .then((html) => {
          if (cancelled) return;
          made = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
          setUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return made;
          });
          setError(null);
        })
        .catch((e) => !cancelled && setError(e.message));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);

  return (
    <div className="cmp-preview">
      <div className="cmp-preview-bar">
        <span className="cmp-preview-title">Preview</span>
        <div className="cmp-seg" role="group" aria-label="Preview width">
          {Object.keys(WIDTHS).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} className={device === d ? 'on' : ''} onClick={() => setDevice(d)}>
              {d === 'desktop' ? 'Computer' : 'Phone'}
            </button>
          ))}
        </div>
      </div>
      <div className="cmp-inbox">
        <div><strong>From</strong> {ORG.name}</div>
        <div><strong>Subject</strong> {data.subject || <em>No subject yet</em>}</div>
        <div><strong>Preview text</strong> {data.preheader || <em>None</em>}</div>
      </div>
      {error ? (
        <div className="cmp-preview-error">
          <strong>The preview couldn’t be drawn.</strong>
          <pre>{error}</pre>
        </div>
      ) : (
        <div className="cmp-frame-wrap">
          <iframe title="Email preview" sandbox="" src={url} style={{ width: WIDTHS[device] }} />
        </div>
      )}
    </div>
  );
}
