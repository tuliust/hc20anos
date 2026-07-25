import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { AdminOverviewDashboardMount } from './app/AdminOverviewDashboardMount';
import { AdminTicketLotsMount } from './app/AdminTicketLotsMount';
import { AdminTicketProductCopyMount } from './app/AdminTicketProductCopyMount';
import { BuyerOrdersPage } from './app/BuyerOrdersPage';
import { GuestApprovalPage } from './app/GuestApprovalPage';
import { HomeHeroUserStateMount } from './app/HomeHeroUserStateMount';
import { OperationsPage } from './app/OperationsPage';
import { OperationsReportingPanel } from './app/OperationsReportingPanel';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { PublicTicketsCatalogMount } from './app/PublicTicketsCatalogMount';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminOrdersRouteRemoval } from './adminOrdersRouteRemoval';
import { installAdminParticipantMaintenance } from './adminParticipantMaintenance';
import { installAdminReadResilience } from './adminReadResilience';
import { installAdminReportsEnhancements } from './adminReportsEnhancements';
import { installAdminTicketLotsRouteSync } from './adminTicketLotsRouteSync';
import { installAlumniAreaEnhancements } from './alumniAreaEnhancements';
import { installClaimProfileVisualEnhancements } from './claimProfileVisualEnhancements';
import { installClassmatesDirectoryNavigation } from './classmatesDirectoryNavigation';
import { installEditProfileEnhancements } from './editProfileEnhancements';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installFooterLogoEnhancements } from './footerLogoEnhancements';
import { installGuestApprovalNavigation } from './guestApprovalNavigation';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installHistoryContentEnhancements } from './historyContentEnhancements';
import { installHistoryHeaderEnhancements } from './historyHeaderEnhancements';
import { installHistoryPersonFilterEnhancement } from './historyPersonFilterEnhancement';
import { installHistoryPhotoRefreshEnhancement } from './historyPhotoRefreshEnhancement';
import { installHomeLandingEnhancements } from './homeLandingEnhancements';
import { installHomeMobileDomRefinements } from './homeMobileDomRefinements';
import { installHomeProfileMetricsEnhancements } from './homeProfileMetricsEnhancements';
import { installMemorySyncEnhancements } from './memorySyncEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installMobileHeroRefinements } from './mobileHeroRefinements';
import { installMobileNavigationAndDirectoryEnhancements } from './mobileNavigationAndDirectoryEnhancements';
import { installPhotoUploadModalEnhancement } from './photoUploadModalEnhancement';
import { installPostEventClosedMessageEnhancements } from './postEventClosedMessageEnhancements';
import { installSiteAnalyticsTracker } from './siteAnalyticsTracker';
import { installTicketsCatalogLayoutEnhancements } from './ticketsCatalogLayoutEnhancements';
import { installTimelineSequentialActivation } from './timelineSequentialActivation';
import { installEventProgramEnhancements } from './eventProgramEnhancements';
import { installAdminEventAttractionImages } from './adminEventAttractionImages';
import { installCuriositiesSummaryEnhancements } from './curiositiesSummaryEnhancements';
import { installCuriositiesPollMobileEnhancements } from './curiositiesPollMobileEnhancements';
import { installTicketsPageEnhancements } from './ticketsPageEnhancements';

import './styles.css';
import './homeEventInfoDark.css';
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
import './postEventPageRefinements.css';
import './footerLogoEnhancements.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const buyerOrdersRoutes = new Set(['/meus-pedidos', '/meus-ingressos']);
const operationsRoutes = new Set(['/admin/operacao', '/admin/checkin']);
const guestApprovalRoutes = new Set(['/convidado', '/aprovacoes-convidados']);
const isBuyerOrdersRoute = buyerOrdersRoutes.has(normalizedPath);
const isOperationsRoute = operationsRoutes.has(normalizedPath);
const isGuestApprovalRoute = guestApprovalRoutes.has(normalizedPath);
const isStandaloneRoute = isBuyerOrdersRoute || isOperationsRoute || isGuestApprovalRoute;

installSiteAnalyticsTracker();

if (!isStandaloneRoute) {
  installAdminReadResilience();
  installAdminTicketLotsRouteSync();
  installNeutralCmsDefaults();
  installMobileEnhancements();
  installMobileHeroRefinements();
  installMobileNavigationAndDirectoryEnhancements();
  installHomeMobileDomRefinements();
  installHomeLandingEnhancements();
  installHomeProfileMetricsEnhancements();
  installAdminLayoutEnhancements();
  installAdminReportsEnhancements();
  installAdminOrdersRouteRemoval();
  installAdminParticipantMaintenance();
  installMemorySyncEnhancements();
  installAlumniAreaEnhancements();
  installClaimProfileVisualEnhancements();
  installClassmatesDirectoryNavigation();
  installEditProfileEnhancements();
  installExAlumniEnhancements();
  installFooterLogoEnhancements();
  installGuestApprovalNavigation();
  installHeaderMenuEnhancements();
  installHistoryContentEnhancements();
  installHistoryHeaderEnhancements();
  installHistoryPersonFilterEnhancement();
  installHistoryPhotoRefreshEnhancement();
  installPhotoUploadModalEnhancement();
  installPostEventClosedMessageEnhancements();
  installTimelineSequentialActivation();
  installEventProgramEnhancements();
  installAdminEventAttractionImages();
  installCuriositiesSummaryEnhancements();
  installCuriositiesPollMobileEnhancements();
  installTicketsPageEnhancements();
  installTicketsCatalogLayoutEnhancements();
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found.');

createRoot(rootElement).render(
  <React.StrictMode>
    {isBuyerOrdersRoute ? <BuyerOrdersPage /> : isOperationsRoute ? <><OperationsPage /><OperationsReportingPanel /></> : isGuestApprovalRoute ? <GuestApprovalPage /> : <>
      <App />
      <AdminCmsPanelsMount />
      <AdminOverviewDashboardMount />
      <AdminTicketLotsMount />
      <AdminTicketProductCopyMount />
      <HomeHeroUserStateMount />
      <PublicCmsStrictGuard />
      <PublicTicketsCatalogMount />
    </>}
  </React.StrictMode>,
);
