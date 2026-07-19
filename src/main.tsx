import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminReadResilience } from './adminReadResilience';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installHistoryContentEnhancements } from './historyContentEnhancements';
import { installMemorySyncEnhancements } from './memorySyncEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installMobileHeroRefinements } from './mobileHeroRefinements';
import { installPhotoUploadModalEnhancement } from './photoUploadModalEnhancement';
import { installTimelineSequentialActivation } from './timelineSequentialActivation';
import { installEventProgramEnhancements } from './eventProgramEnhancements';
import { installAdminEventAttractionImages } from './adminEventAttractionImages';
import { installCuriositiesSummaryEnhancements } from './curiositiesSummaryEnhancements';
import './styles.css';
import './mobile.css';
import './mobile-a11y.css';
import './mobileHeroRefinements.css';
import './eventPageLayout.css';
import './eventProgramEnhancements.css';

installAdminReadResilience();
installNeutralCmsDefaults();
installMobileEnhancements();
installMobileHeroRefinements();
installAdminLayoutEnhancements();
installMemorySyncEnhancements();
installExAlumniEnhancements();
installHeaderMenuEnhancements();
installHistoryContentEnhancements();
installPhotoUploadModalEnhancement();
installTimelineSequentialActivation();
installEventProgramEnhancements();
installAdminEventAttractionImages();
installCuriositiesSummaryEnhancements();

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