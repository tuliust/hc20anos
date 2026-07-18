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
import { HomeMapChart } from "./HomePages";

export function ConfirmationPage({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-lg mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} className="text-[#f0ebe0]" />
          </div>
          <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-[0.4em] mb-3">Pagamento aprovado</p>
          <DisplayTitle className="text-4xl md:text-5xl mb-4">Ingresso confirmado!</DisplayTitle>
          <p className="text-[#7a9a7a] text-sm">Bem-vindo(a) ao reencontro! Seu ingresso foi confirmado e enviado por e-mail.</p>
        </div>
        <div className="bg-[#141f14] border border-[#2d6a4f]/40 p-8 mb-6">
          <div className="bg-[#f0ebe0] p-8 mx-auto w-40 h-40 flex items-center justify-center mb-6">
            <QrCode size={96} className="text-[#0d1a0f]" />
          </div>
          <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">Código do ingresso</p>
          <p className="text-[#f0ebe0] font-['JetBrains_Mono'] font-bold text-lg tracking-widest mb-4">Disponivel em Meu ingresso</p>
          <div className="border-t border-[#2d6a4f]/20 pt-4 flex flex-col gap-2 text-sm text-left">
            {[["Evento","Turma 2006 — 20 anos depois"],["Data","17 Out 2026, 19h00"],["Local","Espaço Cultural Ponta Negra"],["Tipo","Ingresso Individual"]].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-[#7a9a7a]">{k}</span>
                <span className="text-[#f0ebe0] text-right">{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Btn full onClick={() => navigate("my-ticket")}><Download size={16} />Ver meu ingresso</Btn>
          <Btn full variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={16} />Completar meu perfil</Btn>
          <Btn full variant="outline" onClick={() => navigate("share-invite")}><Send size={16} />Compartilhar convite</Btn>
          <Btn full variant="ghost" onClick={() => navigate("photo-wall")}><Upload size={16} />Enviar foto antiga</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── WHO GOING ────────────────────────────────────────────────────────────────

export function WhoGoingPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "confirmed" | "claimed" | "unclaimed">("confirmed");

  const visiblePeople = people.filter(a => a.is_visible);
  const classGroups = Array.from(new Set(visiblePeople.map(a => a.class_group).filter(Boolean) as string[])).sort();

  const filtered = visiblePeople.filter(a => {
    const matchesSearch = a.full_name.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || a.class_group === classFilter;
    const matchesStatus = statusFilter === "all" || a.profile_status === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const confirmed = visiblePeople.filter(a => a.profile_status === "confirmed");
  const completeProfiles = visiblePeople.filter(a => a.profile_status === "confirmed" || a.profile_status === "claimed").length;
  const pendingProfiles = Math.max(visiblePeople.length - completeProfiles, 0);

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <SectionLabel>Reencontro 2026</SectionLabel>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <DisplayTitle className="text-5xl md:text-7xl">Quem Vai</DisplayTitle>
              <p className="text-[#7a9a7a] mt-3 font-mono text-sm">{confirmed.length} ex-alunos confirmados · {completeProfiles} perfis atualizados · {pendingProfiles} pendentes</p>
            </div>
            <Btn onClick={() => navigate("tickets")}>Garantir minha vaga</Btn>
          </div>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 mb-8 p-4 flex flex-col gap-4">
          <div className="relative bg-[#0a120a] border border-[#2d6a4f]/20">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
            <input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 pl-12 pr-4 text-sm focus:outline-none" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(["all","confirmed","claimed","unclaimed"] as const).map(val => (
                <button key={val} onClick={() => setStatusFilter(val)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${statusFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                  {val === "all" ? "Todos" : val === "confirmed" ? "Confirmados" : val === "claimed" ? "Perfil completo" : "Não atualizado"}
                </button>
              ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 sm:ml-auto">
              <button onClick={() => setClassFilter("all")}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${classFilter === "all" ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                Todas as salas
              </button>
              {classGroups.map(group => (
                <button key={group} onClick={() => setClassFilter(group)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${classFilter === group ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                  Sala {group}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {filtered.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#7a9a7a]">
            <Users size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-mono text-sm">Nenhum resultado para os filtros selecionados.</p>
          </div>
        )}

        <div className="mt-8 bg-[#141f14] border border-[#2d6a4f]/20 p-4 flex items-start gap-3">
          <Shield size={16} className="text-[#2d6a4f] shrink-0 mt-0.5" />
          <p className="text-[#7a9a7a] text-xs">Apenas ex-alunos que autorizaram a exibição do nome aparecem nesta lista. Use os filtros para ver confirmados, perfis completos e perfis ainda não atualizados.</p>
        </div>
      </div>
    </div>
  );
}

// ─── THE CLASS PAGE ───────────────────────────────────────────────────────────

export function TheClassPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedPerson, setSelectedPerson] = useState<DbPerson | null>(null);

  const filtered = people.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || a.profile_status === filter)
  );

  return (
    <>
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onClaim={() => { setSelectedPerson(null); navigate("claim-profile"); }}
      />

      <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-12">
            <SectionLabel>Colégio Henrique Castriciano</SectionLabel>
            <DisplayTitle className="text-5xl md:text-7xl">A Turma 2006</DisplayTitle>
            <p className="text-[#7a9a7a] mt-3 font-mono text-sm">{people.length} ex-alunos · Turma 2006</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1 bg-[#141f14] border border-[#2d6a4f]/30">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
              <input
                placeholder="Buscar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 pl-12 pr-4 text-sm focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[["all","Todos"],["confirmed","Confirmados"],["claimed","Reivindicados"],["unclaimed","Não localizados"]].map(([val,label]) => (
                <button key={val} onClick={() => setFilter(val)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${filter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(a => (
              <AlumniCard
                key={a.id}
                alumni={personToAlumni(a)}
                onOpen={() => setSelectedPerson(a)}
                onClaim={() => navigate("claim-profile")}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-[#7a9a7a]">
              <Users size={40} className="mx-auto mb-4 opacity-40" />
              <p className="font-mono text-sm">Nenhum resultado</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


// ─── EX-ALUNOS PAGE ──────────────────────────────────────────────────────────

type AlumniClassFilter = "all" | "A" | "B" | "C" | "D";
type AlumniAttendanceFilter = "all" | "confirmed" | "preconfirmed" | "registered";

export function ExAlumniPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState<AlumniClassFilter>("all");
  const [attendanceFilter, setAttendanceFilter] = useState<AlumniAttendanceFilter>("all");
  const [selectedPerson, setSelectedPerson] = useState<DbPerson | null>(null);
  const [directoryRows, setDirectoryRows] = useState<AlumniDirectoryStatusRow[]>([]);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  useEffect(() => {
    let active = true;
    setLoadingStatuses(true);
    getAlumniDirectoryStatuses(DEFAULT_EVENT_ID)
      .then(rows => { if (active) setDirectoryRows(rows); })
      .catch(() => { if (active) setDirectoryRows([]); })
      .finally(() => { if (active) setLoadingStatuses(false); });
    return () => { active = false; };
  }, []);

  const visiblePeople = people.filter(person => person.is_visible !== false);
  const statusMap = new Map<string, AlumniDirectoryStatusRow>(directoryRows.map(row => [row.person_id, row] as [string, AlumniDirectoryStatusRow]));
  const shouldUseFallbackStatus = !loadingStatuses && directoryRows.length === 0;

  function getDirectoryStatus(person: DbPerson) {
    const row = statusMap.get(person.id);
    return {
      hasApprovedTicket: row?.has_approved_ticket ?? (shouldUseFallbackStatus && person.profile_status === "confirmed"),
      intendsToAttend: row?.intends_to_attend === true,
      hasCompletedRegistration: row?.has_completed_registration ?? (shouldUseFallbackStatus && Boolean(person.claimed_by_user_id)),
      city: row?.current_city ?? null,
      state: row?.current_state ?? null,
      country: row?.current_country ?? null,
      displayName: row?.display_name ?? null,
    };
  }

  const filtered = visiblePeople.filter(person => {
    const status = getDirectoryStatus(person);
    const normalizedSearch = search.trim().toLowerCase();
    const cardName = displayNameForPerson(person, status.displayName);
    const matchesSearch = !normalizedSearch || person.full_name.toLowerCase().includes(normalizedSearch) || cardName.toLowerCase().includes(normalizedSearch);
    const matchesClass = classFilter === "all" || (person.class_group ?? "").toUpperCase() === classFilter;
    const matchesAttendance =
      attendanceFilter === "all" ||
      (attendanceFilter === "confirmed" && status.hasApprovedTicket) ||
      (attendanceFilter === "preconfirmed" && status.intendsToAttend && !status.hasApprovedTicket) ||
      (attendanceFilter === "registered" && status.hasCompletedRegistration);
    return matchesSearch && matchesClass && matchesAttendance;
  });

  const confirmedCount = visiblePeople.filter(person => getDirectoryStatus(person).hasApprovedTicket).length;
  const preconfirmedCount = visiblePeople.filter(person => {
    const status = getDirectoryStatus(person);
    return status.intendsToAttend && !status.hasApprovedTicket;
  }).length;
  const registeredCount = visiblePeople.filter(person => getDirectoryStatus(person).hasCompletedRegistration).length;

  const classButtons: { value: AlumniClassFilter; label: string }[] = [
    { value: "all", label: "Todas" },
    { value: "A", label: "Turma A" },
    { value: "B", label: "Turma B" },
    { value: "C", label: "Turma C" },
    { value: "D", label: "Turma D" },
  ];

  const attendanceButtons: { value: AlumniAttendanceFilter; label: string }[] = [
    { value: "all", label: "Ex-alunos" },
    { value: "registered", label: "Cadastrados" },
    { value: "confirmed", label: "Compraram" },
    { value: "preconfirmed", label: "Eu vou!" },
  ];

  return (
    <>
      <PersonDetailModal
        person={selectedPerson}
        onClose={() => setSelectedPerson(null)}
        onClaim={() => { setSelectedPerson(null); navigate("claim-profile"); }}
      />

      <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <section className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-end mb-10">
            <div>
              <SectionLabel>Turma 2006 · Diretório</SectionLabel>
              <DisplayTitle className="text-5xl md:text-7xl">Ex-alunos</DisplayTitle>
              <p className="text-[#8ab89a] mt-4 max-w-3xl leading-relaxed">
                Uma visão consolidada da turma, de quem comprou ingresso, quem pretende ir, quem já atualizou o cadastro e onde os ex-alunos estão hoje.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                <p className="text-[#c9a84c] font-mono text-2xl font-bold">{visiblePeople.length}</p>
                <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-1">Pré-cadastrados</p>
              </div>
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                <p className="text-[#c9a84c] font-mono text-2xl font-bold">{confirmedCount}</p>
                <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-1">Confirmados</p>
              </div>
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                <p className="text-[#c9a84c] font-mono text-2xl font-bold">{preconfirmedCount}</p>
                <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-1">Pré-confirmados</p>
              </div>
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                <p className="text-[#c9a84c] font-mono text-2xl font-bold">{registeredCount}</p>
                <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-1">Cadastrados</p>
              </div>
            </div>
          </section>

          <section className="bg-[#141f14] border border-[#2d6a4f]/30 mb-8 p-4 md:p-5 flex flex-col gap-4">
            <div className="relative bg-[#0a120a] border border-[#2d6a4f]/20">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
              <input
                placeholder="Buscar por nome..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 pl-12 pr-4 text-sm focus:outline-none"
              />
            </div>

            <div data-alumni-class-filters className="grid grid-cols-5 gap-1.5">
              {classButtons.map(button => (
                <button
                  key={button.value}
                  onClick={() => setClassFilter(button.value)}
                  className={`min-w-0 px-1.5 py-2 text-[9px] sm:text-xs font-mono uppercase tracking-[0.04em] sm:tracking-wider border transition-colors whitespace-nowrap ${classFilter === button.value ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div data-alumni-status-filters className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {attendanceButtons.map(button => (
                <button
                  key={button.value}
                  onClick={() => setAttendanceFilter(button.value)}
                  className={`min-h-11 border px-2 py-3 text-center transition-colors ${attendanceFilter === button.value ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  <span className="block text-xs font-mono uppercase tracking-wider font-bold">{button.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">{filtered.length} resultado{filtered.length === 1 ? "" : "s"}</p>
              {loadingStatuses && <p className="text-[#3a5a3a] font-mono text-[10px] uppercase tracking-wider">Carregando status...</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(person => {
                const status = getDirectoryStatus(person);
                return (
                  <AlumniCard
                    key={person.id}
                    alumni={personToAlumni(person, status.displayName)}
                    onOpen={() => setSelectedPerson(person)}
                    onClaim={() => navigate("claim-profile")}
                  />
                );
              })}
            </div>

            {filtered.length === 0 && (
              <div className="text-center py-20 text-[#7a9a7a]">
                <Users size={40} className="mx-auto mb-4 opacity-40" />
                <p className="font-mono text-sm">Nenhum resultado para os filtros selecionados.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

// ─── CLAIM PROFILE (COMPLETE) ─────────────────────────────────────────────────

export function ClaimProfilePage({ navigate, people, auth }: { navigate: (p: Page) => void; people: DbPerson[]; auth: AuthState }) {
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DbPerson | null>(null);
  const [answers, setAnswers] = useState({ penultimateSurname: "", classGroup: "", birthYear: "" });
  const [account, setAccount] = useState({ email: auth.email ?? "", whatsapp: "", password: "", confirmPassword: "" });
  const [profileDraft, setProfileDraft] = useState({
    fullName: "",
    displayName: "",
    classGroup: "",
    nickname: "",
    city: "",
    state: "",
    country: "Brasil",
    profession: "",
    bio: "",
    instagram: "",
    linkedin: "",
    relationshipStatus: "" as RelationshipStatus | "",
    hasChildren: "" as "" | "yes" | "no",
    childrenCount: "",
    intendsToAttend: (window.sessionStorage.getItem("hc-attendance-intent") === "yes" ? "yes" : "") as "" | "yes" | "no",
  });
  const [privacy, setPrivacy] = useState({ showCurrentPhoto: true, showCity: true, showProfession: true, showSocial: true, showInList: true, allowTagging: true });
  const [bioAssistantOpen, setBioAssistantOpen] = useState(false);
  const [bioAssistantStep, setBioAssistantStep] = useState(0);
  const [bioGenerated, setBioGenerated] = useState(false);
  const [bioAssistantAnswers, setBioAssistantAnswers] = useState<Record<string, string[]>>({});
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);
  const { toast, show, hide } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const results = people
    .filter(person => person.is_visible !== false)
    .filter(person => person.full_name.toLowerCase().includes(search.toLowerCase()) && search.length > 1)
    .slice(0, 30);
  const alreadyClaimed = selected && (selected.profile_status === "claimed" || selected.profile_status === "confirmed");
  const bars = 6;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [step]);

  function showError(message: string) {
    setError(message);
    show(message, "error");
  }

  function showSuccess(message: string) {
    setError("");
    show(message, "success");
  }

  function goToStep(nextStep: number) {
    setError("");
    setStep(nextStep);
  }

  function formatRegistrationError(error: unknown) {
    const message = error instanceof Error ? error.message : "Erro ao concluir cadastro.";
    if (/for security purposes/i.test(message)) {
      const seconds = message.match(/after\s+(\d+)\s+seconds/i)?.[1];
      return seconds
        ? `Por segurança, aguarde ${seconds} segundos antes de tentar criar a conta novamente.`
        : "Por segurança, aguarde alguns segundos antes de tentar criar a conta novamente.";
    }
    if (/already registered|already exists|user already/i.test(message)) {
      return "Este e-mail já está cadastrado. Entre com sua conta ou use outro e-mail.";
    }
    return message;
  }

  function openBioAssistant() {
    setBioAssistantStep(0);
    setBioAssistantOpen(true);
  }

  function toggleBioAssistantOption(questionId: string, option: string) {
    setBioAssistantAnswers(current => {
      const selectedOptions = current[questionId] ?? [];
      const nextOptions = selectedOptions.includes(option)
        ? selectedOptions.filter(item => item !== option)
        : [...selectedOptions, option];
      return { ...current, [questionId]: nextOptions };
    });
  }

  function goToBioAssistantStep(nextStep: number) {
    setBioAssistantStep(Math.min(Math.max(nextStep, 0), SCHOOL_PROFILE_QUESTIONS.length - 1));
  }

  function formatBioList(items: string[]) {
    const normalized = items.map(item => item.trim()).filter(Boolean);
    if (normalized.length === 0) return "";
    if (normalized.length === 1) return normalized[0].toLowerCase();
    return `${normalized.slice(0, -1).map(item => item.toLowerCase()).join(", ")} e ${normalized[normalized.length - 1].toLowerCase()}`;
  }

  function finishBioAssistant() {
    const name = (profileDraft.displayName || profileDraft.fullName || "Esse ex-aluno").trim();
    const selectedByQuestion = Object.fromEntries(
      SCHOOL_PROFILE_QUESTIONS.map(question => [question.id, bioAssistantAnswers[question.id] ?? []])
    ) as Record<string, string[]>;

    const sentences = [
      selectedByQuestion.school_personality?.length
        ? `Na época do HC, ${name} tinha um jeito bem próprio: ${formatBioList(selectedByQuestion.school_personality)}.`
        : "",
      selectedByQuestion.school_places?.length
        ? `Aparecia muito ${formatBioList(selectedByQuestion.school_places)}.`
        : "",
      selectedByQuestion.school_memories?.length
        ? `Guarda dessa fase ${formatBioList(selectedByQuestion.school_memories)}.`
        : "",
      selectedByQuestion.school_vibe?.length
        ? `Sua vibe na turma era de ${formatBioList(selectedByQuestion.school_vibe)}.`
        : "",
      selectedByQuestion.reunion_expectation?.length
        ? `No reencontro, quer ${formatBioList(selectedByQuestion.reunion_expectation)}.`
        : "",
    ].filter(Boolean);

    const generatedBio = sentences.length > 0
      ? sentences.join(" ").slice(0, 500)
      : `${name} está atualizando seu perfil para reencontrar a turma, relembrar os tempos de HC e viver uma noite de boas histórias.`;

    setProfileDraft(f => ({ ...f, bio: generatedBio }));
    setBioGenerated(true);
    setBioAssistantOpen(false);
    showSuccess("Mini bio gerada. Você pode revisar o texto antes de continuar.");
  }

  function selectPerson(person: DbPerson) {
    setSelected(person);
    setProfileDraft(draft => ({
      ...draft,
      fullName: person.full_name,
      displayName: person.full_name,
      classGroup: person.class_group ?? "",
      nickname: person.nickname_at_school ?? "",
    }));
    const prefilledWhatsapp = formatWhatsapp((person as any).contact_whatsapp ?? "");
    if (prefilledWhatsapp) {
      setAccount(current => ({ ...current, whatsapp: current.whatsapp || prefilledWhatsapp }));
    }
    setAnswers({ penultimateSurname: "", classGroup: "", birthYear: "" });
    goToStep(2);
  }

  function normalizeUf(value: string) {
    return value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
  }

  function formatWhatsapp(value: string) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (digits.length <= 2) return digits ? `(${digits}` : "";
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function normalizeWhatsapp(value: string) {
    const digits = value.replace(/\D/g, "");
    return digits || null;
  }

  function normalizeSocialUrl(value: string, prefix: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === prefix || trimmed.replace(/\/+$/, "") === prefix.replace(/\/+$/, "")) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const handle = trimmed.replace(/^@+/, "");
    return handle ? `${prefix}${handle}` : null;
  }

  function validateIdentity() {
    if (!selected) return "Selecione seu nome na lista.";
    const expectedSurname = getPenultimateSurname(selected.full_name);
    if (normalizeLoose(answers.penultimateSurname) !== normalizeLoose(expectedSurname)) return "O penúltimo sobrenome não confere.";
    if (normalizeLoose(answers.classGroup) !== normalizeLoose(selected.class_group)) return "A turma informada não confere.";
    if (!selected.birth_year || Number(answers.birthYear) !== Number(selected.birth_year)) return "O ano de nascimento não confere.";
    return "";
  }

  function validateProfileStep() {
    if (!profileDraft.fullName.trim()) return "Informe seu nome completo.";
    if (!profileDraft.classGroup.trim()) return "Informe sua turma.";
    const childrenCount = Number(profileDraft.childrenCount);
    if (profileDraft.hasChildren === "yes" && profileDraft.childrenCount.trim() && (!Number.isInteger(childrenCount) || childrenCount < 0)) {
      return "Quantidade de filhos inválida.";
    }
    return "";
  }

  function validateAccountStep() {
    const email = account.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Informe um e-mail válido.";
    if (!account.whatsapp.replace(/\D/g, "")) return "Informe seu WhatsApp.";
    if (!auth.loggedIn && account.password.length < 6) return "A senha deve ter pelo menos 6 caracteres.";
    if (!auth.loggedIn && account.password !== account.confirmPassword) return "As senhas não conferem.";
    return "";
  }

  async function selectPhoto(file: File) {
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(String(reader.result));
    reader.readAsDataURL(file);
  }

  async function completeRegistration() {
    if (!selected) return;
    const validationError = validateAccountStep();
    if (validationError) { showError(validationError); return; }

    setBusy(true);
    setError("");
    try {
      let effectiveUserId = auth.loggedIn ? auth.userId : "";
      if (!auth.loggedIn) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: account.email.trim(),
          password: account.password,
          options: { data: { full_name: profileDraft.displayName.trim() || profileDraft.fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        effectiveUserId = data.user?.id ?? "";
        if (!data.session) {
          setPendingEmailConfirmation(true);
          setDone(true);
          goToStep(6);
          showSuccess("Conta criada. Confirme seu e-mail para concluir o vínculo do perfil.");
          return;
        }
      }

      const photoUrl = photoFile && effectiveUserId ? await uploadProfileAvatar(effectiveUserId, photoFile) : null;
      const completedProfile = await completeProfileRegistration({
        personId: selected.id,
        penultimateSurname: answers.penultimateSurname,
        classGroupConfirmation: answers.classGroup,
        birthYear: Number(answers.birthYear),
        fullName: profileDraft.fullName.trim(),
        displayName: profileDraft.displayName.trim() || profileDraft.fullName.trim(),
        classGroup: profileDraft.classGroup.trim(),
        currentPhotoUrl: photoUrl,
        currentCity: profileDraft.city.trim() || null,
        currentState: profileDraft.state.trim() || null,
        currentCountry: profileDraft.country.trim() || "Brasil",
        profession: profileDraft.profession.trim() || null,
        bio: profileDraft.bio.trim() || null,
        nicknameAtSchool: profileDraft.nickname.trim() || null,
        instagramUrl: normalizeSocialUrl(profileDraft.instagram, "https://instagram.com/"),
        linkedinUrl: normalizeSocialUrl(profileDraft.linkedin, "https://linkedin.com/in/"),
        contactEmail: account.email.trim(),
        contactWhatsapp: normalizeWhatsapp(account.whatsapp),
        relationshipStatus: profileDraft.relationshipStatus || null,
        hasChildren: profileDraft.hasChildren === "yes",
        childrenCount: profileDraft.hasChildren === "yes" && profileDraft.childrenCount.trim() ? Number(profileDraft.childrenCount) : null,
        intendsToAttend: profileDraft.intendsToAttend ? profileDraft.intendsToAttend === "yes" : null,
        showCurrentPhoto: privacy.showCurrentPhoto,
        showCity: privacy.showCity,
        showProfession: privacy.showProfession,
        showSocialLinks: privacy.showSocial,
        allowPhotoTags: privacy.allowTagging,
        showConfirmedStatus: privacy.showInList,
      });
      await saveSchoolQuestionnaireAnswers({
        eventId: DEFAULT_EVENT_ID,
        profileId: completedProfile.id,
        personId: selected.id,
        answers: bioAssistantAnswers,
      }).catch(() => {});
      if (photoUrl && effectiveUserId) {
        await saveMyPublicProfile(effectiveUserId, { current_photo_url: photoUrl }, { avatar_url: photoUrl }).catch(() => {});
      }
      window.sessionStorage.removeItem("hc-attendance-intent");
      setPendingEmailConfirmation(false);
      setDone(true);
      goToStep(6);
      showSuccess("Cadastro concluído com sucesso. Redirecionando para a página principal...");
      window.setTimeout(() => { window.location.assign("/"); }, 1200);
    } catch (err) {
      showError(formatRegistrationError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      {toast && <ToastNotification toast={toast} onClose={hide} />}
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => step > 1 && !done ? setStep(s => Math.max(1, s - 1)) : navigate("the-class")}
          className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <SectionLabel>Perfil da Turma</SectionLabel>
        <DisplayTitle className="text-3xl md:text-4xl mb-6">Criar meu perfil</DisplayTitle>
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: bars }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 transition-all ${i + 1 <= step ? "bg-[#2d6a4f]" : "bg-[#1a2e1a]"}`} />
          ))}
        </div>

        {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3 mb-5">{error}</p>}

        {step === 1 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#f0ebe0] font-semibold">1. Encontre seu nome na lista pré-cadastrada</p>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
              <input placeholder="Digite seu nome completo..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
            </div>
            {results.length > 0 && (
              <div className="flex flex-col gap-2 max-h-[480px] overflow-y-auto">
                {results.map(person => (
                  <button key={person.id} onClick={() => selectPerson(person)}
                    className="flex items-center gap-3 p-4 border text-left hover:border-[#2d6a4f]/50 transition-colors border-[#2d6a4f]/20">
                    <div className="w-10 h-10 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold text-sm font-mono shrink-0">
                      {initials(person.full_name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#f0ebe0] font-semibold text-sm truncate">{person.full_name}</p>
                      <p className="text-[#c9a84c] text-xs font-mono">Turma {person.class_group ?? "-"}</p>
                    </div>
                    <StatusBadge status={person.profile_status} />
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && results.length === 0 && <p className="text-[#7a9a7a] text-sm text-center py-4">Nenhum perfil encontrado.</p>}
          </div>
        )}

        {step === 2 && alreadyClaimed && selected && (
          <div className="bg-[#141f14] border border-[#c9a84c]/40 p-8 flex flex-col gap-5 text-center">
            <AlertTriangle size={40} className="text-[#c9a84c] mx-auto" />
            <DisplayTitle className="text-xl">Perfil já vinculado</DisplayTitle>
            <p className="text-[#7a9a7a] text-sm">O perfil de <span className="text-[#f0ebe0] font-semibold">{selected.full_name}</span> já está vinculado a uma conta.</p>
            <Btn full onClick={() => { setSelected(null); setSearch(""); goToStep(1); }}>Buscar outro nome</Btn>
          </div>
        )}

        {step === 2 && !alreadyClaimed && selected && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#f0ebe0] font-semibold">2. Confirme se este é seu cadastro</p>
            <div className="flex items-center gap-3 p-4 bg-[#1a2e1a] border border-[#2d6a4f]/30">
              <div className="w-12 h-12 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono">{initials(selected.full_name)}</div>
              <div>
                <p className="text-[#f0ebe0] font-semibold">{selected.full_name}</p>
                <p className="text-[#c9a84c] text-xs font-mono">Turma {selected.class_group ?? "-"}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Btn full onClick={() => goToStep(3)}>Sim, sou eu <ArrowRight size={16} /></Btn>
              <Btn full variant="ghost" onClick={() => { setSelected(null); setSearch(""); goToStep(1); }}>Não</Btn>
            </div>
          </div>
        )}

        {step === 3 && selected && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <div>
              <p className="text-[#f0ebe0] font-semibold mb-1">3. Responda às perguntas de confirmação</p>
              <p className="text-[#7a9a7a] text-sm">Esses dados são comparados ao pré-cadastro para evitar vínculo indevido.</p>
            </div>
            <Field label="Qual é seu penúltimo sobrenome?" value={answers.penultimateSurname} onChange={v => setAnswers(a => ({ ...a, penultimateSurname: v }))} placeholder="Ex.: Silva" />
            <Field label="Qual era sua turma?" value={answers.classGroup} onChange={v => setAnswers(a => ({ ...a, classGroup: v.toUpperCase().slice(0, 3) }))} placeholder="Ex.: A" />
            <Field label="Qual é seu ano de nascimento?" type="number" value={answers.birthYear} onChange={v => setAnswers(a => ({ ...a, birthYear: v.replace(/\D/g, "").slice(0, 4) }))} placeholder="Ex.: 1988" />
            <Btn full onClick={() => { const validation = validateIdentity(); if (validation) { showError(validation); return; } goToStep(4); }}>
              Validar identidade <ArrowRight size={16} />
            </Btn>
          </div>
        )}

        {step === 4 && selected && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <div>
              <p className="text-[#f0ebe0] font-semibold mb-1">4. Edite seus dados públicos</p>
              <p className="text-[#7a9a7a] text-sm">Todos os campos são opcionais, exceto nome e turma. Se corrigir nome ou turma, o pré-cadastro também será atualizado.</p>
            </div>
            <AvatarCropUpload
              currentImageUrl={photoPreview}
              fallbackLabel={initials(profileDraft.displayName || selected.full_name)}
              uploading={busy}
              onCroppedFile={selectPhoto}
              onRemove={() => { setPhotoFile(null); setPhotoPreview(""); }}
              helperText="Foto opcional. Você poderá trocar depois em Editar perfil."
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome completo" value={profileDraft.fullName} onChange={v => setProfileDraft(f => ({ ...f, fullName: v, displayName: f.displayName || v }))} />
              <Field label="Nome de exibição" value={profileDraft.displayName} onChange={v => setProfileDraft(f => ({ ...f, displayName: v }))} />
              <Field label="Turma" value={profileDraft.classGroup} onChange={v => setProfileDraft(f => ({ ...f, classGroup: v.toUpperCase().slice(0, 3) }))} />
              <Field label="Apelido da época" value={profileDraft.nickname} onChange={v => setProfileDraft(f => ({ ...f, nickname: v }))} />
              <Field label="Cidade atual" value={profileDraft.city} onChange={v => setProfileDraft(f => ({ ...f, city: v }))} icon={<MapPin size={14} />} />
              <Field label="Estado" value={profileDraft.state} onChange={v => setProfileDraft(f => ({ ...f, state: normalizeUf(v) }))} placeholder="UF" />
              <Field label="País" value={profileDraft.country} onChange={v => setProfileDraft(f => ({ ...f, country: v }))} />
              <Field label="Profissão" value={profileDraft.profession} onChange={v => setProfileDraft(f => ({ ...f, profession: v }))} />
              <Field label="Instagram" value={profileDraft.instagram} onChange={v => setProfileDraft(f => ({ ...f, instagram: v }))} icon={<Instagram size={14} />} placeholder="@usuario ou URL" />
              <Field label="LinkedIn" value={profileDraft.linkedin} onChange={v => setProfileDraft(f => ({ ...f, linkedin: v }))} icon={<Linkedin size={14} />} placeholder="URL ou slug" />
            </div>
            <div>
              <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Mini bio</p>
              <Btn variant="gold" onClick={openBioAssistant} className="w-full sm:w-auto">
                <MessageCircle size={16} />{profileDraft.bio.trim() ? "Refazer mini bio com 5 perguntas" : "Apresente seu perfil com apenas 5 perguntas"}
              </Btn>
              <p className="text-[#7a9a7a] text-xs mt-2">A integração com IA será ativada depois. Por enquanto, o modal prepara uma prévia editável a partir das respostas.</p>
              {(bioGenerated || profileDraft.bio.trim()) && (
                <div className="mt-4">
                  <FieldArea label="Texto da mini bio" value={profileDraft.bio} onChange={v => setProfileDraft(f => ({ ...f, bio: v }))} rows={3} />
                </div>
              )}
            </div>
            <div>
              <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Relacionamento</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <OptionButton selected={profileDraft.relationshipStatus === "single"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "single" }))}>Solteiro(a)</OptionButton>
                <OptionButton selected={profileDraft.relationshipStatus === "dating"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "dating" }))}>Namorando</OptionButton>
                <OptionButton selected={profileDraft.relationshipStatus === "married"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "married" }))}>Casado(a)</OptionButton>
              </div>
            </div>
            <div>
              <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Filhos</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <OptionButton selected={profileDraft.hasChildren === "yes"} onClick={() => setProfileDraft(f => ({ ...f, hasChildren: "yes" }))}>Tenho filhos</OptionButton>
                <OptionButton selected={profileDraft.hasChildren === "no"} onClick={() => setProfileDraft(f => ({ ...f, hasChildren: "no", childrenCount: "" }))}>Não tenho filhos</OptionButton>
              </div>
            </div>
            {profileDraft.hasChildren === "yes" && <Field label="Quantidade de filhos" type="number" value={profileDraft.childrenCount} onChange={v => setProfileDraft(f => ({ ...f, childrenCount: v.replace(/\D/g, "").slice(0, 2) }))} />}
            <div>
              <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Você pretende ir para a festa?</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <OptionButton selected={profileDraft.intendsToAttend === "yes"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "yes" }))}>Sim, pretendo ir</OptionButton>
                <OptionButton selected={profileDraft.intendsToAttend === "no"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "no" }))}>Ainda não / não pretendo</OptionButton>
              </div>
            </div>
            <Btn full onClick={() => { const validation = validateProfileStep(); if (validation) { showError(validation); return; } goToStep(5); }}>
              Continuar <ArrowRight size={16} />
            </Btn>
          </div>
        )}

        {step === 5 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <div>
              <p className="text-[#f0ebe0] font-semibold mb-1">5. Conta, contato e privacidade</p>
              <p className="text-[#7a9a7a] text-sm">Defina o acesso ao site e escolha quais dados aparecem para a turma.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="E-mail" type="email" value={account.email} onChange={v => setAccount(a => ({ ...a, email: v }))} icon={<Mail size={14} />} />
              <Field label="WhatsApp" value={account.whatsapp} onChange={v => setAccount(a => ({ ...a, whatsapp: formatWhatsapp(v) }))} icon={<Phone size={14} />} />
              {!auth.loggedIn && <Field label="Senha" type="password" value={account.password} onChange={v => setAccount(a => ({ ...a, password: v }))} />}
              {!auth.loggedIn && <Field label="Confirmar senha" type="password" value={account.confirmPassword} onChange={v => setAccount(a => ({ ...a, confirmPassword: v }))} />}
            </div>
            <div className="border-t border-[#2d6a4f]/20 pt-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-4">Preferências de exibição</p>
              <div className="flex flex-col gap-4">
                {([
                  ["showInList", "Aparecer na lista de confirmados"],
                  ["showCurrentPhoto", "Exibir foto atual"],
                  ["showCity", "Exibir cidade atual"],
                  ["showProfession", "Exibir profissão"],
                  ["showSocial", "Exibir redes sociais e WhatsApp"],
                  ["allowTagging", "Permitir marcações em fotos"],
                ] as [keyof typeof privacy, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#f0ebe0] text-sm">{label}</span>
                    <button type="button" onClick={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
                      className={`relative w-12 h-6 transition-colors ${privacy[key] ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all ${privacy[key] ? "left-7" : "left-1"}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
            <Btn full size="lg" onClick={completeRegistration} disabled={busy}>{busy ? <><RefreshCw size={16} className="animate-spin" />Concluindo...</> : <><UserCheck size={16} />Concluir cadastro</>}</Btn>
          </div>
        )}

        {step === 6 && done && (
          <div className="bg-[#0d2e1a] border border-[#2d6a4f] p-8 flex flex-col gap-5 text-center">
            <div className="w-16 h-16 bg-[#2d6a4f] flex items-center justify-center mx-auto"><UserCheck size={32} className="text-[#f0ebe0]" /></div>
            <DisplayTitle className="text-2xl">{pendingEmailConfirmation ? "Confirme seu e-mail" : "Perfil criado"}</DisplayTitle>
            <p className="text-[#7a9a7a] text-sm">
              {pendingEmailConfirmation
                ? "Sua conta foi criada, mas o Supabase exige confirmação de e-mail antes de concluir o vínculo com o perfil. Confirme o e-mail e entre novamente para finalizar."
                : "Seu perfil foi validado, vinculado à sua conta e atualizado com as preferências escolhidas. Você será redirecionado para a página principal."}
            </p>
            <div className="flex flex-col gap-3">
              {pendingEmailConfirmation ? (
                <>
                  <Btn full onClick={() => navigate("login")}>Ir para login <ArrowRight size={16} /></Btn>
                  <Btn full variant="outline" onClick={() => navigate("home")}>Voltar para início</Btn>
                </>
              ) : (
                <>
                  <Btn full onClick={() => navigate("edit-profile")}>Editar meu perfil <ArrowRight size={16} /></Btn>
                  <Btn full variant="outline" onClick={() => navigate("tickets")}>Ver ingressos</Btn>
                </>
              )}
            </div>
          </div>
        )}

        <Modal open={bioAssistantOpen} onClose={() => setBioAssistantOpen(false)} title="Mini bio em 5 perguntas" wide>
          {(() => {
            const currentQuestion = SCHOOL_PROFILE_QUESTIONS[bioAssistantStep];
            const selectedOptions = bioAssistantAnswers[currentQuestion.id] ?? [];
            const isLastQuestion = bioAssistantStep === SCHOOL_PROFILE_QUESTIONS.length - 1;
            const advance = () => isLastQuestion ? finishBioAssistant() : goToBioAssistantStep(bioAssistantStep + 1);

            return (
              <div className="flex flex-col gap-5">
                <div>
                  <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-2">Pergunta {bioAssistantStep + 1} de {SCHOOL_PROFILE_QUESTIONS.length}</p>
                  <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold mb-2">{currentQuestion.title}</h3>
                  <p className="text-[#8ab89a] text-sm leading-relaxed">Esta etapa é opcional. Selecione quantas opções quiser ou use “Pular” para seguir sem responder.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.options.map(option => (
                    <OptionButton
                      key={option}
                      selected={selectedOptions.includes(option)}
                      onClick={() => toggleBioAssistantOption(currentQuestion.id, option)}
                    >
                      {option}
                    </OptionButton>
                  ))}
                </div>

                <div className="flex items-center gap-2" aria-hidden="true">
                  {SCHOOL_PROFILE_QUESTIONS.map((question, index) => (
                    <div key={question.id} className={`h-1 flex-1 ${index <= bioAssistantStep ? "bg-[#2d6a4f]" : "bg-[#1a2e1a]"}`} />
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Btn full variant="ghost" onClick={advance}>Pular</Btn>
                  {bioAssistantStep > 0 && <Btn full variant="outline" onClick={() => goToBioAssistantStep(bioAssistantStep - 1)}>Voltar</Btn>}
                  <Btn full onClick={advance}>
                    <MessageCircle size={16} />{isLastQuestion ? "Gerar prévia" : "Continuar"}
                  </Btn>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    </div>
  );
}

// ─── PHOTO WALL ───────────────────────────────────────────────────────────────

export function PhotoWallPage({ navigate, auth, photos, onSelectPhoto }: {
  navigate: (p: Page) => void; auth: AuthState; photos: DbPhoto[]; onSelectPhoto: (id: string) => void;
}) {
  const [selectedYearFilters, setSelectedYearFilters] = useState<string[]>([]);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [selectedPersonFilters, setSelectedPersonFilters] = useState<string[]>([]);
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, PhotoStats>>({});
  const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>([]);
  const [busyLike, setBusyLike] = useState<string | null>(null);
  const [error, setError] = useState("");

  const years = ["2003", "2004", "2005", "2006"];
  const taggedNames = Array.from(new Set(photos.flatMap(p => (((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? [])
    .filter(tag => !tag.status || tag.status === "approved")
    .map(tag => tag.tagged_name_snapshot)
    .filter(Boolean) as string[])))).sort();

  const managedPhotos = photos.filter(p => p.is_featured);
  const filteredPhotos = managedPhotos.filter(p => {
    const matchesYear = selectedYearFilters.length === 0 || selectedYearFilters.includes(String(p.year_approx));
    const tags = ((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? []);
    const approvedTagNames = tags
      .filter(tag => !tag.status || tag.status === "approved")
      .map(tag => tag.tagged_name_snapshot)
      .filter(Boolean) as string[];
    const matchesPerson = selectedPersonFilters.length === 0 || approvedTagNames.some(name => selectedPersonFilters.includes(name));
    return matchesYear && matchesPerson;
  });

  const featuredPhotos: DbPhoto[] = [];
  const popularPhotos = [...managedPhotos].sort((a, b) => (stats[b.id]?.likes_count ?? 0) - (stats[a.id]?.likes_count ?? 0)).slice(0, 6);

  async function loadStats() {
    const photoIds = photos.map(p => p.id);
    if (photoIds.length === 0) { setStats({}); return; }
    const nextStats = await getPhotoStats(photoIds);
    for (const photo of photos) nextStats[photo.id] = { ...nextStats[photo.id], is_featured: photo.is_featured };
    setStats(nextStats);
    if (auth.loggedIn) setLikedPhotoIds(await getMyPhotoLikes(auth.userId));
  }

  useEffect(() => { loadStats().catch(() => {}); }, [photos, auth.loggedIn, auth.userId]);

  async function toggleLike(photoId: string) {
    if (!auth.loggedIn) { navigate("login"); return; }
    setBusyLike(photoId);
    setError("");
    try {
      if (likedPhotoIds.includes(photoId)) {
        await unlikePhoto(photoId, auth.userId);
        setLikedPhotoIds(ids => ids.filter(id => id !== photoId));
      } else {
        await likePhoto(photoId, auth.userId);
        setLikedPhotoIds(ids => [...ids, photoId]);
      }
      await loadStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar curtida.");
    } finally {
      setBusyLike(null);
    }
  }

  function togglePersonFilter(name: string) {
    setSelectedPersonFilters(current =>
      current.includes(name)
        ? current.filter(item => item !== name)
        : [...current, name]
    );
  }

  function toggleYearFilter(year: string) {
    setSelectedYearFilters(current => current.includes(year) ? current.filter(item => item !== year) : [...current, year]);
  }

  return (
    <>
      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} auth={auth} navigate={navigate} />
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <SectionLabel>Nossa História</SectionLabel>
              <DisplayTitle className="text-5xl md:text-7xl">Fotos da Época</DisplayTitle>
            </div>
            <div data-history-actions className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              <Btn variant="outline" className="min-w-0 px-3" onClick={() => navigate("memories")}><MessageCircle size={16} />Memórias</Btn>
              <Btn className="min-w-0 px-3" onClick={() => setUploadOpen(true)}><Upload size={16} />Enviar foto</Btn>
            </div>
          </div>

          {error && <ErrorState message={error} onRetry={loadStats} />}

          {featuredPhotos.length > 0 && (
            <div className="mb-10">
              <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4 flex items-center gap-2"><Star size={14} />Fotos destacadas pela organização</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {featuredPhotos.map(p => (
                  <button key={p.id} onClick={() => { onSelectPhoto(p.id); navigate("photo-detail"); }} className="relative aspect-square overflow-hidden bg-[#141f14] border border-[#2d6a4f]/20 text-left">
                    <img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                    <span className="absolute top-2 left-2 bg-[#c9a84c] text-[#0d1a0f] text-[9px] font-mono font-bold px-2 py-1">DESTAQUE</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-4 mb-8 flex flex-col gap-3">
            <div>
              <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Filtrar por ano</p>
              <div data-year-multiselect className="relative max-w-sm">
                <button type="button" aria-expanded={yearDropdownOpen} onClick={() => setYearDropdownOpen(open => !open)} className={`flex min-h-11 w-full items-center justify-between gap-3 border px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors ${selectedYearFilters.length > 0 ? "border-[#c9a84c] bg-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                  <span>{selectedYearFilters.length === 0 ? "Todos os anos" : [...selectedYearFilters].sort().join(", ")}</span>
                  <ChevronDown size={14} className="shrink-0" />
                </button>
                {yearDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 border border-[#2d6a4f]/40 bg-[#0a120a] shadow-2xl">
                    <button type="button" onClick={() => setSelectedYearFilters([])} className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-[#2d6a4f]/10 px-4 py-3 text-left text-xs font-mono uppercase tracking-wider ${selectedYearFilters.length === 0 ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14]"}`}><span>Todos os anos</span>{selectedYearFilters.length === 0 && <Check size={14} />}</button>
                    {years.map(year => {
                      const selected = selectedYearFilters.includes(year);
                      return <button key={year} type="button" aria-pressed={selected} onClick={() => toggleYearFilter(year)} className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-[#2d6a4f]/10 px-4 py-3 text-left text-xs font-mono uppercase tracking-wider last:border-b-0 ${selected ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14]"}`}><span>{year}</span>{selected && <Check size={14} />}</button>;
                    })}
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Filtrar por pessoa marcada</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <div data-person-multiselect className="relative w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPersonDropdownOpen(open => !open)}
                    className={`w-full sm:w-72 flex items-center justify-between gap-3 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${selectedPersonFilters.length > 0 ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                  >
                    <span>
                      {selectedPersonFilters.length === 0
                        ? "Selecionar pessoas"
                        : selectedPersonFilters.length === 1
                          ? "1 pessoa selecionada"
                          : `${selectedPersonFilters.length} pessoas selecionadas`}
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  {personDropdownOpen && (
                    <div className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-2 z-30 bg-[#0a120a] border border-[#2d6a4f]/40 shadow-2xl max-h-72 overflow-y-auto">
                      <button type="button" onClick={() => setSelectedPersonFilters([])} className={`flex min-h-11 w-full items-center justify-between gap-3 border-b border-[#2d6a4f]/10 px-4 py-3 text-left transition-colors ${selectedPersonFilters.length === 0 ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14]"}`}><span className="text-xs font-mono uppercase tracking-wider">Todas as pessoas</span>{selectedPersonFilters.length === 0 && <Check size={11} />}</button>
                      {taggedNames.length === 0 ? (
                        <p className="px-4 py-3 text-[#7a9a7a] text-xs font-mono">Nenhuma pessoa marcada.</p>
                      ) : (
                        taggedNames.map(name => {
                          const selected = selectedPersonFilters.includes(name);
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => togglePersonFilter(name)}
                              className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-left border-b border-[#2d6a4f]/10 last:border-b-0 transition-colors ${selected ? "bg-[#1a2e1a] text-[#f0ebe0]" : "text-[#7a9a7a] hover:bg-[#141f14] hover:text-[#f0ebe0]"}`}
                            >
                              <span className="text-xs font-mono uppercase tracking-wider">{name}</span>
                              <span className={`w-4 h-4 border flex items-center justify-center ${selected ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/50"}`}>
                                {selected && <Check size={11} />}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {filteredPhotos.length === 0 && <EmptyState title="Nenhuma foto encontrada" subtitle="Ajuste os filtros ou envie uma foto antiga para moderação." />}
            {filteredPhotos.map(p => {
              const photoStats = stats[p.id] ?? { photo_id: p.id, likes_count: 0, comments_count: 0 };
              const liked = likedPhotoIds.includes(p.id);
              const tags = ((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? [])
                .filter(tag => !tag.status || tag.status === "approved")
                .map(tag => tag.tagged_name_snapshot)
                .filter(Boolean)
                .slice(0, 3);
              return (
                <div key={p.id} className="relative group overflow-hidden bg-[#1a2e1a] aspect-[4/3]">
                  <button onClick={() => { onSelectPhoto(p.id); navigate("photo-detail"); }} className="absolute inset-0 text-left">
                    <img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#080f08] via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <p className="text-[#f0ebe0] font-bold text-sm leading-tight">{p.caption}</p>
                      <p className="text-[#7a9a7a] text-xs mt-1 flex items-center gap-1"><MapPin size={10} />{p.location_text}</p>
                      {tags.length > 0 && <p className="text-[#c9a84c] text-[10px] font-mono mt-2">Na foto: {tags.join(", ")}</p>}
                    </div>
                  </button>
                  <div className="absolute top-3 left-3 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1">{p.year_approx}</div>
                  {p.is_featured && <div className="absolute top-3 right-3 bg-[#0d1a0f]/85 text-[#c9a84c] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1 flex items-center gap-1"><Star size={10} />Destaque</div>}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2 text-[#f0ebe0] text-xs font-mono bg-[#0a120a]/80 px-2 py-1">
                      <Heart size={12} />{photoStats.likes_count}
                      <MessageCircle size={12} />{photoStats.comments_count}
                    </div>
                    <button disabled={busyLike === p.id} onClick={(e) => { e.stopPropagation(); toggleLike(p.id); }} className={`pointer-events-auto border px-2 py-1 text-xs font-mono transition-colors ${liked ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "bg-[#0a120a]/80 border-[#2d6a4f]/40 text-[#f0ebe0] hover:border-[#c9a84c]"}`}>
                      <Heart size={12} fill={liked ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {popularPhotos.length > 0 && (
            <div className="mt-12 bg-[#141f14] border border-[#2d6a4f]/25 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Fotos mais curtidas</p>
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                {popularPhotos.map(p => (
                  <button key={p.id} onClick={() => { onSelectPhoto(p.id); navigate("photo-detail"); }} className="relative aspect-square overflow-hidden bg-[#0a120a]">
                    <img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover opacity-80" />
                    <span className="absolute bottom-2 left-2 bg-[#0a120a]/80 text-[#f0ebe0] text-[10px] font-mono px-2 py-1 flex items-center gap-1"><Heart size={10} />{stats[p.id]?.likes_count ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 bg-[#141f14] border border-dashed border-[#2d6a4f]/40 p-12 text-center">
            <Camera size={32} className="text-[#7a9a7a] mx-auto mb-4" />
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-2">Tem uma foto dessa época?</p>
            <p className="text-[#7a9a7a] text-sm mb-6">Contribua com o mural. Todas as fotos passam por moderação antes de serem publicadas.</p>
            <Btn onClick={() => setUploadOpen(true)}><Upload size={16} />Enviar foto</Btn>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── PHOTO DETAIL ─────────────────────────────────────────────────────────────

export function PhotoDetailPage({ navigate, people, auth, photo }: {
  navigate: (p: Page) => void; people: DbPerson[]; auth: AuthState; photo: DbPhoto | null;
}) {
  const [tagSearch, setTagSearch] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [removalReason, setRemovalReason] = useState("");
  const [showRemoval, setShowRemoval] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState<DbPhotoComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [busy, setBusy] = useState("");
  const tagResults = people.filter(a =>
    a.full_name.toLowerCase().includes(tagSearch.toLowerCase()) && tagSearch.length > 1
  ).slice(0, 4);

  async function loadInteractions() {
    if (!photo) return;
    const [likes, approvedComments, myLikes] = await Promise.all([
      getPhotoStats([photo.id]),
      getApprovedPhotoComments(photo.id),
      auth.loggedIn ? getMyPhotoLikes(auth.userId) : Promise.resolve([]),
    ]);
    setLikesCount(likes[photo.id]?.likes_count ?? 0);
    setComments(approvedComments);
    setLiked(myLikes.includes(photo.id));
  }

  useEffect(() => { loadInteractions().catch(() => {}); }, [photo?.id, auth.loggedIn, auth.userId]);

  async function toggleLike() {
    if (!photo) return;
    if (!auth.loggedIn) { navigate("login"); return; }
    setBusy("like"); setError("");
    try {
      if (liked) await unlikePhoto(photo.id, auth.userId);
      else await likePhoto(photo.id, auth.userId);
      await loadInteractions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar curtida.");
    } finally { setBusy(""); }
  }

  async function submitComment() {
    if (!photo) return;
    if (!auth.loggedIn) { navigate("login"); return; }
    if (commentText.trim().length < 3) { setError("Escreva um comentário com pelo menos 3 caracteres."); return; }
    setBusy("comment"); setError(""); setMessage("");
    try {
      await createPhotoComment({ photoId: photo.id, userId: auth.userId, authorName: auth.name, commentText: commentText.trim() });
      setCommentText("");
      setMessage("Comentário enviado para moderação.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar comentário.");
    } finally { setBusy(""); }
  }

  async function addTag(person: DbPerson) {
    if (!photo || !auth.loggedIn) { setError("Faça login para marcar pessoas."); return; }
    setError(""); setMessage("");
    try {
      await supabase.from("photo_tags").insert({
        photo_id: photo.id,
        person_id: person.id,
        tagged_name_snapshot: person.full_name,
        status: "pending",
        created_by_user_id: auth.userId,
      });
      await writeAudit("create_photo_tag", "photo_tags", null, { photo_id: photo.id, person_id: person.id });
      setMessage("Marcação enviada para moderação.");
      setTagSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar marcação.");
    }
  }

  async function requestRemoval() {
    if (!photo || !auth.loggedIn) { setError("Faça login para solicitar remoção."); return; }
    if (!removalReason.trim()) { setError("Informe o motivo da remoção."); return; }
    setError(""); setMessage("");
    try {
      await createPhotoRemovalRequest({
        photoId: photo.id,
        userId: auth.userId,
        requesterName: auth.name,
        requesterEmail: auth.email ?? "",
        reason: removalReason,
      });
      setMessage("Solicitação de remoção enviada.");
      setShowRemoval(false);
      setRemovalReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar remoção.");
    }
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar à Nossa História</button>
          <EmptyState title="Foto não encontrada" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar à Nossa História
        </button>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="relative overflow-hidden bg-[#1a2e1a] aspect-[4/3]">
              <img src={photo.image_url} alt={photo.caption ?? "Foto"} className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5">{photo.year_approx}</div>
              {photo.is_featured && <div className="absolute top-4 right-4 bg-[#0d1a0f]/85 text-[#c9a84c] font-mono font-bold text-[10px] uppercase tracking-wider px-3 py-1.5 flex items-center gap-1"><Star size={12} />Destaque</div>}
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">{photo.year_approx} · {photo.location_text}</p>
              <DisplayTitle className="text-2xl md:text-3xl mb-2">{photo.caption}</DisplayTitle>
              <p className="text-[#7a9a7a] text-sm flex items-center gap-2"><MapPin size={14} />{photo.location_text}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={toggleLike} disabled={busy === "like"} className={`border px-4 py-3 flex items-center justify-center gap-2 text-sm font-mono ${liked ? "bg-[#c9a84c] border-[#c9a84c] text-[#0d1a0f]" : "border-[#2d6a4f]/40 text-[#f0ebe0] hover:border-[#c9a84c]"}`}>
                <Heart size={16} fill={liked ? "currentColor" : "none"} />{likesCount} curtidas
              </button>
              <div className="border border-[#2d6a4f]/30 px-4 py-3 flex items-center justify-center gap-2 text-[#7a9a7a] text-sm font-mono">
                <MessageCircle size={16} />{comments.length} comentários
              </div>
            </div>
            {message && <p className="text-[#74c69d] text-xs font-mono bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 px-4 py-3">{message}</p>}
            {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}

            <div className="border-t border-[#2d6a4f]/20 pt-4">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">Comentários</p>
              <div className="flex flex-col gap-3 mb-4 max-h-52 overflow-y-auto pr-1">
                {comments.length === 0 ? <p className="text-[#7a9a7a] text-sm">Ainda não há comentários aprovados.</p> : comments.map(comment => (
                  <div key={comment.id} className="bg-[#141f14] border border-[#2d6a4f]/20 p-3">
                    <p className="text-[#f0ebe0] text-sm">{comment.comment_text}</p>
                    <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{comment.author_name ?? "Ex-aluno"} · {comment.created_at?.slice(0, 10)}</p>
                  </div>
                ))}
              </div>
              <FieldArea label="Novo comentário" value={commentText} onChange={setCommentText} rows={2} />
              <Btn full size="sm" onClick={submitComment} disabled={busy === "comment"}><Send size={14} />Enviar para moderação</Btn>
            </div>

            <div className="border-t border-[#2d6a4f]/20 pt-4">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">Marcar pessoas</p>
              <div className="relative mt-3">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input placeholder="Marcar alguém da turma..." value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                  className="w-full bg-[#141f14] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
              {tagResults.length > 0 && (
                <div className="border border-[#2d6a4f]/20 bg-[#0a120a] mt-1">
                  {tagResults.map(a => (
                    <button key={a.id} onClick={() => addTag(a)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141f14] text-left border-b border-[#2d6a4f]/10 last:border-0">
                      <div className="w-7 h-7 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] text-xs font-mono font-bold shrink-0">{initials(a.full_name)}</div>
                      <span className="text-[#f0ebe0] text-sm">{a.full_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {showRemoval && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-4">
                <FieldArea label="Motivo da remoção" value={removalReason} onChange={setRemovalReason} />
                <div className="flex gap-2 mt-3">
                  <Btn size="sm" onClick={requestRemoval}>Enviar solicitação</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setShowRemoval(false)}>Cancelar</Btn>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => window.open(photo.image_url, "_blank")}><Download size={16} />Baixar foto</Btn>
              <Btn full variant="ghost" onClick={() => setShowRemoval(true)}><AlertCircle size={16} />Solicitar remoção da foto</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── CURIOSIDADES ─────────────────────────────────────────────────────────────

type CuriosityChartMode = "questionnaire" | "life";

function StatCard({ label, value, hint, icon }: { label: string; value: React.ReactNode; hint?: string; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 flex items-start justify-between gap-4">
      <div>
        <p className="text-[#c9a84c] font-mono text-3xl font-bold leading-none">{value}</p>
        <p className="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider mt-2">{label}</p>
        {hint && <p className="text-[#3a5a3a] text-xs mt-2 leading-relaxed">{hint}</p>}
      </div>
      {icon && <div className="text-[#2d6a4f] shrink-0">{icon}</div>}
    </div>
  );
}

function MiniBarChart({ title, description, rows, emptyLabel = "Dados ainda insuficientes." }: {
  title: string;
  description?: string;
  rows: { label: string; count: number }[];
  emptyLabel?: string;
}) {
  const cleanRows = rows.filter(row => row.count > 0).slice(0, 8);
  const max = Math.max(...cleanRows.map(row => row.count), 1);
  return (
    <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
      <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Infográfico</p>
      <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{title}</h3>
      {description && <p className="text-[#7a9a7a] text-sm mt-2 mb-5 leading-relaxed">{description}</p>}
      {!cleanRows.length ? (
        <p className="text-[#7a9a7a] text-sm mt-5">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-4 mt-5">
          {cleanRows.map(row => {
            const width = Math.max(8, Math.round((row.count / max) * 100));
            return (
              <div key={row.label}>
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <span className="text-[#f0ebe0] text-sm font-semibold">{row.label}</span>
                  <span className="text-[#c9a84c] font-mono text-xs">{row.count}</span>
                </div>
                <div className="h-2.5 bg-[#0d1a0f] border border-[#2d6a4f]/20 overflow-hidden">
                  <div className="h-full bg-[#2d6a4f]" style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getQuestionTitle(questionId: string) {
  return SCHOOL_PROFILE_QUESTIONS.find(question => question.id === questionId)?.title ?? questionId;
}

function groupQuestionnaireStats(rows: SchoolQuestionnaireOptionStatRow[]) {
  const grouped = new Map<string, { label: string; count: number }[]>();
  for (const row of rows) {
    const current = grouped.get(row.question_id) ?? [];
    current.push({ label: row.option_label, count: row.answer_count });
    grouped.set(row.question_id, current);
  }
  return SCHOOL_PROFILE_QUESTIONS.map(question => ({
    id: question.id,
    title: question.title,
    rows: (grouped.get(question.id) ?? []).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "pt-BR")),
  }));
}

export function CuriositiesPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [polls, setPolls] = useState<(DbPoll & { poll_options?: DbPollOption[] })[]>([]);
  const [results, setResults] = useState<Record<string, Record<string, number>>>({});
  const [myVotes, setMyVotes] = useState<DbPollVote[]>([]);
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [questionnaireStats, setQuestionnaireStats] = useState<SchoolQuestionnaireOptionStatRow[]>([]);
  const [profileStats, setProfileStats] = useState<CuriosityProfileStatsRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCuriosities() {
    setLoading(true);
    setError("");
    try {
      const [pollData, questionnaireData, profileData, locationData] = await Promise.all([
        getPolls(DEFAULT_EVENT_ID),
        getSchoolQuestionnaireOptionStats(DEFAULT_EVENT_ID).catch(() => []),
        getCuriosityProfileStats(DEFAULT_EVENT_ID).catch(() => null),
        getPublicLocationStats().catch(() => []),
      ]);
      setPolls(pollData);
      setQuestionnaireStats(questionnaireData);
      setProfileStats(profileData);
      setLocations(locationData);

      const nextResults: Record<string, Record<string, number>> = {};
      for (const poll of pollData) nextResults[poll.id] = await getPollResults(poll.id);
      setResults(nextResults);
      if (auth.loggedIn) setMyVotes(await getMyPollVotes(auth.userId, pollData.map(p => p.id)));
      else setMyVotes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar curiosidades.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCuriosities(); }, [auth.loggedIn, auth.userId]);

  async function submitVote(poll: DbPoll & { poll_options?: DbPollOption[] }, optionId: string) {
    if (!auth.loggedIn) { navigate("login"); return; }
    setBusy(optionId);
    setError("");
    setMessage("");
    try {
      await votePoll({ pollId: poll.id, optionId, userId: auth.userId, allowMultiple: poll.allow_multiple_votes });
      setMessage("Voto registrado.");
      await loadCuriosities();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar voto.");
    } finally {
      setBusy(null);
    }
  }

  function totalVotes(pollId: string): number {
    return Object.values(results[pollId] ?? {}).reduce<number>((sum, value) => sum + Number(value), 0);
  }

  const questionGroups = groupQuestionnaireStats(questionnaireStats);
  const relationshipRows = profileStats?.relationship_status_counts ?? [];
  const childrenRows = profileStats?.children_status_counts ?? [];
  const professionRows = profileStats?.profession_area_counts ?? [];

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <section className="mb-10 w-full text-left">
          <SectionLabel>Curiosidades da turma</SectionLabel>
          <DisplayTitle className="text-5xl md:text-7xl">O raio-X da Turma 2006</DisplayTitle>
          <p data-curiosities-intro className="mt-4 max-w-[48rem] text-left leading-relaxed text-[#8ab89a]">
            Dados, lembranças, mapa, profissões, relacionamentos e enquetes sobre quem a gente era no HC — e quem a turma se tornou 20 anos depois.
          </p>
        </section>

        {error && <ErrorState message={error} onRetry={loadCuriosities} />}
        {loading && <LoadingState message="Carregando curiosidades..." />}

        {!loading && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <StatCard label="Pré-cadastrados" value={profileStats?.total_people ?? "—"} icon={<Users size={28} />} />
              <StatCard label="Cadastrados" value={profileStats?.total_registered ?? "—"} icon={<UserCheck size={28} />} />
              <StatCard label="Pré-confirmados" value={profileStats?.total_preconfirmed ?? "—"} icon={<CheckCircle2 size={28} />} />
              <StatCard label="Confirmados" value={profileStats?.total_confirmed ?? "—"} icon={<Ticket size={28} />} />
              <StatCard label="Cidades" value={locations.length} hint="Com exibição autorizada" icon={<MapPin size={28} />} />
              <StatCard label="Áreas profissionais" value={professionRows.filter(row => row.label !== "Não informado").length || "—"} icon={<BriefcaseIcon />} />
              <StatCard label="Com filhos" value={profileStats?.total_with_children ?? "—"} icon={<Heart size={28} />} />
              <StatCard label="Filhos declarados" value={profileStats?.total_children_declared ?? "—"} icon={<Users size={28} />} />
            </section>

            <section className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Tempos de escola</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">O que a turma contou no cadastro</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">Os gráficos usam respostas multisselecionáveis do questionário de 5 etapas da mini bio.</p>
                </div>
                <Btn data-questionnaire-cta variant="outline" className="whitespace-nowrap" onClick={() => navigate("claim-profile")}><UserCheck size={16} />Já respondeu?</Btn>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {questionGroups.map(group => (
                  <MiniBarChart key={group.id} title={group.title} rows={group.rows} emptyLabel="Ainda não há respostas suficientes para esta pergunta." />
                ))}
              </div>
            </section>

            <section className="mb-12">
              <SectionLabel>Como a vida seguiu</SectionLabel>
              <DisplayTitle className="text-4xl md:text-5xl mb-6">Relacionamentos, filhos e profissões</DisplayTitle>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <MiniBarChart title="Relacionamentos" description="Distribuição agregada dos perfis cadastrados." rows={relationshipRows} />
                <MiniBarChart title="Filhos" description="Dados declarados no cadastro, exibidos somente de forma agregada." rows={childrenRows} />
                <MiniBarChart title="Profissões por área" description="Agrupamento aproximado das profissões informadas publicamente." rows={professionRows} />
              </div>
            </section>

            <section className="mb-12">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Mapa da turma</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">Onde a turma está hoje</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">Apenas cidades autorizadas nos perfis aparecem aqui.</p>
                </div>
                <Btn variant="outline" onClick={() => navigate("ex-alumni")}><Users size={16} />Ver ex-alunos</Btn>
              </div>
              {locations.length === 0 ? (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
                  <EmptyState icon={<MapPin size={42} />} title="Mapa ainda sem dados públicos" subtitle="As cidades aparecerão conforme os ex-alunos autorizarem a exibição da localização." />
                </div>
              ) : (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 md:p-6">
                  <HomeMapChart
                    configs={[
                      { key: "foreign", label: "Exterior" },
                      { key: "other_state", label: "Outros estados" },
                      { key: "interior", label: "Interior do RN" },
                      { key: "natal", label: "Natal/RN" },
                    ] as HomeMapStatConfig[]}
                    locations={locations}
                  />
                </div>
              )}
            </section>

            <section>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6">
                <div>
                  <SectionLabel>Enquetes da turma</SectionLabel>
                  <DisplayTitle className="text-4xl md:text-5xl">Vote nas memórias da turma</DisplayTitle>
                  <p className="text-[#7a9a7a] mt-3 max-w-2xl">As enquetes continuam aqui, agora dentro do painel de curiosidades.</p>
                </div>
              </div>

              {message && <div className="mb-6 bg-[#0d2e1a] border border-[#2d6a4f] p-4 text-[#74c69d] text-sm font-mono">{message}</div>}
              {polls.length === 0 && (
                <EmptyState icon={<BarChart3 size={42} />} title="Nenhuma enquete aberta" subtitle="A organização ainda não abriu votações para a turma." />
              )}

              {polls.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {polls.map(poll => {
                    const options = [...(poll.poll_options ?? [])].sort((a, b) => a.sort_order - b.sort_order);
                    const total = Math.max(totalVotes(poll.id), 1);
                    const votedOptions = myVotes.filter(v => v.poll_id === poll.id).map(v => v.option_id);
                    const hasVoted = votedOptions.length > 0;
                    return (
                      <div data-poll-card key={poll.id} className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5">
                        <div data-poll-card-heading className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Enquete</p>
                            <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-[#7a9a7a] text-sm mt-2">{poll.description}</p>}
                          </div>
                          <span data-poll-status className="shrink-0"><StatusBadge status={poll.status} /></span>
                        </div>

                        <div className="flex flex-col gap-3">
                          {options.map(option => {
                            const count = results[poll.id]?.[option.id] ?? 0;
                            const percent = Math.round((count / total) * 100);
                            const voted = votedOptions.includes(option.id);
                            const disabled = !auth.loggedIn || poll.status !== "open" || busy === option.id || (hasVoted && !poll.allow_multiple_votes);
                            return (
                              <button key={option.id} disabled={disabled} onClick={() => submitVote(poll, option.id)}
                                className={`text-left border p-4 transition-colors disabled:cursor-not-allowed ${voted ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#2d6a4f]/60"}`}>
                                <div className={`flex items-center justify-between gap-3 ${hasVoted ? "mb-2" : ""}`}>
                                  <span className="text-[#f0ebe0] text-sm font-semibold">{option.option_text}</span>
                                  {hasVoted && <span className="text-[#7a9a7a] font-mono text-xs">{count} voto{count === 1 ? "" : "s"}</span>}
                                </div>
                                {hasVoted && <>
                                  <div className="h-2 bg-[#1a2e1a] overflow-hidden"><div className="h-full bg-[#2d6a4f]" style={{ width: `${percent}%` }} /></div>
                                  <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{percent}%</p>
                                </>}
                              </button>
                            );
                          })}
                        </div>

                        {!auth.loggedIn && poll.status === "open" && <p className="text-[#c9a84c] text-xs font-mono">Faça login para votar e visualizar os resultados.</p>}
                        {auth.loggedIn && !hasVoted && poll.status === "open" && <p className="text-[#7a9a7a] text-xs font-mono">Os resultados serão exibidos depois do seu voto.</p>}
                        {poll.allow_multiple_votes && <p className="text-[#7a9a7a] text-xs font-mono">Esta enquete permite múltiplos votos.</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function BriefcaseIcon() {
  return <FileText size={28} />;
}

// ─── WHERE NOW ────────────────────────────────────────────────────────────────

export function WhereNowPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [locations, setLocations] = useState<LocationStat[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<DbPerson | null>(null);
  const [selectedLocationProfile, setSelectedLocationProfile] = useState<PublicLocationRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadLocations() {
    setLoading(true);
    setError("");
    try {
      setLocations(await getPublicLocationStats());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar mapa da turma.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadLocations(); }, []);

  const selected = locations.find(item => item.key === selectedKey) ?? locations[0] ?? null;
  const totalPeople = locations.reduce((sum, item) => sum + item.count, 0);

  return (
    <>
      <PersonDetailModal
        person={selectedPerson}
        profile={selectedLocationProfile}
        onClose={() => { setSelectedPerson(null); setSelectedLocationProfile(null); }}
      />

      <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
            <div>
              <SectionLabel>Onde a turma está hoje</SectionLabel>
              <DisplayTitle className="text-4xl md:text-6xl">Mapa afetivo da Turma 2006</DisplayTitle>
              <p className="text-[#7a9a7a] mt-3 max-w-2xl">Apenas localizações autorizadas aparecem aqui. Os dados vêm dos perfis públicos dos ex-alunos.</p>
            </div>
            <Btn variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={16} />Atualizar perfil</Btn>
          </div>

          {error && <ErrorState message={error} onRetry={loadLocations} />}
          {loading && <LoadingState message="Carregando localizações..." />}

          {!loading && locations.length === 0 && (
            <EmptyState
              icon={<MapPin size={42} />}
              title="Nenhuma localização pública"
              subtitle="Os ex-alunos precisam autorizar a exibição da cidade no perfil."
              action={<Btn onClick={() => navigate("edit-profile")}>Atualizar meu perfil</Btn>}
            />
          )}

          {!loading && locations.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6">
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">Localizações públicas</p>
                    <p className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">{totalPeople} pessoas em {locations.length} lugares</p>
                  </div>
                  <MapPin size={34} className="text-[#2d6a4f]" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {locations.map(item => (
                    <button key={item.key} onClick={() => setSelectedKey(item.key)}
                      className={`text-left border p-4 transition-colors ${selected?.key === item.key ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#2d6a4f]/60"}`}>
                      <p className="text-[#f0ebe0] font-semibold">{item.city}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono">{[item.state, item.country].filter(Boolean).join(" · ")}</p>
                      <p className="text-[#c9a84c] text-xs font-mono mt-2">{item.count} ex-aluno{item.count === 1 ? "" : "s"}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                {selected ? (
                  <>
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">{selected.city}</p>
                    <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold mb-5">Quem está por lá</h3>

                    <div className="flex flex-col gap-3">
                      {selected.people.map(person => {
                        const personDetails = people.find(item => item.id === person.person_id) ?? null;
                        const avatarUrl = personDetails?.avatar_url ?? person.avatar_url ?? null;
                        const displayName = person.display_name ?? person.full_name;

                        return (
                          <button
                            key={person.profile_id}
                            onClick={() => {
                              if (!personDetails) return;
                              setSelectedPerson(personDetails);
                              setSelectedLocationProfile(person);
                            }}
                            className="w-full text-left flex items-center gap-3 border border-[#2d6a4f]/20 bg-[#0d1a0f] p-3 hover:border-[#2d6a4f]/60 transition-colors"
                          >
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={displayName} className="w-10 h-10 object-cover bg-[#1a2e1a] shrink-0" loading="lazy" />
                            ) : (
                              <div className="w-10 h-10 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-mono font-bold text-xs shrink-0">{initials(displayName)}</div>
                            )}

                            <div>
                              <p className="text-[#f0ebe0] text-sm font-semibold">{displayName}</p>
                              {person.show_profession && person.profession && <p className="text-[#7a9a7a] text-xs">{person.profession}</p>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <EmptyState title="Selecione uma localidade" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── SHARE INVITE ─────────────────────────────────────────────────────────────

export function ShareInvitePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [useName, setUseName] = useState(true);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    async function loadInviteData() {
      setLoading(true);
      try {
        const [eventData, ticketData] = await Promise.all([
          getEventSettings().catch(() => null),
          auth.loggedIn ? getMyTickets(auth.userId, auth.email).catch(() => []) : Promise.resolve([]),
        ]);
        if (!active) return;
        setEvent(eventData);
        setTickets(ticketData);
      } finally {
        if (active) setLoading(false);
      }
    }
    loadInviteData();
    return () => { active = false; };
  }, [auth.loggedIn, auth.userId, auth.email]);

  const hasApprovedTicket = tickets.some(t => ticketPaymentStatus(t) === "approved");
  const dateLabel = eventDateTimeLabel(event);
  const locationLabel = event?.location_name ?? "Natal, Rio Grande do Norte";
  const inviteText = `${useName && auth.loggedIn ? auth.name + " vai ao" : "Eu vou ao"} reencontro da Turma 2006 do Colégio Henrique Castriciano — 20 anos depois. ${dateLabel}, em ${locationLabel}. Vamos juntos?`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(inviteText)}`;

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteText);
      setMessage("Texto copiado.");
    } catch {
      setMessage("Copie manualmente o texto do convite.");
    }
  }

  async function nativeShare() {
    const nav = navigator as Navigator & { share?: (data: { title?: string; text?: string }) => Promise<void> };
    if (nav.share) {
      await nav.share({ title: "Reencontro Turma 2006", text: inviteText });
    } else {
      window.open(whatsappUrl, "_blank");
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate(auth.loggedIn ? "alumni-area" : "home")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar</button>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_0.9fr] gap-8 items-start">
          <div>
            <SectionLabel>Convite compartilhável</SectionLabel>
            <DisplayTitle className="text-4xl md:text-6xl mb-4">Chame a turma para o reencontro</DisplayTitle>
            <p className="text-[#7a9a7a] leading-relaxed mb-6">Use este cartão para divulgar o reencontro. A versão sem nome preserva sua privacidade.</p>
            {loading && <LoadingState message="Carregando dados do convite..." />}
            {!loading && auth.loggedIn && (
              <div className="mb-4 flex flex-wrap gap-2">
                <StatusBadge status={hasApprovedTicket ? "approved" : "pending"} />
                <span className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">{hasApprovedTicket ? "Ingresso aprovado" : "Ingresso não localizado/aprovado"}</span>
              </div>
            )}
            <label className="flex items-center gap-3 bg-[#141f14] border border-[#2d6a4f]/30 p-4 mb-4 cursor-pointer">
              <input type="checkbox" checked={useName} onChange={e => setUseName(e.target.checked)} className="accent-[#2d6a4f]" disabled={!auth.loggedIn} />
              <span className="text-[#f0ebe0] text-sm">Usar meu nome no convite {auth.loggedIn ? "" : "(faça login para ativar)"}</span>
            </label>
            {message && <p className="text-[#74c69d] text-sm font-mono mb-4">{message}</p>}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Btn onClick={nativeShare}><Send size={16} />Compartilhar</Btn>
              <Btn variant="outline" onClick={() => window.open(whatsappUrl, "_blank")}><Phone size={16} />WhatsApp</Btn>
              <Btn variant="ghost" onClick={copyInvite}><FileText size={16} />Copiar texto</Btn>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {auth.loggedIn && <Btn variant="ghost" onClick={() => navigate("my-ticket")}><Ticket size={16} />Meu ingresso</Btn>}
              <Btn variant="ghost" onClick={() => navigate("tickets")}><CreditCard size={16} />Comprar ingresso</Btn>
            </div>
            <p className="text-[#7a9a7a] text-xs font-mono mt-6">Compartilhamento disponivel por texto, Web Share API e WhatsApp.</p>
          </div>

          <div className="bg-[#f0ebe0] text-[#0d1a0f] p-8 shadow-2xl border-8 border-[#c9a84c]">
            <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#2d6a4f] mb-8">Colégio Henrique Castriciano</p>
            <h3 className="font-['Playfair_Display'] text-4xl font-black leading-none mb-6">Eu vou ao reencontro da Turma 2006</h3>
            {useName && auth.loggedIn && <p className="text-[#2d6a4f] font-bold text-lg mb-6">{auth.name}</p>}
            <div className="h-px bg-[#c9a84c] my-6" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Data</p><p className="font-bold">{dateLabel.split(" · ")[0]}</p></div>
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Hora</p><p className="font-bold">{dateLabel.split(" · ")[1] ?? "19h"}</p></div>
              <div className="col-span-2"><p className="font-mono text-[10px] uppercase tracking-widest text-[#66745B]">Local</p><p className="font-bold">{locationLabel}</p></div>
            </div>
            <p className="mt-8 text-xs leading-relaxed text-[#5b4636]">20 anos depois, a turma se reencontra para celebrar histórias, fotos antigas e vínculos que atravessaram o tempo.</p>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── MY TICKET PAGE ───────────────────────────────────────────────────────────

export function MyTicketPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  async function loadTicket() {
    setLoading(true);
    setError("");
    try {
      const [ticketData, eventData] = await Promise.all([
        getMyTickets(auth.userId, auth.email),
        getEventSettings().catch(() => null),
      ]);
      setTickets(ticketData);
      setEvent(eventData);
      if (!selectedId && ticketData[0]) setSelectedId(ticketData[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar ingresso.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadTicket(); }, [auth.userId, auth.email]);

  const ticket = tickets.find(t => t.id === selectedId) ?? tickets[0] ?? null;
  const paymentStatus = ticketPaymentStatus(ticket);
  const ticketStatus = ticket?.checked_in ? "checked_in" : paymentStatus;
  const eventName = event?.title ?? "Turma 2006 — 20 anos depois";
  const eventLocation = event?.location_name ?? "Local a confirmar";
  const eventAddress = event?.location_address ?? "Endereço será informado pela organização.";

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("alumni-area")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Minha área</button>
        <SectionLabel>Meu ingresso</SectionLabel>
        <DisplayTitle className="text-4xl md:text-6xl mb-4">Entrada do reencontro</DisplayTitle>
        <p className="text-[#8ab89a] text-sm md:text-base max-w-2xl mb-10">Confira o status do pagamento e apresente o código no check-in do evento.</p>

        {loading && <LoadingState message="Carregando ingresso..." />}
        {error && <ErrorState message={error} onRetry={loadTicket} />}
        {!loading && !error && tickets.length === 0 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
            <EmptyState title="Nenhum ingresso encontrado" subtitle="Não localizamos ingressos vinculados ao seu e-mail de login. Compre um ingresso ou entre em contato com a organização." />
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Btn onClick={() => navigate("tickets")}><CreditCard size={16} />Comprar ingresso</Btn>
              <Btn variant="outline" onClick={() => navigate("home")}><Mail size={16} />Contato da organização</Btn>
            </div>
          </div>
        )}

        {!loading && !error && ticket && (
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8 items-start">
            <div className="bg-[#f0ebe0] text-[#0d1a0f] border-8 border-[#c9a84c] p-8 text-center">
              <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-[#2d6a4f] mb-6">Ingresso oficial</p>
              <div className="w-48 h-48 mx-auto bg-white border-4 border-[#0d1a0f] flex items-center justify-center mb-6">
                <QrCode size={128} className="text-[#0d1a0f]" />
              </div>
              <p className="font-mono text-lg font-bold tracking-widest break-all">{ticket.qr_code}</p>
              <p className="text-xs text-[#5b4636] mt-3">Apresente este código na entrada junto com um documento.</p>
              <div className="mt-6 flex justify-center"><StatusBadge status={ticketStatus} /></div>
            </div>

            <div className="flex flex-col gap-6">
              {tickets.length > 1 && (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-4">
                  <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-3">Selecionar ingresso</p>
                  <div className="flex flex-wrap gap-2">
                    {tickets.map(item => <button key={item.id} onClick={() => setSelectedId(item.id)} className={`px-4 py-2 text-xs font-mono border ${item.id === ticket.id ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a]"}`}>{item.attendee_name}</button>)}
                  </div>
                </div>
              )}

              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">Participante</p>
                    <h2 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold">{ticket.attendee_name}</h2>
                    <p className="text-[#7a9a7a] text-sm font-mono mt-1">{ticket.attendee_email}</p>
                  </div>
                  <div className="flex flex-wrap gap-2"><StatusBadge status={paymentStatus} />{ticket.checked_in && <StatusBadge status="checked_in" />}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <InfoRow label="Tipo" value={ticketTypeName(ticket)} />
                  <InfoRow label="Telefone" value={ticket.attendee_phone ?? "Não informado"} />
                  <InfoRow label="Acompanhante" value={ticket.guest_name ?? "Não informado"} />
                  <InfoRow label="Check-in" value={ticket.checked_in ? `Realizado ${formatDateTimeBR(ticket.checked_in_at)}` : "Ainda não realizado"} />
                  <InfoRow label="Pagamento" value={paymentStatus} />
                  <InfoRow label="Pedido" value={ticket.order_id} />
                </div>
              </div>

              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-4">Dados do evento</p>
                <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold mb-2">{eventName}</h3>
                <div className="flex flex-col gap-2 text-sm text-[#8ab89a]">
                  <p className="flex items-center gap-2"><Calendar size={14} />{eventDateTimeLabel(event)}</p>
                  <p className="flex items-center gap-2"><MapPin size={14} />{eventLocation}</p>
                  <p className="text-[#7a9a7a]">{eventAddress}</p>
                </div>
              </div>

              <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-6">
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-3">Instruções e termos</p>
                <ul className="text-[#8ab89a] text-sm leading-relaxed list-disc pl-5 space-y-2">
                  <li>Apresente o QR Code ou o código textual na entrada.</li>
                  <li>O ingresso é nominal e deve estar com pagamento aprovado.</li>
                  <li>Depois do check-in, o mesmo código não poderá ser reutilizado.</li>
                  <li>Em caso de divergência, procure a organização do evento.</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4 flex gap-3 items-start">
      {icon && <div className="text-[#c9a84c] mt-0.5 shrink-0">{icon}</div>}
      <div>
        <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-widest mb-1">{label}</p>
        <p className="text-[#f0ebe0] text-sm break-words">{value}</p>
      </div>
    </div>
  );
}

// ─── ARCHIVE PAGE ─────────────────────────────────────────────────────────────

export function ArchivePage({ navigate }: { navigate: (p: Page) => void; auth: AuthState; photos: DbPhoto[]; people: DbPerson[] }) {
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [settings, setSettings] = useState<DbEventArchiveSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadArchive() {
      setLoading(true);
      setError("");
      try {
        const [eventData, settingsData] = await Promise.all([
          getEventSettings().catch(() => null),
          getEventArchiveSettings(DEFAULT_EVENT_ID).catch(() => null),
        ]);
        if (!active) return;
        setEvent(eventData);
        setSettings(settingsData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar acervo.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadArchive();
    return () => { active = false; };
  }, []);

  const dateSource = event ? getEventDateTime(event) : new Date(FALLBACK_EVENT_DATE_TIME);
  const archiveOpen = settings?.archive_enabled ?? Date.now() >= dateSource.getTime();

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel>{settings?.page_eyebrow || "Pós-festa"}</SectionLabel>
          <DisplayTitle className="text-4xl md:text-7xl mb-4">{settings?.page_title || "Memórias do reencontro"}</DisplayTitle>
          {loading && <LoadingState message="Carregando acervo..." />}
          {error && <ErrorState message={error} />}

          {!loading && !archiveOpen && (
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 md:p-12">
              <div className="max-w-3xl">
                <StatusBadge status="closed" />
                <h2 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl md:text-5xl font-bold mt-5 mb-4">{settings?.closed_title || "O acervo será aberto depois do reencontro."}</h2>
                <p className="text-[#8ab89a] leading-relaxed mb-8">{settings?.closed_text || "Depois do evento, esta página reunirá os registros e lembranças aprovados pela organização."}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  {[
                    ["Fotos oficiais", "Seleção da organização"],
                    ["Memórias", "Relatos aprovados da turma"],
                    ["Melhores momentos", "Vídeo e destaques pós-evento"],
                  ].map(([title, body]) => <div key={title} className="bg-[#0a120a] border border-[#2d6a4f]/20 p-5"><p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-2">{title}</p><p className="text-[#7a9a7a] text-sm">{body}</p></div>)}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Btn onClick={() => navigate("tickets")}><CreditCard size={16} />Comprar ingresso</Btn>
                  <Btn variant="outline" onClick={() => navigate("photo-wall")}><Camera size={16} />Ver fotos antigas</Btn>
                  <Btn variant="ghost" onClick={() => navigate("memories")}><MessageCircle size={16} />Ver memórias</Btn>
                </div>
              </div>
            </div>
          )}

          {!loading && archiveOpen && (
            <div className="flex flex-col gap-10">
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
                <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">{settings?.message_label || "Mensagem da organização"}</p>
                <p className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl leading-relaxed">
                  {settings?.post_event_text?.trim() || "Obrigado por fazer parte deste reencontro. Este acervo preserva os registros da noite e as lembrancas que a turma escolheu dividir."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}

// ─── MEMORIES PAGE ────────────────────────────────────────────────────────────

export function MemoriesPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [memoryText, setMemoryText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const maxChars = 420;

  async function loadMemories() {
    setLoading(true);
    setError("");
    try {
      setMemories(await getApprovedMemories(DEFAULT_EVENT_ID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar memórias.");
    } finally { setLoading(false); }
  }

  useEffect(() => { loadMemories(); }, []);

  async function submitMemory() {
    if (!auth.loggedIn) { navigate("login"); return; }
    if (memoryText.trim().length < 10) { setError("Escreva uma memória com pelo menos 10 caracteres."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      await createMemory({
        eventId: DEFAULT_EVENT_ID,
        userId: auth.userId,
        authorName: auth.name,
        memoryText: memoryText.trim().slice(0, maxChars),
        isAnonymous,
      });
      setMemoryText("");
      setIsAnonymous(false);
      setMessage("Memória enviada para moderação.");
      await loadMemories();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar memória.");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar à Nossa História</button>
        <SectionLabel>Caixa de Memórias</SectionLabel>
        <DisplayTitle className="text-4xl md:text-6xl mb-4">O que ficou daquele tempo?</DisplayTitle>
        <p className="text-[#8ab89a] text-sm md:text-base max-w-2xl mb-10">Compartilhe uma lembrança curta da turma, dos professores, dos corredores, das gincanas ou de qualquer momento que mereça ficar no acervo do reencontro.</p>

        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8">
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5 h-fit">
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Enviar memória</p>
            <FieldArea label="Sua memória" value={memoryText} onChange={v => setMemoryText(v.slice(0, maxChars))} rows={6} />
            <div className="flex items-center justify-between text-xs font-mono text-[#7a9a7a]"><span>{memoryText.length}/{maxChars} caracteres</span><StatusBadge status="pending" /></div>
            <label className="flex items-center justify-between cursor-pointer border border-[#2d6a4f]/20 p-4 bg-[#0a120a]">
              <span className="text-[#f0ebe0] text-sm">Enviar sem mostrar meu nome</span>
              <button onClick={() => setIsAnonymous(v => !v)} className={`relative w-12 h-6 transition-colors ${isAnonymous ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}`}>
                <div className={`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all ${isAnonymous ? "left-7" : "left-1"}`} />
              </button>
            </label>
            {message && <p className="text-[#74c69d] text-xs font-mono bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 px-4 py-3">{message}</p>}
            {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
            <Btn full onClick={submitMemory} disabled={busy}><Send size={16} />Enviar para moderação</Btn>
          </div>

          <div className="flex flex-col gap-4">
            {loading && <LoadingState message="Carregando memórias..." />}
            {!loading && memories.length === 0 && <EmptyState title="Nenhuma memória aprovada ainda" subtitle="As memórias enviadas aparecem aqui depois da moderação." />}
            {memories.map(memory => (
              <div key={memory.id} className={`bg-[#141f14] border p-6 ${memory.is_featured ? "border-[#c9a84c]/60" : "border-[#2d6a4f]/25"}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{memory.is_featured ? "Memória destacada" : "Memória da turma"}</p>
                  {memory.is_featured && <Star size={14} className="text-[#c9a84c]" />}
                </div>
                <p className="text-[#f0ebe0] text-lg leading-relaxed font-['Playfair_Display']">“{memory.memory_text}”</p>
                <p className="text-[#7a9a7a] font-mono text-xs mt-4">{memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno")} · {formatDateShortBR(memory.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ALUMNI AREA ──────────────────────────────────────────────────────────────
