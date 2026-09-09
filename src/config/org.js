// Single source of truth for organization identity.
// Read by the email template, the public archive page, and the Netlify form function
// so these details can never drift apart across the three renderers.

export const ORG = {
  name: 'Hopewell Valley ecoPTO',
  shortName: 'ecoPTO',
  newsletterName: 'YEWsletter',
  email: 'ecoptohvrsd@gmail.com',
  // This module is imported by Node scripts, the Netlify function, AND the browser
  // (the Decap CMS preview pane), where `process` does not exist at all.
  siteUrl: (typeof process !== 'undefined' && process.env?.SITE_URL) || 'https://ecopto.org',

  // Shown in the footer of every newsletter, as CAN-SPAM (15 U.S.C. §7704(a)(5))
  // requires. `npm run newsletter:push` refuses to send to the audience without it.
  postalAddress: '425 S Main St., Pennington, NJ 08534',
};

export const BRAND = {
  primary: '#B05B3B',
  secondary: '#FFC099',
  accent: '#FF5050',
  text: '#333333',
  textMuted: '#555555',
  bg: '#FFFFFF',
  bgMuted: '#F5F5F5',
  donate: '#15803d',
  fontSans: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontSerif: "'Playfair Display', Georgia, serif",
};

export const hasPostalAddress = () =>
  Boolean(ORG.postalAddress) && !ORG.postalAddress.startsWith('TODO_');
