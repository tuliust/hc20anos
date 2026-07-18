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

export function CheckinPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [searchMode, setSearchMode] = useState<"qr"|"name"|"email"|"phone">("qr");
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithDetails | null>(null);
  const [checkinTime, setCheckinTime] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setCheckedIn(false);
    setSelectedTicket(null);
    try {
      const ticket = await findTicketForCheckin(query, searchMode);
      if (!ticket) {
        setResult("invalid");
        return;
      }
      setSelectedTicket(ticket);
      if (ticket.checked_in) {
        setResult("used");
        setCheckinTime(formatDateTimeBR(ticket.checked_in_at));
        return;
      }
      const paymentStatus = ticketPaymentStatus(ticket);
      if (paymentStatus === "approved") setResult("valid");
      else if (paymentStatus === "pending" || paymentStatus === "in_process") setResult("pending");
      else setResult(paymentStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar ingresso.");
    } finally {
      setLoading(false);
    }
  }

  async function registerEntry() {
    if (!selectedTicket || result !== "valid") return;
    setBusy(true);
    setError("");
    try {
      const updated = await markTicketCheckedIn(selectedTicket.id, auth.userId);
      setSelectedTicket(updated);
      setCheckinTime(formatDateTimeBR(updated.checked_in_at));
      setCheckedIn(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar entrada.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setResult(null);
    setQuery("");
    setCheckedIn(false);
    setSelectedTicket(null);
    setCheckinTime("");
    setError("");
  }

  const modes = [
    { id:"qr" as const,    label:"QR / Código",  placeholder:"Digite ou leia o codigo do ingresso" },
    { id:"name" as const,  label:"Nome",          placeholder:"Nome do participante"  },
    { id:"email" as const, label:"E-mail",        placeholder:"email@exemplo.com"     },
    { id:"phone" as const, label:"Telefone",      placeholder:"(84) 9 9999-0000"      },
  ];
  const paymentStatus = ticketPaymentStatus(selectedTicket);
  const checkinName = selectedTicket?.attendee_name ?? "";

  return (
    <div className="min-h-screen bg-[#080f08]">
      <div className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("admin")} className="text-[#7a9a7a] hover:text-[#f0ebe0]"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Check-in</p>
            <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">Validação real por tabela tickets</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#0d2e1a] border border-[#2d6a4f]/40 px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
          <span className="text-[#74c69d] text-xs font-mono">Supabase ativo</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 mb-6 text-center">
          <div className="w-44 h-44 bg-[#1a2e1a] border-2 border-dashed border-[#2d6a4f]/40 flex flex-col items-center justify-center mx-auto mb-4">
            <Scan size={48} className="text-[#2d6a4f] mb-2" />
            <p className="text-[#7a9a7a] text-xs font-mono">Leitura por câmera</p>
            <p className="text-[#3a5a3a] text-[10px] font-mono">use a busca manual</p>
          </div>
          <p className="text-[#7a9a7a] text-sm">Digite o código textual do ingresso ou busque por nome, e-mail ou telefone.</p>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-4">
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Busca manual</p>
          <div className="flex gap-1 bg-[#0a120a] p-1">
            {modes.map(m => (
              <button key={m.id} onClick={() => { setSearchMode(m.id); setQuery(""); setResult(null); setSelectedTicket(null); }}
                className={`flex-1 py-2 text-[9px] font-mono uppercase tracking-wider transition-colors ${searchMode === m.id ? "bg-[#2d6a4f] text-[#f0ebe0]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
            <input
              placeholder={modes.find(m => m.id === searchMode)?.placeholder}
              value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && doSearch()}
              className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
          </div>
          {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
          <Btn full onClick={doSearch} disabled={loading}>{loading ? <><RefreshCw size={16} className="animate-spin" />Buscando...</> : <>Verificar ingresso</>}</Btn>
        </div>

        {result === "valid" && checkedIn && selectedTicket && (
          <div className="mt-6 bg-[#0d2e1a] border-2 border-[#2d6a4f] p-10 text-center">
            <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-[#f0ebe0]" />
            </div>
            <DisplayTitle className="text-3xl mb-2">Entrada registrada!</DisplayTitle>
            <p className="text-[#74c69d] font-semibold text-lg mb-1">{selectedTicket.attendee_name}</p>
            <p className="text-[#7a9a7a] font-mono text-xs mb-1">Check-in realizado em {checkinTime}</p>
            <p className="text-[#3a5a3a] font-mono text-[10px] mb-6">Registrado por: {auth.name}</p>
            <Btn full onClick={reset}>Nova verificação</Btn>
          </div>
        )}

        {result && !checkedIn && (
          <div className={`mt-6 border p-8 text-center ${
            result === "valid"     ? "bg-[#0d2e1a] border-[#2d6a4f]"        :
            result === "used"      ? "bg-[#2e2a0a] border-[#c9a84c]/60"     :
            result === "pending" || result === "in_process" ? "bg-[#1a1a0a] border-[#c9a84c]/40" :
            result === "invalid"   ? "bg-[#2e0a0a] border-[#c0392b]/60"     :
                                     "bg-[#2e0a0a] border-[#c0392b]/60"
          }`}>
            {result === "valid" && selectedTicket && (
              <>
                <CheckCircle2 size={48} className="text-[#2d6a4f] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-1">Ingresso válido</DisplayTitle>
                <p className="text-[#74c69d] font-semibold text-lg mb-1">{selectedTicket.attendee_name}</p>
                <p className="text-[#7a9a7a] font-mono text-xs mb-4">{ticketTypeName(selectedTicket)} · {selectedTicket.qr_code}</p>
                <Btn full className="mb-3" onClick={registerEntry} disabled={busy}>{busy ? <><RefreshCw size={16} className="animate-spin" />Registrando...</> : <>Registrar entrada</>}</Btn>
              </>
            )}
            {result === "used" && selectedTicket && (
              <>
                <AlertTriangle size={48} className="text-[#c9a84c] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Já utilizado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm mb-2">{checkinName} já registrou entrada em {formatDateTimeBR(selectedTicket.checked_in_at)}.</p>
                <p className="text-[#7a9a7a] text-xs font-mono">Verifique duplicidade antes de qualquer liberação manual.</p>
              </>
            )}
            {(result === "pending" || result === "in_process") && (
              <>
                <Clock size={48} className="text-[#c9a84c] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Pagamento pendente</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Status atual: {paymentStatus}. Não autorizar entrada sem aprovação.</p>
              </>
            )}
            {!["valid","used","pending","in_process","invalid"].includes(result) && (
              <>
                <XCircle size={48} className="text-[#c0392b] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Entrada não autorizada</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Status de pagamento: <strong className="text-[#f0ebe0]">{paymentStatus}</strong>.</p>
              </>
            )}
            {result === "invalid" && (
              <>
                <AlertCircle size={48} className="text-[#c0392b] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Não encontrado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Nenhum ingresso encontrado para “{query}”.</p>
              </>
            )}
            <button onClick={reset} className="mt-4 text-[#7a9a7a] text-xs font-mono uppercase tracking-wider hover:text-[#f0ebe0] transition-colors block mx-auto">
              Nova verificação
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TERMS PAGE ───────────────────────────────────────────────────────────────


