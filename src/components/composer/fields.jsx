import React, { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { toDate } from './format.js';
import { acceptFor } from './backend.js';

// The hint or error below a field is tied to its input with aria-describedby, and an error
// sets aria-invalid, so a screen reader announces "Subject, invalid, Give the email a subject
// before saving" instead of just "Subject". The error replaces the hint, so it's one id.
export const describedBy = (id, hint, error) => (hint || error ? `${id}-desc` : undefined);

export function Field({ label, hint, optional, error, children, htmlFor }) {
  return (
    <div className={`cmp-field${error ? ' has-error' : ''}`}>
      <label className="cmp-label" htmlFor={htmlFor}>
        {label}
        {optional && <span className="cmp-optional">optional</span>}
      </label>
      {children}
      {error ? (
        <p className="cmp-error" id={`${htmlFor}-desc`}>{error}</p>
      ) : hint ? (
        <p className="cmp-hint" id={`${htmlFor}-desc`}>{hint}</p>
      ) : null}
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
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
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
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, hint, error)}
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
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, hint, error)}
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

// Shared by the block and file lists.
//
// Two bugs shaped this. An upload finishing used to write back the list as it was when the
// upload STARTED, so anything edited, removed or reordered meanwhile was undone, or the image
// landed on whichever block now sat at that position. So every change is an updater applied
// to the latest list (onChange receives a function, not an array), and items are tracked by
// identity rather than index. And Remove deleted a block with no way back, so it now offers Undo.
function useListIdentity() {
  const ids = useRef(new WeakMap());
  const next = useRef(0);
  const idOf = (item) => {
    if (!ids.current.has(item)) ids.current.set(item, `item-${(next.current += 1)}`);
    return ids.current.get(item);
  };
  // Carry an item's id over to its replacement when a field changes.
  const replaced = (oldItem, newItem) => {
    ids.current.set(newItem, idOf(oldItem));
    return newItem;
  };
  return { idOf, replaced };
}

function useUndoableRemove(onChange, idOf) {
  const [removed, setRemoved] = useState(null); // { item, index, label }
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const remove = (item, label) => {
    let index = -1;
    onChange((list) => {
      index = list.findIndex((x) => idOf(x) === idOf(item));
      return index === -1 ? list : list.filter((x) => idOf(x) !== idOf(item));
    });
    clearTimeout(timer.current);
    setRemoved({ item, get index() { return index; }, label });
    timer.current = setTimeout(() => setRemoved(null), 10000);
  };
  const undo = () => {
    if (!removed) return;
    const { item, index } = removed;
    onChange((list) => {
      const at = Math.min(Math.max(index, 0), list.length);
      return [...list.slice(0, at), item, ...list.slice(at)];
    });
    clearTimeout(timer.current);
    setRemoved(null);
  };
  const banner = removed ? (
    <div className="cmp-undo" role="status">
      <span>{removed.label} removed.</span>
      <button type="button" className="cmp-btn cmp-btn-link" onClick={undo}>Undo</button>
    </div>
  ) : null;
  return { remove, banner };
}

export function BlocksEditor({ blocks = [], onChange, onUpload, localUrls }) {
  const [adding, setAdding] = useState(false);
  const { idOf, replaced } = useListIdentity();
  const updateById = (id, patch) =>
    onChange((list) => list.map((b) => (idOf(b) === id ? replaced(b, { ...b, ...patch }) : b)));
  const { remove, banner } = useUndoableRemove(onChange, idOf);
  const move = (id, dir) =>
    onChange((list) => {
      const i = list.findIndex((b) => idOf(b) === id);
      const j = i + dir;
      if (i === -1 || j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  const add = (type) => {
    onChange((list) => [...list, { type }]);
    setAdding(false);
  };

  return (
    <div className="cmp-blocks">
      {blocks.length === 0 && !banner && <p className="cmp-empty">No extra blocks. Add one for a callout, story, photo, or button.</p>}
      {blocks.map((b, i) => {
        const id = idOf(b);
        const typeLabel = (BLOCK_TYPES[b.type] || { label: b.type }).label;
        const name = `${typeLabel}${b.title ? ` “${b.title}”` : ` ${i + 1}`}`;
        return (
          <div className="cmp-block" key={id}>
            <div className="cmp-block-head">
              <span className="cmp-block-type">{typeLabel}</span>
              <div className="cmp-block-tools">
                <button type="button" onClick={() => move(id, -1)} disabled={i === 0} aria-label={`Move ${name} up`}>↑</button>
                <button type="button" onClick={() => move(id, 1)} disabled={i === blocks.length - 1} aria-label={`Move ${name} down`}>↓</button>
                <button type="button" onClick={() => remove(b, name)} className="danger" aria-label={`Remove ${name}`}>Remove</button>
              </div>
            </div>
            {b.type !== 'image' && <TextField label="Title" value={b.title} onChange={(v) => updateById(id, { title: v })} />}
            {(b.type === 'story' || b.type === 'image') && (
              <UploadField
                label="Image"
                optional={b.type === 'story'}
                value={b.image}
                onChange={(v) => updateById(id, { image: v })}
                onUpload={onUpload}
                localUrls={localUrls}
              />
            )}
            {(b.type === 'callout' || b.type === 'story') && (
              <MarkdownField label="Text" value={b.body} onChange={(v) => updateById(id, { body: v })} rows={3} />
            )}
            {b.type === 'button' && (
              <>
                <TextField label="Text above the button" optional value={b.body} onChange={(v) => updateById(id, { body: v })} />
                <TextField label="Button label" value={b.buttonText} onChange={(v) => updateById(id, { buttonText: v })} placeholder="Sign up to help" />
                <TextField label="Button links to" value={b.buttonUrl} onChange={(v) => updateById(id, { buttonUrl: v })} placeholder="https://" type="url" />
              </>
            )}
          </div>
        );
      })}
      {banner}
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
  const { idOf, replaced } = useListIdentity();
  const updateById = (id, patch) =>
    onChange((list) => list.map((a) => (idOf(a) === id ? replaced(a, { ...a, ...patch }) : a)));
  const { remove, banner } = useUndoableRemove(onChange, idOf);
  return (
    <div className="cmp-blocks">
      {items.length === 0 && !banner && <p className="cmp-empty">No files linked. PDFs and flyers are hosted on the site and linked from the email.</p>}
      {items.map((a, i) => {
        const id = idOf(a);
        const name = a.label ? `File “${a.label}”` : `File ${i + 1}`;
        return (
          <div className="cmp-block" key={id}>
            <div className="cmp-block-head">
              <span className="cmp-block-type">File {i + 1}</span>
              <div className="cmp-block-tools">
                <button type="button" className="danger" onClick={() => remove(a, name)} aria-label={`Remove ${name}`}>Remove</button>
              </div>
            </div>
            <TextField label="Shown in the email as" value={a.label} onChange={(v) => updateById(id, { label: v })} placeholder="March meeting minutes" />
            <UploadField label="File" value={a.file} onChange={(v) => updateById(id, { file: v })} onUpload={onUpload} localUrls={localUrls} kind="file" />
          </div>
        );
      })}
      {banner}
      <button type="button" className="cmp-btn cmp-btn-quiet" onClick={() => onChange((list) => [...list, { label: '', file: '' }])}>+ Add a file</button>
    </div>
  );
}
