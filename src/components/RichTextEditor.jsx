import React, { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { OrderedList } from '@tiptap/extension-list';
import HardBreak from '@tiptap/extension-hard-break';
import { Markdown } from '@tiptap/markdown';

// The one text editor for everything people write on this site: the newsletter composer and
// every rich-text field in Decap. It looks like the result (bold is bold, links are links),
// with plain-word buttons, because the people using it are parent volunteers, not writers of
// markdown.
//
// Why not Decap's own markdown editor: it's built on Slate in both of its modes (RawEditor.js
// imports slate-react too), and a Slate error ("Cannot resolve a DOM node from Slate node")
// is what crashed the editor and lost a newsletter draft. This is TipTap, on ProseMirror, a
// different foundation. No editor is crash-proof; the composer's local backup and Decap's
// own backup cover that case.
//
// Files still store markdown, so nothing about the content, the site, or the email changes.
// The schema is deliberately small, matching what the site's content actually uses (surveyed
// across all 49 rich-text values: bold, links incl. email links, bullet lists, one small
// heading, line breaks). Formats markdown can't represent are switched off, so nothing can
// be typed that silently disappears on save: underline (Cmd+U) especially.

// Only web and email links. `javascript:` and friends are refused outright.
const isSafeHref = (href) => /^(https?:\/\/|mailto:|\/(?!\/))/i.test(href || '');

// Turn what someone types into a link target: a bare email becomes mailto:, a bare domain
// becomes https://. Returns null for anything that isn't recognisably a web or email address.
export function normaliseLink(input) {
  const v = String(input || '').trim();
  if (!v) return null;
  if (/^[^@\s/]+@[^@\s/]+\.[^@\s/]+$/.test(v)) return `mailto:${v}`;
  if (isSafeHref(v)) return v;
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+(\/\S*)?$/i.test(v)) return `https://${v}`;
  return null;
}

// News post bodies are MDX, where `{`, `}` and `<` start code, so a volunteer typing "<3" or
// a brace would break the site build. Escape them in the saved markdown. The editor's own
// parser reads `\{` back as `{`, so it round-trips.
// A lookbehind, so runs like `{{{` are all escaped and an already-escaped `\{` isn't doubled.
export const escapeForMdx = (md) => md.replace(/(?<!\\)[{}<]/g, (c) => `\\${c}`);

// The editor's schema, exported so tests exercise exactly what the page uses.
// The editor must read markdown the way the site and the email do (both use `marked`), or a
// save quietly rewrites content. Two places it didn't, both found by round-tripping every
// existing value:
//
// - TipTap's ordered list has its own reader that also accepts lettered and roman markers,
//   so paragraphs starting "a)", "b)", "c)" (in the June issue) became a list and were saved
//   as "a." lines, which `marked` then rendered as one run-on paragraph. Declining its reader
//   (returning undefined) hands list parsing back to marked's standard, numbers-only rules.
// - Line breaks were written as two trailing spaces. Two breaks in a row then made a line of
//   only spaces, which is a paragraph break, so a save changed the layout and every later save
//   drifted further. Backslash breaks, which the existing content already uses, are stable.
const StandardOrderedList = OrderedList.extend({
  markdownTokenizer: {
    name: 'orderedList',
    level: 'block',
    start: () => -1,
    tokenize: () => undefined,
  },
});
const StableHardBreak = HardBreak.extend({
  renderMarkdown: () => '\\\n',
});

export function editorExtensions() {
  return [
    StandardOrderedList,
    StableHardBreak,
    StarterKit.configure({
      orderedList: false,
      hardBreak: false,
      underline: false,
      strike: false,
      code: false,
      codeBlock: false,
      blockquote: false,
      horizontalRule: false,
      heading: { levels: [3] },
      link: {
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
        protocols: ['mailto'],
        isAllowedUri: (url) => isSafeHref(url),
        HTMLAttributes: { rel: 'noopener noreferrer', target: null },
      },
    }),
    Markdown,
  ];
}

// Markdown out of an editor, exactly as onUpdate saves it.
export function editorMarkdown(ed, { mdx = false } = {}) {
  let md = ed.isEmpty ? '' : ed.getMarkdown().replace(/\s+$/, '');
  if (mdx) md = escapeForMdx(md);
  return md;
}

const Button = ({ onClick, active, disabled, label, children, wide }) => (
  <button
    type="button"
    className={`rte-btn${active ? ' is-active' : ''}${wide ? ' is-wide' : ''}`}
    onMouseDown={(e) => e.preventDefault() /* keep the text selection */}
    onClick={onClick}
    disabled={disabled}
    aria-pressed={active === undefined ? undefined : !!active}
    aria-label={label}
    title={label}
  >
    {children}
  </button>
);

