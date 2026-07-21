import type { CompleteProfileRegistrationParams } from "./services";

const STORAGE_KEY = "hc-pending-profile-claim-v3";
const MAX_PENDING_AGE_MS = 48 * 60 * 60 * 1000;
const SURNAME_PARTICLES = new Set(["de", "da", "do", "dos", "das"]);

export interface PendingProfileRegistration {
  registration: CompleteProfileRegistrationParams;
  questionnaireAnswers: Record<string, string[]>;
  createdAt: string;
}

export interface ProfileIdentityVerificationEvidence {
  id?: string;
  declared_birth_date?: string | null;
  created_at?: string | null;
  claimant_user_id?: string | null;
  claimant_email?: string | null;
  penultimate_surname_answer?: string | null;
  class_group_answer?: string | null;
}

export function normalizeProfileIdentityText(value?: string | number | null): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function getProfileClaimPenultimateSurname(fullName: string): string {
  const significantParts = String(fullName ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter(part => !SURNAME_PARTICLES.has(normalizeProfileIdentityText(part)));

  if (significantParts.length >= 2) return significantParts[significantParts.length - 2];
  return significantParts[0] ?? "";
}

export function isValidDeclaredBirthDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

export function persistPendingProfileRegistration(payload: PendingProfileRegistration): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // O fluxo principal não deve falhar quando o armazenamento local estiver indisponível.
  }
}

export function readPendingProfileRegistration(): PendingProfileRegistration | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingProfileRegistration>;
    const createdAtMs = Date.parse(String(parsed.createdAt ?? ""));
    const expired = !Number.isFinite(createdAtMs) || Date.now() - createdAtMs > MAX_PENDING_AGE_MS;
    if (expired || !parsed.registration || typeof parsed.registration.personId !== "string") {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return {
      registration: parsed.registration as CompleteProfileRegistrationParams,
      questionnaireAnswers: parsed.questionnaireAnswers ?? {},
      createdAt: String(parsed.createdAt),
    };
  } catch {
    return null;
  }
}

export function clearPendingProfileRegistration(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Sem ação: a limpeza será tentada novamente em uma próxima sessão.
  }
}

function formatDateOnly(value?: string | null): string {
  if (!value) return "";
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : value;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export function formatProfileClaimDisputeSubtitle(dispute: unknown): string {
  const row = (dispute ?? {}) as {
    person_id?: string;
    requester_name?: string;
    reason?: string;
    people?: { full_name?: string | null } | null;
    identity_verification?: ProfileIdentityVerificationEvidence | null;
  };
  const person = row.people?.full_name ?? row.person_id ?? "Perfil não identificado";
  const reason = row.reason ?? "Sem justificativa informada";
  const evidence = row.identity_verification;

  if (!evidence?.declared_birth_date) {
    return `${person} · ${reason} · Data não registrada — reivindicação anterior a esta atualização`;
  }

  const claimant = evidence.claimant_email || evidence.claimant_user_id || "Usuário não identificado";
  const claimedAt = formatDateTime(evidence.created_at);
  return `${person} · ${reason} · Data declarada: ${formatDateOnly(evidence.declared_birth_date)} · Reivindicação: ${claimedAt || "data não registrada"} · Usuário: ${claimant}`;
}
