import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installTimelineSequentialActivation } from './timelineSequentialActivation';
import './styles.css';
import './mobile.css';
import './mobile-a11y.css';
import './eventPageLayout.css';

installNeutralCmsDefaults();
installMobileEnhancements();
installExAlumniEnhancements();
installTimelineSequentialActivation();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
    <AdminCmsPanelsMount />
    <PublicCmsStrictGuard />
  </React.StrictMode>
);
