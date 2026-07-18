import { useState, useEffect, Fragment, useMemo, useRef, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEV_MODE, supabase } from "../lib/supabase";
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
} from "../lib/services";
import type {
  DbPerson, DbTicketType, DbEvent, DbAdminUser, DbAuditLog, DbPhoto, DbPhotoTag, DbOrder,
  DbProfileClaim, DbPhotoRemovalRequest, DbProfileClaimDispute, AdminRole, TicketStatus,
  DbPhotoComment, DbMemory, PhotoStats, ModerationStatus,
  DbPoll, DbPollOption, DbPollVote, LocationStat, PublicLocationRow, PublicProfileCardRow, AlumniDirectoryStatusRow, CuriosityProfileStatsRow, SchoolQuestionnaireOptionStatRow, PollStatus, TicketWithDetails, DbProfile, PaymentStatus, ProfileStatus, Gender,
  DbEventArchiveSettings, RelationshipStatus, EventPageGalleryItem, EventPageInfoItem, EventPageScheduleItem,
} from "../lib/database.types";
import { CmsAssetsPanel } from "./CmsAdminPanels";
import { SecureCheckoutPage } from "./SecureCheckoutPage";
import { HomeFaqSectionLoader } from "./home/HomeFaqSectionLoader";
import { AdminFaqPanel, type FaqSectionSettings } from "./admin/faq/AdminFaqPanel";
import { AccountActions } from "./components/AccountActions";
import { formatLotLabel, selectPublicTicketCards } from "../lib/publicTicketCatalog";
import mundoVerdeUrl from "../imports/maps/mundo-verde.png";
import mundoInvertidoUrl from "../imports/maps/mundo-invertido.png";
import brasilVerdeUrl from "../imports/maps/brasil-verde.png";
import brasilInvertidoUrl from "../imports/maps/brasil-invertido.png";
import rnVerdeUrl from "../imports/maps/rn-verde.png";
import rnInvertidoUrl from "../imports/maps/rn-invertido.png";
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
  Info, Package, Pencil, Heart, MessageCircle, Star, Send, Venus, Baby, House
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

export type Page =
  | "home" | "event" | "tickets" | "checkout" | "confirmation"
  | "who-going" | "the-class" | "ex-alumni" | "claim-profile"
  | "photo-wall" | "photo-detail" | "alumni-area"
  | "edit-profile" | "admin" | "checkin"
  | "login" | "terms" | "privacy" | "memories"
  | "curiosities" | "polls" | "where-now" | "share-invite"
  | "my-ticket" | "archive";

export interface AuthState {
  loggedIn: boolean;
  isAdmin: boolean;
  name: string;
  userId: string;
  email?: string;
  role?: AdminRole | null;
}

export interface Alumni {
  id: string; name: string; nickname?: string; sala?: string;
  city?: string; profession?: string; avatarUrl?: string;
  status: "unclaimed" | "claimed" | "confirmed";
}

export interface TicketItem {
  id: string; type: string; lot: string; price: number;
  available: number; total: number; includes: string[];
  status: "available" | "last-units" | "sold-out";
}

export interface Photo {
  id: string; url: string; caption: string; year: string;
  location: string; people: string[];
}

export interface Lot {
  id: string; lot: string; type: string; price: number;
  total: number; sold: number;
  status: "open" | "closed" | "sold-out";
  startDate?: string; endDate?: string; allowCompanion: boolean;
}

export interface TagModItem {
  id: string; photoId: string; photoCaption: string; photoUrl: string;
  taggedPerson: string; addedBy: string; date: string;
  modStatus: "pending" | "approved" | "rejected";
}

// ─── DATA ──────────────────────────────────────────────────────────────────────

export const FALLBACK_EVENT_DATE_TIME = "2026-10-17T19:00:00-03:00";
export const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

export const ALUMNI: Alumni[] = [
  { id: "1",  name: "Ana Paula Oliveira",  nickname: "Aninha",    sala: "A", city: "Natal, RN",          profession: "Médica",           status: "confirmed" },
  { id: "2",  name: "Bruno Cavalcanti",    nickname: "Brunão",    sala: "B", city: "Recife, PE",          profession: "Advogado",         status: "confirmed" },
  { id: "3",  name: "Carla Medeiros",      nickname: "Carlinha",  sala: "A", city: "São Paulo, SP",       profession: "Arquiteta",        status: "confirmed" },
  { id: "4",  name: "Diego Ferreira",      nickname: "Diegão",    sala: "B", city: "Fortaleza, CE",       profession: "Engenheiro",       status: "claimed"   },
  { id: "5",  name: "Eduarda Lima",        nickname: "Du",        sala: "A", city: "Brasília, DF",        profession: "Jornalista",       status: "claimed"   },
  { id: "6",  name: "Felipe Araújo",       nickname: "Fepa",      sala: "C", city: "Natal, RN",           profession: "Professor",        status: "confirmed" },
  { id: "7",  name: "Gabriela Santos",     nickname: "Gabi",      sala: "B", city: "Rio de Janeiro, RJ",  profession: "Dentista",         status: "confirmed" },
  { id: "8",  name: "Henrique Costa",      nickname: "Kiko",      sala: "C", city: "Natal, RN",           profession: "Empreendedor",     status: "unclaimed" },
  { id: "9",  name: "Isabela Rodrigues",   nickname: "Bela",      sala: "A", city: "Recife, PE",          profession: "Psicóloga",        status: "confirmed" },
  { id: "10", name: "João Vitor Melo",     nickname: "JV",        sala: "B", city: "Natal, RN",           profession: "Médico",           status: "confirmed" },
  { id: "11", name: "Karoline Freitas",    nickname: "Karo",      sala: "C", city: "São Paulo, SP",       profession: "Designer",         status: "claimed"   },
  { id: "12", name: "Lucas Nogueira",      nickname: "Luquinhas", sala: "A", city: "Manaus, AM",          profession: "Geólogo",          status: "unclaimed" },
  { id: "13", name: "Marina Pinheiro",     nickname: "Mari",      sala: "B", city: "Natal, RN",           profession: "Nutricionista",    status: "confirmed" },
  { id: "14", name: "Nathan Alves",        nickname: "Nath",      sala: "C", city: "Campina Grande, PB",  profession: "Desenvolvedor",    status: "confirmed" },
  { id: "15", name: "Olivia Carvalho",     nickname: "Oli",       sala: "A", city: "Florianópolis, SC",   profession: "Fisioterapeuta",   status: "claimed"   },
  { id: "16", name: "Pedro Gomes",         nickname: "PH",        sala: "B", city: "Natal, RN",           profession: "Contador",         status: "unclaimed" },
  { id: "17", name: "Rafaela Souza",       nickname: "Rafa",      sala: "C", city: "João Pessoa, PB",     profession: "Professora",       status: "confirmed" },
  { id: "18", name: "Sandro Vieira",       nickname: "Sandão",    sala: "A", city: "Natal, RN",           profession: "Servidor Público", status: "unclaimed" },
];

export const TICKETS: TicketItem[] = [
  { id: "00000000-0000-0000-0001-000000000001", type: "Ingresso Individual",    lot: "1º Lote",        price: 120, available: 47, total: 100, includes: ["Jantar buffet completo", "Open bar 4 horas", "Área fotográfica", "Brinde comemorativo"],                                        status: "available"   },
  { id: "00000000-0000-0000-0001-000000000002", type: "Ingresso Casal",         lot: "1º Lote",        price: 200, available: 8,  total: 50,  includes: ["2 jantares buffet", "Open bar 4 horas", "Área fotográfica", "2 brindes comemorativos"],                                         status: "last-units"  },
  { id: "00000000-0000-0000-0001-000000000003", type: "Mesa VIP — 4 pessoas",   lot: "Edição Limitada", price: 600, available: 0,  total: 20,  includes: ["Mesa reservada premium", "Champagne na chegada", "Open bar premium", "Brinde colecionável exclusivo", "Acesso Ã  área VIP"],    status: "sold-out"    },
];

