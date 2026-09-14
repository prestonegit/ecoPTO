import React, { forwardRef } from 'react';
import { marked } from 'marked';
import RichTextEditor from './RichTextEditor.jsx';

// Decap wrapper around the shared visual editor, registered as `widget: "rich-text"` and used
// for every formatted-text field in config.js in place of Decap's `markdown` widget, whose
// editor (Slate, in both its modes) is what crashed and lost a newsletter draft.
//
// Stores exactly what the markdown widget stored, a markdown string, so no content changes.
// `mdx: true` on a field escapes the characters MDX would treat as code; set it on fields
// that become an .mdx file's body.
const RichTextControl = forwardRef(({ value, onChange, forID, field, setActiveStyle, setInactiveStyle }, ref) => (
  <div onFocus={setActiveStyle} onBlur={setInactiveStyle}>
    <RichTextEditor
      id={forID}
      value={typeof value === 'string' ? value : ''}
      onChange={onChange}
      // Decap's field label has no id to point aria-labelledby at, so name the editor directly.
      ariaLabel={field && field.get ? field.get('label') : undefined}
      mdx={field && field.get ? field.get('mdx') === true : false}
      minRows={field && field.get && field.get('minRows') ? field.get('minRows') : 5}
    />
  </div>
));

RichTextControl.displayName = 'RichTextControl';

// The preview pane shows the formatting, the way the markdown widget's preview did.
export const RichTextPreview = ({ value }) => (
  <div dangerouslySetInnerHTML={{ __html: marked.parse(typeof value === 'string' ? value : '') }} />
);

export default RichTextControl;
