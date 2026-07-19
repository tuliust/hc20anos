import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installTimelineSequentialActivation } from './timelineSequentialActivation';
import { installEventProgramEnhancements } from './eventProgramEnhancements';
import { installAdminEventAttractionImages } from './adminEventAttractionImages';
import './styles.css';
import './mobile.css';
import './mobile-a11y.css';
import './eventPageLayout.css';
import './eventProgramEnhancements.css';

installNeutralCmsDefaults();
installMobileEnhancements();
installExAlumniEnhancements();
installHeaderMenuEnhancements();
installTimelineSequentialActivation();
installEventProgramEnhancements();
installAdminEventAttractionImages();

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