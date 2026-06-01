import { Resend } from 'resend';

// Netlify fires this function automatically whenever any Netlify Form is submitted.
// We pull out the signup form payload and push the email to a Resend audience.
// Other forms (staff-support, etc.) are ignored.
export default async (req) => {
  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('Missing RESEND_API_KEY or RESEND_AUDIENCE_ID env vars');
    return new Response('Missing config', { status: 500 });
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const sub = payload?.payload ?? {};
  const formName = sub.form_name;
  const data = sub.data ?? {};

  if (formName !== 'signup') {
    return new Response('Ignored (not signup form)', { status: 200 });
  }

  const email = (data.email || '').trim().toLowerCase();
  if (!email) {
    return new Response('No email in submission', { status: 200 });
  }

  const wantsUpdates = data['receive-updates'] === 'on' || data['receive-updates'] === true;
  if (!wantsUpdates) {
    return new Response('User opted out of updates', { status: 200 });
  }

  const fullName = (data.name || '').trim();
  const [firstName, ...rest] = fullName.split(/\s+/);
  const lastName = rest.join(' ');

  const resend = new Resend(apiKey);

  try {
    await resend.contacts.create({
      audienceId,
      email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsubscribed: false,
    });
    return new Response(`Added ${email}`, { status: 200 });
  } catch (err) {
    console.error('Resend contact create failed:', err);
    return new Response(`Resend error: ${err.message}`, { status: 500 });
  }
};
