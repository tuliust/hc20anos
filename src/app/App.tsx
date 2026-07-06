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
} from "../lib/services";
import type {
  DbPerson, DbTicketType, DbEvent, DbAdminUser, DbAuditLog, DbPhoto, DbPhotoTag,
  DbProfileClaim, DbPhotoRemovalRequest, DbProfileClaimDispute, AdminRole, TicketStatus,
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
  Info, Package, Pencil
} from "lucide-react";

// ─── TYPES ─────────────────────────────────────────────────────────────────────

type Page =
  | "home" | "tickets" | "checkout" | "confirmation"
  | "who-going" | "the-class" | "claim-profile"
  | "photo-wall" | "photo-detail" | "alumni-area"
  | "edit-profile" | "admin" | "checkin"
  | "login" | "terms" | "privacy";

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
  city?: string; profession?: string;
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
  { id: "t1", type: "Ingresso Individual",    lot: "1º Lote",        price: 120, available: 47, total: 100, includes: ["Jantar buffet completo", "Open bar 4 horas", "Área fotográfica", "Brinde comemorativo"],                                        status: "available"   },
  { id: "t2", type: "Ingresso Casal",         lot: "1º Lote",        price: 200, available: 8,  total: 50,  includes: ["2 jantares buffet", "Open bar 4 horas", "Área fotográfica", "2 brindes comemorativos"],                                         status: "last-units"  },
  { id: "t3", type: "Mesa VIP — 4 pessoas",   lot: "Edição Limitada", price: 600, available: 0,  total: 20,  includes: ["Mesa reservada premium", "Champagne na chegada", "Open bar premium", "Brinde colecionável exclusivo", "Acesso à área VIP"],    status: "sold-out"    },
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

