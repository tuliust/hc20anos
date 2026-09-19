import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { AdminCmsPanelsMount } from './app/AdminCmsPanelsMount';
import { AdminOverviewDashboardMount } from './app/AdminOverviewDashboardMount';
import { AdminCommerceOrdersMount } from './app/AdminCommerceOrdersMount';
import { AdminTicketLotsMount } from './app/AdminTicketLotsMount';
import { AdminTicketProductCopyMount } from './app/AdminTicketProductCopyMount';
import { ContactResearchPage } from './app/ContactResearchPage';
import { HomeHeroUserStateMount } from './app/HomeHeroUserStateMount';
import { OperationsRouteGuard } from './app/OperationsRouteGuard';
import { PublicCmsStrictGuard } from './app/PublicCmsStrictGuard';
import { PublicTicketsCatalogMount } from './app/PublicTicketsCatalogMount';
import { installAdminLayoutEnhancements } from './adminLayoutEnhancements';
import { installAdminParticipantMaintenance } from './adminParticipantMaintenance';
import { installAdminReadResilience } from './adminReadResilience';
import { installAdminReportsEnhancements } from './adminReportsEnhancements';
import { installAdminTicketLotsRouteSync } from './adminTicketLotsRouteSync';
import { installAlumniAreaEnhancements } from './alumniAreaEnhancements';
import { installClaimProfileVisualEnhancements } from './claimProfileVisualEnhancements';
import { installClassmatesDirectoryNavigation } from './classmatesDirectoryNavigation';
import { installContentSyncEnhancements } from './contentSyncEnhancements';
import { installEditProfileAiButtonEnhancement } from './editProfileAiButtonEnhancement';
import { installEditProfileEnhancements } from './editProfileEnhancements';
import { installEditProfileQuestionnaireBioEnhancement } from './editProfileQuestionnaireBioEnhancement';
import { installEditProfileRequestedChangesEnhancement } from './editProfileRequestedChangesEnhancement';
import { installExAlumniEnhancements } from './exAlumniEnhancements';
import { installExternalAlumniIntegrationEnhancement } from './externalAlumniIntegrationEnhancement';
import { installExternalUserFlowEnhancements } from './externalUserFlowEnhancements';
import { installExternalUserProfileContextEnhancement } from './externalUserProfileContextEnhancement';
import { installFooterLogoEnhancements } from './footerLogoEnhancements';
import { installHeaderMenuEnhancements } from './headerMenuEnhancements';
import { installHistoryContentEnhancements } from './historyContentEnhancements';
import { installHistoryEmptyStateEnhancement } from './historyEmptyStateEnhancement';
import { installHistoryHeaderEnhancements } from './historyHeaderEnhancements';
import { installHistoryPersonFilterEnhancement } from './historyPersonFilterEnhancement';
import { installHistoryPhotoRefreshEnhancement } from './historyPhotoRefreshEnhancement';
import { installHomeLandingEnhancements } from './homeLandingEnhancements';
import { installHomeMemoryAvatarEnhancement } from './homeMemoryAvatarEnhancement';
import { installHomeMemoryFormattingEnhancement } from './homeMemoryFormattingEnhancement';
import { installHomeMobileDomRefinements } from './homeMobileDomRefinements';
import { installHomeProfileMetricsEnhancements } from './homeProfileMetricsEnhancements';
import { installHomeUiPolishEnhancements } from './homeUiPolishEnhancements';
import { installHomeTicketCardSpacingEnhancements } from './homeTicketCardSpacingEnhancements';
import { installMemorySyncEnhancements } from './memorySyncEnhancements';
import { installNeutralCmsDefaults } from './lib/neutralCmsDefaults';
import { installMobileEnhancements } from './mobileEnhancements';
import { installMobileHeroRefinements } from './mobileHeroRefinements';
import { installMobileNavigationAndDirectoryEnhancements } from './mobileNavigationAndDirectoryEnhancements';
import { installPasswordVisibilityEnhancement } from './passwordVisibilityEnhancement';
import { installPhotoUploadModalEnhancement } from './photoUploadModalEnhancement';
import { installPostEventClosedMessageEnhancements } from './postEventClosedMessageEnhancements';
import { installProfileAndMemoryUiFollowups } from './profileAndMemoryUiFollowups';
import { installProfileModalBioEnhancement } from './profileModalBioEnhancement';
import { installRequestedFollowupsHC050910 } from './requestedFollowupsHC050910';
import { installSiteAnalyticsTracker } from './siteAnalyticsTracker';
import { installTicketProductModelEnhancement } from './ticketProductModelEnhancement';
import { installTicketsCatalogLayoutEnhancements } from './ticketsCatalogLayoutEnhancements';
import { installTimelineSequentialActivation } from './timelineSequentialActivation';
import { installEventProgramEnhancements } from './eventProgramEnhancements';
import { installEventStage4Enhancements } from './eventStage4Enhancements';
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
import './eventStage4Enhancements.css';
import './requestedFollowupsHC050910.css';
import './homeMobileRefinements.css';
import './editProfileEnhancements.css';
import './editProfileQuestionnaireBioEnhancement.css';
import './mobilePublicHistoryRefinements.css';
import './ticketsPageEnhancements.css';
import './curiositiesPollMobileEnhancements.css';
import './mobileNavigationAndDirectoryEnhancements.css';
import './postEventPageRefinements.css';
import './profileModalBioEnhancement.css';
import './footerLogoEnhancements.css';

