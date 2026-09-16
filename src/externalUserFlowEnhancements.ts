import { supabase } from "./lib/supabase";

const CLAIM_ROUTES = new Set(["/reivindicar-perfil", "/reinvidicar-perfil"]);
const PENDING_KEY = "hc-pending-external-profile-v1";
const STYLE_ID = "hc-external-user-flow-style";
const MOUNT_ATTRIBUTE = "data-hc-external-user-entry";
const FORM_ATTRIBUTE = "data-hc-external-user-form";

type ExternalProfilePayload = {
  fullName: string;
  email: string;
  whatsapp: string;
  city: string;
  profession: string;
};

type ExternalRegistrationRpc = {
  rpc: (
    fn: "register_external_user_profile",
    args: {
      p_full_name: string;
      p_contact_email: string;
      p_contact_whatsapp: string;
      p_current_city: string | null;
      p_profession: string | null;
    },
  ) => Promise<{ data: unknown; error: { message?: string; code?: string } | null }>;
};

let scheduled = false;
let resumeInFlight = false;
let externalAccount: boolean | null = null;

function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

function normalize(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    [${MOUNT_ATTRIBUTE}] { margin-top: 1rem; border-top: 1px solid rgba(45,106,79,.28); padding-top: 1rem; }
    [${MOUNT_ATTRIBUTE}] > p { margin: 0 0 .75rem; color: #7a9a7a; font-size: .82rem; line-height: 1.55; }
    [data-hc-external-user-button] { width: 100%; min-height: 3.25rem; border: 1px solid rgba(201,168,76,.7); background: transparent; color: #c9a84c; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .74rem; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
    [data-hc-external-user-button]:hover { background: rgba(201,168,76,.08); }
    [${FORM_ATTRIBUTE}] { margin-top: 1rem; border: 1px solid rgba(45,106,79,.35); background: #0d1a0f; padding: 1.25rem; }
    [${FORM_ATTRIBUTE}] h3 { margin: 0; color: #f0ebe0; font-family: "Playfair Display", Georgia, serif; font-size: 1.45rem; }
    [${FORM_ATTRIBUTE}] .hc-external-intro { margin: .5rem 0 1.25rem; color: #8ab89a; font-size: .86rem; line-height: 1.6; }
    [${FORM_ATTRIBUTE}] .hc-external-grid { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: .9rem; }
    [${FORM_ATTRIBUTE}] label.hc-external-field { display: flex; flex-direction: column; gap: .4rem; color: #8ab89a; font-size: .75rem; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; letter-spacing: .05em; text-transform: uppercase; }
    [${FORM_ATTRIBUTE}] label.hc-external-field[data-wide="true"] { grid-column: 1 / -1; }
    [${FORM_ATTRIBUTE}] input[type="text"], [${FORM_ATTRIBUTE}] input[type="email"], [${FORM_ATTRIBUTE}] input[type="password"], [${FORM_ATTRIBUTE}] input[type="tel"] { width: 100%; box-sizing: border-box; border: 1px solid rgba(45,106,79,.4); background: #141f14; color: #f0ebe0; padding: .85rem .9rem; outline: none; font: inherit; text-transform: none; letter-spacing: normal; }
    [${FORM_ATTRIBUTE}] input:focus { border-color: #c9a84c; }
    [${FORM_ATTRIBUTE}] .hc-external-terms { display: flex; gap: .65rem; align-items: flex-start; margin: 1rem 0; color: #8ab89a; font-size: .78rem; line-height: 1.5; }
    [${FORM_ATTRIBUTE}] .hc-external-terms a { color: #c9a84c; text-decoration: underline; }
    [${FORM_ATTRIBUTE}] [data-external-submit] { width: 100%; min-height: 3.4rem; border: 0; background: #2d6a4f; color: #fff; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; cursor: pointer; }
    [${FORM_ATTRIBUTE}] [data-external-submit]:disabled { opacity: .55; cursor: wait; }
    [${FORM_ATTRIBUTE}] [data-external-status] { margin: .85rem 0 0; font-size: .82rem; line-height: 1.55; color: #8ab89a; }
    [${FORM_ATTRIBUTE}] [data-external-status][data-tone="error"] { color: #f2a399; }
    [${FORM_ATTRIBUTE}] [data-external-status][data-tone="success"] { color: #74c69d; }
    [data-hc-external-checkout="true"] [data-hc-external-hidden="true"] { display: none !important; }
    @media (max-width: 640px) {
      [${FORM_ATTRIBUTE}] { padding: 1rem; }
      [${FORM_ATTRIBUTE}] .hc-external-grid { grid-template-columns: 1fr; }
      [${FORM_ATTRIBUTE}] label.hc-external-field[data-wide="true"] { grid-column: auto; }
    }
  `;
  document.head.appendChild(style);
}

function readPending(): ExternalProfilePayload | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExternalProfilePayload;
    return parsed?.fullName && parsed?.email && parsed?.whatsapp ? parsed : null;
  } catch {
    return null;
  }
}

function savePending(payload: ExternalProfilePayload) {
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(payload));
}

function clearPending() {
  window.localStorage.removeItem(PENDING_KEY);
}

function externalRegistrationError(error: { message?: string; code?: string } | null) {
  const message = String(error?.message ?? "");
  if (message.includes("external_registration_conflicts_with_alumni_profile")) return "Esta conta já está vinculada a um ex-aluno da turma.";
  if (message.includes("external_email_mismatch")) return "O e-mail informado precisa ser o mesmo da conta conectada.";
  if (message.includes("external_whatsapp_required")) return "Informe um WhatsApp válido.";
  if (message.includes("external_email_invalid")) return "Informe um e-mail válido.";
  if (message.includes("external_name_required")) return "Informe seu nome completo.";
  if (message.includes("authentication_required")) return "Entre na sua conta para continuar.";
  return "Não foi possível concluir o cadastro como Usuário Externo. Tente novamente.";
}

async function registerExternalProfile(payload: ExternalProfilePayload) {
  const client = supabase as unknown as ExternalRegistrationRpc;
  const { error } = await client.rpc("register_external_user_profile", {
    p_full_name: payload.fullName.trim(),
    p_contact_email: payload.email.trim().toLowerCase(),
    p_contact_whatsapp: payload.whatsapp.trim(),
    p_current_city: payload.city.trim() || null,
    p_profession: payload.profession.trim() || null,
  });
  if (error) throw new Error(externalRegistrationError(error));
  externalAccount = true;
}

async function resumePendingExternalRegistration() {
  if (resumeInFlight) return;
  const pending = readPending();
  if (!pending) return;

  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;
  if (normalize(session.user.email) !== normalize(pending.email)) return;

  resumeInFlight = true;
  try {
    await registerExternalProfile(pending);
    clearPending();
    window.sessionStorage.setItem("hc-external-registration-complete", "true");
    if (currentPath() !== "/checkout") window.location.assign("/ingressos");
  } catch (error) {
    console.error("[Usuário Externo] Não foi possível retomar o cadastro.", error);
  } finally {
    resumeInFlight = false;
  }
}

function setStatus(form: HTMLElement, message: string, tone: "muted" | "success" | "error" = "muted") {
  const status = form.querySelector<HTMLElement>("[data-external-status]");
  if (!status) return;
  status.textContent = message;
  status.dataset.tone = tone;
}

function field(labelText: string, type: string, name: string, placeholder: string, wide = false) {
  const label = document.createElement("label");
  label.className = "hc-external-field";
  if (wide) label.dataset.wide = "true";
  label.textContent = labelText;
  const input = document.createElement("input");
  input.type = type;
  input.name = name;
  input.placeholder = placeholder;
  input.autocomplete = name === "email" ? "email" : name === "whatsapp" ? "tel" : name.includes("password") ? "new-password" : "off";
  label.appendChild(input);
  return label;
}

function formValue(form: HTMLElement, name: string) {
  return form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.value.trim() ?? "";
}

function createExternalForm() {
  const form = document.createElement("div");
  form.setAttribute(FORM_ATTRIBUTE, "true");

  const title = document.createElement("h3");
  title.textContent = "Continuar como Usuário Externo";
  const intro = document.createElement("p");
  intro.className = "hc-external-intro";
  intro.textContent = "Se seu nome não estiver na lista da Turma 2006, crie um acesso externo para comprar seu ingresso. Seu cadastro não será exibido no diretório de ex-alunos.";

  const grid = document.createElement("div");
  grid.className = "hc-external-grid";
  grid.append(
    field("Nome completo", "text", "fullName", "Seu nome completo", true),
    field("E-mail", "email", "email", "voce@exemplo.com"),
    field("WhatsApp", "tel", "whatsapp", "(84) 99999-9999"),
    field("Cidade (opcional)", "text", "city", "Cidade / UF"),
    field("Profissão (opcional)", "text", "profession", "Sua profissão"),
  );

  const authFields = document.createElement("div");
  authFields.className = "hc-external-grid";
  authFields.dataset.externalAuthFields = "true";
  authFields.style.marginTop = ".9rem";
  authFields.append(
    field("Crie uma senha", "password", "password", "Mínimo de 8 caracteres"),
    field("Repita a senha", "password", "confirmPassword", "Repita a senha"),
  );

  const terms = document.createElement("label");
  terms.className = "hc-external-terms";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = "terms";
  const termsText = document.createElement("span");
  termsText.innerHTML = 'Li e aceito os <a href="/termos">Termos de Uso</a> e a <a href="/privacidade">Política de Privacidade</a>.';
  terms.append(checkbox, termsText);

  const submit = document.createElement("button");
  submit.type = "button";
  submit.dataset.externalSubmit = "true";
  submit.textContent = "Criar acesso e continuar";

  const status = document.createElement("p");
  status.dataset.externalStatus = "true";
  status.dataset.tone = "muted";
  status.textContent = "O ingresso de Usuário Externo custa o valor integral vigente.";

  form.append(title, intro, grid, authFields, terms, submit, status);

  void supabase.auth.getSession().then(({ data: { session } }) => {
    if (!session?.user) return;
    authFields.hidden = true;
    const email = form.querySelector<HTMLInputElement>('input[name="email"]');
    if (email && session.user.email) {
      email.value = session.user.email;
      email.readOnly = true;
    }
    if (session.user.user_metadata?.full_name) {
      const fullName = form.querySelector<HTMLInputElement>('input[name="fullName"]');
      if (fullName && !fullName.value) fullName.value = String(session.user.user_metadata.full_name);
    }
  });

  submit.addEventListener("click", async () => {
    const payload: ExternalProfilePayload = {
      fullName: formValue(form, "fullName"),
      email: formValue(form, "email").toLowerCase(),
      whatsapp: formValue(form, "whatsapp"),
      city: formValue(form, "city"),
      profession: formValue(form, "profession"),
    };
    const accepted = Boolean(form.querySelector<HTMLInputElement>('input[name="terms"]')?.checked);
    if (!payload.fullName) return setStatus(form, "Informe seu nome completo.", "error");
    if (!/^\S+@\S+\.\S+$/.test(payload.email)) return setStatus(form, "Informe um e-mail válido.", "error");
    if (payload.whatsapp.replace(/\D/g, "").length < 10) return setStatus(form, "Informe um WhatsApp válido, com DDD.", "error");
    if (!accepted) return setStatus(form, "Aceite os Termos de Uso e a Política de Privacidade para continuar.", "error");

    submit.disabled = true;
    submit.textContent = "Preparando acesso...";
    setStatus(form, "Validando seus dados...");

    try {
      let { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        const password = formValue(form, "password");
        const confirmation = formValue(form, "confirmPassword");
        if (password.length < 8) throw new Error("Crie uma senha com pelo menos 8 caracteres.");
        if (password !== confirmation) throw new Error("As senhas não conferem.");

        const signUp = await supabase.auth.signUp({
          email: payload.email,
          password,
          options: { data: { full_name: payload.fullName, account_type: "external" } },
        });
        if (signUp.error) {
          if (/already|registered|exists/i.test(signUp.error.message)) {
            savePending(payload);
            throw new Error("Este e-mail já possui uma conta. Faça login com ele; o cadastro externo será retomado automaticamente.");
          }
          throw signUp.error;
        }
        session = signUp.data.session;
        if (!session) {
          savePending(payload);
          setStatus(form, "Conta criada. Confirme o e-mail enviado para continuar; depois da confirmação, você seguirá para os ingressos.", "success");
          submit.textContent = "Aguardando confirmação do e-mail";
          return;
        }
      }

      if (normalize(session.user.email) !== normalize(payload.email)) {
        throw new Error("O e-mail informado precisa ser o mesmo da conta conectada.");
      }

      await registerExternalProfile(payload);
      clearPending();
      setStatus(form, "Cadastro concluído. Abrindo os ingressos...", "success");
      window.setTimeout(() => window.location.assign("/ingressos"), 700);
    } catch (error) {
      setStatus(form, error instanceof Error ? error.message : "Não foi possível criar o acesso externo.", "error");
    } finally {
      if (!readPending()) {
        submit.disabled = false;
        submit.textContent = "Criar acesso e continuar";
      }
    }
  });

  return form;
}

function findClaimCard(input: HTMLInputElement) {
  let current: HTMLElement | null = input.parentElement;
  for (let depth = 0; current && depth < 7; depth += 1) {
    if (normalize(current.textContent).includes("encontre seu nome na lista pre-cadastrada")) return current;
    current = current.parentElement;
  }
  return input.parentElement?.parentElement ?? null;
}

function mountClaimExternalEntry() {
  if (!CLAIM_ROUTES.has(currentPath())) return;
  const input = Array.from(document.querySelectorAll<HTMLInputElement>("input"))
    .find(item => normalize(item.placeholder).includes("digite seu nome completo"));
  if (!input) return;
  const card = findClaimCard(input);
  if (!card || card.querySelector(`[${MOUNT_ATTRIBUTE}]`)) return;

  const mount = document.createElement("div");
  mount.setAttribute(MOUNT_ATTRIBUTE, "true");
  const helper = document.createElement("p");
  helper.textContent = "Não encontrou seu nome? Você ainda pode criar uma conta e comprar o ingresso sem entrar na lista pública da turma.";
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.hcExternalUserButton = "true";
  button.textContent = "Meu nome não está na lista";
  button.addEventListener("click", () => {
    const current = mount.querySelector<HTMLElement>(`[${FORM_ATTRIBUTE}]`);
    if (current) {
      current.remove();
      button.textContent = "Meu nome não está na lista";
      return;
    }
    mount.appendChild(createExternalForm());
    button.textContent = "Fechar cadastro externo";
  });
  mount.append(helper, button);
  card.appendChild(mount);
}

async function detectExternalAccount() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    externalAccount = false;
    return false;
  }

  const query = await supabase
    .from("profiles")
    .select("person_id,people(person_type)")
    .eq("user_id", session.user.id)
    .maybeSingle();
  const row = query.data as unknown as { people?: { person_type?: string } | Array<{ person_type?: string }> } | null;
  const person = Array.isArray(row?.people) ? row?.people[0] : row?.people;
  externalAccount = person?.person_type === "external";
  return externalAccount;
}

function applyExternalCheckoutUi() {
  if (currentPath() !== "/checkout" || externalAccount !== true) {
    document.documentElement.removeAttribute("data-hc-external-checkout");
    return;
  }
  document.documentElement.setAttribute("data-hc-external-checkout", "true");

  const headings = Array.from(document.querySelectorAll<HTMLElement>("h1,h2,h3"));
  const peopleHeading = headings.find(item => normalize(item.textContent) === "quem vai com voce?");
  if (peopleHeading) {
    peopleHeading.textContent = "Seu ingresso";
    const description = peopleHeading.parentElement?.querySelector("p");
    if (description) description.textContent = "Você está comprando como Usuário Externo. Este cadastro permite um ingresso individual pelo valor integral vigente.";
    const headerRow = peopleHeading.parentElement?.parentElement;
    const count = headerRow?.querySelector<HTMLElement>("span.font-mono");
    if (count) count.dataset.hcExternalHidden = "true";
  }

  Array.from(document.querySelectorAll<HTMLButtonElement>("button")).forEach(button => {
    const text = normalize(button.textContent);
    if (text.includes("adicionar conjuge") || text.includes("adicionar filho") || text.includes("remover conjuge")) {
      button.dataset.hcExternalHidden = "true";
    }
  });

  Array.from(document.querySelectorAll<HTMLElement>("p"))
    .filter(item => normalize(item.textContent) === "ex-aluno")
    .forEach(item => { item.textContent = "Usuário externo"; });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  window.requestAnimationFrame(() => {
    scheduled = false;
    mountClaimExternalEntry();
    applyExternalCheckoutUi();
  });
}

function refreshForRoute() {
  if (currentPath() === "/checkout") {
    externalAccount = null;
    void detectExternalAccount().then(schedule).catch(() => {
      externalAccount = false;
      schedule();
    });
  }
  schedule();
}

export function installExternalUserFlowEnhancements() {
  if (typeof window === "undefined" || typeof document === "undefined" || typeof MutationObserver === "undefined") return;
  if (document.documentElement.dataset.hcExternalUserFlow === "true") return;
  document.documentElement.dataset.hcExternalUserFlow = "true";
  injectStyles();

  const start = () => {
    if (!document.body) return;
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener("popstate", refreshForRoute);
    window.addEventListener("pushstate", refreshForRoute as EventListener);
    supabase.auth.onAuthStateChange(() => window.setTimeout(() => {
      void resumePendingExternalRegistration();
      refreshForRoute();
    }, 0));
    void resumePendingExternalRegistration();
    refreshForRoute();
  };

  if (document.body) start();
  else window.addEventListener("DOMContentLoaded", start, { once: true });
}