export default function RichTextEditor({
  id,
  value,
  onChange,
  labelledBy,
  ariaLabel,
  describedBy,
  invalid,
  mdx = false,
  minRows = 4,
  placeholder = '',
}) {
  const lastEmitted = useRef(value || '');
  const [linking, setLinking] = useState(null); // { href, hadSelection }
  const [linkError, setLinkError] = useState(null);
  const linkInput = useRef(null);

  const editor = useEditor({
    extensions: editorExtensions(),
    content: value || '',
    contentType: 'markdown',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'rte-content',
        role: 'textbox',
        'aria-multiline': 'true',
        ...(id ? { id } : {}),
        ...(labelledBy ? { 'aria-labelledby': labelledBy } : ariaLabel ? { 'aria-label': ariaLabel } : {}),
        ...(describedBy ? { 'aria-describedby': describedBy } : {}),
        ...(invalid ? { 'aria-invalid': 'true' } : {}),
        style: `min-height: ${minRows * 1.6}em`,
        'data-placeholder': placeholder,
      },
    },
    onUpdate: ({ editor: ed }) => {
      const md = editorMarkdown(ed, { mdx });
      lastEmitted.current = md;
      onChange(md);
    },
  });

  // Take outside changes (a restored backup, someone else's merged edit) without echoing them
  // back as an edit, and without resetting the cursor on every keystroke of our own.
  useEffect(() => {
    if (!editor) return;
    const next = value || '';
    if (next === lastEmitted.current) return;
    lastEmitted.current = next;
    editor.commands.setContent(next, { contentType: 'markdown', emitUpdate: false });
  }, [editor, value]);

  // Keep accessibility attributes current (an error appearing after a failed save).
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: {
          ...editor.options.editorProps.attributes,
          ...(describedBy ? { 'aria-describedby': describedBy } : {}),
          'aria-invalid': invalid ? 'true' : 'false',
        },
      },
    });
  }, [editor, describedBy, invalid]);

  const state = useEditorState({
    editor,
    selector: ({ editor: ed }) =>
      ed
        ? {
            bold: ed.isActive('bold'),
            italic: ed.isActive('italic'),
            link: ed.isActive('link'),
            bullet: ed.isActive('bulletList'),
            ordered: ed.isActive('orderedList'),
            heading: ed.isActive('heading', { level: 3 }),
          }
        : {},
  }) || {};

  useEffect(() => {
    if (linking) linkInput.current?.focus();
  }, [linking]);

  if (!editor) return <div className="rte rte-loading" style={{ minHeight: `${minRows * 1.6 + 3}em` }} />;

  const openLink = () => {
    const current = editor.getAttributes('link').href || '';
    setLinkError(null);
    setLinking({ href: current.replace(/^mailto:/, ''), hadSelection: !editor.state.selection.empty });
  };

  const applyLink = () => {
    const href = normaliseLink(linking.href);
    if (!href) {
      setLinkError('That doesn’t look like a web address or email. Try something like ecopto.org or name@example.com.');
      return;
    }
    const chain = editor.chain().focus();
    if (linking.hadSelection || editor.isActive('link')) {
      chain.extendMarkRange('link').setLink({ href }).run();
    } else {
      // Nothing selected: insert the address itself as the link text.
      const text = linking.href.trim();
      chain.insertContent({ type: 'text', text, marks: [{ type: 'link', attrs: { href } }] }).run();
    }
    setLinking(null);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinking(null);
  };

  return (
    <div className={`rte${invalid ? ' is-invalid' : ''}`}>
      <div className="rte-toolbar" role="toolbar" aria-label="Text formatting">
        <Button label="Bold" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
          <strong>B</strong>
        </Button>
        <Button label="Italic" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <em>I</em>
        </Button>
        <Button label={state.link ? 'Change or remove link' : 'Add a link'} active={state.link} onClick={openLink} wide>
          Link
        </Button>
        <span className="rte-sep" aria-hidden="true" />
        <Button label="Bulleted list" active={state.bullet} onClick={() => editor.chain().focus().toggleBulletList().run()} wide>
          • List
        </Button>
        <Button label="Numbered list" active={state.ordered} onClick={() => editor.chain().focus().toggleOrderedList().run()} wide>
          1. List
        </Button>
        <Button label="Heading" active={state.heading} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} wide>
          Heading
        </Button>
      </div>

      {linking && (
        <div className="rte-link" role="group" aria-label="Link">
          <label className="rte-link-label">
            {linking.hadSelection || state.link ? 'Link the selected text to' : 'Web address or email to add'}
            <input
              ref={linkInput}
              className="rte-link-input"
              value={linking.href}
              placeholder="ecopto.org or name@example.com"
              onChange={(e) => { setLinking({ ...linking, href: e.target.value }); setLinkError(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); setLinking(null); editor.commands.focus(); }
              }}
            />
          </label>
          <div className="rte-link-actions">
            <button type="button" className="rte-action is-primary" onClick={applyLink}>
              {state.link ? 'Update link' : 'Add link'}
            </button>
            {state.link && <button type="button" className="rte-action" onClick={removeLink}>Remove link</button>}
            <button type="button" className="rte-action is-quiet" onClick={() => { setLinking(null); editor.commands.focus(); }}>Cancel</button>
          </div>
          {linkError && <p className="rte-link-error" role="alert">{linkError}</p>}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
