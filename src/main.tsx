import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { BuyerOrdersPage } from './app/BuyerOrdersPage';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminReadResilience } from './adminReadResilience';
import { installAlumniAreaEnhancements } from './alumniAreaEnhancements';
import { installEditProfileEnhancements } from './editProfileEnhancements';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installHistoryContentEnhancements } from './historyContentEnhancements';
import { installHomeMobileDomRefinements } from './homeMobileDomRefinements';
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
import './homeMobileRefinements.css';
import './editProfileEnhancements.css';

const buyerOrdersRoutes = new Set(['/meus-pedidos', '/meus-ingressos']);
const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const isBuyerOrdersRoute = buyerOrdersRoutes.has(normalizedPath);

if (!isBuyerOrdersRoute) {
  installAdminReadResilience();
  installNeutralCmsDefaults();
  installMobileEnhancements();
  installMobileHeroRefinements();
  installHomeMobileDomRefinements();
  installAdminLayoutEnhancements();
  installMemorySyncEnhancements();
  installAlumniAreaEnhancements();
  installEditProfileEnhancements();
  installExAlumniEnhancements();
  installHeaderMenuEnhancements();
  installHistoryContentEnhancements();
  installPhotoUploadModalEnhancement();
  installTimelineSequentialActivation();
  installEventProgramEnhancements();
  installAdminEventAttractionImages();
  installCuriositiesSummaryEnhancements();
}

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root not found.');
}

createRoot(rootElement).render(
  <React.StrictMode>
    {isBuyerOrdersRoute ? <BuyerOrdersPage /> : <>
      <App />
      <AdminCmsPanelsMount />
      <PublicCmsStrictGuard />
    </>}
  </React.StrictMode>
);
