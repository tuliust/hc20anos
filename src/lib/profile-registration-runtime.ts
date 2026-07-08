type RegistrationPerson = {
  id: string;
  full_name: string;
  class_year: number;
  class_group: string | null;
  birth_year: number | null;
  nickname_at_school: string | null;
  profile_status: string;
  claimed_by_user_id: string | null;
  avatar_url?: string | null;
};

type RegistrationState = {
  people: RegistrationPerson[];
  loading: boolean;
  step: "select" | "verify" | "profile" | "account" | "done";
  search: string;
  selected: RegistrationPerson | null;
  answers: Record<string, string>;
  error: string;
  busy: boolean;
  profile: {
    displayName: string;
    nickname: string;
    profession: string;
    city: string;
    state: string;
    country: string;
    bio: string;
  };
  account: {
    email: string;
    whatsapp: string;
    password: string;
    confirmPassword: string;
  };
  photoFile: File | null;
  photoPreview: string | null;
};

const registrationState: RegistrationState = {
  people: [],
  loading: false,
  step: "select",
  search: "",
  selected: null,
  answers: {},
  error: "",
  busy: false,
  profile: {
    displayName: "",
    nickname: "",
    profession: "",
    city: "",
    state: "",
    country: "Brasil",
    bio: "",
  },
  account: {
    email: "",
    whatsapp: "",
    password: "",
    confirmPassword: "",
  },
  photoFile: null,
  photoPreview: null,
};

function normalizeRegistrationValue(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function escapeRegistrationHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function penultimateSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return parts[parts.length - 2];
}

function uniqueOptions(values: Array<string | number | null | undefined>, fallback: string[] = []) {
  return Array.from(new Set([...values, ...fallback]
    .filter(value => value !== null && value !== undefined && String(value).trim().length > 0)
    .map(value => String(value))));
}

function optionButton(questionKey: string, value: string, label = value) {
  const selected = registrationState.answers[questionKey] === value;
  return `
    <button type="button" data-answer-key="${questionKey}" data-answer-value="${escapeRegistrationHtml(value)}"
      class="text-left px-4 py-3 border text-sm transition-colors ${selected ? "bg-[#2d6a4f] border-[#2d6a4f] text-[#f0ebe0]" : "border-[#2d6a4f]/30 text-[#8ab89a] hover:border-[#2d6a4f]/70"}">
      ${escapeRegistrationHtml(label)}
    </button>
  `;
}

async function getRegistrationModules() {
  const [supabaseModule, servicesModule] = await Promise.all([
    import("./supabase"),
    import("./services"),
  ]);
  return { supabase: supabaseModule.supabase, services: servicesModule };
}

async function loadRegistrationPeople() {
  if (registrationState.loading || registrationState.people.length > 0) return;
  registrationState.loading = true;
  try {
    const { services } = await getRegistrationModules();
    const people = await services.getPeople();
    registrationState.people = (people as RegistrationPerson[])
      .filter(person => person.is_visible !== false)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
  } finally {
    registrationState.loading = false;
  }
}

function registrationRoot() {
  return document.querySelector<HTMLElement>("[data-registration-runtime='root']");
}

function registrationShell() {
  return `
    <div class="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div class="max-w-3xl mx-auto px-4">
        <button type="button" data-registration-back class="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors">← Voltar</button>
        <p class="text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5">Cadastro de ex-aluno</p>
        <h1 class="font-['Playfair_Display'] text-[#f0ebe0] text-4xl md:text-5xl font-black mb-4">Criar minha conta</h1>
        <p class="text-[#8ab89a] text-sm leading-relaxed mb-10 max-w-2xl">Selecione seu nome, confirme três dados de validação e complete seu perfil público antes de criar seu login.</p>
        <div data-registration-runtime="root"></div>
      </div>
    </div>
  `;
}

