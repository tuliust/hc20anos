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

function emptyAdminPersonRow(): AdminImportPersonInput {
  return { full_name: "", display_name: "", gender: null, birth_year: null, class_group: "", avatar_url: "", contact_whatsapp: "", contact_email: "" };
}

function AdminPeopleImportModal({
  open,
  onClose,
  adminId,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  adminId: string;
  onImported: (rows: DbPerson[]) => void;
}) {
  const [rows, setRows] = useState<AdminImportPersonInput[]>([emptyAdminPersonRow()]);
  const [bulkText, setBulkText] = useState("");
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setRows([emptyAdminPersonRow()]);
    setBulkText("");
    setError("");
    setPhotoBusy(null);
  }, [open]);

  function updateRow(index: number, patch: Partial<AdminImportPersonInput>) {
    setRows(current => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  }

  function addBulkTextRows() {
    try {
      const imported = parseParticipantsCsv(bulkText);
      if (!imported.length) throw new Error("Nenhuma linha válida encontrada. Use as colunas: nome_completo; nome_exibicao; genero; ano_nascimento; turma; foto; whatsapp; email.");
      setRows(current => [...current.filter(row => row.full_name.trim()), ...imported]);
      setBulkText("");
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler os dados colados.");
    }
  }

  async function handleFile(file?: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const imported = await parseParticipantImportFile(file);
      if (!imported.length) throw new Error("Nenhuma linha válida encontrada no arquivo.");
      setRows(current => [...current.filter(row => row.full_name.trim()), ...imported]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao importar arquivo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRowAvatar(index: number, file: File) {
    setPhotoBusy(index);
    setError("");
    try {
      const url = await uploadAdminPersonAvatar(adminId, file);
      updateRow(index, { avatar_url: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setPhotoBusy(null);
    }
  }

  async function save() {
    const validRows = rows.filter(row => row.full_name.trim() && row.birth_year && row.class_group?.trim());
    if (!validRows.length) {
      setError("Inclua pelo menos uma pessoa com nome completo, ano de nascimento e turma.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const imported = await importPeopleAdmin(validRows.map(row => ({ ...row, contact_whatsapp: formatWhatsappInput(row.contact_whatsapp ?? "") })), adminId);
      onImported(imported);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar pessoas.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Cadastrar pessoas" wide>
      <div className="flex flex-col gap-6">
        {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
        <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
          <p className="text-[#f0ebe0] font-semibold text-sm mb-1">Pré-cadastro de ex-alunos</p>
          <p className="text-[#7a9a7a] text-xs leading-relaxed">Essas pessoas entram como não reivindicadas e não confirmadas no evento. O usuário depois encontra o nome, valida identidade e completa o próprio perfil.</p>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Cadastro manual</p>
            <Btn size="sm" variant="ghost" onClick={() => setRows(current => [...current, emptyAdminPersonRow()])}>Adicionar linha</Btn>
          </div>
          <div className="flex flex-col gap-4 max-h-[560px] overflow-y-auto pr-1">
            {rows.map((row, index) => (
              <div key={index} className="bg-[#0d1a0f] border border-[#2d6a4f]/20 p-4 flex flex-col gap-4">
                <AvatarCropUpload
                  currentImageUrl={row.avatar_url ?? null}
                  fallbackLabel={initials(row.display_name || row.full_name || "AL")}
                  uploading={photoBusy === index}
                  disabled={busy || photoBusy === index}
                  onCroppedFile={(file) => handleRowAvatar(index, file)}
                  onRemove={row.avatar_url ? () => updateRow(index, { avatar_url: "" }) : undefined}
                  helperText="Use o recorte com zoom e posição para padronizar a foto do pré-cadastro."
                />
                <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_140px_110px_90px] gap-3">
                  <Field label="Nome completo *" value={row.full_name} onChange={v => updateRow(index, { full_name: v })} />
                  <Field label="Nome de exibição" value={row.display_name ?? ""} onChange={v => updateRow(index, { display_name: v })} />
                  <div>
                    <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Gênero</label>
                    <select value={row.gender ?? ""} onChange={e => updateRow(index, { gender: (e.target.value || null) as Gender | null })} className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                      <option value="">Não informado</option>
                      <option value="male">Masculino</option>
                      <option value="female">Feminino</option>
                    </select>
                  </div>
                  <Field label="Ano *" type="number" value={row.birth_year ? String(row.birth_year) : ""} onChange={v => updateRow(index, { birth_year: Number(v.replace(/\D/g, "").slice(0, 4)) || null })} />
                  <Field label="Turma *" value={row.class_group ?? ""} onChange={v => updateRow(index, { class_group: v.toUpperCase().slice(0, 3) })} />
                  <Field label="WhatsApp" value={row.contact_whatsapp ?? ""} onChange={v => updateRow(index, { contact_whatsapp: formatWhatsappInput(v) })} />
                  <div className="md:col-span-3">
                    <Field label="E-mail" type="email" value={row.contact_email ?? ""} onChange={v => updateRow(index, { contact_email: v })} />
                  </div>
                  <div className="flex items-end justify-end">
                    <Btn size="sm" variant="danger" onClick={() => setRows(current => current.filter((_, rowIndex) => rowIndex !== index))}><X size={12} />Remover</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#2d6a4f]/20 pt-6">
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Colar múltiplos participantes</p>
            <FieldArea rows={7} label="Dados em CSV" value={bulkText} onChange={setBulkText} placeholder={'nome_completo;nome_exibicao;genero;ano_nascimento;turma;foto;whatsapp;email\nMaria Silva;Maria;feminino;1988;A;;(84) 99999-0000;maria@email.com'} />
            <div className="mt-3"><Btn size="sm" variant="ghost" onClick={addBulkTextRows}>Adicionar dados colados</Btn></div>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Upload Excel/CSV</p>
            <label className="flex flex-col items-center justify-center gap-3 min-h-[180px] bg-[#0a120a] border border-dashed border-[#2d6a4f]/40 text-[#7a9a7a] cursor-pointer hover:border-[#2d6a4f] transition-colors p-6 text-center">
              <Upload size={24} />
              <span className="text-sm">Enviar arquivo .xlsx ou .csv</span>
              <span className="text-[11px] text-[#3a5a3a]">Use o modelo base gerado para manter os cabeçalhos corretos.</span>
              <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={e => void handleFile(e.target.files?.[0])} />
            </label>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Btn full onClick={save} disabled={busy || photoBusy !== null}>{busy ? <><RefreshCw size={16} className="animate-spin" />Salvando...</> : <><UserCheck size={16} />Cadastrar {rows.filter(row => row.full_name.trim()).length || ""} pessoas</>}</Btn>
          <Btn full variant="ghost" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}

type AdminPersonForm = {
  full_name: string;
  display_name: string;
  gender: Gender | null;
  birth_year: string;
  class_year: string;
  class_group: string;
  avatar_url: string;
  contact_whatsapp: string;
  contact_email: string;
  nickname_at_school: string;
  profile_status: ProfileStatus;
  is_visible: boolean;
  private_notes: string;
};

const EMPTY_ADMIN_PROFILE_DRAFT: AdminPersonProfileDraft = {
  display_name: "",
  current_photo_url: "",
  current_city: "",
  current_state: "",
  current_country: "Brasil",
  profession: "",
  bio: "",
  instagram_url: "",
  linkedin_url: "",
  contact_email: "",
  contact_whatsapp: "",
  relationship_status: null,
  has_children: false,
  children_count: null,
  intends_to_attend: null,
  show_current_photo: true,
  show_city: true,
  show_profession: true,
  show_social_links: false,
  allow_photo_tags: true,
  show_confirmed_status: true,
};

function buildAdminPersonForm(person: DbPerson): AdminPersonForm {
  return {
    full_name: person.full_name ?? "",
    display_name: person.display_name ?? "",
    gender: person.gender ?? null,
    birth_year: person.birth_year ? String(person.birth_year) : "",
    class_year: person.class_year ? String(person.class_year) : "2006",
    class_group: person.class_group ?? "",
    avatar_url: person.avatar_url ?? "",
    contact_whatsapp: formatWhatsappInput(person.contact_whatsapp ?? ""),
    contact_email: person.contact_email ?? "",
    nickname_at_school: person.nickname_at_school ?? "",
    profile_status: person.profile_status,
    is_visible: person.is_visible !== false,
    private_notes: person.private_notes ?? "",
  };
}

function buildAdminProfileDraft(profile: DbProfile | null, person: DbPerson): AdminPersonProfileDraft {
  if (!profile) return { ...EMPTY_ADMIN_PROFILE_DRAFT, display_name: person.display_name ?? "", current_photo_url: person.avatar_url ?? "", contact_email: person.contact_email ?? "", contact_whatsapp: formatWhatsappInput(person.contact_whatsapp ?? "") };
  return {
    display_name: profile.display_name ?? "",
    current_photo_url: profile.current_photo_url ?? "",
    current_city: profile.current_city ?? "",
    current_state: profile.current_state ?? "",
    current_country: profile.current_country ?? "Brasil",
    profession: profile.profession ?? "",
    bio: profile.bio ?? "",
    instagram_url: profile.instagram_url ?? "",
    linkedin_url: profile.linkedin_url ?? "",
    contact_email: profile.contact_email ?? "",
    contact_whatsapp: formatWhatsappInput(profile.contact_whatsapp ?? ""),
    relationship_status: profile.relationship_status ?? null,
    has_children: profile.has_children ?? false,
    children_count: profile.children_count ?? null,
    intends_to_attend: profile.intends_to_attend ?? null,
    show_current_photo: profile.show_current_photo ?? true,
    show_city: profile.show_city ?? true,
    show_profession: profile.show_profession ?? true,
    show_social_links: profile.show_social_links ?? false,
    allow_photo_tags: profile.allow_photo_tags ?? true,
    show_confirmed_status: profile.show_confirmed_status ?? true,
  };
}

function AdminPersonEditModal({
  person,
  open,
  adminId,
  onClose,
  onSaved,
}: {
  person: DbPerson | null;
  open: boolean;
  adminId: string;
  onClose: () => void;
  onSaved: (person: DbPerson) => void;
}) {
  const [personForm, setPersonForm] = useState<AdminPersonForm | null>(null);
  const [profileDraft, setProfileDraft] = useState<AdminPersonProfileDraft>(EMPTY_ADMIN_PROFILE_DRAFT);
  const [hasProfile, setHasProfile] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    if (!open || !person) return;
    setLoading(true);
    setError("");
    setPersonForm(buildAdminPersonForm(person));
    setProfileDraft(buildAdminProfileDraft(null, person));
    setHasProfile(false);

    getAdminPersonDetails(person.id)
      .then(details => {
        if (!active) return;
        setPersonForm(buildAdminPersonForm(details.person));
        setProfileDraft(buildAdminProfileDraft(details.profile, details.person));
        setHasProfile(Boolean(details.profile));
      })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "Não foi possível carregar os dados completos."); })
      .finally(() => { if (active) setLoading(false); });

    return () => { active = false; };
  }, [open, person?.id]);

  if (!person || !personForm) return null;

  function updatePersonForm(patch: Partial<AdminPersonForm>) {
    setPersonForm(current => current ? { ...current, ...patch } : current);
  }

  function updateProfileDraft(patch: Partial<AdminPersonProfileDraft>) {
    setProfileDraft(current => ({ ...current, ...patch }));
  }

  async function handleAvatar(file: File) {
    setPhotoBusy(true);
    setError("");
    try {
      const url = await uploadAdminPersonAvatar(adminId, file, person.id);
      updatePersonForm({ avatar_url: url });
      updateProfileDraft({ current_photo_url: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function save() {
    if (!personForm.full_name.trim()) {
      setError("Informe o nome completo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const personPatch: Partial<DbPerson> = {
        full_name: personForm.full_name.trim(),
        display_name: personForm.display_name.trim() || null,
        gender: personForm.gender,
        birth_year: Number(personForm.birth_year.replace(/\D/g, "")) || null,
        class_year: Number(personForm.class_year.replace(/\D/g, "")) || 2006,
        class_group: personForm.class_group.trim().toUpperCase() || null,
        avatar_url: personForm.avatar_url.trim() || null,
        contact_whatsapp: formatWhatsappInput(personForm.contact_whatsapp).trim() || null,
        contact_email: personForm.contact_email.trim() || null,
        nickname_at_school: personForm.nickname_at_school.trim() || null,
        profile_status: personForm.profile_status,
        is_visible: personForm.is_visible,
        private_notes: personForm.private_notes.trim() || null,
      } as Partial<DbPerson>;

      const profilePatch: AdminPersonProfileDraft | null = hasProfile ? {
        ...profileDraft,
        display_name: String(profileDraft.display_name ?? "").trim() || null,
        current_photo_url: String(profileDraft.current_photo_url ?? "").trim() || null,
        current_city: String(profileDraft.current_city ?? "").trim() || null,
        current_state: String(profileDraft.current_state ?? "").trim() || null,
        current_country: String(profileDraft.current_country ?? "").trim() || null,
        profession: String(profileDraft.profession ?? "").trim() || null,
        bio: String(profileDraft.bio ?? "").trim() || null,
        instagram_url: String(profileDraft.instagram_url ?? "").trim() || null,
        linkedin_url: String(profileDraft.linkedin_url ?? "").trim() || null,
        contact_email: String(profileDraft.contact_email ?? "").trim() || null,
        contact_whatsapp: formatWhatsappInput(String(profileDraft.contact_whatsapp ?? "")).trim() || null,
        children_count: profileDraft.has_children ? Number(profileDraft.children_count ?? 0) || 0 : null,
      } : null;

      const updated = await updateAdminPersonAndProfile({ personId: person.id, person: personPatch, profile: profilePatch, adminId });
      onSaved(updated.person);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar os dados.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar participante" wide>
      <div className="flex flex-col gap-6">
        {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
        {loading && <p className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">Carregando dados completos...</p>}

        <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
          <p className="text-[#f0ebe0] font-semibold text-sm mb-1">Dados do pré-cadastro</p>
          <p className="text-[#7a9a7a] text-xs leading-relaxed">Estes campos aparecem na lista de ex-alunos e no fluxo de reivindicação de perfil.</p>
        </div>

        <AvatarCropUpload
          currentImageUrl={personForm.avatar_url || null}
          fallbackLabel={initials(personForm.display_name || personForm.full_name)}
          uploading={photoBusy}
          disabled={busy || photoBusy}
          onCroppedFile={handleAvatar}
          onRemove={personForm.avatar_url ? () => { updatePersonForm({ avatar_url: "" }); updateProfileDraft({ current_photo_url: "" }); } : undefined}
          helperText="Use a mesma ferramenta de crop/zoom para padronizar a foto exibida nos cards."
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2"><Field label="Nome completo" value={personForm.full_name} onChange={v => updatePersonForm({ full_name: v })} /></div>
          <div><Field label="Nome de exibição" value={personForm.display_name} onChange={v => updatePersonForm({ display_name: v })} /></div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Gênero</label>
            <select value={personForm.gender ?? ""} onChange={e => updatePersonForm({ gender: (e.target.value || null) as Gender | null })} className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
              <option value="">Não informado</option>
              <option value="male">Masculino</option>
              <option value="female">Feminino</option>
            </select>
          </div>
          <Field label="Ano nascimento" type="number" value={personForm.birth_year} onChange={v => updatePersonForm({ birth_year: v.replace(/\D/g, "").slice(0, 4) })} />
          <Field label="Ano turma" type="number" value={personForm.class_year} onChange={v => updatePersonForm({ class_year: v.replace(/\D/g, "").slice(0, 4) })} />
          <Field label="Turma" value={personForm.class_group} onChange={v => updatePersonForm({ class_group: v.toUpperCase().slice(0, 3) })} />
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Status</label>
            <select value={personForm.profile_status} onChange={e => updatePersonForm({ profile_status: e.target.value as ProfileStatus })} className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
              <option value="unclaimed">Não cadastrado</option>
              <option value="claimed">Cadastrado</option>
              <option value="confirmed">Confirmado</option>
            </select>
          </div>
          <Field label="Apelido na escola" value={personForm.nickname_at_school} onChange={v => updatePersonForm({ nickname_at_school: v })} />
          <Field label="WhatsApp" value={personForm.contact_whatsapp} onChange={v => updatePersonForm({ contact_whatsapp: formatWhatsappInput(v) })} />
          <div className="md:col-span-2"><Field label="E-mail" type="email" value={personForm.contact_email} onChange={v => updatePersonForm({ contact_email: v })} /></div>
          <label className="flex items-center justify-between gap-3 bg-[#0a120a] border border-[#2d6a4f]/20 px-4 py-3 md:col-span-1">
            <span className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">Visível</span>
            <button type="button" onClick={() => updatePersonForm({ is_visible: !personForm.is_visible })} className={`relative w-12 h-6 transition-colors ${personForm.is_visible ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}`}><span className={`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all ${personForm.is_visible ? "left-7" : "left-1"}`} /></button>
          </label>
          <div className="md:col-span-4"><FieldArea label="Notas internas" value={personForm.private_notes} onChange={v => updatePersonForm({ private_notes: v })} rows={3} /></div>
        </div>

        <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
          <p className="text-[#f0ebe0] font-semibold text-sm mb-1">Dados do perfil reivindicado</p>
          <p className="text-[#7a9a7a] text-xs leading-relaxed">{hasProfile ? "Estes dados foram preenchidos pelo usuário e podem ser corrigidos pelo admin." : "Este participante ainda não concluiu o cadastro. Dados públicos completos ficarão disponíveis após a reivindicação."}</p>
        </div>

        <fieldset disabled={!hasProfile} className={!hasProfile ? "opacity-45 pointer-events-none" : ""}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2"><Field label="Nome de exibição público" value={String(profileDraft.display_name ?? "")} onChange={v => updateProfileDraft({ display_name: v })} /></div>
            <div className="md:col-span-2"><Field label="Profissão" value={String(profileDraft.profession ?? "")} onChange={v => updateProfileDraft({ profession: v })} /></div>
            <Field label="Cidade" value={String(profileDraft.current_city ?? "")} onChange={v => updateProfileDraft({ current_city: v })} />
            <Field label="Estado" value={String(profileDraft.current_state ?? "")} onChange={v => updateProfileDraft({ current_state: v })} />
            <Field label="País" value={String(profileDraft.current_country ?? "")} onChange={v => updateProfileDraft({ current_country: v })} />
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Relacionamento</label>
              <select value={profileDraft.relationship_status ?? ""} onChange={e => updateProfileDraft({ relationship_status: (e.target.value || null) as RelationshipStatus | null })} className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                <option value="">Não informado</option>
                <option value="single">Solteiro(a)</option>
                <option value="dating">Namorando</option>
                <option value="married">Casado(a)</option>
              </select>
            </div>
            <Field label="WhatsApp público" value={String(profileDraft.contact_whatsapp ?? "")} onChange={v => updateProfileDraft({ contact_whatsapp: formatWhatsappInput(v) })} />
            <div className="md:col-span-2"><Field label="E-mail público" type="email" value={String(profileDraft.contact_email ?? "")} onChange={v => updateProfileDraft({ contact_email: v })} /></div>
            <Field label="Instagram" value={String(profileDraft.instagram_url ?? "")} onChange={v => updateProfileDraft({ instagram_url: v })} />
            <Field label="LinkedIn" value={String(profileDraft.linkedin_url ?? "")} onChange={v => updateProfileDraft({ linkedin_url: v })} />
            <label className="flex items-center justify-between gap-3 bg-[#0a120a] border border-[#2d6a4f]/20 px-4 py-3"><span className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider">Tem filhos</span><button type="button" onClick={() => updateProfileDraft({ has_children: !profileDraft.has_children })} className={`relative w-12 h-6 transition-colors ${profileDraft.has_children ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}`}><span className={`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all ${profileDraft.has_children ? "left-7" : "left-1"}`} /></button></label>
            <Field label="Qtd. filhos" type="number" value={profileDraft.children_count ? String(profileDraft.children_count) : ""} onChange={v => updateProfileDraft({ children_count: Number(v.replace(/\D/g, "")) || null })} />
            <div className="md:col-span-4"><FieldArea label="Mini bio" value={String(profileDraft.bio ?? "")} onChange={v => updateProfileDraft({ bio: v })} rows={4} /></div>
          </div>
        </fieldset>

        <div className="flex flex-col sm:flex-row gap-3">
          <Btn full onClick={save} disabled={busy || photoBusy}>{busy ? <><RefreshCw size={16} className="animate-spin" />Salvando...</> : <><Save size={16} />Salvar alterações</>}</Btn>
          <Btn full variant="ghost" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}


function AdminReviewList<T>({ title, items, getTitle, getSubtitle, getStatus, onApprove, onReject }: {
  title: string;
  items: T[];
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  getStatus: (item: T) => string;
  onApprove: (item: T) => void;
  onReject: (item: T) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">{title}</p>
      {items.length === 0 ? <EmptyState title="Nenhum item encontrado" /> : items.map((item, index) => (
        <div key={index} className="bg-[#141f14] border border-[#2d6a4f]/25 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <p className="text-[#f0ebe0] font-semibold text-sm">{getTitle(item)}</p>
            <p className="text-[#7a9a7a] text-xs">{getSubtitle(item)}</p>
          </div>
          <StatusBadge status={getStatus(item)} />
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => onApprove(item)}><Check size={12} />Aprovar</Btn>
            <Btn size="sm" variant="danger" onClick={() => onReject(item)}><X size={12} />Rejeitar</Btn>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminTable({ admins, currentUserId, onRole, onRemove }: {
  admins: DbAdminUser[];
  currentUserId: string;
  onRole: (id: string, role: AdminRole) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div data-admin-table-scroll className="overflow-x-auto">
      {admins.length === 0 ? <EmptyState title="Nenhum administrador cadastrado" /> : (
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#2d6a4f]/20">
              {["Nome","E-mail","Role","Acoes"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {admins.map(admin => (
              <tr key={admin.id} className="border-b border-[#2d6a4f]/10">
                <td className="py-4 px-4 text-[#f0ebe0] text-sm">{admin.display_name ?? admin.user_id}</td>
                <td className="py-4 px-4 text-[#7a9a7a] text-sm">{admin.email ?? "-"}</td>
                <td className="py-4 px-4"><StatusBadge status={admin.role} /></td>
                <td className="py-4 px-4">
                  <div className="flex flex-wrap gap-2">
                    <select value={admin.role} onChange={e => onRole(admin.id, e.target.value as AdminRole)}
                      className="bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-2 px-3 text-xs">
                      {(["viewer","checkin_staff","moderator","admin","superadmin"] as AdminRole[]).map(role => <option key={role} value={role}>{role}</option>)}
                    </select>
                    {admin.user_id !== currentUserId && <Btn size="sm" variant="danger" onClick={() => onRemove(admin.id)}>Remover</Btn>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const ADMIN_TAB_PATHS: Record<string, string> = {
  dashboard: "/admin",
  header: "/admin/content?tab=header",
  "home-content": "/admin/content?tab=home",
  "event-content": "/admin/content?tab=event",
  "archive-content": "/admin/content?tab=archive",
  sections: "/admin/content?tab=sections",
  labels: "/admin/content?tab=labels",
  timeline: "/admin/content?tab=timeline",
  faq: "/admin/content?tab=faq",
  footer: "/admin/content?tab=footer",
  memories: "/admin/content?tab=memories",
  polls: "/admin/content?tab=polls",
  photos: "/admin/content?tab=photos",
  "photo-comments": "/admin/content?tab=comments",
  assets: "/admin/content?tab=assets",
  participants: "/admin/participants?tab=participants",
  claims: "/admin/participants?tab=profiles",
  disputes: "/admin/participants?tab=disputes",
  "tag-mod": "/admin/participants?tab=tags",
  removals: "/admin/participants?tab=removals",
  orders: "/admin/tickets?tab=orders",
  lots: "/admin/tickets?tab=lots",
  reports: "/admin/reports",
  admins: "/admin/settings?tab=admins",
  audit: "/admin/settings?tab=audit",
  settings: "/admin/settings?tab=settings",
};

function adminTabFromPathname() {
  if (typeof window === "undefined") return "dashboard";
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  const tabByRoute: Record<string, string> = {
    "/admin/content": ["header", "home", "event", "archive", "sections", "labels", "timeline", "faq", "footer"].includes(tab ?? "") ? "home-content" : tab === "comments" ? "photo-comments" : tab ?? "home-content",
    "/admin/participants": tab === "profiles" ? "claims" : tab === "tags" ? "tag-mod" : tab ?? "participants",
    "/admin/tickets": tab === "lots" ? "lots" : "orders",
    "/admin/reports": "reports",
    "/admin/settings": tab ?? "settings",
  };
  return tabByRoute[pathname] ?? "dashboard";
}

function adminContentTabFromPathname(): ContentAdminTab {
  if (typeof window === "undefined") return "header";
  const tab = new URLSearchParams(window.location.search).get("tab");
  if (tab === "header") return "header";
  if (tab === "event") return "event";
  if (tab === "archive") return "archive";
  if (tab === "sections") return "sections";
  if (tab === "labels") return "labels";
  if (tab === "timeline") return "timeline";
  if (tab === "faq") return "faq";
  if (tab === "footer") return "footer";
  return "home";
}

function updateAdminBrowserPath(tab: string) {
  if (typeof window === "undefined") return;
  const nextPath = ADMIN_TAB_PATHS[tab] ?? ADMIN_TAB_PATHS.dashboard;
  if (`${window.location.pathname}${window.location.search}` !== nextPath) {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new Event("pushstate"));
  }
}

export type AdminNavigationGuard = (action: () => void) => void;

export function AdminPage({ navigate, auth, onHomeContentUpdated, registerNavigationGuard }: {
  navigate: (p: Page) => void;
  auth: AuthState;
  onHomeContentUpdated: (content: HomePageContent) => void;
  registerNavigationGuard: (guard: AdminNavigationGuard | null) => void;
}) {
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [tab, setTab] = useState(() => adminTabFromPathname());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [saved, setSaved] = useState(false);
  const { toast, show: showToast, hide: hideToast } = useToast();
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [lots, setLots] = useState<DbTicketType[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [peopleRows, setPeopleRows] = useState<DbPerson[]>([]);
  const [peopleImportOpen, setPeopleImportOpen] = useState(false);
  const [selectedAdminPerson, setSelectedAdminPerson] = useState<DbPerson | null>(null);
  const [pendingPhotos, setPendingPhotos] = useState<DbPhoto[]>([]);
  const [tags, setTags] = useState<(DbPhotoTag & { photos: Pick<DbPhoto, "image_url" | "caption"> | null })[]>([]);
  const [claims, setClaims] = useState<(DbProfileClaim & { people: Pick<DbPerson, "full_name" | "nickname_at_school" | "class_group"> | null })[]>([]);
  const [removals, setRemovals] = useState<(DbPhotoRemovalRequest & { photos?: Partial<DbPhoto> })[]>([]);
  const [disputes, setDisputes] = useState<(DbProfileClaimDispute & { people?: Partial<DbPerson> })[]>([]);
  const [admins, setAdmins] = useState<DbAdminUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<DbAuditLog[]>([]);
  const [reports, setReports] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<(DbPhotoComment & { photos?: Partial<DbPhoto> })[]>([]);
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [polls, setPolls] = useState<(DbPoll & { poll_options?: DbPollOption[] })[]>([]);
  const [pollDraft, setPollDraft] = useState({ question: "", description: "", optionsText: "", status: "open" as PollStatus, allowMultiple: false });
  const [photoFilter, setPhotoFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [tagFilter, setTagFilter] = useState<"pending"|"approved"|"rejected">("pending");
  const [commentFilter, setCommentFilter] = useState<ModerationStatus | "all">("pending");
  const [memoryFilter, setMemoryFilter] = useState<ModerationStatus | "all">("pending");
  const [newAdmin, setNewAdmin] = useState({ userId: "", displayName: "", email: "", role: "viewer" as AdminRole });
  const [lotDraft, setLotDraft] = useState({ name: "", price: "", quantity: "" });
  const [settings, setSettings] = useState({
    name: "", date: "", time: "", venue: "", address: "", salesStatus: "closed",
    contactEmail: "", contactPhone: "", description: "", rules: "", companionPolicy: "", refundPolicy: "",
  });

  const [homeDraft, setHomeDraft] = useState<ExtendedHomePageContent>(getExtendedHomeContent(HOME_PAGE_CONTENT_DEFAULTS));
  const [headerLogoPreviewUrl, setHeaderLogoPreviewUrl] = useState<string | null>(null);
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | null>(null);
  const [eventDraft, setEventDraft] = useState<EventPageContent>(EVENT_PAGE_CONTENT_DEFAULTS);
  const [archiveDraft, setArchiveDraft] = useState<Partial<DbEventArchiveSettings>>({ archive_enabled: false, page_eyebrow: "Pós-festa", page_title: "Memórias do reencontro", message_label: "Mensagem da organização", closed_title: "O acervo será aberto depois do reencontro.", closed_text: "", post_event_text: "", official_video_url: "", official_video_title: "", official_photo_ids: [], highlight_photo_ids: [], highlights_links: [] });
  const [moderationSettings, setModerationSettings] = useState<ContentModerationSettings>({ event_id: DEFAULT_EVENT_ID, auto_approve_photos: false, auto_approve_comments: false, auto_approve_memories: false });
  const [contentTab, setContentTab] = useState<ContentAdminTab>(() => adminContentTabFromPathname());
  const persistedHomeDraftRef = useRef<ExtendedHomePageContent>(getExtendedHomeContent(HOME_PAGE_CONTENT_DEFAULTS));
  const persistedEventDraftRef = useRef<EventPageContent>(EVENT_PAGE_CONTENT_DEFAULTS);
  const persistedArchiveDraftRef = useRef<Partial<DbEventArchiveSettings>>({ archive_enabled: false, page_eyebrow: "Pós-festa", page_title: "Memórias do reencontro", message_label: "Mensagem da organização", closed_title: "O acervo será aberto depois do reencontro.", closed_text: "", post_event_text: "", official_video_url: "", official_video_title: "", official_photo_ids: [], highlight_photo_ids: [], highlights_links: [] });
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);

  const hasUnsavedChanges = !loading && tab === "home-content" && (
    contentTab === "event"
      ? JSON.stringify(eventDraft) !== JSON.stringify(persistedEventDraftRef.current)
      : contentTab === "archive"
        ? JSON.stringify(archiveDraft) !== JSON.stringify(persistedArchiveDraftRef.current)
      : JSON.stringify(homeDraft) !== JSON.stringify(persistedHomeDraftRef.current)
  );

  const discardCurrentPageChanges = useCallback(() => {
    if (contentTab === "event") {
      setEventDraft(persistedEventDraftRef.current);
      return;
    }
    if (contentTab === "archive") {
      setArchiveDraft(persistedArchiveDraftRef.current);
      return;
    }
    setHomeDraft(persistedHomeDraftRef.current);
  }, [contentTab]);

  const requestNavigation = useCallback<AdminNavigationGuard>((action) => {
    if (!hasUnsavedChanges) {
      action();
      return;
    }
    pendingNavigationRef.current = action;
    setLeaveConfirmationOpen(true);
  }, [hasUnsavedChanges]);

  function confirmLeaveWithoutSaving() {
    const action = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setLeaveConfirmationOpen(false);
    discardCurrentPageChanges();
    registerNavigationGuard(null);
    action?.();
  }

  function cancelLeaveWithoutSaving() {
    pendingNavigationRef.current = null;
    setLeaveConfirmationOpen(false);
  }

  useEffect(() => {
    registerNavigationGuard(hasUnsavedChanges ? requestNavigation : null);
    return () => registerNavigationGuard(null);
  }, [hasUnsavedChanges, registerNavigationGuard, requestNavigation]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    function syncAdminPath() {
      setTab(adminTabFromPathname());
      setContentTab(adminContentTabFromPathname());
    }
    window.addEventListener("popstate", syncAdminPath);
    return () => window.removeEventListener("popstate", syncAdminPath);
  }, []);

const role = auth.role ?? "viewer";
  const canManageEvent = role === "superadmin" || role === "admin";
  const canManageAdmins = role === "superadmin";
  const canModerate = role === "superadmin" || role === "admin" || role === "moderator";
  const canCheckin = role === "superadmin" || role === "admin" || role === "checkin_staff";
  const canExport = role !== "viewer";

  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:<BarChart3 size={13} /> },
    { id:"home-content", label:"Conteúdo", icon:<Pencil size={13} />, disabled: !canManageEvent },
    { id:"orders", label:"Pedidos", icon:<Ticket size={13} /> },
    { id:"lots", label:"Lotes", icon:<Package size={13} />, disabled: !canManageEvent },
    { id:"reports", label:"Relatorios", icon:<Download size={13} /> },
    { id:"participants", label:"Participantes", icon:<Users size={13} /> },
    { id:"photos", label:"Fotos", icon:<Camera size={13} />, disabled: !canModerate },
    { id:"tag-mod", label:"Marcacoes", icon:<Tag size={13} />, disabled: !canModerate },
    { id:"photo-comments", label:"Comentários", icon:<MessageCircle size={13} />, disabled: !canModerate },
    { id:"memories", label:"Memórias", icon:<Star size={13} />, disabled: !canModerate },
    { id:"polls", label:"Enquetes", icon:<BarChart3 size={13} />, disabled: !canManageEvent },
    { id:"claims", label:"Perfis", icon:<UserCheck size={13} />, disabled: !canModerate },
    { id:"removals", label:"Remocoes", icon:<AlertCircle size={13} />, disabled: !canModerate },
    { id:"disputes", label:"Disputas", icon:<Shield size={13} />, disabled: !canModerate },
    { id:"admins", label:"Admins", icon:<Key size={13} />, disabled: !canManageAdmins },
    { id:"audit", label:"Auditoria", icon:<FileText size={13} /> },
    { id:"settings", label:"Config.", icon:<Settings size={13} />, disabled: !canManageEvent },
  ];

  const adminGroups = [
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} />, tabs: [{ id: "dashboard", label: "Visão geral", icon: <BarChart3 size={13} /> }, { id: "reports", label: "Relatórios", icon: <Download size={13} /> }] },
    { id: "content", label: "Conteúdo", icon: <Pencil size={14} />, tabs: [
      { id: "header", label: "Header", icon: <Menu size={13} /> }, { id: "home-content", label: "Home", icon: <Pencil size={13} /> },
      { id: "event-content", label: "Evento", icon: <Ticket size={13} /> }, { id: "sections", label: "Seções", icon: <Package size={13} /> },
      { id: "archive-content", label: "Pós-festa", icon: <Star size={13} /> },
      { id: "labels", label: "Labels", icon: <FileText size={13} /> },
      { id: "timeline", label: "Timeline", icon: <Clock size={13} /> }, { id: "faq", label: "FAQ", icon: <Info size={13} /> },
      { id: "footer", label: "Rodapé", icon: <FileText size={13} /> }, { id: "memories", label: "Memórias", icon: <Star size={13} /> },
      { id: "polls", label: "Enquetes", icon: <BarChart3 size={13} /> }, { id: "photos", label: "Fotos", icon: <Camera size={13} /> },
      { id: "photo-comments", label: "Comentários", icon: <MessageCircle size={13} /> },
    ] },
    { id: "participants", label: "Participantes", icon: <Users size={14} />, tabs: [
      { id: "participants", label: "Participantes", icon: <Users size={13} /> }, { id: "claims", label: "Perfis", icon: <UserCheck size={13} /> },
      { id: "disputes", label: "Disputas", icon: <Shield size={13} /> }, { id: "tag-mod", label: "Marcações", icon: <Tag size={13} /> },
      { id: "removals", label: "Remoções", icon: <AlertCircle size={13} /> },
    ] },
    { id: "tickets", label: "Ingressos", icon: <Ticket size={14} />, tabs: [
      { id: "orders", label: "Pedidos", icon: <Ticket size={13} /> }, { id: "lots", label: "Lotes", icon: <Package size={13} /> },
      { id: "checkin", label: "Check-in", icon: <Scan size={13} /> },
    ] },
    { id: "settings", label: "Administração", icon: <Settings size={14} />, tabs: [
      { id: "admins", label: "Administradores", icon: <Key size={13} /> }, { id: "audit", label: "Auditoria", icon: <FileText size={13} /> },
      { id: "settings", label: "Configurações", icon: <Settings size={13} /> }, { id: "assets", label: "Assets", icon: <Package size={13} /> },
    ] },
  ];

  function performSelectAdminTab(nextTab: string) {
    if (nextTab === "checkin") {
      navigate("checkin");
      return;
    }
    if (nextTab === "home-content") {
      setContentTab("home");
      setTab("home-content");
    } else if (["header", "event-content", "archive-content", "sections", "labels", "timeline", "faq", "footer"].includes(nextTab)) {
      setContentTab(nextTab === "event-content" ? "event" : nextTab === "archive-content" ? "archive" : nextTab as ContentAdminTab);
      setTab("home-content");
    } else {
      setTab(nextTab);
    }
    updateAdminBrowserPath(nextTab);
  }

  function selectAdminTab(nextTab: string) {
    const nextSelectedSubtab = nextTab === "event-content" ? "event" : nextTab === "archive-content" ? "archive" : nextTab === "home-content" ? "home" : nextTab;
    if (nextSelectedSubtab === selectedSubtab) return;
    requestNavigation(() => performSelectAdminTab(nextTab));
  }

  const selectedSubtab = tab === "home-content" ? contentTab : tab;
  const activeAdminGroup = adminGroups.find(group => group.tabs.some(item => item.id === tab)) ?? adminGroups[0];
  const activeAdminItem = activeAdminGroup.tabs.find(item => (
    selectedSubtab === (item.id === "event-content" ? "event" : item.id === "archive-content" ? "archive" : item.id === "home-content" ? "home" : item.id)
  )) ?? activeAdminGroup.tabs[0];

  async function loadAdminData() {
    setLoading(true);
    try {
      const [eventData, lotData, orderData, peopleData, photoData, tagData, commentData, memoryData, pollData, claimData, removalData, disputeData, adminData, auditData] = await Promise.all([
        getEventSettings(),
        getTicketTypesAdmin(),
        getOrdersByStatus(),
        getPeople(),
        getPhotosForModeration(photoFilter),
        getTagsForModeration(tagFilter),
        getPhotoCommentsForModeration(commentFilter),
        getMemoriesForModeration(memoryFilter),
        getPolls(DEFAULT_EVENT_ID, true),
        getPendingClaims(),
        getPhotoRemovalRequests(),
        getProfileClaimDisputes(),
        getAdminUsers(),
        getAuditLogs(80),
      ]);
      setEvent(eventData);
      setLots(lotData);
      setOrders(orderData);
      setPeopleRows(peopleData);
      setPendingPhotos(photoData);
      setTags(tagData);
      setComments(commentData);
      setMemories(memoryData);
      setPolls(pollData);
      setClaims(claimData);
      setRemovals(removalData);
      setDisputes(disputeData);
      setAdmins(adminData);
      setAuditLogs(auditData);
      if (eventData) {
        setSettings({
          name: eventData.title,
          date: eventData.event_date,
          time: eventData.event_time?.slice(0, 5) ?? "19:00",
          venue: eventData.location_name,
          address: eventData.location_address ?? "",
          salesStatus: eventData.sales_status,
          contactEmail: eventData.contact_email ?? "",
          contactPhone: eventData.contact_whatsapp ?? "",
          description: eventData.description ?? "",
          rules: eventData.general_rules ?? "",
          companionPolicy: eventData.companion_policy ?? "",
          refundPolicy: eventData.refund_policy ?? "",
        });
        const [homeDataRaw, eventPageData, archiveData, moderationData] = await Promise.all([
          getHomePageContent(DEFAULT_EVENT_ID),
          getEventPageContent(DEFAULT_EVENT_ID),
          getEventArchiveSettings(DEFAULT_EVENT_ID),
          getContentModerationSettings(DEFAULT_EVENT_ID),
        ]);
        const homeData = getExtendedHomeContent(homeDataRaw);
        const normalizedArchive = archiveData ?? { event_id: DEFAULT_EVENT_ID, archive_enabled: false, page_eyebrow: "Pós-festa", page_title: "Memórias do reencontro", message_label: "Mensagem da organização", closed_title: "O acervo será aberto depois do reencontro.", closed_text: "", post_event_text: "", official_video_url: "", official_video_title: "", official_photo_ids: [], highlight_photo_ids: [], highlights_links: [], created_at: "", updated_at: "" };
        persistedHomeDraftRef.current = homeData;
        persistedEventDraftRef.current = eventPageData;
        persistedArchiveDraftRef.current = normalizedArchive;
        setHomeDraft(homeData);
        setEventDraft(eventPageData);
        setArchiveDraft(normalizedArchive);
        setModerationSettings(moderationData);
        onHomeContentUpdated(homeData);
        setReports(await getReports(eventData.id));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar dados do admin.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdminData(); }, [photoFilter, tagFilter, commentFilter, memoryFilter]);

  async function runAction(label: string, action: () => Promise<void>, reload = true): Promise<boolean> {
    setBusy(label);
    try {
      await action();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      if (reload) await loadAdminData();
      return true;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Não foi possível concluir a ação.", "error");
      return false;
    } finally {
      setBusy("");
    }
  }

  async function saveSettings() {
    if (!event || !canManageEvent) return;
    await runAction("settings", () => updateEventSettings(event.id, {
      title: settings.name,
      event_date: settings.date,
      event_time: settings.time,
      location_name: settings.venue,
      location_address: settings.address,
      sales_status: settings.salesStatus as DbEvent["sales_status"],
      contact_email: settings.contactEmail,
      contact_whatsapp: settings.contactPhone,
      description: settings.description,
      general_rules: settings.rules,
      companion_policy: settings.companionPolicy,
      refund_policy: settings.refundPolicy,
    }, auth.userId));
  }

  async function saveHomeContent() {
    if (!canManageEvent) return;
    await runAction("home-content", async () => {
      const { faq_items_json: _legacyFaqItemsJson, ...homePatch } = homeDraft;
      const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
        ...homePatch,
        event_id: DEFAULT_EVENT_ID,
      } as Partial<HomePageContent>, auth.userId));
      persistedHomeDraftRef.current = updated;
      setHomeDraft(updated);
      onHomeContentUpdated(updated);
    });
  }

  function setFaqSectionSettings(patch: Partial<FaqSectionSettings>) {
    setHomeDraft(current => ({
      ...current,
      faq_eyebrow: patch.eyebrow ?? current.faq_eyebrow,
      faq_title: patch.title ?? current.faq_title,
      faq_search_placeholder: patch.searchPlaceholder ?? current.faq_search_placeholder,
      faq_empty_label: patch.emptyLabel ?? current.faq_empty_label,
      faq_view_all_label: patch.viewAllLabel ?? current.faq_view_all_label,
      faq_initial_mode: patch.initialMode ?? current.faq_initial_mode,
    }));
  }

  async function saveFaqSectionSettings() {
    const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
      faq_eyebrow: homeDraft.faq_eyebrow,
      faq_title: homeDraft.faq_title,
      faq_search_placeholder: homeDraft.faq_search_placeholder,
      faq_empty_label: homeDraft.faq_empty_label,
      faq_view_all_label: homeDraft.faq_view_all_label,
      faq_initial_mode: homeDraft.faq_initial_mode,
    }, auth.userId));
    persistedHomeDraftRef.current = updated;
    setHomeDraft(updated);
    onHomeContentUpdated(updated);
  }

  async function saveEventContent() {
    if (!canManageEvent) return;
    await runAction("event-content", async () => {
      const updated = await updateEventPageContent(DEFAULT_EVENT_ID, {
        ...eventDraft,
        event_id: DEFAULT_EVENT_ID,
      }, auth.userId);
      persistedEventDraftRef.current = updated;
      setEventDraft(updated);
    });
  }

  async function saveArchiveContent() {
    if (!canManageEvent) return;
    await runAction("archive-content", async () => {
      const updated = await updateEventArchiveSettings(DEFAULT_EVENT_ID, archiveDraft);
      persistedArchiveDraftRef.current = updated;
      setArchiveDraft(updated);
    });
  }

  async function uploadEventHeroImage(file?: File | null) {
    if (!file || !canManageEvent) return;
    await runAction("event-hero-upload", async () => {
      const imageUrl = await uploadCmsContentImage(file, auth.userId, "event-hero");
      setEventDraft(current => ({ ...current, hero_image_url: imageUrl }));
    }, false);
  }

  async function uploadEventGalleryImage(index: number, file?: File | null) {
    if (!file || !canManageEvent) return;
    await runAction(`event-gallery-${index}`, async () => {
      const imageUrl = await uploadCmsContentImage(file, auth.userId, `event-gallery-${index}`);
      setEventGalleryItems(updateEventGalleryItem(eventGalleryItems, index, { image_url: imageUrl }));
    }, false);
  }

  async function uploadTimelineImage(index: number, file?: File | null) {
    if (!file || !canManageEvent) return;
    await runAction(`timeline-image-${index}`, async () => {
      const imageUrl = await uploadCmsContentImage(file, auth.userId, `timeline-${index}`);
      setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, index, { image_url: imageUrl }));
    }, false);
  }

  async function setAutomaticApproval(key: "auto_approve_photos" | "auto_approve_comments" | "auto_approve_memories", enabled: boolean) {
    if (!canManageEvent) return;
    await runAction(`moderation-${key}`, async () => {
      const updated = await updateContentModerationSettings(DEFAULT_EVENT_ID, { [key]: enabled });
      setModerationSettings(updated);
    });
  }

  async function handleHeaderLogoUpload(file?: File | null) {
    if (!file || !canManageEvent) return;
    const previewUrl = URL.createObjectURL(file);
    setHeaderLogoPreviewUrl(previewUrl);
    try {
      await runAction("header-logo", async () => {
        const squareLogo = await createSquareLogoFile(file);
        const logoUrl = await uploadHeaderLogo(squareLogo, auth.userId);
        const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
          header_logo_url: logoUrl,
        } as Partial<HomePageContent>, auth.userId));
        setHomeDraft(updated);
        onHomeContentUpdated(updated);
      });
    } finally {
      URL.revokeObjectURL(previewUrl);
      setHeaderLogoPreviewUrl(null);
    }
  }

  async function handleFaviconUpload(file?: File | null) {
    if (!file || !canManageEvent) return;
    const previewUrl = URL.createObjectURL(file);
    setFaviconPreviewUrl(previewUrl);
    try {
      await runAction("favicon", async () => {
        const faviconUrl = await uploadFavicon(file, auth.userId);
        const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
          favicon_url: faviconUrl,
        } as Partial<HomePageContent>, auth.userId));
        setHomeDraft(updated);
        onHomeContentUpdated(updated);
        applyDocumentFavicon(faviconUrl);
      });
    } finally {
      URL.revokeObjectURL(previewUrl);
      setFaviconPreviewUrl(null);
    }
  }

  async function handleFaviconRemove() {
    if (!canManageEvent) return;
    await runAction("favicon", async () => {
      const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
        favicon_url: null,
      } as Partial<HomePageContent>, auth.userId));
      setHomeDraft(updated);
      onHomeContentUpdated(updated);
      applyDocumentFavicon(null);
    });
  }

  async function createLot() {
    if (!event || !canManageEvent) return;
    await runAction("lot-create", async () => {
      await createTicketType({
        event_id: event.id,
        name: lotDraft.name || "Novo lote",
        description: "",
        price_cents: Math.max(0, Math.round(Number(lotDraft.price || 0) * 100)),
        available_quantity: Math.max(0, Number(lotDraft.quantity || 0)),
        sold_quantity: 0,
        allows_guest: false,
        status: "draft",
      });
      setLotDraft({ name: "", price: "", quantity: "" });
    });
  }


  async function createAdminPoll() {
    if (!canManageEvent) return;
    const options = pollDraft.optionsText.split("\n").map(o => o.trim()).filter(Boolean);
    if (!pollDraft.question.trim() || options.length < 2) {
      showToast("Informe a pergunta e pelo menos duas opções.", "error");
      return;
    }
    await runAction("poll-create", async () => {
      await createPoll({
        eventId: event?.id ?? DEFAULT_EVENT_ID,
        question: pollDraft.question,
        description: pollDraft.description,
        status: pollDraft.status,
        allowMultipleVotes: pollDraft.allowMultiple,
        options,
        adminId: auth.userId,
      });
      setPollDraft({ question: "", description: "", optionsText: "", status: "open", allowMultiple: false });
    });
  }


  const timelineDraftItems = sortNostalgiaTimelineItems(parseHomeJsonArray<NostalgiaTimelineItemContent>(homeDraft.home_nostalgia_timeline_json, []).map(item => ({
    ...item,
    year: item.year ?? "",
    title: item.title ?? item.label ?? "",
    description: item.description ?? item.desc ?? "",
  })));
  const sectionDraftItems = parseHomeJsonArray<HomeSectionContent>(homeDraft.home_sections_json, HOME_SECTION_DEFAULTS);
  const footerDraftLinks = parseHomeJsonArray<FooterLinkContent>(homeDraft.footer_links_json, FOOTER_LINK_DEFAULTS);
  const eventGalleryItems = parseHomeJsonArray<EventPageGalleryItem>(eventDraft.gallery_json, parseHomeJsonArray<EventPageGalleryItem>(EVENT_PAGE_CONTENT_DEFAULTS.gallery_json, []));
  const eventAttractionItems = parseHomeJsonArray<EventPageInfoItem>(eventDraft.attractions_json, parseHomeJsonArray<EventPageInfoItem>(EVENT_PAGE_CONTENT_DEFAULTS.attractions_json, []));
  const eventScheduleItems = parseHomeJsonArray<EventPageScheduleItem>(eventDraft.schedule_json, parseHomeJsonArray<EventPageScheduleItem>(EVENT_PAGE_CONTENT_DEFAULTS.schedule_json, []));
  const eventExtraInfoItems = parseHomeJsonArray<EventPageInfoItem>(eventDraft.extra_info_json, parseHomeJsonArray<EventPageInfoItem>(EVENT_PAGE_CONTENT_DEFAULTS.extra_info_json, []));
  const headerVisibilityControls: { key: keyof ExtendedHomePageContent; label: string; description: string }[] = [
    { key: "header_cta_visible", label: "CTA Comprar ingresso", description: "Botão principal do header desktop." },
    { key: "header_auth_visible", label: "Login / Minha conta", description: "Botão de login ou menu do perfil no header." },
    { key: "nav_home_visible", label: "Home", description: "Item Home do menu principal." },
    { key: "nav_event_visible", label: "Evento", description: "Item Evento do menu principal." },
    { key: "nav_ex_alumni_visible", label: "Ex-alunos", description: "Item consolidado com Turma, Quem Vai e Mapa." },
    { key: "nav_photos_visible", label: "Nossa História", description: "Item Nossa História do menu principal." },
    { key: "nav_polls_visible", label: "Curiosidades", description: "Item Curiosidades do menu principal." },
    { key: "nav_archive_visible", label: "Pós-festa", description: "Item Pós-festa do menu principal." },
  ];

  function toggleHeaderVisibility(key: keyof ExtendedHomePageContent) {
    setHomeDraft(s => ({ ...s, [key]: !isContentVisible(s[key]) } as ExtendedHomePageContent));
  }

  function setTimelineDraftItems(items: NostalgiaTimelineItemContent[]) {
    const normalizedItems = sortNostalgiaTimelineItems(items.map(item => ({
      year: item.year ?? "",
      title: item.title ?? item.label ?? "",
      description: item.description ?? item.desc ?? "",
      ...(item.icon ? { icon: item.icon } : {}),
      ...(item.image_url ? { image_url: item.image_url } : {}),
      is_visible: item.is_visible !== false,
    })));
    const legacyItems = normalizedItems.map(item => ({
      year: item.year,
      label: item.title,
      desc: item.description,
      is_visible: item.is_visible,
    }));
    setHomeDraft(s => ({
      ...s,
      home_nostalgia_timeline_json: JSON.stringify(normalizedItems, null, 2),
      timeline_items_json: JSON.stringify(legacyItems, null, 2),
    }));
  }

  function setSectionDraftItems(items: HomeSectionContent[]) {
    setHomeDraft(s => ({ ...s, home_sections_json: JSON.stringify(items, null, 2) }));
  }

  function setFooterDraftLinks(items: FooterLinkContent[]) {
    setHomeDraft(s => ({ ...s, footer_links_json: JSON.stringify(items, null, 2) }));
  }

  function setEventGalleryItems(items: EventPageGalleryItem[]) {
    setEventDraft(s => ({ ...s, gallery_json: JSON.stringify(items, null, 2) }));
  }

  function setEventAttractionItems(items: EventPageInfoItem[]) {
    setEventDraft(s => ({ ...s, attractions_json: JSON.stringify(items, null, 2) }));
  }

  function setEventScheduleItems(items: EventPageScheduleItem[]) {
    setEventDraft(s => ({ ...s, schedule_json: JSON.stringify(items, null, 2) }));
  }

  function setEventExtraInfoItems(items: EventPageInfoItem[]) {
    setEventDraft(s => ({ ...s, extra_info_json: JSON.stringify(items, null, 2) }));
  }

  if (!auth.isAdmin) return <PermissionState />;

  return (
    <div data-admin-root className="min-h-screen bg-[#080f08]">
      <AdminPeopleImportModal
        open={peopleImportOpen}
        onClose={() => setPeopleImportOpen(false)}
        adminId={auth.userId}
        onImported={(imported) => setPeopleRows(current => [...imported, ...current].sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR")))}
      />
      <AdminPersonEditModal
        open={Boolean(selectedAdminPerson)}
        person={selectedAdminPerson}
        adminId={auth.userId}
        onClose={() => setSelectedAdminPerson(null)}
        onSaved={(updated) => setPeopleRows(current => current.map(person => person.id === updated.id ? updated : person).sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR")))}
      />
      <ConfirmDialog
        open={leaveConfirmationOpen}
        onClose={cancelLeaveWithoutSaving}
        onConfirm={confirmLeaveWithoutSaving}
        title="Deseja sair sem salvar as alterações?"
        message="As alterações feitas nesta página serão perdidas."
        confirmLabel="Sair sem salvar"
        danger
      />
      <div data-admin-header className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Painel Admin</p>
          </div>
        </div>
        <nav data-admin-group-navigation className="hidden md:flex flex-wrap justify-end gap-1.5">
          {adminGroups.map(group => {
            const active = group.tabs.some(item => item.id === tab) || group.id === tab;
            const firstAvailable = group.tabs.find(item => !item.disabled);
            return (
              <button key={group.id} onClick={() => firstAvailable && selectAdminTab(firstAvailable.id)}
                className={`inline-flex items-center gap-1.5 border px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors ${active ? "border-[#c9a84c] text-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {group.icon}{group.label}
              </button>
            );
          })}
        </nav>
        <button
          type="button"
          data-admin-mobile-navigation-trigger
          onClick={() => setMobileNavigationOpen(true)}
          aria-expanded={mobileNavigationOpen}
          aria-controls="admin-mobile-navigation"
          className="md:hidden min-h-11 max-w-[65%] border border-[#2d6a4f]/40 px-3 py-2 text-right"
        >
          <span className="block text-[#c9a84c] font-mono text-[9px] uppercase tracking-wider">{activeAdminGroup.label}</span>
          <span className="block text-[#f0ebe0] text-sm font-semibold truncate">{activeAdminItem.label}</span>
        </button>
      </div>

      {adminGroups.find(group => group.tabs.some(item => item.id === tab)) && (
        <div data-admin-subtabs className="hidden md:flex flex-wrap gap-1 border-b border-[#2d6a4f]/20 px-4 py-2 bg-[#0a120a]">
          {adminGroups.find(group => group.tabs.some(item => item.id === tab))?.tabs.map(item => (
            <button key={item.id} disabled={item.disabled} onClick={() => !item.disabled && selectAdminTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-30 ${selectedSubtab === (item.id === "event-content" ? "event" : item.id === "archive-content" ? "archive" : item.id) ? "bg-[#2d6a4f] text-[#f0ebe0]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}

      {mobileNavigationOpen && (
        <div id="admin-mobile-navigation" data-admin-mobile-navigation className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-label="Navegação do painel administrativo">
          <button type="button" aria-label="Fechar navegação" className="absolute inset-0 bg-black/70" onClick={() => setMobileNavigationOpen(false)} />
          <section className="absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto bg-[#080f08] border-t border-[#2d6a4f]/40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">Navegação</p>
                <p className="text-[#f0ebe0] font-['Playfair_Display'] text-xl font-bold">{activeAdminGroup.label} · {activeAdminItem.label}</p>
              </div>
              <button type="button" onClick={() => setMobileNavigationOpen(false)} aria-label="Fechar navegação" className="min-h-11 min-w-11 inline-flex items-center justify-center border border-[#2d6a4f]/40 text-[#f0ebe0]"><X size={20} /></button>
            </div>

            <div data-admin-mobile-groups className="grid grid-cols-2 gap-2">
              {adminGroups.map(group => {
                const active = group.id === activeAdminGroup.id;
                const firstAvailable = group.tabs.find(item => !item.disabled);
                return (
                  <button
                    type="button"
                    key={group.id}
                    onClick={() => firstAvailable && selectAdminTab(firstAvailable.id)}
                    className={`min-h-11 inline-flex items-center justify-center gap-2 border px-3 py-2 text-xs font-mono uppercase ${active ? "border-[#c9a84c] text-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a]"}`}
                  >
                    {group.icon}{group.label}
                  </button>
                );
              })}
            </div>

            <div data-admin-mobile-subtabs className="mt-4 border-t border-[#2d6a4f]/20 pt-4 grid grid-cols-2 gap-2">
              {activeAdminGroup.tabs.map(item => {
                const itemKey = item.id === "event-content" ? "event" : item.id === "archive-content" ? "archive" : item.id === "home-content" ? "home" : item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    disabled={item.disabled}
                    onClick={() => { if (!item.disabled) { selectAdminTab(item.id); setMobileNavigationOpen(false); } }}
                    className={`min-h-11 inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-mono disabled:opacity-30 ${selectedSubtab === itemKey ? "bg-[#2d6a4f] text-[#f0ebe0]" : "bg-[#0a120a] text-[#7a9a7a]"}`}
                  >
                    {item.icon}{item.label}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      <div data-admin-content className="p-4 md:p-8 max-w-7xl mx-auto">
        <SaveToast show={saved} />
        {toast && <ToastNotification toast={toast} onClose={hideToast} />}
        {loading && <LoadingState message="Carregando painel..." />}

        {!loading && tab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                [String(reports.tickets_sold ?? 0), "Ingressos vendidos", "Total"],
                ["R$ " + ((reports.revenue_cents ?? 0) / 100).toFixed(2), "Receita total", "Aprovado"],
                [String(reports.orders_pending ?? 0), "Pagamentos pendentes", "Aguardando"],
                [String(reports.checkins_done ?? 0), "Check-ins realizados", "Evento"],
              ] as const).map(([val,label,delta]) => (
                <div key={label} className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-3xl mb-1">{val}</p>
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{label}</p>
                  <p className="text-[#c9a84c] text-xs mt-1">{delta}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Ingressos por tipo</p>
              {lots.length === 0 ? <EmptyState title="Nenhum lote encontrado" /> : lots.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-4 mb-3">
                  <span className="text-[#7a9a7a] font-mono text-xs w-32 truncate">{l.name}</span>
                  <div className="flex-1 h-2 bg-[#1a2e1a]">
                    <div className="h-full" style={{ width: String(l.available_quantity ? (l.sold_quantity/l.available_quantity)*100 : 0) + "%", background:["#2d6a4f","#40916c","#c9a84c"][idx % 3] }} />
                  </div>
                  <span className="text-[#f0ebe0] font-mono text-xs">{l.sold_quantity}/{l.available_quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && tab === "home-content" && (!canManageEvent ? <PermissionState /> : (
          <div className="flex flex-col gap-6">
            {contentTab === "header" && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Header</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Logo, textos de fallback, CTA e labels do menu principal.</p>
                  </div>
                  <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar header</Btn>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-[160px_1fr] gap-4 items-center bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                  <div className="aspect-square w-40 max-w-full bg-[#080f08] border border-[#2d6a4f]/25 flex items-center justify-center overflow-hidden">
                    {headerLogoPreviewUrl || homeDraft.header_logo_url ? (
                      <img src={headerLogoPreviewUrl ?? homeDraft.header_logo_url ?? ""} alt={homeDraft.header_logo_alt || "Preview do logo"} className="h-full w-full object-contain p-3" />
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 rounded-full border border-[#c9a84c]/70 bg-[#0d1a0f] flex items-center justify-center">
                          <span className="font-['Playfair_Display'] text-[#c9a84c] text-xl font-black leading-none">{homeDraft.header_fallback_badge_main}</span>
                          <span className="absolute -bottom-1 -right-1 bg-[#c9a84c] text-[#0d1a0f] font-mono text-[8px] font-black px-1 leading-4">{homeDraft.header_fallback_badge_year}</span>
                        </div>
                        <div>
                          <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-base leading-tight tracking-wide uppercase">{homeDraft.header_fallback_title}</p>
                          <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-[0.25em] leading-none mt-1">{homeDraft.header_fallback_subtitle}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#f0ebe0] font-semibold text-sm mb-1">Logo do header</p>
                    <p className="text-[#7a9a7a] text-xs mb-3">Envie PNG, JPG ou WEBP. O preview aparece imediatamente e o arquivo é salvo em 512×512 px.</p>
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] cursor-pointer transition-colors">
                      <Upload size={14} />{busy === "header-logo" ? "Enviando..." : "Enviar logo"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="sr-only"
                        disabled={busy === "header-logo"}
                        onChange={e => {
                          const file = e.currentTarget.files?.[0] ?? null;
                          void handleHeaderLogoUpload(file);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="mb-6 grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 items-center bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                  <div className="h-20 bg-[#080f08] border border-[#2d6a4f]/25 flex items-center justify-center overflow-hidden">
                    {faviconPreviewUrl || homeDraft.favicon_url ? (
                      <img src={faviconPreviewUrl ?? homeDraft.favicon_url ?? ""} alt="Preview do favicon" className="h-10 w-10 object-contain" />
                    ) : (
                      <div className="h-10 w-10 border border-[#c9a84c]/60 bg-[#0d1a0f] flex items-center justify-center">
                        <Star size={20} className="text-[#c9a84c]" />
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-[#f0ebe0] font-semibold text-sm mb-1">Favicon do site</p>
                    <p className="text-[#7a9a7a] text-xs mb-3">Envie PNG, SVG, ICO, JPG ou WEBP. Recomendado: imagem quadrada de 512×512 px ou SVG simplificado.</p>
                    <div className="flex flex-wrap gap-2">
                      <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#2d6a4f]/50 text-[#f0ebe0] hover:bg-[#1a2e1a] cursor-pointer transition-colors">
                        <Upload size={14} />{busy === "favicon" ? "Enviando..." : "Enviar favicon"}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
                          className="sr-only"
                          disabled={busy === "favicon"}
                          onChange={e => {
                            const file = e.currentTarget.files?.[0] ?? null;
                            void handleFaviconUpload(file);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>
                      {homeDraft.favicon_url && (
                        <button
                          type="button"
                          onClick={handleFaviconRemove}
                          disabled={busy === "favicon"}
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold uppercase tracking-[0.15em] border border-[#c0392b]/40 text-[#ffb4a8] hover:bg-[#c0392b]/10 disabled:opacity-50 transition-colors"
                        >
                          Remover favicon
                        </button>
                      )}
                    </div>
                    {homeDraft.favicon_url && <p className="text-[#3a5a3a] text-[11px] mt-3 break-all">URL atual: {homeDraft.favicon_url}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Texto alternativo do logo" value={homeDraft.header_logo_alt} onChange={v => setHomeDraft(s => ({ ...s, header_logo_alt: v }))} />
                  <Field label="CTA do header" value={homeDraft.header_cta_label} onChange={v => setHomeDraft(s => ({ ...s, header_cta_label: v }))} />
                  <Field label="Fallback símbolo principal" value={homeDraft.header_fallback_badge_main} onChange={v => setHomeDraft(s => ({ ...s, header_fallback_badge_main: v }))} />
                  <Field label="Fallback selo/ano" value={homeDraft.header_fallback_badge_year} onChange={v => setHomeDraft(s => ({ ...s, header_fallback_badge_year: v }))} />
                  <Field label="Fallback título" value={homeDraft.header_fallback_title} onChange={v => setHomeDraft(s => ({ ...s, header_fallback_title: v }))} />
                  <Field label="Fallback subtítulo" value={homeDraft.header_fallback_subtitle} onChange={v => setHomeDraft(s => ({ ...s, header_fallback_subtitle: v }))} />
                </div>

                <div className="border-t border-[#2d6a4f]/20 mt-6 pt-6">
                  <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Visibilidade dos botões do header</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {headerVisibilityControls.map(control => {
                      const visible = isContentVisible(homeDraft[control.key]);
                      return (
                        <button
                          key={String(control.key)}
                          type="button"
                          onClick={() => toggleHeaderVisibility(control.key)}
                          className={"text-left border p-4 transition-colors " + (visible ? "bg-[#0a120a] border-[#2d6a4f]/50" : "bg-[#080f08] border-[#2d6a4f]/15 opacity-70")}
                        >
                          <span className={"inline-flex items-center px-2 py-1 text-[9px] font-mono uppercase tracking-wider mb-3 " + (visible ? "bg-[#2d6a4f]/30 text-[#74c69d]" : "bg-[#1e2a1e] text-[#7a9a7a]")}>
                            {visible ? "Visível" : "Oculto"}
                          </span>
                          <p className="text-[#f0ebe0] font-semibold text-sm">{control.label}</p>
                          <p className="text-[#7a9a7a] text-xs mt-1 leading-relaxed">{control.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t border-[#2d6a4f]/20 mt-6 pt-6">
                  <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Menu principal</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Home" value={homeDraft.nav_home_label} onChange={v => setHomeDraft(s => ({ ...s, nav_home_label: v }))} />
                    <Field label="Evento" value={homeDraft.nav_event_label} onChange={v => setHomeDraft(s => ({ ...s, nav_event_label: v }))} />
                    <Field label="Ex-alunos" value={homeDraft.nav_ex_alumni_label} onChange={v => setHomeDraft(s => ({ ...s, nav_ex_alumni_label: v }))} />
                    <Field label="Nossa História" value={homeDraft.nav_photos_label} onChange={v => setHomeDraft(s => ({ ...s, nav_photos_label: v }))} />
                    <Field label="Curiosidades" value={homeDraft.nav_polls_label} onChange={v => setHomeDraft(s => ({ ...s, nav_polls_label: v }))} />
                    <Field label="Pós-festa" value={homeDraft.nav_archive_label} onChange={v => setHomeDraft(s => ({ ...s, nav_archive_label: v }))} />
                  </div>
                </div>
              </div>
            )}

            {contentTab === "home" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Home / Hero</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Textos principais da dobra inicial e chamadas de ação.</p>
                    </div>
                    <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar home</Btn>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Chamada superior do hero" value={homeDraft.hero_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, hero_eyebrow: v }))} />
                    <Field label="Título principal" value={homeDraft.hero_title} onChange={v => setHomeDraft(s => ({ ...s, hero_title: v }))} />
                    <Field label="Linha de apoio do título" value={homeDraft.hero_tagline} onChange={v => setHomeDraft(s => ({ ...s, hero_tagline: v }))} />
                    <Field label="Data/local no hero" value={homeDraft.hero_event_line} onChange={v => setHomeDraft(s => ({ ...s, hero_event_line: v }))} />
                    <Field label="CTA principal" value={homeDraft.primary_cta_label} onChange={v => setHomeDraft(s => ({ ...s, primary_cta_label: v }))} />
                    <Field label="CTA secundário" value={homeDraft.secondary_cta_label} onChange={v => setHomeDraft(s => ({ ...s, secondary_cta_label: v }))} />
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Destino CTA principal</label>
                      <select value={homeDraft.primary_cta_page} onChange={e => setHomeDraft(s => ({ ...s, primary_cta_page: normalizePage(e.target.value, "tickets") }))}
                        className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                        {PAGE_OPTIONS.map(option => <option key={option.page} value={option.page}>{option.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Destino CTA secundário</label>
                      <select value={homeDraft.secondary_cta_page} onChange={e => setHomeDraft(s => ({ ...s, secondary_cta_page: normalizePage(e.target.value, "who-going") }))}
                        className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                        {PAGE_OPTIONS.map(option => <option key={option.page} value={option.page}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <FieldArea rows={3} label="Subtítulo do hero" value={homeDraft.hero_subtitle} onChange={v => setHomeDraft(s => ({ ...s, hero_subtitle: v }))} />
                    </div>
                  </div>
                </div>

                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Seções da home</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Eyebrow sobre" value={homeDraft.about_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, about_eyebrow: v }))} />
                    <Field label="Título sobre" value={homeDraft.about_title} onChange={v => setHomeDraft(s => ({ ...s, about_title: v }))} />
                    <div className="md:col-span-2"><FieldArea rows={3} label="Texto sobre 1" value={homeDraft.about_body_1} onChange={v => setHomeDraft(s => ({ ...s, about_body_1: v }))} /></div>
                    <div className="md:col-span-2"><FieldArea rows={3} label="Texto sobre 2" value={homeDraft.about_body_2} onChange={v => setHomeDraft(s => ({ ...s, about_body_2: v }))} /></div>
                    <Field label="Eyebrow informações" value={homeDraft.info_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, info_eyebrow: v }))} />
                    <Field label="Título informações" value={homeDraft.info_title} onChange={v => setHomeDraft(s => ({ ...s, info_title: v }))} />
                    <Field label="Eyebrow ingressos" value={homeDraft.tickets_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, tickets_eyebrow: v }))} />
                    <Field label="Título ingressos" value={homeDraft.tickets_title} onChange={v => setHomeDraft(s => ({ ...s, tickets_title: v }))} />
                    <Field label="Eyebrow confirmados" value={homeDraft.confirmed_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, confirmed_eyebrow: v }))} />
                    <Field label="Título confirmados" value={homeDraft.confirmed_title} onChange={v => setHomeDraft(s => ({ ...s, confirmed_title: v }))} />
                    <Field label="Eyebrow fotos" value={homeDraft.photos_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, photos_eyebrow: v }))} />
                    <Field label="Título fotos" value={homeDraft.photos_title} onChange={v => setHomeDraft(s => ({ ...s, photos_title: v }))} />
                  </div>
                </div>
              </div>
            )}

            {contentTab === "event" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Página Evento</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Gerencie texto, galeria, mapa, atrações, horários e estrutura da página /evento.</p>
                    </div>
                    <Btn size="sm" onClick={saveEventContent} disabled={busy === "event-content"}><Save size={14} />Salvar evento</Btn>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Eyebrow" value={eventDraft.hero_eyebrow} onChange={v => setEventDraft(s => ({ ...s, hero_eyebrow: v }))} />
                    <Field label="Título" value={eventDraft.title} onChange={v => setEventDraft(s => ({ ...s, title: v }))} />
                    <Field label="Subtítulo" value={eventDraft.subtitle} onChange={v => setEventDraft(s => ({ ...s, subtitle: v }))} />
                    <div>
                      <Field label="Imagem principal" value={eventDraft.hero_image_url ?? ""} onChange={v => setEventDraft(s => ({ ...s, hero_image_url: v }))} placeholder="https://..." />
                      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 border border-[#2d6a4f]/40 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#f0ebe0] hover:border-[#c9a84c]">
                        <Upload size={13} />{busy === "event-hero-upload" ? "Enviando..." : "Carregar imagem do topo"}
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy === "event-hero-upload"} onChange={event => { void uploadEventHeroImage(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                      </label>
                      {eventDraft.hero_image_url && <img src={eventDraft.hero_image_url} alt="Preview da imagem principal" className="mt-3 aspect-[16/7] w-full border border-[#2d6a4f]/25 object-cover" />}
                    </div>
                    <div className="md:col-span-2"><FieldArea rows={5} label="Descrição" value={eventDraft.description} onChange={v => setEventDraft(s => ({ ...s, description: v }))} /></div>
                    <Field label="Google Maps embed ou src" value={eventDraft.map_embed_url ?? ""} onChange={v => setEventDraft(s => ({ ...s, map_embed_url: v }))} placeholder="Cole a URL ou iframe do mapa" />
                    <Field label="Link externo do mapa" value={eventDraft.map_link_url ?? ""} onChange={v => setEventDraft(s => ({ ...s, map_link_url: v }))} placeholder="https://maps.google.com/..." />
                    <div className="md:col-span-2"><FieldArea rows={3} label="Observações sobre o local" value={eventDraft.venue_notes} onChange={v => setEventDraft(s => ({ ...s, venue_notes: v }))} /></div>
                  </div>
                </div>

                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Galeria</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Fotos de referência para a página Evento.</p>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setEventGalleryItems([...eventGalleryItems, { image_url: "", caption: "" }])}>Adicionar foto</Btn>
                  </div>
                  <div className="flex flex-col gap-4">
                    {eventGalleryItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                        <div>
                          <Field label="URL da imagem" value={item.image_url} onChange={v => setEventGalleryItems(updateEventGalleryItem(eventGalleryItems, i, { image_url: v }))} />
                          <label className="mt-2 inline-flex cursor-pointer items-center gap-2 border border-[#2d6a4f]/40 px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-[#f0ebe0] hover:border-[#c9a84c]">
                            <Upload size={12} />{busy === `event-gallery-${i}` ? "Enviando..." : "Carregar imagem"}
                            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy === `event-gallery-${i}`} onChange={event => { void uploadEventGalleryImage(i, event.target.files?.[0]); event.currentTarget.value = ""; }} />
                          </label>
                          {item.image_url && <img src={item.image_url} alt={item.caption || `Imagem ${i + 1} da galeria`} className="mt-3 aspect-video w-full max-w-xs border border-[#2d6a4f]/25 object-cover" />}
                        </div>
                        <Field label="Legenda" value={item.caption ?? ""} onChange={v => setEventGalleryItems(updateEventGalleryItem(eventGalleryItems, i, { caption: v }))} />
                        <Btn size="sm" variant="ghost" onClick={() => setEventGalleryItems(eventGalleryItems.filter((_, index) => index !== i))}><X size={14} /></Btn>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Programação</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Horários e descrição da noite.</p>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setEventScheduleItems([...eventScheduleItems, { time: "", title: "", description: "" }])}>Adicionar horário</Btn>
                  </div>
                  <div className="flex flex-col gap-4">
                    {eventScheduleItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-[120px_1fr_1fr_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                        <Field label="Horário" value={item.time} onChange={v => setEventScheduleItems(updateEventInfoItem(eventScheduleItems, i, { time: v }))} />
                        <Field label="Título" value={item.title} onChange={v => setEventScheduleItems(updateEventInfoItem(eventScheduleItems, i, { title: v }))} />
                        <Field label="Descrição" value={item.description ?? ""} onChange={v => setEventScheduleItems(updateEventInfoItem(eventScheduleItems, i, { description: v }))} />
                        <Btn size="sm" variant="ghost" onClick={() => setEventScheduleItems(eventScheduleItems.filter((_, index) => index !== i))}><X size={14} /></Btn>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Atrações</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Bandas, DJ, experiências e outros destaques.</p>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setEventAttractionItems([...eventAttractionItems, { title: "", description: "" }])}>Adicionar atração</Btn>
                  </div>
                  <div className="flex flex-col gap-4">
                    {eventAttractionItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                        <Field label="Título" value={item.title} onChange={v => setEventAttractionItems(updateEventInfoItem(eventAttractionItems, i, { title: v }))} />
                        <Field label="Descrição" value={item.description} onChange={v => setEventAttractionItems(updateEventInfoItem(eventAttractionItems, i, { description: v }))} />
                        <Btn size="sm" variant="ghost" onClick={() => setEventAttractionItems(eventAttractionItems.filter((_, index) => index !== i))}><X size={14} /></Btn>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Estrutura e orientações</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Bar/comidas, banheiros, segurança e informações extras.</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <FieldArea rows={4} label="Bar e comidas" value={eventDraft.food_bar_text} onChange={v => setEventDraft(s => ({ ...s, food_bar_text: v }))} />
                    <FieldArea rows={4} label="Banheiros" value={eventDraft.bathrooms_text} onChange={v => setEventDraft(s => ({ ...s, bathrooms_text: v }))} />
                    <FieldArea rows={4} label="Segurança" value={eventDraft.security_text} onChange={v => setEventDraft(s => ({ ...s, security_text: v }))} />
                  </div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Informações extras</p>
                    <Btn size="sm" variant="ghost" onClick={() => setEventExtraInfoItems([...eventExtraInfoItems, { title: "", description: "" }])}>Adicionar item</Btn>
                  </div>
                  <div className="flex flex-col gap-4">
                    {eventExtraInfoItems.map((item, i) => (
                      <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                        <Field label="Título" value={item.title} onChange={v => setEventExtraInfoItems(updateEventInfoItem(eventExtraInfoItems, i, { title: v }))} />
                        <Field label="Descrição" value={item.description} onChange={v => setEventExtraInfoItems(updateEventInfoItem(eventExtraInfoItems, i, { description: v }))} />
                        <Btn size="sm" variant="ghost" onClick={() => setEventExtraInfoItems(eventExtraInfoItems.filter((_, index) => index !== i))}><X size={14} /></Btn>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {contentTab === "archive" && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Página Pós-festa</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Gerencie a abertura do acervo e a mensagem exibida em /pos-festa.</p>
                  </div>
                  <Btn size="sm" onClick={saveArchiveContent} disabled={busy === "archive-content"}><Save size={14} />Salvar Pós-festa</Btn>
                </div>
                <div className="flex flex-col gap-5">
                  <label className="flex items-center gap-3 text-sm text-[#f0ebe0]">
                    <input type="checkbox" checked={Boolean(archiveDraft.archive_enabled)} onChange={event => setArchiveDraft(current => ({ ...current, archive_enabled: event.target.checked }))} className="accent-[#2d6a4f]" />
                    Abrir a página Pós-festa ao público
                  </label>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Chamada superior" value={archiveDraft.page_eyebrow ?? "Pós-festa"} onChange={value => setArchiveDraft(current => ({ ...current, page_eyebrow: value }))} />
                    <Field label="Título da página" value={archiveDraft.page_title ?? "Memórias do reencontro"} onChange={value => setArchiveDraft(current => ({ ...current, page_title: value }))} />
                    <Field label="Label da mensagem" value={archiveDraft.message_label ?? "Mensagem da organização"} onChange={value => setArchiveDraft(current => ({ ...current, message_label: value }))} />
                    <Field label="Título antes da abertura" value={archiveDraft.closed_title ?? "O acervo será aberto depois do reencontro."} onChange={value => setArchiveDraft(current => ({ ...current, closed_title: value }))} />
                  </div>
                  <FieldArea rows={3} label="Texto antes da abertura" value={archiveDraft.closed_text ?? ""} onChange={value => setArchiveDraft(current => ({ ...current, closed_text: value }))} />
                  <FieldArea rows={6} label="Mensagem da organização" value={archiveDraft.post_event_text ?? ""} onChange={value => setArchiveDraft(current => ({ ...current, post_event_text: value }))} />
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <Field label="Título do vídeo oficial" value={archiveDraft.official_video_title ?? ""} onChange={value => setArchiveDraft(current => ({ ...current, official_video_title: value }))} />
                    <Field label="URL do vídeo oficial" value={archiveDraft.official_video_url ?? ""} onChange={value => setArchiveDraft(current => ({ ...current, official_video_url: value }))} placeholder="https://..." />
                  </div>
                </div>
              </div>
            )}

            {contentTab === "sections" && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Seções da Home</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Controle ordem e visibilidade dos blocos públicos da página inicial.</p>
                  </div>
                  <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar seções</Btn>
                </div>

                <div className="flex flex-col gap-4">
                  {sectionDraftItems.map((item, i) => (
                    <div key={item.key} className="grid grid-cols-1 md:grid-cols-[1fr_140px_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                      <Field label="Nome interno da seção" value={item.label} onChange={v => setSectionDraftItems(updateHomeSection(sectionDraftItems, i, { label: v }))} />
                      <Field label="Ordem" type="number" value={String(item.sort_order)} onChange={v => setSectionDraftItems(updateHomeSection(sectionDraftItems, i, { sort_order: Number(v) || 0 }))} />
                      <Btn size="sm" variant={item.is_visible === false ? "ghost" : "gold"} onClick={() => setSectionDraftItems(updateHomeSection(sectionDraftItems, i, { is_visible: item.is_visible === false ? true : false }))}>
                        {item.is_visible === false ? "Oculta" : "Visível"}
                      </Btn>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentTab === "labels" && (
              <div className="flex flex-col gap-6">
                <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Labels e textos auxiliares</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Edite botões, mensagens vazias, labels do countdown, cards de informações e limites da Home.</p>
                    </div>
                    <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar labels</Btn>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Countdown — dias" value={homeDraft.countdown_days_label} onChange={v => setHomeDraft(s => ({ ...s, countdown_days_label: v }))} />
                    <Field label="Countdown — horas" value={homeDraft.countdown_hours_label} onChange={v => setHomeDraft(s => ({ ...s, countdown_hours_label: v }))} />
                    <Field label="Countdown — minutos" value={homeDraft.countdown_minutes_label} onChange={v => setHomeDraft(s => ({ ...s, countdown_minutes_label: v }))} />
                    <Field label="Countdown — segundos" value={homeDraft.countdown_seconds_label} onChange={v => setHomeDraft(s => ({ ...s, countdown_seconds_label: v }))} />

                    <Field label="Info — label data" value={homeDraft.info_date_label} onChange={v => setHomeDraft(s => ({ ...s, info_date_label: v }))} />
                    <Field label="Info — label horário" value={homeDraft.info_time_label} onChange={v => setHomeDraft(s => ({ ...s, info_time_label: v }))} />
                    <Field label="Info — label local" value={homeDraft.info_location_label} onChange={v => setHomeDraft(s => ({ ...s, info_location_label: v }))} />
                    <Field label="Info — fallback horário" value={homeDraft.info_time_fallback_label} onChange={v => setHomeDraft(s => ({ ...s, info_time_fallback_label: v }))} />
                    <Field label="Info — subtítulo data" value={homeDraft.info_doors_subtitle_template} onChange={v => setHomeDraft(s => ({ ...s, info_doors_subtitle_template: v }))} hint="Use {time} para inserir o horário calculado." />
                    <Field label="Info — subtítulo horário" value={homeDraft.info_dinner_subtitle_template} onChange={v => setHomeDraft(s => ({ ...s, info_dinner_subtitle_template: v }))} hint="Use {time} para inserir o horário calculado." />
                    <Field label="Info — CTA para /evento" value={homeDraft.event_info_view_more_label} onChange={v => setHomeDraft(s => ({ ...s, event_info_view_more_label: v }))} />

                    <Field label="Ingressos — limite na Home" type="number" value={homeDraft.tickets_preview_limit} onChange={v => setHomeDraft(s => ({ ...s, tickets_preview_limit: v }))} />
                    <Field label="Ingressos — botão ver todos" value={homeDraft.tickets_view_all_label} onChange={v => setHomeDraft(s => ({ ...s, tickets_view_all_label: v }))} />
                    <Field label="Ingressos — label do lote" value={homeDraft.tickets_active_lot_label} onChange={v => setHomeDraft(s => ({ ...s, tickets_active_lot_label: v }))} />
                    <Field label="Ingressos — botão comprar" value={homeDraft.tickets_buy_label} onChange={v => setHomeDraft(s => ({ ...s, tickets_buy_label: v }))} />
                    <Field label="Ingressos — label esgotado" value={homeDraft.tickets_sold_out_label} onChange={v => setHomeDraft(s => ({ ...s, tickets_sold_out_label: v }))} />
                    <Field label="Ingressos — disponibilidade" value={homeDraft.tickets_remaining_label_template} onChange={v => setHomeDraft(s => ({ ...s, tickets_remaining_label_template: v }))} hint="Use {available} e {total}." />
                    <Field label="Ingressos — vazio título" value={homeDraft.tickets_empty_title} onChange={v => setHomeDraft(s => ({ ...s, tickets_empty_title: v }))} />
                    <Field label="Ingressos — vazio CTA" value={homeDraft.tickets_empty_cta_label} onChange={v => setHomeDraft(s => ({ ...s, tickets_empty_cta_label: v }))} />
                    <div className="md:col-span-2"><FieldArea rows={2} label="Ingressos — vazio texto" value={homeDraft.tickets_empty_subtitle} onChange={v => setHomeDraft(s => ({ ...s, tickets_empty_subtitle: v }))} /></div>

                    <Field label="Confirmados — limite na Home" type="number" value={homeDraft.confirmed_preview_limit} onChange={v => setHomeDraft(s => ({ ...s, confirmed_preview_limit: v }))} />
                    <Field label="Confirmados — botão ver todos" value={homeDraft.confirmed_view_all_label} onChange={v => setHomeDraft(s => ({ ...s, confirmed_view_all_label: v }))} />
                    <div className="md:col-span-2"><FieldArea rows={2} label="Confirmados — nota de privacidade" value={homeDraft.confirmed_privacy_note} onChange={v => setHomeDraft(s => ({ ...s, confirmed_privacy_note: v }))} /></div>

                    <Field label="Fotos — limite na Home" type="number" value={homeDraft.photos_preview_limit} onChange={v => setHomeDraft(s => ({ ...s, photos_preview_limit: v }))} />
                    <Field label="Fotos — botão ver todas" value={homeDraft.photos_view_all_label} onChange={v => setHomeDraft(s => ({ ...s, photos_view_all_label: v }))} />
                    <Field label="Fotos — vazio título" value={homeDraft.photos_empty_title} onChange={v => setHomeDraft(s => ({ ...s, photos_empty_title: v }))} />
                    <Field label="Fotos — vazio CTA" value={homeDraft.photos_empty_cta_label} onChange={v => setHomeDraft(s => ({ ...s, photos_empty_cta_label: v }))} />
                    <div className="md:col-span-2"><FieldArea rows={2} label="Fotos — vazio texto" value={homeDraft.photos_empty_subtitle} onChange={v => setHomeDraft(s => ({ ...s, photos_empty_subtitle: v }))} /></div>
                  </div>
                </div>
              </div>
            )}

            {contentTab === "timeline" && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Linha do tempo</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Edite os marcos exibidos na timeline da seção Sobre da página inicial.</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => setTimelineDraftItems([...timelineDraftItems, { year: "2026", title: "Novo marco", description: "Descreva este momento.", is_visible: true }])}>Adicionar marco</Btn>
                    <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar timeline</Btn>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  {timelineDraftItems.map((item, i) => (
                    <div key={`${item.year}-${i}`} className="bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-4 mb-4">
                        <Field label="Ano" value={item.year ?? ""} onChange={v => setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, i, { year: v }))} />
                        <Field label="Título do marco" value={item.title ?? item.label ?? ""} onChange={v => setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, i, { title: v, label: undefined }))} />
                        <div className="md:col-span-2">
                          <FieldArea rows={3} label="Descrição" value={item.description ?? item.desc ?? ""} onChange={v => setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, i, { description: v, desc: undefined }))} />
                        </div>
                        <div className="md:col-span-2">
                          <label className="inline-flex cursor-pointer items-center gap-2 border border-[#2d6a4f]/40 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#f0ebe0] hover:border-[#c9a84c]">
                            <Upload size={13} />{busy === `timeline-image-${i}` ? "Enviando..." : "Carregar imagem do marco"}
                            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy === `timeline-image-${i}`} onChange={event => { void uploadTimelineImage(i, event.target.files?.[0]); event.currentTarget.value = ""; }} />
                          </label>
                          {item.image_url && (
                            <div className="mt-3 flex items-start gap-3">
                              <img src={item.image_url} alt={item.title || `Marco ${i + 1}`} className="aspect-video w-48 border border-[#2d6a4f]/25 object-cover" />
                              <Btn size="sm" variant="ghost" onClick={() => setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, i, { image_url: undefined }))}>Remover imagem</Btn>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Btn size="sm" variant={item.is_visible === false ? "ghost" : "gold"} onClick={() => setTimelineDraftItems(updateNostalgiaTimelineItem(timelineDraftItems, i, { is_visible: item.is_visible === false ? true : false }))}>
                          {item.is_visible === false ? "Oculto" : "Visível"}
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => setTimelineDraftItems(timelineDraftItems.filter((_, itemIndex) => itemIndex !== i))}>
                          <X size={12} />Remover
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {contentTab === "faq" && (
              <AdminFaqPanel
                eventId={DEFAULT_EVENT_ID}
                adminId={admins.find(admin => admin.user_id === auth.userId)?.id ?? null}
                role={auth.role ?? null}
                adminUsers={admins}
                sectionSettings={{
                  eyebrow: homeDraft.faq_eyebrow,
                  title: homeDraft.faq_title,
                  searchPlaceholder: homeDraft.faq_search_placeholder,
                  emptyLabel: homeDraft.faq_empty_label,
                  viewAllLabel: homeDraft.faq_view_all_label,
                  initialMode: homeDraft.faq_initial_mode,
                }}
                onSectionSettingsChange={setFaqSectionSettings}
                onSaveSectionSettings={saveFaqSectionSettings}
                notify={showToast}
              />
            )}

            {contentTab === "footer" && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Rodapé</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Texto institucional, contatos, títulos e labels legais do footer.</p>
                  </div>
                  <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar rodapé</Btn>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field label="Eyebrow do rodapé" value={homeDraft.footer_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, footer_eyebrow: v }))} />
                  <Field label="Título do rodapé" value={homeDraft.footer_title} onChange={v => setHomeDraft(s => ({ ...s, footer_title: v }))} />
                  <div className="md:col-span-2">
                    <FieldArea rows={3} label="Texto institucional" value={homeDraft.footer_body} onChange={v => setHomeDraft(s => ({ ...s, footer_body: v }))} />
                  </div>
                  <Field label="Título da navegação" value={homeDraft.footer_nav_title} onChange={v => setHomeDraft(s => ({ ...s, footer_nav_title: v }))} />
                  <Field label="Título do contato" value={homeDraft.footer_contact_title} onChange={v => setHomeDraft(s => ({ ...s, footer_contact_title: v }))} />
                  <Field label="E-mail" value={homeDraft.footer_email} onChange={v => setHomeDraft(s => ({ ...s, footer_email: v }))} />
                  <Field label="Telefone" value={homeDraft.footer_phone} onChange={v => setHomeDraft(s => ({ ...s, footer_phone: v }))} />
                  <Field label="Localização" value={homeDraft.footer_location} onChange={v => setHomeDraft(s => ({ ...s, footer_location: v }))} />
                  <Field label="Copyright" value={homeDraft.footer_copyright} onChange={v => setHomeDraft(s => ({ ...s, footer_copyright: v }))} />
                  <Field label="Label termos" value={homeDraft.footer_terms_label} onChange={v => setHomeDraft(s => ({ ...s, footer_terms_label: v }))} />
                  <Field label="Label privacidade" value={homeDraft.footer_privacy_label} onChange={v => setHomeDraft(s => ({ ...s, footer_privacy_label: v }))} />
                  <Field label="Label admin" value={homeDraft.footer_admin_label} onChange={v => setHomeDraft(s => ({ ...s, footer_admin_label: v }))} />
                </div>

                <div className="border-t border-[#2d6a4f]/20 mt-6 pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                    <div>
                      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Links do rodapé</p>
                      <p className="text-[#3a5a3a] text-xs mt-1">Controle label, destino e visibilidade dos links da coluna de navegação.</p>
                    </div>
                    <Btn size="sm" variant="ghost" onClick={() => setFooterDraftLinks([...footerDraftLinks, { page: "home", label: "Novo link", is_visible: true }])}>Adicionar link</Btn>
                  </div>
                  <div className="flex flex-col gap-3">
                    {footerDraftLinks.map((link, i) => (
                      <div key={`${link.page}-${i}`} className="grid grid-cols-1 md:grid-cols-[1fr_180px_auto_auto] gap-3 items-end bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                        <Field label="Label" value={link.label} onChange={v => setFooterDraftLinks(updateFooterLink(footerDraftLinks, i, { label: v }))} />
                        <div>
                          <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Destino</label>
                          <select value={link.page} onChange={e => setFooterDraftLinks(updateFooterLink(footerDraftLinks, i, { page: normalizePage(e.target.value, "home") }))}
                            className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                            {PAGE_OPTIONS.map(option => <option key={option.page} value={option.page}>{option.label}</option>)}
                          </select>
                        </div>
                        <Btn size="sm" variant={link.is_visible === false ? "ghost" : "gold"} onClick={() => setFooterDraftLinks(updateFooterLink(footerDraftLinks, i, { is_visible: link.is_visible === false ? true : false }))}>
                          {link.is_visible === false ? "Oculto" : "Visível"}
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => setFooterDraftLinks(footerDraftLinks.filter((_, linkIndex) => linkIndex !== i))}>
                          <X size={12} />Remover
                        </Btn>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {!loading && tab === "assets" && (!canManageEvent ? <PermissionState /> : (
          <CmsAssetsPanel adminId={auth.userId} canManageEvent={canManageEvent} />
        ))}

        {!loading && tab === "orders" && (
          <div data-admin-table-scroll className="overflow-x-auto">
            <div className="flex gap-2 mb-4">
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" variant="ghost" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
            {orders.length === 0 ? <EmptyState title="Nenhum pedido encontrado" /> : (
              <table className="w-full">
                <thead><tr className="border-b border-[#2d6a4f]/20">{["Codigo","Nome","Ingresso","Valor","Status"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody>{orders.map(o => (
                  <tr key={o.id} className="border-b border-[#2d6a4f]/10 hover:bg-[#141f14] transition-colors">
                    <td className="py-4 px-4 text-[#c9a84c] font-['JetBrains_Mono'] text-xs">{o.id}</td>
                    <td className="py-4 px-4 text-[#f0ebe0] text-sm">{o.buyer_name}</td>
                    <td className="py-4 px-4 text-[#7a9a7a] text-sm">{o.ticket_type_id}</td>
                    <td className="py-4 px-4 text-[#f0ebe0] font-mono text-sm">R$ {(o.total_amount_cents / 100).toFixed(2)}</td>
                    <td className="py-4 px-4"><StatusBadge status={o.payment_status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}

        {!loading && tab === "lots" && (!canManageEvent ? <PermissionState /> : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Gestao de lotes e ingressos</p>
              <Btn size="sm" onClick={createLot} disabled={busy === "lot-create"}><Package size={14} />Criar novo lote</Btn>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-[#141f14] border border-[#2d6a4f]/25 p-4">
              <Field label="Nome" value={lotDraft.name} onChange={v => setLotDraft(s => ({ ...s, name: v }))} />
              <Field label="Preco (R$)" value={lotDraft.price} onChange={v => setLotDraft(s => ({ ...s, price: v }))} />
              <Field label="Quantidade" value={lotDraft.quantity} onChange={v => setLotDraft(s => ({ ...s, quantity: v }))} />
            </div>
            <div data-admin-table-scroll className="overflow-x-auto">
              {lots.length === 0 ? <EmptyState title="Nenhum lote cadastrado" /> : (
                <table className="w-full">
                  <thead><tr className="border-b border-[#2d6a4f]/20">{["Lote","Tipo","Preco","Total","Vendidos","Disponiveis","Status","Acoes"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{lots.map(l => (
                    <tr key={l.id} className="border-b border-[#2d6a4f]/10 hover:bg-[#141f14] transition-colors">
                      <td className="py-4 px-4 text-[#c9a84c] font-mono text-xs">{l.name}</td>
                      <td className="py-4 px-4 text-[#f0ebe0] text-sm">{l.allows_guest ? "Com acompanhante" : "Individual"}</td>
                      <td className="py-4 px-4 text-[#f0ebe0] font-['JetBrains_Mono'] text-sm">R$ {(l.price_cents / 100).toFixed(2)}</td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-sm">{l.available_quantity}</td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-sm">{l.sold_quantity}</td>
                      <td className="py-4 px-4 text-[#74c69d] font-mono text-sm">{l.available_quantity - l.sold_quantity}</td>
                      <td className="py-4 px-4"><StatusBadge status={l.status} /></td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {l.status !== "sold_out" && (
                            <button onClick={() => runAction("lot-status", () => updateTicketTypeStatus(l.id, l.status === "open" ? "closed" : "open", auth.userId))}
                              className="flex items-center gap-1 text-xs font-mono uppercase tracking-wider border px-3 py-1.5 border-[#2d6a4f]/40 text-[#74c69d] hover:bg-[#2d6a4f]/10">
                              {l.status === "open" ? <><ToggleRight size={12} />Fechar</> : <><ToggleLeft size={12} />Abrir</>}
                            </button>
                          )}
                          <button onClick={() => runAction("lot-edit", () => updateTicketTypeFull(l.id, { allows_guest: !l.allows_guest }, auth.userId))} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors p-1"><Pencil size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
            </div>
          </div>
        ))}

        {!loading && tab === "reports" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reports).map(([key, value]) => (
                <div key={key} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5">
                  <p className="text-[#f0ebe0] font-mono text-2xl">{key.includes("cents") ? "R$ " + (Number(value)/100).toFixed(2) : value}</p>
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{key.replaceAll("_", " ")}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {canExport && <Btn size="sm" onClick={exportPeopleCSV}><Download size={14} />CSV ex-alunos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
          </div>
        )}

        {!loading && tab === "participants" && (!canManageEvent ? <PermissionState /> : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Pessoas pré-cadastradas</p>
                <p className="text-[#3a5a3a] text-xs mt-1">Cadastre ex-alunos que ainda não estão confirmados no evento. Eles aparecerão no fluxo de criação de perfil para validação.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {canExport && <Btn size="sm" variant="ghost" onClick={exportPeopleCSV}><Download size={14} />CSV ex-alunos</Btn>}
                <Btn size="sm" onClick={() => setPeopleImportOpen(true)}><UserCheck size={14} />Cadastrar pessoas</Btn>
              </div>
            </div>
            {peopleRows.length === 0 ? <EmptyState title="Nenhum participante" /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {peopleRows.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} onOpen={() => setSelectedAdminPerson(a)} />)}
              </div>
            )}
          </div>
        ))}

        {!loading && tab === "photos" && (!canModerate ? <PermissionState /> : (
          <div>
            <div className="mb-6 flex flex-col gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">{pendingPhotos.length} fotos encontradas</p>
              <label className="flex items-center gap-3 text-sm text-[#f0ebe0]"><input type="checkbox" checked={moderationSettings.auto_approve_photos} onChange={event => void setAutomaticApproval("auto_approve_photos", event.target.checked)} className="accent-[#2d6a4f]" />Aprovar novas fotos automaticamente</label>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              {(["pending", "approved", "rejected", "all"] as const).map(value => <button key={value} type="button" onClick={() => setPhotoFilter(value)} className={"border px-4 py-2 text-xs font-mono uppercase tracking-wider transition-colors " + (photoFilter === value ? "border-[#2d6a4f] bg-[#2d6a4f] text-[#f0ebe0]" : "border-[#2d6a4f]/30 text-[#7a9a7a]")}>{adminStatusLabel(value)}</button>)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingPhotos.length === 0 && <EmptyState title="Nenhuma foto encontrada" />}
              {pendingPhotos.map(p => (
                <div key={p.id} className="bg-[#141f14] border border-[#2d6a4f]/25">
                  <div className="aspect-[4/3] overflow-hidden"><img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover opacity-80" /></div>
                  <div className="p-4">
                    <p className="text-[#f0ebe0] text-sm font-semibold mb-1">{p.caption}</p>
                    <p className="text-[#7a9a7a] text-xs mb-3">{p.year_approx} · {p.location_text}</p>
                    <div className="flex gap-2">
                      <Btn size="sm" full onClick={() => runAction("photo-approve", () => moderatePhoto(p.id, "approved", auth.userId))}><Check size={12} />Aprovar</Btn>
                      <Btn size="sm" full variant="danger" onClick={() => runAction("photo-reject", () => moderatePhoto(p.id, "rejected", auth.userId))}><X size={12} /></Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {!loading && tab === "tag-mod" && (!canModerate ? <PermissionState /> : (
          <div className="flex flex-col gap-4">
            <div className="flex gap-2 mb-2">
              {(["pending","approved","rejected"] as const).map(val => (
                <button key={val} onClick={() => setTagFilter(val)}
                  className={"px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors " + (tagFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60")}>
                  {adminStatusLabel(val)}
                </button>
              ))}
            </div>
            {tags.length === 0 ? <EmptyState title="Nenhuma marcacao encontrada" /> : (
              <div data-admin-table-scroll className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-[#2d6a4f]/20">{["Foto","Pessoa marcada","Adicionado por","Data","Status","Acoes"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                  <tbody>{tags.map(t => (
                    <tr key={t.id} className="border-b border-[#2d6a4f]/10 hover:bg-[#141f14] transition-colors">
                      <td className="py-4 px-4"><div className="flex items-center gap-3"><img src={t.photos?.image_url ?? ""} alt={t.photos?.caption ?? "Foto"} className="w-16 h-12 object-cover shrink-0" /><span className="text-[#7a9a7a] text-xs hidden md:block">{t.photos?.caption}</span></div></td>
                      <td className="py-4 px-4 text-[#f0ebe0] text-sm font-semibold">{t.tagged_name_snapshot}</td>
                      <td className="py-4 px-4 text-[#7a9a7a] text-sm">{t.created_by_user_id ?? "-"}</td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-xs">{t.created_at?.slice(0,10)}</td>
                      <td className="py-4 px-4"><StatusBadge status={t.status} /></td>
                      <td className="py-4 px-4"><div className="flex items-center gap-2">{t.status !== "approved" && <Btn size="sm" onClick={() => runAction("tag-approve", () => moderateTag(t.id,"approved", auth.userId))}><UserCheck size={12} />Aprovar</Btn>}{t.status !== "rejected" && <Btn size="sm" variant="danger" onClick={() => runAction("tag-reject", () => moderateTag(t.id,"rejected", auth.userId))}><UserX size={12} />Remover</Btn>}</div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {!loading && tab === "photo-comments" && (!canModerate ? <PermissionState /> : (
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-4 text-sm text-[#f0ebe0]"><input type="checkbox" checked={moderationSettings.auto_approve_comments} onChange={event => void setAutomaticApproval("auto_approve_comments", event.target.checked)} className="accent-[#2d6a4f]" />Aprovar novos comentários automaticamente</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(["pending","approved","rejected","hidden","all"] as const).map(val => (
                <button key={val} onClick={() => setCommentFilter(val)}
                  className={"px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors " + (commentFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60")}>
                  {adminStatusLabel(val)}
                </button>
              ))}
            </div>
            {comments.length === 0 ? <EmptyState title="Nenhum comentário encontrado" /> : comments.map(comment => (
              <div key={comment.id} className="bg-[#141f14] border border-[#2d6a4f]/25 p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-[#f0ebe0] text-sm leading-relaxed">{comment.comment_text}</p>
                  <p className="text-[#7a9a7a] text-xs font-mono mt-2">{comment.author_name ?? comment.user_id ?? "Ex-aluno"} · {comment.photos?.caption ?? "Foto"} · {comment.created_at?.slice(0,10)}</p>
                </div>
                <StatusBadge status={comment.status} />
                <div className="flex flex-wrap gap-2">
                  {comment.status !== "approved" && <Btn size="sm" onClick={() => runAction("comment-approve", () => moderatePhotoComment(comment.id, "approved", auth.userId))}><Check size={12} />Aprovar</Btn>}
                  {comment.status !== "rejected" && <Btn size="sm" variant="danger" onClick={() => runAction("comment-reject", () => moderatePhotoComment(comment.id, "rejected", auth.userId))}><X size={12} />Rejeitar</Btn>}
                  {comment.status !== "hidden" && <Btn size="sm" variant="ghost" onClick={() => runAction("comment-hide", () => moderatePhotoComment(comment.id, "hidden", auth.userId))}>Ocultar</Btn>}
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && tab === "memories" && (!canModerate ? <PermissionState /> : (
          <div className="flex flex-col gap-4">
            <label className="flex items-center gap-3 border border-[#2d6a4f]/25 bg-[#141f14] p-4 text-sm text-[#f0ebe0]"><input type="checkbox" checked={moderationSettings.auto_approve_memories} onChange={event => void setAutomaticApproval("auto_approve_memories", event.target.checked)} className="accent-[#2d6a4f]" />Aprovar novas memórias automaticamente</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {(["pending","approved","rejected","hidden","all"] as const).map(val => (
                <button key={val} onClick={() => setMemoryFilter(val)}
                  className={"px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors " + (memoryFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60")}>
                  {adminStatusLabel(val)}
                </button>
              ))}
            </div>
            {memories.length === 0 ? <EmptyState title="Nenhuma memória encontrada" /> : memories.map(memory => (
              <div key={memory.id} className="bg-[#141f14] border border-[#2d6a4f]/25 p-4 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-[#f0ebe0] text-sm leading-relaxed">{memory.memory_text}</p>
                  <p className="text-[#7a9a7a] text-xs font-mono mt-2">{memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno")} · {memory.created_at?.slice(0,10)}</p>
                </div>
                <div className="flex items-center gap-2"><StatusBadge status={memory.status} />{memory.is_featured && <StatusBadge status="featured" />}</div>
                <div className="flex flex-wrap gap-2">
                  {memory.status !== "approved" && <Btn size="sm" onClick={() => runAction("memory-approve", () => moderateMemory(memory.id, "approved", auth.userId))}><Check size={12} />Aprovar</Btn>}
                  {memory.status !== "rejected" && <Btn size="sm" variant="danger" onClick={() => runAction("memory-reject", () => moderateMemory(memory.id, "rejected", auth.userId))}><X size={12} />Rejeitar</Btn>}
                  {memory.status !== "hidden" && <Btn size="sm" variant="ghost" onClick={() => runAction("memory-hide", () => moderateMemory(memory.id, "hidden", auth.userId))}>Ocultar</Btn>}
                  {memory.status === "approved" && <Btn size="sm" variant="outline" onClick={() => runAction("memory-feature", () => toggleFeaturedMemory(memory.id, !memory.is_featured, auth.userId))}><Star size={12} />{memory.is_featured ? "Remover destaque" : "Destacar"}</Btn>}
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && tab === "polls" && (!canManageEvent ? <PermissionState /> : (
          <div className="flex flex-col gap-6">
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Pergunta" value={pollDraft.question} onChange={v => setPollDraft(s => ({ ...s, question: v }))} />
              <Field label="Descrição" value={pollDraft.description} onChange={v => setPollDraft(s => ({ ...s, description: v }))} />
              <FieldArea label="Opções, uma por linha" value={pollDraft.optionsText} onChange={v => setPollDraft(s => ({ ...s, optionsText: v }))} rows={5} />
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Status inicial</label>
                  <select value={pollDraft.status} onChange={e => setPollDraft(s => ({ ...s, status: e.target.value as PollStatus }))}
                    className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                    {(["draft","open","closed","archived"] as PollStatus[]).map(status => <option key={status} value={status}>{adminStatusLabel(status)}</option>)}
                  </select>
                </div>
                <label className="flex items-center gap-3 text-[#f0ebe0] text-sm">
                  <input type="checkbox" checked={pollDraft.allowMultiple} onChange={e => setPollDraft(s => ({ ...s, allowMultiple: e.target.checked }))} className="accent-[#2d6a4f]" />
                  Permitir múltiplos votos
                </label>
                <Btn onClick={createAdminPoll} disabled={busy === "poll-create"}><BarChart3 size={14} />Criar enquete</Btn>
              </div>
            </div>

            {polls.length === 0 ? <EmptyState title="Nenhuma enquete cadastrada" /> : polls.map(poll => (
              <div key={poll.id} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1">
                  <p className="text-[#f0ebe0] font-semibold">{poll.question}</p>
                  {poll.description && <p className="text-[#7a9a7a] text-sm mt-1">{poll.description}</p>}
                  <p className="text-[#7a9a7a] font-mono text-xs mt-2">{poll.poll_options?.length ?? 0} opções · {poll.allow_multiple_votes ? "múltiplos votos" : "voto único"}</p>
                </div>
                <StatusBadge status={poll.status} />
                <div className="flex flex-wrap gap-2">
                  {poll.status !== "open" && <Btn size="sm" onClick={() => runAction("poll-open", () => updatePoll(poll.id, { status: "open" }, auth.userId))}>Abrir</Btn>}
                  {poll.status !== "closed" && <Btn size="sm" variant="outline" onClick={() => runAction("poll-close", () => closePoll(poll.id, auth.userId))}>Encerrar</Btn>}
                  {poll.status !== "archived" && <Btn size="sm" variant="ghost" onClick={() => runAction("poll-archive", () => archivePoll(poll.id, auth.userId))}>Arquivar</Btn>}
                </div>
              </div>
            ))}
          </div>
        ))}

        {!loading && tab === "claims" && (!canModerate ? <PermissionState /> : (
          <div className="flex flex-col gap-4">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-2">Solicitacoes de reivindicacao pendentes</p>
            {claims.length === 0 && <EmptyState title="Nenhuma reivindicacao pendente" />}
            {claims.map(c => (
              <div key={c.id} className="bg-[#141f14] border border-[#2d6a4f]/25 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-10 h-10 bg-[#1a2e1a] border border-[#2d6a4f]/30 flex items-center justify-center text-[#7a9a7a] font-bold font-mono text-sm shrink-0">{initials(c.requester_name)}</div>
                <div className="flex-1"><p className="text-[#f0ebe0] font-semibold text-sm">{c.requester_name}</p><p className="text-[#7a9a7a] text-xs font-mono">{c.people?.full_name} · score {c.verification_score ?? 0}</p></div>
                <StatusBadge status={c.status} />
                <div className="flex gap-2"><Btn size="sm" onClick={() => runAction("claim-approve", () => moderateClaim(c.id, "approved", auth.userId))}><Check size={12} />Aprovar</Btn><Btn size="sm" variant="danger" onClick={() => runAction("claim-reject", () => moderateClaim(c.id, "rejected", auth.userId, "Rejeitado pelo admin"))}><X size={12} /></Btn></div>
              </div>
            ))}
          </div>
        ))}

        {!loading && tab === "removals" && (!canModerate ? <PermissionState /> : (
          <AdminReviewList title="Solicitacoes de remocao" items={removals} getTitle={r => r.requester_name} getSubtitle={r => (r.photos?.caption ?? "Foto") + " · " + r.reason} getStatus={r => r.status} onApprove={r => runAction("removal-approve", () => reviewPhotoRemovalRequest(r.id, "approved", auth.userId))} onReject={r => runAction("removal-reject", () => reviewPhotoRemovalRequest(r.id, "rejected", auth.userId))} />
        ))}

        {!loading && tab === "disputes" && (!canModerate ? <PermissionState /> : (
          <AdminReviewList title="Disputas de perfil" items={disputes} getTitle={d => d.requester_name} getSubtitle={d => (d.people?.full_name ?? d.person_id) + " · " + d.reason} getStatus={d => d.status} onApprove={d => runAction("dispute-approve", () => reviewProfileClaimDispute(d.id, "approved", auth.userId))} onReject={d => runAction("dispute-reject", () => reviewProfileClaimDispute(d.id, "rejected", auth.userId))} />
        ))}

        {!loading && tab === "admins" && (!canManageAdmins ? <PermissionState /> : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 bg-[#141f14] border border-[#2d6a4f]/25 p-4">
              <Field label="User ID" value={newAdmin.userId} onChange={v => setNewAdmin(s => ({ ...s, userId: v }))} />
              <Field label="Nome" value={newAdmin.displayName} onChange={v => setNewAdmin(s => ({ ...s, displayName: v }))} />
              <Field label="E-mail" value={newAdmin.email} onChange={v => setNewAdmin(s => ({ ...s, email: v }))} />
              <div><label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Role</label><select value={newAdmin.role} onChange={e => setNewAdmin(s => ({ ...s, role: e.target.value as AdminRole }))} className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">{(["viewer","checkin_staff","moderator","admin","superadmin"] as AdminRole[]).map(r => <option key={r} value={r}>{r}</option>)}</select></div>
              <div className="flex items-end"><Btn full size="sm" onClick={() => runAction("admin-add", () => addAdminUser(newAdmin.userId, newAdmin.role, newAdmin.displayName, newAdmin.email, auth.userId))}>Adicionar</Btn></div>
            </div>
            <AdminTable admins={admins} currentUserId={auth.userId} onRole={(id, nextRole) => runAction("admin-role", () => updateAdminRole(id, nextRole, auth.userId))} onRemove={id => runAction("admin-remove", () => removeAdminUser(id, auth.userId))} />
          </div>
        ))}

        {!loading && tab === "audit" && (
          <div data-admin-table-scroll className="overflow-x-auto">
            {auditLogs.length === 0 ? <EmptyState title="Nenhum log encontrado" /> : (
              <table className="w-full">
                <thead><tr className="border-b border-[#2d6a4f]/20">{["Data","Acao","Entidade","Usuario"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody>{auditLogs.map(log => <tr key={log.id} className="border-b border-[#2d6a4f]/10"><td className="py-4 px-4 text-[#7a9a7a] font-mono text-xs">{log.created_at?.slice(0,16)?.replace("T"," ")}</td><td className="py-4 px-4 text-[#f0ebe0] text-sm">{log.action}</td><td className="py-4 px-4 text-[#7a9a7a] text-sm">{log.entity_type}</td><td className="py-4 px-4 text-[#7a9a7a] font-mono text-xs">{log.user_id ?? "-"}</td></tr>)}</tbody>
              </table>
            )}
          </div>
        )}

        {!loading && tab === "settings" && (!canManageEvent ? <PermissionState /> : (
          <div className="max-w-2xl flex flex-col gap-6">
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Dados do evento</p>
              <Field label="Nome do evento" value={settings.name} onChange={v => setSettings(s => ({ ...s, name: v }))} />
              <div className="grid grid-cols-2 gap-4"><Field label="Data" type="date" value={settings.date} onChange={v => setSettings(s => ({ ...s, date: v }))} /><Field label="Horario" type="time" value={settings.time} onChange={v => setSettings(s => ({ ...s, time: v }))} /></div>
              <Field label="Nome do espaco" value={settings.venue} onChange={v => setSettings(s => ({ ...s, venue: v }))} />
              <Field label="Endereco completo" value={settings.address} onChange={v => setSettings(s => ({ ...s, address: v }))} />
              <FieldArea label="Descricao do evento" value={settings.description} onChange={v => setSettings(s => ({ ...s, description: v }))} />
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Status das vendas</p>
              {(["open","paused","closed"] as const).map(val => <label key={val} className={"flex items-start gap-4 p-4 border cursor-pointer transition-colors " + (settings.salesStatus === val ? "border-[#2d6a4f] bg-[#1a2e1a]" : "border-[#2d6a4f]/20 hover:border-[#2d6a4f]/40")}><input type="radio" className="sr-only" checked={settings.salesStatus === val} onChange={() => setSettings(s => ({ ...s, salesStatus: val }))} /><StatusBadge status={val} /></label>)}
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Contato e politicas</p>
              <Field label="E-mail" value={settings.contactEmail} onChange={v => setSettings(s => ({ ...s, contactEmail: v }))} />
              <Field label="WhatsApp / Telefone" value={settings.contactPhone} onChange={v => setSettings(s => ({ ...s, contactPhone: v }))} />
              <FieldArea label="Regras gerais" value={settings.rules} onChange={v => setSettings(s => ({ ...s, rules: v }))} rows={2} />
              <FieldArea label="Politica de acompanhante" value={settings.companionPolicy} onChange={v => setSettings(s => ({ ...s, companionPolicy: v }))} rows={2} />
              <FieldArea label="Politica de reembolso" value={settings.refundPolicy} onChange={v => setSettings(s => ({ ...s, refundPolicy: v }))} rows={2} />
            </div>
            <Btn full size="lg" onClick={saveSettings} disabled={busy === "settings"}><Save size={16} />Salvar configuracoes</Btn>
          </div>
        ))}
      </div>
    </div>
  );
}
