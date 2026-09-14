import React, { forwardRef } from 'react';

// Shown at the top of a newsletter issue in Decap: the same issue, one click away in the
// composer, which handles saving, testing, and sending with less that can go wrong.
//
// Holds no data (never calls onChange), exactly like SectionWidget, so it never writes a key
// into the file. It also carries `data-section-divider`, so decap-admin.css hides the label
// chip and hint Decap would otherwise wrap around it.
const ComposerLinkControl = forwardRef(({ entry, classNameWrapper }, ref) => {
  const slug = entry && entry.get ? entry.get('slug') : '';
  const isNew = !entry || !entry.get || entry.get('newRecord');
  const href = `/admin/newsletter#/${!isNew && slug ? `issue/${encodeURIComponent(slug)}` : 'new'}`;
  return (
    <div
      className={classNameWrapper}
      data-section-divider=""
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        background: '#fff6ef', border: '1px solid #f3d6c4', borderRadius: 10, padding: '12px 14px',
        boxShadow: 'none', margin: '4px 0 8px',
      }}
    >
      <div style={{ fontSize: 14, color: '#2b2018', lineHeight: 1.45 }}>
        <strong>Easier in the newsletter composer.</strong>{' '}
        It saves, tests, and sends with a live preview, and keeps your work if the page closes.
      </div>
      <a
        href={href}
        style={{
          background: '#b05b3b', color: '#fff', textDecoration: 'none', borderRadius: 8,
          padding: '8px 14px', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap',
        }}
      >
        {isNew ? 'Write it in the composer →' : 'Open this issue in the composer →'}
      </a>
    </div>
  );
});

ComposerLinkControl.displayName = 'ComposerLinkControl';

export const ComposerLinkPreview = () => null;

export default ComposerLinkControl;