function mountRegistrationFlow() {
  if (window.location.pathname !== "/reivindicar-perfil") return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (main.dataset.registrationRuntimeMounted !== "true") {
    main.dataset.registrationRuntimeMounted = "true";
    main.innerHTML = registrationShell();
    main.querySelector<HTMLElement>("[data-registration-back]")!.onclick = () => navigateRegistrationTo("/turma");
  }
  loadRegistrationPeople().finally(renderRegistrationFlow);
  renderRegistrationFlow();
}

function navigateRegistrationTo(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

function renderRegistrationFlow() {
  const root = registrationRoot();
  if (!root) return;

  if (registrationState.loading) {
    root.innerHTML = `<div class="bg-[#141f14] border border-[#2d6a4f]/30 p-8 text-[#7a9a7a] text-sm">Carregando lista da turma...</div>`;
    return;
  }

  if (registrationState.step === "select") renderSelectStep(root);
  else if (registrationState.step === "verify") renderVerifyStep(root);
  else if (registrationState.step === "profile") renderProfileStep(root);
  else if (registrationState.step === "account") renderAccountStep(root);
  else renderDoneStep(root);
}

function stepErrorHtml() {
  if (!registrationState.error) return "";
  return `<p class="bg-[#2e0a0a] border border-[#c0392b]/50 text-[#e74c3c] px-4 py-3 text-xs font-mono mb-5">${escapeRegistrationHtml(registrationState.error)}</p>`;
}

function renderSelectStep(root: HTMLElement) {
  const query = normalizeRegistrationValue(registrationState.search);
  const results = registrationState.people
    .filter(person => query.length < 2 || normalizeRegistrationValue(person.full_name).includes(query))
    .slice(0, 30);

  root.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${stepErrorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-2">1. Selecione seu nome na lista</p>
      <p class="text-[#7a9a7a] text-sm mb-5">Use o nome completo pré-cadastrado pela organização.</p>
      <input data-registration-search value="${escapeRegistrationHtml(registrationState.search)}" placeholder="Digite seu nome completo..." class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f] mb-5" />
      <div class="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
        ${results.map(person => {
          const disabled = person.claimed_by_user_id && person.profile_status === "confirmed";
          return `
            <button type="button" data-select-person="${person.id}" ${disabled ? "disabled" : ""}
              class="flex items-center justify-between gap-4 p-4 border text-left transition-colors ${disabled ? "opacity-50 cursor-not-allowed border-[#2d6a4f]/10" : "border-[#2d6a4f]/20 hover:border-[#2d6a4f]/60"}">
              <div>
                <p class="text-[#f0ebe0] font-semibold text-sm">${escapeRegistrationHtml(person.full_name)}</p>
                <p class="text-[#c9a84c] text-xs font-mono mt-1">Turma ${escapeRegistrationHtml(person.class_group ?? "-")} · ${escapeRegistrationHtml(person.birth_year ?? "ano não informado")}</p>
              </div>
              <span class="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider">${disabled ? "Já vinculado" : "Selecionar"}</span>
            </button>
          `;
        }).join("")}
      </div>
    </div>
  `;

  root.querySelector<HTMLInputElement>("[data-registration-search]")!.oninput = event => {
    registrationState.search = (event.currentTarget as HTMLInputElement).value;
    renderRegistrationFlow();
  };
  root.querySelectorAll<HTMLButtonElement>("[data-select-person]").forEach(button => {
    button.onclick = () => {
      const person = registrationState.people.find(item => item.id === button.dataset.selectPerson);
      if (!person) return;
      registrationState.selected = person;
      registrationState.profile.displayName = person.full_name;
      registrationState.profile.nickname = person.nickname_at_school ?? "";
      registrationState.answers = {};
      registrationState.error = "";
      registrationState.step = "verify";
      renderRegistrationFlow();
    };
  });
}

function renderVerifyStep(root: HTMLElement) {
  const person = registrationState.selected;
  if (!person) { registrationState.step = "select"; renderRegistrationFlow(); return; }

  const expectedSurname = penultimateSurname(person.full_name);
  const surnameOptions = uniqueOptions(
    [expectedSurname, ...registrationState.people.map(p => penultimateSurname(p.full_name)).filter(s => normalizeRegistrationValue(s) !== normalizeRegistrationValue(expectedSurname)).slice(0, 5)],
    ["Silva", "Souza", "Oliveira"]
  ).slice(0, 4).sort(() => 0.5 - Math.random());
  const classOptions = uniqueOptions([person.class_group, "A", "B", "C", "D"]).slice(0, 4);
  const year = Number(person.birth_year ?? 0);
  const yearOptions = uniqueOptions([year, year - 1, year + 1, year + 2].filter(v => v > 1900)).slice(0, 4);

  root.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${stepErrorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-1">2. Confirme seus dados</p>
      <p class="text-[#7a9a7a] text-sm mb-6">Perfil selecionado: <span class="text-[#f0ebe0]">${escapeRegistrationHtml(person.full_name)}</span></p>
      <div class="flex flex-col gap-6">
        <div>
          <p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual é seu penúltimo sobrenome?</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${surnameOptions.map(opt => optionButton("surname", opt)).join("")}</div>
        </div>
        <div>
          <p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual era sua turma?</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${classOptions.map(opt => optionButton("classGroup", opt, `Turma ${opt}`)).join("")}</div>
        </div>
        <div>
          <p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual é seu ano de nascimento?</p>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${yearOptions.map(opt => optionButton("birthYear", opt)).join("")}</div>
        </div>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 mt-8">
        <button data-verify-next class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Continuar</button>
        <button data-verify-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Trocar nome</button>
      </div>
    </div>
  `;

  root.querySelectorAll<HTMLButtonElement>("[data-answer-key]").forEach(button => {
    button.onclick = () => {
      registrationState.answers[button.dataset.answerKey!] = button.dataset.answerValue ?? "";
      renderRegistrationFlow();
    };
  });
  root.querySelector<HTMLButtonElement>("[data-verify-back]")!.onclick = () => { registrationState.step = "select"; registrationState.error = ""; renderRegistrationFlow(); };
  root.querySelector<HTMLButtonElement>("[data-verify-next]")!.onclick = () => {
    const okSurname = normalizeRegistrationValue(registrationState.answers.surname) === normalizeRegistrationValue(expectedSurname);
    const okClass = normalizeRegistrationValue(registrationState.answers.classGroup) === normalizeRegistrationValue(person.class_group);
    const okYear = Number(registrationState.answers.birthYear) === Number(person.birth_year);
    if (!okSurname || !okClass || !okYear) {
      registrationState.error = "As respostas não conferem com o pré-cadastro. Revise os dados ou fale com a organização.";
      renderRegistrationFlow();
      return;
    }
    registrationState.error = "";
    registrationState.step = "profile";
    renderRegistrationFlow();
  };
}

function inputField(name: string, label: string, value: string, placeholder = "", type = "text") {
  return `
    <label class="block">
      <span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider mb-2 block">${label}</span>
      <input data-profile-field="${name}" type="${type}" value="${escapeRegistrationHtml(value)}" placeholder="${escapeRegistrationHtml(placeholder)}" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
    </label>
  `;
}

function renderProfileStep(root: HTMLElement) {
  root.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${stepErrorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-1">3. Complete seu perfil público</p>
      <p class="text-[#7a9a7a] text-sm mb-6">Esses dados poderão aparecer no site conforme suas configurações de privacidade.</p>
      <div class="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 mb-5">
        <label class="aspect-square bg-[#0a120a] border border-dashed border-[#2d6a4f]/40 flex items-center justify-center cursor-pointer overflow-hidden">
          <input data-profile-photo type="file" accept="image/png,image/jpeg,image/jpg,image/webp" class="sr-only" />
          ${registrationState.photoPreview ? `<img src="${registrationState.photoPreview}" class="w-full h-full object-cover" />` : `<span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider text-center px-4">Enviar foto</span>`}
        </label>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${inputField("displayName", "Nome de exibição", registrationState.profile.displayName)}
          ${inputField("nickname", "Apelido", registrationState.profile.nickname)}
          ${inputField("profession", "Profissão", registrationState.profile.profession)}
          ${inputField("city", "Cidade atual", registrationState.profile.city)}
          ${inputField("state", "Estado", registrationState.profile.state)}
          ${inputField("country", "País", registrationState.profile.country)}
        </div>
      </div>
      <label class="block">
        <span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider mb-2 block">Bio curta</span>
        <textarea data-profile-bio rows="4" maxlength="420" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">${escapeRegistrationHtml(registrationState.profile.bio)}</textarea>
      </label>
      <div class="flex flex-col sm:flex-row gap-3 mt-8">
        <button data-profile-next class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Continuar</button>
        <button data-profile-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Voltar</button>
      </div>
    </div>
  `;
  root.querySelectorAll<HTMLInputElement>("[data-profile-field]").forEach(input => {
    input.oninput = () => { (registrationState.profile as any)[input.dataset.profileField!] = input.value; };
  });
  root.querySelector<HTMLTextAreaElement>("[data-profile-bio]")!.oninput = event => { registrationState.profile.bio = (event.currentTarget as HTMLTextAreaElement).value; };
  root.querySelector<HTMLInputElement>("[data-profile-photo]")!.onchange = event => {
    const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    registrationState.photoFile = file;
    registrationState.photoPreview = file ? URL.createObjectURL(file) : null;
    renderRegistrationFlow();
  };
  root.querySelector<HTMLButtonElement>("[data-profile-back]")!.onclick = () => { registrationState.step = "verify"; renderRegistrationFlow(); };
  root.querySelector<HTMLButtonElement>("[data-profile-next]")!.onclick = () => { registrationState.step = "account"; registrationState.error = ""; renderRegistrationFlow(); };
}

function renderAccountStep(root: HTMLElement) {
  root.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${stepErrorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-1">4. Crie seu login</p>
      <p class="text-[#7a9a7a] text-sm mb-6">A validação de e-mail será adicionada futuramente. Por enquanto, a conta é vinculada após a criação do login.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${accountField("email", "E-mail", registrationState.account.email, "email")}
        ${accountField("whatsapp", "WhatsApp", registrationState.account.whatsapp, "tel")}
        ${accountField("password", "Senha", registrationState.account.password, "password")}
        ${accountField("confirmPassword", "Repetir senha", registrationState.account.confirmPassword, "password")}
      </div>
      <div class="flex flex-col sm:flex-row gap-3 mt-8">
        <button data-account-submit ${registrationState.busy ? "disabled" : ""} class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] disabled:opacity-50">${registrationState.busy ? "Criando conta..." : "Finalizar cadastro"}</button>
        <button data-account-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Voltar</button>
      </div>
    </div>
  `;
  root.querySelectorAll<HTMLInputElement>("[data-account-field]").forEach(input => {
    input.oninput = () => { (registrationState.account as any)[input.dataset.accountField!] = input.value; };
  });
  root.querySelector<HTMLButtonElement>("[data-account-back]")!.onclick = () => { registrationState.step = "profile"; renderRegistrationFlow(); };
  root.querySelector<HTMLButtonElement>("[data-account-submit]")!.onclick = completeRegistration;
}

function accountField(name: string, label: string, value: string, type: string) {
  return `
    <label class="block">
      <span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider mb-2 block">${label}</span>
      <input data-account-field="${name}" type="${type}" value="${escapeRegistrationHtml(value)}" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]" />
    </label>
  `;
}

async function completeRegistration() {
  const person = registrationState.selected;
  if (!person) return;
  if (!registrationState.account.email.includes("@")) { registrationState.error = "Informe um e-mail válido."; renderRegistrationFlow(); return; }
  if (registrationState.account.whatsapp.trim().length < 8) { registrationState.error = "Informe seu WhatsApp."; renderRegistrationFlow(); return; }
  if (registrationState.account.password.length < 6) { registrationState.error = "A senha deve ter pelo menos 6 caracteres."; renderRegistrationFlow(); return; }
  if (registrationState.account.password !== registrationState.account.confirmPassword) { registrationState.error = "A repetição da senha não confere."; renderRegistrationFlow(); return; }

  registrationState.busy = true;
  registrationState.error = "";
  renderRegistrationFlow();

  try {
    const { supabase } = await getRegistrationModules();
    const email = registrationState.account.email.trim().toLowerCase();
    const password = registrationState.account.password;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: registrationState.profile.displayName || person.full_name, whatsapp: registrationState.account.whatsapp } },
    });

    if (signUpError && !String(signUpError.message ?? "").toLowerCase().includes("already")) throw signUpError;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw signInError;
    const user = signInData.user;
    if (!user) throw new Error("Conta criada, mas não foi possível iniciar sessão automaticamente.");

    let photoUrl: string | null = null;
    if (registrationState.photoFile) {
      const ext = registrationState.photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
      const path = `${user.id}/profile-${Date.now()}.${safeExt}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, registrationState.photoFile, { contentType: registrationState.photoFile.type, upsert: true });
      if (uploadError) throw uploadError;
      photoUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
    }

    const { error: rpcError } = await (supabase as any).rpc("complete_profile_registration", {
      p_person_id: person.id,
      p_penultimate_surname: registrationState.answers.surname,
      p_class_group: registrationState.answers.classGroup,
      p_birth_year: Number(registrationState.answers.birthYear),
      p_display_name: registrationState.profile.displayName || person.full_name,
      p_current_photo_url: photoUrl,
      p_current_city: registrationState.profile.city || null,
      p_current_state: registrationState.profile.state || null,
      p_current_country: registrationState.profile.country || "Brasil",
      p_profession: registrationState.profile.profession || null,
      p_bio: registrationState.profile.bio || null,
      p_nickname_at_school: registrationState.profile.nickname || null,
    });
    if (rpcError) throw rpcError;

    registrationState.step = "done";
    renderRegistrationFlow();
    window.setTimeout(() => navigateRegistrationTo("/editar-perfil"), 1400);
  } catch (error) {
    registrationState.error = error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
    registrationState.busy = false;
    renderRegistrationFlow();
  }
}

function renderDoneStep(root: HTMLElement) {
  root.innerHTML = `
    <div class="bg-[#0d2e1a] border border-[#2d6a4f] p-8 text-center">
      <p class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold mb-3">Cadastro realizado</p>
      <p class="text-[#8ab89a] text-sm">Seu perfil foi validado e vinculado à sua conta. Redirecionando para edição do perfil...</p>
    </div>
  `;
}

async function injectBirthYearIntoPersonModal() {
  const modal = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .find(el => el.innerText.includes("Perfil da turma") && el.innerText.includes("Nome completo") && !el.querySelector("[data-birth-year-row='true']"));
  if (!modal) return;
  const title = modal.querySelector("h3")?.textContent?.trim();
  if (!title) return;
  const { services } = await getRegistrationModules();
  const people = await services.getPeople().catch(() => []);
  const person = (people as RegistrationPerson[]).find(item => normalizeRegistrationValue(item.full_name) === normalizeRegistrationValue(title));
  if (!person?.birth_year) return;
  const grid = Array.from(modal.querySelectorAll<HTMLElement>("div")).find(el => el.className.includes("grid") && el.innerText.includes("Nome completo"));
  if (!grid) return;
  const row = document.createElement("div");
  row.dataset.birthYearRow = "true";
  row.className = "bg-[#0a120a] border border-[#2d6a4f]/20 p-3";
  row.innerHTML = `<p class="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider mb-1">Ano de nascimento</p><p class="text-[#f0ebe0] text-sm">${person.birth_year}</p>`;
  grid.appendChild(row);
}

function installProfileRegistrationRuntime() {
  mountRegistrationFlow();
  injectBirthYearIntoPersonModal().catch(() => {});
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    installProfileRegistrationRuntime();
    new MutationObserver(installProfileRegistrationRuntime).observe(document.body, { childList: true, subtree: true });
  });
}