export const PHOTOS: Photo[] = [
  { id: "p1", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=450&fit=crop&auto=format", caption: "Formatura da Turma 2006",   year: "2006", location: "Pátio do HC",            people: ["Ana Paula Oliveira", "Bruno Cavalcanti"]  },
  { id: "p2", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=450&fit=crop&auto=format", caption: "Intervalo no corredor",      year: "2004", location: "HC — Corredor Principal", people: ["Felipe Araújo", "Gabriela Santos"]       },
  { id: "p3", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=450&fit=crop&auto=format", caption: "Aula de História — Sala A",  year: "2005", location: "HC — Sala A",             people: ["Ana Paula Oliveira", "Isabela Rodrigues"] },
  { id: "p4", url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=450&fit=crop&auto=format", caption: "Gincana escolar",            year: "2005", location: "Quadra do HC",            people: ["João Vitor Melo", "Karoline Freitas"]    },
  { id: "p5", url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=450&fit=crop&auto=format", caption: "Aulão pré-vestibular",       year: "2006", location: "HC — Auditório",          people: ["Nathan Alves", "Olivia Carvalho"]        },
  { id: "p6", url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=450&fit=crop&auto=format", caption: "Colação de grau",            year: "2006", location: "HC — Auditório Principal", people: ["Pedro Gomes", "Diego Ferreira"]          },
];

export const LOTS_INIT: Lot[] = [
  { id: "l1", lot: "1º Lote",        type: "Individual",    price: 120, total: 100, sold: 53, status: "open",     startDate: "2026-06-01", endDate: "2026-08-31", allowCompanion: false },
  { id: "l2", lot: "1º Lote",        type: "Casal",         price: 200, total: 50,  sold: 42, status: "open",     startDate: "2026-06-01", endDate: "2026-08-31", allowCompanion: true  },
  { id: "l3", lot: "Edição Limitada", type: "Mesa VIP (4p)", price: 600, total: 20,  sold: 20, status: "sold-out", startDate: "2026-06-01", endDate: "2026-07-15", allowCompanion: true  },
  { id: "l4", lot: "2º Lote",        type: "Individual",    price: 150, total: 100, sold: 0,  status: "closed",   startDate: "2026-09-01", endDate: "2026-10-10", allowCompanion: false },
  { id: "l5", lot: "2º Lote",        type: "Casal",         price: 250, total: 50,  sold: 0,  status: "closed",   startDate: "2026-09-01", endDate: "2026-10-10", allowCompanion: true  },
];

export const TAG_MODS_INIT: TagModItem[] = [
  { id: "tm1", photoId: "p1", photoCaption: "Formatura da Turma 2006",  photoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=80&h=60&fit=crop", taggedPerson: "Carla Medeiros",  addedBy: "Ana Paula Oliveira",  date: "04 Jul 2026", modStatus: "pending"  },
  { id: "tm2", photoId: "p3", photoCaption: "Aula de História — Sala A", photoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=80&h=60&fit=crop", taggedPerson: "Diego Ferreira",  addedBy: "Isabela Rodrigues",   date: "03 Jul 2026", modStatus: "pending"  },
  { id: "tm3", photoId: "p4", photoCaption: "Gincana escolar",           photoUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=80&h=60&fit=crop", taggedPerson: "Eduarda Lima",    addedBy: "Karoline Freitas",    date: "02 Jul 2026", modStatus: "approved" },
];

export const FAQ_ITEMS = [
  { q: "Quem pode participar?",                a: "O evento é exclusivo para ex-alunos do Colégio Henrique Castriciano formados em 2006 e seus acompanhantes." },
  { q: "Posso levar acompanhante?",            a: "Sim! Você pode adquirir o ingresso casal ou mesa VIP. Acompanhantes não precisam ser ex-alunos." },
  { q: "Como funciona a reivindicação?",       a: "Você busca seu nome na lista, informa seus contatos, passa por verificação e responde a perguntas sobre o HC antes de confirmar sua identidade." },
  { q: "O ingresso é transferível?",           a: "Não. O ingresso é nominal e vinculado ao CPF. Em caso de impossibilidade, entre em contato com a organização." },
  { q: "Qual é a forma de pagamento?",         a: "Aceitamos cartão de crédito (até 6× sem juros), débito e PIX via Mercado Pago." },
  { q: "Como farei o check-in no dia?",        a: "Você receberá um QR Code por e-mail após confirmação do pagamento. Apresente na entrada — impresso ou no celular." },
];

export const TIMELINE = [
  { year: "2004", label: "Primeiro ano juntos",          desc: "A turma se forma. Começa a história de três anos que ficaria para sempre." },
  { year: "2005", label: "No meio do caminho",           desc: "Gincanas, amizades reforçadas, as primeiras provas difíceis e os momentos que viraram lenda." },
  { year: "2006", label: "O ano da formatura",           desc: "Vestibular, colação de grau e o adeus que a gente não sabia que duraria tanto." },
  { year: "2016", label: "10 anos — onde estávamos?",    desc: "Alguns se reencontraram. Muitos já tinham filhos, carreiras e histórias novas." },
  { year: "2026", label: "20 anos depois — aqui estamos", desc: "O reencontro que todos esperavam. Uma noite para celebrar quem a gente se tornou." },
];

export interface TimelineItemContent {
  year: string;
  label: string;
  desc: string;
  is_visible?: boolean;
  highlight?: boolean;
}

export type HomeSectionKey = "hero" | "about" | "info" | "tickets" | "confirmed" | "photos" | "timeline" | "faq";

export interface HomeSectionContent {
  key: HomeSectionKey;
  label: string;
  is_visible?: boolean;
  sort_order: number;
}

export interface FooterLinkContent {
  page: Page;
  label: string;
  is_visible?: boolean;
}

export type ContentAdminTab = "header" | "home" | "event" | "archive" | "sections" | "labels" | "timeline" | "faq" | "footer";

export const PAGE_OPTIONS: { page: Page; label: string }[] = [
  { page: "home", label: "Home" },
  { page: "event", label: "Evento" },
  { page: "ex-alumni", label: "Ex-alunos" },
  { page: "tickets", label: "Ingressos" },
  { page: "who-going", label: "Quem Vai" },
  { page: "the-class", label: "A Turma" },
  { page: "photo-wall", label: "Nossa História" },
  { page: "memories", label: "Caixa de Memórias" },
  { page: "curiosities", label: "Curiosidades" },
  { page: "where-now", label: "Mapa" },
  { page: "archive", label: "Pós-festa" },
  { page: "login", label: "Login/Cadastro" },
  { page: "terms", label: "Termos" },
  { page: "privacy", label: "Privacidade" },
];

export const HOME_SECTION_DEFAULTS: HomeSectionContent[] = [
  { key: "hero", label: "Hero", is_visible: true, sort_order: 10 },
  { key: "about", label: "Sobre", is_visible: true, sort_order: 20 },
  { key: "info", label: "Informações do evento", is_visible: true, sort_order: 30 },
  { key: "tickets", label: "Ingressos", is_visible: true, sort_order: 40 },
  { key: "confirmed", label: "Confirmados", is_visible: true, sort_order: 50 },
  { key: "photos", label: "Fotos", is_visible: true, sort_order: 60 },
  { key: "timeline", label: "Linha do tempo", is_visible: true, sort_order: 70 },
  { key: "faq", label: "FAQ", is_visible: true, sort_order: 80 },
];

export const FOOTER_LINK_DEFAULTS: FooterLinkContent[] = [
  { page: "event", label: "Evento", is_visible: true },
  { page: "tickets", label: "Ingressos", is_visible: true },
  { page: "who-going", label: "Quem Vai", is_visible: true },
  { page: "the-class", label: "A Turma", is_visible: true },
  { page: "photo-wall", label: "Nossa História", is_visible: true },
  { page: "memories", label: "Caixa de Memórias", is_visible: false },
  { page: "curiosities", label: "Curiosidades", is_visible: true },
  { page: "where-now", label: "Onde a turma está", is_visible: true },
  { page: "archive", label: "Pós-festa", is_visible: true },
];

export type ExtendedHomePageContent = HomePageContent & {
  header_logo_alt: string;
  header_fallback_badge_main: string;
  header_fallback_badge_year: string;
  header_fallback_title: string;
  header_fallback_subtitle: string;
  header_cta_label: string;
  header_cta_visible: boolean;
  header_auth_visible: boolean;
  primary_cta_page: Page;
  secondary_cta_page: Page;
  nav_home_label: string;
  nav_event_label: string;
  nav_ex_alumni_label: string;
  nav_who_going_label: string;
  nav_the_class_label: string;
  nav_photos_label: string;
  nav_memories_label: string;
  nav_polls_label: string;
  nav_where_now_label: string;
  nav_archive_label: string;
  nav_home_visible: boolean;
  nav_event_visible: boolean;
  nav_ex_alumni_visible: boolean;
  nav_who_going_visible: boolean;
  nav_the_class_visible: boolean;
  nav_photos_visible: boolean;
  nav_memories_visible: boolean;
  nav_polls_visible: boolean;
  nav_where_now_visible: boolean;
  nav_archive_visible: boolean;
  home_sections_json: string;
  countdown_days_label: string;
  countdown_hours_label: string;
  countdown_minutes_label: string;
  countdown_seconds_label: string;
  info_date_label: string;
  info_time_label: string;
  info_location_label: string;
  info_doors_subtitle_template: string;
  info_dinner_subtitle_template: string;
  info_time_fallback_label: string;
  tickets_preview_limit: string;
  tickets_view_all_label: string;
  tickets_active_lot_label: string;
  tickets_buy_label: string;
  tickets_sold_out_label: string;
  tickets_empty_title: string;
  tickets_empty_subtitle: string;
  tickets_empty_cta_label: string;
  tickets_remaining_label_template: string;
  confirmed_preview_limit: string;
  confirmed_view_all_label: string;
  confirmed_privacy_note: string;
  event_info_view_more_label: string;
  photos_preview_limit: string;
  photos_view_all_label: string;
  photos_empty_title: string;
  photos_empty_subtitle: string;
  photos_empty_cta_label: string;
  timeline_items_json: string;
  /** @deprecated Fallback temporário; o Admin relacional não grava este campo. */
  faq_items_json: string;
  faq_search_placeholder: string;
  faq_empty_label: string;
  faq_view_all_label: string;
  faq_initial_mode: "featured" | "all";
  footer_links_json: string;
  footer_eyebrow: string;
  footer_title: string;
  footer_body: string;
  footer_nav_title: string;
  footer_contact_title: string;
  footer_email: string;
  footer_phone: string;
  footer_location: string;
  footer_copyright: string;
  footer_terms_label: string;
  footer_privacy_label: string;
  footer_admin_label: string;
  home_about_overview_json: string;
  home_alumni_overview_json: string;
  home_nostalgia_timeline_json: string;
  home_profile_stats_json: string;
  home_map_stats_json: string;
  home_poll_id: string | null;
  home_poll_fallback_json: string;
};

export type HomeAboutOverviewCopy = {
  stats_total_label?: string;
  stats_confirmed_label?: string;
  stats_memories_label?: string;
  timeline_label?: string;
  timeline_title_template?: string;
  timeline_description?: string;
  memories_label?: string;
  memories_title_template?: string;
  memories_empty_title?: string;
  memories_description?: string;
  polls_label?: string;
  polls_title?: string;
  polls_description?: string;
  charts_label?: string;
  charts_title?: string;
  charts_description?: string;
  profile_label?: string;
  profile_title_template?: string;
  profile_description?: string;
  map_label?: string;
  map_title?: string;
  map_description?: string;
  view_all_label?: string;
};

export type HomeAlumniOverviewCopy = {
  eyebrow?: string;
  title?: string;
  description?: string;
  sample_label?: string;
  sample_title_template?: string;
  presence_label?: string;
  presence_title?: string;
  confirmed_label?: string;
  intending_label?: string;
  progress_label?: string;
  classes_label?: string;
  classes_title?: string;
  confirmed_grid_label?: string;
  confirmed_grid_title?: string;
  footer_note?: string;
  view_all_label?: string;
  class_tab_label_template?: string;
  class_pagination_template?: string;
  class_empty_label?: string;
  confirmed_empty_label?: string;
};

export type NostalgiaTimelineItemContent = {
  year?: string;
  icon?: string;
  title?: string;
  label?: string;
  description?: string;
  desc?: string;
  image_url?: string;
  is_visible?: boolean;
};

export type HomeProfileStatConfig = {
  key: "women" | "married" | "children";
  label?: string;
  mode?: "auto" | "fixed";
  value?: string | number;
  fallback_value?: string | number;
};

export type HomeMapStatConfig = {
  key: "natal" | "interior" | "other_state" | "foreign";
  label?: string;
  mode?: "auto" | "fixed";
  value?: number;
  fallback_value?: number;
};

export type HomeMapLevel = "world" | "brazil" | "rn" | "natal";

export type HomePollFallbackCopy = {
  question?: string;
  empty_label?: string;
  login_required_label?: string;
};

export const EXTENDED_HOME_CONTENT_DEFAULTS: Omit<ExtendedHomePageContent, keyof HomePageContent> = {
  header_logo_alt: "",
  header_fallback_badge_main: "",
  header_fallback_badge_year: "",
  header_fallback_title: "",
  header_fallback_subtitle: "",
  header_cta_label: "",
  header_cta_visible: false,
  header_auth_visible: false,
  primary_cta_page: "home",
  secondary_cta_page: "home",
  nav_home_label: "",
  nav_event_label: "",
  nav_ex_alumni_label: "",
  nav_who_going_label: "",
  nav_the_class_label: "",
  nav_photos_label: "",
  nav_memories_label: "",
  nav_polls_label: "",
  nav_where_now_label: "",
  nav_archive_label: "",
  nav_home_visible: false,
  nav_event_visible: false,
  nav_ex_alumni_visible: false,
  nav_who_going_visible: false,
  nav_the_class_visible: false,
  nav_photos_visible: false,
  nav_memories_visible: false,
  nav_polls_visible: false,
  nav_where_now_visible: false,
  nav_archive_visible: false,
  home_sections_json: "[]",
  countdown_days_label: "",
  countdown_hours_label: "",
  countdown_minutes_label: "",
  countdown_seconds_label: "",
  info_date_label: "",
  info_time_label: "",
  info_location_label: "",
  info_doors_subtitle_template: "",
  info_dinner_subtitle_template: "",
  info_time_fallback_label: "",
  tickets_preview_limit: "0",
  tickets_view_all_label: "",
  tickets_active_lot_label: "",
  tickets_buy_label: "",
  tickets_sold_out_label: "",
  tickets_empty_title: "",
  tickets_empty_subtitle: "",
  tickets_empty_cta_label: "",
  tickets_remaining_label_template: "",
  confirmed_preview_limit: "0",
  confirmed_view_all_label: "",
  confirmed_privacy_note: "",
  event_info_view_more_label: "",
  photos_preview_limit: "0",
  photos_view_all_label: "",
  photos_empty_title: "",
  photos_empty_subtitle: "",
  photos_empty_cta_label: "",
  timeline_items_json: "[]",
  faq_items_json: "[]",
  faq_search_placeholder: "",
  faq_empty_label: "",
  faq_view_all_label: "",
  faq_initial_mode: "featured",
  footer_links_json: "[]",
  footer_eyebrow: "",
  footer_title: "",
  footer_body: "",
  footer_nav_title: "",
  footer_contact_title: "",
  footer_email: "",
  footer_phone: "",
  footer_location: "",
  footer_copyright: "",
  footer_terms_label: "",
  footer_privacy_label: "",
  footer_admin_label: "",
  home_about_overview_json: "{}",
  home_alumni_overview_json: "{}",
  home_nostalgia_timeline_json: "[]",
  home_profile_stats_json: "[]",
  home_map_stats_json: "[]",
  home_poll_id: null,
  home_poll_fallback_json: "{}",
};

export function getExtendedHomeContent(content?: HomePageContent | null): ExtendedHomePageContent {
  return {
    ...HOME_PAGE_CONTENT_DEFAULTS,
    ...EXTENDED_HOME_CONTENT_DEFAULTS,
    ...(content ?? {}),
  } as ExtendedHomePageContent;
}

export function isContentVisible(value: unknown) {
  return value !== false;
}

export function shouldShowHeroSubtitle(value?: string | null) {
  const text = value?.trim() ?? "";
  if (!text) return false;
  return !/dados fict[ií]cios carregados para demonstrar a experi[eê]ncia completa do site do reencontro\.?/i.test(text);
}

export function parseHomeJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

export function parseHomeJsonObject<T extends object>(value: string | null | undefined, fallback: T): T {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...fallback, ...parsed } as T : fallback;
  } catch {
    return fallback;
  }
}

export function normalizePage(value: unknown, fallback: Page): Page {
  const page = typeof value === "string" ? value : fallback;
  if (page === "polls") return "curiosities";
  return PAGE_OPTIONS.some(option => option.page === page) ? page as Page : fallback;
}

export function parsePositiveInteger(value: string | number | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

export function applyTextTemplate(template: string | null | undefined, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template || "");
}

export function getHomeSections(content?: HomePageContent | null) {
  const extendedContent = getExtendedHomeContent(content);
  const parsed = parseHomeJsonArray<HomeSectionContent>(extendedContent.home_sections_json, []);
  const byKey = new Map<HomeSectionKey, HomeSectionContent>();
  for (const item of parsed) {
    if (HOME_SECTION_DEFAULTS.some(section => section.key === item.key)) byKey.set(item.key, item);
  }
  return HOME_SECTION_DEFAULTS
    .map(defaultItem => byKey.has(defaultItem.key) ? { ...defaultItem, ...byKey.get(defaultItem.key) } : { ...defaultItem, is_visible: false })
    .filter(item => item.is_visible !== false)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function getFooterLinks(content?: HomePageContent | null) {
  const extendedContent = getExtendedHomeContent(content);
  return parseHomeJsonArray<FooterLinkContent>(extendedContent.footer_links_json, FOOTER_LINK_DEFAULTS)
    .map(item => ({ ...item, page: normalizePage(item.page, "home") }))
    .filter(item => item.is_visible !== false && item.label.trim());
}

export function updateHomeSection(items: HomeSectionContent[], index: number, patch: Partial<HomeSectionContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

export function updateFooterLink(items: FooterLinkContent[], index: number, patch: Partial<FooterLinkContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

export function updateNostalgiaTimelineItem(items: NostalgiaTimelineItemContent[], index: number, patch: Partial<NostalgiaTimelineItemContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

export function sortNostalgiaTimelineItems(items: NostalgiaTimelineItemContent[]) {
  return items
    .map((item, index) => ({ item, index, year: Number.parseInt(String(item.year ?? ""), 10) }))
    .sort((a, b) => {
      const aYear = Number.isFinite(a.year) ? a.year : Number.POSITIVE_INFINITY;
      const bYear = Number.isFinite(b.year) ? b.year : Number.POSITIVE_INFINITY;
      return aYear - bYear || a.index - b.index;
    })
    .map(({ item }) => item);
}

export const ADMIN_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  hidden: "Oculto",
  all: "Todos",
  draft: "Rascunho",
  open: "Aberta",
  closed: "Encerrada",
  archived: "Arquivada",
};

export function adminStatusLabel(status: string) {
  return ADMIN_STATUS_LABELS[status] ?? status;
}

export function updateEventGalleryItem(items: EventPageGalleryItem[], index: number, patch: Partial<EventPageGalleryItem>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

export function updateEventInfoItem<T extends EventPageInfoItem | EventPageScheduleItem>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

export const CONFIRM_QUESTIONS = [
  { id: "q1", question: "Qual era o nome do(a) diretor(a) ou coordenador(a) do HC em 2006?",  options: ["Prof. Rosângela Araújo", "Prof. Hélio Menezes",  "Prof. Carla Nóbrega",    "Não me lembro"]              },
  { id: "q2", question: "Em qual rua ficava o Colégio Henrique Castriciano?",                  options: ["Rua Apodi",             "Av. Deodoro",           "Rua Jundiaí",            "Av. Hermes da Fonseca"]      },
  { id: "q3", question: "Como chamávamos informalmente o pátio principal?",                    options: ["O Quadradão",           "O Jardim",              "A Quadra",               "O Corredor"]                 },
];

export type SchoolProfileQuestion = {
  id: string;
  title: string;
  options: string[];
};

export const SCHOOL_PROFILE_QUESTIONS: SchoolProfileQuestion[] = [
  {
    id: "school_personality",
    title: "Como você era na época do HC?",
    options: [
      "Adorava me comunicar",
      "Fazia todo mundo rir",
      "Era mais na minha",
      "Gostava de estudar",
      "Vivia ajudando nos trabalhos",
      "Circulava por vários grupos",
      "Sempre tinha uma história boa",
      "Participava de tudo",
      "Era mais observador",
      "Vivia chegando atrasado",
      "Era parceria para qualquer coisa",
    ],
  },
  {
    id: "school_places",
    title: "Onde você mais aparecia?",
    options: [
      "No intervalo",
      "Na sala de aula",
      "Na quadra",
      "Nos corredores",
      "Nas gincanas",
      "Nos trabalhos em grupo",
      "Nas conversas depois da aula",
      "Nas festas da turma",
      "Nas aulas de revisão",
      "Na biblioteca ou estudando",
      "Em todo canto um pouco",
    ],
  },
  {
    id: "school_memories",
    title: "O que mais marcou essa época?",
    options: [
      "As amizades",
      "As resenhas no intervalo",
      "Os professores",
      "As histórias engraçadas",
      "As gincanas",
      "As festas",
      "As provas e simulados",
      "A pressão do vestibular",
      "Crescer junto com a turma",
      "Ver todo mundo quase todo dia",
      "A saudade de uma fase mais simples",
    ],
  },
  {
    id: "school_vibe",
    title: "Qual era sua vibe na turma?",
    options: [
      "Mais brincadeira",
      "Mais organização",
      "Mais tranquilidade",
      "Mais intensidade",
      "Mais discrição",
      "Mais parceria",
      "Mais competição",
      "Mais questionamento",
      "Mais sonhador",
      "Mais independente",
      "Um pouco de tudo",
    ],
  },
  {
    id: "reunion_expectation",
    title: "O que você quer viver no reencontro?",
    options: [
      "Rever quem fez parte da minha história",
      "Matar a saudade",
      "Dar boas risadas",
      "Relembrar histórias antigas",
      "Saber por onde anda todo mundo",
      "Celebrar os 20 anos da turma",
      "Reconectar com pessoas importantes",
      "Mostrar quem me tornei",
      "Viver uma noite leve",
      "Criar novas memórias",
      "Apenas aproveitar o momento",
    ],
  },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────────

export function getEventDateTime(event?: DbEvent | null): Date {
  const datePart = event?.event_date || "2026-10-17";
  const rawTime = event?.event_time || "19:00:00";
  const timePart = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const candidate = new Date(`${datePart}T${timePart}-03:00`);
  return Number.isNaN(candidate.getTime()) ? new Date(FALLBACK_EVENT_DATE_TIME) : candidate;
}

export function getTimeLeft(targetDate: Date) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
}

export function formatLongDateBR(value?: string | null) {
  if (!value) return "Sábado, 17 de outubro de 2026";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  const formatted = date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatTimeLabel(value?: string | null) {
  if (!value) return "19h00";
  const [hours = "19", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}h${minutes.padStart(2, "0")}`;
}

export function addMinutesToTime(value?: string | null, offsetMinutes = 0) {
  const [hoursRaw = "19", minutesRaw = "00"] = (value || "19:00:00").split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return formatTimeLabel(value);
  const total = (((hours * 60 + minutes + offsetMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}h${String(total % 60).padStart(2, "0")}`;
}

export function formatCurrencyBR(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function getTicketAvailability(ticket: DbTicketType) {
  return Math.max(0, ticket.available_quantity - ticket.sold_quantity);
}

export function isTicketVisibleOnHome(ticket: DbTicketType) {
  return ticket.status === "open" || ticket.status === "sold_out";
}

export function getTicketVisualStatus(ticket: DbTicketType): TicketItem["status"] {
  const availability = getTicketAvailability(ticket);
  if (ticket.status === "sold_out" || availability <= 0) return "sold-out";
  if (availability <= 10) return "last-units";
  return "available";
}

export function getTicketDescriptionItems(description?: string | null) {
  const items = (description ?? "")
    .split(/\r?\n|;/)
    .map(item => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : ["Detalhes do lote serão informados pela organização."];
}

export function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

export function formatDateBR(value?: string | null) {
  if (!value) return "Data a confirmar";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}


export function formatDateShortBR(value?: string | null) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function relationshipStatusLabel(value?: RelationshipStatus | null, gender?: Gender | null) {
  if (!value) return null;
  if (value === "dating") return "Namorando";
  const labels: Record<Exclude<RelationshipStatus, "dating">, { male: string; female: string; fallback: string }> = {
    single: { male: "Solteiro", female: "Solteira", fallback: "Solteiro(a)" },
    married: { male: "Casado", female: "Casada", fallback: "Casado(a)" },
  };
  const label = labels[value];
  return gender === "male" || gender === "female" ? label[gender] : label.fallback;
}

export function profileStatusLabel(status?: ProfileStatus | string | null) {
  const labels: Record<ProfileStatus, string> = {
    confirmed: "Confirmado",
    claimed: "Cadastrado",
    unclaimed: "Não cadastrado",
  };
  return status && status in labels ? labels[status as ProfileStatus] : "Não cadastrado";
}

export function childrenStatusLabel(hasChildren?: boolean | null, childrenCount?: number | null) {
  if (hasChildren === true) {
    return childrenCount && childrenCount > 0
      ? `${childrenCount} ${childrenCount === 1 ? "filho" : "filhos"}`
      : "Tem filhos";
  }
  if (hasChildren === false) return "Sem filhos";
  return null;
}

export function normalizeExternalUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function whatsappLink(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

export function normalizeLoose(value?: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function getPenultimateSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";
}

export function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let insideQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }
    if (char === '"') {
      insideQuotes = !insideQuotes;
      continue;
    }
    if ((char === ";" || char === "," || char === "\t") && !insideQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }
  cells.push(current.trim());
  return cells;
}

export function normalizeParticipantHeader(value: string) {
  const normalized = normalizeLoose(value).replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const map: Record<string, keyof AdminImportPersonInput> = {
    nome: "full_name",
    nome_completo: "full_name",
    full_name: "full_name",
    nome_exibicao: "display_name",
    nome_de_exibicao: "display_name",
    display_name: "display_name",
    genero: "gender",
    gênero: "gender",
    sexo: "gender",
    gender: "gender",
    ano_nascimento: "birth_year",
    ano_de_nascimento: "birth_year",
    nascimento: "birth_year",
    birth_year: "birth_year",
    turma: "class_group",
    sala: "class_group",
    class_group: "class_group",
    foto: "avatar_url",
    url_foto: "avatar_url",
    avatar_url: "avatar_url",
    whatsapp: "contact_whatsapp",
    telefone: "contact_whatsapp",
    contact_whatsapp: "contact_whatsapp",
    email: "contact_email",
    e_mail: "contact_email",
    contact_email: "contact_email",
  };
  return map[normalized] ?? null;
}

export function rowsToParticipantImport(matrix: string[][]) {
  if (matrix.length < 2) return [];
  const header = matrix[0].map(cell => normalizeParticipantHeader(cell));
  return matrix.slice(1).map(row => {
    const item: AdminImportPersonInput = { full_name: "", display_name: "", gender: null, birth_year: null, class_group: "" };
    row.forEach((value, index) => {
      const key = header[index];
      if (!key) return;
      if (key === "birth_year") {
        const year = Number(String(value).replace(/\D/g, ""));
        item.birth_year = Number.isInteger(year) && year > 1900 ? year : null;
      } else {
        (item as unknown as Record<string, string | number | null | undefined>)[key] = value.trim();
      }
    });
    return item;
  }).filter(row => row.full_name.trim() && row.birth_year && row.class_group?.trim());
}

export function parseParticipantsCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return rowsToParticipantImport(lines.map(parseCsvLine));
}

export async function inflateZipEntry(data: Uint8Array, method: number) {
  if (method === 0) return data;
  if (method !== 8) throw new Error("Formato de compressão do XLSX não suportado.");
  const Decompression = (window as unknown as { DecompressionStream?: new (format: string) => TransformStream }).DecompressionStream;
  if (!Decompression) throw new Error("Seu navegador não tem suporte nativo para leitura de XLSX. Salve a planilha como CSV e envie novamente.");
  const stream = new Blob([data]).stream().pipeThrough(new Decompression("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

export async function readXlsxEntries(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const view = new DataView(bytes.buffer);
  const decoder = new TextDecoder("utf-8");
  const entries = new Map<string, string>();
  let offset = 0;

  while (offset + 30 < bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const method = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 18, true);
    const fileNameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const name = decoder.decode(bytes.slice(nameStart, nameStart + fileNameLength));
    const dataStart = nameStart + fileNameLength + extraLength;
    const dataEnd = dataStart + compressedSize;
    if (!compressedSize || dataEnd > bytes.length) break;
    const raw = bytes.slice(dataStart, dataEnd);
    if (!name.endsWith("/")) {
      const inflated = await inflateZipEntry(raw, method);
      entries.set(name, decoder.decode(inflated));
    }
    offset = dataEnd;
  }
  return entries;
}

export function parseXlsxTextCell(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t");
  if (type === "s") {
    const index = Number(cell.getElementsByTagName("v")[0]?.textContent ?? "");
    return Number.isInteger(index) ? sharedStrings[index] ?? "" : "";
  }
  if (type === "inlineStr") return cell.getElementsByTagName("t")[0]?.textContent ?? "";
  return cell.getElementsByTagName("v")[0]?.textContent ?? "";
}

export function columnIndexFromCellRef(ref: string) {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

export async function parseParticipantsXlsx(file: File) {
  const entries = await readXlsxEntries(file);
  const parser = new DOMParser();
  const sharedXml = entries.get("xl/sharedStrings.xml");
  const sharedStrings = sharedXml
    ? Array.from(parser.parseFromString(sharedXml, "application/xml").getElementsByTagName("si")).map(item => item.textContent ?? "")
    : [];
  const sheetXml = entries.get("xl/worksheets/sheet1.xml") ?? Array.from(entries.entries()).find(([name]) => name.startsWith("xl/worksheets/sheet"))?.[1];
  if (!sheetXml) throw new Error("Não foi possível encontrar a primeira aba da planilha.");
  const doc = parser.parseFromString(sheetXml, "application/xml");
  const matrix = Array.from(doc.getElementsByTagName("row")).map(row => {
    const cells: string[] = [];
    Array.from(row.getElementsByTagName("c")).forEach(cell => {
      const ref = cell.getAttribute("r") ?? "A";
      cells[columnIndexFromCellRef(ref)] = parseXlsxTextCell(cell, sharedStrings);
    });
    return cells.map(value => value ?? "");
  });
  return rowsToParticipantImport(matrix);
}

export async function parseParticipantImportFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseParticipantsCsv(await file.text());
  if (name.endsWith(".xlsx")) return parseParticipantsXlsx(file);
  throw new Error("Envie um arquivo .xlsx ou .csv.");
}

export function formatDateTimeBR(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function eventDateTimeLabel(event?: DbEvent | null) {
  if (!event) return "17 out 2026 · 19h";
  const date = formatDateBR(event.event_date);
  const time = event.event_time?.slice(0, 5)?.replace(":", "h") ?? "19h";
  return `${date} · ${time}`;
}

export function ticketTypeName(ticket?: TicketWithDetails | null) {
  return ticket?.ticket_types?.name ?? "Ingresso do reencontro";
}

export function ticketPaymentStatus(ticket?: TicketWithDetails | null) {
  return ticket?.orders?.payment_status ?? "pending";
}

export function formatWhatsappInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function firstAndLastName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

export function displayNameForPerson(person: Pick<DbPerson, "full_name" | "display_name">, profileDisplayName?: string | null) {
  return profileDisplayName?.trim() || person.display_name?.trim() || firstAndLastName(person.full_name) || person.full_name;
}

// Mapeia DbPerson para Alumni, interface legada dos componentes visuais.
export function personToAlumni(p: DbPerson, displayName?: string | null): Alumni {
  const name = displayNameForPerson(p, displayName);
  return {
    id:         p.id,
    name,
    nickname:   p.class_group ? `Turma ${p.class_group}` : `Turma ${p.class_year}`,
    sala:       p.class_group ?? undefined,
    city:       undefined,
    profession: undefined,
    avatarUrl:  p.avatar_url ?? undefined,
    status:     p.profile_status as "unclaimed" | "claimed" | "confirmed",
  };
}

// ─── PRIMITIVES ────────────────────────────────────────────────────────────────

export function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, full = false, className = "", ...buttonProps }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: React.ReactNode;
  variant?: "primary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
}) {
  const sizes    = { sm: "px-5 py-2.5 text-xs", md: "px-8 py-4 text-sm", lg: "px-10 py-5 text-sm" };
  const variants = {
    primary: "bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c]",
    outline: "border border-[#f0ebe0] text-[#f0ebe0] hover:bg-[#f0ebe0] hover:text-[#0d1a0f]",
    ghost:   "text-[#7a9a7a] hover:text-[#f0ebe0] hover:bg-[#1a2e1a]",
    gold:    "bg-[#c9a84c] text-[#0d1a0f] hover:bg-[#e0bf6a]",
    danger:  "bg-[#c0392b] text-[#f0ebe0] hover:bg-[#e74c3c]",
  };
  return (
    <button {...buttonProps} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.15em] transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}>
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    unclaimed:    { label: "Não cadastrado", color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    claimed:      { label: "Cadastrado",     color: "bg-[#1a3a2a] text-[#74c69d] border border-[#2d6a4f]/50"     },
    confirmed:    { label: "Confirmado",       color: "bg-[#2d6a4f]/30 text-[#c9a84c] border border-[#c9a84c]/40"  },
    available:    { label: "Disponível",       color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    "last-units": { label: "Últimas unidades", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    "sold-out":   { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    sold_out:     { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    pending:      { label: "Pendente",         color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    in_process:   { label: "Em processamento", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    approved:     { label: "Aprovado",         color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    rejected:     { label: "Rejeitado",        color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    removed:      { label: "Removido",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    hidden:       { label: "Oculto",           color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    paused:       { label: "Pausado",          color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    draft:        { label: "Rascunho",         color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    viewer:       { label: "Leitura",          color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    moderator:    { label: "Moderador",        color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    admin:        { label: "Admin",            color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    superadmin:   { label: "Superadmin",       color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    checkin_staff:{ label: "Check-in",         color: "bg-[#1a3a2a] text-[#74c69d] border border-[#2d6a4f]/50"     },
    declined:     { label: "Recusado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    valid:        { label: "Válido",           color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    used:         { label: "Já utilizado",     color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    invalid:      { label: "Inválido",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    cancelled:    { label: "Cancelado",        color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    refunded:     { label: "Reembolsado",      color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    expired:      { label: "Expirado",         color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    charged_back: { label: "Contestação",      color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    checked_in:   { label: "Check-in feito",   color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    unauthorized: { label: "Login necessário", color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    forbidden:    { label: "Sem permissão",    color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    success:      { label: "Sucesso",          color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    open:         { label: "Aberto",           color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    closed:       { label: "Fechado",          color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    archived:     { label: "Arquivado",        color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
  };
  const s = map[status] || map.unclaimed;
  return (
    <span data-status-badge={status} className={`inline-flex items-center whitespace-nowrap px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${s.color}`}>
      {s.label}
    </span>
  );
}

export function Field({ label, type = "text", placeholder, value, onChange, icon, hint }: {
  label: string; type?: string; placeholder?: string; value?: string;
  onChange?: (v: string) => void; icon?: React.ReactNode; hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]">{icon}</div>}
        <input type={type} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)}
          className={`w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 ${icon ? "pl-12" : "pl-4"} pr-4 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors`} />
      </div>
      {hint && <p className="text-[#7a9a7a] text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

export function FieldArea({ label, placeholder, value, onChange, rows = 3 }: {
  label: string; placeholder?: string; value?: string; onChange?: (v: string) => void; rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">{label}</label>
      <textarea rows={rows} placeholder={placeholder} value={value} onChange={e => onChange?.(e.target.value)}
        className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f] resize-none" />
    </div>
  );
}


export function OptionButton({ selected, onClick, children }: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left px-4 py-3 border text-sm transition-colors ${
        selected
          ? "bg-[#2d6a4f] border-[#2d6a4f] text-[#f0ebe0]"
          : "border-[#2d6a4f]/30 text-[#8ab89a] hover:border-[#2d6a4f]/70"
      }`}
    >
      {children}
    </button>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5">{children}</p>;
}

export function DisplayTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-['Playfair_Display'] font-black text-[#f0ebe0] leading-tight ${className}`}>{children}</h2>;
}

export function GoldRule() {
  return <div className="w-16 h-px bg-[#c9a84c] opacity-60 my-6" />;
}

// ─── UX PRIMITIVES ────────────────────────────────────────────────────────────

export type ToastType = "success" | "error" | "info";
export interface ToastState { message: string; type: ToastType; }

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = useCallback((message: string, type: ToastType = "info") => setToast({ message, type }), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}

export function ToastNotification({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  const styles: Record<ToastType, string> = {
    success: "bg-[#0d2e1a] border-[#2d6a4f] text-[#74c69d]",
    error:   "bg-[#2e0a0a] border-[#c0392b]/70 text-[#e74c3c]",
    info:    "bg-[#141f14] border-[#2d6a4f]/50 text-[#f0ebe0]",
  };
  return (
    <div role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} className={`fixed top-20 right-4 z-[60] max-w-xs p-4 border flex items-center gap-3 shadow-2xl ${styles[toast.type]}`}>
      {toast.type === "success" ? <CheckCircle2 size={18} /> : toast.type === "error" ? <XCircle size={18} /> : <Info size={18} />}
      <p className="text-sm flex-1">{toast.message}</p>
      <button onClick={onClose} className="opacity-60 hover:opacity-100"><X size={14} /></button>
    </div>
  );
}

export function EmptyState({ icon, title, subtitle, action }: { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon && <div className="text-[#3a5a3a]">{icon}</div>}
      <p className="text-[#7a9a7a] font-mono text-sm uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-[#3a5a3a] text-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw size={28} className="text-[#2d6a4f] animate-spin" />
      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">{message}</p>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertCircle size={36} className="text-[#e74c3c]" />
      <p className="text-[#e74c3c] font-mono text-sm">{message}</p>
      {onRetry && <Btn size="sm" variant="ghost" onClick={onRetry}><RefreshCw size={14} />Tentar novamente</Btn>}
    </div>
  );
}

export function PermissionState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <Lock size={36} className="text-[#c9a84c]" />
      <p className="text-[#c9a84c] font-mono text-sm uppercase tracking-wider">Sem permissao para esta acao</p>
      <p className="text-[#7a9a7a] text-xs">Solicite acesso a um superadmin.</p>
    </div>
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmar", danger = false }: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; message: string; confirmLabel?: string; danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-5">
        <p className="text-[#8ab89a] text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <Btn full variant={danger ? "danger" : "primary"} onClick={onConfirm}>{confirmLabel}</Btn>
          <Btn full variant="ghost" onClick={onClose}>Cancelar</Btn>
        </div>
      </div>
    </Modal>
  );
}


export function Modal({ open, onClose, title, children, wide = false }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  if (!open) return null;
  return (
    <div
      data-modal-root="true"
      className="fixed inset-0 z-[90] flex items-start sm:items-center justify-center p-3 sm:p-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      style={{ background: "rgba(8,15,8,0.88)" }}
    >
      <div className={`bg-[#141f14] border border-[#2d6a4f]/40 w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[calc(100svh-1.5rem)] sm:max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between gap-4 px-5 sm:px-6 py-4 sm:py-5 border-b border-[#2d6a4f]/20 sticky top-0 bg-[#141f14] z-20">
          <p className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-lg leading-tight pr-2">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-10 h-10 shrink-0 inline-flex items-center justify-center text-[#7a9a7a] hover:text-[#f0ebe0] hover:bg-[#1a2e1a] transition-colors -mr-2"
          >
            <X size={22} />
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}



export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = src;
  });
}

export async function createCroppedAvatarFile(
  source: string,
  zoom: number,
  offsetX: number,
  offsetY: number,
  filename = "avatar-recortado.jpg"
): Promise<File> {
  const image = await loadImageElement(source);
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar o recorte da imagem.");

  ctx.fillStyle = "#0d1a0f";
  ctx.fillRect(0, 0, size, size);

  const baseScale = Math.max(size / image.naturalWidth, size / image.naturalHeight);
  const scale = baseScale * zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const drawX = (size - drawWidth) / 2 + (offsetX / 100) * size;
  const drawY = (size - drawHeight) / 2 + (offsetY / 100) * size;

  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Não foi possível gerar o arquivo recortado.");
  return new File([blob], filename.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
}

export async function createSquareLogoFile(file: File): Promise<File> {
  const source = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(source);
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Seu navegador não conseguiu processar o logo.");

    const scale = Math.min(size / image.naturalWidth, size / image.naturalHeight);
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(image, (size - drawWidth) / 2, (size - drawHeight) / 2, drawWidth, drawHeight);

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("Não foi possível gerar o logo em 512×512 px.");
    return new File([blob], "header-logo-512.png", { type: "image/png" });
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function AvatarCropUpload({
  currentImageUrl,
  fallbackLabel,
  uploading,
  disabled = false,
  onCroppedFile,
  onRemove,
  helperText = "JPG, PNG ou WebP. Use zoom e posição para ajustar o enquadramento antes de enviar.",
}: {
  currentImageUrl?: string | null;
  fallbackLabel: string;
  uploading?: boolean;
  disabled?: boolean;
  onCroppedFile: (file: File) => Promise<void> | void;
  onRemove?: () => void;
  helperText?: string;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [fileName, setFileName] = useState("avatar.jpg");
  const [zoom, setZoom] = useState(1.2);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");

  function resetCrop() {
    setSource(null);
    setFileName("avatar.jpg");
    setZoom(1.2);
    setOffsetX(0);
    setOffsetY(0);
    setError("");
  }

  function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem válido.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 10 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSource(String(reader.result));
      setFileName(file.name || "avatar.jpg");
      setZoom(1.2);
      setOffsetX(0);
      setOffsetY(0);
      setError("");
    };
    reader.onerror = () => setError("Não foi possível ler a imagem selecionada.");
    reader.readAsDataURL(file);
  }

  async function confirmCrop() {
    if (!source) return;
    setProcessing(true);
    setError("");
    try {
      const cropped = await createCroppedAvatarFile(source, zoom, offsetX, offsetY, fileName);
      await onCroppedFile(cropped);
      resetCrop();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao recortar a imagem.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-6 min-w-0">
        <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono text-2xl shrink-0 overflow-hidden">
          {currentImageUrl ? <img src={currentImageUrl} alt="Foto de perfil" className="w-full h-full object-cover" /> : fallbackLabel}
        </div>
        <div className="flex-1">
          <label className={`inline-flex items-center justify-center gap-2 bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all ${disabled || uploading || processing ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}>
            {uploading || processing ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? "Enviando..." : processing ? "Recortando..." : currentImageUrl ? "Trocar foto" : "Escolher foto"}
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="sr-only"
              disabled={disabled || uploading || processing}
              onChange={e => handleFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {currentImageUrl && onRemove && (
            <button onClick={onRemove} className="block mt-3 text-[#7a9a7a] hover:text-[#f0ebe0] text-xs font-mono">
              Apagar foto
            </button>
          )}
          <p className="text-[#7a9a7a] text-xs font-mono mt-2">{helperText}</p>
        </div>
      </div>

      {source && (
        <div className="bg-[#0a120a] border border-[#2d6a4f]/25 p-4 flex flex-col gap-4 overflow-hidden min-w-0">
          <div className="grid grid-cols-1 md:grid-cols-[220px_minmax(0,1fr)] gap-5 items-start min-w-0">
            <div className="w-full max-w-[220px] aspect-square overflow-hidden bg-[#1a2e1a] border border-[#2d6a4f]/30 mx-auto relative">
              <img
                src={source}
                alt="Prévia do recorte"
                className="absolute left-1/2 top-1/2 w-full h-full object-cover select-none pointer-events-none"
                style={{ transform: `translate(calc(-50% + ${offsetX * 2}px), calc(-50% + ${offsetY * 2}px)) scale(${zoom})` }}
              />
              <div className="absolute inset-0 border-2 border-[#c9a84c]/70 pointer-events-none" />
            </div>

            <div className="flex flex-col gap-4 min-w-0">
              <div>
                <div className="flex justify-between text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2"><span>Zoom</span><span>{zoom.toFixed(1)}x</span></div>
                <input type="range" min="1" max="3" step="0.1" value={zoom} onChange={e => setZoom(Number(e.target.value))} className="block w-full min-w-0 accent-[#2d6a4f]" />
              </div>
              <div>
                <div className="flex justify-between text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2"><span>Posição horizontal</span><span>{offsetX}</span></div>
                <input type="range" min="-50" max="50" step="1" value={offsetX} onChange={e => setOffsetX(Number(e.target.value))} className="block w-full min-w-0 accent-[#2d6a4f]" />
              </div>
              <div>
                <div className="flex justify-between text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2"><span>Posição vertical</span><span>{offsetY}</span></div>
                <input type="range" min="-50" max="50" step="1" value={offsetY} onChange={e => setOffsetY(Number(e.target.value))} className="block w-full min-w-0 accent-[#2d6a4f]" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Btn onClick={confirmCrop} disabled={uploading || processing}>{processing ? <><RefreshCw size={14} className="animate-spin" />Processando...</> : <><Check size={14} />Usar recorte</>}</Btn>
                <Btn variant="ghost" onClick={resetCrop} disabled={uploading || processing}>Cancelar</Btn>
              </div>
            </div>
          </div>
          {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
        </div>
      )}

      {!source && error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
    </div>
  );
}

// Photo upload modal
export function PhotoUploadModal({ open, onClose, auth, navigate }: {
  open: boolean; onClose: () => void; auth: AuthState; navigate: (p: Page) => void;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState("");
  const [year, setYear] = useState("2005");
  const [location, setLocation] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [tagged, setTagged] = useState<DbPerson[]>([]);
  const [authorized, setAuthorized] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const tagResults = MOCK_PEOPLE.filter(a =>
    a.full_name.toLowerCase().includes(tagSearch.toLowerCase()) && tagSearch.length > 1 && !tagged.some(t => t.id === a.id)
  ).slice(0, 5);

  function reset() {
    setPreview(null); setFile(null); setCaption(""); setYear("2005"); setLocation("");
    setTagSearch(""); setTagged([]); setAuthorized(false);
    setSubmitted(false); setLoading(false); setUploadError("");
  }

  async function submit() {
    if (!file)       { setUploadError("Selecione uma foto antes de enviar."); return; }
    if (!caption)    { setUploadError("Adicione uma legenda para a foto."); return; }
    if (!authorized) { setUploadError("Confirme que você tem o direito de compartilhar esta imagem."); return; }
    setUploadError("");
    setLoading(true);
    try {
      await uploadPhoto({
        file,
        userId: auth.userId,
        userName: auth.name,
        caption,
        yearApprox: Number(year),
        locationText: location,
        eventId: DEFAULT_EVENT_ID,
        tags: tagged.map(person => ({ personId: person.id, name: person.full_name })),
      });
      setSubmitted(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Erro ao enviar foto.");
    } finally {
      setLoading(false);
    }
  }

  function handleClose() { reset(); onClose(); }

  if (!auth.loggedIn) {
    return (
      <Modal open={open} onClose={handleClose} title="Enviar foto antiga">
        <div className="text-center py-6">
          <Lock size={40} className="text-[#c9a84c] mx-auto mb-4" />
          <p className="text-[#f0ebe0] font-semibold mb-2">Faça login para enviar fotos</p>
          <p className="text-[#7a9a7a] text-sm mb-6">Apenas ex-alunos identificados podem enviar fotos para o mural.</p>
          <Btn full onClick={() => { handleClose(); navigate("login"); }}>Entrar</Btn>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Enviar foto antiga" wide>
      {submitted ? (
        <div className="text-center py-6">
          <div className="w-16 h-16 bg-[#2d6a4f] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#f0ebe0]" />
          </div>
          <p className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-xl mb-2">Foto enviada!</p>
          <p className="text-[#7a9a7a] text-sm mb-6">
            Sua foto foi enviada para moderação. Ela aparecerá no mural em até 24 horas após aprovação.
          </p>
          <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4 mb-6">
            <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Status</p>
            <StatusBadge status="pending" />
          </div>
          <Btn full onClick={handleClose}>Fechar</Btn>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {/* Upload area */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Foto *</p>
            {preview ? (
              <div className="relative group">
                <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                <button onClick={() => { setPreview(null); setFile(null); }}
                  className="absolute top-3 right-3 bg-[#0a120a]/80 text-[#f0ebe0] p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={16} />
                </button>
                <div className="absolute bottom-3 left-3 bg-[#2d6a4f] text-[#f0ebe0] text-[10px] font-mono px-2 py-1 uppercase tracking-wider">
                  Prévia
                </div>
              </div>
            ) : (
              <label
                className="w-full aspect-[4/3] border-2 border-dashed border-[#2d6a4f]/40 bg-[#0a120a] flex flex-col items-center justify-center gap-3 hover:border-[#2d6a4f]/70 transition-colors cursor-pointer">
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic" className="sr-only"
                  onChange={e => {
                    const selected = e.target.files?.[0] ?? null;
                    setFile(selected);
                    setPreview(selected ? URL.createObjectURL(selected) : null);
                  }} />
                <Upload size={32} className="text-[#3a5a3a]" />
                <p className="text-[#7a9a7a] text-sm">Clique para selecionar a foto</p>
                <p className="text-[#3a5a3a] text-xs font-mono">JPG, PNG ou HEIC · max 10 MB</p>
              </label>
            )}
          </div>

          <Field label="Legenda *" placeholder="Descreva o momento..." value={caption} onChange={setCaption} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Ano aproximado</p>
              <select value={year} onChange={e => setYear(e.target.value)}
                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">
                {["2003","2004","2005","2006","2007"].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <Field label="Local" placeholder="Ex: Pátio do HC" value={location} onChange={setLocation} />
          </div>

          {/* Tag people */}
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Marcar pessoas na foto</p>
            {tagged.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {tagged.map(p => (
                  <span key={p.id} className="flex items-center gap-2 bg-[#2d6a4f]/30 border border-[#2d6a4f]/40 text-[#f0ebe0] text-xs px-3 py-1.5 font-mono">
                    {p.full_name.split(" ")[0]}
                    <button onClick={() => setTagged(t => t.filter(x => x.id !== p.id))} className="text-[#7a9a7a] hover:text-[#f0ebe0]">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
              <input placeholder="Buscar por nome..." value={tagSearch} onChange={e => setTagSearch(e.target.value)}
                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
            </div>
            {tagResults.length > 0 && (
              <div className="border border-[#2d6a4f]/20 bg-[#0a120a] mt-1">
                {tagResults.map(a => (
                  <button key={a.id} onClick={() => { setTagged(t => [...t, a]); setTagSearch(""); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#141f14] text-left border-b border-[#2d6a4f]/10 last:border-0">
                    <div className="w-7 h-7 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] text-xs font-mono font-bold shrink-0">
                      {initials(a.full_name)}
                    </div>
                    <span className="text-[#f0ebe0] text-sm">{a.full_name}</span>
                    {a.nickname_at_school && <span className="text-[#c9a84c] text-xs font-mono ml-auto">&ldquo;{a.nickname_at_school}&rdquo;</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Authorization checkbox */}
          <label className="flex items-start gap-3 cursor-pointer p-4 border border-[#2d6a4f]/20 bg-[#0a120a]">
            <div onClick={() => setAuthorized(!authorized)}
              className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${authorized ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-[#3a5a3a]"}`}>
              {authorized && <Check size={12} className="text-[#f0ebe0]" />}
            </div>
            <p className="text-[#8ab89a] text-sm leading-relaxed">
              Confirmo que tenho o direito de compartilhar esta imagem e autorizo a organização a exibi-la no site e no evento, em conformidade com a <button onClick={() => navigate("privacy")} className="text-[#2d6a4f] underline">Política de Privacidade</button>. *
            </p>
          </label>

          <div className="flex items-start gap-3 bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
            <Info size={14} className="text-[#2d6a4f] shrink-0 mt-0.5" />
            <p className="text-[#7a9a7a] text-xs">Todas as fotos passam por moderação antes de aparecerem no mural. Fotos inadequadas serão rejeitadas.</p>
          </div>

          {uploadError && (
            <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{uploadError}</p>
          )}

          <Btn full onClick={submit} disabled={loading}>
            {loading
              ? <><RefreshCw size={16} className="animate-spin" />Enviando...</>
              : <><Upload size={16} />Enviar para moderação</>}
          </Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── HEADER ───────────────────────────────────────────────────────────────────

export function Header({ page, navigate, auth, logout, content }: {
  page: Page; navigate: (p: Page) => void; auth: AuthState; logout: () => void; content?: HomePageContent;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [headerProfile, setHeaderProfile] = useState<DbProfile | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const { toast, show, hide } = useToast();
  const headerContent = getExtendedHomeContent(content);

  const navLinks: { label: string; page: Page; visible: boolean }[] = ([
    { label: headerContent.nav_home_label, page: "home", visible: isContentVisible(headerContent.nav_home_visible) },
    { label: headerContent.nav_event_label, page: "event", visible: isContentVisible(headerContent.nav_event_visible) },
    { label: headerContent.nav_ex_alumni_label, page: "ex-alumni", visible: isContentVisible(headerContent.nav_ex_alumni_visible) },
    { label: headerContent.nav_photos_label, page: "photo-wall", visible: isContentVisible(headerContent.nav_photos_visible) },
    { label: headerContent.nav_polls_label, page: "curiosities", visible: isContentVisible(headerContent.nav_polls_visible) },
    { label: headerContent.nav_archive_label, page: "archive", visible: isContentVisible(headerContent.nav_archive_visible) },
  ] as { label: string; page: Page; visible: boolean }[]).filter(item => item.visible && item.label.trim());
  const mobileNavIcons: Record<Page, React.ReactNode> = {
    home: <House size={20} />,
    event: <Calendar size={20} />,
    "ex-alumni": <Users size={20} />,
    "photo-wall": <Camera size={20} />,
    curiosities: <BarChart3 size={20} />,
    archive: <Star size={20} />,
  } as Record<Page, React.ReactNode>;
  const mobileNavLabels: Partial<Record<Page, string>> = {
    home: "Home",
    event: "Evento",
    "ex-alumni": "Ex-alunos",
    "photo-wall": "Nossa História",
    curiosities: "Curiosidades",
    archive: "Pós-Festa",
  };

  useEffect(() => {
    let active = true;

    if (!auth.loggedIn || !auth.userId) {
      setHeaderProfile(null);
      setProfileMenuOpen(false);
      return;
    }

    getMyProfile(auth.userId)
      .then(profile => {
        if (active) setHeaderProfile(profile);
      })
      .catch(() => {
        if (active) setHeaderProfile(null);
      });

    return () => {
      active = false;
    };
  }, [auth.loggedIn, auth.userId]);

  function go(p: Page) {
    navigate(p);
    setMenuOpen(false);
    setProfileMenuOpen(false);
  }

  function closePasswordModal() {
    if (passwordBusy || resetBusy) return;
    setPasswordModalOpen(false);
    setPasswordError("");
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  }

  async function requestPasswordChange() {
    if (!auth.email) {
      show("Não foi possível identificar o e-mail da sua conta.", "error");
      return;
    }

    setResetBusy(true);
    setPasswordError("");
    const { error } = await supabase.auth.resetPasswordForEmail(auth.email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setResetBusy(false);
    if (error) {
      const message = error.message?.toLowerCase().includes("rate limit") || error.status === 429
        ? "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
        : "Não foi possível enviar o e-mail de redefinição de senha. Tente novamente.";
      setPasswordError(message);
      show(message, "error");
      return;
    }

    show(`Enviamos um link para redefinir sua senha para ${auth.email}.`, "success");
  }

  async function handleAvatarUpload(file: File) {
    if (!auth.userId) {
      show("Faça login novamente para alterar sua foto.", "error");
      return;
    }

    setAvatarUploading(true);
    try {
      const publicUrl = await uploadProfileAvatar(auth.userId, file);
      const updated = await saveMyPublicProfile(auth.userId, { current_photo_url: publicUrl }, { avatar_url: publicUrl });
      setHeaderProfile(updated as DbProfile);
      setPhotoModalOpen(false);
      show("Foto atualizada com sucesso.", "success");
    } catch (err) {
      show(err instanceof Error ? err.message : "Não foi possível atualizar sua foto.", "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleAvatarRemove() {
    if (!auth.userId) {
      show("Faça login novamente para apagar sua foto.", "error");
      return;
    }

    setAvatarUploading(true);
    try {
      const updated = await saveMyPublicProfile(auth.userId, { current_photo_url: null }, { avatar_url: null });
      setHeaderProfile(updated as DbProfile);
      setPhotoModalOpen(false);
      show("Foto apagada com sucesso.", "success");
    } catch (err) {
      show(err instanceof Error ? err.message : "Não foi possível apagar sua foto.", "error");
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handlePasswordSubmit() {
    if (!auth.email) {
      setPasswordError("Não foi possível identificar o e-mail da sua conta.");
      return;
    }
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Preencha todos os campos de senha.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("A confirmação da nova senha não confere.");
      return;
    }

    setPasswordBusy(true);
    setPasswordError("");
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: auth.email,
        password: passwordForm.currentPassword,
      });
      if (signInError) throw new Error("A senha atual está incorreta.");

      const { error } = await supabase.auth.updateUser({ password: passwordForm.newPassword });
      if (error) throw error;

      closePasswordModal();
      show("Senha alterada com sucesso.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível alterar a senha.";
      setPasswordError(message);
      show(message, "error");
    } finally {
      setPasswordBusy(false);
    }
  }

  const displayName = headerProfile?.display_name || auth.name || auth.email?.split("@")[0] || "Usuário";
  const shortName = displayName.split(/\s+/).filter(Boolean).slice(0, 2).join(" ") || "Minha conta";
  const email = auth.email ?? "";
  const avatarUrl = headerProfile?.current_photo_url ?? null;
  const headerLogoUrl = headerContent.header_logo_url ?? null;

  return (
    <>
      <header data-public-header className="fixed top-0 left-0 right-0 z-50 bg-[#080f08]/95 backdrop-blur-md border-b border-[#2d6a4f]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button data-public-header-logo onClick={() => go("home")} aria-label={`Início — ${headerContent.header_logo_alt}`} className="flex items-center gap-4 shrink-0 text-left">
            {headerLogoUrl ? (
              <img src={headerLogoUrl} alt={headerContent.header_logo_alt} className="h-16 w-32 object-contain" />
            ) : (
              <>
                <div data-public-header-badge className="relative h-12 w-12 rounded-full border border-[#c9a84c]/70 bg-[#0d1a0f] flex items-center justify-center shadow-[0_0_0_3px_rgba(201,168,76,0.08)]">
                  <span className="font-['Playfair_Display'] text-[#c9a84c] text-xl font-black leading-none">{headerContent.header_fallback_badge_main}</span>
                  <span className="absolute -bottom-1 -right-1 bg-[#c9a84c] text-[#0d1a0f] font-mono text-[8px] font-black px-1 leading-4">{headerContent.header_fallback_badge_year}</span>
                </div>
                <div className="hidden lg:block">
                  <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-base leading-tight tracking-wide uppercase">{headerContent.header_fallback_title}</p>
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-[0.25em] leading-none mt-1">{headerContent.header_fallback_subtitle}</p>
                </div>
              </>
            )}
          </button>

          <nav data-public-header-nav className="hidden md:flex items-center gap-5 xl:gap-6 min-w-0">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className={`text-sm xl:text-[15px] font-mono font-bold uppercase tracking-[0.12em] whitespace-nowrap leading-none transition-colors ${page === l.page ? "text-[#c9a84c]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {l.label}
              </button>
            ))}
          </nav>

          <div data-public-header-actions className="flex items-center gap-3 shrink-0">
            {isContentVisible(headerContent.header_auth_visible) && (auth.loggedIn ? (
              <div className="public-header-desktop-action relative">
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen(open => !open)}
                  className="flex items-center gap-3 border border-[#2d6a4f]/35 bg-[#0d1a0f] hover:bg-[#141f14] text-[#f0ebe0] px-3 py-2 transition-colors"
                  aria-label="Abrir menu da conta"
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={shortName} className="h-9 w-9 rounded-full object-cover bg-[#1a2e1a]" />
                  ) : (
                    <div className="h-9 w-9 rounded-full bg-[#2d6a4f] text-[#f0ebe0] flex items-center justify-center text-xs font-mono font-bold">
                      {initials(shortName)}
                    </div>
                  )}
                  <span className="max-w-[140px] truncate text-left text-xs xl:text-sm font-mono font-bold uppercase tracking-[0.08em]">{shortName}</span>
                  <ChevronDown size={15} className={`text-[#c9a84c] transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 top-full mt-3 w-80 bg-[#080f08] border border-[#2d6a4f]/35 shadow-2xl p-4">
                    <div className="flex items-center gap-4 pb-4 border-b border-[#2d6a4f]/20">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={shortName} className="h-16 w-16 rounded-full object-cover bg-[#1a2e1a]" />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-[#2d6a4f] text-[#f0ebe0] flex items-center justify-center text-lg font-mono font-bold">
                          {initials(shortName)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[#f0ebe0] font-['Playfair_Display'] text-lg font-bold leading-tight truncate">{shortName}</p>
                        <p className="text-[#7a9a7a] text-xs font-mono mt-1 truncate">{email}</p>
                      </div>
                    </div>

                    <AccountActions
                      variant="desktop"
                      isSuperadmin={auth.role === "superadmin"}
                      onNavigate={go}
                      onChangePhoto={() => { setProfileMenuOpen(false); setPhotoModalOpen(true); }}
                      onChangePassword={() => { setProfileMenuOpen(false); setPasswordModalOpen(true); }}
                      onLogout={() => { setProfileMenuOpen(false); logout(); }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <Btn size="sm" variant="outline" onClick={() => go("login")} className="public-header-desktop-action whitespace-nowrap text-xs xl:text-sm px-6 py-3">Login/Cadastro</Btn>
            ))}

            <button data-public-header-menu onClick={() => setMenuOpen(!menuOpen)} className="text-[#f0ebe0] p-2 md:hidden" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"}>
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div data-public-mobile-menu className="fixed inset-0 z-40 bg-[#080f08] flex flex-col pt-20 px-4 pb-4">
          <nav data-mobile-primary-nav aria-label="Navegação principal" className="grid grid-cols-2 gap-2">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className="flex min-h-[68px] flex-col items-center justify-center gap-1.5 border border-[#2d6a4f]/35 px-2 py-2 text-center text-[#f0ebe0] hover:border-[#c9a84c]/70 hover:text-[#c9a84c] transition-colors">
                <span aria-hidden="true" className="text-[#c9a84c]">{mobileNavIcons[l.page]}</span>
                <span className="font-mono text-[10px] font-bold uppercase leading-tight tracking-[0.08em]">{mobileNavLabels[l.page] ?? l.label}</span>
              </button>
            ))}
          </nav>
          {isContentVisible(headerContent.header_auth_visible) && (
            <div data-mobile-auth-actions className="mt-auto pt-3 flex flex-col gap-2">
              {auth.loggedIn ? (
                <AccountActions
                  variant="mobile"
                  isSuperadmin={auth.role === "superadmin"}
                  onNavigate={go}
                  onChangePhoto={() => { setMenuOpen(false); setPhotoModalOpen(true); }}
                  onChangePassword={() => { setMenuOpen(false); setPasswordModalOpen(true); }}
                  onLogout={() => { setMenuOpen(false); logout(); }}
                />
              ) : (
                <Btn full variant="outline" onClick={() => go("login")}>Login/Cadastro</Btn>
              )}
            </div>
          )}
        </div>
      )}

      <Modal open={photoModalOpen} onClose={() => !avatarUploading && setPhotoModalOpen(false)} title="Alterar foto" wide>
        <AvatarCropUpload
          currentImageUrl={avatarUrl}
          fallbackLabel={initials(shortName)}
          uploading={avatarUploading}
          disabled={avatarUploading}
          onCroppedFile={handleAvatarUpload}
          onRemove={avatarUrl ? handleAvatarRemove : undefined}
          helperText="Escolha uma foto, ajuste o recorte com zoom e posição, e salve. Você pode apagar a foto atual se preferir."
        />
      </Modal>

      <Modal open={passwordModalOpen} onClose={closePasswordModal} title="Mudar senha">
        <div className="flex flex-col gap-5">
          <Field
            label="Senha atual"
            type="password"
            value={passwordForm.currentPassword}
            onChange={v => setPasswordForm(s => ({ ...s, currentPassword: v }))}
            icon={<Lock size={16} />}
          />
          <Field
            label="Nova senha"
            type="password"
            value={passwordForm.newPassword}
            onChange={v => setPasswordForm(s => ({ ...s, newPassword: v }))}
            icon={<Key size={16} />}
            hint="Use pelo menos 6 caracteres."
          />
          <Field
            label="Repetir nova senha"
            type="password"
            value={passwordForm.confirmPassword}
            onChange={v => setPasswordForm(s => ({ ...s, confirmPassword: v }))}
            icon={<Key size={16} />}
          />

          {passwordError && (
            <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{passwordError}</p>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Btn full onClick={handlePasswordSubmit} disabled={passwordBusy || resetBusy}>
              {passwordBusy ? <><RefreshCw size={14} className="animate-spin" />Salvando...</> : "Salvar nova senha"}
            </Btn>
            <Btn full variant="ghost" onClick={requestPasswordChange} disabled={passwordBusy || resetBusy}>
              {resetBusy ? <><RefreshCw size={14} className="animate-spin" />Enviando...</> : "Esqueci minha senha"}
            </Btn>
          </div>
        </div>
      </Modal>

      {toast && <ToastNotification toast={toast} onClose={hide} />}
    </>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

export function Footer({ navigate, content }: { navigate: (p: Page) => void; content?: HomePageContent }) {
  const footerContent = getExtendedHomeContent(content);
  const footerLinks = getFooterLinks(content);

  return (
    <footer data-public-footer className="bg-[#080f08] border-t border-[#2d6a4f]/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div data-public-footer-grid className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <p className="text-[#c9a84c] font-mono text-[10px] tracking-[0.4em] uppercase mb-2">{footerContent.footer_eyebrow}</p>
            <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-2xl uppercase mb-4">{footerContent.footer_title}</p>
            <p className="text-[#7a9a7a] text-sm leading-relaxed">{footerContent.footer_body}</p>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-4">{footerContent.footer_nav_title}</p>
            <div data-public-footer-navigation className="flex flex-col gap-0">
              {footerLinks.map(link => (
                <button key={link.page} onClick={() => navigate(link.page)} className="min-h-11 text-left text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-4">{footerContent.footer_contact_title}</p>
            <div className="flex flex-col gap-3 text-sm text-[#7a9a7a]">
              {footerContent.footer_email && <p className="flex items-center gap-2"><Mail size={14} />{footerContent.footer_email}</p>}
              {footerContent.footer_phone && <p className="flex items-center gap-2"><Phone size={14} />{footerContent.footer_phone}</p>}
              {footerContent.footer_location && <p className="flex items-center gap-2"><MapPin size={14} />{footerContent.footer_location}</p>}
            </div>
          </div>
        </div>
        <div className="border-t border-[#2d6a4f]/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#3a5a3a] font-mono">{footerContent.footer_copyright}</p>
          <div data-public-footer-meta-navigation className="flex items-center gap-6 text-xs font-mono">
            <button onClick={() => navigate("terms")}   className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">{footerContent.footer_terms_label}</button>
            <button onClick={() => navigate("privacy")} className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">{footerContent.footer_privacy_label}</button>
            <button onClick={() => navigate("admin")}   className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">{footerContent.footer_admin_label}</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────


export function SaveToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-6 bg-[#0d2e1a] border border-[#2d6a4f] p-4 flex items-center gap-3">
      <CheckCircle2 size={18} className="text-[#2d6a4f]" />
      <p className="text-[#74c69d] text-sm font-semibold">Salvo com sucesso!</p>
    </div>
  );
}

export function AlumniCard({ alumni, onClaim, onOpen }: { alumni: Alumni; onClaim?: () => void; onOpen?: () => void }) {
  const colors = ["#2d6a4f", "#1a4d2e", "#40916c", "#1e3a2f", "#0b3d2e"];
  const numericSeed = Number.parseInt(alumni.id.replace(/\D/g, "").slice(-4) || "0", 10);
  const color = colors[numericSeed % colors.length];

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!onOpen) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpen();
    }
  }

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
      data-alumni-card
      className={`min-h-[148px] bg-[#141f14] border border-[#2d6a4f]/20 p-4 flex flex-col gap-3 hover:border-[#2d6a4f]/50 transition-colors ${onOpen ? "cursor-pointer focus:outline-none focus:border-[#c9a84c]" : ""}`}
    >
      <div data-alumni-card-header className="flex min-h-[64px] items-start gap-3">
        {alumni.avatarUrl ? (
          <img
            src={alumni.avatarUrl}
            alt={alumni.name}
            className="w-12 h-12 object-cover shrink-0 bg-[#1a2e1a]"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center text-[#f0ebe0] font-bold text-sm font-mono shrink-0" style={{ background: color }}>
            {initials(alumni.name)}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p data-alumni-name className="line-clamp-2 text-[#f0ebe0] font-semibold text-sm leading-tight">{alumni.name}</p>
          {alumni.nickname && <p className="text-[#c9a84c] text-xs font-mono mt-0.5">&ldquo;{alumni.nickname}&rdquo;</p>}
          {alumni.city && <p className="text-[#7a9a7a] text-xs mt-1 flex items-center gap-1"><MapPin size={10} />{alumni.city}</p>}
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-2">
        <StatusBadge status={alumni.status} />
        {alumni.status === "unclaimed" && onClaim && (
          <button
            onClick={(e) => { e.stopPropagation(); onClaim(); }}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d6a4f] hover:text-[#40916c] border border-[#2d6a4f]/40 hover:border-[#40916c] px-3 py-1.5 transition-colors"
          >
            Reivindicar
          </button>
        )}
      </div>
    </div>
  );
}

export function PersonDetailModal({
  person,
  profile,
  onClose,
  onClaim,
}: {
  person: DbPerson | null;
  profile?: Partial<PublicLocationRow> | null;
  onClose: () => void;
  onClaim?: () => void;
}) {
  const [publicProfile, setPublicProfile] = useState<PublicProfileCardRow | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setPublicProfile(null);

    if (!person?.id) return;

    setProfileLoading(true);
    getPublicProfileCardByPersonId(person.id)
      .then(data => {
        if (active) setPublicProfile(data);
      })
      .catch(() => {
        if (active) setPublicProfile(null);
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });

    return () => {
      active = false;
    };
  }, [person?.id]);

  if (!person) return null;

  const avatarUrl = publicProfile?.avatar_url ?? person.avatar_url ?? profile?.avatar_url ?? null;
  const displayName = publicProfile?.display_name || profile?.display_name || person.full_name;
  const location = [
    publicProfile?.current_city ?? profile?.current_city,
    publicProfile?.current_state ?? profile?.current_state,
    publicProfile?.current_country ?? profile?.current_country,
  ].filter(Boolean).join(" · ");
  const profession = publicProfile ? publicProfile.profession : (profile?.show_profession ? profile?.profession : null);
  const relationshipLabel = relationshipStatusLabel(publicProfile?.relationship_status ?? null, person.gender ?? null);
  const childrenLabel = publicProfile ? childrenStatusLabel(publicProfile.has_children, publicProfile.children_count) : null;
  const instagramUrl = normalizeExternalUrl(publicProfile?.instagram_url);
  const linkedinUrl = normalizeExternalUrl(publicProfile?.linkedin_url);
  const whatsappUrl = whatsappLink(publicProfile?.contact_whatsapp);

  return (
    <Modal open={!!person} onClose={onClose} title="Perfil da turma" wide>
      <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-6">
        <div>
          {avatarUrl ? (
            <img src={avatarUrl} alt={person.full_name} className="w-full aspect-square object-cover bg-[#1a2e1a] border border-[#2d6a4f]/30" />
          ) : (
            <div className="w-full aspect-square bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-mono font-bold text-3xl border border-[#2d6a4f]/30">
              {initials(person.full_name)}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Ex-aluno</p>
            <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold leading-tight">{displayName}</h3>
            {person.nickname_at_school && <p className="text-[#c9a84c] font-mono text-sm mt-1">&ldquo;{person.nickname_at_school}&rdquo;</p>}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatusBadge status={person.profile_status} />
            {person.class_group && <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1a2e1a] text-[#7a9a7a] border border-[#2d6a4f]/30">Turma {person.class_group}</span>}
            <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1a2e1a] text-[#7a9a7a] border border-[#2d6a4f]/30">Turma {person.class_year}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Nome completo" value={person.full_name} />
            <InfoRow label="Status do perfil" value={profileStatusLabel(person.profile_status)} />
            <InfoRow label="Localização atual" value={location || null} />
            <InfoRow label="Profissão" value={profession || null} />
            <InfoRow label="Estado civil" value={relationshipLabel} />
            <InfoRow label="Filhos" value={childrenLabel} />
          </div>

          {profileLoading && <p className="text-[#7a9a7a] text-xs font-mono">Carregando dados públicos...</p>}

          {(instagramUrl || linkedinUrl || whatsappUrl) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#2d6a4f]/40 text-[#f0ebe0] px-3 py-2 text-xs font-mono hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                  <Instagram size={14} />Instagram
                </a>
              )}
              {linkedinUrl && (
                <a href={linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#2d6a4f]/40 text-[#f0ebe0] px-3 py-2 text-xs font-mono hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                  <Linkedin size={14} />LinkedIn
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border border-[#2d6a4f]/40 text-[#f0ebe0] px-3 py-2 text-xs font-mono hover:border-[#c9a84c] hover:text-[#c9a84c] transition-colors">
                  <Phone size={14} />WhatsApp
                </a>
              )}
            </div>
          )}

          {person.profile_status === "unclaimed" && onClaim && (
            <Btn onClick={onClaim}><UserCheck size={16} />Criar perfil</Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}
