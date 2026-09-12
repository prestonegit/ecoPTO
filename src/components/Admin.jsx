// src/components/Admin.jsx
import React, { useEffect } from 'react';
import CMS from 'decap-cms-app';
import { config } from '../cms/config.js';
import NewsletterPreview from './NewsletterPreview.jsx';
import NewsletterSendControl, { NewsletterSendPreview } from './NewsletterSendWidget.jsx';
import SectionControl, { SectionPreview } from './SectionWidget.jsx';

const Admin = () => {
  useEffect(() => {
    CMS.init({ config });
    CMS.registerPreviewTemplate('newsletters', NewsletterPreview);
    CMS.registerWidget('newsletter-send', NewsletterSendControl, NewsletterSendPreview);
    CMS.registerWidget('section', SectionControl, SectionPreview);
  }, []);

  // The CMS will mount itself in the page's body,
  // so we don't need to render anything here.
  return <div />;
};

export default Admin;