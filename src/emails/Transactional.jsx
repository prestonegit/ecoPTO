import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Heading, Text, Img, Link, Button, Hr, Preview,
} from '@react-email/components';
import { ORG, BRAND, hasPostalAddress } from '../config/org.js';

const { fontSans, fontSerif } = BRAND;

// Shared chrome for every one-to-one email we send (confirmations, receipts,
// internal notifications). Deliberately lighter than the newsletter template.
const Shell = ({ preview, siteUrl, children, showFooterAddress = true, unsubscribeUrl }) => (
  <Html>
    <Head>
      {/* Tell dark-mode-aware clients this design is light-only. Without it, iOS Mail
          and Outlook auto-invert the card to dark while leaving the inline colours
          alone, which is what made the header look wrong on mobile. */}
      <meta name="color-scheme" content="light" />
      <meta name="supported-color-schemes" content="light" />
    </Head>
    {preview && <Preview>{preview}</Preview>}
    <Body style={{ background: BRAND.bgMuted, margin: 0, padding: '24px 12px', fontFamily: fontSans, color: BRAND.text, WebkitTextSizeAdjust: '100%' }}>
      <Container style={{ maxWidth: 560, width: '100%', background: BRAND.bg, borderRadius: 12, overflow: 'hidden' }}>
        <Section style={{ padding: '32px 24px 24px', background: BRAND.bg, textAlign: 'center' }}>
          {/* Rendered at 72px from a 256px transparent PNG, so it stays crisp on
              high-DPI screens and has no white box to show through in dark mode. */}
          <Img src={`${siteUrl}/email-logo.png`} alt={ORG.shortName}
               width="72" height="72"
               style={{ margin: '0 auto', display: 'block', width: 72, height: 72 }} />
        </Section>
        {children}
        <Section style={{ background: BRAND.primary, padding: '28px 24px', textAlign: 'center' }}>
          <Text style={{ fontSize: 13, color: '#ffffff', margin: 0, fontWeight: 700 }}>{ORG.name}</Text>
          <Text style={{ fontSize: 12, color: '#ffffff', margin: '6px 0 0', opacity: 0.85 }}>
            <Link href={`mailto:${ORG.email}`} style={{ color: BRAND.secondary, textDecoration: 'underline' }}>{ORG.email}</Link>
          </Text>
          {showFooterAddress && hasPostalAddress() && (
            <Text style={{ fontSize: 12, color: '#ffffff', margin: '6px 0 0', opacity: 0.75 }}>{ORG.postalAddress}</Text>
          )}
          {unsubscribeUrl && (
            <>
              <Hr style={{ borderColor: 'rgba(255,255,255,0.25)', margin: '18px 0 14px' }} />
              {/* Styled as an obvious control, not buried prose — the previous version
                  read as a sentence with a link nobody could see. */}
              <Link
                href={unsubscribeUrl}
                style={{
                  display: 'inline-block', color: '#ffffff', fontSize: 13, fontWeight: 700,
                  textDecoration: 'underline', padding: '8px 16px',
                }}
              >
                Unsubscribe
              </Link>
              <Text style={{ fontSize: 11, color: '#ffffff', opacity: 0.7, margin: '2px 0 0' }}>
                One click — no login, no reply needed.
              </Text>
            </>
          )}
        </Section>
      </Container>
    </Body>
  </Html>
);

const H1 = ({ children }) => (
  <Heading as="h1" style={{ fontFamily: fontSerif, fontSize: 26, color: BRAND.primary, margin: '0 0 16px' }}>{children}</Heading>
);

const P = ({ children, muted }) => (
  <Text style={{ color: muted ? BRAND.textMuted : BRAND.text, lineHeight: 1.6, margin: '0 0 14px', fontSize: 15 }}>{children}</Text>
);

/** Sent to someone who just subscribed to the YEWsletter. */
export const SignupWelcome = ({ firstName, siteUrl = ORG.siteUrl, unsubscribeUrl }) => (
  <Shell preview={`Welcome to the ${ORG.newsletterName}`} siteUrl={siteUrl} unsubscribeUrl={unsubscribeUrl}>
    <Section style={{ padding: '8px 32px 8px' }}>
      <H1>{firstName ? `Welcome, ${firstName}!` : 'Welcome!'}</H1>
      <P>
        Thanks for signing up. You're on the list for the <strong>{ORG.newsletterName}</strong> — our
        roundup of upcoming events, volunteer opportunities, and what's growing across
        Hopewell Valley schools.
      </P>
      <P>
        Nothing to do now; the next issue will land in your inbox. In the meantime, have a look
        at what's coming up.
      </P>
    </Section>
    <Section style={{ padding: '0 32px 24px', textAlign: 'center' }}>
      <Button href={`${siteUrl}/events`} style={{ background: BRAND.primary, color: '#fff', padding: '12px 28px', borderRadius: 999, fontWeight: 700, textDecoration: 'none' }}>
        See upcoming events
      </Button>
    </Section>
    {/* Anyone can submit the signup form with someone else's address, so say plainly
        what to do about it. The actual control lives in the footer. */}
    <Section style={{ padding: '0 32px 28px', textAlign: 'center' }}>
      <Text style={{ fontSize: 12, color: BRAND.textMuted, margin: 0, lineHeight: 1.5 }}>
        Didn't sign up? Use the unsubscribe link below and you'll be removed straight away.
      </Text>
    </Section>
  </Shell>
);

/** Sent to someone who submitted the contact or staff-support form. */
export const FormReceipt = ({ firstName, kind, siteUrl = ORG.siteUrl }) => (
  <Shell preview={`We got your ${kind}`} siteUrl={siteUrl}>
    <Section style={{ padding: '8px 32px 32px' }}>
      <H1>{firstName ? `Thanks, ${firstName}!` : 'Thanks!'}</H1>
      <P>
        We've received your {kind} and a member of the ecoPTO team will get back to you.
        We're all volunteers, so please give us a few days.
      </P>
      <P muted>
        If it's urgent, reply directly to this email.
      </P>
    </Section>
  </Shell>
);

/**
 * Sent to the ecoPTO team on every submission. This *is* the submission archive now
 * that Netlify Forms is out of the picture — so it prints every field verbatim.
 */
export const InternalNotification = ({ title, fields = [], siteUrl = ORG.siteUrl }) => (
  <Shell preview={title} siteUrl={siteUrl} showFooterAddress={false}>
    <Section style={{ padding: '8px 32px 8px' }}>
      <H1>{title}</H1>
    </Section>
    <Section style={{ padding: '0 32px 28px' }}>
      {fields.map(([label, value], i) => (
        <Section key={i} style={{ padding: '10px 0', borderBottom: `1px solid ${BRAND.bgMuted}` }}>
          <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: BRAND.textMuted, margin: '0 0 2px', fontWeight: 700 }}>
            {label}
          </Text>
          {/* One <Text> per line: `white-space: pre-wrap` is ignored by Outlook's Word
              renderer, and the plaintext alternative drops newlines entirely, so a
              multi-paragraph message arrived as one run-on block. */}
          {String(value || '—').split('\n').map((line, j) => (
            <Text key={j} style={{ fontSize: 15, color: BRAND.text, margin: 0 }}>
              {line.trim() === '' ? '\u00A0' : line}
            </Text>
          ))}
        </Section>
      ))}
      <Hr style={{ borderColor: BRAND.bgMuted, margin: '20px 0 12px' }} />
      <Text style={{ fontSize: 12, color: BRAND.textMuted, margin: 0 }}>
        Reply to this email to answer the sender directly.
      </Text>
    </Section>
  </Shell>
);
