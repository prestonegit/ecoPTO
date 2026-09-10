import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Img, Link, Button, Hr, Preview, Font,
} from '@react-email/components';
import { marked } from 'marked';
import { ORG, BRAND, hasPostalAddress } from '../config/org.js';

const { fontSans, fontSerif } = BRAND;

// Resend substitutes this token only for broadcasts. One-off sends (our test path)
// pass a real URL in via the `unsubscribeUrl` prop so the link isn't dead.
export const BROADCAST_UNSUBSCRIBE_TOKEN = '{{{RESEND_UNSUBSCRIBE_URL}}}';

// Pin to Eastern, matching src/utils/events.ts. Without it the date is formatted in
// whatever zone the renderer runs in — so a local preview and the UTC CI runner that
// actually sends the email disagree by a day.
const TZ = 'America/New_York';

const formatEventDate = (iso, override) => {
  if (override) return override;
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: TZ,
  });
};

const formatNewsDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: TZ });
};

const Markdown = ({ source, style }) => (
  <div style={style} dangerouslySetInnerHTML={{ __html: marked.parse(source || '') }} />
);

// Resolve a CMS-entered path (/assets/images/foo.png) to an absolute URL.
// Email clients cannot resolve relative paths.
const absolute = (src, siteUrl) => (src?.startsWith('http') ? src : `${siteUrl}${src}`);

