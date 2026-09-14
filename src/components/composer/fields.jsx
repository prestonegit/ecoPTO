import React, { useId, useLayoutEffect, useRef, useState } from 'react';
import { toDate } from './format.js';
import { acceptFor } from './backend.js';

export function Field({ label, hint, optional, error, children, htmlFor }) {
  return (
    <div className={`cmp-field${error ? ' has-error' : ''}`}>
      <label className="cmp-label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="cmp-optional">optional</span>}
      </label>
      {children}
      {error ? <p className="cmp-error">{error}</p> : hint ? <p className="cmp-hint">{hint}</p> : null}
    </div>
  );
}

export function TextField({ label, hint, optional, error, value, onChange, placeholder, type = 'text', maxLength }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} optional={optional} error={error} htmlFor={id}>
      <input
        id={id}
        className="cmp-input"
        type={type}
        value={value || ''}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

// Decap stores sendDate as a UTC instant. <input type="datetime-local"> speaks local wall
// time with no zone, so convert at the edge: shown in the editor's own time zone, saved as
// the instant it means.
const pad = (n) => String(n).padStart(2, '0');
const toLocalInput = (v) => {
  const d = toDate(v);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export function DateTimeField({ label, hint, error, value, onChange }) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        className="cmp-input cmp-input-date"
        type="datetime-local"
        value={toLocalInput(value)}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value) : null)}
      />
    </Field>
  );
}

export function Toggle({ label, hint, checked, onChange }) {
  const id = useId();
  return (
    <div className="cmp-toggle-row">
      <label className="cmp-toggle" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked !== false} onChange={(e) => onChange(e.target.checked)} />
        <span className="cmp-toggle-track" aria-hidden="true"><span className="cmp-toggle-thumb" /></span>
        <span className="cmp-toggle-label">{label}</span>
      </label>
      {hint && <p className="cmp-hint cmp-toggle-hint">{hint}</p>}
    </div>
  );
}

