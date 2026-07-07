import { useState, useEffect } from "react";
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
  getPublicLocationStats, getMyTickets, getMyProfile, saveMyProfile, findTicketForCheckin, markTicketCheckedIn,
  createCheckoutOrder, createPaymentPreference, getCheckoutOrder,
  getEventArchiveSettings, uploadProfileAvatar, getHomePageContent, updateHomePageContent, HOME_PAGE_CONTENT_DEFAULTS, type HomePageContent,
} from "../lib/services";
import type {
  DbPerson, DbTicketType, DbEvent, DbAdminUser, DbAuditLog, DbPhoto, DbPhotoTag, DbOrder,
  DbProfileClaim, DbPhotoRemovalRequest, DbProfileClaimDispute, AdminRole, TicketStatus,
  DbPhotoComment, DbMemory, PhotoStats, ModerationStatus,
  DbPoll, DbPollOption, DbPollVote, LocationStat, PublicLocationRow, PollStatus, TicketWithDetails, DbProfile, PaymentStatus,
  DbEventArchiveSettings,
} from "../lib/database.types";
import {
  Menu, X, Search, CheckCircle, Clock, AlertCircle,
  MapPin, Calendar, Users, ArrowRight, ArrowLeft,
  Upload, Eye, EyeOff, QrCode, Check,
  ChevronDown, Instagram, Linkedin,
  Phone, Mail, User, BarChart3, Ticket, Shield,
  RefreshCw, CreditCard, Edit3, Download,
  Lock, Camera, Scan, LogOut,
  Hash, CheckCircle2, XCircle, AlertTriangle,
  Settings, Tag, FileText, Key, Save,
  UserCheck, UserX, ToggleRight, ToggleLeft,
  Info, Package, Pencil, Heart, MessageCircle, Star, Send
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type Page =
  | "home" | "tickets" | "checkout" | "confirmation"
  | "who-going" | "the-class" | "claim-profile"
  | "photo-wall" | "photo-detail" | "alumni-area"
  | "edit-profile" | "admin" | "checkin"
  | "login" | "terms" | "privacy" | "memories"
  | "polls" | "where-now" | "share-invite"
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

const EVENT_DATE = new Date("2026-10-17T19:00:00-03:00");
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

const CONFIRM_QUESTIONS = [
  { id: "q1", question: "Qual era o nome do(a) diretor(a) ou coordenador(a) do HC em 2006?",  options: ["Prof. Rosângela Araújo", "Prof. Hélio Menezes",  "Prof. Carla Nóbrega",    "Não me lembro"]              },
  { id: "q2", question: "Em qual rua ficava o Colégio Henrique Castriciano?",                  options: ["Rua Apodi",             "Av. Deodoro",           "Rua Jundiaí",            "Av. Hermes da Fonseca"]      },
  { id: "q3", question: "Como chamávamos informalmente o pátio principal?",                    options: ["O Quadradão",           "O Jardim",              "A Quadra",               "O Corredor"]                 },
];

// ─── UTILS ─────────────────────────────────────────────────────────────────────

function getTimeLeft() {
  const diff = EVENT_DATE.getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000)  / 60000),
    seconds: Math.floor((diff % 60000)    / 1000),
  };
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

// Mapeia DbPerson para Alumni, interface legada dos componentes visuais.
function personToAlumni(p: DbPerson): Alumni {
  return {
    id:         p.id,
    name:       p.full_name,
    nickname:   p.nickname_at_school ?? undefined,
    sala:       p.class_group ?? undefined,
    city:       undefined,
    profession: undefined,
    avatarUrl:  p.avatar_url ?? undefined,
    status:     p.profile_status as "unclaimed" | "claimed" | "confirmed",
  };
}

// ─── PRIMITIVES ────────────────────────────────────────────────────────────────

function Btn({ children, onClick, variant = "primary", size = "md", disabled = false, full = false, className = "" }: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg"; disabled?: boolean; full?: boolean; className?: string;
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
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.15em] transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}>
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    unclaimed:    { label: "Não reivindicado", color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    claimed:      { label: "Reivindicado",     color: "bg-[#1a3a2a] text-[#74c69d] border border-[#2d6a4f]/50"     },
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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c9a84c] tracking-[0.4em] text-[10px] font-mono font-bold uppercase mb-4">{children}</p>;
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
  const show = (message: string, type: ToastType = "info") => setToast({ message, type });
  const hide = () => setToast(null);
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
    <div className={`fixed top-20 right-4 z-[60] max-w-xs p-4 border flex items-center gap-3 shadow-2xl ${styles[toast.type]}`}>
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
  if (!person) return null;

  const avatarUrl = person.avatar_url ?? profile?.avatar_url ?? null;
  const displayName = profile?.display_name || person.full_name;
  const location = [profile?.current_city, profile?.current_state, profile?.current_country].filter(Boolean).join(" · ");

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
            {person.class_group && <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1a2e1a] text-[#7a9a7a] border border-[#2d6a4f]/30">Sala {person.class_group}</span>}
            <span className="inline-flex items-center px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider bg-[#1a2e1a] text-[#7a9a7a] border border-[#2d6a4f]/30">Turma {person.class_year}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Nome completo" value={person.full_name} />
            <InfoRow label="Apelido na escola" value={person.nickname_at_school} />
            <InfoRow label="Sala" value={person.class_group ? `Sala ${person.class_group}` : null} />
            <InfoRow label="Status do perfil" value={person.profile_status} />
            <InfoRow label="Localização atual" value={location || null} />
            <InfoRow label="Profissão" value={profile?.show_profession ? profile?.profession : null} />
          </div>

          {person.profile_status === "unclaimed" && onClaim && (
            <Btn onClick={onClaim}><UserCheck size={16} />Reivindicar perfil</Btn>
          )}
        </div>
      </div>
    </Modal>
  );
}

// Modal
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(8,15,8,0.88)" }}>
      <div className={`bg-[#141f14] border border-[#2d6a4f]/40 w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[92vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2d6a4f]/20 sticky top-0 bg-[#141f14] z-10">
          <p className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-lg">{title}</p>
          <button onClick={onClose} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
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

function Header({ page, navigate, auth, logout }: {
  page: Page; navigate: (p: Page) => void; auth: AuthState; logout: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinks: { label: string; page: Page }[] = [
    { label: "Quem Vai",                            page: "who-going"   },
    { label: "A Turma",                             page: "the-class"   },
    { label: "Fotos",                               page: "photo-wall"  },
    { label: "Memórias",                            page: "memories"    },
    { label: "Enquetes",                             page: "polls"       },
    { label: "Mapa",                                 page: "where-now"   },
    { label: "Acervo",                               page: "archive"     },
    { label: auth.loggedIn ? "Minha Área" : "Entrar", page: auth.loggedIn ? "alumni-area" : "login" },
  ];

  function go(p: Page) { navigate(p); setMenuOpen(false); }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#080f08]/95 backdrop-blur-md border-b border-[#2d6a4f]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go("home")} aria-label="Início — Turma 2006" className="flex items-center gap-3 shrink-0 text-left">
            <div className="relative h-10 w-10 rounded-full border border-[#c9a84c]/70 bg-[#0d1a0f] flex items-center justify-center shadow-[0_0_0_3px_rgba(201,168,76,0.08)]">
              <span className="font-['Playfair_Display'] text-[#c9a84c] text-lg font-black leading-none">HC</span>
              <span className="absolute -bottom-1 -right-1 bg-[#c9a84c] text-[#0d1a0f] font-mono text-[8px] font-black px-1 leading-4">20</span>
            </div>
            <div className="hidden lg:block">
              <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-sm leading-tight tracking-wide uppercase">Turma 2006</p>
              <p className="text-[#7a9a7a] font-mono text-[9px] uppercase tracking-[0.25em] leading-none mt-1">20 anos</p>
            </div>
          </button>
          <nav className="hidden md:flex items-center gap-4 xl:gap-5 min-w-0">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className={`text-[10px] xl:text-[11px] font-mono font-bold uppercase tracking-[0.16em] whitespace-nowrap leading-none transition-colors ${page === l.page ? "text-[#c9a84c]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3 shrink-0">
            <Btn size="sm" onClick={() => go("tickets")} className="hidden md:inline-flex whitespace-nowrap text-[10px]">Comprar ingresso</Btn>
            {auth.loggedIn && (
              <button onClick={logout} className="hidden md:flex text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors" title="Sair">
                <LogOut size={18} />
              </button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-[#f0ebe0] p-2">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-40 bg-[#080f08] flex flex-col pt-20 px-6 pb-8">
          <div className="flex flex-col gap-1">
            {[{ label: "Início", page: "home" as Page }, ...navLinks].map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className="text-left py-5 border-b border-[#2d6a4f]/20 text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold hover:text-[#c9a84c] transition-colors">
                {l.label}
              </button>
            ))}
          </div>
          <div className="mt-auto pt-8 flex flex-col gap-3">
            <Btn full onClick={() => go("tickets")}>Comprar Ingresso</Btn>
            {auth.loggedIn
              ? <Btn full variant="outline" onClick={() => { logout(); setMenuOpen(false); }}>Sair da conta</Btn>
              : <Btn full variant="outline" onClick={() => go("login")}>Entrar</Btn>}
          </div>
        </div>
      )}
    </>
  );
}

