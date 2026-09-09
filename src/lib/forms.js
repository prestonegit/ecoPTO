// Wires every form marked with `data-resend-form="<name>"` to the /api/forms
// Netlify Function. Replaces Netlify Forms' native POST-and-redirect with an
// inline submit, so the user never leaves the page.
//
// Each form gets, automatically:
//   · a honeypot field bots fill in and humans never see
//   · a render timestamp, so submissions faster than a human can type are dropped
//   · a disabled button + status message while in flight

const HONEYPOT = '_hp';
const ENDPOINT = '/api/forms';

// The server mints a signed, timestamped nonce; submitting it back proves the form was
// on screen long enough to be filled in by a person. Doing the timing server-side means
// a bot can't skip the check by omitting a field, and a user with a skewed device clock
// isn't silently rejected.
// Cached on `window`, not in module scope: Astro bundles the two component scripts
// that import this file separately, so module-level state would be duplicated and each
// copy would fetch its own nonce. One page load should make exactly one request.
const NONCE_KEY = '__ecoptoFormNonce';
const getNonce = () => {
  if (!window[NONCE_KEY]) {
    window[NONCE_KEY] = fetch(ENDPOINT, { headers: { Accept: 'application/json' } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d?.nonce || null)
      .catch(() => null);
  }
  return window[NONCE_KEY];
};

function statusEl(form) {
  let el = form.querySelector('[data-form-status]');
  if (!el) {
    el = document.createElement('p');
    el.setAttribute('data-form-status', '');
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.className = 'text-sm font-bold mt-3';
    el.tabIndex = -1;
    // Place it just above the submit button so it isn't below the fold on long forms.
    // Walk up to whichever direct child of the form contains the button.
    const button = form.querySelector('button[type="submit"]');
    let anchor = button;
    while (anchor && anchor.parentElement !== form) anchor = anchor.parentElement;
    if (anchor) form.insertBefore(el, anchor);
    else form.appendChild(el);
  }
  return el;
}

function collect(form) {
  const fd = new FormData(form);
  const fields = {};
  for (const [key, value] of fd.entries()) {
    if (key === HONEYPOT) continue;
    if (key in fields) {
      // Checkbox groups (school, selected-volunteer-roles) arrive as repeats.
      fields[key] = Array.isArray(fields[key]) ? [...fields[key], value] : [fields[key], value];
    } else {
      fields[key] = value;
    }
  }
  // Unchecked checkboxes are absent from FormData; the server needs to see the false.
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    if (!cb.checked && !(cb.name in fields)) fields[cb.name] = '';
  });
  return fields;
}

function wire(form) {
  if (form.dataset.wired === 'true') return;
  form.dataset.wired = 'true';

  const name = form.dataset.resendForm;
  getNonce(); // start the round trip now, not at submit time

  // Honeypot: off-screen rather than display:none, which some bots detect.
  const hp = document.createElement('div');
  hp.setAttribute('aria-hidden', 'true');
  hp.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden';
  hp.innerHTML = `<label>Leave this field empty<input type="text" name="${HONEYPOT}" tabindex="-1" autocomplete="off" /></label>`;
  form.appendChild(hp);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const status = statusEl(form);
    const originalLabel = button?.textContent;

    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    status.textContent = '';
    status.className = 'text-sm font-bold mt-3';

    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form: name,
          fields: collect(form),
          _hp: form.querySelector(`[name="${HONEYPOT}"]`)?.value || '',
          _nonce: await getNonce(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ok) {
        form.reset();
        // form.reset() restores values but not visibility — re-run the modal's own
        // conditional-section logic so "Other" / volunteer-role panels collapse again.
        form.querySelectorAll('input[type="checkbox"]').forEach((cb) => cb.dispatchEvent(new Event('change', { bubbles: true })));
        status.className = 'text-sm font-bold mt-3 text-green-700';
        status.textContent = form.dataset.successMessage
          || 'Thanks! We got it — check your inbox for a confirmation.';
        form.dispatchEvent(new CustomEvent('resend-form:success', { bubbles: true }));
      } else {
        status.className = 'text-sm font-bold mt-3 text-red-600';
        status.textContent = data.error || 'Something went wrong. Please try again, or email us directly.';
        status.focus();
      }
    } catch {
      status.className = 'text-sm font-bold mt-3 text-red-600';
      status.textContent = 'Could not reach the server. Please check your connection and try again.';
      status.focus();
    } finally {
      if (button) { button.disabled = false; button.textContent = originalLabel; }
    }
  });
}

export function wireForms(root = document) {
  root.querySelectorAll('form[data-resend-form]').forEach(wire);
}