const normalizedPath = window.location.pathname.replace(/\/+$/, '') || '/';
const operationsRoutes = new Set(['/admin/operacao', '/admin/checkin']);
const contactResearchRoutes = new Set(['/buscar']);
const legacyGuestApprovalRoutes = new Set(['/convidado', '/aprovacoes-convidados']);
const isOperationsRoute = operationsRoutes.has(normalizedPath);
const isContactResearchRoute = contactResearchRoutes.has(normalizedPath);
const isStandaloneRoute = isOperationsRoute || isContactResearchRoute;

if (legacyGuestApprovalRoutes.has(normalizedPath)) {
  window.location.replace('/ingressos');
}

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
  installHomeMemoryFormattingEnhancement();
  installHomeMemoryAvatarEnhancement();
  installHomeProfileMetricsEnhancements();
  installAdminLayoutEnhancements();
  installAdminReportsEnhancements();
  installAdminParticipantMaintenance();
  installMemorySyncEnhancements();
  installAlumniAreaEnhancements();
  installClaimProfileVisualEnhancements();
  installExternalUserFlowEnhancements();
  installExternalUserProfileContextEnhancement();
  installExternalAlumniIntegrationEnhancement();
  installRequestedFollowupsHC050910();
  installPasswordVisibilityEnhancement();
  installClassmatesDirectoryNavigation();
  installEditProfileEnhancements();
  installEditProfileQuestionnaireBioEnhancement();
  installEditProfileAiButtonEnhancement();
  installEditProfileRequestedChangesEnhancement();
  installExAlumniEnhancements();
  installHomeUiPolishEnhancements();
  installContentSyncEnhancements();
  installProfileModalBioEnhancement();
  installProfileAndMemoryUiFollowups();
  installFooterLogoEnhancements();
  installHeaderMenuEnhancements();
  installHistoryContentEnhancements();
  installHistoryEmptyStateEnhancement();
  installHistoryHeaderEnhancements();
  installHistoryPersonFilterEnhancement();
  installHistoryPhotoRefreshEnhancement();
  installPhotoUploadModalEnhancement();
  installPostEventClosedMessageEnhancements();
  installTimelineSequentialActivation();
  installEventProgramEnhancements();
  installEventStage4Enhancements();
  installAdminEventAttractionImages();
  installCuriositiesSummaryEnhancements();
  installCuriositiesPollMobileEnhancements();
  installTicketsPageEnhancements();
  installTicketsCatalogLayoutEnhancements();
  installTicketProductModelEnhancement();
  installHomeTicketCardSpacingEnhancements();
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element #root not found.');

createRoot(rootElement).render(
  <React.StrictMode>
    {isContactResearchRoute ? <ContactResearchPage /> : isOperationsRoute ? <OperationsRouteGuard /> : <>
      <App />
      <AdminCmsPanelsMount />
      <AdminOverviewDashboardMount />
      <AdminCommerceOrdersMount />
      <AdminTicketLotsMount />
      <AdminTicketProductCopyMount />
      {normalizedPath === '/' && <HomeHeroUserStateMount />}
      <PublicCmsStrictGuard />
      <PublicTicketsCatalogMount />
    </>}
  </React.StrictMode>,
);
