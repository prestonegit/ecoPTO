import React from 'react';

// A field that isn't a field: renders a section heading inside the editor form so a long
// flat list of inputs reads as grouped steps.
//
// The obvious way to group fields in Decap is the `object` widget, which also gives real
// collapsing — but it NESTS the data, so `subject` would become `basics.subject`. That
// would break every existing newsletter file and the frontmatter contract that
// push-newsletter.mjs reads. This keeps the data perfectly flat: the widget renders a
// heading and never calls onChange, so the field holds no value.
//
// Decap renders its own label chip and hint around every widget, which duplicates the
// heading this draws. decap-admin.css hides both for containers marked with
// `data-section-divider`.

const SectionControl = ({ field, classNameWrapper }) => {
  const title = field.get('label') || '';
  const blurb = field.get('hint') || '';
  return (
    <div
      className={classNameWrapper}
      data-section-divider=""
      style={{
        background: 'transparent',
        boxShadow: 'none',
        border: 0,
        padding: 0,
        margin: '26px 0 2px',
        borderTop: '1px solid #e7ded7',
        paddingTop: 18,
      }}
    >
      <div
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.15rem',
          fontWeight: 700,
          color: '#2b2018',
          letterSpacing: '-0.01em',
        }}
      >
        {title}
      </div>
      {blurb && (
        <div style={{ fontSize: 13, color: '#6b5d54', marginTop: 3, lineHeight: 1.45 }}>{blurb}</div>
      )}
    </div>
  );
};

// Nothing to show in the preview pane; the real preview renders the email itself.
export const SectionPreview = () => null;

export default SectionControl;
