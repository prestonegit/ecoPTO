import React, { useEffect, useState } from 'react';
import { marked } from 'marked';

const BRAND = {
  primary: '#B05B3B',
  secondary: '#FFC099',
  accent: '#FF5050',
  text: '#333333',
  textMuted: '#555555',
  bg: '#FFFFFF',
  bgMuted: '#F5F5F5',
  fontSans: "'Plus Jakarta Sans', system-ui, sans-serif",
  fontSerif: "'Playfair Display', Georgia, serif",
};

const formatEventDate = (iso, override) => {
  if (override) return override;
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const formatNewsDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const md = (s) => ({ __html: marked.parse(s || '') });

const NewsletterPreview = ({ entry }) => {
  const data = entry.get('data').toJS();
  const [siteData, setSiteData] = useState({ events: [], news: [] });

  useEffect(() => {
    fetch('/newsletter-data.json')
      .then((r) => r.ok ? r.json() : { events: [], news: [] })
      .then(setSiteData)
      .catch(() => {});
  }, []);

  const blocks = data.customBlocks || [];

  return (
    <div style={{ background: BRAND.bgMuted, padding: '32px 0', minHeight: '100%', fontFamily: BRAND.fontSans }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Playfair+Display:wght@500;700&display=swap" />

      <div style={{ maxWidth: 600, margin: '0 auto', background: BRAND.bg, borderRadius: 8, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

        {/* Inbox preview chrome */}
        <div style={{ background: '#fafafa', padding: '12px 24px', borderBottom: '1px solid #eee', fontSize: 12, color: '#888' }}>
          <div><strong style={{ color: BRAND.text }}>Subject:</strong> {data.subject || <em>(no subject)</em>}</div>
          {data.preheader && <div style={{ marginTop: 4 }}><strong style={{ color: BRAND.text }}>Preview:</strong> {data.preheader}</div>}
        </div>

        {/* Header — mirrors Header.astro */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${BRAND.bgMuted}`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo-icon.svg" alt="ecoPTO" style={{ height: 36 }} />
          <div style={{ fontSize: 22, fontWeight: 700, color: BRAND.primary }}>
            eco<span style={{ color: BRAND.secondary }}>PTO</span>
          </div>
        </div>

        {data.heroImage && (
          <img src={data.heroImage} alt="" style={{ width: '100%', display: 'block' }} />
        )}

        <div style={{ padding: '32px 32px 16px' }}>
          <h1 style={{ fontFamily: BRAND.fontSerif, fontSize: 32, color: BRAND.primary, margin: '0 0 16px' }}>
            {data.subject || 'Your subject line'}
          </h1>
          <div style={{ color: BRAND.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={md(data.intro)} />
        </div>

        {/* Custom blocks */}
        {blocks.map((b, i) => {
          if (!b) return null;
          if (b.type === 'callout') {
            return (
              <div key={i} style={{ margin: '0 32px 24px', padding: 20, background: BRAND.secondary, borderRadius: 12 }}>
                {b.title && <h3 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 20 }}>{b.title}</h3>}
                {b.body && <div style={{ color: BRAND.text }} dangerouslySetInnerHTML={md(b.body)} />}
              </div>
            );
          }
          if (b.type === 'story') {
            return (
              <div key={i} style={{ margin: '0 32px 24px' }}>
                {b.image && <img src={b.image} alt="" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}
                {b.title && <h3 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 22 }}>{b.title}</h3>}
                {b.body && <div style={{ color: BRAND.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={md(b.body)} />}
              </div>
            );
          }
          if (b.type === 'image') {
            return b.image && (
              <img key={i} src={b.image} alt="" style={{ width: 'calc(100% - 64px)', margin: '0 32px 24px', borderRadius: 8 }} />
            );
          }
          if (b.type === 'button') {
            return (
              <div key={i} style={{ margin: '0 32px 24px', padding: 20, background: BRAND.bgMuted, borderRadius: 12, textAlign: 'center' }}>
                {b.title && <h3 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 20 }}>{b.title}</h3>}
                {b.body && <p style={{ color: BRAND.textMuted, margin: '0 0 16px' }}>{b.body}</p>}
                {b.buttonText && (
                  <a href={b.buttonUrl || '#'} style={{ display: 'inline-block', background: BRAND.primary, color: '#fff', padding: '12px 28px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>
                    {b.buttonText}
                  </a>
                )}
              </div>
            );
          }
          return null;
        })}

        {/* Events */}
        {data.includeEvents && (
          <div style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
            <h2 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, fontSize: 26, margin: '0 0 8px' }}>Upcoming Events</h2>
            {data.eventsIntro && <p style={{ color: BRAND.textMuted, marginTop: 0 }}>{data.eventsIntro}</p>}
            {siteData.events.length === 0 && (
              <p style={{ color: BRAND.textMuted, fontStyle: 'italic' }}>(Live events from the site will appear here when sent.)</p>
            )}
            {siteData.events.map((e) => (
              <div key={e.slug} style={{ padding: 16, marginBottom: 12, border: `1px solid ${BRAND.bgMuted}`, borderRadius: 12 }}>
                <h3 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, fontSize: 18, margin: '0 0 4px' }}>{e.title}</h3>
                <p style={{ color: BRAND.textMuted, fontSize: 13, margin: '0 0 8px' }}>
                  {formatEventDate(e.eventDate, e.dateOverride)}{e.location ? ` · ${e.location}` : ''}
                </p>
                {e.cardDescription && <p style={{ color: BRAND.text, fontSize: 14, margin: 0 }}>{e.cardDescription}</p>}
              </div>
            ))}
          </div>
        )}

        {/* News */}
        {data.includeNews && (
          <div style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
            <h2 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, fontSize: 26, margin: '0 0 8px' }}>Latest News</h2>
            {data.newsIntro && <p style={{ color: BRAND.textMuted, marginTop: 0 }}>{data.newsIntro}</p>}
            {siteData.news.length === 0 && (
              <p style={{ color: BRAND.textMuted, fontStyle: 'italic' }}>(Live news from the site will appear here when sent.)</p>
            )}
            {siteData.news.map((n) => (
              <div key={n.slug} style={{ padding: '12px 0', borderBottom: `1px solid ${BRAND.bgMuted}` }}>
                <h3 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, fontSize: 18, margin: '0 0 4px' }}>{n.title}</h3>
                <p style={{ color: BRAND.textMuted, fontSize: 12, margin: '0 0 6px' }}>
                  {n.author} · {formatNewsDate(n.pubDate)}
                </p>
                {n.description && <p style={{ color: BRAND.text, fontSize: 14, margin: 0 }}>{n.description}</p>}
              </div>
            ))}
          </div>
        )}

        {data.attachments && data.attachments.length > 0 && (
          <div style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
            <h2 style={{ fontFamily: BRAND.fontSerif, color: BRAND.primary, fontSize: 22, margin: '0 0 12px' }}>Attachments</h2>
            {data.attachments.map((a, i) => (
              <div key={i} style={{ padding: '10px 14px', marginBottom: 8, background: BRAND.bgMuted, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 18 }}>📎</span>
                <span style={{ color: BRAND.text, fontSize: 14, flexGrow: 1 }}>{a.label || a.file}</span>
                <span style={{ fontSize: 11, color: BRAND.textMuted }}>attached</span>
              </div>
            ))}
          </div>
        )}

        {data.closing && (
          <div style={{ padding: '8px 32px 24px', color: BRAND.text, lineHeight: 1.6 }} dangerouslySetInnerHTML={md(data.closing)} />
        )}

        {/* Donate CTA */}
        <div style={{ padding: '24px 32px', textAlign: 'center', background: BRAND.bgMuted }}>
          <a href="https://ecopto.org/donate" style={{ display: 'inline-block', background: '#15803d', color: '#fff', padding: '12px 32px', borderRadius: 999, textDecoration: 'none', fontWeight: 700 }}>
            Donate
          </a>
        </div>

        {/* Footer — mirrors Footer.astro */}
        <div style={{ background: BRAND.primary, color: '#fff', padding: '32px', textAlign: 'center', borderTop: `4px solid ${BRAND.secondary}` }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            eco<span style={{ color: BRAND.secondary }}>PTO</span>
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Hopewell Valley ecoPTO · <a href="mailto:ecoptohvrsd@gmail.com" style={{ color: BRAND.secondary }}>ecoptohvrsd@gmail.com</a>
          </div>
          <div style={{ fontSize: 11, opacity: 0.5, marginTop: 12 }}>
            <a href="#" style={{ color: '#fff' }}>Unsubscribe</a>
          </div>
        </div>
      </div>

      {/* Status badge + safety banner */}
      <div style={{ maxWidth: 600, margin: '12px auto 0', fontSize: 12 }}>
        {data.status === 'send-now' && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 8,
            background: data.confirmSend ? '#fee2e2' : '#fef3c7',
            color: data.confirmSend ? '#991b1b' : '#92400e',
            border: `1px solid ${data.confirmSend ? '#fca5a5' : '#fde68a'}` }}>
            {data.confirmSend
              ? '⚠️ SEND NOW + confirmed — this will email ALL subscribers on next publish.'
              : '⏸ SEND NOW selected but NOT confirmed — check the confirmation box to actually send. Nothing will go out until you do.'}
          </div>
        )}
        {data.status === 'send-test' && (
          <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 8, background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' }}>
            {data.testEmail
              ? `✉️ Test mode — will email only ${data.testEmail} on next publish.`
              : '✉️ Test mode selected, but no test email is set above. Add one.'}
          </div>
        )}
        <div style={{ textAlign: 'right', color: '#888' }}>
          Status: <strong style={{
            color: data.status === 'sent' ? '#15803d'
              : data.status === 'send-now' ? BRAND.accent
              : data.status === 'ready-to-send' || data.status === 'send-test' ? '#1e40af'
              : '#888'
          }}>{data.status || 'draft'}</strong>
        </div>
      </div>
    </div>
  );
};

export default NewsletterPreview;
