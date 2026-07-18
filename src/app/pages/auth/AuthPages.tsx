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

export function AlumniAreaPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadArea() {
    setLoading(true);
    setError("");
    try {
      setTickets(await getMyTickets(auth.userId, auth.email));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar sua área.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadArea(); }, [auth.userId, auth.email]);

  const mainTicket = tickets[0] ?? null;
  const paymentStatus = ticketPaymentStatus(mainTicket);
  const hasApprovedTicket = paymentStatus === "approved";

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start justify-between mb-10">
          <div>
            <SectionLabel>Área do Ex-Aluno</SectionLabel>
            <DisplayTitle className="text-3xl md:text-4xl">Olá, {auth.name.split(" ")[0]}!</DisplayTitle>
            <p className="text-[#7a9a7a] font-mono text-sm mt-1">Turma 2006 · dados protegidos por login</p>
          </div>
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors" title="Voltar ao início">
            <LogOut size={20} />
          </button>
        </div>

        {loading && <LoadingState message="Carregando seus dados..." />}
        {error && <ErrorState message={error} onRetry={loadArea} />}

        {!loading && !error && (
          <>
            <div className="bg-[#141f14] border border-[#2d6a4f]/40 p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-[#f0ebe0] p-6 mx-auto md:mx-0 w-32 h-32 flex items-center justify-center shrink-0">
                  <QrCode size={72} className="text-[#0d1a0f]" />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">Meu ingresso</p>
                  {mainTicket ? (
                    <>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-1">{ticketTypeName(mainTicket)}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mb-3">{mainTicket.qr_code} · {mainTicket.attendee_name}</p>
                      <div className="flex flex-wrap justify-center md:justify-start gap-2"><StatusBadge status={paymentStatus} />{mainTicket.checked_in && <StatusBadge status="checked_in" />}</div>
                    </>
                  ) : (
                    <>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-1">Nenhum ingresso localizado</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mb-3">Use o mesmo e-mail da compra para vincular seu ingresso.</p>
                      <StatusBadge status="pending" />
                    </>
                  )}
                </div>
                {mainTicket ? <Btn onClick={() => navigate("my-ticket")} size="sm"><QrCode size={14} />Ver ingresso</Btn> : <Btn onClick={() => navigate("tickets")} size="sm"><CreditCard size={14} />Comprar</Btn>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-4">Meu perfil</p>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono text-lg">
                    {initials(auth.name)}
                  </div>
                  <div>
                    <p className="text-[#f0ebe0] font-semibold">{auth.name}</p>
                    <p className="text-[#7a9a7a] text-xs font-mono">{auth.email ?? "E-mail não informado"}</p>
                  </div>
                </div>
                <Btn full size="sm" variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={14} />Editar perfil</Btn>
                <div className="mt-3"><Btn full size="sm" variant="ghost" onClick={() => navigate("share-invite")}><Send size={14} />Convite compartilhável</Btn></div>
              </div>
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-4">Status do pagamento</p>
                {mainTicket ? (
                  <div className="flex items-center gap-3 mb-4">
                    {hasApprovedTicket ? <CheckCircle size={24} className="text-[#2d6a4f]" /> : <Clock size={24} className="text-[#c9a84c]" />}
                    <div>
                      <p className="text-[#f0ebe0] font-semibold">{hasApprovedTicket ? "Pagamento aprovado" : "Pagamento ainda não aprovado"}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono">{mainTicket.orders?.payment_method ?? "Método não informado"} · {formatDateTimeBR(mainTicket.orders?.paid_at) || "Sem confirmação de pagamento"}</p>
                    </div>
                  </div>
                ) : (
                  <EmptyState title="Sem pedido vinculado" subtitle="Compre um ingresso ou confira se você está usando o mesmo e-mail informado na compra." />
                )}
                {mainTicket && <StatusBadge status={paymentStatus} />}
              </div>
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Fotos em que apareci</p>
                <button onClick={() => navigate("photo-wall")} className="text-[#2d6a4f] text-xs font-mono uppercase hover:text-[#40916c]">Ver Nossa História</button>
              </div>
              <EmptyState title="Marcações ainda não vinculadas" subtitle="Quando houver marcações aprovadas em fotos usando seu perfil, elas aparecerão aqui." />
              <div className="mt-4">
                <Btn full size="sm" variant="ghost" onClick={() => navigate("photo-wall")}><Upload size={14} />Enviar foto antiga</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── EDIT PROFILE ─────────────────────────────────────────────────────────────

export function AlumniDashboardPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  type AreaProfile = DbProfile & { people?: Partial<DbPerson> | null };
  const [profile, setProfile] = useState<AreaProfile | null>(null);
  const [tickets, setTickets] = useState<TicketWithDetails[]>([]);
  const [uploadedPhotos, setUploadedPhotos] = useState<DbPhoto[]>([]);
  const [taggedPhotos, setTaggedPhotos] = useState<DbPhoto[]>([]);
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [polls, setPolls] = useState<(DbPoll & { poll_options?: DbPollOption[] })[]>([]);
  const [votes, setVotes] = useState<DbPollVote[]>([]);
  const [classmates, setClassmates] = useState<DbPerson[]>([]);
  const [sectionErrors, setSectionErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadArea() {
    setLoading(true);
    setError("");
    const profileResult = await getMyProfile(auth.userId).then(
      value => ({ status: "fulfilled" as const, value }),
      reason => ({ status: "rejected" as const, reason })
    );
    const nextProfile = profileResult.status === "fulfilled" ? profileResult.value : null;
    setProfile(nextProfile);

    const personId = nextProfile?.person_id ?? "";
    const classGroup = nextProfile?.people?.class_group ?? "";
    const [ticketsRes, uploadedRes, taggedRes, memoriesRes, pollsRes, votesRes, classmatesRes] = await Promise.allSettled([
      getMyTickets(auth.userId, auth.email),
      getMyUploadedPhotos(auth.userId),
      personId ? getMyTaggedPhotos(personId) : Promise.resolve([]),
      getMyMemories(auth.userId),
      getPolls(DEFAULT_EVENT_ID),
      getMyPollVotes(auth.userId),
      classGroup ? getClassmates(classGroup, personId) : Promise.resolve([]),
    ]);

    const errors: Record<string, string> = {};
    function listOrEmpty<T>(result: PromiseSettledResult<T[]>, key: string): T[] {
      if (result.status === "fulfilled") return result.value;
      errors[key] = result.reason instanceof Error ? result.reason.message : "Não foi possível carregar esta seção.";
      return [];
    }

    if (profileResult.status === "rejected") {
      errors.profile = profileResult.reason instanceof Error ? profileResult.reason.message : "Não foi possível carregar o perfil.";
    }
    setTickets(listOrEmpty(ticketsRes, "tickets"));
    setUploadedPhotos(listOrEmpty(uploadedRes, "photos"));
    setTaggedPhotos(listOrEmpty(taggedRes, "tags"));
    setMemories(listOrEmpty(memoriesRes, "memories"));
    setPolls(listOrEmpty(pollsRes, "polls"));
    setVotes(listOrEmpty(votesRes, "votes"));
    setClassmates(listOrEmpty(classmatesRes, "classmates"));
    setSectionErrors(errors);
    setLoading(false);
  }

  useEffect(() => { loadArea(); }, [auth.userId, auth.email]);

  const mainTicket = tickets[0] ?? null;
  const paymentStatus = ticketPaymentStatus(mainTicket);
  const displayName = profile?.display_name || profile?.people?.full_name || auth.name || auth.email?.split("@")[0] || "Ex-aluno";
  const firstNameRaw = displayName.split(/\s+/).find(Boolean) ?? displayName;
  const firstName = firstNameRaw.toLocaleLowerCase("pt-BR").replace(/^./, c => c.toLocaleUpperCase("pt-BR"));
  const classLabel = profile?.people?.class_group ? `Turma ${profile.people.class_group}` : "Turma 2006";
  const avatarUrl = profile?.current_photo_url || profile?.people?.avatar_url || "";
  const location = [profile?.current_city, profile?.current_state].filter(Boolean).join(", ");
  const allPhotos = [...uploadedPhotos, ...taggedPhotos].filter((photo, index, arr) => arr.findIndex(item => item.id === photo.id) === index).slice(0, 4);
  const openPolls = polls.filter(poll => poll.status === "open").slice(0, 3);
  const votedPollIds = new Set(votes.map(vote => vote.poll_id));

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-start justify-between mb-10">
          <div>
            <SectionLabel>Área do Ex-Aluno</SectionLabel>
            <DisplayTitle className="text-3xl md:text-4xl">Olá, {firstName}!</DisplayTitle>
            <p className="text-[#7a9a7a] font-mono text-sm mt-1">{classLabel}</p>
          </div>
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors" title="Voltar ao início">
            <LogOut size={20} />
          </button>
        </div>

        {loading && <LoadingState message="Carregando seus dados..." />}
        {error && <ErrorState message={error} onRetry={loadArea} />}
        {!loading && !error && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-5">Meu perfil</p>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono text-xl overflow-hidden shrink-0">
                  {avatarUrl ? <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : initials(displayName)}
                </div>
                <div className="min-w-0">
                  <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl truncate">{displayName}</p>
                  <p className="text-[#c9a84c] text-xs font-mono mt-1">{classLabel}</p>
                  {location && <p className="text-[#7a9a7a] text-xs mt-2">{location}</p>}
                  {profile?.profession && <p className="text-[#8ab89a] text-sm mt-1">{profile.profession}</p>}
                </div>
              </div>
              <Btn full size="sm" variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={14} />Editar perfil</Btn>
              {sectionErrors.profile && <p className="text-[#c9a84c] text-xs font-mono mt-3">{sectionErrors.profile}</p>}
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 lg:col-span-2">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="bg-[#f0ebe0] p-6 w-28 h-28 flex items-center justify-center shrink-0">
                  <QrCode size={60} className="text-[#0d1a0f]" />
                </div>
                <div className="flex-1">
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">Meu ingresso</p>
                  {mainTicket ? (
                    <>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-1">{ticketTypeName(mainTicket)}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mb-3">{mainTicket.qr_code} · {mainTicket.attendee_name}</p>
                      <div className="flex flex-wrap gap-2"><StatusBadge status={paymentStatus} />{mainTicket.checked_in && <StatusBadge status="checked_in" />}</div>
                    </>
                  ) : (
                    <>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-1">Nenhum ingresso localizado</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mb-3">{sectionErrors.tickets ? "Não foi possível conferir ingressos agora." : "Use o mesmo e-mail da compra para vincular seu ingresso."}</p>
                    </>
                  )}
                </div>
                {mainTicket ? <Btn onClick={() => navigate("my-ticket")} size="sm"><QrCode size={14} />Ver ingresso</Btn> : <Btn onClick={() => navigate("tickets")} size="sm"><CreditCard size={14} />Comprar ingresso</Btn>}
              </div>
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Minhas fotos</p>
                <button onClick={() => navigate("photo-wall")} className="text-[#2d6a4f] text-xs font-mono uppercase hover:text-[#40916c]">Nossa História</button>
              </div>
              {allPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {allPhotos.map(photo => (
                    <img key={photo.id} src={photo.thumbnail_url ?? photo.image_url} alt={photo.caption ?? "Foto"} className="aspect-square w-full object-cover bg-[#1a2e1a]" />
                  ))}
                </div>
              ) : (
                <EmptyState title="Sem fotos ainda" subtitle="Suas fotos e marcações aparecerão aqui." action={<Btn size="sm" variant="ghost" onClick={() => navigate("photo-wall")}><Upload size={14} />Ir para Nossa História</Btn>} />
              )}
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-5">Minhas memórias</p>
              {memories.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {memories.slice(0, 3).map(memory => (
                    <div key={memory.id} className="border border-[#2d6a4f]/20 bg-[#0a120a] p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <StatusBadge status={memory.status} />
                        <span className="text-[#7a9a7a] text-[10px] font-mono">{memory.created_at?.slice(0, 10)}</span>
                      </div>
                      <p className="text-[#f0ebe0] text-sm line-clamp-3">{memory.memory_text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhuma memória enviada" subtitle="Compartilhe uma lembrança da turma." action={<Btn size="sm" variant="ghost" onClick={() => navigate("memories")}><Send size={14} />Enviar memória</Btn>} />
              )}
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-5">Enquetes</p>
              {openPolls.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {openPolls.map(poll => (
                    <button key={poll.id} onClick={() => navigate("curiosities")} className="text-left border border-[#2d6a4f]/20 bg-[#0a120a] p-4 hover:border-[#2d6a4f]/60 transition-colors">
                      <p className="text-[#f0ebe0] text-sm font-semibold">{poll.question}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mt-1">{votedPollIds.has(poll.id) ? "Você já votou" : "Aberta para voto"}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <EmptyState title="Nenhuma enquete aberta" subtitle="As próximas enquetes aparecerão aqui." />
              )}
            </div>

            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 lg:col-span-3">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Ex-colegas da turma</p>
                <button onClick={() => navigate("the-class")} className="text-[#2d6a4f] text-xs font-mono uppercase hover:text-[#40916c]">Ver todos</button>
              </div>
              {classmates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {classmates.slice(0, 4).map(person => (
                    <div key={person.id} className="flex items-center gap-3 border border-[#2d6a4f]/20 bg-[#0a120a] p-3">
                      <div className="w-11 h-11 bg-[#2d6a4f] flex items-center justify-center overflow-hidden text-[#f0ebe0] text-xs font-mono font-bold shrink-0">
                        {person.avatar_url ? <img src={person.avatar_url} alt={person.full_name} className="w-full h-full object-cover" /> : initials(person.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#f0ebe0] text-sm font-semibold truncate">{person.full_name}</p>
                        <p className="text-[#7a9a7a] text-xs font-mono">{person.profile_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Colegas não encontrados" subtitle="Quando houver colegas visíveis da sua turma, eles aparecerão aqui." />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function EditProfilePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [profile, setProfile] = useState<(DbProfile & { people?: Partial<DbPerson> }) | null>(null);
  const [form, setForm] = useState({
    displayName: "", nickname: "", photoUrl: "", city: "", state: "", country: "Brasil",
    profession: "", bio: "", memoryText: "", instagram: "", linkedin: "",
    contactEmail: "", contactWhatsapp: "",
    relationshipStatus: "" as RelationshipStatus | "",
    hasChildren: "" as "" | "yes" | "no",
    childrenCount: "",
    intendsToAttend: "" as "" | "yes" | "no",
  });
  const [privacy, setPrivacy] = useState({ showCurrentPhoto: true, showCity: true, showProfession: true, showSocial: false, showInList: true, allowTagging: true });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const draftKey = `edit-profile-draft-${auth.userId}`;

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
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits ? formatWhatsapp(digits) : null;
  }

  function socialDisplayValue(value: string | null | undefined, prefix: string) {
    return value?.trim() || prefix;
  }

  function normalizeSocialUrl(value: string, prefix: string) {
    const trimmed = value.trim();
    if (!trimmed || trimmed === prefix || trimmed.replace(/\/+$/, "") === prefix.replace(/\/+$/, "")) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const handle = trimmed.replace(/^@+/, "");
    return handle ? `${prefix}${handle}` : null;
  }

  function validateForm() {
    const uf = form.state.trim();
    if (uf && !/^[A-Z]{2}$/.test(uf)) {
      return "UF inválida. Informe exatamente duas letras, como RN, SP ou RS.";
    }
    const email = form.contactEmail.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return "E-mail inválido. Informe um e-mail de contato válido.";
    }
    const whatsappDigits = form.contactWhatsapp.replace(/\D/g, "");
    if (whatsappDigits && whatsappDigits.length !== 11) {
      return "WhatsApp inválido. Use o formato (XX) XXXXX-XXXX.";
    }
    if (!form.relationshipStatus) {
      return "Selecione seu estado civil.";
    }
    if (!form.hasChildren) {
      return "Informe se você tem filhos.";
    }
    const childrenCount = Number(form.childrenCount);
    if (form.hasChildren === "yes" && form.childrenCount.trim() && (!Number.isInteger(childrenCount) || childrenCount < 0)) {
      return "Quantidade de filhos inválida.";
    }
    return "";
  }

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyProfile(auth.userId);
      setProfile(data);
      if (data) {
        const nextForm = {
          displayName: data.display_name ?? auth.name,
          nickname: data.people?.nickname_at_school ?? "",
          photoUrl: data.current_photo_url ?? "",
          city: data.current_city ?? "",
          state: normalizeUf(data.current_state ?? ""),
          country: data.current_country ?? "Brasil",
          profession: data.profession ?? "",
          bio: data.bio ?? "",
          memoryText: data.memory_text ?? "",
          instagram: socialDisplayValue(data.instagram_url, "https://instagram.com/"),
          linkedin: socialDisplayValue(data.linkedin_url, "https://linkedin.com/in/"),
          contactEmail: data.contact_email ?? auth.email ?? "",
          contactWhatsapp: formatWhatsapp(data.contact_whatsapp ?? ""),
          relationshipStatus: data.relationship_status ?? "",
          hasChildren: data.has_children ? "yes" : "no",
          childrenCount: data.children_count ? String(data.children_count) : "",
          intendsToAttend: data.intends_to_attend === true ? "yes" : data.intends_to_attend === false ? "no" : "",
        };
        const nextPrivacy = {
          showCurrentPhoto: data.show_current_photo,
          showCity: data.show_city,
          showProfession: data.show_profession,
          showSocial: data.show_social_links,
          showInList: data.show_confirmed_status,
          allowTagging: data.allow_photo_tags,
        };
        const draft = window.sessionStorage.getItem(draftKey);
        if (draft) {
          try {
            const parsed = JSON.parse(draft) as { form?: typeof nextForm; privacy?: typeof nextPrivacy };
            setForm({ ...nextForm, ...(parsed.form ?? {}) });
            setPrivacy({ ...nextPrivacy, ...(parsed.privacy ?? {}) });
          } catch {
            window.sessionStorage.removeItem(draftKey);
            setForm(nextForm);
            setPrivacy(nextPrivacy);
          }
        } else {
          setForm(nextForm);
          setPrivacy(nextPrivacy);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [auth.userId]);

  useEffect(() => {
    if (loading || !profile) return;
    window.sessionStorage.setItem(draftKey, JSON.stringify({ form, privacy }));
  }, [draftKey, form, privacy, loading, profile]);

  async function save() {
    if (!profile) {
      setError("Perfil não reivindicado. Reivindique seu perfil antes de editar os dados públicos.");
      return;
    }
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const updated = await saveMyPublicProfile(auth.userId, {
        display_name: form.displayName.trim() || null,
        current_photo_url: form.photoUrl.trim() || null,
        current_city: form.city.trim() || null,
        current_state: form.state.trim() || null,
        current_country: form.country.trim() || null,
        profession: form.profession.trim() || null,
        bio: form.bio.trim() || null,
        memory_text: form.memoryText.trim() || null,
        instagram_url: normalizeSocialUrl(form.instagram, "https://instagram.com/"),
        linkedin_url: normalizeSocialUrl(form.linkedin, "https://linkedin.com/in/"),
        contact_email: form.contactEmail.trim() || null,
        contact_whatsapp: normalizeWhatsapp(form.contactWhatsapp),
        relationship_status: form.relationshipStatus || null,
        has_children: form.hasChildren === "yes",
        children_count: form.hasChildren === "yes" && form.childrenCount.trim() ? Number(form.childrenCount) : null,
        intends_to_attend: form.intendsToAttend ? form.intendsToAttend === "yes" : null,
        show_current_photo: privacy.showCurrentPhoto,
        show_city: privacy.showCity,
        show_profession: privacy.showProfession,
        show_social_links: privacy.showSocial,
        allow_photo_tags: privacy.allowTagging,
        show_confirmed_status: privacy.showInList,
      }, {
        nickname_at_school: form.nickname.trim() || null,
        avatar_url: form.photoUrl.trim() || null,
      });
      setProfile(updated);
      setSaved(true);
      window.sessionStorage.removeItem(draftKey);
      setTimeout(() => navigate("alumni-area"), 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no salvamento do perfil.");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAvatar(file: File | null) {
    if (!file || !profile) return;
    setAvatarUploading(true);
    setError("");
    try {
      const publicUrl = await uploadProfileAvatar(auth.userId, file);
      setForm(f => ({ ...f, photoUrl: publicUrl }));
      const updated = await saveMyPublicProfile(auth.userId, { current_photo_url: publicUrl }, { avatar_url: publicUrl });
      setProfile(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload da foto.");
    } finally {
      setAvatarUploading(false);
    }
  }

  const avatarLabel = initials(form.displayName || auth.name);

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate("alumni-area")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Minha área
        </button>
        <SectionLabel>Perfil</SectionLabel>
        <DisplayTitle className="text-3xl md:text-4xl mb-10">Editar meu perfil</DisplayTitle>
        <SaveToast show={saved} />
        {loading && <LoadingState message="Carregando perfil..." />}
        {error && <ErrorState message={error} onRetry={loadProfile} />}
        {!loading && !profile && !error && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
            <EmptyState title="Perfil ainda não reivindicado" subtitle="Para editar dados públicos, primeiro vincule sua conta ao seu nome na lista da turma." action={<Btn onClick={() => navigate("claim-profile")}><UserCheck size={16} />Criar perfil</Btn>} />
          </div>
        )}
        {!loading && profile && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-6">Foto de perfil</p>
              <AvatarCropUpload
                currentImageUrl={form.photoUrl}
                fallbackLabel={avatarLabel}
                uploading={avatarUploading}
                onCroppedFile={uploadAvatar}
                onRemove={() => setForm(f => ({ ...f, photoUrl: "" }))}
                helperText="JPG, PNG ou WebP até 10 MB. Ajuste zoom e recorte antes de enviar. A exibição pública respeita a configuração de privacidade abaixo."
              />
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Informações pessoais</p>
              <Field label="Nome de exibição" value={form.displayName} onChange={v => setForm(f => ({ ...f, displayName: v }))} placeholder="Como você quer aparecer" />
              <Field label="Apelido da época" value={form.nickname} onChange={v => setForm(f => ({ ...f, nickname: v }))} placeholder="Como te chamavam no HC" />
              <div>
                <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Estado civil</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <OptionButton selected={form.relationshipStatus === "single"} onClick={() => setForm(f => ({ ...f, relationshipStatus: "single" }))}>Solteiro(a)</OptionButton>
                  <OptionButton selected={form.relationshipStatus === "dating"} onClick={() => setForm(f => ({ ...f, relationshipStatus: "dating" }))}>Namorando</OptionButton>
                  <OptionButton selected={form.relationshipStatus === "married"} onClick={() => setForm(f => ({ ...f, relationshipStatus: "married" }))}>Casado(a)</OptionButton>
                </div>
              </div>
              <div>
                <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Filhos</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <OptionButton selected={form.hasChildren === "yes"} onClick={() => setForm(f => ({ ...f, hasChildren: "yes" }))}>Tenho filhos</OptionButton>
                  <OptionButton selected={form.hasChildren === "no"} onClick={() => setForm(f => ({ ...f, hasChildren: "no", childrenCount: "" }))}>Não tenho filhos</OptionButton>
                </div>
              </div>
              {form.hasChildren === "yes" && (
                <Field label="Quantidade de filhos" type="number" value={form.childrenCount} onChange={v => setForm(f => ({ ...f, childrenCount: v.replace(/\D/g, "").slice(0, 2) }))} placeholder="Ex.: 2" />
              )}
              <div>
                <p className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Você pretende ir para a festa?</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <OptionButton selected={form.intendsToAttend === "yes"} onClick={() => setForm(f => ({ ...f, intendsToAttend: "yes" }))}>Sim, pretendo ir</OptionButton>
                  <OptionButton selected={form.intendsToAttend === "no"} onClick={() => setForm(f => ({ ...f, intendsToAttend: "no" }))}>Ainda não / não pretendo</OptionButton>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="E-mail" value={form.contactEmail} onChange={v => setForm(f => ({ ...f, contactEmail: v }))} placeholder="seu@email.com" icon={<Mail size={14} />} />
                <Field label="WhatsApp" value={form.contactWhatsapp} onChange={v => setForm(f => ({ ...f, contactWhatsapp: formatWhatsapp(v) }))} placeholder="(XX) XXXXX-XXXX" icon={<Phone size={14} />} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Cidade atual" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Onde você mora hoje" icon={<MapPin size={14} />} />
                <Field label="Estado" value={form.state} onChange={v => setForm(f => ({ ...f, state: normalizeUf(v) }))} placeholder="UF" />
              </div>
              <Field label="País" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="Brasil" />
              <Field label="Profissão" value={form.profession} onChange={v => setForm(f => ({ ...f, profession: v }))} placeholder="O que você faz hoje" />
              <FieldArea label="Mini bio" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="Conte um pouco sobre você hoje..." />
              <FieldArea label="Memória favorita do HC" value={form.memoryText} onChange={v => setForm(f => ({ ...f, memoryText: v }))} placeholder="Uma memória que você nunca vai esquecer..." rows={2} />
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Redes sociais</p>
              <Field label="Instagram" value={form.instagram} onChange={v => setForm(f => ({ ...f, instagram: v }))} placeholder="https://instagram.com/" icon={<Instagram size={14} />} />
              <Field label="LinkedIn" value={form.linkedin} onChange={v => setForm(f => ({ ...f, linkedin: v }))} placeholder="https://linkedin.com/in/" icon={<Linkedin size={14} />} />
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-6">Privacidade</p>
              <div className="flex flex-col gap-4">
                {([
                  ["showInList",     "Aparecer na lista de confirmados"],
                  ["showCurrentPhoto", "Exibir foto atual"],
                  ["showCity",       "Exibir cidade atual"],
                  ["showProfession", "Exibir profissão"],
                  ["showSocial",     "Exibir redes sociais"],
                  ["allowTagging",   "Permitir marcações em fotos"],
                ] as [keyof typeof privacy, string][]).map(([key, label]) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer">
                    <span className="text-[#f0ebe0] text-sm">{label}</span>
                    <button onClick={() => setPrivacy(p => ({ ...p, [key]: !p[key] }))}
                      className={`relative w-12 h-6 transition-colors ${privacy[key] ? "bg-[#2d6a4f]" : "bg-[#1a2e1a] border border-[#2d6a4f]/30"}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-[#f0ebe0] transition-all ${privacy[key] ? "left-7" : "left-1"}`} />
                    </button>
                  </label>
                ))}
              </div>
            </div>
            <Btn full size="lg" onClick={save} disabled={busy}>{busy ? <><RefreshCw size={16} className="animate-spin" />Salvando...</> : <><Save size={16} />Salvar alterações</>}</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
