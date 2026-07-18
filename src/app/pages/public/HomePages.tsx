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

function Hero({ navigate, content, event, auth }: { navigate: (p: Page) => void; content: HomePageContent; event: DbEvent | null; auth: AuthState }) {
  const extendedContent = getExtendedHomeContent(content);
  const showSubtitle = shouldShowHeroSubtitle(content.hero_subtitle);
  const [time, setTime] = useState(() => getTimeLeft(getEventDateTime(event)));
  const [attendanceState, setAttendanceState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    const update = () => setTime(getTimeLeft(getEventDateTime(event)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [event?.event_date, event?.event_time]);
  async function handleAttendanceIntent() {
    window.sessionStorage.setItem("hc-attendance-intent", "yes");
    if (!auth.loggedIn || !auth.userId) {
      navigate("claim-profile");
      return;
    }
    setAttendanceState("saving");
    try {
      await saveMyPublicProfile(auth.userId, { intends_to_attend: true });
      window.sessionStorage.removeItem("hc-attendance-intent");
      setAttendanceState("saved");
    } catch {
      setAttendanceState("error");
    }
  }

  return (
    <section data-home-section="hero" className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-10 md:pt-24 md:pb-8"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "#2d6a4f" }} />

      <div className="relative z-10 text-center px-4 max-w-5xl w-full mx-auto">
        <div data-home-hero-copy>
          <p className="text-[#c9a84c] tracking-[0.5em] text-[10px] md:text-xs font-mono font-bold uppercase mb-4 md:mb-5">{content.hero_eyebrow}</p>
          <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] uppercase leading-[0.86] tracking-tight"
            style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}>{content.hero_title}</h1>
          <p className="font-['Playfair_Display'] font-light italic text-[#c9a84c] leading-tight mt-2"
            style={{ fontSize: "clamp(1.15rem, 3.2vw, 2.2rem)" }}>{content.hero_tagline}</p>
        </div>
        <div className="w-20 h-px bg-[#c9a84c] mx-auto my-4 md:my-5 opacity-50" />
        {showSubtitle && <p className="text-[#8ab89a] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-4">{content.hero_subtitle}</p>}
        <p className={`text-[#f0ebe0] font-mono text-sm md:text-[15px] tracking-[0.24em] uppercase opacity-75 ${showSubtitle ? "mt-1" : "mt-0"} mb-8 md:mb-10`}>{content.hero_event_line}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 md:mb-12">
          <Btn size="lg" className="max-sm:px-6 max-sm:py-3" onClick={() => navigate(normalizePage(extendedContent.primary_cta_page, "tickets"))}>{content.primary_cta_label}</Btn>
          <Btn size="lg" variant="outline" className="max-sm:px-6 max-sm:py-3" disabled={attendanceState === "saving"} onClick={handleAttendanceIntent}>{attendanceState === "saving" ? "Salvando..." : attendanceState === "saved" ? "Presença marcada" : content.secondary_cta_label}</Btn>
        </div>
        {attendanceState === "saved" && <p className="-mt-5 mb-7 text-sm font-mono text-[#74c69d]">Sua intenção de participar foi registrada.</p>}
        {attendanceState === "error" && <p className="-mt-5 mb-7 text-sm font-mono text-[#e07a5f]">Não foi possível marcar sua presença. Tente novamente.</p>}
        <div data-home-countdown className="inline-flex">
          {[
            { v: time.days, l: extendedContent.countdown_days_label },
            { v: time.hours, l: extendedContent.countdown_hours_label },
            { v: time.minutes, l: extendedContent.countdown_minutes_label },
            { v: time.seconds, l: extendedContent.countdown_seconds_label },
          ].map(({ v, l }, i) => (
            <div data-home-countdown-item key={l} className="flex items-center">
              {i > 0 && <span data-home-countdown-separator className="text-[#2d6a4f] font-mono text-4xl md:text-4xl mx-2.5 md:mx-6 font-light">:</span>}
              <div className="text-center">
                <div data-home-countdown-value className="font-['JetBrains_Mono'] text-5xl md:text-6xl font-bold text-[#f0ebe0] tabular-nums">{String(v).padStart(2, "0")}</div>
                <div data-home-countdown-label className="text-[#c9a84c] text-[9px] tracking-[0.3em] uppercase font-mono mt-1">{l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <a data-home-hero-next href="#home-about" aria-label="Ir para a próxima seção" className="absolute bottom-4 md:bottom-5 left-1/2 flex h-11 w-11 -translate-x-1/2 animate-bounce items-center justify-center">
        <ChevronDown className="text-[#c9a84c] opacity-70" size={34} />
      </a>
    </section>
  );
}

function getRotatingSample<T>(items: T[], count: number, seed: number) {
  if (items.length <= count) return items;
  return items
    .map((item, index) => ({ item, rank: Math.sin(seed + index * 17) * 10000 }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map(entry => entry.item);
}

function getHomeAlumniDisplayName(person: DbPerson) {
  const name = person.display_name?.trim() || person.full_name?.trim() || "Ex-aluno(a)";
  const parts = name.split(/\s+/).filter(Boolean);
  return parts.length <= 2 ? name : `${parts[0]} ${parts[parts.length - 1]}`;
}

function AlumniAvatar({ person, size = "sm", dimension }: { person: DbPerson; size?: "xs" | "sm"; dimension?: number }) {
  const sizeClass = dimension ? "" : size === "xs" ? "h-9 w-9 text-[10px]" : "h-11 w-11 text-xs";
  const dimensionStyle = dimension ? { width: dimension, height: dimension, fontSize: Math.max(10, Math.round(dimension / 4)) } : undefined;
  const nameParts = getHomeAlumniDisplayName(person).split(/\s+/).filter(Boolean);
  const initials = `${nameParts[0]?.[0] ?? "E"}${nameParts[nameParts.length - 1]?.[0] ?? "A"}`.toUpperCase();

  return person.avatar_url ? (
    <img src={person.avatar_url} alt={getHomeAlumniDisplayName(person)} style={dimensionStyle} className={`${sizeClass} shrink-0 rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] object-cover transition-[width,height] duration-300 motion-reduce:transition-none`} />
  ) : (
    <div role="img" aria-label={getHomeAlumniDisplayName(person)} style={dimensionStyle} className={`${sizeClass} shrink-0 rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] text-[#c9a84c] flex items-center justify-center font-mono font-bold transition-[width,height] duration-300 motion-reduce:transition-none`}>
      {initials}
    </div>
  );
}

function HomeClassTabsContent({ alumni, copy }: { alumni: DbPerson[]; copy: HomeAlumniOverviewCopy }) {
  const classGroups = useMemo(() => Array.from(new Set(alumni.map(person => person.class_group).filter((group): group is string => Boolean(group)))).sort(), [alumni]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setActiveGroup(current => current && classGroups.includes(current) ? current : classGroups[0] ?? null);
    setPage(0);
  }, [classGroups]);

  const classPeople = useMemo(() => alumni
    .filter(person => person.class_group === activeGroup)
    .sort((a, b) => getHomeAlumniDisplayName(a).localeCompare(getHomeAlumniDisplayName(b), "pt-BR")), [activeGroup, alumni]);
  const totalPages = Math.max(1, Math.ceil(classPeople.length / 3));
  const visiblePeople = classPeople.slice(page * 3, page * 3 + 3);

  function changePage(direction: number) {
    setPage(current => (current + direction + totalPages) % totalPages);
  }

  return (
    <>
      <div data-home-class-tabs className="mb-4 flex flex-wrap justify-center gap-1.5">
        {classGroups.map(group => {
          const count = alumni.filter(person => person.class_group === group).length;
          const active = group === activeGroup;
          const label = applyTextTemplate(copy.class_tab_label_template, { group, count }) || `${group} (${count})`;
          return <button key={group} type="button" aria-pressed={active} onClick={() => { setActiveGroup(group); setPage(0); }} className={`border px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.12em] transition-colors ${active ? "border-[#c9a84c]/80 text-[#c9a84c] bg-[#0d1a0f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#c9a84c]/50 hover:text-[#c9a84c]"}`}>{label}</button>;
        })}
      </div>
      <div className="mt-auto flex items-center gap-3">
        <button type="button" onClick={() => changePage(-1)} className="h-24 w-10 shrink-0 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors flex items-center justify-center" aria-label="Ver pessoas anteriores"><ChevronLeft size={18} /></button>
        <div data-home-class-people className="grid min-w-0 flex-1 grid-cols-3 gap-2">
          {visiblePeople.map(person => <div key={person.id} className="flex min-h-24 min-w-0 flex-col items-center justify-center gap-2 border border-[#2d6a4f]/25 bg-[#0d1a0f] px-2 py-3 text-center"><AlumniAvatar person={person} size="xs" /><p className="line-clamp-2 text-xs font-semibold leading-tight text-[#f0ebe0]">{getHomeAlumniDisplayName(person)}</p></div>)}
          {!visiblePeople.length && copy.class_empty_label && <div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] px-4 py-5 text-sm leading-relaxed text-[#7a9a7a]">{copy.class_empty_label}</div>}
        </div>
        <button type="button" onClick={() => changePage(1)} className="h-24 w-10 shrink-0 border border-[#2d6a4f]/30 text-[#c9a84c] hover:border-[#c9a84c]/60 transition-colors flex items-center justify-center" aria-label="Ver próximas pessoas"><ChevronRight size={18} /></button>
      </div>
      {classPeople.length > 0 && copy.class_pagination_template && (
        <p className="mt-3 text-center text-[10px] font-mono uppercase tracking-[0.16em] text-[#7a9a7a]">
          {applyTextTemplate(copy.class_pagination_template, { start: page * 3 + 1, end: Math.min(page * 3 + 3, classPeople.length), total: classPeople.length })}
        </p>
      )}
    </>
  );
}

function HomeConfirmedPresenceGrid({ confirmed, emptyLabel, limit }: { confirmed: DbPerson[]; emptyLabel?: string; limit: number }) {
  const preview = confirmed.slice(0, limit);
  const count = preview.length;
  const avatarDimension = count ? Math.max(36, Math.round(144 / Math.sqrt(count))) : 0;
  const gridClass = count === 1
    ? "grid-cols-1 max-w-24"
    : count === 2
      ? "grid-cols-2 max-w-40"
      : count === 3
        ? "grid-cols-3 max-w-56"
        : count === 4
          ? "grid-cols-4 max-w-72"
          : count <= 6
            ? "grid-cols-3 sm:grid-cols-6 max-w-md"
            : count <= 10
              ? "grid-cols-5 max-w-xl"
              : "grid-cols-6 sm:grid-cols-10";
  return preview.length ? (
    <div data-home-confirmed-grid data-count={count} data-avatar-size={avatarDimension} className={`mx-auto mt-auto grid min-h-36 w-full place-content-center place-items-center gap-3 ${gridClass}`}>
      {preview.map(person => <div key={person.id} className="flex justify-center" title={getHomeAlumniDisplayName(person)}><AlumniAvatar person={person} dimension={avatarDimension} /></div>)}
    </div>
  ) : emptyLabel ? <p data-home-confirmed-grid data-count="0" className="mt-auto text-sm leading-relaxed text-[#7a9a7a]">{emptyLabel}</p> : null;
}

function HomeAlumniOverviewPanel({ people, attendanceIntentPersonIds, content, navigate }: { people: DbPerson[]; attendanceIntentPersonIds: Set<string>; content: HomePageContent; navigate: (page: Page) => void }) {
  const [seed, setSeed] = useState(1);
  const alumni = useMemo(() => people.filter(person => person.class_year === 2006 && person.is_visible), [people]);
  const confirmed = useMemo(() => alumni.filter(person => person.profile_status === "confirmed"), [alumni]);
  const intending = useMemo(() => alumni.filter(person => attendanceIntentPersonIds.has(person.id)), [alumni, attendanceIntentPersonIds]);
  const samplePeople = useMemo(() => getRotatingSample(alumni, 12, seed), [alumni, seed]);
  const confirmedPercent = alumni.length ? Math.round((confirmed.length / alumni.length) * 100) : 0;
  const extendedContent = getExtendedHomeContent(content);
  const copy = parseHomeJsonObject<HomeAlumniOverviewCopy>(extendedContent.home_alumni_overview_json, {});
  const confirmedPreviewLimit = parsePositiveInteger(extendedContent.confirmed_preview_limit, 30);

  useEffect(() => {
    if (alumni.length <= 1) return;
    const intervalId = window.setInterval(() => setSeed(current => current + 1), 3000);
    return () => window.clearInterval(intervalId);
  }, [alumni.length]);

  return (
    <section data-home-section="confirmed" data-home-alumni-overview className="home-section bg-[#0d1a0f]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><SectionLabel>{copy.eyebrow || content.confirmed_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{copy.title || content.confirmed_title}</DisplayTitle></div>{copy.description && <p className="max-w-md text-sm leading-relaxed text-[#7a9a7a] md:text-right">{copy.description}</p>}</div>
        <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
          <div className="flex min-h-[260px] flex-col border border-[#2d6a4f]/25 bg-[#141f14] p-6"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#c9a84c]">{copy.sample_label}</p><p className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[#f0ebe0]">{applyTextTemplate(copy.sample_title_template, { total: alumni.length })}</p></div><Users size={22} className="shrink-0 text-[#c9a84c]" /></div><div className="mt-auto grid grid-cols-4 gap-3 sm:grid-cols-6">{samplePeople.map(person => <div key={person.id} className="flex flex-col items-center gap-2 text-center"><AlumniAvatar person={person} /><p className="line-clamp-2 text-[10px] leading-tight text-[#7a9a7a]">{getHomeAlumniDisplayName(person)}</p></div>)}</div></div>
          <div className="flex min-h-[260px] flex-col border border-[#2d6a4f]/25 bg-[#141f14] p-6"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#c9a84c]">{copy.presence_label}</p><p className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[#f0ebe0]">{copy.presence_title}</p></div><UserCheck size={22} className="shrink-0 text-[#c9a84c]" /></div><div className="mb-5 grid grid-cols-2 gap-3"><div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4"><p className="font-['Playfair_Display'] text-4xl font-black leading-none text-[#f0ebe0]">{confirmed.length}</p><p className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#7a9a7a]">{copy.confirmed_label}</p></div><div className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-4"><p className="font-['Playfair_Display'] text-4xl font-black leading-none text-[#f0ebe0]">{intending.length}</p><p className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-[#7a9a7a]">{copy.intending_label}</p></div></div><div className="mt-auto"><div className="mb-2 flex items-center justify-between"><p className="text-xs text-[#7a9a7a]">{copy.progress_label}</p><p className="text-xs font-mono text-[#c9a84c]">{confirmedPercent}%</p></div><div className="h-2 overflow-hidden border border-[#2d6a4f]/25 bg-[#0d1a0f]"><div className="h-full bg-[#c9a84c]/80" style={{ width: `${confirmedPercent}%` }} /></div></div></div>
          <div className="flex min-h-[260px] flex-col border border-[#2d6a4f]/25 bg-[#141f14] p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#c9a84c]">{copy.classes_label}</p><p className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[#f0ebe0]">{copy.classes_title}</p></div><GraduationCap size={22} className="shrink-0 text-[#c9a84c]" /></div><HomeClassTabsContent alumni={alumni} copy={copy} /></div>
          <div className="flex min-h-[260px] flex-col border border-[#2d6a4f]/25 bg-[#141f14] p-6"><div className="mb-6 flex items-start justify-between gap-4"><div><p className="mb-2 text-[10px] font-mono uppercase tracking-[0.28em] text-[#c9a84c]">{copy.confirmed_grid_label}</p><p className="font-['Playfair_Display'] text-2xl font-bold leading-tight text-[#f0ebe0]">{copy.confirmed_grid_title}</p></div><UserCheck size={22} className="shrink-0 text-[#c9a84c]" /></div><HomeConfirmedPresenceGrid confirmed={confirmed} emptyLabel={copy.confirmed_empty_label} limit={confirmedPreviewLimit} /></div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-4 text-center">{copy.footer_note && <p className="text-sm font-mono text-[#7a9a7a]">{copy.footer_note}</p>}{(copy.view_all_label || extendedContent.confirmed_view_all_label) && <Btn variant="ghost" onClick={() => navigate("who-going")}>{copy.view_all_label || extendedContent.confirmed_view_all_label} <ArrowRight size={16} /></Btn>}</div>
      </div>
    </section>
  );
}

function CompactNostalgiaTimeline({ items }: { items: NostalgiaTimelineItemContent[] }) {
  const [openIndex, setOpenIndex] = useState(-1);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const manualSelectionUntilRef = useRef(0);
  const visibleItems = sortNostalgiaTimelineItems(items.filter(item => item.is_visible !== false && item.year && (item.title || item.label)));

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (performance.now() < manualSelectionUntilRef.current) return;
      const activeEntry = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top + a.boundingClientRect.height / 2 - window.innerHeight / 2) - Math.abs(b.boundingClientRect.top + b.boundingClientRect.height / 2 - window.innerHeight / 2))[0];
      if (!activeEntry) return;
      const index = Number((activeEntry.target as HTMLElement).dataset.timelineIndex);
      if (Number.isInteger(index)) setOpenIndex(index);
    }, { rootMargin: "-44% 0px -44% 0px", threshold: 0.01 });

    itemRefs.current.slice(0, visibleItems.length).forEach(node => node && observer.observe(node));
    return () => observer.disconnect();
  }, [visibleItems.length]);

  if (!visibleItems.length) return null;

  return (
    <div data-home-nostalgia-timeline className="mt-10 lg:pr-4">
      <div className="relative ml-7 border-l border-[#2d6a4f]/35 pl-10">
        {visibleItems.map((item, index) => {
          const open = openIndex === index;
          const title = item.title || item.label || "";
          const description = item.description || item.desc || "";
          return (
            <div
              key={`${item.year}-${title}`}
              ref={node => { itemRefs.current[index] = node; }}
              data-timeline-index={index}
              data-timeline-active={open ? "true" : "false"}
              className={`relative transition-[padding] duration-500 motion-reduce:transition-none ${index < visibleItems.length - 1 ? (open ? "pb-12" : "pb-7") : ""}`}
            >
              <div className={`absolute -left-[70px] top-0 flex items-center justify-center rounded-full border bg-[#0d1a0f] font-mono font-bold text-[#c9a84c] transition-all duration-500 motion-reduce:transition-none ${open ? "h-16 w-16 -translate-x-1 border-[#c9a84c] text-sm shadow-[0_0_28px_rgba(201,168,76,0.16)]" : "h-14 w-14 border-[#2d6a4f]/50 text-xs"}`}>
                {item.year}
              </div>
              <button
                type="button"
                onClick={() => {
                  manualSelectionUntilRef.current = performance.now() + 1000;
                  setOpenIndex(open ? -1 : index);
                }}
                className={`group min-h-14 w-full text-left transition-transform duration-500 motion-reduce:transition-none ${open ? "translate-x-2" : ""}`}
                aria-expanded={open}
              >
                <span className={`block font-['Playfair_Display'] font-bold leading-tight text-[#f0ebe0] transition-all duration-500 group-hover:text-[#c9a84c] motion-reduce:transition-none ${open ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>{title}</span>
              </button>
              <div aria-hidden={!open} className={`grid transition-[grid-template-rows,opacity,transform] duration-500 motion-reduce:transition-none ${open && (description || item.image_url) ? "visible grid-rows-[1fr] translate-x-2 opacity-100" : "invisible grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <div className={`mt-3 grid items-start gap-5 ${item.image_url ? "md:grid-cols-[minmax(0,1fr)_minmax(150px,0.72fr)]" : ""}`}>
                    {description && <p className="max-w-md text-base leading-relaxed text-[#8ab89a]">{description}</p>}
                    {item.image_url && <img src={item.image_url} alt={title} className="max-h-56 w-full object-contain object-center md:justify-self-end" />}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HomeAboutCard({ icon, label, children, className = "" }: { icon: React.ReactNode; label?: string; children: React.ReactNode; className?: string }) {
  if (!label) return null;
  return (
    <article className={`border border-[#2d6a4f]/25 bg-[#141f14] p-5 md:p-6 ${className}`}>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] text-[#c9a84c]">{icon}</div>
        <h3 className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#c9a84c]">{label}</h3>
      </div>
      {children}
    </article>
  );
}

function HomeMemoriesCarousel({ memories, people, emptyLabel, description }: { memories: DbMemory[]; people: DbPerson[]; emptyLabel?: string; description?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [memories.length]);
  useEffect(() => {
    if (memories.length <= 1) return;
    const intervalId = window.setInterval(() => setIndex(current => (current + 1) % memories.length), 3000);
    return () => window.clearInterval(intervalId);
  }, [memories.length]);
  if (!memories.length) return <p className="text-sm leading-relaxed text-[#7a9a7a]">{emptyLabel || description}</p>;

  const memory = memories[index];
  const author = memory.person_id ? people.find(person => person.id === memory.person_id) : undefined;
  const authorName = memory.is_anonymous ? "Anônimo" : author ? getHomeAlumniDisplayName(author) : memory.author_name || "Ex-aluno(a)";
  const classLabel = !memory.is_anonymous && author?.class_group ? `Turma ${getHomeClassGroup(author.class_group) ?? author.class_group}` : null;
  const go = (delta: number) => setIndex(current => (current + delta + memories.length) % memories.length);
  return (
    <div data-home-memory-carousel className="flex min-h-52 flex-col">
      <div className="grid flex-1 items-center gap-5 sm:grid-cols-[minmax(0,1fr)_8rem]">
        <div className="min-w-0">
          <blockquote className="font-['Playfair_Display'] text-xl leading-relaxed text-[#f0ebe0] md:text-2xl">“{memory.memory_text}”</blockquote>
          <div className="mt-5 font-semibold text-[#f0ebe0]">
            <p data-memory-author className="text-sm">{authorName}</p>
            {classLabel && <p data-memory-class className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[#c9a84c]">{classLabel}</p>}
          </div>
        </div>
        <div className="flex justify-start sm:justify-end">
          {author && !memory.is_anonymous ? <AlumniAvatar person={author} dimension={112} /> : <div className="flex h-28 w-28 items-center justify-center rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] text-[#c9a84c]"><User size={38} /></div>}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-[#2d6a4f]/20 pt-4">
        <p className="font-mono text-[10px] text-[#3a5a3a]">{index + 1} / {memories.length}</p>
        <div className="flex gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Memória anterior" className="flex h-9 w-9 items-center justify-center border border-[#2d6a4f]/35 text-[#c9a84c] transition-colors hover:border-[#c9a84c]"><ChevronLeft size={16} /></button>
          <button type="button" onClick={() => go(1)} aria-label="Próxima memória" className="flex h-9 w-9 items-center justify-center border border-[#2d6a4f]/35 text-[#c9a84c] transition-colors hover:border-[#c9a84c]"><ChevronRight size={16} /></button>
        </div>
      </div>
    </div>
  );
}

function normalizeHomeMetric(value: string | null | undefined) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("pt-BR");
}

function getHomeClassGroup(value: string | null) {
  const normalized = normalizeHomeMetric(value).toUpperCase();
  return normalized.match(/(?:^|\s)([ABCD])$/)?.[1] ?? null;
}

function percentOf(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

function formatConfiguredPercent(config: HomeProfileStatConfig, autoValue: number) {
  if (config.mode !== "fixed") return `${autoValue}%`;
  const value = config.value ?? config.fallback_value ?? 0;
  return typeof value === "number" ? `${value}%` : String(value).includes("%") ? String(value) : `${value}%`;
}

function HomeProfileMetrics({ configs, people, stats }: { configs: HomeProfileStatConfig[]; people: DbPerson[]; stats: CuriosityProfileStatsRow | null }) {
  const genderBase = people.filter(person => person.gender === "female" || person.gender === "male");
  const women = genderBase.filter(person => person.gender === "female").length;
  const married = stats?.relationship_status_counts.find(row => normalizeHomeMetric(row.label).startsWith("casad"))?.count ?? 0;
  const registered = stats?.total_registered ?? 0;
  const automatic: Record<HomeProfileStatConfig["key"], number> = {
    women: percentOf(women, genderBase.length),
    married: percentOf(married, registered),
    children: percentOf(stats?.total_with_children ?? 0, registered),
  };
  const orderedKeys: HomeProfileStatConfig["key"][] = ["women", "married", "children"];
  const rows = orderedKeys.map(key => configs.find(item => item.key === key) ?? { key });
  const icons: Record<HomeProfileStatConfig["key"], React.ReactNode> = {
    women: <Venus size={34} strokeWidth={1.7} />,
    married: <Heart size={34} strokeWidth={1.7} />,
    children: <Baby size={34} strokeWidth={1.7} />,
  };

  return (
    <div data-home-profile-metrics className="grid grid-cols-3 gap-3">
      {rows.map(row => (
        <div key={row.key} className="flex min-h-36 flex-col items-center justify-center border-l border-[#2d6a4f]/30 px-2 text-center first:border-l-0">
          <div className="mb-3 text-[#c9a84c]">{icons[row.key]}</div>
          <p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">{formatConfiguredPercent(row, automatic[row.key])}</p>
          <p className="mt-1 text-[10px] leading-tight text-[#7a9a7a]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

const HOME_MAP_LEVELS: HomeMapLevel[] = ["world", "brazil", "rn", "natal"];

const HOME_MAP_LEVEL_META: Record<HomeMapLevel, {
  label: string;
  metricKey: HomeMapStatConfig["key"];
  defaultMetricLabel: string;
  normalImage: string;
  invertedImage: string;
  nextLevel: HomeMapLevel | null;
  actionLabel: string;
  targetClass: string;
}> = {
  world: {
    label: "Mundo",
    metricKey: "foreign",
    defaultMetricLabel: "Exterior",
    normalImage: mundoVerdeUrl,
    invertedImage: mundoInvertidoUrl,
    nextLevel: "brazil",
    actionLabel: "Explorar Brasil",
    targetClass: "left-[49%] top-[66%]",
  },
  brazil: {
    label: "Brasil",
    metricKey: "other_state",
    defaultMetricLabel: "Outros estados",
    normalImage: brasilVerdeUrl,
    invertedImage: brasilInvertidoUrl,
    nextLevel: "rn",
    actionLabel: "Explorar Rio Grande do Norte",
    targetClass: "right-[3%] top-[28%]",
  },
  rn: {
    label: "RN",
    metricKey: "interior",
    defaultMetricLabel: "Interior do RN",
    normalImage: rnVerdeUrl,
    invertedImage: rnInvertidoUrl,
    nextLevel: "natal",
    actionLabel: "Explorar Natal",
    targetClass: "right-[1%] top-[39%]",
  },
  natal: {
    label: "Natal",
    metricKey: "natal",
    defaultMetricLabel: "Natal/RN",
    normalImage: rnVerdeUrl,
    invertedImage: rnInvertidoUrl,
    nextLevel: null,
    actionLabel: "Natal selecionada",
    targetClass: "right-[1%] top-[39%]",
  },
};

function getHomeMapLevelForPerson(person: PublicLocationRow): HomeMapLevel | null {
  const country = normalizeHomeMetric(person.current_country || "Brasil");
  const state = normalizeHomeMetric(person.current_state).toUpperCase();
  const city = normalizeHomeMetric(person.current_city);
  if (!city) return null;
  if (country && country !== "brasil" && country !== "brazil") return "world";
  if (!state) return null;
  if (state !== "RN") return "brazil";
  return city === "natal" ? "natal" : "rn";
}

function getPublicLocationDisplayName(person: PublicLocationRow) {
  return person.display_name?.trim() || person.full_name?.trim() || "Ex-aluno(a)";
}

function getPublicLocationLabel(person: PublicLocationRow) {
  const country = person.current_country?.trim() || "Brasil";
  const state = person.current_state?.trim().toUpperCase();
  const cityAndState = `${person.current_city}${state ? `/${state}` : ""}`;
  return normalizeHomeMetric(country) === "brasil" || normalizeHomeMetric(country) === "brazil"
    ? cityAndState
    : `${cityAndState} · ${country}`;
}

function HomeMapPersonAvatar({ person }: { person: PublicLocationRow }) {
  const name = getPublicLocationDisplayName(person);
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = `${parts[0]?.[0] ?? "E"}${parts[parts.length - 1]?.[0] ?? "A"}`.toUpperCase();
  return person.avatar_url ? (
    <img src={person.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] object-cover" />
  ) : (
    <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#2d6a4f]/40 bg-[#0d1a0f] font-mono text-[10px] font-bold text-[#c9a84c]">{initials}</span>
  );
}

export function HomeMapChart({ configs, locations }: { configs: HomeMapStatConfig[]; locations: LocationStat[] }) {
  const [level, setLevel] = useState<HomeMapLevel>("world");
  const peopleByLevel = useMemo(() => {
    const groups: Record<HomeMapLevel, PublicLocationRow[]> = { world: [], brazil: [], rn: [], natal: [] };
    const uniquePeople = new Map<string, PublicLocationRow>();
    locations.flatMap(location => location.people).forEach(person => uniquePeople.set(person.person_id, person));
    uniquePeople.forEach(person => {
      const personLevel = getHomeMapLevelForPerson(person);
      if (personLevel) groups[personLevel].push(person);
    });
    HOME_MAP_LEVELS.forEach(key => groups[key].sort((a, b) => getPublicLocationDisplayName(a).localeCompare(getPublicLocationDisplayName(b), "pt-BR")));
    return groups;
  }, [locations]);
  const meta = HOME_MAP_LEVEL_META[level];
  const selectedPeople = peopleByLevel[level];
  const total = HOME_MAP_LEVELS.reduce((sum, key) => sum + peopleByLevel[key].length, 0);
  const percent = percentOf(selectedPeople.length, total);
  const metricLabel = configs.find(config => config.key === meta.metricKey)?.label || meta.defaultMetricLabel;

  const selectNextLevel = () => {
    if (meta.nextLevel) setLevel(meta.nextLevel);
  };

  return (
    <div data-home-map-chart data-map-level={level}>
      <nav data-map-level-tabs aria-label="Níveis do mapa da turma" className="grid grid-cols-4 border border-[#2d6a4f]/25 bg-[#0d1a0f]">
        {HOME_MAP_LEVELS.map(key => {
          const item = HOME_MAP_LEVEL_META[key];
          const active = key === level;
          return (
            <button
              key={key}
              type="button"
              aria-current={active ? "step" : undefined}
              onClick={() => setLevel(key)}
              className={`border-l border-[#2d6a4f]/20 px-2 py-2.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap transition-colors first:border-l-0 ${active ? "bg-[#c9a84c] text-[#0d1a0f]" : "text-[#7a9a7a] hover:bg-[#1a2e1a] hover:text-[#f0ebe0]"}`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(220px,0.92fr)] lg:items-stretch">
        <div className="min-w-0">
          <button
            type="button"
            onClick={selectNextLevel}
            disabled={!meta.nextLevel}
            aria-label={meta.actionLabel}
            className="group relative block aspect-[4/3] w-full overflow-hidden border border-[#2d6a4f]/20 bg-[#0a120a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] disabled:cursor-default"
          >
            <span className={`absolute inset-0 transition-transform duration-500 motion-reduce:transition-none ${level === "natal" ? "scale-[1.75] origin-[92%_45%]" : "group-hover:scale-[1.025] group-focus-visible:scale-[1.025]"}`}>
              <img src={meta.normalImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain opacity-100 transition-opacity duration-300 group-hover:opacity-0 group-focus-visible:opacity-0 motion-reduce:transition-none" />
              <img src={meta.invertedImage} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" />
            </span>
            <span className={`absolute ${meta.targetClass} z-10 -translate-x-1/2 -translate-y-1/2`}>
              <span className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#f0ebe0]/70 bg-[#0d1a0f]/90 text-[#c9a84c] shadow-[0_0_22px_rgba(201,168,76,0.35)]">
                <MapPin size={15} />
                {level === "natal" && <span className="absolute inset-0 animate-ping rounded-full border border-[#c9a84c]/60 motion-reduce:animate-none" />}
              </span>
            </span>
            <span className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between gap-3 bg-[#0d1a0f]/90 px-3 py-2 text-left backdrop-blur-sm">
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#c9a84c]">{meta.actionLabel}</span>
              {meta.nextLevel && <ArrowRight size={14} className="shrink-0 text-[#c9a84c] transition-transform group-hover:translate-x-1 motion-reduce:transition-none" />}
            </span>
          </button>
        </div>

        <section data-home-map-result aria-live="polite" aria-label={`Pessoas em ${metricLabel}`} className="flex min-h-0 flex-col border border-[#2d6a4f]/20 bg-[#0d1a0f] p-4">
          <div className="flex items-start justify-between gap-4 border-b border-[#2d6a4f]/20 pb-3">
            <div>
              <p data-map-region className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[#c9a84c]">{metricLabel}</p>
              <p data-map-total className="mt-2 font-['Playfair_Display'] text-4xl font-black leading-none text-[#f0ebe0]">{selectedPeople.length}</p>
            </div>
            <span data-map-percent className="font-mono text-lg font-bold text-[#c9a84c]">{percent}%</span>
          </div>

          {selectedPeople.length > 0 ? (
            <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
              {selectedPeople.map(person => (
                <div key={person.person_id} className="flex items-center gap-3 border border-[#2d6a4f]/15 bg-[#141f14] p-2.5">
                  <HomeMapPersonAvatar person={person} />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#f0ebe0]">{getPublicLocationDisplayName(person)}</p>
                    <p className="mt-0.5 truncate font-mono text-[9px] text-[#7a9a7a]">{getPublicLocationLabel(person)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
              <MapPin size={24} className="mb-3 text-[#2d6a4f]" />
              <p className="text-xs leading-relaxed text-[#7a9a7a]">Ainda não há pessoas com localização pública nesta região.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function HomePollCard({ poll, results, votes, auth, fallback, busy, error, onVote }: {
  poll: (DbPoll & { poll_options?: DbPollOption[] }) | null;
  results: Record<string, number>;
  votes: DbPollVote[];
  auth: AuthState;
  fallback: HomePollFallbackCopy;
  busy: string | null;
  error: string;
  onVote: (poll: DbPoll & { poll_options?: DbPollOption[] }, optionId: string) => void;
}) {
  if (!poll) return <p className="text-sm leading-relaxed text-[#7a9a7a]">{fallback.empty_label}</p>;
  const options = [...(poll.poll_options ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const votedIds = new Set(votes.filter(vote => vote.poll_id === poll.id).map(vote => vote.option_id));
  const showResults = poll.status === "closed" || votedIds.size > 0;
  const total = Object.values(results).reduce((sum, count) => sum + Number(count), 0);
  return (
    <div data-home-poll>
      <p className="mb-4 font-['Playfair_Display'] text-xl font-bold leading-tight text-[#f0ebe0]">{poll.question}</p>
      <div className="flex flex-col gap-2">
        {options.map(option => {
          const count = results[option.id] ?? 0;
          const percent = percentOf(count, total);
          if (showResults) return (
            <div key={option.id} className={`border p-3 ${votedIds.has(option.id) ? "border-[#c9a84c]/70 bg-[#1a2e1a]" : "border-[#2d6a4f]/20 bg-[#0d1a0f]"}`}>
              <div className="mb-2 flex justify-between gap-3 text-xs"><span className="text-[#f0ebe0]">{option.option_text}</span><span className="font-mono text-[#c9a84c]">{percent}%</span></div>
              <div className="h-1.5 overflow-hidden bg-[#1a2e1a]"><div className="h-full bg-[#c9a84c]" style={{ width: `${percent}%` }} /></div>
            </div>
          );
          return (
            <button key={option.id} type="button" disabled={busy === option.id} onClick={() => onVote(poll, option.id)} className="border border-[#2d6a4f]/25 bg-[#0d1a0f] p-3 text-left text-sm text-[#f0ebe0] transition-colors hover:border-[#c9a84c]/60 disabled:opacity-60">{option.option_text}</button>
          );
        })}
      </div>
      {!auth.loggedIn && poll.status === "open" && <p className="mt-3 font-mono text-[10px] text-[#c9a84c]">{fallback.login_required_label}</p>}
      {error && <p role="alert" className="mt-3 text-xs text-[#e07a5f]">{error}</p>}
    </div>
  );
}

function AboutSection({
  content,
  navigate,
  people,
  memories,
  auth,
}: {
  content: HomePageContent;
  navigate: (p: Page) => void;
  people: DbPerson[];
  memories: DbMemory[];
  auth: AuthState;
}) {
  const extendedContent = getExtendedHomeContent(content);
  const aboutCopy = parseHomeJsonObject<HomeAboutOverviewCopy>(extendedContent.home_about_overview_json, {});
  const hasRequiredAboutCopy = Boolean(content.about_eyebrow && content.about_title && content.about_body_1 && content.about_body_2);
  const nostalgiaItems = parseHomeJsonArray<NostalgiaTimelineItemContent>(extendedContent.home_nostalgia_timeline_json, []);
  const profileConfigs = parseHomeJsonArray<HomeProfileStatConfig>(extendedContent.home_profile_stats_json, []);
  const mapConfigs = parseHomeJsonArray<HomeMapStatConfig>(extendedContent.home_map_stats_json, []);
  const pollFallback = parseHomeJsonObject<HomePollFallbackCopy>(extendedContent.home_poll_fallback_json, {});
  const visiblePeople = useMemo(() => people.filter(person => person.is_visible), [people]);
  const classCounts = useMemo(() => visiblePeople.reduce<Record<string, number>>((counts, person) => {
    const group = getHomeClassGroup(person.class_group);
    if (group) counts[group] = (counts[group] ?? 0) + 1;
    return counts;
  }, {}), [visiblePeople]);
  const [profileStats, setProfileStats] = useState<CuriosityProfileStatsRow | null>(null);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [poll, setPoll] = useState<(DbPoll & { poll_options?: DbPollOption[] }) | null>(null);
  const [pollResults, setPollResults] = useState<Record<string, number>>({});
  const [pollVotes, setPollVotes] = useState<DbPollVote[]>([]);
  const [pollBusy, setPollBusy] = useState<string | null>(null);
  const [pollError, setPollError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      getCuriosityProfileStats(DEFAULT_EVENT_ID).catch(() => null),
      getPublicLocationStats().catch(() => []),
      getPolls(DEFAULT_EVENT_ID).catch(() => []),
    ]).then(async ([nextProfileStats, nextLocations, polls]) => {
      const selectedPoll = polls.find(item => item.id === extendedContent.home_poll_id) ?? polls.find(item => item.status === "open") ?? null;
      const [nextResults, nextVotes] = selectedPoll ? await Promise.all([
        getPollResults(selectedPoll.id).catch(() => ({})),
        auth.loggedIn ? getMyPollVotes(auth.userId, [selectedPoll.id]).catch(() => []) : Promise.resolve([]),
      ]) : [{}, []];
      if (!active) return;
      setProfileStats(nextProfileStats);
      setLocations(nextLocations);
      setPoll(selectedPoll);
      setPollResults(nextResults);
      setPollVotes(nextVotes);
    });
    return () => { active = false; };
  }, [auth.loggedIn, auth.userId, extendedContent.home_poll_id]);

  async function submitHomePollVote(selectedPoll: DbPoll & { poll_options?: DbPollOption[] }, optionId: string) {
    if (!auth.loggedIn) { navigate("login"); return; }
    setPollBusy(optionId);
    setPollError("");
    try {
      await votePoll({ pollId: selectedPoll.id, optionId, userId: auth.userId, allowMultiple: selectedPoll.allow_multiple_votes });
      const [nextResults, nextVotes] = await Promise.all([getPollResults(selectedPoll.id), getMyPollVotes(auth.userId, [selectedPoll.id])]);
      setPollResults(nextResults);
      setPollVotes(nextVotes);
    } catch (error) {
      setPollError(error instanceof Error ? error.message : "Não foi possível registrar o voto.");
    } finally {
      setPollBusy(null);
    }
  }

  if (!hasRequiredAboutCopy) return null;

  return (
    <section id="home-about" data-home-section="about" className="home-section scroll-mt-16 bg-[#0d1a0f]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:items-start">
          <div>
            <SectionLabel>{content.about_eyebrow}</SectionLabel>
            <DisplayTitle className="text-4xl md:text-5xl mb-6">{content.about_title}</DisplayTitle>
            <GoldRule />
            <p className="text-[#8ab89a] text-base leading-relaxed mb-4">{content.about_body_1}</p>
            <p className="text-[#8ab89a] text-base leading-relaxed">{content.about_body_2}</p>
            <div className="mt-10">
              <div className="flex items-center gap-3 text-[#c9a84c]"><Clock size={18} /><p className="font-mono text-[10px] uppercase tracking-[0.28em]">{aboutCopy.timeline_label}</p></div>
              <CompactNostalgiaTimeline items={nostalgiaItems} />
            </div>
          </div>

          <div data-home-about-side className="flex flex-col gap-4">
            <div data-home-about-stats>
              <div className="flex items-end justify-between gap-4 border-b border-[#2d6a4f]/20 pb-5">
                <div><p className="font-['Playfair_Display'] text-5xl font-black leading-none text-[#c9a84c]">{visiblePeople.length}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">{aboutCopy.stats_total_label}</p></div>
                <Users size={24} className="text-[#2d6a4f]" />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3">
                {(["A", "B", "C", "D"] as const).map(group => <div key={group} data-class-group={group} className="bg-[#091109] p-3 text-center"><p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">{classCounts[group] ?? 0}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#7a9a7a]">Turma {group}</p></div>)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HomeAboutCard icon={<MessageCircle size={17} />} label={aboutCopy.memories_label} className="sm:col-span-2"><HomeMemoriesCarousel memories={memories} people={visiblePeople} emptyLabel={aboutCopy.memories_empty_title} description={aboutCopy.memories_description} /></HomeAboutCard>
              <HomeAboutCard icon={<Users size={17} />} label={aboutCopy.profile_label} className="sm:col-span-2"><HomeProfileMetrics configs={profileConfigs} people={visiblePeople} stats={profileStats} /></HomeAboutCard>
              <HomeAboutCard icon={<CheckCircle2 size={17} />} label={aboutCopy.polls_label} className="sm:col-span-2"><HomePollCard poll={poll} results={pollResults} votes={pollVotes} auth={auth} fallback={pollFallback} busy={pollBusy} error={pollError} onVote={submitHomePollVote} /></HomeAboutCard>
              <HomeAboutCard icon={<MapPin size={17} />} label={aboutCopy.map_label} className="sm:col-span-2"><HomeMapChart configs={mapConfigs} locations={locations} /></HomeAboutCard>
            </div>
          </div>
        </div>

        <div className="mt-10 md:mt-12 flex justify-center">
          {aboutCopy.view_all_label && (
            <Btn onClick={() => navigate("curiosities")}>
              {aboutCopy.view_all_label} <ArrowRight size={16} />
            </Btn>
          )}
        </div>
      </div>
    </section>
  );
}

function EventInfoSection({ content, event, navigate }: { content: HomePageContent; event: DbEvent | null; navigate: (p: Page) => void }) {
  const extendedContent = getExtendedHomeContent(content);
  const dateLabel = formatLongDateBR(event?.event_date);
  const timeLabel = formatTimeLabel(event?.event_time);
  const hasLoadedEventTime = Boolean(event?.event_time);
  const locationName = event?.location_name || "Espaço Cultural Ponta Negra";
  const locationAddress = event?.location_address || "Av. Eng. Roberto Freire — Ponta Negra, Natal/RN";

  const infoItems = [
    {
      icon: <Calendar size={24} />,
      title: extendedContent.info_date_label,
      info: dateLabel,
      sub: applyTextTemplate(extendedContent.info_doors_subtitle_template, { time: addMinutesToTime(event?.event_time, -30) }),
    },
    {
      icon: <Clock size={24} />,
      title: extendedContent.info_time_label,
      info: hasLoadedEventTime ? timeLabel : extendedContent.info_time_fallback_label,
      sub: applyTextTemplate(extendedContent.info_dinner_subtitle_template, { time: addMinutesToTime(event?.event_time, 60) }),
    },
    { icon: <MapPin size={24} />, title: extendedContent.info_location_label, info: locationName, sub: locationAddress },
  ];

  return (
    <section data-home-section="info" className="home-section bg-[#f0ebe0]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>{content.info_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-12">{content.info_title}</DisplayTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {infoItems.map(({ icon, title, info, sub }) => (
            <div key={title} className="bg-[#0d1a0f] p-8">
              <div className="text-[#c9a84c] mb-4">{icon}</div>
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-2">{title}</p>
              <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-2">{info}</p>
              <p className="text-[#7a9a7a] text-sm">{sub}</p>
            </div>
          ))}
        </div>
        {extendedContent.event_info_view_more_label && (
          <div className="mt-10 md:mt-12 flex justify-center">
            <Btn data-home-event-cta variant="ghost" onClick={() => navigate("event")}>{extendedContent.event_info_view_more_label} <ArrowRight size={16} /></Btn>
          </div>
        )}
      </div>
    </section>
  );
}


function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0 text-[#c9a84c]">{icon}</div>
      <div className="min-w-0">
        <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">
          {label}
        </p>
        <p className="break-words text-sm leading-relaxed text-[#f0ebe0]">
          {value}
        </p>
      </div>
    </div>
  );
}

function extractIframeSrc(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  const match = raw.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? raw;
}

export function EventPage({ navigate, event }: { navigate: (p: Page) => void; event: DbEvent | null }) {
  const [content, setContent] = useState<EventPageContent>(EVENT_PAGE_CONTENT_DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getEventPageContent(DEFAULT_EVENT_ID)
      .then(data => { if (active) setContent(data); })
      .catch(() => { if (active) setContent(EVENT_PAGE_CONTENT_DEFAULTS); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const gallery = parseHomeJsonArray<EventPageGalleryItem>(content.gallery_json, parseHomeJsonArray<EventPageGalleryItem>(EVENT_PAGE_CONTENT_DEFAULTS.gallery_json, []));
  const attractions = parseHomeJsonArray<EventPageInfoItem>(content.attractions_json, parseHomeJsonArray<EventPageInfoItem>(EVENT_PAGE_CONTENT_DEFAULTS.attractions_json, []));
  const schedule = parseHomeJsonArray<EventPageScheduleItem>(content.schedule_json, parseHomeJsonArray<EventPageScheduleItem>(EVENT_PAGE_CONTENT_DEFAULTS.schedule_json, []));
  const extraInfo = parseHomeJsonArray<EventPageInfoItem>(content.extra_info_json, parseHomeJsonArray<EventPageInfoItem>(EVENT_PAGE_CONTENT_DEFAULTS.extra_info_json, []));
  const heroImage = content.hero_image_url || gallery[0]?.image_url || null;
  const mapSrc = extractIframeSrc(content.map_embed_url);
  const locationName = event?.location_name || "Local do evento";
  const locationAddress = event?.location_address || "Endereço a confirmar";

  return (
    <div className="bg-[#0d1a0f] min-h-screen pt-20">
      <section className="relative min-h-[72vh] flex items-end overflow-hidden border-b border-[#2d6a4f]/20">
        {heroImage && (
          <img src={heroImage} alt={content.title} className="absolute inset-0 w-full h-full object-cover opacity-35" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1a0f] via-[#0d1a0f]/70 to-[#0d1a0f]/30" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20 md:py-28 w-full">
          <div className="max-w-4xl">
            <SectionLabel>{content.hero_eyebrow}</SectionLabel>
            <h1 className="font-['Playfair_Display'] text-[#f0ebe0] text-5xl md:text-7xl font-black leading-none mb-6">{content.title}</h1>
            <p className="text-[#c9a84c] text-xl md:text-2xl font-['Playfair_Display'] mb-6">{content.subtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 text-[#8ab89a] text-sm mb-8">
              <span className="inline-flex items-center gap-2"><Calendar size={16} />{formatLongDateBR(event?.event_date)}</span>
              <span className="inline-flex items-center gap-2"><Clock size={16} />{formatTimeLabel(event?.event_time)}</span>
              <span className="inline-flex items-center gap-2"><MapPin size={16} />{locationName}</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Btn onClick={() => navigate("tickets")}><Ticket size={16} />Comprar ingresso</Btn>
              <Btn variant="outline" onClick={() => navigate("who-going")}><Users size={16} />Ver confirmados</Btn>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_0.8fr] gap-10 items-start">
          <div>
            <SectionLabel>Informações gerais</SectionLabel>
            <DisplayTitle className="text-4xl md:text-5xl mb-6">Sobre o reencontro</DisplayTitle>
            <div className="flex flex-col gap-4 text-[#8ab89a] leading-relaxed">
              {content.description.split(/\n+/).filter(Boolean).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
            </div>
          </div>
          <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6 md:p-8">
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-5">Serviço</p>
            <div className="flex flex-col gap-5">
              <InfoRow icon={<Calendar size={18} />} label="Data" value={formatLongDateBR(event?.event_date)} />
              <InfoRow icon={<Clock size={18} />} label="Horário" value={formatTimeLabel(event?.event_time)} />
              <InfoRow icon={<MapPin size={18} />} label="Local" value={`${locationName}${locationAddress ? ` · ${locationAddress}` : ""}`} />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f0ebe0] text-[#0d1a0f] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-[0.8fr_1fr] gap-10 items-start">
          <div>
            <p className="text-[#2d6a4f] font-mono text-xs uppercase tracking-wider mb-4">Local</p>
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-black mb-5">Como chegar</h2>
            <p className="text-[#35513f] leading-relaxed mb-6">{content.venue_notes}</p>
            {content.map_link_url && <Btn variant="primary" onClick={() => window.open(normalizeExternalUrl(content.map_link_url) ?? content.map_link_url ?? "", "_blank", "noopener,noreferrer")}><MapPin size={16} />Abrir mapa</Btn>}
          </div>
          <div className="bg-[#0d1a0f] min-h-[320px] border border-[#2d6a4f]/20 overflow-hidden">
            {mapSrc ? (
              <iframe title="Mapa do evento" src={mapSrc} className="w-full h-[360px] border-0" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
            ) : (
              <div className="h-[360px] flex flex-col items-center justify-center gap-3 text-center p-8">
                <MapPin size={36} className="text-[#c9a84c]" />
                <p className="text-[#f0ebe0] font-semibold">{locationName}</p>
                <p className="text-[#7a9a7a] text-sm">{locationAddress}</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <SectionLabel>Programação</SectionLabel>
              <DisplayTitle className="text-4xl md:text-5xl">Horários e atrações</DisplayTitle>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
            <div className="flex flex-col gap-4">
              {schedule.map((item, index) => (
                <div key={`${item.time}-${index}`} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5 flex gap-4">
                  <div className="text-[#c9a84c] font-mono text-sm min-w-16">{item.time}</div>
                  <div>
                    <p className="text-[#f0ebe0] font-semibold mb-1">{item.title}</p>
                    {item.description && <p className="text-[#7a9a7a] text-sm leading-relaxed">{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {attractions.map((item, index) => (
                <div key={`${item.title}-${index}`} className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <Star size={22} className="text-[#c9a84c] mb-4" />
                  <p className="text-[#f0ebe0] font-semibold mb-2">{item.title}</p>
                  <p className="text-[#7a9a7a] text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0a120a] py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel>Estrutura</SectionLabel>
          <DisplayTitle className="text-4xl md:text-5xl mb-10">Bar, comidas, banheiros e segurança</DisplayTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6"><Ticket size={22} className="text-[#c9a84c] mb-4" /><p className="text-[#f0ebe0] font-semibold mb-2">Bar e comidas</p><p className="text-[#7a9a7a] text-sm leading-relaxed">{content.food_bar_text}</p></div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6"><Users size={22} className="text-[#c9a84c] mb-4" /><p className="text-[#f0ebe0] font-semibold mb-2">Banheiros</p><p className="text-[#7a9a7a] text-sm leading-relaxed">{content.bathrooms_text}</p></div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6"><Shield size={22} className="text-[#c9a84c] mb-4" /><p className="text-[#f0ebe0] font-semibold mb-2">Segurança</p><p className="text-[#7a9a7a] text-sm leading-relaxed">{content.security_text}</p></div>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <SectionLabel>Fotos</SectionLabel>
            <DisplayTitle className="text-4xl md:text-5xl mb-10">Prévia do evento</DisplayTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {gallery.slice(0, 6).map((item, index) => (
                <figure key={`${item.image_url}-${index}`} className="bg-[#141f14] border border-[#2d6a4f]/20 overflow-hidden">
                  <img src={item.image_url} alt={item.alt || item.caption || `Foto do evento ${index + 1}`} className="w-full aspect-[4/3] object-cover" loading="lazy" />
                  {item.caption && <figcaption className="p-4 text-[#7a9a7a] text-sm">{item.caption}</figcaption>}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {extraInfo.length > 0 && (
        <section className="bg-[#f0ebe0] text-[#0d1a0f] py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-[#2d6a4f] font-mono text-xs uppercase tracking-wider mb-4">Orientações</p>
            <h2 className="font-['Playfair_Display'] text-4xl md:text-5xl font-black mb-10">Informações importantes</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {extraInfo.map((item, index) => (
                <div key={`${item.title}-${index}`} className="border border-[#2d6a4f]/20 bg-white/30 p-6">
                  <p className="font-bold mb-2">{item.title}</p>
                  <p className="text-[#35513f] text-sm leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading && <div className="fixed bottom-4 right-4 bg-[#141f14] border border-[#2d6a4f]/30 text-[#7a9a7a] text-xs font-mono px-3 py-2">Carregando conteúdo...</div>}
    </div>
  );
}

function TicketsPreview({
  navigate,
  content,
  ticketTypes,
  onSelectTicket,
}: {
  navigate: (p: Page) => void;
  content: HomePageContent;
  ticketTypes: DbTicketType[];
  onSelectTicket: (id: string) => void;
}) {
  const extendedContent = getExtendedHomeContent(content);
  const publicTickets = selectPublicTicketCards(ticketTypes);

  return (
    <section className="home-section bg-[#0a120a]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <div><SectionLabel>{content.tickets_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.tickets_title}</DisplayTitle></div>
        </div>

        {publicTickets.length === 0 ? (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 text-center">
            <Ticket size={36} className="text-[#c9a84c] mx-auto mb-4" />
            <p className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-2xl mb-2">{extendedContent.tickets_empty_title}</p>
            <p className="text-[#7a9a7a] text-sm mb-6">{extendedContent.tickets_empty_subtitle}</p>
            <Btn variant="outline" onClick={() => navigate("tickets")}>{extendedContent.tickets_empty_cta_label}</Btn>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicTickets.map(card => {
              const ticket = card.ticketType;
              const visualStatus = getTicketVisualStatus(ticket);
              const disabled = visualStatus === "sold-out";
              return (
                <div data-ticket-card key={ticket.id} className={"bg-[#141f14] border p-8 flex min-h-[300px] flex-col gap-6 transition-colors " + (disabled ? "border-[#c0392b]/20 opacity-60" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60")}>
                  <div data-ticket-card-heading className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{formatLotLabel("lot_1", "1º lote")}</p>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-2xl mt-2">{card.displayName}</p>
                    </div>
                    <StatusBadge status={visualStatus} />
                  </div>
                  <div className="border-t border-[#2d6a4f]/20 pt-5">
                    <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">{formatCurrencyBR(ticket.price_cents)}</p>
                  </div>
                  <div className="mt-auto">
                    <Btn full disabled={disabled} onClick={() => { onSelectTicket(ticket.id); navigate("checkout"); }} variant={visualStatus === "last-units" ? "gold" : "primary"}>
                      {disabled ? extendedContent.tickets_sold_out_label : extendedContent.tickets_buy_label}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function WhoGoingPreview({ navigate, people, content, attendanceIntentPersonIds }: { navigate: (p: Page) => void; people: DbPerson[]; content: HomePageContent; attendanceIntentPersonIds: Set<string> }) {
  return <HomeAlumniOverviewPanel navigate={navigate} people={people} content={content} attendanceIntentPersonIds={attendanceIntentPersonIds} />;
}

function PhotoWallPreview({ navigate, photos, content }: { navigate: (p: Page) => void; photos: DbPhoto[]; content: HomePageContent }) {
  const extendedContent = getExtendedHomeContent(content);
  const previewPhotos = photos.slice(0, parsePositiveInteger(extendedContent.photos_preview_limit, 6));
  return (
    <section className="home-section bg-[#080f08]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <div><SectionLabel>{content.photos_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.photos_title}</DisplayTitle></div>
        </div>
        {previewPhotos.length === 0 ? (
          <EmptyState title={extendedContent.photos_empty_title} subtitle={extendedContent.photos_empty_subtitle} action={<Btn variant="outline" onClick={() => navigate("photo-wall")}>{extendedContent.photos_empty_cta_label}</Btn>} />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
              {previewPhotos.map(p => (
                <div key={p.id} onClick={() => navigate("photo-detail")} className="relative group cursor-pointer overflow-hidden bg-[#1a2e1a] aspect-[4/3]">
                  <img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto da turma"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a120a] via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                    <p className="text-[#f0ebe0] font-bold text-sm">{p.caption ?? "Memória da turma"}</p>
                    <p className="text-[#c9a84c] font-mono text-xs">{p.year_approx ?? "HC"}</p>
                  </div>
                  {p.year_approx && <div className="absolute top-3 left-3 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1">{p.year_approx}</div>}
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Btn variant="ghost" onClick={() => navigate("photo-wall")}>{extendedContent.photos_view_all_label} <ArrowRight size={16} /></Btn>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function TimelineSection({ content, memories = [] }: { content: HomePageContent; memories?: DbMemory[] }) {
  const extendedContent = getExtendedHomeContent(content);
  const timelineItems = parseHomeJsonArray<TimelineItemContent>(extendedContent.timeline_items_json, [])
    .filter(item => item.is_visible !== false);
  const previewMemories = memories.slice(0, 4);

  return (
    <section className="home-section bg-[#f0ebe0]">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>{content.timeline_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-16">{content.timeline_title}</DisplayTitle>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.92fr] gap-12 items-start">
          <div className="flex flex-col">
            {timelineItems.map((item, i) => {
              const highlighted = item.highlight ?? item.year === "2026";
              return (
                <div key={`${item.year}-${i}`} className="flex gap-6 md:gap-12">
                  <div className="flex flex-col items-center">
                    <div className={"w-12 h-12 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-sm shrink-0 " + (highlighted ? "bg-[#2d6a4f] text-[#f0ebe0]" : "border-2 border-[#2d6a4f] text-[#2d6a4f]")}>{item.year.slice(-2)}</div>
                    {i < timelineItems.length - 1 && <div className="w-px flex-1 bg-[#2d6a4f]/30 my-2" />}
                  </div>
                  <div className={i < timelineItems.length - 1 ? "pb-12" : ""}>
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">{item.year}</p>
                    <p className="text-[#0d1a0f] font-['Playfair_Display'] font-bold text-xl mb-2">{item.label}</p>
                    <p className="text-[#4a6a4a] text-sm leading-relaxed max-w-md">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <aside className="bg-[#0d1a0f] border border-[#2d6a4f]/30 p-6 md:p-8 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Caixa de Memórias</p>
                <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">Memórias da turma</h3>
              </div>
              <MessageCircle size={22} className="text-[#2d6a4f] shrink-0" />
            </div>

            {previewMemories.length === 0 ? (
              <p className="text-[#7a9a7a] text-sm leading-relaxed">As memórias aprovadas pela moderação aparecerão aqui, ao lado da linha do tempo da turma.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {previewMemories.map(memory => (
                  <div key={memory.id} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5">
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">{memory.is_featured ? "Memória destacada" : "Memória da turma"}</p>
                    <p className="text-[#f0ebe0] text-lg leading-relaxed font-['Playfair_Display']">“{memory.memory_text}”</p>
                    <p className="text-[#7a9a7a] font-mono text-xs mt-4">{memory.is_anonymous ? "Anônimo" : memory.author_name ?? "Ex-aluno"} · {formatDateShortBR(memory.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}

function FAQSection({ content }: { content: HomePageContent }) {
  const extendedContent = getExtendedHomeContent(content);
  return <HomeFaqSectionLoader
    eventId={DEFAULT_EVENT_ID}
    eyebrow={content.faq_eyebrow}
    title={content.faq_title}
    searchPlaceholder={extendedContent.faq_search_placeholder}
    emptyLabel={extendedContent.faq_empty_label}
    viewAllLabel={extendedContent.faq_view_all_label}
    initialMode={extendedContent.faq_initial_mode}
  />;
}

export function LandingPage({
  navigate,
  people,
  photos,
  content,
  event,
  ticketTypes,
  onSelectTicket,
  memories,
  attendanceIntentPersonIds,
  auth,
}: {
  navigate: (p: Page) => void;
  people: DbPerson[];
  photos: DbPhoto[];
  content: HomePageContent;
  event: DbEvent | null;
  ticketTypes: DbTicketType[];
  onSelectTicket: (id: string) => void;
  memories: DbMemory[];
  attendanceIntentPersonIds: Set<string>;
  auth: AuthState;
}) {
  const sections = getHomeSections(content);
  const sectionRenderers: Record<HomeSectionKey, React.ReactNode> = {
    hero: <Hero navigate={navigate} content={content} event={event} auth={auth} />,
    about: <AboutSection content={content} navigate={navigate} people={people} memories={memories} auth={auth} />,
    info: <EventInfoSection content={content} event={event} navigate={navigate} />,
    tickets: <TicketsPreview navigate={navigate} content={content} ticketTypes={ticketTypes} onSelectTicket={onSelectTicket} />,
    confirmed: <WhoGoingPreview navigate={navigate} people={people} content={content} attendanceIntentPersonIds={attendanceIntentPersonIds} />,
    photos: null,
    timeline: <TimelineSection content={content} memories={memories} />,
    faq: <FAQSection content={content} />,
  };

  return (
    <div data-home-loaded>
      {sections.map(section => (
        <Fragment key={section.key}>
          {sectionRenderers[section.key]}
        </Fragment>
      ))}
    </div>
  );
}


export function TicketsPage({ navigate, ticketTypes: liveTypes, onSelectTicket }: { navigate: (p: Page) => void; ticketTypes: DbTicketType[]; onSelectTicket: (id: string) => void }) {
  // Usa ticket types do Supabase se disponíveis, senão cai no mock local
  const displayTickets: TicketItem[] = (liveTypes.length > 0 ? liveTypes : TICKETS).map(t => {
    if ("price_cents" in t) {
      const tt = t as DbTicketType;
      const avail = tt.available_quantity - tt.sold_quantity;
      return {
        id: tt.id, type: tt.name, lot: tt.name.split("—")[1]?.trim() ?? "Lote",
        price: Math.round(tt.price_cents / 100), available: avail, total: tt.available_quantity,
        includes: [], status: tt.status === "sold_out" ? "sold-out" : avail <= 10 && avail > 0 ? "last-units" : tt.status === "open" ? "available" : "sold-out",
      } as TicketItem;
    }
    return t as TicketItem;
  });
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="border-b border-[#2d6a4f]/20 pb-12 mb-12">
          <SectionLabel>17 de Outubro de 2026 · Natal, RN</SectionLabel>
          <DisplayTitle className="text-5xl md:text-7xl">Ingressos</DisplayTitle>
          <p className="text-[#7a9a7a] mt-4">Espaço Cultural Ponta Negra · Portas Ã s 18h30</p>
        </div>
        <div className="flex flex-col gap-6">
          {displayTickets.map(t => (
            <div data-ticket-page-card key={t.id}
              className={`border bg-[#141f14] p-6 md:p-8 ${t.status === "sold-out" ? "border-[#c0392b]/20 opacity-60" : t.status === "last-units" ? "border-[#c9a84c]/50" : "border-[#2d6a4f]/30"}`}>
              {t.status === "last-units" && (
                <div className="bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 inline-block mb-4">
                  âš¡ Últimas {t.available} unidades
                </div>
              )}
              <div data-ticket-page-mobile-heading className="mb-6 flex flex-col items-start gap-4 md:hidden">
                <StatusBadge status={t.status} />
                <div>
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">{t.lot}</p>
                  <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-2xl leading-tight">{t.type}</p>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                <div className="flex-1">
                  <div className="hidden md:block">
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">{t.lot}</p>
                    <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-2xl md:text-3xl mb-3">{t.type}</p>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {t.includes.map(item => (
                      <span key={item} className="flex items-center gap-1 text-[#7a9a7a] text-xs">
                        <Check size={10} className="text-[#2d6a4f]" />{item}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-3 shrink-0">
                  <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">
                    R$ {t.price}<span className="text-sm text-[#7a9a7a] font-light">,00</span>
                  </p>
                  <div className="hidden text-right md:block">
                    <StatusBadge status={t.status} />
                    {t.available > 0 && (
                      <p className="text-[#7a9a7a] font-mono text-[10px] mt-1">{t.available}/{t.total} restantes</p>
                    )}
                  </div>
                  <Btn size="md" disabled={t.status === "sold-out"}
                    variant={t.status === "last-units" ? "gold" : "primary"}
                    onClick={() => { onSelectTicket(t.id); navigate("checkout"); }}>
                    {t.status === "sold-out" ? "Esgotado" : "Comprar agora"}
                  </Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 bg-[#141f14] border border-[#2d6a4f]/20 p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4">
          <Shield size={24} className="text-[#2d6a4f] shrink-0" />
          <div>
            <p className="text-[#f0ebe0] font-semibold mb-1">Compra segura via Mercado Pago</p>
            <p className="text-[#7a9a7a] text-sm">Cartão de crédito (até 6×), débito e PIX. Ingresso enviado por e-mail após confirmação do pagamento.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────────────
