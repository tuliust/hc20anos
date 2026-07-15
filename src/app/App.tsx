import { useState, useEffect, Fragment, useMemo, useRef, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { DEV_MODE, supabase } from "../lib/supabase";
import {
  getPeople, getTicketTypes, getOrdersByStatus, getCurrentAdminUser, writeAudit, MOCK_PEOPLE,
  getTicketTypesAdmin, updateTicketTypeStatus, updateTicketTypeFull, createTicketType,
  getEventSettings, updateEventSettings,
  getReports, exportToCsv, exportPeopleCSV, exportOrdersCSV, exportTicketsCSV,
  getAdminUsers, addAdminUser, updateAdminRole, removeAdminUser,
  getAuditLogs, getApprovedPhotos, getPendingPhotos, moderatePhoto, uploadPhoto,
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
  getEventArchiveSettings, uploadProfileAvatar, uploadHeaderLogo, uploadFavicon, getHomePageContent, updateHomePageContent, getAttendanceIntentPersonIds, HOME_PAGE_CONTENT_DEFAULTS, type HomePageContent,
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
  Info, Package, Pencil, Heart, MessageCircle, Star, Send
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type Page =
  | "home" | "event" | "tickets" | "checkout" | "confirmation"
  | "who-going" | "the-class" | "ex-alumni" | "claim-profile"
  | "photo-wall" | "photo-detail" | "alumni-area"
  | "edit-profile" | "admin" | "checkin"
  | "login" | "terms" | "privacy" | "memories"
  | "curiosities" | "polls" | "where-now" | "share-invite"
  | "my-ticket" | "archive";

interface AuthState {
  loggedIn: boolean;
  isAdmin: boolean;
  name: string;
  userId: string;
  email?: string;
  role?: AdminRole | null;
}

interface Alumni {
  id: string; name: string; nickname?: string; sala?: string;
  city?: string; profession?: string; avatarUrl?: string;
  status: "unclaimed" | "claimed" | "confirmed";
}

interface TicketItem {
  id: string; type: string; lot: string; price: number;
  available: number; total: number; includes: string[];
  status: "available" | "last-units" | "sold-out";
}

interface Photo {
  id: string; url: string; caption: string; year: string;
  location: string; people: string[];
}

interface Lot {
  id: string; lot: string; type: string; price: number;
  total: number; sold: number;
  status: "open" | "closed" | "sold-out";
  startDate?: string; endDate?: string; allowCompanion: boolean;
}

interface TagModItem {
  id: string; photoId: string; photoCaption: string; photoUrl: string;
  taggedPerson: string; addedBy: string; date: string;
  modStatus: "pending" | "approved" | "rejected";
}

// ─── DATA ──────────────────────────────────────────────────────────────────────

const FALLBACK_EVENT_DATE_TIME = "2026-10-17T19:00:00-03:00";
const DEFAULT_EVENT_ID = "00000000-0000-0000-0000-000000000001";

const ALUMNI: Alumni[] = [
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

const TICKETS: TicketItem[] = [
  { id: "00000000-0000-0000-0001-000000000001", type: "Ingresso Individual",    lot: "1º Lote",        price: 120, available: 47, total: 100, includes: ["Jantar buffet completo", "Open bar 4 horas", "Área fotográfica", "Brinde comemorativo"],                                        status: "available"   },
  { id: "00000000-0000-0000-0001-000000000002", type: "Ingresso Casal",         lot: "1º Lote",        price: 200, available: 8,  total: 50,  includes: ["2 jantares buffet", "Open bar 4 horas", "Área fotográfica", "2 brindes comemorativos"],                                         status: "last-units"  },
  { id: "00000000-0000-0000-0001-000000000003", type: "Mesa VIP — 4 pessoas",   lot: "Edição Limitada", price: 600, available: 0,  total: 20,  includes: ["Mesa reservada premium", "Champagne na chegada", "Open bar premium", "Brinde colecionável exclusivo", "Acesso Ã  área VIP"],    status: "sold-out"    },
];

const PHOTOS: Photo[] = [
  { id: "p1", url: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=450&fit=crop&auto=format", caption: "Formatura da Turma 2006",   year: "2006", location: "Pátio do HC",            people: ["Ana Paula Oliveira", "Bruno Cavalcanti"]  },
  { id: "p2", url: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=600&h=450&fit=crop&auto=format", caption: "Intervalo no corredor",      year: "2004", location: "HC — Corredor Principal", people: ["Felipe Araújo", "Gabriela Santos"]       },
  { id: "p3", url: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=600&h=450&fit=crop&auto=format", caption: "Aula de História — Sala A",  year: "2005", location: "HC — Sala A",             people: ["Ana Paula Oliveira", "Isabela Rodrigues"] },
  { id: "p4", url: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&h=450&fit=crop&auto=format", caption: "Gincana escolar",            year: "2005", location: "Quadra do HC",            people: ["João Vitor Melo", "Karoline Freitas"]    },
  { id: "p5", url: "https://images.unsplash.com/photo-1497486751825-1233686d5d80?w=600&h=450&fit=crop&auto=format", caption: "Aulão pré-vestibular",       year: "2006", location: "HC — Auditório",          people: ["Nathan Alves", "Olivia Carvalho"]        },
  { id: "p6", url: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600&h=450&fit=crop&auto=format", caption: "Colação de grau",            year: "2006", location: "HC — Auditório Principal", people: ["Pedro Gomes", "Diego Ferreira"]          },
];

const LOTS_INIT: Lot[] = [
  { id: "l1", lot: "1º Lote",        type: "Individual",    price: 120, total: 100, sold: 53, status: "open",     startDate: "2026-06-01", endDate: "2026-08-31", allowCompanion: false },
  { id: "l2", lot: "1º Lote",        type: "Casal",         price: 200, total: 50,  sold: 42, status: "open",     startDate: "2026-06-01", endDate: "2026-08-31", allowCompanion: true  },
  { id: "l3", lot: "Edição Limitada", type: "Mesa VIP (4p)", price: 600, total: 20,  sold: 20, status: "sold-out", startDate: "2026-06-01", endDate: "2026-07-15", allowCompanion: true  },
  { id: "l4", lot: "2º Lote",        type: "Individual",    price: 150, total: 100, sold: 0,  status: "closed",   startDate: "2026-09-01", endDate: "2026-10-10", allowCompanion: false },
  { id: "l5", lot: "2º Lote",        type: "Casal",         price: 250, total: 50,  sold: 0,  status: "closed",   startDate: "2026-09-01", endDate: "2026-10-10", allowCompanion: true  },
];

const TAG_MODS_INIT: TagModItem[] = [
  { id: "tm1", photoId: "p1", photoCaption: "Formatura da Turma 2006",  photoUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=80&h=60&fit=crop", taggedPerson: "Carla Medeiros",  addedBy: "Ana Paula Oliveira",  date: "04 Jul 2026", modStatus: "pending"  },
  { id: "tm2", photoId: "p3", photoCaption: "Aula de História — Sala A", photoUrl: "https://images.unsplash.com/photo-1509062522246-3755977927d7?w=80&h=60&fit=crop", taggedPerson: "Diego Ferreira",  addedBy: "Isabela Rodrigues",   date: "03 Jul 2026", modStatus: "pending"  },
  { id: "tm3", photoId: "p4", photoCaption: "Gincana escolar",           photoUrl: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=80&h=60&fit=crop", taggedPerson: "Eduarda Lima",    addedBy: "Karoline Freitas",    date: "02 Jul 2026", modStatus: "approved" },
];

const FAQ_ITEMS = [
  { q: "Quem pode participar?",                a: "O evento é exclusivo para ex-alunos do Colégio Henrique Castriciano formados em 2006 e seus acompanhantes." },
  { q: "Posso levar acompanhante?",            a: "Sim! Você pode adquirir o ingresso casal ou mesa VIP. Acompanhantes não precisam ser ex-alunos." },
  { q: "Como funciona a reivindicação?",       a: "Você busca seu nome na lista, informa seus contatos, passa por verificação e responde a perguntas sobre o HC antes de confirmar sua identidade." },
  { q: "O ingresso é transferível?",           a: "Não. O ingresso é nominal e vinculado ao CPF. Em caso de impossibilidade, entre em contato com a organização." },
  { q: "Qual é a forma de pagamento?",         a: "Aceitamos cartão de crédito (até 6× sem juros), débito e PIX via Mercado Pago." },
  { q: "Como farei o check-in no dia?",        a: "Você receberá um QR Code por e-mail após confirmação do pagamento. Apresente na entrada — impresso ou no celular." },
];

const TIMELINE = [
  { year: "2004", label: "Primeiro ano juntos",          desc: "A turma se forma. Começa a história de três anos que ficaria para sempre." },
  { year: "2005", label: "No meio do caminho",           desc: "Gincanas, amizades reforçadas, as primeiras provas difíceis e os momentos que viraram lenda." },
  { year: "2006", label: "O ano da formatura",           desc: "Vestibular, colação de grau e o adeus que a gente não sabia que duraria tanto." },
  { year: "2016", label: "10 anos — onde estávamos?",    desc: "Alguns se reencontraram. Muitos já tinham filhos, carreiras e histórias novas." },
  { year: "2026", label: "20 anos depois — aqui estamos", desc: "O reencontro que todos esperavam. Uma noite para celebrar quem a gente se tornou." },
];

interface TimelineItemContent {
  year: string;
  label: string;
  desc: string;
  is_visible?: boolean;
  highlight?: boolean;
}

interface FAQItemContent {
  q: string;
  a: string;
  is_visible?: boolean;
}

type HomeSectionKey = "hero" | "about" | "info" | "tickets" | "confirmed" | "photos" | "timeline" | "faq";

interface HomeSectionContent {
  key: HomeSectionKey;
  label: string;
  is_visible?: boolean;
  sort_order: number;
}

interface FooterLinkContent {
  page: Page;
  label: string;
  is_visible?: boolean;
}

type ContentAdminTab = "header" | "home" | "event" | "sections" | "labels" | "timeline" | "faq" | "footer";

const PAGE_OPTIONS: { page: Page; label: string }[] = [
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

const HOME_SECTION_DEFAULTS: HomeSectionContent[] = [
  { key: "hero", label: "Hero", is_visible: true, sort_order: 10 },
  { key: "about", label: "Sobre", is_visible: true, sort_order: 20 },
  { key: "info", label: "Informações do evento", is_visible: true, sort_order: 30 },
  { key: "tickets", label: "Ingressos", is_visible: true, sort_order: 40 },
  { key: "confirmed", label: "Confirmados", is_visible: true, sort_order: 50 },
  { key: "photos", label: "Fotos", is_visible: true, sort_order: 60 },
  { key: "timeline", label: "Linha do tempo", is_visible: true, sort_order: 70 },
  { key: "faq", label: "FAQ", is_visible: true, sort_order: 80 },
];

const FOOTER_LINK_DEFAULTS: FooterLinkContent[] = [
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

type ExtendedHomePageContent = HomePageContent & {
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
  faq_items_json: string;
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

type HomeAboutOverviewCopy = {
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

type HomeAlumniOverviewCopy = {
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

type NostalgiaTimelineItemContent = {
  year?: string;
  icon?: string;
  title?: string;
  label?: string;
  description?: string;
  desc?: string;
  is_visible?: boolean;
};

type HomeProfileStatConfig = {
  key: "women" | "married" | "children";
  label?: string;
  mode?: "auto" | "fixed";
  value?: string | number;
  fallback_value?: string | number;
};

type HomeMapStatConfig = {
  key: "natal" | "interior" | "other_state" | "foreign";
  label?: string;
  mode?: "auto" | "fixed";
  value?: number;
  fallback_value?: number;
};

type HomePollFallbackCopy = {
  question?: string;
  empty_label?: string;
  login_required_label?: string;
};

const EXTENDED_HOME_CONTENT_DEFAULTS: Omit<ExtendedHomePageContent, keyof HomePageContent> = {
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

function getExtendedHomeContent(content?: HomePageContent | null): ExtendedHomePageContent {
  return {
    ...HOME_PAGE_CONTENT_DEFAULTS,
    ...EXTENDED_HOME_CONTENT_DEFAULTS,
    ...(content ?? {}),
  } as ExtendedHomePageContent;
}

function isContentVisible(value: unknown) {
  return value !== false;
}

function shouldShowHeroSubtitle(value?: string | null) {
  const text = value?.trim() ?? "";
  if (!text) return false;
  return !/dados fict[ií]cios carregados para demonstrar a experi[eê]ncia completa do site do reencontro\.?/i.test(text);
}

function parseHomeJsonArray<T>(value: string | null | undefined, fallback: T[]): T[] {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed as T[] : fallback;
  } catch {
    return fallback;
  }
}

function parseHomeJsonObject<T extends object>(value: string | null | undefined, fallback: T): T {
  if (!value?.trim()) return fallback;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? { ...fallback, ...parsed } as T : fallback;
  } catch {
    return fallback;
  }
}

function normalizePage(value: unknown, fallback: Page): Page {
  const page = typeof value === "string" ? value : fallback;
  if (page === "polls") return "curiosities";
  return PAGE_OPTIONS.some(option => option.page === page) ? page as Page : fallback;
}

function parsePositiveInteger(value: string | number | null | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function applyTextTemplate(template: string | null | undefined, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, String(value)), template || "");
}

function getHomeSections(content?: HomePageContent | null) {
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

function getFooterLinks(content?: HomePageContent | null) {
  const extendedContent = getExtendedHomeContent(content);
  return parseHomeJsonArray<FooterLinkContent>(extendedContent.footer_links_json, FOOTER_LINK_DEFAULTS)
    .map(item => ({ ...item, page: normalizePage(item.page, "home") }))
    .filter(item => item.is_visible !== false && item.label.trim());
}

function updateHomeSection(items: HomeSectionContent[], index: number, patch: Partial<HomeSectionContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function updateFooterLink(items: FooterLinkContent[], index: number, patch: Partial<FooterLinkContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function updateNostalgiaTimelineItem(items: NostalgiaTimelineItemContent[], index: number, patch: Partial<NostalgiaTimelineItemContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function updateFaqItem(items: FAQItemContent[], index: number, patch: Partial<FAQItemContent>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function updateEventGalleryItem(items: EventPageGalleryItem[], index: number, patch: Partial<EventPageGalleryItem>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

function updateEventInfoItem<T extends EventPageInfoItem | EventPageScheduleItem>(items: T[], index: number, patch: Partial<T>) {
  return items.map((item, i) => i === index ? { ...item, ...patch } : item);
}

const CONFIRM_QUESTIONS = [
  { id: "q1", question: "Qual era o nome do(a) diretor(a) ou coordenador(a) do HC em 2006?",  options: ["Prof. Rosângela Araújo", "Prof. Hélio Menezes",  "Prof. Carla Nóbrega",    "Não me lembro"]              },
  { id: "q2", question: "Em qual rua ficava o Colégio Henrique Castriciano?",                  options: ["Rua Apodi",             "Av. Deodoro",           "Rua Jundiaí",            "Av. Hermes da Fonseca"]      },
  { id: "q3", question: "Como chamávamos informalmente o pátio principal?",                    options: ["O Quadradão",           "O Jardim",              "A Quadra",               "O Corredor"]                 },
];

type SchoolProfileQuestion = {
  id: string;
  title: string;
  options: string[];
};

const SCHOOL_PROFILE_QUESTIONS: SchoolProfileQuestion[] = [
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

function getEventDateTime(event?: DbEvent | null): Date {
  const datePart = event?.event_date || "2026-10-17";
  const rawTime = event?.event_time || "19:00:00";
  const timePart = rawTime.length === 5 ? `${rawTime}:00` : rawTime;
  const candidate = new Date(`${datePart}T${timePart}-03:00`);
  return Number.isNaN(candidate.getTime()) ? new Date(FALLBACK_EVENT_DATE_TIME) : candidate;
}

function getTimeLeft(targetDate: Date) {
  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
}

function formatLongDateBR(value?: string | null) {
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

function formatTimeLabel(value?: string | null) {
  if (!value) return "19h00";
  const [hours = "19", minutes = "00"] = value.split(":");
  return `${hours.padStart(2, "0")}h${minutes.padStart(2, "0")}`;
}

function addMinutesToTime(value?: string | null, offsetMinutes = 0) {
  const [hoursRaw = "19", minutesRaw = "00"] = (value || "19:00:00").split(":");
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return formatTimeLabel(value);
  const total = (((hours * 60 + minutes + offsetMinutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}h${String(total % 60).padStart(2, "0")}`;
}

function formatCurrencyBR(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function getTicketAvailability(ticket: DbTicketType) {
  return Math.max(0, ticket.available_quantity - ticket.sold_quantity);
}

function isTicketVisibleOnHome(ticket: DbTicketType) {
  return ticket.status === "open" || ticket.status === "sold_out";
}

function getTicketVisualStatus(ticket: DbTicketType): TicketItem["status"] {
  const availability = getTicketAvailability(ticket);
  if (ticket.status === "sold_out" || availability <= 0) return "sold-out";
  if (availability <= 10) return "last-units";
  return "available";
}

function getTicketDescriptionItems(description?: string | null) {
  const items = (description ?? "")
    .split(/\r?\n|;/)
    .map(item => item.trim())
    .filter(Boolean);
  return items.length > 0 ? items : ["Detalhes do lote serão informados pela organização."];
}

function initials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function formatDateBR(value?: string | null) {
  if (!value) return "Data a confirmar";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}


function formatDateShortBR(value?: string | null) {
  if (!value) return "";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T12:00:00-03:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function relationshipStatusLabel(value?: RelationshipStatus | null, gender?: Gender | null) {
  if (!value) return null;
  if (value === "dating") return "Namorando";
  const labels: Record<Exclude<RelationshipStatus, "dating">, { male: string; female: string; fallback: string }> = {
    single: { male: "Solteiro", female: "Solteira", fallback: "Solteiro(a)" },
    married: { male: "Casado", female: "Casada", fallback: "Casado(a)" },
  };
  const label = labels[value];
  return gender === "male" || gender === "female" ? label[gender] : label.fallback;
}

function profileStatusLabel(status?: ProfileStatus | string | null) {
  const labels: Record<ProfileStatus, string> = {
    confirmed: "Confirmado",
    claimed: "Cadastrado",
    unclaimed: "Não cadastrado",
  };
  return status && status in labels ? labels[status as ProfileStatus] : "Não cadastrado";
}

function childrenStatusLabel(hasChildren?: boolean | null, childrenCount?: number | null) {
  if (hasChildren === true) {
    return childrenCount && childrenCount > 0
      ? `${childrenCount} ${childrenCount === 1 ? "filho" : "filhos"}`
      : "Tem filhos";
  }
  if (hasChildren === false) return "Sem filhos";
  return null;
}

function normalizeExternalUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

function whatsappLink(value?: string | null) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return null;
  const normalized = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${normalized}`;
}

function normalizeLoose(value?: string | number | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getPenultimateSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";
}

function parseCsvLine(line: string) {
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

function normalizeParticipantHeader(value: string) {
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

function rowsToParticipantImport(matrix: string[][]) {
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

function parseParticipantsCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  return rowsToParticipantImport(lines.map(parseCsvLine));
}

async function inflateZipEntry(data: Uint8Array, method: number) {
  if (method === 0) return data;
  if (method !== 8) throw new Error("Formato de compressão do XLSX não suportado.");
  const Decompression = (window as unknown as { DecompressionStream?: new (format: string) => TransformStream }).DecompressionStream;
  if (!Decompression) throw new Error("Seu navegador não tem suporte nativo para leitura de XLSX. Salve a planilha como CSV e envie novamente.");
  const stream = new Blob([data]).stream().pipeThrough(new Decompression("deflate-raw"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function readXlsxEntries(file: File) {
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

function parseXlsxTextCell(cell: Element, sharedStrings: string[]) {
  const type = cell.getAttribute("t");
  if (type === "s") {
    const index = Number(cell.getElementsByTagName("v")[0]?.textContent ?? "");
    return Number.isInteger(index) ? sharedStrings[index] ?? "" : "";
  }
  if (type === "inlineStr") return cell.getElementsByTagName("t")[0]?.textContent ?? "";
  return cell.getElementsByTagName("v")[0]?.textContent ?? "";
}

function columnIndexFromCellRef(ref: string) {
  const letters = ref.replace(/[^A-Z]/gi, "").toUpperCase();
  return letters.split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

async function parseParticipantsXlsx(file: File) {
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

async function parseParticipantImportFile(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return parseParticipantsCsv(await file.text());
  if (name.endsWith(".xlsx")) return parseParticipantsXlsx(file);
  throw new Error("Envie um arquivo .xlsx ou .csv.");
}

function formatDateTimeBR(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function eventDateTimeLabel(event?: DbEvent | null) {
  if (!event) return "17 out 2026 · 19h";
  const date = formatDateBR(event.event_date);
  const time = event.event_time?.slice(0, 5)?.replace(":", "h") ?? "19h";
  return `${date} · ${time}`;
}

function ticketTypeName(ticket?: TicketWithDetails | null) {
  return ticket?.ticket_types?.name ?? "Ingresso do reencontro";
}

function ticketPaymentStatus(ticket?: TicketWithDetails | null) {
  return ticket?.orders?.payment_status ?? "pending";
}

function formatWhatsappInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function firstAndLastName(fullName?: string | null) {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? "";
  return `${parts[0]} ${parts[parts.length - 1]}`;
}

function displayNameForPerson(person: Pick<DbPerson, "full_name" | "display_name">, profileDisplayName?: string | null) {
  return profileDisplayName?.trim() || person.display_name?.trim() || firstAndLastName(person.full_name) || person.full_name;
}

// Mapeia DbPerson para Alumni, interface legada dos componentes visuais.
function personToAlumni(p: DbPerson, displayName?: string | null): Alumni {
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

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, full = false, className = "", ...buttonProps }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    unclaimed:    { label: "Não cadastrado", color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    claimed:      { label: "Cadastrado",     color: "bg-[#1a3a2a] text-[#74c69d] border border-[#2d6a4f]/50"     },
    confirmed:    { label: "Confirmado",       color: "bg-[#2d6a4f]/30 text-[#c9a84c] border border-[#c9a84c]/40"  },
    available:    { label: "Disponível",       color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    "last-units": { label: "Últimas unidades", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    "sold-out":   { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    sold_out:     { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    pending:      { label: "Aguardando",       color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    in_process:   { label: "Em processamento", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    approved:     { label: "Aprovado",         color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    rejected:     { label: "Rejeitado",        color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    removed:      { label: "Removido",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
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
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider ${s.color}`}>
      {s.label}
    </span>
  );
}

function Field({ label, type = "text", placeholder, value, onChange, icon, hint }: {
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

function FieldArea({ label, placeholder, value, onChange, rows = 3 }: {
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


function OptionButton({ selected, onClick, children }: {
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5">{children}</p>;
}

function DisplayTitle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`font-['Playfair_Display'] font-black text-[#f0ebe0] leading-tight ${className}`}>{children}</h2>;
}

function GoldRule() {
  return <div className="w-16 h-px bg-[#c9a84c] opacity-60 my-6" />;
}

// ─── UX PRIMITIVES ────────────────────────────────────────────────────────────

type ToastType = "success" | "error" | "info";
interface ToastState { message: string; type: ToastType; }

function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const show = useCallback((message: string, type: ToastType = "info") => setToast({ message, type }), []);
  const hide = useCallback(() => setToast(null), []);
  return { toast, show, hide };
}

function ToastNotification({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
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

function EmptyState({ icon, title, subtitle, action }: { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      {icon && <div className="text-[#3a5a3a]">{icon}</div>}
      <p className="text-[#7a9a7a] font-mono text-sm uppercase tracking-wider">{title}</p>
      {subtitle && <p className="text-[#3a5a3a] text-xs">{subtitle}</p>}
      {action}
    </div>
  );
}

function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <RefreshCw size={28} className="text-[#2d6a4f] animate-spin" />
      <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">{message}</p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <AlertCircle size={36} className="text-[#e74c3c]" />
      <p className="text-[#e74c3c] font-mono text-sm">{message}</p>
      {onRetry && <Btn size="sm" variant="ghost" onClick={onRetry}><RefreshCw size={14} />Tentar novamente</Btn>}
    </div>
  );
}

function PermissionState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
      <Lock size={36} className="text-[#c9a84c]" />
      <p className="text-[#c9a84c] font-mono text-sm uppercase tracking-wider">Sem permissao para esta acao</p>
      <p className="text-[#7a9a7a] text-xs">Solicite acesso a um superadmin.</p>
    </div>
  );
}

function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Confirmar", danger = false }: {
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

function SaveToast({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="mb-6 bg-[#0d2e1a] border border-[#2d6a4f] p-4 flex items-center gap-3">
      <CheckCircle2 size={18} className="text-[#2d6a4f]" />
      <p className="text-[#74c69d] text-sm font-semibold">Salvo com sucesso!</p>
    </div>
  );
}

function AlumniCard({ alumni, onClaim, onOpen }: { alumni: Alumni; onClaim?: () => void; onOpen?: () => void }) {
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
      className={`bg-[#141f14] border border-[#2d6a4f]/20 p-4 flex flex-col gap-3 hover:border-[#2d6a4f]/50 transition-colors ${onOpen ? "cursor-pointer focus:outline-none focus:border-[#c9a84c]" : ""}`}
    >
      <div className="flex items-start gap-3">
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
          <p className="text-[#f0ebe0] font-semibold text-sm leading-tight truncate">{alumni.name}</p>
          {alumni.nickname && <p className="text-[#c9a84c] text-xs font-mono mt-0.5">&ldquo;{alumni.nickname}&rdquo;</p>}
          {alumni.city && <p className="text-[#7a9a7a] text-xs mt-1 flex items-center gap-1"><MapPin size={10} />{alumni.city}</p>}
        </div>
      </div>

      <div className="flex items-center justify-between">
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

function PersonDetailModal({
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


function Modal({ open, onClose, title, children, wide = false }: {
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



function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Não foi possível carregar a imagem."));
    image.src = src;
  });
}

async function createCroppedAvatarFile(
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

async function createSquareLogoFile(file: File): Promise<File> {
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

function AvatarCropUpload({
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
function PhotoUploadModal({ open, onClose, auth, navigate }: {
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

function Header({ page, navigate, auth, logout, content }: {
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
                <div className="relative h-12 w-12 rounded-full border border-[#c9a84c]/70 bg-[#0d1a0f] flex items-center justify-center shadow-[0_0_0_3px_rgba(201,168,76,0.08)]">
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

                    <div className="pt-3 flex flex-col">
                      {auth.role === "superadmin" && (
                        <button onClick={() => go("admin")} className="text-left px-3 py-3 text-[#c9a84c] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">PAINEL ADMIN</button>
                      )}
                      <button onClick={() => go("edit-profile")} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Editar perfil</button>
                      <button onClick={() => { setProfileMenuOpen(false); setPhotoModalOpen(true); }} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Alterar foto</button>
                      <button onClick={() => { setProfileMenuOpen(false); setPasswordModalOpen(true); }} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Mudar senha</button>
                      <button onClick={() => go("alumni-area")} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Seus ingressos e atualizações</button>
                      <button onClick={() => { setProfileMenuOpen(false); logout(); }} className="text-left px-3 py-3 text-[#e74c3c] hover:bg-[#2e0a0a] text-xs font-mono uppercase tracking-wider transition-colors">Sair</button>
                    </div>
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
        <div className="fixed inset-0 z-40 bg-[#080f08] flex flex-col pt-24 px-6 pb-8">
          <div className="flex flex-col gap-1">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className="text-left py-5 border-b border-[#2d6a4f]/20 text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold hover:text-[#c9a84c] transition-colors">
                {l.label}
              </button>
            ))}
          </div>
          {isContentVisible(headerContent.header_auth_visible) && (
            <div className="mt-auto pt-8 flex flex-col gap-3">
              {auth.loggedIn ? (
                <>
                  <Btn full variant="outline" onClick={() => go("alumni-area")}>Minha área</Btn>
                  <Btn full variant="ghost" onClick={() => { logout(); setMenuOpen(false); }}>Sair da conta</Btn>
                </>
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

function Footer({ navigate, content }: { navigate: (p: Page) => void; content?: HomePageContent }) {
  const footerContent = getExtendedHomeContent(content);
  const footerLinks = getFooterLinks(content);

  return (
    <footer className="bg-[#080f08] border-t border-[#2d6a4f]/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <p className="text-[#c9a84c] font-mono text-[10px] tracking-[0.4em] uppercase mb-2">{footerContent.footer_eyebrow}</p>
            <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-2xl uppercase mb-4">{footerContent.footer_title}</p>
            <p className="text-[#7a9a7a] text-sm leading-relaxed">{footerContent.footer_body}</p>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-4">{footerContent.footer_nav_title}</p>
            <div className="flex flex-col gap-3">
              {footerLinks.map(link => (
                <button key={link.page} onClick={() => navigate(link.page)} className="text-left text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors">
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
          <div className="flex items-center gap-6 text-xs font-mono">
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

function LoginPage({ navigate, onLogin }: {
  navigate: (p: Page) => void;
  onLogin: (auth: AuthState) => void;
}) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit() {
    setError("");
    setLoading(true);

    try {
      if (!email.includes("@")) {
        setError("Informe um e-mail válido.");
        setLoading(false);
        return;
      }

      if (password.length < 4) {
        setError("Senha muito curta. Use ao menos 4 caracteres.");
        setLoading(false);
        return;
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

      if (authErr || !data.user) {
        if (!DEV_MODE) {
          setError("Credenciais inválidas.");
          setLoading(false);
          return;
        }

        const prefix = email.split("@")[0].split(".")[0].toLowerCase();
        const match  = MOCK_PEOPLE.find((a: DbPerson) => a.full_name.toLowerCase().includes(prefix));

        onLogin({
          loggedIn: true,
          isAdmin: false,
          name: match?.full_name || "Ana Paula Oliveira",
          userId: "dev-user",
          email,
          role: null,
        });

        setLoading(false);
        return;
      }

      const displayName = data.user.user_metadata?.full_name ?? data.user.email ?? "Ex-aluno";
      const adminUser = await getCurrentAdminUser(data.user.id).catch(() => null);

      onLogin({
        loggedIn: true,
        isAdmin: !!adminUser,
        name: displayName,
        userId: data.user.id,
        email: data.user.email,
        role: adminUser?.role ?? null,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] tracking-[0.4em] text-[10px] font-mono font-bold uppercase mb-4">
            Colégio Henrique Castriciano · Natal, RN
          </p>
          <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl uppercase mb-2">Turma 2006</h1>
          <p className="font-['Playfair_Display'] italic text-[#c9a84c] text-xl">20 anos depois</p>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
          <div className="flex flex-col gap-5">
            <DisplayTitle className="text-xl">Entrar como ex-aluno</DisplayTitle>

            <Field
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
            />

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                  className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a9a7a] hover:text-[#f0ebe0]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}

            <Btn full onClick={submit} disabled={loading}>
              {loading ? <><RefreshCw size={16} className="animate-spin" />Entrando...</> : "Entrar"}
            </Btn>

            <p className="text-[#7a9a7a] text-xs text-center">
              Ainda não tem conta?{" "}
              <button onClick={() => navigate("claim-profile")} className="text-[#2d6a4f] hover:text-[#40916c] underline">
                Criar meu perfil
              </button>
            </p>

            {DEV_MODE && (
              <p className="text-[#3a5a3a] text-[10px] font-mono text-center border-t border-[#2d6a4f]/10 pt-4">
                Modo desenvolvimento: qualquer e-mail + senha com 4+ caracteres
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors flex items-center gap-2 mx-auto">
            <ArrowLeft size={16} />Voltar ao site
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

function Hero({ navigate, content, event }: { navigate: (p: Page) => void; content: HomePageContent; event: DbEvent | null }) {
  const extendedContent = getExtendedHomeContent(content);
  const showSubtitle = shouldShowHeroSubtitle(content.hero_subtitle);
  const [time, setTime] = useState(() => getTimeLeft(getEventDateTime(event)));

  useEffect(() => {
    const update = () => setTime(getTimeLeft(getEventDateTime(event)));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [event?.event_date, event?.event_time]);

  return (
    <section data-home-section="hero" className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden pt-20 pb-10 md:pt-24 md:pb-8"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "#2d6a4f" }} />

      <div className="relative z-10 text-center px-4 max-w-5xl w-full mx-auto">
        <p className="text-[#c9a84c] tracking-[0.5em] text-[10px] md:text-xs font-mono font-bold uppercase mb-4 md:mb-5">{content.hero_eyebrow}</p>
        <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] uppercase leading-[0.86] tracking-tight"
          style={{ fontSize: "clamp(3rem, 10vw, 8rem)" }}>{content.hero_title}</h1>
        <p className="font-['Playfair_Display'] font-light italic text-[#c9a84c] leading-tight mt-2"
          style={{ fontSize: "clamp(1.15rem, 3.2vw, 2.2rem)" }}>{content.hero_tagline}</p>
        <div className="w-20 h-px bg-[#c9a84c] mx-auto my-4 md:my-5 opacity-50" />
        {showSubtitle && <p className="text-[#8ab89a] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-4">{content.hero_subtitle}</p>}
        <p className={`text-[#f0ebe0] font-mono text-sm md:text-[15px] tracking-[0.24em] uppercase opacity-75 ${showSubtitle ? "mt-1" : "mt-0"} mb-8 md:mb-10`}>{content.hero_event_line}</p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 md:mb-12">
          <Btn size="lg" className="max-sm:px-6 max-sm:py-3" onClick={() => navigate(normalizePage(extendedContent.primary_cta_page, "tickets"))}>{content.primary_cta_label}</Btn>
          <Btn size="lg" variant="outline" className="max-sm:px-6 max-sm:py-3" onClick={() => navigate(normalizePage(extendedContent.secondary_cta_page, "who-going"))}>{content.secondary_cta_label}</Btn>
        </div>
        <div className="inline-flex">
          {[
            { v: time.days, l: extendedContent.countdown_days_label },
            { v: time.hours, l: extendedContent.countdown_hours_label },
            { v: time.minutes, l: extendedContent.countdown_minutes_label },
            { v: time.seconds, l: extendedContent.countdown_seconds_label },
          ].map(({ v, l }, i) => (
            <div key={l} className="flex items-center">
              {i > 0 && <span className="text-[#2d6a4f] font-mono text-4xl md:text-4xl mx-2.5 md:mx-6 font-light">:</span>}
              <div className="text-center">
                <div className="font-['JetBrains_Mono'] text-5xl md:text-6xl font-bold text-[#f0ebe0] tabular-nums">{String(v).padStart(2, "0")}</div>
                <div className="text-[#c9a84c] text-[9px] tracking-[0.3em] uppercase font-mono mt-1">{l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 md:bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="text-[#c9a84c] opacity-70" size={34} />
      </div>
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
  const visibleItems = items.filter(item => item.is_visible !== false && item.year && (item.title || item.label));

  useEffect(() => {
    if (!("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      if (performance.now() < manualSelectionUntilRef.current) return;
      const activeEntry = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!activeEntry) return;
      const index = Number((activeEntry.target as HTMLElement).dataset.timelineIndex);
      if (Number.isInteger(index)) setOpenIndex(index);
    }, { rootMargin: "-32% 0px -42% 0px", threshold: [0.2, 0.5, 0.8] });

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
              <div className={`grid transition-[grid-template-rows,opacity,transform] duration-500 motion-reduce:transition-none ${open && description ? "grid-rows-[1fr] translate-x-2 opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                <div className="overflow-hidden">
                  <p className="mt-3 max-w-md text-base leading-relaxed text-[#8ab89a]">{description}</p>
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

function HomeMemoriesCarousel({ memories, emptyLabel, description }: { memories: DbMemory[]; emptyLabel?: string; description?: string }) {
  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [memories.length]);
  if (!memories.length) return <p className="text-sm leading-relaxed text-[#7a9a7a]">{emptyLabel || description}</p>;

  const memory = memories[index];
  const go = (delta: number) => setIndex(current => (current + delta + memories.length) % memories.length);
  return (
    <div data-home-memory-carousel>
      <blockquote className="min-h-28 font-['Playfair_Display'] text-xl leading-relaxed text-[#f0ebe0]">“{memory.memory_text}”</blockquote>
      <div className="mt-5 flex items-end justify-between gap-4 border-t border-[#2d6a4f]/20 pt-4">
        <div className="min-w-0">
          <p className="truncate text-xs text-[#8ab89a]">{memory.is_anonymous ? "Anônimo" : memory.author_name || "Ex-aluno"}</p>
          <p className="mt-1 font-mono text-[10px] text-[#3a5a3a]">{index + 1} / {memories.length}</p>
        </div>
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

  return (
    <div data-home-profile-metrics className="grid grid-cols-3 gap-3">
      {rows.map(row => (
        <div key={row.key} className="border-l border-[#2d6a4f]/30 pl-3 first:border-l-0 first:pl-0">
          <p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">{formatConfiguredPercent(row, automatic[row.key])}</p>
          <p className="mt-1 text-[10px] leading-tight text-[#7a9a7a]">{row.label}</p>
        </div>
      ))}
    </div>
  );
}

function classifyHomeLocations(locations: LocationStat[]) {
  const counts: Record<HomeMapStatConfig["key"], number> = { natal: 0, interior: 0, other_state: 0, foreign: 0 };
  for (const location of locations) {
    const country = normalizeHomeMetric(location.country || "Brasil");
    const state = normalizeHomeMetric(location.state).toUpperCase();
    const city = normalizeHomeMetric(location.city);
    if (!city) continue;
    if (country && country !== "brasil" && country !== "brazil") counts.foreign += location.count;
    else if (!state) continue;
    else if (state !== "RN") counts.other_state += location.count;
    else if (city === "natal") counts.natal += location.count;
    else counts.interior += location.count;
  }
  return counts;
}

function HomeMapChart({ configs, locations }: { configs: HomeMapStatConfig[]; locations: LocationStat[] }) {
  const automatic = classifyHomeLocations(locations);
  const orderedKeys: HomeMapStatConfig["key"][] = ["natal", "interior", "other_state", "foreign"];
  const rows = orderedKeys.map(key => {
    const config = configs.find(item => item.key === key) ?? { key };
    const count = config.mode === "fixed" ? Number(config.value ?? config.fallback_value ?? 0) : automatic[key];
    return { key, label: config.label, count: Number.isFinite(count) ? count : 0 };
  });
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <div data-home-map-chart className="flex flex-col gap-3">
      {rows.map(row => {
        const percent = percentOf(row.count, total);
        return (
          <div key={row.key}>
            <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
              <span className="text-[#f0ebe0]">{row.label}</span>
              <span className="font-mono text-[#c9a84c]">{row.count} · {percent}%</span>
            </div>
            <div className="h-2 overflow-hidden bg-[#0d1a0f]"><div className="h-full bg-[#2d6a4f] transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} /></div>
          </div>
        );
      })}
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
    <section data-home-section="about" className="home-section bg-[#0d1a0f]">
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

          <div className="flex flex-col gap-4">
            <div data-home-about-stats className="border border-[#2d6a4f]/25 bg-[#141f14] p-5 md:p-6">
              <div className="flex items-end justify-between gap-4 border-b border-[#2d6a4f]/20 pb-5">
                <div><p className="font-['Playfair_Display'] text-5xl font-black leading-none text-[#c9a84c]">{visiblePeople.length}</p><p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-[#7a9a7a]">{aboutCopy.stats_total_label}</p></div>
                <Users size={24} className="text-[#2d6a4f]" />
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3">
                {(["A", "B", "C", "D"] as const).map(group => <div key={group} data-class-group={group} className="bg-[#0d1a0f] p-3 text-center"><p className="font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">{classCounts[group] ?? 0}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-wider text-[#7a9a7a]">Turma {group}</p></div>)}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <HomeAboutCard icon={<MessageCircle size={17} />} label={aboutCopy.memories_label} className="sm:col-span-2"><HomeMemoriesCarousel memories={memories} emptyLabel={aboutCopy.memories_empty_title} description={aboutCopy.memories_description} /></HomeAboutCard>
              <HomeAboutCard icon={<Users size={17} />} label={aboutCopy.profile_label} className="sm:col-span-2"><HomeProfileMetrics configs={profileConfigs} people={visiblePeople} stats={profileStats} /></HomeAboutCard>
              <HomeAboutCard icon={<CheckCircle2 size={17} />} label={aboutCopy.polls_label}><HomePollCard poll={poll} results={pollResults} votes={pollVotes} auth={auth} fallback={pollFallback} busy={pollBusy} error={pollError} onVote={submitHomePollVote} /></HomeAboutCard>
              <HomeAboutCard icon={<MapPin size={17} />} label={aboutCopy.map_label}><HomeMapChart configs={mapConfigs} locations={locations} /></HomeAboutCard>
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


function extractIframeSrc(value?: string | null) {
  const raw = value?.trim();
  if (!raw) return null;
  const match = raw.match(/src=["']([^"']+)["']/i);
  return match?.[1] ?? raw;
}

function EventPage({ navigate, event }: { navigate: (p: Page) => void; event: DbEvent | null }) {
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
  const publicTickets = ticketTypes
    .filter(isTicketVisibleOnHome)
    .slice(0, parsePositiveInteger(extendedContent.tickets_preview_limit, 3));

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
            {publicTickets.map(ticket => {
              const availability = getTicketAvailability(ticket);
              const visualStatus = getTicketVisualStatus(ticket);
              const disabled = visualStatus === "sold-out";
              const descriptionItems = getTicketDescriptionItems(ticket.description);

              return (
                <div key={ticket.id} className={"bg-[#141f14] border p-8 flex flex-col gap-4 transition-colors " + (disabled ? "border-[#c0392b]/20 opacity-60" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60")}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{extendedContent.tickets_active_lot_label}</p>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mt-1">{ticket.name}</p>
                    </div>
                    <StatusBadge status={visualStatus} />
                  </div>

                  <div className="border-t border-[#2d6a4f]/20 pt-4">
                    <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">{formatCurrencyBR(ticket.price_cents)}</p>
                    {ticket.available_quantity > 0 && (
                      <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{applyTextTemplate(extendedContent.tickets_remaining_label_template, { available: availability, total: ticket.available_quantity })}</p>
                    )}
                  </div>

                  <ul className="flex flex-col gap-2">
                    {descriptionItems.map(item => (
                      <li key={item} className="flex items-start gap-2 text-[#7a9a7a] text-xs">
                        <Check size={12} className="text-[#2d6a4f] mt-0.5 shrink-0" />{item}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-auto">
                    <Btn
                      full
                      disabled={disabled}
                      onClick={() => { onSelectTicket(ticket.id); navigate("checkout"); }}
                      variant={visualStatus === "last-units" ? "gold" : "primary"}
                    >
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
  const [open, setOpen] = useState<number | null>(null);
  const extendedContent = getExtendedHomeContent(content);
  const faqItems = parseHomeJsonArray<FAQItemContent>(extendedContent.faq_items_json, [])
    .filter(item => item.is_visible !== false);

  return (
    <section className="home-section bg-[#0d1a0f]">
      <div className="max-w-3xl mx-auto px-4">
        <SectionLabel>{content.faq_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-12">{content.faq_title}</DisplayTitle>
        <div className="flex flex-col gap-2">
          {faqItems.map((item, i) => (
            <div key={`${item.q}-${i}`} className="border border-[#2d6a4f]/25 bg-[#141f14]">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
                <p className="text-[#f0ebe0] font-semibold text-sm">{item.q}</p>
                <ChevronDown size={16} className={"text-[#c9a84c] shrink-0 transition-transform duration-200 " + (open === i ? "rotate-180" : "")} />
              </button>
              {open === i && (
                <div className="px-6 pb-5 border-t border-[#2d6a4f]/20">
                  <p className="text-[#7a9a7a] text-sm leading-relaxed pt-4">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LandingPage({
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
    hero: <Hero navigate={navigate} content={content} event={event} />,
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


function TicketsPage({ navigate, ticketTypes: liveTypes, onSelectTicket }: { navigate: (p: Page) => void; ticketTypes: DbTicketType[]; onSelectTicket: (id: string) => void }) {
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
            <div key={t.id}
              className={`border bg-[#141f14] p-6 md:p-8 ${t.status === "sold-out" ? "border-[#c0392b]/20 opacity-60" : t.status === "last-units" ? "border-[#c9a84c]/50" : "border-[#2d6a4f]/30"}`}>
              {t.status === "last-units" && (
                <div className="bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 inline-block mb-4">
                  âš¡ Últimas {t.available} unidades
                </div>
              )}
              <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-8">
                <div className="flex-1">
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">{t.lot}</p>
                  <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-2xl md:text-3xl mb-3">{t.type}</p>
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
                  <div className="text-right">
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

type CheckoutReturnState = { status: PaymentStatus | "cancelled"; orderId: string } | null;

function CheckoutPage({ navigate, auth, ticketTypes, selectedTicketTypeId, checkoutReturn }: {
  navigate: (p: Page) => void;
  auth: AuthState;
  ticketTypes: DbTicketType[];
  selectedTicketTypeId: string | null;
  checkoutReturn: CheckoutReturnState;
}) {
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({ name: auth.name || "", email: auth.email || "", phone: "" });
  const [guestCount, setGuestCount] = useState(0);
  const [payment, setPayment]     = useState("pix");
  const [loading, setLoading]     = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<PaymentStatus | "cancelled" | null>(checkoutReturn?.status ?? null);
  const [checkoutOrder, setCheckoutOrder] = useState<(DbOrder & { ticket_types?: Partial<DbTicketType> | null; tickets?: { id: string; qr_code: string }[] }) | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<"approved" | "declined" | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  function formatCheckoutWhatsapp(value?: string | null) {
    let digits = String(value ?? "").replace(/\D/g, "");
    if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
    digits = digits.slice(0, 11);
    if (!digits) return "";
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  useEffect(() => {
    if (!auth.loggedIn || !auth.userId) return;
    let cancelled = false;
    getMyProfile(auth.userId)
      .then(profile => {
        if (cancelled || !profile) return;
        setForm(current => ({
          name: current.name || profile.display_name || profile.people?.full_name || auth.name || "",
          email: current.email || profile.contact_email || auth.email || "",
          phone: current.phone || formatCheckoutWhatsapp(profile.contact_whatsapp || (profile.people as any)?.contact_whatsapp || ""),
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auth.loggedIn, auth.userId, auth.name, auth.email]);

  const steps = ["Seus dados", "Pagamento", "Processando"];
  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketTypeId)
    ?? ticketTypes.find(t => t.status === "open")
    ?? null;
  const fallbackTicket = TICKETS.find(t => t.id === selectedTicketTypeId) ?? TICKETS[0];
  const ticketName = selectedTicket?.name ?? fallbackTicket.type;
  const ticketPriceCents = selectedTicket?.price_cents ?? fallbackTicket.price * 100;
  const quantity = Math.max(1, 1 + guestCount);
  const totalCents = ticketPriceCents * quantity;
  const selectedId = selectedTicket?.id ?? selectedTicketTypeId ?? fallbackTicket.id;

  useEffect(() => {
    if (!checkoutReturn?.orderId) return;
    setStep(3);
    setLoading(true);
    setCheckoutStatus(checkoutReturn.status);
    getCheckoutOrder(checkoutReturn.orderId)
      .then(order => {
        setCheckoutOrder(order);
        setCheckoutStatus(order.payment_status);
      })
      .catch(() => setCheckoutError("Não foi possível carregar o status do pedido."))
      .finally(() => setLoading(false));
  }, [checkoutReturn]);

  async function startPayment() {
    setCheckoutError(null);
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setCheckoutError("Preencha nome, e-mail e WhatsApp antes de continuar.");
      return;
    }
    if (!selectedId) {
      setCheckoutError("Selecione um ingresso para continuar.");
      return;
    }

    setLoading(true);
    setStep(3);
    try {
      const order = await createCheckoutOrder({
        ticket_type_id: selectedId,
        buyer_name: form.name.trim(),
        buyer_email: form.email.trim().toLowerCase(),
        buyer_phone: form.phone.trim(),
        quantity,
      });
      setCheckoutOrder(order);
      setCheckoutStatus(order.payment_status);
      const preference = await createPaymentPreference(order.id);
      window.location.assign(preference.init_point || preference.sandbox_init_point || `/?checkout=pending&order=${order.id}`);
    } catch (error) {
      setLoading(false);
      setCheckoutError(error instanceof Error ? error.message : "Não foi possível iniciar o pagamento.");
    }
  }

  const currentStatus = checkoutStatus ?? "pending";
  const statusCopy: Record<string, { title: string; body: string; tone: string; icon: React.ReactNode }> = {
    pending: {
      title: "Pagamento pendente",
      body: "Seu pedido foi criado. Conclua o pagamento no Mercado Pago ou aguarde a confirmação.",
      tone: "bg-[#1a1a0a] border-[#c9a84c]/40",
      icon: <Clock size={32} className="text-[#c9a84c]" />,
    },
    in_process: {
      title: "Pagamento em análise",
      body: "O Mercado Pago recebeu o pagamento e está processando a confirmação.",
      tone: "bg-[#1a1a0a] border-[#c9a84c]/40",
      icon: <RefreshCw size={32} className="text-[#c9a84c]" />,
    },
    approved: {
      title: "Pagamento aprovado!",
      body: "Seu ingresso foi liberado. O QR Code será enviado por e-mail e também fica disponível na área do aluno.",
      tone: "bg-[#0d2e1a] border-[#2d6a4f]",
      icon: <CheckCircle size={32} className="text-[#f0ebe0]" />,
    },
    rejected: {
      title: "Pagamento recusado",
      body: "O Mercado Pago não conseguiu aprovar o pagamento. Seu ingresso não foi confirmado.",
      tone: "bg-[#2e0a0a] border-[#c0392b]/60",
      icon: <XCircle size={32} className="text-[#f0ebe0]" />,
    },
    expired: {
      title: "Pedido expirado",
      body: "A janela de pagamento expirou. Inicie uma nova compra para reservar seu ingresso.",
      tone: "bg-[#1e2a1e] border-[#2d6a4f]/30",
      icon: <AlertTriangle size={32} className="text-[#c9a84c]" />,
    },
    cancelled: {
      title: "Pagamento cancelado",
      body: "O pagamento foi cancelado. Você pode voltar e tentar novamente.",
      tone: "bg-[#2e0a0a] border-[#c0392b]/60",
      icon: <XCircle size={32} className="text-[#f0ebe0]" />,
    },
    refunded: {
      title: "Pagamento reembolsado",
      body: "Este pedido foi marcado como reembolsado.",
      tone: "bg-[#1e2a1e] border-[#2d6a4f]/30",
      icon: <Info size={32} className="text-[#7a9a7a]" />,
    },
    charged_back: {
      title: "Pagamento contestado",
      body: "Este pagamento foi contestado e o ingresso não deve ser usado até revisão da organização.",
      tone: "bg-[#2e0a0a] border-[#c0392b]/60",
      icon: <AlertTriangle size={32} className="text-[#e74c3c]" />,
    },
  };
  const statusInfo = statusCopy[currentStatus] ?? statusCopy.pending;

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => step > 1 ? setStep(s => s - 1) : navigate("tickets")}
          className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Steps indicator */}
        <div className="flex items-center gap-3 mb-10">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-3">
              <div className={`flex items-center gap-2 ${i + 1 <= step ? "text-[#f0ebe0]" : "text-[#3a5a3a]"}`}>
                <div className={`w-7 h-7 flex items-center justify-center font-mono font-bold text-xs ${i + 1 < step ? "bg-[#2d6a4f] text-[#f0ebe0]" : i + 1 === step ? "border-2 border-[#c9a84c] text-[#c9a84c]" : "border border-[#2d6a4f]/30 text-[#3a5a3a]"}`}>
                  {i + 1 < step ? <Check size={12} /> : i + 1}
                </div>
                <span className="text-xs font-mono uppercase tracking-wider hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && <div className="h-px bg-[#2d6a4f]/25 w-8" />}
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#7a9a7a] text-sm">{ticketName} × {quantity}</span>
            <span className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-lg">
              {(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </span>
          </div>
          <p className="text-[#3a5a3a] text-xs font-mono">17 Out 2026 · Espaço Cultural Ponta Negra, Natal/RN</p>
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-6">
            <DisplayTitle className="text-2xl">Seus dados</DisplayTitle>
            <Field label="Nome completo" placeholder="Como no documento" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} icon={<User size={16} />} />
            <Field label="E-mail" type="email" placeholder="seu@email.com" value={form.email} onChange={v => setForm(f => ({ ...f, email: v }))} icon={<Mail size={16} />} />
            <Field label="WhatsApp" type="tel" placeholder="(84) 9 9999-0000" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} icon={<Phone size={16} />} />
            <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-5">
              <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Convidados</label>
              <p className="text-[#7a9a7a] text-xs mb-4">Informe quantas pessoas irão com você. O pedido será calculado como você + convidados.</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setGuestCount(count => Math.max(0, count - 1))} className="w-12 h-12 border border-[#2d6a4f]/40 text-[#f0ebe0] text-xl hover:bg-[#1a2e1a] transition-colors">−</button>
                <input
                  type="number"
                  min="0"
                  value={guestCount}
                  onChange={event => setGuestCount(Math.max(0, Number.parseInt(event.target.value || "0", 10) || 0))}
                  className="w-24 bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] text-center py-3 px-3 text-lg font-mono focus:outline-none focus:border-[#2d6a4f]"
                />
                <button type="button" onClick={() => setGuestCount(count => count + 1)} className="w-12 h-12 border border-[#2d6a4f]/40 text-[#f0ebe0] text-xl hover:bg-[#1a2e1a] transition-colors">+</button>
              </div>
              <p className="text-[#c9a84c] text-xs font-mono mt-4 uppercase tracking-wider">Total: {quantity} {quantity === 1 ? "participante" : "participantes"}</p>
            </div>
            {/* Terms acceptance */}
            <label className="flex items-start gap-3 cursor-pointer p-4 bg-[#0a120a] border border-[#2d6a4f]/20">
              <div onClick={() => setAcceptTerms(!acceptTerms)}
                className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 mt-0.5 cursor-pointer transition-colors ${acceptTerms ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-[#3a5a3a]"}`}>
                {acceptTerms && <Check size={12} className="text-[#f0ebe0]" />}
              </div>
              <p className="text-[#7a9a7a] text-xs leading-relaxed">
                Li e aceito os <button onClick={() => navigate("terms")} className="text-[#2d6a4f] underline">Termos de Uso</button> e a <button onClick={() => navigate("privacy")} className="text-[#2d6a4f] underline">Política de Privacidade</button>. *
              </p>
            </label>
            <Btn full onClick={() => setStep(2)} disabled={!acceptTerms}>
              Continuar para pagamento <ArrowRight size={16} />
            </Btn>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-6">
            <DisplayTitle className="text-2xl">Forma de pagamento</DisplayTitle>
            <div className="flex flex-col gap-3">
              {[{ id:"pix", label:"PIX", desc:"Aprovação imediata" }, { id:"credit", label:"Cartão de crédito", desc:"Até 6× sem juros" }, { id:"debit", label:"Cartão de débito", desc:"Aprovação imediata" }].map(m => (
                <label key={m.id} className={`flex items-center gap-4 p-4 border cursor-pointer transition-colors ${payment === m.id ? "border-[#2d6a4f] bg-[#1a2e1a]" : "border-[#2d6a4f]/20 hover:border-[#2d6a4f]/40"}`}>
                  <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${payment === m.id ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-[#3a5a3a]"}`}>
                    {payment === m.id && <Check size={12} className="text-[#f0ebe0]" />}
                  </div>
                  <input type="radio" className="sr-only" value={m.id} checked={payment === m.id} onChange={() => setPayment(m.id)} />
                  <div>
                    <p className="text-[#f0ebe0] font-semibold text-sm">{m.label}</p>
                    <p className="text-[#7a9a7a] text-xs">{m.desc}</p>
                  </div>
                  <CreditCard size={20} className="text-[#3a5a3a] ml-auto" />
                </label>
              ))}
            </div>
            <div className="bg-[#0a120a] p-5 border border-[#2d6a4f]/20">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-7 h-7 bg-[#2d6a4f] flex items-center justify-center"><Shield size={14} className="text-[#f0ebe0]" /></div>
                <p className="text-[#f0ebe0] font-semibold text-sm">Processado pelo Mercado Pago</p>
              </div>
              <p className="text-[#7a9a7a] text-xs">Você será redirecionado para concluir o pagamento com segurança.</p>
            </div>
            <div className="border-t border-[#2d6a4f]/20 pt-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#7a9a7a]">{ticketName} × {quantity}</span>
                <span className="text-[#f0ebe0]">{(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-[#f0ebe0]">Total</span>
                <span className="text-[#c9a84c] font-['Playfair_Display'] text-xl">{(totalCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
              </div>
            </div>
            {checkoutError && (
              <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{checkoutError}</p>
            )}
            <div className="flex flex-col gap-3">
              <Btn full onClick={startPayment} disabled={loading}>
                {loading ? <><RefreshCw size={16} className="animate-spin" />Criando pedido...</> : <><ArrowRight size={16} />Ir para Mercado Pago</>}
              </Btn>
            </div>
          </div>
        )}

        {/* Step 3 — processing / result */}
        {step === 3 && (
          <>
            {loading && (
              <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-12 flex flex-col gap-4 text-center">
                <RefreshCw size={48} className="text-[#2d6a4f] mx-auto animate-spin" />
                <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl">Processando pagamento...</p>
                <p className="text-[#7a9a7a] text-sm">Aguarde enquanto confirmamos com o Mercado Pago.</p>
              </div>
            )}

            {!loading && (checkoutStatus || checkoutOrder || checkoutError) && (
              <div className={`border p-8 flex flex-col gap-5 text-center ${statusInfo.tone}`}>
                <div className={`w-16 h-16 flex items-center justify-center mx-auto ${currentStatus === "approved" ? "bg-[#2d6a4f]" : currentStatus === "rejected" || currentStatus === "cancelled" ? "bg-[#c0392b]" : "bg-[#0a120a]"}`}>
                  {statusInfo.icon}
                </div>
                <DisplayTitle className="text-2xl">{statusInfo.title}</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">{statusInfo.body}</p>
                {checkoutOrder && (
                  <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                    <p className="text-[#7a9a7a] font-mono text-[10px] uppercase mb-1">Pedido</p>
                    <p className="text-[#c9a84c] font-['JetBrains_Mono'] font-bold text-sm tracking-wider break-all">{checkoutOrder.id}</p>
                    <div className="mt-3 flex items-center justify-center"><StatusBadge status={currentStatus} /></div>
                  </div>
                )}
                {checkoutOrder?.tickets && checkoutOrder.tickets.length > 0 && (
                  <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                    <p className="text-[#7a9a7a] font-mono text-[10px] uppercase mb-2">Ingressos liberados</p>
                    <div className="flex flex-col gap-1">
                      {checkoutOrder.tickets.map(ticket => (
                        <p key={ticket.id} className="text-[#f0ebe0] font-mono text-xs">{ticket.qr_code}</p>
                      ))}
                    </div>
                  </div>
                )}
                {checkoutError && (
                  <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{checkoutError}</p>
                )}
                <div className="flex flex-col gap-3">
                  {currentStatus === "approved" ? (
                    <Btn full onClick={() => navigate("my-ticket")}>Ver meu ingresso <ArrowRight size={16} /></Btn>
                  ) : (
                    <Btn full onClick={() => { setStep(2); setCheckoutError(null); setCheckoutStatus(null); }}>
                      <RefreshCw size={16} />Tentar novamente
                    </Btn>
                  )}
                  <Btn full variant="ghost" onClick={() => navigate("tickets")}>Voltar aos ingressos</Btn>
                </div>
              </div>
            )}

            {/* Approved */}
            {!loading && payResult === "approved" && (
              <div className="bg-[#0d2e1a] border border-[#2d6a4f] p-8 flex flex-col gap-5 text-center">
                <div className="w-16 h-16 bg-[#2d6a4f] flex items-center justify-center mx-auto">
                  <CheckCircle size={32} className="text-[#f0ebe0]" />
                </div>
                <DisplayTitle className="text-2xl">Pagamento aprovado!</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Seu ingresso foi confirmado. Verifique seu e-mail para o QR Code de entrada.</p>
                <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase mb-1">Código do pedido</p>
                  <p className="text-[#c9a84c] font-['JetBrains_Mono'] font-bold text-xl tracking-wider">{checkoutOrder?.id ?? "Pedido registrado"}</p>
                </div>
                <StatusBadge status="approved" />
                <Btn full onClick={() => navigate("confirmation")}>Ver meu ingresso <ArrowRight size={16} /></Btn>
              </div>
            )}

            {/* Declined */}
            {!loading && payResult === "declined" && (
              <div className="bg-[#2e0a0a] border border-[#c0392b]/60 p-8 flex flex-col gap-5">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#c0392b] flex items-center justify-center mx-auto mb-4">
                    <XCircle size={32} className="text-[#f0ebe0]" />
                  </div>
                  <DisplayTitle className="text-2xl">Pagamento recusado</DisplayTitle>
                  <p className="text-[#7a9a7a] text-sm mt-2">
                    O Mercado Pago não conseguiu processar seu pagamento.
                    <strong className="text-[#f0ebe0]"> Seu ingresso não foi confirmado.</strong>
                  </p>
                </div>
                <div className="bg-[#1a0505] border border-[#c0392b]/30 p-5">
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Motivo reportado</p>
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-[#e74c3c] shrink-0 mt-0.5" />
                    <p className="text-[#e74c3c] text-sm">Saldo insuficiente ou cartão bloqueado para compras online. Verifique com seu banco.</p>
                  </div>
                </div>
                <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4 text-center">
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase mb-1">Reserva expira em</p>
                  <p className="text-[#c9a84c] font-['JetBrains_Mono'] font-bold text-2xl">24:47</p>
                </div>
                <StatusBadge status="declined" />
                <div className="flex flex-col gap-3">
                  <Btn full onClick={() => { setStep(2); setPayResult(null); }}>
                    <RefreshCw size={16} />Tentar com outro método
                  </Btn>
                  <Btn full variant="outline" onClick={() => { setPayment("pix"); setStep(2); setPayResult(null); }}>
                    Tentar com PIX
                  </Btn>
                  <Btn full variant="ghost">
                    <Mail size={16} />Contato com a organização
                  </Btn>
                </div>
                <p className="text-[#3a5a3a] text-xs font-mono text-center">
                  Problema persistindo? turma2006.hc@gmail.com
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── CONFIRMATION ─────────────────────────────────────────────────────────────

function ConfirmationPage({ navigate }: { navigate: (p: Page) => void }) {
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

function WhoGoingPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
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

function TheClassPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
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

function ExAlumniPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
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
    { value: "all", label: "Todas as turmas" },
    { value: "A", label: "Turma A" },
    { value: "B", label: "Turma B" },
    { value: "C", label: "Turma C" },
    { value: "D", label: "Turma D" },
  ];

  const attendanceButtons: { value: AlumniAttendanceFilter; label: string; description: string }[] = [
    { value: "all", label: "Todos", description: "Todos os pré-cadastrados" },
    { value: "confirmed", label: "Confirmados", description: "Compraram o ingresso" },
    { value: "preconfirmed", label: "Pré-confirmados", description: "Pretendem ir para a festa" },
    { value: "registered", label: "Cadastrados", description: "Fizeram o cadastro no site" },
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

            <div className="flex gap-2 overflow-x-auto pb-1">
              {classButtons.map(button => (
                <button
                  key={button.value}
                  onClick={() => setClassFilter(button.value)}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${classFilter === button.value ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {attendanceButtons.map(button => (
                <button
                  key={button.value}
                  onClick={() => setAttendanceFilter(button.value)}
                  className={`text-left border px-4 py-3 transition-colors ${attendanceFilter === button.value ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  <span className="block text-xs font-mono uppercase tracking-wider font-bold">{button.label}</span>
                  <span className="block text-[11px] mt-1 opacity-80">{button.description}</span>
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

function ClaimProfilePage({ navigate, people, auth }: { navigate: (p: Page) => void; people: DbPerson[]; auth: AuthState }) {
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
    intendsToAttend: "" as "" | "yes" | "no",
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

function PhotoWallPage({ navigate, auth, photos, onSelectPhoto }: {
  navigate: (p: Page) => void; auth: AuthState; photos: DbPhoto[]; onSelectPhoto: (id: string) => void;
}) {
  const [filter, setFilter] = useState("all");
  const [selectedPersonFilters, setSelectedPersonFilters] = useState<string[]>([]);
  const [personDropdownOpen, setPersonDropdownOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [stats, setStats] = useState<Record<string, PhotoStats>>({});
  const [likedPhotoIds, setLikedPhotoIds] = useState<string[]>([]);
  const [busyLike, setBusyLike] = useState<string | null>(null);
  const [error, setError] = useState("");

  const availableYears = Array.from(new Set(photos.map(p => String(p.year_approx ?? "")).filter(Boolean))).sort();
  const years = ["all", ...availableYears];
  const taggedNames = Array.from(new Set(photos.flatMap(p => (((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? [])
    .filter(tag => !tag.status || tag.status === "approved")
    .map(tag => tag.tagged_name_snapshot)
    .filter(Boolean) as string[])))).sort();

  const filteredPhotos = photos.filter(p => {
    const matchesYear = filter === "all" || String(p.year_approx) === filter;
    const tags = ((p as DbPhoto & { photo_tags?: { tagged_name_snapshot?: string | null; status?: string | null }[] }).photo_tags ?? []);
    const approvedTagNames = tags
      .filter(tag => !tag.status || tag.status === "approved")
      .map(tag => tag.tagged_name_snapshot)
      .filter(Boolean) as string[];
    const matchesPerson = selectedPersonFilters.length === 0 || approvedTagNames.some(name => selectedPersonFilters.includes(name));
    return matchesYear && matchesPerson;
  });

  const featuredPhotos = photos.filter(p => p.is_featured).slice(0, 6);
  const popularPhotos = [...photos].sort((a, b) => (stats[b.id]?.likes_count ?? 0) - (stats[a.id]?.likes_count ?? 0)).slice(0, 6);

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

  return (
    <>
      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} auth={auth} navigate={navigate} />
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <SectionLabel>Nossa História</SectionLabel>
              <DisplayTitle className="text-5xl md:text-7xl">Fotos da Época</DisplayTitle>
              <p className="text-[#7a9a7a] mt-2 font-mono text-sm">{photos.length} fotos · curtidas e comentários moderados</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Btn variant="outline" onClick={() => navigate("memories")}><MessageCircle size={16} />Caixa de Memórias</Btn>
              <Btn onClick={() => setUploadOpen(true)}><Upload size={16} />Enviar foto antiga</Btn>
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
              <div className="flex gap-2 overflow-x-auto pb-1">
                {years.map(y => (
                  <button key={y} onClick={() => setFilter(y)}
                    className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${filter === y ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                    {y === "all" ? "Todos os anos" : y}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Filtrar por pessoa marcada</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => { setSelectedPersonFilters([]); setPersonDropdownOpen(false); }}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors whitespace-nowrap ${selectedPersonFilters.length === 0 ? "bg-[#c9a84c] text-[#0d1a0f] border-[#c9a84c]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}
                >
                  Todas as pessoas
                </button>

                <div className="relative">
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

function PhotoDetailPage({ navigate, people, auth, photo }: {
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

function CuriositiesPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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
  const childrenCountRows = profileStats?.children_count_distribution ?? [];
  const topLocations = locations.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <section className="mb-10 w-full text-left">
          <SectionLabel>Curiosidades da turma</SectionLabel>
          <DisplayTitle className="text-5xl md:text-7xl">O raio-X da Turma 2006</DisplayTitle>
          <p className="mt-4 max-w-[48rem] text-left leading-relaxed text-[#8ab89a]">
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
                <Btn variant="outline" onClick={() => navigate("claim-profile")}><UserCheck size={16} />Responder questionário</Btn>
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
              {childrenCountRows.length > 0 && (
                <div className="mt-5">
                  <MiniBarChart title="Quantidade de filhos declarada" rows={childrenCountRows} />
                </div>
              )}
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
              {topLocations.length === 0 ? (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
                  <EmptyState icon={<MapPin size={42} />} title="Mapa ainda sem dados públicos" subtitle="As cidades aparecerão conforme os ex-alunos autorizarem a exibição da localização." />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {topLocations.map(location => (
                    <div key={location.key} className="bg-[#141f14] border border-[#2d6a4f]/30 p-5">
                      <p className="text-[#f0ebe0] font-semibold text-lg">{location.city}</p>
                      <p className="text-[#7a9a7a] text-xs font-mono mt-1">{[location.state, location.country].filter(Boolean).join(" · ")}</p>
                      <p className="text-[#c9a84c] font-mono text-2xl font-bold mt-4">{location.count}</p>
                      <p className="text-[#3a5a3a] text-xs mt-2 truncate">{location.people.map(person => person.display_name || person.full_name).slice(0, 4).join(" · ")}</p>
                    </div>
                  ))}
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
                    return (
                      <div key={poll.id} className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Enquete</p>
                            <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-[#7a9a7a] text-sm mt-2">{poll.description}</p>}
                          </div>
                          <StatusBadge status={poll.status} />
                        </div>

                        <div className="flex flex-col gap-3">
                          {options.map(option => {
                            const count = results[poll.id]?.[option.id] ?? 0;
                            const percent = Math.round((count / total) * 100);
                            const voted = votedOptions.includes(option.id);
                            const disabled = poll.status !== "open" || busy === option.id;
                            return (
                              <button key={option.id} disabled={disabled} onClick={() => submitVote(poll, option.id)}
                                className={`text-left border p-4 transition-colors disabled:cursor-not-allowed ${voted ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#2d6a4f]/60"}`}>
                                <div className="flex items-center justify-between gap-3 mb-2">
                                  <span className="text-[#f0ebe0] text-sm font-semibold">{option.option_text}</span>
                                  <span className="text-[#7a9a7a] font-mono text-xs">{count} voto{count === 1 ? "" : "s"}</span>
                                </div>
                                <div className="h-2 bg-[#1a2e1a] overflow-hidden">
                                  <div className="h-full bg-[#2d6a4f]" style={{ width: `${percent}%` }} />
                                </div>
                                <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{percent}%</p>
                              </button>
                            );
                          })}
                        </div>

                        {!auth.loggedIn && poll.status === "open" && <p className="text-[#c9a84c] text-xs font-mono">Faça login para votar.</p>}
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

function WhereNowPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
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

function ShareInvitePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function MyTicketPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function ArchivePage({ navigate }: { navigate: (p: Page) => void; auth: AuthState; photos: DbPhoto[]; people: DbPerson[] }) {
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
          <SectionLabel>Pós-festa</SectionLabel>
          <DisplayTitle className="text-4xl md:text-7xl mb-4">Memórias do reencontro</DisplayTitle>
          {loading && <LoadingState message="Carregando acervo..." />}
          {error && <ErrorState message={error} />}

          {!loading && !archiveOpen && (
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 md:p-12">
              <div className="max-w-3xl">
                <StatusBadge status="closed" />
                <h2 className="text-[#f0ebe0] font-['Playfair_Display'] text-3xl md:text-5xl font-bold mt-5 mb-4">O acervo será aberto depois do reencontro.</h2>
                <p className="text-[#8ab89a] leading-relaxed mb-8">Depois do evento, esta página reunirá fotos oficiais, fotos enviadas pelos participantes, vídeo oficial, lista de presença respeitando privacidade e memórias aprovadas.</p>
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
                <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-3">Mensagem da organização</p>
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

function MemoriesPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function AlumniAreaPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function AlumniDashboardPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function EditProfilePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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
    <div className="overflow-x-auto">
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
    "/admin/content": ["header", "home", "event", "sections", "labels", "timeline", "faq", "footer"].includes(tab ?? "") ? "home-content" : tab === "comments" ? "photo-comments" : tab ?? "home-content",
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

type AdminNavigationGuard = (action: () => void) => void;

function AdminPage({ navigate, auth, onHomeContentUpdated, registerNavigationGuard }: {
  navigate: (p: Page) => void;
  auth: AuthState;
  onHomeContentUpdated: (content: HomePageContent) => void;
  registerNavigationGuard: (guard: AdminNavigationGuard | null) => void;
}) {
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
  const [contentTab, setContentTab] = useState<ContentAdminTab>(() => adminContentTabFromPathname());
  const persistedHomeDraftRef = useRef<ExtendedHomePageContent>(getExtendedHomeContent(HOME_PAGE_CONTENT_DEFAULTS));
  const persistedEventDraftRef = useRef<EventPageContent>(EVENT_PAGE_CONTENT_DEFAULTS);
  const pendingNavigationRef = useRef<(() => void) | null>(null);
  const [leaveConfirmationOpen, setLeaveConfirmationOpen] = useState(false);

  const hasUnsavedChanges = !loading && tab === "home-content" && (
    contentTab === "event"
      ? JSON.stringify(eventDraft) !== JSON.stringify(persistedEventDraftRef.current)
      : JSON.stringify(homeDraft) !== JSON.stringify(persistedHomeDraftRef.current)
  );

  const discardCurrentPageChanges = useCallback(() => {
    if (contentTab === "event") {
      setEventDraft(persistedEventDraftRef.current);
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
    { id: "dashboard", label: "Dashboard", icon: <BarChart3 size={14} />, tabs: [{ id: "dashboard", label: "Visão geral", icon: <BarChart3 size={13} /> }] },
    { id: "content", label: "Conteúdo", icon: <Pencil size={14} />, tabs: [
      { id: "header", label: "Header", icon: <Menu size={13} /> }, { id: "home-content", label: "Home", icon: <Pencil size={13} /> },
      { id: "event-content", label: "Evento", icon: <Ticket size={13} /> }, { id: "sections", label: "Seções", icon: <Package size={13} /> },
      { id: "labels", label: "Labels", icon: <FileText size={13} /> },
      { id: "timeline", label: "Timeline", icon: <Clock size={13} /> }, { id: "faq", label: "FAQ", icon: <Info size={13} /> },
      { id: "footer", label: "Rodapé", icon: <FileText size={13} /> }, { id: "memories", label: "Memórias", icon: <Star size={13} /> },
      { id: "polls", label: "Enquetes", icon: <BarChart3 size={13} /> }, { id: "photos", label: "Fotos", icon: <Camera size={13} /> },
      { id: "photo-comments", label: "Comentários", icon: <MessageCircle size={13} /> }, { id: "assets", label: "Assets", icon: <Package size={13} /> },
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
    { id: "reports", label: "Relatórios", icon: <Download size={14} />, tabs: [{ id: "reports", label: "Relatórios", icon: <Download size={13} /> }] },
    { id: "settings", label: "Administração", icon: <Settings size={14} />, tabs: [
      { id: "admins", label: "Administradores", icon: <Key size={13} /> }, { id: "audit", label: "Auditoria", icon: <FileText size={13} /> },
      { id: "settings", label: "Configurações", icon: <Settings size={13} /> },
    ] },
  ];

  function performSelectAdminTab(nextTab: string) {
    if (nextTab === "checkin") {
      navigate("checkin");
      return;
    }
    if (["header", "event-content", "sections", "labels", "timeline", "faq", "footer"].includes(nextTab)) {
      setContentTab(nextTab === "event-content" ? "event" : nextTab as ContentAdminTab);
      setTab("home-content");
    } else {
      setTab(nextTab);
    }
    updateAdminBrowserPath(nextTab);
  }

  function selectAdminTab(nextTab: string) {
    const nextSelectedSubtab = nextTab === "event-content" ? "event" : nextTab === "home-content" ? "home" : nextTab;
    if (nextSelectedSubtab === selectedSubtab) return;
    requestNavigation(() => performSelectAdminTab(nextTab));
  }

  const selectedSubtab = tab === "home-content" ? contentTab : tab;

  async function loadAdminData() {
    setLoading(true);
    try {
      const [eventData, lotData, orderData, peopleData, photoData, tagData, commentData, memoryData, pollData, claimData, removalData, disputeData, adminData, auditData] = await Promise.all([
        getEventSettings(),
        getTicketTypesAdmin(),
        getOrdersByStatus(),
        getPeople(),
        getPendingPhotos(),
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
        const homeData = getExtendedHomeContent(await getHomePageContent(DEFAULT_EVENT_ID));
        const eventPageData = await getEventPageContent(DEFAULT_EVENT_ID);
        persistedHomeDraftRef.current = homeData;
        persistedEventDraftRef.current = eventPageData;
        setHomeDraft(homeData);
        setEventDraft(eventPageData);
        onHomeContentUpdated(homeData);
        setReports(await getReports(eventData.id));
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar dados do admin.", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdminData(); }, [tagFilter, commentFilter, memoryFilter]);

  async function runAction(label: string, action: () => Promise<void>): Promise<boolean> {
    setBusy(label);
    try {
      await action();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await loadAdminData();
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
      const updated = getExtendedHomeContent(await updateHomePageContent(DEFAULT_EVENT_ID, {
        ...homeDraft,
        event_id: DEFAULT_EVENT_ID,
      } as Partial<HomePageContent>, auth.userId));
      persistedHomeDraftRef.current = updated;
      setHomeDraft(updated);
      onHomeContentUpdated(updated);
    });
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


  const timelineDraftItems = parseHomeJsonArray<NostalgiaTimelineItemContent>(homeDraft.home_nostalgia_timeline_json, []).map(item => ({
    ...item,
    year: item.year ?? "",
    title: item.title ?? item.label ?? "",
    description: item.description ?? item.desc ?? "",
  }));
  const faqDraftItems = parseHomeJsonArray<FAQItemContent>(homeDraft.faq_items_json, []);
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
    const normalizedItems = items.map(item => ({
      year: item.year ?? "",
      title: item.title ?? item.label ?? "",
      description: item.description ?? item.desc ?? "",
      ...(item.icon ? { icon: item.icon } : {}),
      is_visible: item.is_visible !== false,
    }));
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

  function setFaqDraftItems(items: FAQItemContent[]) {
    setHomeDraft(s => ({ ...s, faq_items_json: JSON.stringify(items, null, 2) }));
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
    <div className="min-h-screen bg-[#080f08]">
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
      <div className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Painel Admin</p>
          </div>
        </div>
        <nav className="flex flex-wrap justify-end gap-1.5">
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
      </div>

      {adminGroups.find(group => group.tabs.some(item => item.id === tab)) && (
        <div className="flex flex-wrap gap-1 border-b border-[#2d6a4f]/20 px-4 py-2 bg-[#0a120a]">
          {adminGroups.find(group => group.tabs.some(item => item.id === tab))?.tabs.map(item => (
            <button key={item.id} disabled={item.disabled} onClick={() => !item.disabled && selectAdminTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono uppercase tracking-wider transition-colors disabled:opacity-30 ${selectedSubtab === (item.id === "event-content" ? "event" : item.id) ? "bg-[#2d6a4f] text-[#f0ebe0]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
                    <Field label="Imagem principal" value={eventDraft.hero_image_url ?? ""} onChange={v => setEventDraft(s => ({ ...s, hero_image_url: v }))} placeholder="https://..." />
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
                        <Field label="URL da imagem" value={item.image_url} onChange={v => setEventGalleryItems(updateEventGalleryItem(eventGalleryItems, i, { image_url: v }))} />
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
              <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                  <div>
                    <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">FAQ</p>
                    <p className="text-[#3a5a3a] text-xs mt-1">Gerencie perguntas frequentes, respostas e visibilidade.</p>
                  </div>
                  <div className="flex gap-2">
                    <Btn size="sm" variant="ghost" onClick={() => setFaqDraftItems([...faqDraftItems, { q: "Nova pergunta", a: "Nova resposta.", is_visible: true }])}>Adicionar pergunta</Btn>
                    <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar FAQ</Btn>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Field label="Eyebrow FAQ" value={homeDraft.faq_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, faq_eyebrow: v }))} />
                  <Field label="Título FAQ" value={homeDraft.faq_title} onChange={v => setHomeDraft(s => ({ ...s, faq_title: v }))} />
                </div>

                <div className="flex flex-col gap-4">
                  {faqDraftItems.map((item, i) => (
                    <div key={`${item.q}-${i}`} className="bg-[#0a120a] border border-[#2d6a4f]/25 p-4">
                      <div className="flex flex-col gap-4 mb-4">
                        <Field label="Pergunta" value={item.q} onChange={v => setFaqDraftItems(updateFaqItem(faqDraftItems, i, { q: v }))} />
                        <FieldArea rows={3} label="Resposta" value={item.a} onChange={v => setFaqDraftItems(updateFaqItem(faqDraftItems, i, { a: v }))} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Btn size="sm" variant={item.is_visible === false ? "ghost" : "gold"} onClick={() => setFaqDraftItems(updateFaqItem(faqDraftItems, i, { is_visible: item.is_visible === false ? true : false }))}>
                          {item.is_visible === false ? "Oculta" : "Visível"}
                        </Btn>
                        <Btn size="sm" variant="danger" onClick={() => setFaqDraftItems(faqDraftItems.filter((_, itemIndex) => itemIndex !== i))}>
                          <X size={12} />Remover
                        </Btn>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
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
          <div className="overflow-x-auto">
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
            <div className="overflow-x-auto">
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
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-6">{pendingPhotos.length} fotos aguardando revisao</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {pendingPhotos.length === 0 && <EmptyState title="Nenhuma foto pendente" />}
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
                  {val}
                </button>
              ))}
            </div>
            {tags.length === 0 ? <EmptyState title="Nenhuma marcacao encontrada" /> : (
              <div className="overflow-x-auto">
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
            <div className="flex flex-wrap gap-2 mb-2">
              {(["pending","approved","rejected","hidden","all"] as const).map(val => (
                <button key={val} onClick={() => setCommentFilter(val)}
                  className={"px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors " + (commentFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60")}>
                  {val}
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
            <div className="flex flex-wrap gap-2 mb-2">
              {(["pending","approved","rejected","hidden","all"] as const).map(val => (
                <button key={val} onClick={() => setMemoryFilter(val)}
                  className={"px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors " + (memoryFilter === val ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60")}>
                  {val}
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
                    {(["draft","open","closed","archived"] as PollStatus[]).map(status => <option key={status} value={status}>{status}</option>)}
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
          <div className="overflow-x-auto">
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

function CheckinPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
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

function TermsPage({ navigate }: { navigate: (p: Page) => void }) {
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

function PrivacyPage({ navigate }: { navigate: (p: Page) => void }) {
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

const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile", "my-ticket", "checkout"];
const PROTECTED_ADMIN:  Page[] = ["admin", "checkin"];

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  event: "/evento",
  tickets: "/ingressos",
  checkout: "/checkout",
  confirmation: "/confirmacao",
  "who-going": "/quem-vai",
  "the-class": "/turma",
  "ex-alumni": "/ex-alunos",
  "claim-profile": "/reivindicar-perfil",
  "photo-wall": "/nossa-historia",
  "photo-detail": "/foto",
  memories: "/nossa-historia/memorias",
  curiosities: "/curiosidades",
  polls: "/curiosidades",
  "where-now": "/mapa",
  "share-invite": "/convite",
  "my-ticket": "/meu-ingresso",
  archive: "/pos-festa",
  "alumni-area": "/minha-area",
  "edit-profile": "/editar-perfil",
  admin: "/admin",
  checkin: "/checkin",
  login: "/login",
  terms: "/termos",
  privacy: "/privacidade",
};

function pageFromPathname(pathname: string): Page {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  const legacyRoutes: Record<string, Page> = {
    "/fotos": "photo-wall",
    "/memorias": "memories",
    "/acervo": "archive",
    "/enquetes": "curiosities",
  };
  if (legacyRoutes[normalized]) return legacyRoutes[normalized];
  if (normalized.startsWith("/admin/")) return "admin";
  const found = (Object.entries(PAGE_PATHS) as [Page, string][]).find(([, path]) => path === normalized);
  return found?.[0] ?? "home";
}

function updateBrowserPath(nextPage: Page) {
  if (typeof window === "undefined") return;
  const nextPath = PAGE_PATHS[nextPage] ?? "/";
  if (window.location.pathname !== nextPath) {
    window.history.pushState({}, "", nextPath);
    window.dispatchEvent(new Event("pushstate"));
  }
}

function inferFaviconType(url: string) {
  const cleanUrl = url.split("?")[0]?.toLowerCase() ?? "";
  if (cleanUrl.endsWith(".svg")) return "image/svg+xml";
  if (cleanUrl.endsWith(".ico")) return "image/x-icon";
  if (cleanUrl.endsWith(".webp")) return "image/webp";
  if (cleanUrl.endsWith(".jpg") || cleanUrl.endsWith(".jpeg")) return "image/jpeg";
  return "image/png";
}

function applyDocumentFavicon(url?: string | null) {
  if (typeof document === "undefined") return;

  const faviconUrl = url?.trim();
  const managedLink = document.querySelector<HTMLLinkElement>('link[data-managed-favicon="true"]');

  if (!faviconUrl) {
    managedLink?.remove();
    return;
  }

  const link = managedLink ?? document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement("link");
  link.rel = "icon";
  link.type = inferFaviconType(faviconUrl);
  link.href = faviconUrl;
  link.dataset.managedFavicon = "true";

  if (!link.parentNode) document.head.appendChild(link);
}

export default function App() {
  const initialPage = pageFromPathname(window.location.pathname);
  const [page, setPage]               = useState<Page>(initialPage);
  const [returnPage, setReturnPage]   = useState<Page>(initialPage);
  const [auth, setAuth]               = useState<AuthState>({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
  const [people, setPeople]           = useState<DbPerson[]>(MOCK_PEOPLE);
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([]);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<CheckoutReturnState>(null);
  const [approvedPhotos, setApprovedPhotos] = useState<DbPhoto[]>([]);
  const [approvedMemories, setApprovedMemories] = useState<DbMemory[]>([]);
  const [attendanceIntentPersonIds, setAttendanceIntentPersonIds] = useState<Set<string>>(() => new Set());
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [homeContent, setHomeContent] = useState<HomePageContent | null>(null);
  const [homeContentLoaded, setHomeContentLoaded] = useState(false);
  const [homeContentError, setHomeContentError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const homeContentRequestRef = useRef(0);
  const pageRef = useRef<Page>(initialPage);
  const currentBrowserUrlRef = useRef(`${window.location.pathname}${window.location.search}`);
  const navigationGuardRef = useRef<AdminNavigationGuard | null>(null);
  const allowNextPopstateRef = useRef(false);
  pageRef.current = page;

  const registerAdminNavigationGuard = useCallback((guard: AdminNavigationGuard | null) => {
    navigationGuardRef.current = guard;
  }, []);

  useEffect(() => {
    applyDocumentFavicon(homeContent?.favicon_url ?? null);
  }, [homeContent?.favicon_url]);

  // ── Inicializa sessão Supabase e escuta mudanças ──────────────────────────
  useEffect(() => {
    let active = true;
    let authRequestId = 0;

    const setSignedOut = () => {
      authRequestId += 1;
      if (active) setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
    };

    const hydrateSession = async (session: Session | null) => {
      if (!session?.user) {
        setSignedOut();
        return;
      }

      const requestId = authRequestId + 1;
      authRequestId = requestId;
      const user = session.user;
      const adminUser = await getCurrentAdminUser(user.id).catch(() => null);
      if (!active || authRequestId !== requestId) return;

      const name = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Usuário";
      setAuth({
        loggedIn: true,
        isAdmin: Boolean(adminUser),
        name,
        userId: user.id,
        email: user.email,
        role: adminUser?.role ?? null,
      });
    };

    supabase.auth.getSession()
      .then(({ data: { session }, error }) => {
        if (error) throw error;
        return hydrateSession(session);
      })
      .catch(() => setSignedOut())
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      if (event === "SIGNED_OUT" || !session) {
        setSignedOut();
        return;
      }

      // Supabase pode bloquear chamadas feitas dentro do callback de auth.
      // O timer garante que a consulta de permissões rode depois que o callback terminar.
      window.setTimeout(() => {
        if (active) void hydrateSession(session);
      }, 0);
    });

    return () => {
      active = false;
      authRequestId += 1;
      subscription.unsubscribe();
    };
  }, []);

  // ── Carrega dados reais do Supabase com fallback para mock ────────────────
  function refreshPublicEventData() {
    getEventSettings().then(setEvent).catch(() => setEvent(null));
    getTicketTypes(DEFAULT_EVENT_ID).then(setTicketTypes).catch(() => setTicketTypes([]));
    const requestId = homeContentRequestRef.current + 1;
    homeContentRequestRef.current = requestId;
    setHomeContentLoaded(false);
    setHomeContentError(null);
    getHomePageContent(DEFAULT_EVENT_ID)
      .then(content => {
        if (homeContentRequestRef.current !== requestId) return;
        setHomeContent(content);
      })
      .catch(error => {
        if (homeContentRequestRef.current !== requestId) return;
        setHomeContent(null);
        setHomeContentError(error instanceof Error ? error.message : "Não foi possível carregar o conteúdo da Home.");
      })
      .finally(() => {
        if (homeContentRequestRef.current === requestId) setHomeContentLoaded(true);
      });
    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => setApprovedMemories([]));
    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));
  }

  useEffect(() => {
    getPeople().then(setPeople).catch(() => DEV_MODE && setPeople(MOCK_PEOPLE));
    getApprovedPhotos(DEFAULT_EVENT_ID).then(setApprovedPhotos).catch(() => DEV_MODE && setApprovedPhotos([]));
    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => DEV_MODE && setApprovedMemories([]));
    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));
    refreshPublicEventData();
  }, []);

  useEffect(() => {
    const rememberBrowserUrl = () => {
      currentBrowserUrlRef.current = `${window.location.pathname}${window.location.search}`;
    };
    const onPopState = (event: PopStateEvent) => {
      if (allowNextPopstateRef.current) {
        allowNextPopstateRef.current = false;
        rememberBrowserUrl();
        setPage(pageFromPathname(window.location.pathname));
        return;
      }

      const navigationGuard = pageRef.current === "admin" ? navigationGuardRef.current : null;
      if (navigationGuard) {
        event.stopImmediatePropagation();
        window.history.pushState({}, "", currentBrowserUrlRef.current);
        navigationGuard(() => {
          allowNextPopstateRef.current = true;
          window.history.back();
        });
        return;
      }

      rememberBrowserUrl();
      setPage(pageFromPathname(window.location.pathname));
    };
    window.addEventListener("popstate", onPopState);
    window.addEventListener("pushstate", rememberBrowserUrl);
    return () => {
      window.removeEventListener("popstate", onPopState);
      window.removeEventListener("pushstate", rememberBrowserUrl);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("checkout");
    const orderId = params.get("order") ?? params.get("external_reference");
    const validStatuses = ["pending", "in_process", "approved", "rejected", "expired", "cancelled", "refunded", "charged_back"];
    if (status && orderId && validStatuses.includes(status)) {
      setCheckoutReturn({ status: status as PaymentStatus | "cancelled", orderId });
      setPage("checkout");
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (PROTECTED_ADMIN.includes(page) && !auth.isAdmin) {
      setReturnPage(page);
      setPage("login");
      updateBrowserPath("login");
    }
    if (PROTECTED_ALUMNI.includes(page) && !auth.loggedIn) {
      setReturnPage(page);
      setPage("login");
      updateBrowserPath("login");
    }
  }, [authLoading, auth.isAdmin, auth.loggedIn, page]);

  function performNavigation(p: Page) {
    if (PROTECTED_ADMIN.includes(p)  && !auth.isAdmin)  { setReturnPage(p); setPage("login"); updateBrowserPath("login"); window.scrollTo(0, 0); return; }
    if (PROTECTED_ALUMNI.includes(p) && !auth.loggedIn) { setReturnPage(p); setPage("login"); updateBrowserPath("login"); window.scrollTo(0, 0); return; }
    if (p === "home") refreshPublicEventData();
    setPage(p);
    updateBrowserPath(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function navigate(p: Page) {
    const navigationGuard = page === "admin" ? navigationGuardRef.current : null;
    if (navigationGuard && p !== "admin") {
      navigationGuard(() => performNavigation(p));
      return;
    }
    performNavigation(p);
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Carregando...</p>
        </div>
      </div>
    );
  }

  if (page === "home" && !homeContentLoaded) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (page === "home" && (!homeContent || homeContentError)) {
    return (
      <div className="min-h-screen bg-[#0d1a0f] flex items-center justify-center px-6">
        <div className="max-w-md border border-[#2d6a4f]/30 bg-[#141f14] p-8 text-center">
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-[0.2em] mb-4">Conteúdo indisponível</p>
          <h1 className="font-['Playfair_Display'] text-[#f0ebe0] text-3xl font-bold leading-tight mb-4">Não foi possível carregar a Home</h1>
          <p className="text-[#7a9a7a] text-sm leading-relaxed mb-6">{homeContentError ?? "O Supabase não retornou conteúdo para a Home."}</p>
          <Btn onClick={refreshPublicEventData}><RefreshCw size={16} />Tentar novamente</Btn>
        </div>
      </div>
    );
  }

  function handleLogin(nextAuth: AuthState) {
    setAuth(nextAuth);
    const canUseReturnPage =
      returnPage !== "login" &&
      (!PROTECTED_ADMIN.includes(returnPage) || nextAuth.isAdmin) &&
      (!PROTECTED_ALUMNI.includes(returnPage) || nextAuth.loggedIn);
    const dest = canUseReturnPage ? returnPage : nextAuth.isAdmin ? "admin" : "alumni-area";
    setReturnPage("home");
    setPage(dest);
    updateBrowserPath(dest);
    window.scrollTo(0, 0);
  }

  async function logout() {
    const previousUserId = auth.userId;
    if (previousUserId) void writeAudit("logout", "auth", previousUserId, {}).catch(() => {});
    try {
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
      setReturnPage("home");
      setPage("home");
      updateBrowserPath("home");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  const isFullscreen = page === "admin" || page === "checkin";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {!isFullscreen && <Header page={page} navigate={navigate} auth={auth} logout={logout} content={homeContent ?? undefined} />}
      <main>
        {page === "home"          && <LandingPage      navigate={navigate} people={people} photos={approvedPhotos} memories={approvedMemories} attendanceIntentPersonIds={attendanceIntentPersonIds} content={homeContent as HomePageContent} event={event} ticketTypes={ticketTypes} auth={auth} onSelectTicket={(id) => { setSelectedTicketTypeId(id); setCheckoutReturn(null); }} />}
        {page === "event"         && <EventPage        navigate={navigate} event={event}                             />}
        {page === "tickets"       && <TicketsPage       navigate={navigate} ticketTypes={ticketTypes} onSelectTicket={(id) => { setSelectedTicketTypeId(id); setCheckoutReturn(null); }} />}
        {page === "checkout"      && <CheckoutPage      navigate={navigate} auth={auth} ticketTypes={ticketTypes} selectedTicketTypeId={selectedTicketTypeId} checkoutReturn={checkoutReturn} />}
        {page === "confirmation"  && <ConfirmationPage  navigate={navigate}                                        />}
        {page === "who-going"     && <WhoGoingPage      navigate={navigate} people={people}                       />}
        {page === "the-class"     && <TheClassPage      navigate={navigate} people={people}                       />}
        {page === "ex-alumni"     && <ExAlumniPage      navigate={navigate} people={people}                       />}
        {page === "claim-profile" && <ClaimProfilePage  navigate={navigate} people={people} auth={auth}           />}
        {page === "photo-wall"    && <PhotoWallPage      navigate={navigate} auth={auth} photos={approvedPhotos} onSelectPhoto={setSelectedPhotoId} />}
        {page === "photo-detail"  && <PhotoDetailPage    navigate={navigate} people={people} auth={auth} photo={approvedPhotos.find(p => p.id === selectedPhotoId) ?? approvedPhotos[0] ?? null} />}
        {page === "memories"      && <MemoriesPage       navigate={navigate} auth={auth}                              />}
        {(page === "curiosities" || page === "polls") && <CuriositiesPage    navigate={navigate} auth={auth}                              />}
        {page === "where-now"     && <WhereNowPage       navigate={navigate} people={people}                         />}
        {page === "share-invite"  && <ShareInvitePage    navigate={navigate} auth={auth}                           />}
        {page === "my-ticket"     && <MyTicketPage       navigate={navigate} auth={auth}                           />}
        {page === "archive"       && <ArchivePage        navigate={navigate} auth={auth} photos={approvedPhotos} people={people} />}
        {page === "alumni-area"   && <AlumniDashboardPage navigate={navigate} auth={auth}                         />}
        {page === "edit-profile"  && <EditProfilePage   navigate={navigate} auth={auth}                           />}
        {page === "admin"         && auth.isAdmin && <AdminPage navigate={navigate} auth={auth} onHomeContentUpdated={setHomeContent} registerNavigationGuard={registerAdminNavigationGuard} />}
        {page === "checkin"       && <CheckinPage        navigate={navigate} auth={auth}                           />}
        {page === "login"         && <LoginPage          navigate={navigate} onLogin={handleLogin}                 />}
        {page === "terms"         && <TermsPage          navigate={navigate}                                        />}
        {page === "privacy"       && <PrivacyPage        navigate={navigate}                                        />}
      </main>
      {!isFullscreen && <Footer navigate={navigate} content={homeContent ?? undefined} />}
    </div>
  );
}

