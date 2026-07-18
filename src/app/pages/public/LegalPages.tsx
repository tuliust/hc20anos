import { useState, useEffect, Fragment, useMemo, useRef, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEV_MODE, supabase } from "../../../lib/supabase";
import {
  getPeople, getTicketTypes, getOrdersByStatus, getCurrentAdminUser, writeAudit, MOCK_PEOPLE,
  getTicketTypesAdmin, updateTicketTypeStatus, updateTicketTypeFull, createTicketType,
  getEventSettings, updateEventSettings,
  getReports, exportToCsv, exportPeopleCSV, exportOrdersCSV, exportTicketsCSV,
  getAdminUsers, addAdminUser, updateAdminRole, removeAdminUser,
  getAuditLogs, getApprovedPhotos, getPhotosForModeration, moderatePhoto, uploadPhoto,
  getTagsForModeration, moderateTag,
  getPendingClaims, moderateClaim,
  getPhotoRemovalRequests, reviewPhotoRemovalRequest, createPhotoRemovalRequest,
  getProfileClaimDisputes, reviewProfileClaimDispute, createProfileClaimDispute,
  createFullProfileClaim,
  likePhoto, unlikePhoto, getPhotoStats, getMyPhotoLikes,
  createPhotoComment, getApprovedPhotoComments,
  getPhotoCommentsForModeration, moderatePhotoComment,
  getApprovedMemories, createMemory, getMemoriesForModeration, moderateMemory,
  toggleFeaturedPhoto, toggleFeaturedMemory,
  getPolls, getPollResults, getMyPollVotes, votePoll, createPoll, updatePoll, closePoll, archivePoll,
  getPublicLocationStats, getAlumniDirectoryStatuses, getMyTickets, getMyProfile, saveMyPublicProfile, findTicketForCheckin, markTicketCheckedIn,
  getMyUploadedPhotos, getMyTaggedPhotos, getMyMemories, getClassmates,
  getPublicProfileCardByPersonId, getCuriosityProfileStats, getSchoolQuestionnaireOptionStats, saveSchoolQuestionnaireAnswers, importPeopleAdmin,
  getAdminPersonDetails, updateAdminPersonAndProfile, uploadAdminPersonAvatar, completeProfileRegistration, type AdminImportPersonInput, type AdminPersonProfileDraft,
  createCheckoutOrder, createPaymentPreference, getCheckoutOrder,
  getEventArchiveSettings, updateEventArchiveSettings, uploadProfileAvatar, uploadHeaderLogo, uploadFavicon, uploadCmsContentImage, getHomePageContent, updateHomePageContent, getAttendanceIntentPersonIds, HOME_PAGE_CONTENT_DEFAULTS, type HomePageContent,
  getContentModerationSettings, updateContentModerationSettings, type ContentModerationSettings,
  getEventPageContent, updateEventPageContent, EVENT_PAGE_CONTENT_DEFAULTS, type EventPageContent,
} from "../../../lib/services";
import type {
  DbPerson, DbTicketType, DbEvent, DbAdminUser, DbAuditLog, DbPhoto, DbPhotoTag, DbOrder,
  DbProfileClaim, DbPhotoRemovalRequest, DbProfileClaimDispute, AdminRole, TicketStatus,
  DbPhotoComment, DbMemory, PhotoStats, ModerationStatus,
  DbPoll, DbPollOption, DbPollVote, LocationStat, PublicLocationRow, PublicProfileCardRow, AlumniDirectoryStatusRow, CuriosityProfileStatsRow, SchoolQuestionnaireOptionStatRow, PollStatus, TicketWithDetails, DbProfile, PaymentStatus, ProfileStatus, Gender,
  DbEventArchiveSettings, RelationshipStatus, EventPageGalleryItem, EventPageInfoItem, EventPageScheduleItem,
} from "../../../lib/database.types";
import { CmsAssetsPanel } from "../../CmsAdminPanels";
import { SecureCheckoutPage } from "../../SecureCheckoutPage";
import { HomeFaqSectionLoader } from "../../home/HomeFaqSectionLoader";
import { AdminFaqPanel, type FaqSectionSettings } from "../../admin/faq/AdminFaqPanel";
import { formatLotLabel, selectPublicTicketCards } from "../../../lib/publicTicketCatalog";
import mundoVerdeUrl from "../../../imports/maps/mundo-verde.png";
import mundoInvertidoUrl from "../../../imports/maps/mundo-invertido.png";
import brasilVerdeUrl from "../../../imports/maps/brasil-verde.png";
import brasilInvertidoUrl from "../../../imports/maps/brasil-invertido.png";
import rnVerdeUrl from "../../../imports/maps/rn-verde.png";
import rnInvertidoUrl from "../../../imports/maps/rn-invertido.png";
import {
  Menu, X, Search, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, Users, ArrowRight, ArrowLeft,
  Upload, Eye, EyeOff, QrCode, Check,
  ChevronDown, ChevronLeft, ChevronRight, Instagram, Linkedin,
  Phone, Mail, User, BarChart3, Ticket, Shield, GraduationCap,
  RefreshCw, CreditCard, Edit3, Download,
  Lock, Camera, Scan, LogOut,
  Hash, CheckCircle2, XCircle, AlertTriangle,
  Settings, Tag, FileText, Key, Save,
  UserCheck, UserX, ToggleRight, ToggleLeft,
  Info, Package, Pencil, Heart, MessageCircle, Star, Send, Venus, Baby
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

import { Page, AuthState, Alumni, TicketItem, Photo, Lot, TagModItem, FALLBACK_EVENT_DATE_TIME, DEFAULT_EVENT_ID, ALUMNI, TICKETS, PHOTOS, LOTS_INIT, TAG_MODS_INIT, FAQ_ITEMS, TIMELINE, TimelineItemContent, HomeSectionKey, HomeSectionContent, FooterLinkContent, ContentAdminTab, PAGE_OPTIONS, HOME_SECTION_DEFAULTS, FOOTER_LINK_DEFAULTS, ExtendedHomePageContent, HomeAboutOverviewCopy, HomeAlumniOverviewCopy, NostalgiaTimelineItemContent, HomeProfileStatConfig, HomeMapStatConfig, HomeMapLevel, HomePollFallbackCopy, EXTENDED_HOME_CONTENT_DEFAULTS, getExtendedHomeContent, isContentVisible, shouldShowHeroSubtitle, parseHomeJsonArray, parseHomeJsonObject, normalizePage, parsePositiveInteger, applyTextTemplate, getHomeSections, getFooterLinks, updateHomeSection, updateFooterLink, updateNostalgiaTimelineItem, sortNostalgiaTimelineItems, ADMIN_STATUS_LABELS, adminStatusLabel, updateEventGalleryItem, updateEventInfoItem, CONFIRM_QUESTIONS, SchoolProfileQuestion, SCHOOL_PROFILE_QUESTIONS, getEventDateTime, getTimeLeft, formatLongDateBR, formatTimeLabel, addMinutesToTime, formatCurrencyBR, getTicketAvailability, isTicketVisibleOnHome, getTicketVisualStatus, getTicketDescriptionItems, initials, formatDateBR, formatDateShortBR, relationshipStatusLabel, profileStatusLabel, childrenStatusLabel, normalizeExternalUrl, whatsappLink, normalizeLoose, getPenultimateSurname, parseCsvLine, normalizeParticipantHeader, rowsToParticipantImport, parseParticipantsCsv, inflateZipEntry, readXlsxEntries, parseXlsxTextCell, columnIndexFromCellRef, parseParticipantsXlsx, parseParticipantImportFile, formatDateTimeBR, eventDateTimeLabel, ticketTypeName, ticketPaymentStatus, formatWhatsappInput, firstAndLastName, displayNameForPerson, personToAlumni, Btn, StatusBadge, Field, FieldArea, OptionButton, SectionLabel, DisplayTitle, GoldRule, ToastType, ToastState, useToast, ToastNotification, EmptyState, LoadingState, ErrorState, PermissionState, ConfirmDialog, Modal, loadImageElement, createCroppedAvatarFile, createSquareLogoFile, AvatarCropUpload, PhotoUploadModal, Header, Footer, SaveToast, AlumniCard, PersonDetailModal } from "../../shared";

export function TermsPage({ navigate }: { navigate: (p: Page) => void }) {
  const sections = [
    { title: "1. Aceitação dos Termos",            body: "Ao utilizar o site do evento Turma 2006 — 20 anos depois, você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize o site." },
    { title: "2. Ingressos e Pagamentos",           body: "Os ingressos são pessoais e intransferíveis, vinculados ao CPF do comprador. O pagamento é processado pelo Mercado Pago. Não haverá reembolso após a confirmação, exceto em caso de cancelamento do evento pela organização." },
    { title: "3. Dados Pessoais",                   body: "A coleta e o uso de dados pessoais estão descritos na Política de Privacidade. Ao se cadastrar, você concorda com o tratamento dos seus dados para as finalidades descritas nessa política." },
    { title: "4. Fotos e Imagens",                  body: "Ao enviar uma foto, você declara ter o direito de compartilhá-la e autoriza a exibição no site e no evento. Fotos ofensivas, inadequadas ou que violem direitos de terceiros serão removidas. Qualquer pessoa pode solicitar a remoção da sua imagem." },
    { title: "5. Perfis de Ex-Alunos",              body: "Os perfis foram criados com base em informações históricas. Cada ex-aluno pode reivindicar seu perfil via processo de verificação. Informações falsas resultarão no cancelamento do acesso." },
    { title: "6. Conduta no Evento",                body: "Os participantes devem manter conduta respeitosa. A organização pode retirar qualquer participante com comportamento inadequado, sem direito a reembolso." },
    { title: "7. Check-in",                         body: "O check-in é realizado mediante apresentação do QR Code do ingresso. Cada QR Code só pode ser utilizado uma vez. A tentativa de uso duplicado será registrada." },
    { title: "8. Moderação de Conteúdo",            body: "Toda foto enviada passa por moderação. A organização pode remover qualquer conteúdo sem aviso prévio caso viole estes termos ou a política de privacidade." },
    { title: "9. Responsabilidade da Organização",  body: "A organização não se responsabiliza por objetos perdidos/roubados ou acidentes de percurso. O evento pode ser cancelado por força maior, com comunicação prévia e reembolso integral." },
    { title: "10. Contato",                         body: "Dúvidas: turma2006.hc@gmail.com ou (84) 99999-0206." },
  ];
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate("home")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <SectionLabel>Colégio Henrique Castriciano · Turma 2006</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-3">Termos de Uso</DisplayTitle>
        <p className="text-[#7a9a7a] font-mono text-sm mb-12">Última atualização: 1 de julho de 2026</p>
        <div className="flex flex-col gap-8">
          {sections.map(s => (
            <div key={s.title} className="border-l-2 border-[#2d6a4f]/40 pl-6">
              <p className="text-[#c9a84c] font-['Playfair_Display'] font-bold text-lg mb-3">{s.title}</p>
              <p className="text-[#8ab89a] text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Btn variant="outline" onClick={() => navigate("privacy")}><FileText size={16} />Política de Privacidade</Btn>
          <Btn variant="ghost" onClick={() => navigate("home")}>Voltar ao site</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── PRIVACY PAGE ─────────────────────────────────────────────────────────────

export function PrivacyPage({ navigate }: { navigate: (p: Page) => void }) {
  const sections = [
    { title: "1. Dados que coletamos",               body: "Nome completo, e-mail, telefone/WhatsApp, CPF (para compra de ingresso), cidade de residência, profissão, fotos enviadas voluntariamente, respostas Ã s perguntas de verificação de identidade, e dados de navegação como logs de acesso." },
    { title: "2. Como usamos seus dados",            body: "Processamento de ingressos e pagamentos, verificação de identidade para reivindicação de perfis, exibição no mural e na lista de confirmados (somente com sua autorização), envio de comunicações sobre o evento, e check-in no dia." },
    { title: "3. Dados de ex-alunos pré-cadastrados", body: "A lista foi constituída com base em registros históricos do Colégio HC. Os dados iniciais incluem apenas nome, apelido e turma/sala. Nenhum dado sensível foi incluído sem consentimento. Qualquer ex-aluno pode solicitar a remoção." },
    { title: "4. Uso de dados de pagamento",         body: "Os dados de pagamento são processados exclusivamente pelo Mercado Pago. Não armazenamos dados de cartão. O processamento segue a política de privacidade do Mercado Pago." },
    { title: "5. Fotos e marcações",                 body: "Fotos enviadas são armazenadas com segurança e exibidas apenas após moderação. Qualquer pessoa pode solicitar a remoção da sua imagem. As marcações em fotos também podem ser removidas mediante solicitação." },
    { title: "6. Controles de privacidade",          body: "Você pode escolher exibir ou ocultar sua cidade, profissão, redes sociais, e se deseja aparecer na lista de confirmados. Você pode bloquear marcações em fotos a qualquer momento nas configurações do perfil." },
    { title: "7. Solicitações de remoção",           body: "Você pode solicitar a remoção da sua imagem de qualquer foto ou marcação diretamente na plataforma, ou via e-mail para turma2006.hc@gmail.com. As solicitações serão processadas em até 48 horas." },
    { title: "8. Seus direitos (LGPD)",              body: "Nos termos da Lei 13.709/2018 (LGPD), você tem direito a: acessar seus dados, corrigir informações, solicitar exclusão, revogar consentimentos e receber cópia dos seus dados. Envie sua solicitação para turma2006.hc@gmail.com." },
    { title: "9. Contato",                           body: "Para exercer seus direitos ou tirar dúvidas: turma2006.hc@gmail.com ou (84) 99999-0206." },
  ];
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <button onClick={() => navigate("home")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <SectionLabel>Colégio Henrique Castriciano · Turma 2006</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-3">Política de Privacidade</DisplayTitle>
        <p className="text-[#7a9a7a] font-mono text-sm mb-12">Última atualização: 1 de julho de 2026 · Em conformidade com a LGPD</p>
        <div className="flex flex-col gap-8">
          {sections.map(s => (
            <div key={s.title} className="border-l-2 border-[#2d6a4f]/40 pl-6">
              <p className="text-[#c9a84c] font-['Playfair_Display'] font-bold text-lg mb-3">{s.title}</p>
              <p className="text-[#8ab89a] text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Btn variant="outline" onClick={() => navigate("terms")}><FileText size={16} />Termos de Uso</Btn>
          <Btn variant="ghost" onClick={() => navigate("home")}>Voltar ao site</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── APP ROOT ─────────────────────────────────────────────────────────────────