// ─── FOOTER ───────────────────────────────────────────────────────────────────

function Footer({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <footer className="bg-[#080f08] border-t border-[#2d6a4f]/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          <div>
            <p className="text-[#c9a84c] font-mono text-[10px] tracking-[0.4em] uppercase mb-2">Colégio Henrique Castriciano</p>
            <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-2xl uppercase mb-4">Turma 2006</p>
            <p className="text-[#7a9a7a] text-sm leading-relaxed">O reencontro dos ex-alunos, 20 anos depois de uma época que ficou para sempre.</p>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-4">Navegação</p>
            <div className="flex flex-col gap-3">
              {(["tickets","who-going","the-class","photo-wall","memories","polls","where-now","archive"] as Page[]).map(p => (
                <button key={p} onClick={() => navigate(p)} className="text-left text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors">
                  {{ tickets:"Ingressos", "who-going":"Quem Vai", "the-class":"A Turma", "photo-wall":"Mural de Fotos", memories:"Memórias", polls:"Enquetes", "where-now":"Onde a turma está", archive:"Acervo Digital" }[p]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-widest mb-4">Contato</p>
            <div className="flex flex-col gap-3 text-sm text-[#7a9a7a]">
              <p className="flex items-center gap-2"><Mail size={14} />turma2006.hc@gmail.com</p>
              <p className="flex items-center gap-2"><Phone size={14} />(84) 99999-0206</p>
              <p className="flex items-center gap-2"><MapPin size={14} />Natal, Rio Grande do Norte</p>
            </div>
          </div>
        </div>
        <div className="border-t border-[#2d6a4f]/20 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#3a5a3a] font-mono">© 2026 Turma 2006 — Colégio Henrique Castriciano.</p>
          <div className="flex items-center gap-6 text-xs font-mono">
            <button onClick={() => navigate("terms")}   className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">Termos de Uso</button>
            <button onClick={() => navigate("privacy")} className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">Privacidade</button>
            <button onClick={() => navigate("admin")}   className="text-[#3a5a3a] hover:text-[#7a9a7a] uppercase tracking-widest transition-colors">Admin</button>
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

      onLogin({
        loggedIn: true,
        isAdmin: false,
        name: displayName,
        userId: data.user.id,
        email: data.user.email,
        role: null,
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
                Reivindicar meu perfil
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

function AdminLoginPage({ navigate, onLogin }: {
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
        setError("Informe o e-mail da conta administrativa.");
        setLoading(false);
        return;
      }

      if (!password) {
        setError("Informe a senha da conta administrativa.");
        setLoading(false);
        return;
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

      if (authErr || !data.user) {
        setError("Credenciais inválidas.");
        setLoading(false);
        return;
      }

      const admin = await getCurrentAdminUser(data.user.id);

      if (!admin || !["admin", "superadmin"].includes(admin.role)) {
        await supabase.auth.signOut().catch(() => {});
        setError("Esta conta não tem permissão para acessar o painel administrativo.");
        setLoading(false);
        return;
      }

      onLogin({
        loggedIn: true,
        isAdmin: true,
        name: data.user.user_metadata?.full_name ?? admin.display_name ?? data.user.email ?? "Admin",
        userId: data.user.id,
        email: data.user.email ?? admin.email ?? undefined,
        role: admin.role,
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
            Painel administrativo
          </p>
          <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl uppercase mb-2">Admin</h1>
          <p className="font-['Playfair_Display'] italic text-[#c9a84c] text-xl">Turma 2006</p>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
          <div className="flex flex-col gap-5">
            <DisplayTitle className="text-xl">Acesso administrativo</DisplayTitle>

            <Field
              label="E-mail"
              type="email"
              placeholder="admin@email.com"
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
              {loading ? <><RefreshCw size={16} className="animate-spin" />Verificando...</> : <><Key size={16} />Acessar painel</>}
            </Btn>

            <p className="text-[#7a9a7a] text-xs leading-relaxed">
              O acesso administrativo usa exclusivamente uma conta real do Supabase Auth com registro em admin_users.
            </p>
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

function Hero({ navigate, content }: { navigate: (p: Page) => void; content: HomePageContent }) {
  const [time, setTime] = useState(getTimeLeft());
  useEffect(() => {
    const id = setInterval(() => setTime(getTimeLeft()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" }}>
      <div className="absolute inset-0 opacity-[0.06]"
        style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "80px 80px" }} />
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full opacity-10 blur-[120px] pointer-events-none"
        style={{ background: "#2d6a4f" }} />

      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto py-24 md:py-0">
        <p className="text-[#c9a84c] tracking-[0.5em] text-[10px] md:text-xs font-mono font-bold uppercase mb-6">{content.hero_eyebrow}</p>
        <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] uppercase leading-[0.88] tracking-tight"
          style={{ fontSize: "clamp(3.2rem, 13vw, 9rem)" }}>{content.hero_title}</h1>
        <p className="font-['Playfair_Display'] font-light italic text-[#c9a84c] leading-tight mt-3"
          style={{ fontSize: "clamp(1.2rem, 4vw, 2.8rem)" }}>{content.hero_tagline}</p>
        <div className="w-20 h-px bg-[#c9a84c] mx-auto my-6 opacity-50" />
        <p className="text-[#8ab89a] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-2">{content.hero_subtitle}</p>
        <p className="text-[#f0ebe0] font-mono text-xs tracking-[0.2em] uppercase opacity-70 mb-10">{content.hero_event_line}</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Btn size="lg" onClick={() => navigate("tickets")}>{content.primary_cta_label}</Btn>
          <Btn size="lg" variant="outline" onClick={() => navigate("who-going")}>{content.secondary_cta_label}</Btn>
        </div>
        <div className="inline-flex">
          {[{ v: time.days, l: "Dias" }, { v: time.hours, l: "Horas" }, { v: time.minutes, l: "Min" }, { v: time.seconds, l: "Seg" }].map(({ v, l }, i) => (
            <div key={l} className="flex items-center">
              {i > 0 && <span className="text-[#2d6a4f] font-mono text-2xl mx-3 md:mx-5 font-light">:</span>}
              <div className="text-center">
                <div className="font-['JetBrains_Mono'] text-3xl md:text-5xl font-bold text-[#f0ebe0] tabular-nums">{String(v).padStart(2, "0")}</div>
                <div className="text-[#c9a84c] text-[9px] tracking-[0.3em] uppercase font-mono mt-1">{l}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="text-[#c9a84c] opacity-50" size={20} />
      </div>
    </section>
  );
}

function AboutSection({ content }: { content: HomePageContent }) {
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>{content.about_eyebrow}</SectionLabel>
            <DisplayTitle className="text-4xl md:text-5xl mb-6">{content.about_title}</DisplayTitle>
            <GoldRule />
            <p className="text-[#8ab89a] text-base leading-relaxed mb-4">{content.about_body_1}</p>
            <p className="text-[#8ab89a] text-base leading-relaxed">{content.about_body_2}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[["84","Ex-alunos localizados"],["67%","Já confirmaram presença"],["12","Estados representados"],["2006","O ano que não esquecemos"]].map(([num, label]) => (
              <div key={label} className="border border-[#2d6a4f]/30 p-6 bg-[#141f14]">
                <p className="font-['Playfair_Display'] font-black text-[#c9a84c] text-4xl md:text-5xl mb-2">{num}</p>
                <p className="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EventInfoSection({ content }: { content: HomePageContent }) {
  return (
    <section className="bg-[#f0ebe0] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>{content.info_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-12">{content.info_title}</DisplayTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Calendar size={24} />, title: "Data", info: "Sábado, 17 de Outubro de 2026", sub: "Portas abertas Ã s 18h30" },
            { icon: <Clock size={24} />, title: "Horário", info: "19h00 — 01h00", sub: "Jantar servido a partir das 20h" },
            { icon: <MapPin size={24} />, title: "Local", info: "Espaço Cultural Ponta Negra", sub: "Av. Eng. Roberto Freire — Ponta Negra, Natal/RN" },
          ].map(({ icon, title, info, sub }) => (
            <div key={title} className="bg-[#0d1a0f] p-8">
              <div className="text-[#c9a84c] mb-4">{icon}</div>
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-2">{title}</p>
              <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-2">{info}</p>
              <p className="text-[#7a9a7a] text-sm">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TicketsPreview({ navigate, content }: { navigate: (p: Page) => void; content: HomePageContent }) {
  return (
    <section className="bg-[#0a120a] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>{content.tickets_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.tickets_title}</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("tickets")}>Ver todos <ArrowRight size={16} /></Btn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TICKETS.map(t => (
            <div key={t.id} className={"bg-[#141f14] border p-8 flex flex-col gap-4 transition-colors " + (t.status === "sold-out" ? "border-[#c0392b]/20 opacity-60" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60")}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{t.lot}</p>
                  <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mt-1">{t.type}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="border-t border-[#2d6a4f]/20 pt-4">
                <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">R$ {t.price}<span className="text-base text-[#7a9a7a] font-light">,00</span></p>
              </div>
              <ul className="flex flex-col gap-2">
                {t.includes.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[#7a9a7a] text-xs"><Check size={12} className="text-[#2d6a4f] mt-0.5 shrink-0" />{item}</li>
                ))}
              </ul>
              <div className="mt-auto">
                <Btn full disabled={t.status === "sold-out"} onClick={() => navigate("checkout")} variant={t.status === "last-units" ? "gold" : "primary"}>
                  {t.status === "sold-out" ? "Esgotado" : "Comprar agora"}
                </Btn>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function WhoGoingPreview({ navigate, people, content }: { navigate: (p: Page) => void; people: DbPerson[]; content: HomePageContent }) {
  const confirmed = people.filter(a => a.profile_status === "confirmed" && a.is_visible).slice(0, 8);
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>{content.confirmed_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.confirmed_title}</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("who-going")}>Ver todos <ArrowRight size={16} /></Btn>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {confirmed.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} />)}
        </div>
        <div className="mt-8 text-center">
          <p className="text-[#7a9a7a] text-sm mb-4 font-mono">Apenas pessoas que autorizaram aparecem na lista.</p>
          <Btn variant="outline" onClick={() => navigate("who-going")}>Ver lista completa</Btn>
        </div>
      </div>
    </section>
  );
}

function PhotoWallPreview({ navigate, photos, content }: { navigate: (p: Page) => void; photos: DbPhoto[]; content: HomePageContent }) {
  const previewPhotos = photos.slice(0, 6);
  return (
    <section className="bg-[#080f08] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>{content.photos_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.photos_title}</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("photo-wall")}>Ver todas <ArrowRight size={16} /></Btn>
        </div>
        {previewPhotos.length === 0 ? (
          <EmptyState title="Nenhuma foto aprovada ainda" subtitle="As fotos aprovadas pela moderação aparecerão aqui." action={<Btn variant="outline" onClick={() => navigate("photo-wall")}>Abrir mural</Btn>} />
        ) : (
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
        )}
      </div>
    </section>
  );
}

function TimelineSection({ content }: { content: HomePageContent }) {
  return (
    <section className="bg-[#f0ebe0] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>{content.timeline_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-16">{content.timeline_title}</DisplayTitle>
        <div className="flex flex-col">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="flex gap-6 md:gap-12">
              <div className="flex flex-col items-center">
                <div className={"w-12 h-12 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-sm shrink-0 " + (item.year === "2026" ? "bg-[#2d6a4f] text-[#f0ebe0]" : "border-2 border-[#2d6a4f] text-[#2d6a4f]")}>{item.year.slice(2)}</div>
                {i < TIMELINE.length - 1 && <div className="w-px flex-1 bg-[#2d6a4f]/30 my-2" />}
              </div>
              <div className={i < TIMELINE.length - 1 ? "pb-12" : ""}>
                <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">{item.year}</p>
                <p className="text-[#0d1a0f] font-['Playfair_Display'] font-bold text-xl mb-2">{item.label}</p>
                <p className="text-[#4a6a4a] text-sm leading-relaxed max-w-md">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQSection({ content }: { content: HomePageContent }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4">
        <SectionLabel>{content.faq_eyebrow}</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-12">{content.faq_title}</DisplayTitle>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-[#2d6a4f]/25 bg-[#141f14]">
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

function LandingPage({ navigate, people, photos, content }: { navigate: (p: Page) => void; people: DbPerson[]; photos: DbPhoto[]; content: HomePageContent }) {
  return <>
    <Hero navigate={navigate} content={content} />
    <AboutSection content={content} />
    <EventInfoSection content={content} />
    <TicketsPreview navigate={navigate} content={content} />
    <WhoGoingPreview navigate={navigate} people={people} content={content} />
    <PhotoWallPreview navigate={navigate} photos={photos} content={content} />
    <TimelineSection content={content} />
    <FAQSection content={content} />
  </>;
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
  const [form, setForm]           = useState({ name: auth.name || "", email: auth.email || "", phone: "", alumni: "" });
  const [companion, setCompanion] = useState(false);
  const [payment, setPayment]     = useState("pix");
  const [loading, setLoading]     = useState(false);
  const [checkoutStatus, setCheckoutStatus] = useState<PaymentStatus | "cancelled" | null>(checkoutReturn?.status ?? null);
  const [checkoutOrder, setCheckoutOrder] = useState<(DbOrder & { ticket_types?: Partial<DbTicketType> | null; tickets?: { id: string; qr_code: string }[] }) | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [payResult, setPayResult] = useState<"approved" | "declined" | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const steps = ["Seus dados", "Pagamento", "Processando"];
  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketTypeId)
    ?? ticketTypes.find(t => t.status === "open")
    ?? null;
  const fallbackTicket = TICKETS.find(t => t.id === selectedTicketTypeId) ?? TICKETS[0];
  const ticketName = selectedTicket?.name ?? fallbackTicket.type;
  const ticketPriceCents = selectedTicket?.price_cents ?? fallbackTicket.price * 100;
  const quantity = companion ? 2 : 1;
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
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Buscar seu perfil na lista da turma</label>
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input placeholder="Digite seu nome..." value={form.alumni} onChange={e => setForm(f => ({ ...f, alumni: e.target.value }))}
                  className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={companion} onChange={e => setCompanion(e.target.checked)} className="w-4 h-4 accent-[#2d6a4f]" />
              <span className="text-[#f0ebe0] text-sm">Levarei um acompanhante</span>
            </label>
            {companion && <Field label="Nome do acompanhante" placeholder="Nome completo" />}
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

// ─── CLAIM PROFILE (COMPLETE) ─────────────────────────────────────────────────

function ClaimProfilePage({ navigate, people, auth }: { navigate: (p: Page) => void; people: DbPerson[]; auth: AuthState }) {
  const [step, setStep]         = useState(1);
  const [search, setSearch]     = useState("");
  const [selected, setSelected] = useState<Alumni | null>(null);
  const [code, setCode]         = useState("");
  const [answers, setAnswers]   = useState<Record<string, string>>({});
  const [claimResult, setClaimResult] = useState<"approved" | "rejected" | null>(null);
  const [loading, setLoading]   = useState(false);
  const [claimEmail, setClaimEmail] = useState(auth.email ?? "");
  const [claimPhone, setClaimPhone] = useState("");
  const [claimError, setClaimError] = useState("");

  const results = people
    .filter(a => a.full_name.toLowerCase().includes(search.toLowerCase()) && search.length > 1)
    .map(personToAlumni);
  const alreadyClaimed = selected && (selected.status === "claimed" || selected.status === "confirmed");

  async function submitAnswers(result: "approved" | "rejected") {
    setLoading(true);
    setClaimError("");
    try {
      if (!selected) throw new Error("Selecione um perfil.");
      if (!claimEmail.includes("@")) throw new Error("Informe um e-mail valido.");
      const scoreAnswers = CONFIRM_QUESTIONS.map(q => ({
        key: q.id,
        text: answers[q.id] ?? "",
        score: answers[q.id] && answers[q.id] !== "Não me lembro" ? 1 : 0,
      }));
      await createFullProfileClaim({
        personId: selected.id,
        userId: auth.loggedIn ? auth.userId : null,
        name: selected.name,
        email: claimEmail,
        phone: claimPhone,
        answers: scoreAnswers,
      });
      setClaimResult(result);
      setStep(7);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Erro ao enviar reivindicacao.");
    } finally {
      setLoading(false);
    }
  }

  async function submitDispute() {
    if (!selected) return;
    setLoading(true);
    setClaimError("");
    try {
      await createProfileClaimDispute({
        personId: selected.id,
        userId: auth.loggedIn ? auth.userId : "",
        currentClaimantUserId: null,
        requesterName: auth.name || selected.name,
        requesterEmail: auth.email ?? claimEmail,
        requesterPhone: claimPhone,
        reason: "Solicitacao de disputa aberta pelo fluxo de reivindicacao.",
        evidenceText: "Usuario informa que o perfil reivindicado pertence a ele.",
      });
      setClaimResult("approved");
      setStep(7);
    } catch (err) {
      setClaimError(err instanceof Error ? err.message : "Erro ao abrir disputa.");
    } finally {
      setLoading(false);
    }
  }

  const bars = 7;

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-lg mx-auto px-4">
        <button onClick={() => step > 1 ? setStep(s => Math.max(1, s - 1)) : navigate("the-class")}
          className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar
        </button>
        <SectionLabel>Perfil da Turma</SectionLabel>
        <DisplayTitle className="text-3xl md:text-4xl mb-6">Reivindicar meu perfil</DisplayTitle>
        <div className="flex gap-1.5 mb-10">
          {Array.from({ length: bars }).map((_, i) => (
            <div key={i} className={`flex-1 h-1 transition-all ${i + 1 <= step ? "bg-[#2d6a4f]" : "bg-[#1a2e1a]"}`} />
          ))}
        </div>

        {/* Step 1 — Search */}
        {step === 1 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#f0ebe0] font-semibold">Busque seu nome na lista da turma</p>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
              <input placeholder="Digite seu nome..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
            </div>
            {results.length > 0 && (
              <div className="flex flex-col gap-2">
                {results.map(a => (
                  <button key={a.id} onClick={() => { setSelected(a); setStep(2); }}
                    className="flex items-center gap-3 p-4 border text-left hover:border-[#2d6a4f]/50 transition-colors border-[#2d6a4f]/20">
                    <div className="w-10 h-10 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold text-sm font-mono shrink-0">
                      {initials(a.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-[#f0ebe0] font-semibold text-sm">{a.name}</p>
                      {a.nickname && <p className="text-[#c9a84c] text-xs font-mono">&ldquo;{a.nickname}&rdquo; · Sala {a.sala}</p>}
                    </div>
                    <StatusBadge status={a.status} />
                  </button>
                ))}
              </div>
            )}
            {search.length > 1 && results.length === 0 && (
              <p className="text-[#7a9a7a] text-sm text-center py-4">Nenhum perfil encontrado.</p>
            )}
            <p className="text-[#7a9a7a] text-xs text-center">
              Não encontrou? <button className="text-[#2d6a4f] underline">Entre em contato</button>
            </p>
          </div>
        )}

        {/* Step 2a — Already claimed */}
        {step === 2 && alreadyClaimed && selected && (
          <div className="bg-[#141f14] border border-[#c9a84c]/40 p-8 flex flex-col gap-5">
            <div className="text-center">
              <AlertTriangle size={40} className="text-[#c9a84c] mx-auto mb-4" />
              <DisplayTitle className="text-xl mb-2">Perfil já reivindicado</DisplayTitle>
              <p className="text-[#7a9a7a] text-sm">
                O perfil de <span className="text-[#f0ebe0] font-semibold">{selected.name}</span> já está vinculado a uma conta ativa.
              </p>
            </div>
            <div className="bg-[#0a120a] border border-[#c9a84c]/20 p-5">
              <p className="text-[#7a9a7a] text-sm mb-3">
                Se este é realmente o seu perfil, entre em contato com a organização para abrir uma disputa:
              </p>
              <p className="text-[#f0ebe0] text-sm flex items-center gap-2"><Mail size={14} />turma2006.hc@gmail.com</p>
              <p className="text-[#f0ebe0] text-sm flex items-center gap-2 mt-2"><Phone size={14} />(84) 99999-0206</p>
            </div>
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => { setSelected(null); setSearch(""); setStep(1); }}>Buscar outro nome</Btn>
              <Btn full variant="ghost" onClick={submitDispute} disabled={loading}><Mail size={16} />Abrir disputa de perfil</Btn>
            </div>
          </div>
        )}

        {/* Step 2b — Confirm selection */}
        {step === 2 && !alreadyClaimed && selected && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Perfil selecionado</p>
            <div className="flex items-center gap-3 p-4 bg-[#1a2e1a] border border-[#2d6a4f]/30">
              <div className="w-12 h-12 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono">
                {initials(selected.name)}
              </div>
              <div>
                <p className="text-[#f0ebe0] font-semibold">{selected.name}</p>
                {selected.nickname && <p className="text-[#c9a84c] text-xs font-mono">&ldquo;{selected.nickname}&rdquo;</p>}
              </div>
            </div>
            <p className="text-[#f0ebe0] font-semibold">Este é você?</p>
            <div className="flex gap-3">
              <Btn full onClick={() => setStep(3)}>Sim, sou eu <ArrowRight size={16} /></Btn>
              <Btn full variant="ghost" onClick={() => { setSelected(null); setSearch(""); setStep(1); }}>Não</Btn>
            </div>
          </div>
        )}

        {/* Step 3 — Contact info */}
        {step === 3 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#f0ebe0] font-semibold">Informe seus contatos para verificação</p>
            <Field label="E-mail" type="email" placeholder="seu@email.com" value={claimEmail} onChange={setClaimEmail} icon={<Mail size={16} />} />
            <Field label="WhatsApp" type="tel" placeholder="(84) 9 9999-0000" value={claimPhone} onChange={setClaimPhone} icon={<Phone size={16} />}
              hint="Enviaremos um código de verificação via SMS ou WhatsApp" />
            <Btn full onClick={() => setStep(4)}>Enviar código de verificação <ArrowRight size={16} /></Btn>
          </div>
        )}

        {/* Step 4 — Verification code */}
        {step === 4 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-6 text-center">
            <Lock size={32} className="text-[#c9a84c] mx-auto" />
            <div>
              <p className="text-[#f0ebe0] font-semibold mb-2">Código enviado por WhatsApp</p>
              <p className="text-[#7a9a7a] text-sm">Digite o código de 6 dígitos enviado para o número informado.</p>
            </div>
            <input type="text" maxLength={6} value={code} onChange={e => setCode(e.target.value)}
              className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-center font-['JetBrains_Mono'] text-2xl tracking-[0.5em] focus:outline-none focus:border-[#2d6a4f]"
              placeholder="000000" />
            <Btn full onClick={() => setStep(5)} disabled={code.length < 4}>Confirmar código</Btn>
            <button className="text-[#7a9a7a] text-xs hover:text-[#f0ebe0] transition-colors">Reenviar código</button>
          </div>
        )}

        {/* Step 5 — Confirmation questions */}
        {step === 5 && (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-6">
            {claimError && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{claimError}</p>}
            <div>
              <p className="text-[#f0ebe0] font-semibold mb-1">Perguntas de confirmação</p>
              <p className="text-[#7a9a7a] text-sm">Para garantir sua identidade, responda Ã s perguntas sobre o HC. Apenas ex-alunos saberão as respostas.</p>
            </div>
            {CONFIRM_QUESTIONS.map(q => (
              <div key={q.id}>
                <p className="text-[#f0ebe0] text-sm font-semibold mb-3">{q.question}</p>
                <div className="flex flex-col gap-2">
                  {q.options.map(opt => (
                    <label key={opt} className={`flex items-center gap-3 p-3 border cursor-pointer transition-colors ${answers[q.id] === opt ? "border-[#2d6a4f] bg-[#1a2e1a]" : "border-[#2d6a4f]/20 hover:border-[#2d6a4f]/40"}`}>
                      <div className={`w-5 h-5 border-2 flex items-center justify-center shrink-0 ${answers[q.id] === opt ? "border-[#2d6a4f] bg-[#2d6a4f]" : "border-[#3a5a3a]"}`}>
                        {answers[q.id] === opt && <Check size={12} className="text-[#f0ebe0]" />}
                      </div>
                      <input type="radio" name={q.id} className="sr-only" onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} />
                      <span className="text-[#f0ebe0] text-sm">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => submitAnswers("approved")} disabled={Object.keys(answers).length < CONFIRM_QUESTIONS.length || loading}>
                {loading ? <><RefreshCw size={16} className="animate-spin" />Enviando...</> : "Enviar respostas"}
              </Btn>
              {DEV_MODE && (
                <Btn full variant="ghost" onClick={() => submitAnswers("rejected")} disabled={loading}>
                  Rejeitar teste local
                </Btn>
              )}
            </div>
          </div>
        )}

        {/* Step 7 — Approved */}
        {step === 7 && claimResult === "approved" && (
          <div className="bg-[#0d2e1a] border border-[#2d6a4f] p-8 flex flex-col gap-5 text-center">
            <div className="w-16 h-16 bg-[#2d6a4f] flex items-center justify-center mx-auto">
              <UserCheck size={32} className="text-[#f0ebe0]" />
            </div>
            <DisplayTitle className="text-2xl">Perfil reivindicado!</DisplayTitle>
            <p className="text-[#7a9a7a] text-sm">
              Identidade confirmada com sucesso. Seu perfil de ex-aluno está vinculado Ã  sua conta.
            </p>
            <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
              <StatusBadge status="confirmed" />
              <p className="text-[#7a9a7a] text-xs mt-2">{selected?.name}</p>
            </div>
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => navigate("edit-profile")}>Completar meu perfil <ArrowRight size={16} /></Btn>
              <Btn full variant="outline" onClick={() => navigate("tickets")}>Comprar ingresso</Btn>
            </div>
          </div>
        )}

        {/* Step 7 — Rejected */}
        {step === 7 && claimResult === "rejected" && (
          <div className="bg-[#2e0a0a] border border-[#c0392b]/60 p-8 flex flex-col gap-5 text-center">
            <div className="w-16 h-16 bg-[#c0392b] flex items-center justify-center mx-auto">
              <UserX size={32} className="text-[#f0ebe0]" />
            </div>
            <DisplayTitle className="text-2xl">Solicitação rejeitada</DisplayTitle>
            <p className="text-[#7a9a7a] text-sm">
              Não foi possível confirmar sua identidade com base nas respostas. Se houve um erro, entre em contato com a organização.
            </p>
            <div className="bg-[#1a0505] border border-[#c0392b]/30 p-4 text-left">
              <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-2">Motivo</p>
              <p className="text-[#e74c3c] text-sm">As respostas não correspondem Ã s informações esperadas para este perfil.</p>
            </div>
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => { setStep(5); setClaimResult(null); setAnswers({}); }}>Tentar novamente</Btn>
              <Btn full variant="ghost"><Mail size={16} />Contato com a organização</Btn>
            </div>
          </div>
        )}
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
              <SectionLabel>Mural de Memórias</SectionLabel>
              <DisplayTitle className="text-5xl md:text-7xl">Fotos da Época</DisplayTitle>
              <p className="text-[#7a9a7a] mt-2 font-mono text-sm">{photos.length} fotos · curtidas e comentários moderados</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Btn variant="outline" onClick={() => navigate("memories")}><MessageCircle size={16} />Caixa de memórias</Btn>
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
          <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar ao mural</button>
          <EmptyState title="Foto não encontrada" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Voltar ao mural
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

// ─── POLLS ────────────────────────────────────────────────────────────────────

function PollsPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [polls, setPolls] = useState<(DbPoll & { poll_options?: DbPollOption[] })[]>([]);
  const [results, setResults] = useState<Record<string, Record<string, number>>>({});
  const [myVotes, setMyVotes] = useState<DbPollVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadPolls() {
    setLoading(true);
    setError("");
    try {
      const data = await getPolls(DEFAULT_EVENT_ID);
      setPolls(data);
      const nextResults: Record<string, Record<string, number>> = {};
      for (const poll of data) nextResults[poll.id] = await getPollResults(poll.id);
      setResults(nextResults);
      if (auth.loggedIn) setMyVotes(await getMyPollVotes(auth.userId, data.map(p => p.id)));
      else setMyVotes([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar enquetes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPolls(); }, [auth.loggedIn, auth.userId]);

  async function submitVote(poll: DbPoll & { poll_options?: DbPollOption[] }, optionId: string) {
    if (!auth.loggedIn) { navigate("login"); return; }
    setBusy(optionId);
    setError("");
    setMessage("");
    try {
      await votePoll({ pollId: poll.id, optionId, userId: auth.userId, allowMultiple: poll.allow_multiple_votes });
      setMessage("Voto registrado.");
      await loadPolls();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar voto.");
    } finally {
      setBusy(null);
    }
  }

  function totalVotes(pollId: string): number {
    return Object.values(results[pollId] ?? {}).reduce<number>((sum, value) => sum + Number(value), 0);
  }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
          <div>
            <SectionLabel>Enquetes nostálgicas</SectionLabel>
            <DisplayTitle className="text-4xl md:text-6xl">Vote nas memórias da turma</DisplayTitle>
            <p className="text-[#7a9a7a] mt-3 max-w-2xl">Escolha músicas, lugares e lembranças que marcaram a Turma 2006. Os resultados são atualizados conforme os votos entram.</p>
          </div>
          <Btn variant="outline" onClick={() => navigate("where-now")}><MapPin size={16} />Onde estamos</Btn>
        </div>

        {message && <div className="mb-6 bg-[#0d2e1a] border border-[#2d6a4f] p-4 text-[#74c69d] text-sm font-mono">{message}</div>}
        {error && <ErrorState message={error} onRetry={loadPolls} />}
        {loading && <LoadingState message="Carregando enquetes..." />}

        {!loading && polls.length === 0 && (
          <EmptyState icon={<BarChart3 size={42} />} title="Nenhuma enquete aberta" subtitle="A organização ainda não abriu votações para a turma." />
        )}

        {!loading && polls.length > 0 && (
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
      </div>
    </div>
  );
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4">
      <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[#f0ebe0] text-sm break-words">{value}</p>
    </div>
  );
}

// ─── ARCHIVE PAGE ─────────────────────────────────────────────────────────────

function videoEmbedUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : url;
    }
  } catch {
    return url;
  }
  return url;
}

function isEmbeddableVideo(url: string) {
  return /youtube\.com|youtu\.be|vimeo\.com/i.test(url);
}

function ArchivePage({ navigate, auth, photos, people }: { navigate: (p: Page) => void; auth: AuthState; photos: DbPhoto[]; people: DbPerson[] }) {
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [settings, setSettings] = useState<DbEventArchiveSettings | null>(null);
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadArchive() {
      setLoading(true);
      setError("");
      try {
        const [eventData, settingsData, memoryData] = await Promise.all([
          getEventSettings().catch(() => null),
          getEventArchiveSettings(DEFAULT_EVENT_ID).catch(() => null),
          getApprovedMemories(DEFAULT_EVENT_ID).catch(() => []),
        ]);
        if (!active) return;
        setEvent(eventData);
        setSettings(settingsData);
        setMemories(memoryData);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Erro ao carregar acervo.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadArchive();
    return () => { active = false; };
  }, []);

  const dateSource = event?.event_date ? new Date(`${event.event_date}T${event.event_time ?? "19:00:00"}-03:00`) : EVENT_DATE;
  const archiveOpen = settings?.archive_enabled ?? Date.now() >= dateSource.getTime();
  const featuredPhotos = photos.filter(p => p.is_featured).slice(0, 8);
  const officialPhotoIds = new Set(settings?.official_photo_ids ?? []);
  const highlightPhotoIds = new Set(settings?.highlight_photo_ids ?? []);
  const configuredOfficialPhotos = photos.filter(p => officialPhotoIds.has(p.id));
  const configuredHighlightPhotos = photos.filter(p => highlightPhotoIds.has(p.id));
  const officialPhotos = configuredOfficialPhotos.length ? configuredOfficialPhotos : (featuredPhotos.length ? featuredPhotos : photos.slice(0, 8));
  const highlightPhotos = configuredHighlightPhotos.length ? configuredHighlightPhotos : officialPhotos.slice(0, 4);
  const confirmedPeople = people.filter(p => p.profile_status === "confirmed" && p.is_visible).slice(0, 16);
  const highlightLinks = settings?.highlights_links ?? [];
  const videoUrl = settings?.official_video_url?.trim() ?? "";

  return (
    <>
      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} auth={auth} navigate={navigate} />
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <SectionLabel>Acervo Digital</SectionLabel>
          <DisplayTitle className="text-4xl md:text-7xl mb-4">Memórias do reencontro</DisplayTitle>
          <p className="text-[#8ab89a] max-w-2xl mb-10">Um espaço para guardar fotos oficiais, registros enviados pela turma, melhores momentos e lembranças aprovadas pela organização.</p>

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

              <section>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Fotos oficiais e destaques</p>
                  <Btn size="sm" variant="outline" onClick={() => setUploadOpen(true)}><Upload size={14} />Enviar foto</Btn>
                </div>
                {officialPhotos.length === 0 ? <EmptyState title="Nenhuma foto no acervo" subtitle="As fotos aprovadas aparecerão aqui." /> : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {officialPhotos.map(photo => <div key={photo.id} className="aspect-[4/3] overflow-hidden bg-[#141f14] border border-[#2d6a4f]/20"><img src={photo.thumbnail_url ?? photo.image_url} alt={photo.caption ?? "Foto do acervo"} className="w-full h-full object-cover opacity-85" /></div>)}
                  </div>
                )}
              </section>

              <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                  <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Memórias da turma</p>
                  {memories.length === 0 ? <EmptyState title="Nenhuma memória aprovada" /> : memories.slice(0, 5).map(memory => <div key={memory.id} className="border-b border-[#2d6a4f]/15 py-4 last:border-b-0"><p className="text-[#f0ebe0] font-['Playfair_Display'] text-lg">“{memory.memory_text}”</p><p className="text-[#7a9a7a] text-xs font-mono mt-2">{memory.is_anonymous ? "Anônimo" : memory.author_name ?? "Ex-aluno"}</p></div>)}
                </div>
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                  <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Melhores momentos</p>
                  {videoUrl ? (
                    isEmbeddableVideo(videoUrl) ? (
                      <iframe
                        src={videoEmbedUrl(videoUrl)}
                        title={settings?.official_video_title ?? "Video oficial"}
                        className="aspect-video w-full border border-[#2d6a4f]/20 bg-[#0a120a] mb-4"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={videoUrl} controls className="aspect-video w-full border border-[#2d6a4f]/20 bg-[#0a120a] mb-4" />
                    )
                  ) : (
                    <EmptyState title="Video oficial ainda nao publicado" subtitle="Quando a organizacao configurar o video, ele aparecera aqui." />
                  )}
                  {settings?.official_video_title && <p className="text-[#f0ebe0] font-semibold text-sm mb-4">{settings.official_video_title}</p>}
                  {highlightPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {highlightPhotos.map(photo => (
                        <img key={photo.id} src={photo.thumbnail_url ?? photo.image_url} alt={photo.caption ?? "Destaque do acervo"} className="aspect-[4/3] w-full object-cover border border-[#2d6a4f]/20" />
                      ))}
                    </div>
                  )}
                  {highlightLinks.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {highlightLinks.map(link => (
                        <a key={link.url} href={link.url} target="_blank" rel="noreferrer" className="border border-[#2d6a4f]/20 bg-[#0a120a] p-4 hover:border-[#2d6a4f]/50 transition-colors">
                          <p className="text-[#f0ebe0] text-sm font-semibold">{link.label}</p>
                          {link.description && <p className="text-[#7a9a7a] text-xs mt-1">{link.description}</p>}
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#7a9a7a] text-sm">Links de melhores momentos serao exibidos aqui quando publicados pela organizacao.</p>
                  )}
                </div>
              </section>

              <section className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
                <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider mb-4">Lista de presença pública</p>
                {confirmedPeople.length === 0 ? <EmptyState title="Lista indisponível" subtitle="A lista pública respeita as preferências de privacidade dos perfis." /> : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {confirmedPeople.map(person => <div key={person.id} className="bg-[#0a120a] border border-[#2d6a4f]/20 p-4"><p className="text-[#f0ebe0] text-sm font-semibold">{person.full_name}</p><p className="text-[#7a9a7a] text-xs font-mono">Turma 2006{person.class_group ? ` · Sala ${person.class_group}` : ""}</p></div>)}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </div>
    </>
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
        <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar ao mural</button>
        <SectionLabel>Caixa de memórias</SectionLabel>
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
                <p className="text-[#7a9a7a] font-mono text-xs mt-4">{memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno")} · {memory.created_at?.slice(0, 10)}</p>
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
                <button onClick={() => navigate("photo-wall")} className="text-[#2d6a4f] text-xs font-mono uppercase hover:text-[#40916c]">Ver mural</button>
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

function EditProfilePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [profile, setProfile] = useState<(DbProfile & { people?: Partial<DbPerson> }) | null>(null);
  const [form, setForm] = useState({
    displayName: "", photoUrl: "", city: "", state: "", country: "Brasil",
    profession: "", bio: "", memoryText: "", instagram: "", linkedin: "",
  });
  const [privacy, setPrivacy] = useState({ showCurrentPhoto: true, showCity: true, showProfession: true, showSocial: false, showInList: true, allowTagging: true });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const data = await getMyProfile(auth.userId);
      setProfile(data);
      if (data) {
        setForm({
          displayName: data.display_name ?? auth.name,
          photoUrl: data.current_photo_url ?? "",
          city: data.current_city ?? "",
          state: data.current_state ?? "",
          country: data.current_country ?? "Brasil",
          profession: data.profession ?? "",
          bio: data.bio ?? "",
          memoryText: data.memory_text ?? "",
          instagram: data.instagram_url ?? "",
          linkedin: data.linkedin_url ?? "",
        });
        setPrivacy({
          showCurrentPhoto: data.show_current_photo,
          showCity: data.show_city,
          showProfession: data.show_profession,
          showSocial: data.show_social_links,
          showInList: data.show_confirmed_status,
          allowTagging: data.allow_photo_tags,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProfile(); }, [auth.userId]);

  async function save() {
    if (!profile) { setError("Reivindique seu perfil antes de editar os dados públicos."); return; }
    setBusy(true);
    setError("");
    try {
      const updated = await saveMyProfile(auth.userId, {
        display_name: form.displayName.trim() || null,
        current_photo_url: form.photoUrl.trim() || null,
        current_city: form.city.trim() || null,
        current_state: form.state.trim() || null,
        current_country: form.country.trim() || null,
        profession: form.profession.trim() || null,
        bio: form.bio.trim() || null,
        memory_text: form.memoryText.trim() || null,
        instagram_url: form.instagram.trim() || null,
        linkedin_url: form.linkedin.trim() || null,
        show_current_photo: privacy.showCurrentPhoto,
        show_city: privacy.showCity,
        show_profession: privacy.showProfession,
        show_social_links: privacy.showSocial,
        allow_photo_tags: privacy.allowTagging,
        show_confirmed_status: privacy.showInList,
      });
      setProfile({ ...profile, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar perfil.");
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
      const updated = await saveMyProfile(auth.userId, { current_photo_url: publicUrl });
      setProfile({ ...profile, ...updated });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar avatar.");
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
            <EmptyState title="Perfil ainda não reivindicado" subtitle="Para editar dados públicos, primeiro vincule sua conta ao seu nome na lista da turma." action={<Btn onClick={() => navigate("claim-profile")}><UserCheck size={16} />Reivindicar perfil</Btn>} />
          </div>
        )}
        {!loading && profile && (
          <div className="flex flex-col gap-6">
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-6">Foto de perfil</p>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono text-2xl shrink-0 overflow-hidden">
                  {form.photoUrl ? <img src={form.photoUrl} alt={form.displayName || auth.name} className="w-full h-full object-cover" /> : avatarLabel}
                </div>
                <div className="flex-1">
                  <label className="inline-flex items-center justify-center gap-2 bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c] px-5 py-3 text-xs font-bold uppercase tracking-[0.15em] transition-all cursor-pointer">
                    {avatarUploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                    {avatarUploading ? "Enviando..." : "Enviar foto"}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      className="sr-only"
                      disabled={avatarUploading}
                      onChange={e => uploadAvatar(e.target.files?.[0] ?? null)}
                    />
                  </label>
                  {form.photoUrl && (
                    <button onClick={() => setForm(f => ({ ...f, photoUrl: "" }))} className="block mt-3 text-[#7a9a7a] hover:text-[#f0ebe0] text-xs font-mono">
                      Remover foto ao salvar
                    </button>
                  )}
                  <p className="text-[#7a9a7a] text-xs font-mono mt-2">JPG, PNG ou WebP ate 5 MB. A exibicao publica respeita a configuracao de privacidade abaixo.</p>
                </div>
              </div>
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Informações pessoais</p>
              <Field label="Nome de exibição" value={form.displayName} onChange={v => setForm(f => ({ ...f, displayName: v }))} placeholder="Como você quer aparecer" />
              <InfoRow label="Apelido da época" value={profile.people?.nickname_at_school ?? "Não informado"} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Cidade atual" value={form.city} onChange={v => setForm(f => ({ ...f, city: v }))} placeholder="Onde você mora hoje" icon={<MapPin size={14} />} />
                <Field label="Estado" value={form.state} onChange={v => setForm(f => ({ ...f, state: v }))} placeholder="UF/estado" />
              </div>
              <Field label="País" value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="Brasil" />
              <Field label="Profissão" value={form.profession} onChange={v => setForm(f => ({ ...f, profession: v }))} placeholder="O que você faz hoje" />
              <FieldArea label="Mini bio" value={form.bio} onChange={v => setForm(f => ({ ...f, bio: v }))} placeholder="Conte um pouco sobre você hoje..." />
              <FieldArea label="Memória favorita do HC" value={form.memoryText} onChange={v => setForm(f => ({ ...f, memoryText: v }))} placeholder="Uma memória que você nunca vai esquecer..." rows={2} />
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Redes sociais</p>
              <Field label="Instagram" value={form.instagram} onChange={v => setForm(f => ({ ...f, instagram: v }))} placeholder="https://instagram.com/seuperfil" icon={<Instagram size={14} />} />
              <Field label="LinkedIn" value={form.linkedin} onChange={v => setForm(f => ({ ...f, linkedin: v }))} placeholder="https://linkedin.com/in/seuperfil" icon={<Linkedin size={14} />} />
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

function AdminPage({ navigate, auth, onHomeContentUpdated }: { navigate: (p: Page) => void; auth: AuthState; onHomeContentUpdated: (content: HomePageContent) => void }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [event, setEvent] = useState<DbEvent | null>(null);
  const [lots, setLots] = useState<DbTicketType[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [peopleRows, setPeopleRows] = useState<DbPerson[]>([]);
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

    const [homeDraft, setHomeDraft] = useState<HomePageContent>(HOME_PAGE_CONTENT_DEFAULTS);

const role = auth.role ?? "viewer";
  const canManageEvent = role === "superadmin" || role === "admin";
  const canManageAdmins = role === "superadmin";
  const canModerate = role === "superadmin" || role === "admin" || role === "moderator";
  const canCheckin = role === "superadmin" || role === "admin" || role === "checkin_staff";
  const canExport = role !== "viewer";

  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:<BarChart3 size={13} /> },
    { id:"home-content", label:"Home", icon:<Pencil size={13} />, disabled: !canManageEvent },
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

  async function loadAdminData() {
    setLoading(true);
    setError("");
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
        const homeData = await getHomePageContent(DEFAULT_EVENT_ID);
        setHomeDraft(homeData);
        onHomeContentUpdated(homeData);
        setReports(await getReports(eventData.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdminData(); }, [tagFilter, commentFilter, memoryFilter]);

  async function runAction(label: string, action: () => Promise<void>) {
    setBusy(label);
    setError("");
    try {
      await action();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await loadAdminData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel concluir a acao.");
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
      const updated = await updateHomePageContent(DEFAULT_EVENT_ID, {
        ...homeDraft,
        event_id: DEFAULT_EVENT_ID,
      }, auth.userId);
      setHomeDraft(updated);
      onHomeContentUpdated(updated);
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
      setError("Informe a pergunta e pelo menos duas opções.");
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

  if (!auth.isAdmin) return <PermissionState />;

  return (
    <div className="min-h-screen bg-[#080f08]">
      <div className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Painel Admin</p>
          </div>
        </div>
        <Btn size="sm" variant={adminMenuOpen ? "gold" : "outline"} onClick={() => setAdminMenuOpen(open => !open)}><Menu size={14} />Menu</Btn>
      </div>

      {adminMenuOpen && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-9 border-b border-[#2d6a4f]/20 px-2 bg-[#080f08]">
          {tabs.map(t => (
            <button key={t.id} disabled={t.disabled} onClick={() => { if (!t.disabled) { setTab(t.id); setAdminMenuOpen(false); } }}
              className={"flex items-center justify-center gap-1.5 px-2 md:px-3 py-3 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors disabled:opacity-30 " + (tab === t.id ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[#7a9a7a] hover:text-[#f0ebe0]")}>
              {t.icon}{t.label}
            </button>
          ))}
          {canCheckin && (
            <button onClick={() => { setAdminMenuOpen(false); navigate("checkin"); }}
              className="flex items-center justify-center gap-1.5 px-2 md:px-3 py-3 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 border-transparent text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors">
              <Scan size={13} />Check-in
            </button>
          )}
        </div>
      )}

      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <SaveToast show={saved} />
        {error && <ErrorState message={error} onRetry={loadAdminData} />}
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
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                  <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Textos da página inicial</p>
                  <p className="text-[#3a5a3a] text-xs mt-1">Edite os textos exibidos na landing page pública.</p>
                </div>
                <Btn size="sm" onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar textos</Btn>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Chamada superior do hero" value={homeDraft.hero_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, hero_eyebrow: v }))} />
                <Field label="Título principal" value={homeDraft.hero_title} onChange={v => setHomeDraft(s => ({ ...s, hero_title: v }))} />
                <Field label="Linha de apoio do título" value={homeDraft.hero_tagline} onChange={v => setHomeDraft(s => ({ ...s, hero_tagline: v }))} />
                <Field label="Data/local no hero" value={homeDraft.hero_event_line} onChange={v => setHomeDraft(s => ({ ...s, hero_event_line: v }))} />
                <Field label="CTA principal" value={homeDraft.primary_cta_label} onChange={v => setHomeDraft(s => ({ ...s, primary_cta_label: v }))} />
                <Field label="CTA secundário" value={homeDraft.secondary_cta_label} onChange={v => setHomeDraft(s => ({ ...s, secondary_cta_label: v }))} />
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
                <Field label="Eyebrow timeline" value={homeDraft.timeline_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, timeline_eyebrow: v }))} />
                <Field label="Título timeline" value={homeDraft.timeline_title} onChange={v => setHomeDraft(s => ({ ...s, timeline_title: v }))} />
                <Field label="Eyebrow FAQ" value={homeDraft.faq_eyebrow} onChange={v => setHomeDraft(s => ({ ...s, faq_eyebrow: v }))} />
                <Field label="Título FAQ" value={homeDraft.faq_title} onChange={v => setHomeDraft(s => ({ ...s, faq_title: v }))} />
              </div>
              <div className="mt-6">
                <Btn onClick={saveHomeContent} disabled={busy === "home-content"}><Save size={14} />Salvar textos da home</Btn>
              </div>
            </div>
          </div>
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

        {!loading && tab === "participants" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {peopleRows.length === 0 ? <EmptyState title="Nenhum participante" /> : peopleRows.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} />)}
          </div>
        )}

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

const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile", "my-ticket"];
const PROTECTED_ADMIN:  Page[] = ["checkin"];

const PAGE_PATHS: Record<Page, string> = {
  home: "/",
  tickets: "/ingressos",
  checkout: "/checkout",
  confirmation: "/confirmacao",
  "who-going": "/quem-vai",
  "the-class": "/turma",
  "claim-profile": "/reivindicar-perfil",
  "photo-wall": "/fotos",
  "photo-detail": "/foto",
  memories: "/memorias",
  polls: "/enquetes",
  "where-now": "/mapa",
  "share-invite": "/convite",
  "my-ticket": "/meu-ingresso",
  archive: "/acervo",
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
  const found = (Object.entries(PAGE_PATHS) as [Page, string][]).find(([, path]) => path === normalized);
  return found?.[0] ?? "home";
}

function updateBrowserPath(nextPage: Page) {
  if (typeof window === "undefined") return;
  const nextPath = PAGE_PATHS[nextPage] ?? "/";
  if (window.location.pathname !== nextPath) window.history.pushState({}, "", nextPath);
}



export default function App() {
  const initialPage = pageFromPathname(window.location.pathname);
  const [page, setPage]               = useState<Page>(initialPage);
  const [returnPage, setReturnPage]   = useState<Page>(initialPage);
  const [auth, setAuth]               = useState<AuthState>({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
  const [people, setPeople]           = useState<DbPerson[]>(MOCK_PEOPLE);
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([]);
  const [selectedTicketTypeId, setSelectedTicketTypeId] = useState<string | null>(null);
  const [checkoutReturn, setCheckoutReturn] = useState<CheckoutReturnState>(null);
  const [approvedPhotos, setApprovedPhotos] = useState<DbPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const [homeContent, setHomeContent] = useState<HomePageContent>(HOME_PAGE_CONTENT_DEFAULTS);
  const [authLoading, setAuthLoading] = useState(true);

  // ── Inicializa sessão Supabase e escuta mudanças ──────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const u = session.user;
        const adminUser = await getCurrentAdminUser(u.id).catch(() => null);
        const admin  = !!adminUser;
        const name   = u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Usuário";
        setAuth({ loggedIn: true, isAdmin: admin, name, userId: u.id, email: u.email, role: adminUser?.role ?? null });
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const u = session.user;
        const adminUser = await getCurrentAdminUser(u.id).catch(() => null);
        const admin = !!adminUser;
        const name  = u.user_metadata?.full_name ?? u.email?.split("@")[0] ?? "Usuário";
        setAuth({ loggedIn: true, isAdmin: admin, name, userId: u.id, email: u.email, role: adminUser?.role ?? null });
      } else if (event === "SIGNED_OUT") {
        setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Carrega dados reais do Supabase com fallback para mock ────────────────
  useEffect(() => {
    getPeople().then(setPeople).catch(() => DEV_MODE && setPeople(MOCK_PEOPLE));
    getTicketTypes().then(setTicketTypes).catch(() => {});
    getApprovedPhotos(DEFAULT_EVENT_ID).then(setApprovedPhotos).catch(() => DEV_MODE && setApprovedPhotos([]));
    getHomePageContent(DEFAULT_EVENT_ID).then(setHomeContent).catch(() => {});
  }, []);

  useEffect(() => {
    const onPopState = () => setPage(pageFromPathname(window.location.pathname));
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
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

  function navigate(p: Page) {
    if (PROTECTED_ADMIN.includes(p)  && !auth.isAdmin)  { setReturnPage(p); setPage("login"); updateBrowserPath("login"); window.scrollTo(0, 0); return; }
    if (PROTECTED_ALUMNI.includes(p) && !auth.loggedIn) { setReturnPage(p); setPage("login"); updateBrowserPath("login"); window.scrollTo(0, 0); return; }
    setPage(p);
    updateBrowserPath(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  function handleLogin(nextAuth: AuthState) {
    setAuth(nextAuth);
    const dest = returnPage !== "login" ? returnPage : nextAuth.isAdmin ? "admin" : "alumni-area";
    setPage(dest);
    updateBrowserPath(dest);
    window.scrollTo(0, 0);
  }

  async function logout() {
    await supabase.auth.signOut().catch(() => {});
    setAuth({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
    navigate("home");
    await writeAudit("logout", "auth", null, {}).catch(() => {});
  }

  const isFullscreen = page === "admin" || page === "checkin" || page === "login";

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {!isFullscreen && <Header page={page} navigate={navigate} auth={auth} logout={logout} />}
      <main>
        {page === "home"          && <LandingPage      navigate={navigate} people={people} photos={approvedPhotos} content={homeContent} />}
        {page === "tickets"       && <TicketsPage       navigate={navigate} ticketTypes={ticketTypes} onSelectTicket={(id) => { setSelectedTicketTypeId(id); setCheckoutReturn(null); }} />}
        {page === "checkout"      && <CheckoutPage      navigate={navigate} auth={auth} ticketTypes={ticketTypes} selectedTicketTypeId={selectedTicketTypeId} checkoutReturn={checkoutReturn} />}
        {page === "confirmation"  && <ConfirmationPage  navigate={navigate}                                        />}
        {page === "who-going"     && <WhoGoingPage      navigate={navigate} people={people}                       />}
        {page === "the-class"     && <TheClassPage      navigate={navigate} people={people}                       />}
        {page === "claim-profile" && <ClaimProfilePage  navigate={navigate} people={people} auth={auth}           />}
        {page === "photo-wall"    && <PhotoWallPage      navigate={navigate} auth={auth} photos={approvedPhotos} onSelectPhoto={setSelectedPhotoId} />}
        {page === "photo-detail"  && <PhotoDetailPage    navigate={navigate} people={people} auth={auth} photo={approvedPhotos.find(p => p.id === selectedPhotoId) ?? approvedPhotos[0] ?? null} />}
        {page === "memories"      && <MemoriesPage       navigate={navigate} auth={auth}                              />}
        {page === "polls"         && <PollsPage          navigate={navigate} auth={auth}                              />}
        {page === "where-now"     && <WhereNowPage       navigate={navigate} people={people}                         />}
        {page === "share-invite"  && <ShareInvitePage    navigate={navigate} auth={auth}                           />}
        {page === "my-ticket"     && <MyTicketPage       navigate={navigate} auth={auth}                           />}
        {page === "archive"       && <ArchivePage        navigate={navigate} auth={auth} photos={approvedPhotos} people={people} />}
        {page === "alumni-area"   && <AlumniAreaPage     navigate={navigate} auth={auth}                          />}
        {page === "edit-profile"  && <EditProfilePage   navigate={navigate} auth={auth}                           />}
        {page === "admin"         && (auth.isAdmin ? <AdminPage navigate={navigate} auth={auth} onHomeContentUpdated={setHomeContent} /> : <AdminLoginPage navigate={navigate} onLogin={handleLogin} />)}
        {page === "checkin"       && <CheckinPage        navigate={navigate} auth={auth}                           />}
        {page === "login"         && <LoginPage          navigate={navigate} onLogin={handleLogin}                 />}
        {page === "terms"         && <TermsPage          navigate={navigate}                                        />}
        {page === "privacy"       && <PrivacyPage        navigate={navigate}                                        />}
      </main>
      {!isFullscreen && <Footer navigate={navigate} />}
    </div>
  );
}

