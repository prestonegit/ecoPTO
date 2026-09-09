import * as React from 'react';
import {
  Html, Head, Body, Container, Section, Heading, Text, Img, Link, Button, Hr, Preview,
} from '@react-email/components';
import { ORG, BRAND, hasPostalAddress } from '../config/org.js';

const { fontSans, fontSerif } = BRAND;

// Shared chrome for every one-to-one email we send (confirmations, receipts,
// internal notifications). Deliberately lighter than the newsletter template.
const Shell = ({ preview, siteUrl, children, showFooterAddress = true }) => (
  <Html>
    <Head />
    {preview && <Preview>{preview}</Preview>}
    <Body style={{ background: BRAND.bgMuted, margin: 0, padding: '24px 0', fontFamily: fontSans, color: BRAND.text }}>
      <Container style={{ maxWidth: 560, background: BRAND.bg, borderRadius: 8, overflow: 'hidden' }}>
        <Section style={{ padding: '20px 24px', borderBottom: `1px solid ${BRAND.bgMuted}`, textAlign: 'center' }}>
          <Img src={`${siteUrl}/email-logo.png`} alt={ORG.shortName} width="40" height="40" style={{ margin: '0 auto' }} />
        </Section>
        {children}
        <Section style={{ background: BRAND.primary, padding: 24, textAlign: 'center' }}>
          <Text style={{ fontSize: 12, color: '#fff', opacity: 0.8, margin: 0 }}>
            {ORG.name} · <Link href={`mailto:${ORG.email}`} style={{ color: BRAND.secondary }}>{ORG.email}</Link>
          </Text>
          {showFooterAddress && hasPostalAddress() && (
            <Text style={{ fontSize: 11, color: '#fff', opacity: 0.6, margin: '4px 0 0' }}>{ORG.postalAddress}</Text>
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
export const SignupWelcome = ({ firstName, siteUrl = ORG.siteUrl }) => (
  <Shell preview={`Welcome to the ${ORG.newsletterName}`} siteUrl={siteUrl}>
    <Section style={{ padding: '32px 32px 8px' }}>
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
    {/* Anyone can submit the signup form with someone else's address, so the person who
        did not ask for this needs a way out of the very first email they receive. */}
    <Section style={{ padding: '0 32px 28px', textAlign: 'center' }}>
      <Text style={{ fontSize: 11, color: BRAND.textMuted, margin: 0 }}>
        Didn't sign up? <Link href={`mailto:${ORG.email}?subject=Unsubscribe`} style={{ color: BRAND.textMuted }}>Tell us and we'll remove you</Link>.
      </Text>
    </Section>
  </Shell>
);

/** Sent to someone who submitted the contact or staff-support form. */
export const FormReceipt = ({ firstName, kind, siteUrl = ORG.siteUrl }) => (
  <Shell preview={`We got your ${kind}`} siteUrl={siteUrl}>
    <Section style={{ padding: '32px 32px 32px' }}>
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
    <Section style={{ padding: '28px 32px 8px' }}>
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