// A plain textarea with a small formatting toolbar, deliberately not a rich-text editor.
// The rich markdown editor in Decap (Slate) is what crashed and lost a newsletter draft at
// the start of all this; a textarea can't get into that state. The email renders the
// markdown, so the preview shows the formatting as it will actually appear.
export function MarkdownField({ label, hint, optional, error, value, onChange, rows = 5 }) {
  const id = useId();
  const ref = useRef(null);

  // Grow with the content instead of scrolling inside a small box.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight + 2, rows * 24)}px`;
  }, [value, rows]);

  const wrap = (before, after = before, placeholder = 'text') => {
    const el = ref.current;
    const v = value || '';
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const chosen = v.slice(s, e) || placeholder;
    const next = v.slice(0, s) + before + chosen + after + v.slice(e);
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + chosen.length);
    });
  };

  const prefixLines = (prefix) => {
    const el = ref.current;
    const v = value || '';
    const s = v.lastIndexOf('\n', el.selectionStart - 1) + 1;
    const e = el.selectionEnd;
    const block = v.slice(s, e) || 'List item';
    const next = v.slice(0, s) + block.split('\n').map((l) => prefix + l).join('\n') + v.slice(e);
    onChange(next);
    requestAnimationFrame(() => el.focus());
  };

  const link = () => {
    const url = window.prompt('Link to which web address?', 'https://');
    if (!url || url === 'https://') return;
    wrap('[', `](${url})`, 'link text');
  };

  return (
    <Field label={label} hint={hint} optional={optional} error={error} htmlFor={id}>
      <div className="cmp-md">
        <div className="cmp-md-bar" role="toolbar" aria-label={`Formatting for ${label}`}>
          <button type="button" onClick={() => wrap('**')} title="Bold"><strong>B</strong></button>
          <button type="button" onClick={() => wrap('_')} title="Italic"><em>I</em></button>
          <button type="button" onClick={link} title="Add a link">Link</button>
          <button type="button" onClick={() => prefixLines('### ')} title="Heading">Heading</button>
          <button type="button" onClick={() => prefixLines('- ')} title="Bulleted list">• List</button>
        </div>
        <textarea
          id={id}
          ref={ref}
          className="cmp-textarea"
          rows={rows}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

export function UploadField({ label, hint, optional, value, onChange, onUpload, localUrls, accept, kind = 'image' }) {
  const id = useId();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const src = value ? localUrls[value] || value : '';
  const name = value ? value.split('/').pop() : '';

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setErr(null);
    try {
      onChange(await onUpload(file, kind));
    } catch (x) {
      setErr(`Upload failed: ${x.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Field label={label} hint={hint} optional={optional} error={err} htmlFor={id}>
      <div className="cmp-upload">
        {value && kind === 'image' && <img className="cmp-thumb" src={src} alt="" />}
        {value && kind === 'file' && <span className="cmp-filename">{name}</span>}
        <div className="cmp-upload-actions">
          <button id={id} type="button" className="cmp-btn cmp-btn-quiet" disabled={busy} onClick={() => input.current.click()}>
            {busy ? 'Uploading…' : value ? 'Replace' : kind === 'image' ? 'Upload an image' : 'Upload a file'}
          </button>
          {value && !busy && (
            <button type="button" className="cmp-btn cmp-btn-link" onClick={() => onChange('')}>Remove</button>
          )}
        </div>
        <input ref={input} type="file" accept={accept || acceptFor(kind)} hidden onChange={pick} />
      </div>
    </Field>
  );
}

const BLOCK_TYPES = {
  callout: { label: 'Callout', blurb: 'A highlighted note, like a thank-you or reminder.' },
  story: { label: 'Story', blurb: 'A titled story with an optional photo.' },
  image: { label: 'Image', blurb: 'A photo on its own.' },
  button: { label: 'Button', blurb: 'A call to action that links somewhere.' },
};

export function BlocksEditor({ blocks = [], onChange, onUpload, localUrls }) {
  const [adding, setAdding] = useState(false);
  const update = (i, patch) => onChange(blocks.map((b, j) => (j === i ? { ...b, ...patch } : b)));
  const remove = (i) => onChange(blocks.filter((_, j) => j !== i));
  const move = (i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = (type) => {
    onChange([...blocks, { type }]);
    setAdding(false);
  };

  return (
    <div className="cmp-blocks">
      {blocks.length === 0 && <p className="cmp-empty">No extra blocks. Add one for a callout, story, photo, or button.</p>}
      {blocks.map((b, i) => (
        <div className="cmp-block" key={i}>
          <div className="cmp-block-head">
            <span className="cmp-block-type">{(BLOCK_TYPES[b.type] || { label: b.type }).label}</span>
            <div className="cmp-block-tools">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === blocks.length - 1} aria-label="Move down">↓</button>
              <button type="button" onClick={() => remove(i)} className="danger">Remove</button>
            </div>
          </div>
          {b.type !== 'image' && <TextField label="Title" value={b.title} onChange={(v) => update(i, { title: v })} />}
          {(b.type === 'story' || b.type === 'image') && (
            <UploadField
              label="Image"
              optional={b.type === 'story'}
              value={b.image}
              onChange={(v) => update(i, { image: v })}
              onUpload={onUpload}
              localUrls={localUrls}
              
            />
          )}
          {(b.type === 'callout' || b.type === 'story') && (
            <MarkdownField label="Text" value={b.body} onChange={(v) => update(i, { body: v })} rows={3} />
          )}
          {b.type === 'button' && (
            <>
              <TextField label="Text above the button" optional value={b.body} onChange={(v) => update(i, { body: v })} />
              <TextField label="Button label" value={b.buttonText} onChange={(v) => update(i, { buttonText: v })} placeholder="Sign up to help" />
              <TextField label="Button links to" value={b.buttonUrl} onChange={(v) => update(i, { buttonUrl: v })} placeholder="https://" type="url" />
            </>
          )}
        </div>
      ))}
      {adding ? (
        <div className="cmp-add-menu">
          {Object.entries(BLOCK_TYPES).map(([type, t]) => (
            <button type="button" key={type} onClick={() => add(type)}>
              <strong>{t.label}</strong>
              <span>{t.blurb}</span>
            </button>
          ))}
          <button type="button" className="cmp-btn cmp-btn-link" onClick={() => setAdding(false)}>Cancel</button>
        </div>
      ) : (
        <button type="button" className="cmp-btn cmp-btn-quiet" onClick={() => setAdding(true)}>+ Add a block</button>
      )}
    </div>
  );
}

export function AttachmentsEditor({ items = [], onChange, onUpload, localUrls }) {
  const update = (i, patch) => onChange(items.map((a, j) => (j === i ? { ...a, ...patch } : a)));
  return (
    <div className="cmp-blocks">
      {items.length === 0 && <p className="cmp-empty">No files linked. PDFs and flyers are hosted on the site and linked from the email.</p>}
      {items.map((a, i) => (
        <div className="cmp-block" key={i}>
          <div className="cmp-block-head">
            <span className="cmp-block-type">File {i + 1}</span>
            <div className="cmp-block-tools">
              <button type="button" className="danger" onClick={() => onChange(items.filter((_, j) => j !== i))}>Remove</button>
            </div>
          </div>
          <TextField label="Shown in the email as" value={a.label} onChange={(v) => update(i, { label: v })} placeholder="March meeting minutes" />
          <UploadField label="File" value={a.file} onChange={(v) => update(i, { file: v })} onUpload={onUpload} localUrls={localUrls} kind="file" />
        </div>
      ))}
      <button type="button" className="cmp-btn cmp-btn-quiet" onClick={() => onChange([...items, { label: '', file: '' }])}>+ Add a file</button>
    </div>
  );
}
