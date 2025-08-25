// src/components/Admin.jsx
import React, { useEffect } from 'react';
import CMS from 'decap-cms-app';
import { config } from '../cms/config.js';

const Admin = () => {
  useEffect(() => {
    // Initialize the CMS
    CMS.init({ config });
  }, []);

  // The CMS will mount itself in the page's body,
  // so we don't need to render anything here.
  return <div />;
};

export default Admin;