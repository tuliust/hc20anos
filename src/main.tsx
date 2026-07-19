import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { BuyerOrdersPage } from './app/BuyerOrdersPage';
import { OperationsPage } from './app/OperationsPage';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { PublicTicketsCatalogMount } from './app/PublicTicketsCatalogMount';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminReadResilience } from './adminReadResilience';
import { installAlumniAreaEnhancements } from './alumniAreaEnhancements';
import { installCheckoutSelectionEnhancements } from './checkoutSelectionEnhancements';
import { installClassmatesDirectoryNavigation } from './classmatesDirectoryNavigation';
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
import { installCuriositiesPollMobileEnhancements } from './curiositiesPollMobileEnhancements';
import { installTicketsPageEnhancements } from './ticketsPageEnhancements';

import './styles.css';
import './mobile.css';
import './mobile-a11y.css';
import './mobileHeroRefinements.css';
import './eventPageLayout.css';
import './eventProgramEnhancements.css';
import './homeMobileRefinements.css';
import './editProfileEnhancements.css';
import './mobilePublicHistoryRefinements.css';
import './ticketsPageEnhancements.css';
import './curiositiesPollMobileEnhancements.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const buyerOrdersRoutes = new Set(['/meus-pedidos', '/meus-ingressos']);
const operationsRoutes = new Set(['/admin/operacao', '/admin/checkin']);
const isBuyerOrdersRoute = buyerOrdersRoutes.has(normalizedPath);
const isOperationsRoute = operationsRoutes.has(normalizedPath);
const isStandaloneRoute = isBuyerOrdersRoute || isOperationsRoute;

if (!isStandaloneRoute) {
  installAdminReadResilience();
  installNeutralCmsDefaults();
  installMobileEnhancements();
  installMobileHeroRefinements();
  installHomeMobileDomRefinements();
  installAdminLayoutEnhancements();
  installMemorySyncEnhancements();
  installAlumniAreaEnhancements();
  installCheckoutSelectionEnhancements();
  installClassmatesDirectoryNavigation();
  installEditProfileEnhancements();
  installExAlumniEnhancements();
  installHeaderMenuEnhancements();
  installHistoryContentEnhancements();
  installPhotoUploadModalEnhancement();
  installTimelineSequentialActivation();
  installEventProgramEnhancements();
  installAdminEventAttractionImages();
  installCuriositiesSummaryEnhancements();
  installCuriositiesPollMobileEnhancements();
  installTicketsPageEnhancements();
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found.');

createRoot(rootElement).render(
  <React.StrictMode>
    {isBuyerOrdersRoute ? <BuyerOrdersPage /> : isOperationsRoute ? <OperationsPage /> : <>
      <App />
      <AdminCmsPanelsMount />
      <PublicCmsStrictGuard />
      <PublicTicketsCatalogMount />
    </>}
  </React.StrictMode>,
);