// Mapeia DbPerson → Alumni (interface legada dos componentes visuais)
function personToAlumni(p: DbPerson): Alumni {
  return {
    id:         p.id,
    name:       p.full_name,
    nickname:   p.nickname_at_school ?? undefined,
    sala:       p.class_group ?? undefined,
    city:       undefined,    // vem de profiles, carregado separadamente
    profession: undefined,
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
    open:         { label: "Aberto",           color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    closed:       { label: "Fechado",          color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
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

function AlumniCard({ alumni, onClaim }: { alumni: Alumni; onClaim?: () => void }) {
  const colors = ["#2d6a4f", "#1a4d2e", "#40916c", "#1e3a2f", "#0b3d2e"];
  const color = colors[parseInt(alumni.id) % colors.length];
  return (
    <div className="bg-[#141f14] border border-[#2d6a4f]/20 p-4 flex flex-col gap-3 hover:border-[#2d6a4f]/50 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 flex items-center justify-center text-[#f0ebe0] font-bold text-sm font-mono shrink-0" style={{ background: color }}>
          {initials(alumni.name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[#f0ebe0] font-semibold text-sm leading-tight truncate">{alumni.name}</p>
          {alumni.nickname && <p className="text-[#c9a84c] text-xs font-mono mt-0.5">&ldquo;{alumni.nickname}&rdquo;</p>}
          {alumni.city && <p className="text-[#7a9a7a] text-xs mt-1 flex items-center gap-1"><MapPin size={10} />{alumni.city}</p>}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <StatusBadge status={alumni.status} />
        {alumni.status === "unclaimed" && onClaim && (
          <button onClick={onClaim}
            className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#2d6a4f] hover:text-[#40916c] border border-[#2d6a4f]/40 hover:border-[#40916c] px-3 py-1.5 transition-colors">
            Reivindicar
          </button>
        )}
      </div>
    </div>
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
    { label: "Ingressos",                           page: "tickets"     },
    { label: "Quem Vai",                            page: "who-going"   },
    { label: "A Turma",                             page: "the-class"   },
    { label: "Fotos",                               page: "photo-wall"  },
    { label: auth.loggedIn ? "Minha Área" : "Entrar", page: auth.loggedIn ? "alumni-area" : "login" },
  ];

  function go(p: Page) { navigate(p); setMenuOpen(false); }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#080f08]/95 backdrop-blur-md border-b border-[#2d6a4f]/20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go("home")} className="text-left">
            <p className="text-[#c9a84c] font-mono text-[10px] tracking-[0.3em] uppercase leading-none">Colégio Henrique Castriciano</p>
            <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-base leading-tight tracking-wide uppercase">Turma 2006</p>
          </button>
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <button key={l.page} onClick={() => go(l.page)}
                className={`text-xs font-mono font-bold uppercase tracking-[0.2em] transition-colors ${page === l.page ? "text-[#c9a84c]" : "text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Btn size="sm" onClick={() => go("tickets")} className="hidden md:inline-flex">Comprar</Btn>
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
              {(["tickets","who-going","the-class","photo-wall"] as Page[]).map(p => (
                <button key={p} onClick={() => navigate(p)} className="text-left text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors">
                  {{ tickets:"Ingressos", "who-going":"Quem Vai", "the-class":"A Turma", "photo-wall":"Mural de Fotos" }[p]}
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
  const [mode, setMode] = useState<"alumni" | "admin">("alumni");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [adminCode, setAdminCode] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function submit() {
    setError("");
    setLoading(true);
    try {
      if (mode === "admin") {
        // Tenta login real com Supabase Auth
        if (!email.includes("@")) { setError("Informe o e-mail da conta admin."); setLoading(false); return; }
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password: adminCode });
        if (authErr || !data.user) {
          // Fallback demo: código ADMIN2026 (desenvolvimento)
          if (DEV_MODE && adminCode.trim().toUpperCase() === "ADMIN2026") {
            onLogin({ loggedIn: true, isAdmin: true, name: "Organizacao", userId: "dev-admin", email, role: "superadmin" });
          } else {
            setError("Credenciais invalidas.");
          }
          setLoading(false); return;
        }
        const admin = await getCurrentAdminUser(data.user.id);
        if (!admin) { setError("Esta conta nao tem permissao de admin."); await supabase.auth.signOut(); setLoading(false); return; }
        onLogin({
          loggedIn: true,
          isAdmin: true,
          name: data.user.user_metadata?.full_name ?? admin.display_name ?? data.user.email ?? "Admin",
          userId: data.user.id,
          email: data.user.email ?? admin.email ?? undefined,
          role: admin.role,
        });
      } else {
        if (!email.includes("@")) { setError("Informe um e-mail válido."); setLoading(false); return; }
        if (password.length < 4)  { setError("Senha muito curta. Use ao menos 4 caracteres."); setLoading(false); return; }
        const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });
        if (authErr || !data.user) {
          // Fallback demo: qualquer e-mail + senha válida
          if (!DEV_MODE) { setError("Credenciais invalidas."); setLoading(false); return; }
          const prefix = email.split("@")[0].split(".")[0].toLowerCase();
          const match  = MOCK_PEOPLE.find((a: DbPerson) => a.full_name.toLowerCase().includes(prefix));
          onLogin({ loggedIn: true, isAdmin: false, name: match?.full_name || "Ana Paula Oliveira", userId: "dev-user", email, role: null });
          setLoading(false); return;
        }
        const displayName = data.user.user_metadata?.full_name ?? data.user.email ?? "Ex-aluno";
        onLogin({ loggedIn: true, isAdmin: false, name: displayName, userId: data.user.id, email: data.user.email, role: null });
      }
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
          <div className="flex mb-8 border-b border-[#2d6a4f]/20">
            {([["alumni","Ex-Aluno"],["admin","Admin"]] as const).map(([m, label]) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className={`flex-1 pb-4 text-xs font-mono uppercase tracking-widest border-b-2 transition-colors ${mode === m ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[#7a9a7a] hover:text-[#f0ebe0]"}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === "alumni" ? (
            <div className="flex flex-col gap-5">
              <DisplayTitle className="text-xl">Entrar como ex-aluno</DisplayTitle>
              <Field label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={setEmail} icon={<Mail size={16} />} />
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Senha</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                  <input type={showPw ? "text" : "password"} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-[#2d6a4f]" />
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
              <p className="text-[#3a5a3a] text-[10px] font-mono text-center border-t border-[#2d6a4f]/10 pt-4">
                Protótipo: qualquer e-mail + senha com 4+ caracteres
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <DisplayTitle className="text-xl">Acesso administrativo</DisplayTitle>
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Código de acesso</label>
                <div className="relative">
                  <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                  <input type="password" placeholder="••••••••••" value={adminCode} onChange={e => setAdminCode(e.target.value)}
                    className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
                </div>
              </div>
              {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
              <Btn full onClick={submit} disabled={loading}>
                {loading ? <><RefreshCw size={16} className="animate-spin" />Verificando...</> : <><Key size={16} />Acessar painel</>}
              </Btn>
              <p className="text-[#3a5a3a] text-[10px] font-mono text-center border-t border-[#2d6a4f]/10 pt-4">
                Protótipo: use o código ADMIN2026
              </p>
            </div>
          )}
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

function Hero({ navigate }: { navigate: (p: Page) => void }) {
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
        <p className="text-[#c9a84c] tracking-[0.5em] text-[10px] md:text-xs font-mono font-bold uppercase mb-6">
          Colégio Henrique Castriciano · Natal, RN
        </p>
        <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] uppercase leading-[0.88] tracking-tight"
          style={{ fontSize: "clamp(3.5rem, 16vw, 11rem)" }}>
          Turma 2006
        </h1>
        <p className="font-['Playfair_Display'] font-light italic text-[#c9a84c] leading-tight mt-3"
          style={{ fontSize: "clamp(1.4rem, 5vw, 3.5rem)" }}>
          20 anos depois
        </p>
        <div className="w-20 h-px bg-[#c9a84c] mx-auto my-6 opacity-50" />
        <p className="text-[#8ab89a] text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-2">
          O reencontro dos ex-alunos do Colégio Henrique Castriciano
        </p>
        <p className="text-[#f0ebe0] font-mono text-xs tracking-[0.2em] uppercase opacity-70 mb-10">
          17 de Outubro de 2026 &nbsp;·&nbsp; Espaço Cultural Ponta Negra &nbsp;·&nbsp; Natal, RN
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Btn size="lg" onClick={() => navigate("tickets")}>Comprar Ingresso</Btn>
          <Btn size="lg" variant="outline" onClick={() => navigate("who-going")}>Ver Quem Vai</Btn>
        </div>
        <div className="inline-flex">
          {[{ v: time.days, l: "Dias" }, { v: time.hours, l: "Horas" }, { v: time.minutes, l: "Min" }, { v: time.seconds, l: "Seg" }].map(({ v, l }, i) => (
            <div key={l} className="flex items-center">
              {i > 0 && <span className="text-[#2d6a4f] font-mono text-2xl mx-3 md:mx-5 font-light">:</span>}
              <div className="text-center">
                <div className="font-['JetBrains_Mono'] text-3xl md:text-5xl font-bold text-[#f0ebe0] tabular-nums">
                  {String(v).padStart(2, "0")}
                </div>
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

function AboutSection() {
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <SectionLabel>Sobre o Reencontro</SectionLabel>
            <DisplayTitle className="text-4xl md:text-5xl mb-6">Uma noite para celebrar quem a gente se tornou</DisplayTitle>
            <GoldRule />
            <p className="text-[#8ab89a] text-base leading-relaxed mb-4">
              Vinte anos passaram desde que dividimos o mesmo pátio, os mesmos corredores e as mesmas angústias de vestibular.
            </p>
            <p className="text-[#8ab89a] text-base leading-relaxed">
              No dia 17 de outubro de 2026, a Turma 2006 do Colégio Henrique Castriciano se reúne para uma noite inesquecível de memórias, reconexão e celebração.
            </p>
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

function EventInfoSection() {
  return (
    <section className="bg-[#f0ebe0] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>Informações do Evento</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-12">Data, hora e local</DisplayTitle>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Calendar size={24} />, title: "Data",     info: "Sábado, 17 de Outubro de 2026", sub: "Portas abertas às 18h30"           },
            { icon: <Clock size={24} />,    title: "Horário",  info: "19h00 — 01h00",                 sub: "Jantar servido a partir das 20h"   },
            { icon: <MapPin size={24} />,   title: "Local",    info: "Espaço Cultural Ponta Negra",   sub: "Av. Eng. Roberto Freire — Ponta Negra, Natal/RN" },
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

function TicketsPreview({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="bg-[#0a120a] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>Ingressos</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">Garanta sua vaga</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("tickets")}>Ver todos <ArrowRight size={16} /></Btn>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TICKETS.map(t => (
            <div key={t.id}
              className={`bg-[#141f14] border p-8 flex flex-col gap-4 transition-colors ${t.status === "sold-out" ? "border-[#c0392b]/20 opacity-60" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{t.lot}</p>
                  <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mt-1">{t.type}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
              <div className="border-t border-[#2d6a4f]/20 pt-4">
                <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">
                  R$ {t.price}<span className="text-base text-[#7a9a7a] font-light">,00</span>
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {t.includes.map(item => (
                  <li key={item} className="flex items-start gap-2 text-[#7a9a7a] text-xs">
                    <Check size={12} className="text-[#2d6a4f] mt-0.5 shrink-0" />{item}
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <Btn full disabled={t.status === "sold-out"} onClick={() => navigate("checkout")}
                  variant={t.status === "last-units" ? "gold" : "primary"}>
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

function WhoGoingPreview({ navigate }: { navigate: (p: Page) => void }) {
  const confirmed = ALUMNI.filter(a => a.status === "confirmed").slice(0, 8);
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>Confirmados</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">Quem já garantiu vaga</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("who-going")}>Ver todos <ArrowRight size={16} /></Btn>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {confirmed.map(a => <AlumniCard key={a.id} alumni={a} />)}
        </div>
        <div className="mt-8 text-center">
          <p className="text-[#7a9a7a] text-sm mb-4 font-mono">Apenas pessoas que autorizaram aparecem na lista.</p>
          <Btn variant="outline" onClick={() => navigate("who-going")}>Ver lista completa</Btn>
        </div>
      </div>
    </section>
  );
}

function PhotoWallPreview({ navigate }: { navigate: (p: Page) => void }) {
  return (
    <section className="bg-[#080f08] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div><SectionLabel>Mural de Memórias</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">Fotos da época</DisplayTitle></div>
          <Btn variant="ghost" onClick={() => navigate("photo-wall")}>Ver todas <ArrowRight size={16} /></Btn>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {PHOTOS.map(p => (
            <div key={p.id} onClick={() => navigate("photo-detail")}
              className="relative group cursor-pointer overflow-hidden bg-[#1a2e1a] aspect-[4/3]">
              <img src={p.url} alt={p.caption} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a120a] via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                <p className="text-[#f0ebe0] font-bold text-sm">{p.caption}</p>
                <p className="text-[#c9a84c] font-mono text-xs">{p.year}</p>
              </div>
              <div className="absolute top-3 left-3 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1">{p.year}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TimelineSection() {
  return (
    <section className="bg-[#f0ebe0] py-20 md:py-28">
      <div className="max-w-7xl mx-auto px-4">
        <SectionLabel>Nossa história</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl text-[#0d1a0f] mb-16">A linha do tempo da turma</DisplayTitle>
        <div className="flex flex-col">
          {TIMELINE.map((item, i) => (
            <div key={item.year} className="flex gap-6 md:gap-12">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 flex items-center justify-center font-['JetBrains_Mono'] font-bold text-sm shrink-0 ${item.year === "2026" ? "bg-[#2d6a4f] text-[#f0ebe0]" : "border-2 border-[#2d6a4f] text-[#2d6a4f]"}`}>
                  {item.year.slice(2)}
                </div>
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

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="bg-[#0d1a0f] py-20 md:py-28">
      <div className="max-w-3xl mx-auto px-4">
        <SectionLabel>Dúvidas frequentes</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-12">FAQ</DisplayTitle>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border border-[#2d6a4f]/25 bg-[#141f14]">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left gap-4">
                <p className="text-[#f0ebe0] font-semibold text-sm">{item.q}</p>
                <ChevronDown size={16} className={`text-[#c9a84c] shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
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

function LandingPage({ navigate }: { navigate: (p: Page) => void }) {
  return <>
    <Hero navigate={navigate} />
    <AboutSection />
    <EventInfoSection />
    <TicketsPreview navigate={navigate} />
    <WhoGoingPreview navigate={navigate} />
    <PhotoWallPreview navigate={navigate} />
    <TimelineSection />
    <FAQSection />
  </>;
}

// ─── TICKETS PAGE ─────────────────────────────────────────────────────────────

function TicketsPage({ navigate, ticketTypes: liveTypes }: { navigate: (p: Page) => void; ticketTypes: DbTicketType[] }) {
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
          <p className="text-[#7a9a7a] mt-4">Espaço Cultural Ponta Negra · Portas às 18h30</p>
        </div>
        <div className="flex flex-col gap-6">
          {displayTickets.map(t => (
            <div key={t.id}
              className={`border bg-[#141f14] p-6 md:p-8 ${t.status === "sold-out" ? "border-[#c0392b]/20 opacity-60" : t.status === "last-units" ? "border-[#c9a84c]/50" : "border-[#2d6a4f]/30"}`}>
              {t.status === "last-units" && (
                <div className="bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[10px] uppercase tracking-widest px-3 py-1.5 inline-block mb-4">
                  ⚡ Últimas {t.available} unidades
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
                    onClick={() => navigate("checkout")}>
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

function CheckoutPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [step, setStep]           = useState(1);
  const [form, setForm]           = useState({ name: "", email: "", phone: "", alumni: "" });
  const [companion, setCompanion] = useState(false);
  const [payment, setPayment]     = useState("pix");
  const [loading, setLoading]     = useState(false);
  const [payResult, setPayResult] = useState<"approved" | "declined" | null>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const steps = ["Seus dados", "Pagamento", "Processando"];

  function processPayment(result: "approved" | "declined") {
    setLoading(true);
    setPayResult(null);
    setTimeout(() => { setLoading(false); setPayResult(result); }, 2000);
  }

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
            <span className="text-[#7a9a7a] text-sm">Ingresso Individual — 1º Lote</span>
            <span className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-lg">R$ 120,00</span>
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
                <span className="text-[#7a9a7a]">Ingresso Individual × 1</span>
                <span className="text-[#f0ebe0]">R$ 120,00</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-[#f0ebe0]">Total</span>
                <span className="text-[#c9a84c] font-['Playfair_Display'] text-xl">R$ 120,00</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => { setStep(3); processPayment("approved"); }} disabled={loading}>
                {loading ? <><RefreshCw size={16} className="animate-spin" />Processando...</> : <><ArrowRight size={16} />Simular pagamento aprovado</>}
              </Btn>
              <Btn full variant="ghost" onClick={() => { setStep(3); processPayment("declined"); }} disabled={loading}>
                Simular pagamento recusado (demo)
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
                  <p className="text-[#c9a84c] font-['JetBrains_Mono'] font-bold text-xl tracking-wider">HC2006-0042</p>
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
          <p className="text-[#f0ebe0] font-['JetBrains_Mono'] font-bold text-lg tracking-widest mb-4">HC2006-0042</p>
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
          <Btn full onClick={() => navigate("alumni-area")}><Download size={16} />Ver meu ingresso</Btn>
          <Btn full variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={16} />Completar meu perfil</Btn>
          <Btn full variant="ghost" onClick={() => navigate("photo-wall")}><Upload size={16} />Enviar foto antiga</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── WHO GOING ────────────────────────────────────────────────────────────────

function WhoGoingPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [search, setSearch] = useState("");
  const confirmed = people.filter(a => a.profile_status === "confirmed" && a.is_visible);
  const filtered  = confirmed.filter(a => a.full_name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <SectionLabel>Reencontro 2026</SectionLabel>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <DisplayTitle className="text-5xl md:text-7xl">Quem Vai</DisplayTitle>
              <p className="text-[#7a9a7a] mt-3 font-mono text-sm">{confirmed.length} ex-alunos confirmados</p>
            </div>
            <Btn onClick={() => navigate("tickets")}>Garantir minha vaga</Btn>
          </div>
        </div>
        <div className="bg-[#141f14] border border-[#2d6a4f]/30 mb-8 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
          <input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-transparent text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 pl-12 pr-4 text-sm focus:outline-none" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
          {filtered.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} />)}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#7a9a7a]">
            <Users size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-mono text-sm">Nenhum resultado para &ldquo;{search}&rdquo;</p>
          </div>
        )}
        <div className="mt-8 bg-[#141f14] border border-[#2d6a4f]/20 p-4 flex items-start gap-3">
          <Shield size={16} className="text-[#2d6a4f] shrink-0 mt-0.5" />
          <p className="text-[#7a9a7a] text-xs">Apenas ex-alunos que autorizaram a exibição do nome aparecem nesta lista.</p>
        </div>
      </div>
    </div>
  );
}

// ─── THE CLASS PAGE ───────────────────────────────────────────────────────────

function TheClassPage({ navigate, people }: { navigate: (p: Page) => void; people: DbPerson[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const filtered = people.filter(a =>
    a.full_name.toLowerCase().includes(search.toLowerCase()) &&
    (filter === "all" || a.profile_status === filter)
  );
  return (
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
            <input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-transparent text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 pl-12 pr-4 text-sm focus:outline-none" />
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
          {filtered.map(a => <AlumniCard key={a.id} alumni={personToAlumni(a)} onClaim={() => navigate("claim-profile")} />)}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#7a9a7a]">
            <Users size={40} className="mx-auto mb-4 opacity-40" />
            <p className="font-mono text-sm">Nenhum resultado</p>
          </div>
        )}
      </div>
    </div>
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
              <p className="text-[#7a9a7a] text-sm">Para garantir sua identidade, responda às perguntas sobre o HC. Apenas ex-alunos saberão as respostas.</p>
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
              <Btn full variant="ghost" onClick={() => submitAnswers("rejected")} disabled={loading}>
                Simular rejeição (demo)
              </Btn>
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
              Identidade confirmada com sucesso. Seu perfil de ex-aluno está vinculado à sua conta.
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
              <p className="text-[#e74c3c] text-sm">As respostas não correspondem às informações esperadas para este perfil.</p>
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
  const [filter, setFilter]       = useState("all");
  const [uploadOpen, setUploadOpen] = useState(false);
  const years = ["all","2004","2005","2006"];

  return (
    <>
      <PhotoUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} auth={auth} navigate={navigate} />
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <SectionLabel>Mural de Memórias</SectionLabel>
              <DisplayTitle className="text-5xl md:text-7xl">Fotos da Época</DisplayTitle>
              <p className="text-[#7a9a7a] mt-2 font-mono text-sm">{photos.length} fotos · mais sendo adicionadas</p>
            </div>
            <Btn onClick={() => setUploadOpen(true)}><Upload size={16} />Enviar foto antiga</Btn>
          </div>
          <div className="flex gap-2 mb-8">
            {years.map(y => (
              <button key={y} onClick={() => setFilter(y)}
                className={`px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${filter === y ? "bg-[#2d6a4f] text-[#f0ebe0] border-[#2d6a4f]" : "border-[#2d6a4f]/30 text-[#7a9a7a] hover:border-[#2d6a4f]/60"}`}>
                {y === "all" ? "Todos os anos" : y}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            {photos.length === 0 && <EmptyState title="Nenhuma foto aprovada" subtitle="As fotos enviadas aparecem aqui apos moderacao." />}
            {photos.filter(p => filter === "all" || String(p.year_approx) === filter).map(p => (
              <div key={p.id} onClick={() => { onSelectPhoto(p.id); navigate("photo-detail"); }}
                className="relative group cursor-pointer overflow-hidden bg-[#1a2e1a] aspect-[4/3]">
                <img src={p.thumbnail_url ?? p.image_url} alt={p.caption ?? "Foto"} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080f08] via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-[#f0ebe0] font-bold text-sm leading-tight">{p.caption}</p>
                  <p className="text-[#7a9a7a] text-xs mt-1 flex items-center gap-1"><MapPin size={10} />{p.location_text}</p>
                </div>
                <div className="absolute top-3 left-3 bg-[#c9a84c] text-[#0d1a0f] font-mono font-bold text-[9px] uppercase tracking-wider px-2 py-1">{p.year_approx}</div>
              </div>
            ))}
          </div>
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
  const tagResults = people.filter(a =>
    a.full_name.toLowerCase().includes(tagSearch.toLowerCase()) && tagSearch.length > 1
  ).slice(0, 4);

  async function addTag(person: DbPerson) {
    if (!photo || !auth.loggedIn) { setError("Faca login para marcar pessoas."); return; }
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
      setMessage("Marcacao enviada para moderacao.");
      setTagSearch("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar marcacao.");
    }
  }

  async function requestRemoval() {
    if (!photo || !auth.loggedIn) { setError("Faca login para solicitar remocao."); return; }
    if (!removalReason.trim()) { setError("Informe o motivo da remocao."); return; }
    setError(""); setMessage("");
    try {
      await createPhotoRemovalRequest({
        photoId: photo.id,
        userId: auth.userId,
        requesterName: auth.name,
        requesterEmail: auth.email ?? "",
        reason: removalReason,
      });
      setMessage("Solicitacao de remocao enviada.");
      setShowRemoval(false);
      setRemovalReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao solicitar remocao.");
    }
  }

  if (!photo) {
    return (
      <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
        <div className="max-w-5xl mx-auto px-4">
          <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar ao mural</button>
          <EmptyState title="Foto nao encontrada" />
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
            </div>
          </div>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">{photo.year_approx} · {photo.location_text}</p>
              <DisplayTitle className="text-2xl md:text-3xl mb-2">{photo.caption}</DisplayTitle>
              <p className="text-[#7a9a7a] text-sm flex items-center gap-2"><MapPin size={14} />{photo.location_text}</p>
            </div>
            {message && <p className="text-[#74c69d] text-xs font-mono bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 px-4 py-3">{message}</p>}
            {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
            <div className="border-t border-[#2d6a4f]/20 pt-4">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">Marcar pessoas</p>
              <div className="relative mt-3">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input placeholder="Marcar alguem da turma..." value={tagSearch} onChange={e => setTagSearch(e.target.value)}
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
                <FieldArea label="Motivo da remocao" value={removalReason} onChange={setRemovalReason} />
                <div className="flex gap-2 mt-3">
                  <Btn size="sm" onClick={requestRemoval}>Enviar solicitacao</Btn>
                  <Btn size="sm" variant="ghost" onClick={() => setShowRemoval(false)}>Cancelar</Btn>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-3">
              <Btn full onClick={() => window.open(photo.image_url, "_blank")}><Download size={16} />Baixar foto</Btn>
              <Btn full variant="ghost" onClick={() => setShowRemoval(true)}><AlertCircle size={16} />Solicitar remocao da foto</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── ALUMNI AREA ──────────────────────────────────────────────────────────────

function AlumniAreaPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-start justify-between mb-10">
          <div>
            <SectionLabel>Área do Ex-Aluno</SectionLabel>
            <DisplayTitle className="text-3xl md:text-4xl">Olá, {auth.name.split(" ")[0]}!</DisplayTitle>
            <p className="text-[#7a9a7a] font-mono text-sm mt-1">&ldquo;Aninha&rdquo; · Turma 2006 — Sala A</p>
          </div>
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors" title="Sair">
            <LogOut size={20} />
          </button>
        </div>

        {/* Ticket card */}
        <div className="bg-[#141f14] border border-[#2d6a4f]/40 p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="bg-[#f0ebe0] p-6 mx-auto md:mx-0 w-32 h-32 flex items-center justify-center shrink-0">
              <QrCode size={72} className="text-[#0d1a0f]" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-1">Meu ingresso</p>
              <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-xl mb-1">Ingresso Individual — 1º Lote</p>
              <p className="text-[#7a9a7a] text-xs font-mono mb-3">HC2006-0042 · 17 Out 2026 · 19h00</p>
              <StatusBadge status="approved" />
            </div>
            <Btn onClick={() => {}} size="sm"><Download size={14} />Baixar</Btn>
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
                <p className="text-[#7a9a7a] text-xs font-mono">Médica · Natal, RN</p>
              </div>
            </div>
            <Btn full size="sm" variant="outline" onClick={() => navigate("edit-profile")}><Edit3 size={14} />Editar perfil</Btn>
          </div>
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-4">Status do pagamento</p>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-[#2d6a4f]" />
              <div>
                <p className="text-[#f0ebe0] font-semibold">Pagamento aprovado</p>
                <p className="text-[#7a9a7a] text-xs font-mono">PIX · R$ 120,00 · 05 Jul 2026</p>
              </div>
            </div>
            <StatusBadge status="approved" />
          </div>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Fotos em que apareci</p>
            <button onClick={() => navigate("photo-wall")} className="text-[#2d6a4f] text-xs font-mono uppercase hover:text-[#40916c]">Ver mural</button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {PHOTOS.slice(0,3).map(p => (
              <div key={p.id} onClick={() => navigate("photo-detail")} className="aspect-square overflow-hidden bg-[#1a2e1a] cursor-pointer group">
                <img src={p.url} alt={p.caption} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Btn full size="sm" variant="ghost" onClick={() => navigate("photo-wall")}><Upload size={14} />Enviar foto antiga</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── EDIT PROFILE ─────────────────────────────────────────────────────────────

function EditProfilePage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [privacy, setPrivacy] = useState({ showCity: true, showProfession: true, showSocial: false, showInList: true, allowTagging: true });
  const [saved, setSaved]     = useState(false);
  function save() { setSaved(true); setTimeout(() => setSaved(false), 2500); }

  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-2xl mx-auto px-4">
        <button onClick={() => navigate("alumni-area")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">
          <ArrowLeft size={16} /> Minha área
        </button>
        <SectionLabel>Perfil</SectionLabel>
        <DisplayTitle className="text-3xl md:text-4xl mb-10">Editar meu perfil</DisplayTitle>
        <SaveToast show={saved} />
        <div className="flex flex-col gap-6">
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-6">Foto de perfil</p>
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center text-[#f0ebe0] font-bold font-mono text-2xl shrink-0">AP</div>
              <div className="flex flex-col gap-2">
                <Btn size="sm" variant="outline"><Upload size={14} />Enviar foto</Btn>
                <p className="text-[#7a9a7a] text-xs font-mono">JPG ou PNG · máx 2 MB</p>
              </div>
            </div>
          </div>
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Informações pessoais</p>
            <Field label="Nome de exibição"  placeholder="Como você quer aparecer"           />
            <Field label="Apelido da época"  placeholder="Como te chamavam na escola"        />
            <Field label="Cidade atual"      placeholder="Onde você mora hoje" icon={<MapPin size={14} />} />
            <Field label="Profissão"         placeholder="O que você faz hoje"               />
            <FieldArea label="Mini bio"      placeholder="Conte um pouco sobre você hoje..." />
            <FieldArea label="Memória favorita do HC" placeholder="Uma memória que você nunca vai esquecer..." rows={2} />
          </div>
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 flex flex-col gap-5">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest">Redes sociais</p>
            <Field label="Instagram" placeholder="@seuperfil"               icon={<Instagram size={14} />} />
            <Field label="LinkedIn"  placeholder="linkedin.com/in/seuperfil" icon={<Linkedin  size={14} />} />
          </div>
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
            <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-widest mb-6">Privacidade</p>
            <div className="flex flex-col gap-4">
              {([
                ["showInList",     "Aparecer na lista de confirmados"],
                ["showCity",       "Exibir cidade atual"             ],
                ["showProfession", "Exibir profissão"                ],
                ["showSocial",     "Exibir redes sociais"            ],
                ["allowTagging",   "Permitir marcações em fotos"     ],
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
          <Btn full size="lg" onClick={save}><Save size={16} />Salvar alterações</Btn>
        </div>
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

function AdminPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [tab, setTab] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
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
  const [tagFilter, setTagFilter] = useState<"pending"|"approved"|"rejected">("pending");
  const [newAdmin, setNewAdmin] = useState({ userId: "", displayName: "", email: "", role: "viewer" as AdminRole });
  const [lotDraft, setLotDraft] = useState({ name: "", price: "", quantity: "" });
  const [settings, setSettings] = useState({
    name: "", date: "", time: "", venue: "", address: "", salesStatus: "closed",
    contactEmail: "", contactPhone: "", description: "", rules: "", companionPolicy: "", refundPolicy: "",
  });

  const role = auth.role ?? "viewer";
  const canManageEvent = role === "superadmin" || role === "admin";
  const canManageAdmins = role === "superadmin";
  const canModerate = role === "superadmin" || role === "admin" || role === "moderator";
  const canCheckin = role === "superadmin" || role === "admin" || role === "checkin_staff";
  const canExport = role !== "viewer";

  const tabs = [
    { id:"dashboard", label:"Dashboard", icon:<BarChart3 size={13} /> },
    { id:"orders", label:"Pedidos", icon:<Ticket size={13} /> },
    { id:"lots", label:"Lotes", icon:<Package size={13} />, disabled: !canManageEvent },
    { id:"reports", label:"Relatorios", icon:<Download size={13} /> },
    { id:"participants", label:"Participantes", icon:<Users size={13} /> },
    { id:"photos", label:"Fotos", icon:<Camera size={13} />, disabled: !canModerate },
    { id:"tag-mod", label:"Marcacoes", icon:<Tag size={13} />, disabled: !canModerate },
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
      const [eventData, lotData, orderData, peopleData, photoData, tagData, claimData, removalData, disputeData, adminData, auditData] = await Promise.all([
        getEventSettings(),
        getTicketTypesAdmin(),
        getOrdersByStatus(),
        getPeople(),
        getPendingPhotos(),
        getTagsForModeration(tagFilter),
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
        setReports(await getReports(eventData.id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados do admin.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAdminData(); }, [tagFilter]);

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

  if (!auth.isAdmin) return <PermissionState />;

  return (
    <div className="min-h-screen bg-[#080f08]">
      <div className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("home")} className="text-[#7a9a7a] hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Painel Admin</p>
            <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">Role: {role}</p>
          </div>
        </div>
        {canCheckin && <Btn size="sm" onClick={() => navigate("checkin")}><Scan size={14} />Check-in</Btn>}
      </div>

      <div className="flex overflow-x-auto border-b border-[#2d6a4f]/20 px-2">
        {tabs.map(t => (
          <button key={t.id} disabled={t.disabled} onClick={() => !t.disabled && setTab(t.id)}
            className={"flex items-center gap-1.5 px-4 py-4 text-[10px] font-mono uppercase tracking-wider whitespace-nowrap border-b-2 transition-colors disabled:opacity-30 " + (tab === t.id ? "border-[#c9a84c] text-[#c9a84c]" : "border-transparent text-[#7a9a7a] hover:text-[#f0ebe0]")}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

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
  const [query, setQuery]           = useState("");
  const [result, setResult]         = useState<"valid"|"used"|"invalid"|"pending"|"declined"|"cancelled"|null>(null);
  const [checkedIn, setCheckedIn]   = useState(false);
  const [checkinName, setCheckinName] = useState("");
  const [checkinTime, setCheckinTime] = useState("");

  const codeMap: Record<string, "valid"|"used"|"pending"|"declined"> = {
    "HC2006-0042": "valid", "HC2006-0041": "used", "HC2006-0040": "pending", "HC2006-0038": "declined",
  };
  const nameMap: Record<string, string> = {
    "HC2006-0042": "Ana Paula Oliveira", "HC2006-0041": "Bruno Cavalcanti",
    "HC2006-0040": "Carla Medeiros",     "HC2006-0038": "Gabriela Santos",
  };

  function doSearch() {
    if (!query.trim()) return;
    const upper = query.trim().toUpperCase();
    if (searchMode === "qr") {
      const r = codeMap[upper]; setResult(r || "invalid"); setCheckinName(nameMap[upper] || "");
    } else if (searchMode === "name") {
      // Em produção: chama /checkin?q=...&mode=name via servidor
      // Mock fallback: busca nos dados locais
      const found = MOCK_PEOPLE.find(a => a.full_name.toLowerCase().includes(query.toLowerCase()));
      if (found) { setResult(found.profile_status === "confirmed" ? "valid" : "pending"); setCheckinName(found.full_name); }
      else setResult("invalid");
    } else if (searchMode === "email") {
      if (query.includes("@")) { setResult("valid"); setCheckinName("Ana Paula Oliveira"); }
      else setResult("invalid");
    } else {
      if (query.length >= 8) { setResult("valid"); setCheckinName("Felipe Araújo"); }
      else setResult("invalid");
    }
  }

  function registerEntry() {
    const now = new Date();
    setCheckinTime(now.toLocaleTimeString("pt-BR", { hour:"2-digit", minute:"2-digit" }));
    setCheckedIn(true);
  }

  function reset() { setResult(null); setQuery(""); setCheckedIn(false); setCheckinName(""); setCheckinTime(""); }

  const modes = [
    { id:"qr" as const,    label:"QR / Código",  placeholder:"Ex: HC2006-0042"      },
    { id:"name" as const,  label:"Nome",          placeholder:"Nome do participante"  },
    { id:"email" as const, label:"E-mail",        placeholder:"email@exemplo.com"     },
    { id:"phone" as const, label:"Telefone",      placeholder:"(84) 9 9999-0000"      },
  ];

  return (
    <div className="min-h-screen bg-[#080f08]">
      <div className="bg-[#080f08] border-b border-[#2d6a4f]/20 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("admin")} className="text-[#7a9a7a] hover:text-[#f0ebe0]"><ArrowLeft size={20} /></button>
          <div>
            <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold">Check-in</p>
            <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">17 Out 2026 · 19h00</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#0d2e1a] border border-[#2d6a4f]/40 px-4 py-2">
          <div className="w-2 h-2 rounded-full bg-[#2d6a4f] animate-pulse" />
          <span className="text-[#74c69d] text-xs font-mono">0 check-ins hoje</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-10">
        {/* QR area */}
        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 mb-6 text-center">
          <div className="w-44 h-44 bg-[#1a2e1a] border-2 border-dashed border-[#2d6a4f]/40 flex flex-col items-center justify-center mx-auto mb-4">
            <Scan size={48} className="text-[#2d6a4f] mb-2" />
            <p className="text-[#7a9a7a] text-xs font-mono">Câmera do dispositivo</p>
            <p className="text-[#3a5a3a] text-[10px] font-mono">(protótipo visual)</p>
          </div>
          <p className="text-[#7a9a7a] text-sm">Aponte a câmera para o QR Code do ingresso</p>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-4">
          <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider">Busca manual</p>
          {/* Mode selector */}
          <div className="flex gap-1 bg-[#0a120a] p-1">
            {modes.map(m => (
              <button key={m.id} onClick={() => { setSearchMode(m.id); setQuery(""); setResult(null); }}
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
          {/* Quick test codes */}
          <div className="flex flex-wrap gap-2">
            {Object.keys(codeMap).map(code => (
              <button key={code} onClick={() => { setQuery(code); setSearchMode("qr"); setResult(null); }}
                className="text-[#c9a84c] font-mono text-[10px] border border-[#c9a84c]/30 px-3 py-1.5 hover:border-[#c9a84c]/60 transition-colors">
                {code}
              </button>
            ))}
          </div>
          <Btn full onClick={doSearch}>Verificar ingresso</Btn>
        </div>

        {/* POST CHECK-IN SUCCESS */}
        {result === "valid" && checkedIn && (
          <div className="mt-6 bg-[#0d2e1a] border-2 border-[#2d6a4f] p-10 text-center">
            <div className="w-20 h-20 bg-[#2d6a4f] flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-[#f0ebe0]" />
            </div>
            <DisplayTitle className="text-3xl mb-2">Entrada registrada!</DisplayTitle>
            <p className="text-[#74c69d] font-semibold text-lg mb-1">{checkinName}</p>
            <p className="text-[#7a9a7a] font-mono text-xs mb-1">Check-in realizado às {checkinTime}</p>
            <p className="text-[#3a5a3a] font-mono text-[10px] mb-6">Registrado por: Organização · 17 Out 2026</p>
            <Btn full onClick={reset}>Nova verificação</Btn>
          </div>
        )}

        {/* RESULT STATES */}
        {result && !checkedIn && (
          <div className={`mt-6 border p-8 text-center ${
            result === "valid"     ? "bg-[#0d2e1a] border-[#2d6a4f]"        :
            result === "used"      ? "bg-[#2e2a0a] border-[#c9a84c]/60"     :
            result === "pending"   ? "bg-[#1a1a0a] border-[#c9a84c]/40"     :
            result === "declined"  ? "bg-[#2e0a0a] border-[#c0392b]/60"     :
            result === "cancelled" ? "bg-[#1a0505] border-[#c0392b]/40"     :
                                     "bg-[#2e0a0a] border-[#c0392b]/60"
          }`}>
            {result === "valid" && (
              <>
                <CheckCircle2 size={48} className="text-[#2d6a4f] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-1">Ingresso válido</DisplayTitle>
                <p className="text-[#74c69d] font-semibold text-lg mb-1">{checkinName}</p>
                <p className="text-[#7a9a7a] font-mono text-xs mb-4">Ingresso Individual · 1º Lote</p>
                <Btn full className="mb-3" onClick={registerEntry}>Registrar entrada</Btn>
              </>
            )}
            {result === "used" && (
              <>
                <AlertTriangle size={48} className="text-[#c9a84c] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Já utilizado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm mb-2">{checkinName || "Este ingresso"} já registrou entrada às 19h23.</p>
                <p className="text-[#7a9a7a] text-xs font-mono">Verificar se outra pessoa apresentou o mesmo QR Code.</p>
              </>
            )}
            {result === "pending" && (
              <>
                <Clock size={48} className="text-[#c9a84c] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Pagamento pendente</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Pagamento não confirmado. Não autorizar a entrada sem aprovação do financeiro.</p>
              </>
            )}
            {result === "declined" && (
              <>
                <XCircle size={48} className="text-[#c0392b] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Pagamento recusado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">O pagamento deste ingresso foi recusado. <strong className="text-[#f0ebe0]">Entrada não autorizada.</strong></p>
              </>
            )}
            {result === "cancelled" && (
              <>
                <XCircle size={48} className="text-[#c0392b] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Ingresso cancelado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Este ingresso foi cancelado e não dá direito à entrada.</p>
              </>
            )}
            {result === "invalid" && (
              <>
                <AlertCircle size={48} className="text-[#c0392b] mx-auto mb-4" />
                <DisplayTitle className="text-2xl mb-2">Não encontrado</DisplayTitle>
                <p className="text-[#7a9a7a] text-sm">Nenhum ingresso encontrado para &ldquo;{query}&rdquo;.</p>
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
    { title: "1. Dados que coletamos",               body: "Nome completo, e-mail, telefone/WhatsApp, CPF (para compra de ingresso), cidade de residência, profissão, fotos enviadas voluntariamente, respostas às perguntas de verificação de identidade, e dados de navegação como logs de acesso." },
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

const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile"];
const PROTECTED_ADMIN:  Page[] = ["admin", "checkin"];

export default function App() {
  const [page, setPage]               = useState<Page>("home");
  const [returnPage, setReturnPage]   = useState<Page>("home");
  const [auth, setAuth]               = useState<AuthState>({ loggedIn: false, isAdmin: false, name: "", userId: "", role: null });
  const [people, setPeople]           = useState<DbPerson[]>(MOCK_PEOPLE);
  const [ticketTypes, setTicketTypes] = useState<DbTicketType[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<DbPhoto[]>([]);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
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
  }, []);

  function navigate(p: Page) {
    if (PROTECTED_ADMIN.includes(p)  && !auth.isAdmin)  { setReturnPage(p); setPage("login"); window.scrollTo(0, 0); return; }
    if (PROTECTED_ALUMNI.includes(p) && !auth.loggedIn) { setReturnPage(p); setPage("login"); window.scrollTo(0, 0); return; }
    setPage(p);
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
        {page === "home"          && <LandingPage      navigate={navigate}                                            />}
        {page === "tickets"       && <TicketsPage       navigate={navigate} ticketTypes={ticketTypes}             />}
        {page === "checkout"      && <CheckoutPage      navigate={navigate} auth={auth}                           />}
        {page === "confirmation"  && <ConfirmationPage  navigate={navigate}                                        />}
        {page === "who-going"     && <WhoGoingPage      navigate={navigate} people={people}                       />}
        {page === "the-class"     && <TheClassPage      navigate={navigate} people={people}                       />}
        {page === "claim-profile" && <ClaimProfilePage  navigate={navigate} people={people} auth={auth}           />}
        {page === "photo-wall"    && <PhotoWallPage      navigate={navigate} auth={auth} photos={approvedPhotos} onSelectPhoto={setSelectedPhotoId} />}
        {page === "photo-detail"  && <PhotoDetailPage    navigate={navigate} people={people} auth={auth} photo={approvedPhotos.find(p => p.id === selectedPhotoId) ?? approvedPhotos[0] ?? null} />}
        {page === "alumni-area"   && <AlumniAreaPage     navigate={navigate} auth={auth}                          />}
        {page === "edit-profile"  && <EditProfilePage   navigate={navigate} auth={auth}                           />}
        {page === "admin"         && <AdminPage          navigate={navigate} auth={auth}                           />}
        {page === "checkin"       && <CheckinPage        navigate={navigate} auth={auth}                           />}
        {page === "login"         && <LoginPage          navigate={navigate} onLogin={handleLogin}                 />}
        {page === "terms"         && <TermsPage          navigate={navigate}                                        />}
        {page === "privacy"       && <PrivacyPage        navigate={navigate}                                        />}
      </main>
      {!isFullscreen && <Footer navigate={navigate} />}
    </div>
  );
}
