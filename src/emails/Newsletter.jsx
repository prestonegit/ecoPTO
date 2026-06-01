import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Img, Link, Button, Hr, Preview, Font,
} from '@react-email/components';
import { marked } from 'marked';

const BRAND = {
  primary: '#B05B3B',
  secondary: '#FFC099',
  accent: '#FF5050',
  text: '#333333',
  textMuted: '#555555',
  bg: '#FFFFFF',
  bgMuted: '#F5F5F5',
  donate: '#15803d',
};

const fontSans = "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
const fontSerif = "'Playfair Display', Georgia, serif";

const SITE_URL = process.env.SITE_URL || 'https://ecopto.org';

const formatEventDate = (iso, override) => {
  if (override) return override;
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
};

const formatNewsDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const Markdown = ({ source, style }) => (
  <div style={style} dangerouslySetInnerHTML={{ __html: marked.parse(source || '') }} />
);

export const Newsletter = ({ data, events = [], news = [] }) => {
  const blocks = data.customBlocks || [];

  return (
    <Html>
      <Head>
        <Font fontFamily="Plus Jakarta Sans" fallbackFontFamily="sans-serif"
          webFont={{ url: 'https://fonts.gstatic.com/s/plusjakartasans/v8/LDIbaomQNQcsA88c7O9yZ4KMCoOg4Ko20yw.woff2', format: 'woff2' }} fontWeight={400} fontStyle="normal" />
        <Font fontFamily="Playfair Display" fallbackFontFamily="serif"
          webFont={{ url: 'https://fonts.gstatic.com/s/playfairdisplay/v37/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvUDQ.woff2', format: 'woff2' }} fontWeight={500} fontStyle="normal" />
      </Head>
      {data.preheader && <Preview>{data.preheader}</Preview>}
      <Body style={{ background: BRAND.bgMuted, margin: 0, padding: '24px 0', fontFamily: fontSans, color: BRAND.text }}>
        <Container style={{ maxWidth: 600, background: BRAND.bg, borderRadius: 8, overflow: 'hidden' }}>

          {/* Header */}
          <Section style={{ padding: '20px 24px', borderBottom: `1px solid ${BRAND.bgMuted}` }}>
            <Row>
              <Column style={{ width: 48 }}>
                <Img src={`${SITE_URL}/logo-icon.svg`} alt="ecoPTO" width="36" height="36" />
              </Column>
              <Column>
                <Text style={{ fontSize: 22, fontWeight: 700, color: BRAND.primary, margin: 0 }}>
                  eco<span style={{ color: BRAND.secondary }}>PTO</span>
                </Text>
              </Column>
            </Row>
          </Section>

          {data.heroImage && (
            <Img src={data.heroImage.startsWith('http') ? data.heroImage : `${SITE_URL}${data.heroImage}`}
                 alt="" width="600" style={{ width: '100%', display: 'block' }} />
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
                  {b.image && <Img src={b.image.startsWith('http') ? b.image : `${SITE_URL}${b.image}`} alt="" width="536" style={{ width: '100%', borderRadius: 8, marginBottom: 12 }} />}
                  {b.title && <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, margin: '0 0 8px', fontSize: 22 }}>{b.title}</Heading>}
                  {b.body && <Markdown source={b.body} style={{ color: BRAND.text, lineHeight: 1.6 }} />}
                </Section>
              );
            }
            if (b.type === 'image' && b.image) {
              return (
                <Section key={i} style={{ margin: '0 32px 24px' }}>
                  <Img src={b.image.startsWith('http') ? b.image : `${SITE_URL}${b.image}`} alt="" width="536" style={{ width: '100%', borderRadius: 8 }} />
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
                  <Link href={e.externalUrl || `${SITE_URL}/events/${e.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
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
                  <Link href={`${SITE_URL}/news/${n.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Heading as="h3" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 18, margin: '0 0 4px' }}>{n.title}</Heading>
                    <Text style={{ color: BRAND.textMuted, fontSize: 12, margin: '0 0 6px' }}>{n.author} · {formatNewsDate(n.pubDate)}</Text>
                    {n.description && <Text style={{ color: BRAND.text, fontSize: 14, margin: 0 }}>{n.description}</Text>}
                  </Link>
                </Section>
              ))}
            </Section>
          )}

          {data.attachments && data.attachments.length > 0 && (
            <Section style={{ margin: '8px 32px 24px', padding: '24px 0 0', borderTop: `2px solid ${BRAND.bgMuted}` }}>
              <Heading as="h2" style={{ fontFamily: fontSerif, color: BRAND.primary, fontSize: 22, margin: '0 0 12px' }}>Attachments</Heading>
              {data.attachments.map((a, i) => (
                <Section key={i} style={{ padding: '10px 14px', marginBottom: 8, background: BRAND.bgMuted, borderRadius: 8 }}>
                  <Text style={{ margin: 0, color: BRAND.text, fontSize: 14 }}>
                    📎 {a.label || a.file}
                  </Text>
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
            <Button href={`${SITE_URL}/donate`} style={{ background: BRAND.donate, color: '#fff', padding: '12px 32px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
              Donate
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ background: BRAND.primary, padding: 32, textAlign: 'center', borderTop: `4px solid ${BRAND.secondary}` }}>
            <Text style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
              eco<span style={{ color: BRAND.secondary }}>PTO</span>
            </Text>
            <Text style={{ fontSize: 12, color: '#fff', opacity: 0.7, margin: 0 }}>
              Hopewell Valley ecoPTO · <Link href="mailto:ecoptohvrsd@gmail.com" style={{ color: BRAND.secondary }}>ecoptohvrsd@gmail.com</Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '16px 0' }} />
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.5, margin: 0 }}>
              You're receiving this because you subscribed at ecopto.org. <Link href="{{{RESEND_UNSUBSCRIBE_URL}}}" style={{ color: '#fff' }}>Unsubscribe</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Newsletter;
