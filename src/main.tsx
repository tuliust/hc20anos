import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { BuyerOrdersPage } from './app/BuyerOrdersPage';
import { GuestApprovalPage } from './app/GuestApprovalPage';
import { OperationsPage } from './app/OperationsPage';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { PublicTicketsCatalogMount } from './app/PublicTicketsCatalogMount';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminReadResilience } from './adminReadResilience';
import { installAlumniAreaEnhancements } from './alumniAreaEnhancements';
import { installCheckoutExtrasEnhancements } from './checkoutExtrasEnhancements';
import { installCheckoutSelectionEnhancements } from './checkoutSelectionEnhancements';
import { installClassmatesDirectoryNavigation } from './classmatesDirectoryNavigation';
import { installEditProfileEnhancements } from './editProfileEnhancements';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installGuestApprovalNavigation } from './guestApprovalNavigation';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installHistoryContentEnhancements } from './historyContentEnhancements';
import { installHomeMobileDomRefinements } from './homeMobileDomRefinements';
import { installMemorySyncEnhancements } from './memorySyncEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installMobileHeroRefinements } from './mobileHeroRefinements';
import { installMobileNavigationAndDirectoryEnhancements } from './mobileNavigationAndDirectoryEnhancements';
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
import './mobileNavigationAndDirectoryEnhancements.css';
import './checkoutExtrasEnhancements.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const buyerOrdersRoutes = new Set(['/meus-pedidos', '/meus-ingressos']);
const operationsRoutes = new Set(['/admin/operacao', '/admin/checkin']);
const guestApprovalRoutes = new Set(['/convidado', '/aprovacoes-convidados']);
const isBuyerOrdersRoute = buyerOrdersRoutes.has(normalizedPath);
const isOperationsRoute = operationsRoutes.has(normalizedPath);
const isGuestApprovalRoute = guestApprovalRoutes.has(normalizedPath);
const isStandaloneRoute = isBuyerOrdersRoute || isOperationsRoute || isGuestApprovalRoute;

if (!isStandaloneRoute) {
  installAdminReadResilience();
  installNeutralCmsDefaults();
  installMobileEnhancements();
  installMobileHeroRefinements();
  installMobileNavigationAndDirectoryEnhancements();
  installHomeMobileDomRefinements();
  installAdminLayoutEnhancements();
  installMemorySyncEnhancements();
  installAlumniAreaEnhancements();
  installCheckoutSelectionEnhancements();
  installCheckoutExtrasEnhancements();
  installClassmatesDirectoryNavigation();
  installEditProfileEnhancements();
  installExAlumniEnhancements();
  installGuestApprovalNavigation();
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
    {isBuyerOrdersRoute ? <BuyerOrdersPage /> : isOperationsRoute ? <OperationsPage /> : isGuestApprovalRoute ? <GuestApprovalPage /> : <>
      <App />
      <AdminCmsPanelsMount />
      <PublicCmsStrictGuard />
      <PublicTicketsCatalogMount />
    </>}
  </React.StrictMode>,
);