export const Newsletter = ({
  data,
  events = [],
  news = [],
  siteUrl = ORG.siteUrl,
  unsubscribeUrl = BROADCAST_UNSUBSCRIBE_TOKEN,
}) => {
  const blocks = data.customBlocks || [];
  const files = (data.attachments || []).filter((a) => a && a.file);

  return (
    <Html>
      <Head>
        {/* Light-only: dark-mode clients otherwise invert the card while leaving the
            inline colours alone, which looks broken on mobile. */}
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <Font fontFamily="Plus Jakarta Sans" fallbackFontFamily="sans-serif"
          webFont={{ url: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2', format: 'woff2' }} fontWeight={400} fontStyle="normal" />
        <Font fontFamily="Playfair Display" fallbackFontFamily="serif"
          webFont={{ url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2', format: 'woff2' }} fontWeight={500} fontStyle="normal" />
      </Head>
      {data.preheader && <Preview>{data.preheader}</Preview>}
      <Body style={{ background: BRAND.bgMuted, margin: 0, padding: '24px 12px', fontFamily: fontSans, color: BRAND.text, WebkitTextSizeAdjust: '100%' }}>
        <Container style={{ maxWidth: 600, width: '100%', background: BRAND.bg, borderRadius: 12, overflow: 'hidden' }}>

          {/* Header — PNG, not SVG: Gmail/Outlook/Yahoo all strip inline SVG images */}
          <Section style={{ padding: '20px 24px', borderBottom: `1px solid ${BRAND.bgMuted}`, background: BRAND.bg }}>
            <Row>
              <Column style={{ width: 60 }}>
                <Img src={`${siteUrl}/email-logo.png`} alt={ORG.shortName} width="48" height="48"
                     style={{ display: 'block', width: 48, height: 48 }} />
              </Column>
              <Column>
                <Text style={{ fontSize: 22, fontWeight: 700, color: BRAND.primary, margin: 0 }}>
                  eco<span style={{ color: BRAND.secondary }}>PTO</span>
                </Text>
              </Column>
            </Row>
          </Section>

          {data.heroImage && (
            <Img src={absolute(data.heroImage, siteUrl)} alt="" width="600" style={{ width: '100%', display: 'block' }} />
          )}

          <Section style={{ padding: '32px 32px 8px' }}>
            <Heading as="h1" style={{ fontFamily: fontSerif, fontSize: 32, color: BRAND.primary, margin: '0 0 16px' }}>
              {data.subject}
            </Heading>
            {data.intro && <Markdown source={data.intro} style={{ color: BRAND.text, lineHeight: 1.6 }} />}
          </Section>

          {/* Custom blocks */}
          {blocks.map((b, i) => {
            if (!b) return null;
            if (b.type === 'callout') {
              return (
                <Section key={i} style={{ margin: '0 32px 24px', padding: 20, background: BRAND.secondary, borderRadius: 12 }}>
                  {b.title && <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 20 }}>{b.title}</Heading>}
                  {b.body && <Markdown source={b.body} style={{ color: BRAND.text }} />}
                </Section>
              );
            }
            if (b.type === 'story') {
              return (
                <Section key={i} style={{ margin: '0 32px 24px' }}>
                  {b.image && <Img src={absolute(b.image, siteUrl)} alt="" width="536" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}
                  {b.title && <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 22 }}>{b.title}</Heading>}
                  {b.body && <Markdown source={b.body} style={{ color: BRAND.text, lineHeight: 1.6 }} />}
                </Section>
              );
            }
            if (b.type === 'image' && b.image) {
              return (
                <Section key={i} style={{ margin: '0 32px 24px' }}>
                  <Img src={absolute(b.image, siteUrl)} alt="" width="536" style={{ width: '100%', borderRadius: 8 }} />
                </Section>
              );
            }
            if (b.type === 'button') {
              return (
                <Section key={i} style={{ margin: '0 32px 24px', padding: 20, background: BRAND.bgMuted, borderRadius: 12, textAlign: 'center' }}>
                  {b.title && <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 20 }}>{b.title}</Heading>}
                  {b.body && <Text style={{ color: BRAND.textMuted, margin: '0 0 16px' }}>{b.body}</Text>}
                  {b.buttonText && (
                    <Button href={b.buttonUrl || '#'} style={{ background: BRAND.primary, color: '#fff', padding: '12px 28px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
                      {b.buttonText}
                    </Button>
                  )}
                </Section>
              );
            }
            return null;
          })}

          {/* Events */}
          {data.includeEvents && events.length > 0 && (
            <Section style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
              <Heading as="h2" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 26, margin: '0 0 8px' }}>Upcoming Events</Heading>
              {data.eventsIntro && <Text style={{ color: BRAND.textMuted, marginTop: 0 }}>{data.eventsIntro}</Text>}
              {events.map((e) => (
                <Section key={e.slug} style={{ padding: 16, marginBottom: 12, border: `1px solid ${BRAND.bgMuted}`, borderRadius: 12 }}>
                  <Link href={e.externalUrl || `${siteUrl}/events/${e.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 18, margin: '0 0 4px' }}>{e.title}</Heading>
                    <Text style={{ color: BRAND.textMuted, fontSize: 13, margin: '0 0 8px' }}>
                      {formatEventDate(e.eventDate, e.dateOverride)}{e.location ? ` · ${e.location}` : ''}
                    </Text>
                    {e.cardDescription && <Text style={{ color: BRAND.text, fontSize: 14, margin: 0 }}>{e.cardDescription}</Text>}
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {/* News */}
          {data.includeNews && news.length > 0 && (
            <Section style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
              <Heading as="h2" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 26, margin: '0 0 8px' }}>Latest News</Heading>
              {data.newsIntro && <Text style={{ color: BRAND.textMuted, marginTop: 0 }}>{data.newsIntro}</Text>}
              {news.map((n) => (
                <Section key={n.slug} style={{ padding: '12px 0', borderBottom: `1px solid ${BRAND.bgMuted}` }}>
                  <Link href={`${siteUrl}/news/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 18, margin: '0 0 4px' }}>{n.title}</Heading>
                    <Text style={{ color: BRAND.textMuted, fontSize: 12, margin: '0 0 6px' }}>{n.author} · {formatNewsDate(n.pubDate)}</Text>
                    {n.description && <Text style={{ color: BRAND.text, fontSize: 14, margin: 0 }}>{n.description}</Text>}
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {/* Files — hosted links, not attachments.
              Resend broadcasts cannot carry attachments, and linked files keep the
              email small, work in the web archive, and don't trip spam filters. */}
          {files.length > 0 && (
            <Section style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
              <Heading as="h2" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 22, margin: '0 0 12px' }}>Files &amp; Downloads</Heading>
              {files.map((a, i) => (
                <Section key={i} style={{ padding: '10px 14px', marginBottom: 8, background: BRAND.bgMuted, borderRadius: 8 }}>
                  <Link href={absolute(a.file, siteUrl)} style={{ color: BRAND.primary, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                    📎 {a.label || a.file}
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {data.closing && (
            <Section style={{ padding: '8px 32px 24px' }}>
              <Markdown source={data.closing} style={{ color: BRAND.text, lineHeight: 1.6 }} />
            </Section>
          )}

          {/* Donate CTA */}
          <Section style={{ padding: '24px 32px', textAlign: 'center', background: BRAND.bgMuted }}>
            <Button href={`${siteUrl}/donate`} style={{ background: BRAND.donate, color: '#fff', padding: '12px 32px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
              Donate
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ background: BRAND.primary, padding: 32, textAlign: 'center', borderTop: `4px solid ${BRAND.secondary}` }}>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              eco<span style={{ color: BRAND.secondary }}>PTO</span>
            </Text>
            <Text style={{ fontSize: 12, color: '#fff', opacity: 0.7, margin: 0 }}>
              {ORG.name} · <Link href={`mailto:${ORG.email}`} style={{ color: BRAND.secondary }}>{ORG.email}</Link>
            </Text>
            {/* Required by CAN-SPAM: a valid physical postal address on every bulk send.
                push-newsletter.mjs blocks bulk sends until this is set; test sends just omit it. */}
            {hasPostalAddress() && (
              <Text style={{ fontSize: 12, color: '#fff', opacity: 0.7, margin: '4px 0 0' }}>
                {ORG.postalAddress}
              </Text>
            )}
            <Hr style={{ borderColor: 'rgba(255,255,255,0.25)', margin: '18px 0 14px' }} />
            <Text style={{ fontSize: 11, color: '#ffffff', opacity: 0.7, margin: '0 0 6px' }}>
              You're receiving this because you subscribed at ecopto.org.
            </Text>
            <Link href={unsubscribeUrl} style={{ display: 'inline-block', color: '#ffffff', fontSize: 13, fontWeight: 700, textDecoration: 'underline', padding: '8px 16px' }}>
              Unsubscribe
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Newsletter;
