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
  is_visible?: boolean;
};

type RegistrationStep = "select" | "verify" | "profile" | "account" | "done";

type RegistrationState = {
  people: RegistrationPerson[];
  loading: boolean;
  step: RegistrationStep;
  search: string;
  selected: RegistrationPerson | null;
  answers: Record<string, string>;
  error: string;
  busy: boolean;
  profile: Record<string, string>;
  account: Record<string, string>;
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
  profile: { displayName: "", nickname: "", profession: "", city: "", state: "", country: "Brasil", bio: "" },
  account: { email: "", whatsapp: "", password: "", confirmPassword: "" },
  photoFile: null,
  photoPreview: null,
};

function norm(value: unknown) {
  return String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();
}

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function penultimateSurname(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";
}

function optionList(values: Array<string | number | null | undefined>, fallback: string[] = []) {
  return Array.from(new Set([...values, ...fallback].filter(v => v !== null && v !== undefined && String(v).trim()).map(String))).slice(0, 4);
}

function goTo(pathname: string) {
  window.history.pushState({}, "", pathname);
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

async function modules() {
  const [supabaseModule, servicesModule] = await Promise.all([import("./supabase"), import("./services")]);
  return { supabase: supabaseModule.supabase, services: servicesModule };
}

async function loadPeople() {
  if (registrationState.loading || registrationState.people.length) return;
  registrationState.loading = true;
  try {
    const { services } = await modules();
    const people = await services.getPeople();
    registrationState.people = (people as RegistrationPerson[])
      .filter(person => person.is_visible !== false)
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "pt-BR"));
  } finally {
    registrationState.loading = false;
  }
}

function shell() {
  return `
    <div class="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div class="max-w-3xl mx-auto px-4">
        <button type="button" data-registration-back class="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0]">← Voltar</button>
        <p class="text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5">Cadastro de ex-aluno</p>
        <h1 class="font-['Playfair_Display'] text-[#f0ebe0] text-4xl md:text-5xl font-black mb-4">Criar minha conta</h1>
        <p class="text-[#8ab89a] text-sm leading-relaxed mb-10 max-w-2xl">Selecione seu nome, confirme três dados de validação e complete seu perfil antes de criar seu login.</p>
        <div data-registration-runtime="root"></div>
      </div>
    </div>
  `;
}

function mountRegistration() {
  if (window.location.pathname !== "/reivindicar-perfil") return;
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (main.dataset.registrationRuntimeMounted !== "true") {
    main.dataset.registrationRuntimeMounted = "true";
    main.innerHTML = shell();
    main.querySelector<HTMLElement>("[data-registration-back]")!.onclick = () => goTo("/turma");
  }
  loadPeople().finally(renderRegistration);
  renderRegistration();
}

function root() {
  return document.querySelector<HTMLElement>("[data-registration-runtime='root']");
}

function errorHtml() {
  return registrationState.error
    ? `<p class="bg-[#2e0a0a] border border-[#c0392b]/50 text-[#e74c3c] px-4 py-3 text-xs font-mono mb-5">${esc(registrationState.error)}</p>`
    : "";
}

function renderRegistration() {
  const host = root();
  if (!host) return;
  if (registrationState.loading) {
    host.innerHTML = `<div class="bg-[#141f14] border border-[#2d6a4f]/30 p-8 text-[#7a9a7a] text-sm">Carregando lista da turma...</div>`;
    return;
  }
  if (registrationState.step === "select") return renderSelect(host);
  if (registrationState.step === "verify") return renderVerify(host);
  if (registrationState.step === "profile") return renderProfile(host);
  if (registrationState.step === "account") return renderAccount(host);
  return renderDone(host);
}

function renderSelect(host: HTMLElement) {
  const query = norm(registrationState.search);
  const results = registrationState.people.filter(p => query.length < 2 || norm(p.full_name).includes(query)).slice(0, 30);
  host.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${errorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-2">1. Selecione seu nome na lista</p>
      <input data-registration-search value="${esc(registrationState.search)}" placeholder="Digite seu nome completo..." class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a5a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f] mb-5" />
      <div class="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
        ${results.map(person => {
          const disabled = Boolean(person.claimed_by_user_id && person.profile_status === "confirmed");
          return `<button type="button" data-select-person="${person.id}" ${disabled ? "disabled" : ""} class="flex items-center justify-between gap-4 p-4 border text-left ${disabled ? "opacity-50 cursor-not-allowed border-[#2d6a4f]/10" : "border-[#2d6a4f]/20 hover:border-[#2d6a4f]/60"}"><div><p class="text-[#f0ebe0] font-semibold text-sm">${esc(person.full_name)}</p><p class="text-[#c9a84c] text-xs font-mono mt-1">Turma ${esc(person.class_group ?? "-")} · ${esc(person.birth_year ?? "ano não informado")}</p></div><span class="text-[#7a9a7a] text-[10px] font-mono uppercase tracking-wider">${disabled ? "Já vinculado" : "Selecionar"}</span></button>`;
        }).join("")}
      </div>
    </div>`;
  host.querySelector<HTMLInputElement>("[data-registration-search]")!.oninput = event => {
    registrationState.search = (event.currentTarget as HTMLInputElement).value;
    renderRegistration();
  };
  host.querySelectorAll<HTMLButtonElement>("[data-select-person]").forEach(button => {
    button.onclick = () => {
      const person = registrationState.people.find(item => item.id === button.dataset.selectPerson);
      if (!person) return;
      registrationState.selected = person;
      registrationState.profile.displayName = person.full_name;
      registrationState.profile.nickname = person.nickname_at_school ?? "";
      registrationState.answers = {};
      registrationState.error = "";
      registrationState.step = "verify";
      renderRegistration();
    };
  });
}

function answerButton(key: string, value: string, label = value) {
  const selected = registrationState.answers[key] === value;
  return `<button type="button" data-answer-key="${key}" data-answer-value="${esc(value)}" class="text-left px-4 py-3 border text-sm ${selected ? "bg-[#2d6a4f] border-[#2d6a4f] text-[#f0ebe0]" : "border-[#2d6a4f]/30 text-[#8ab89a] hover:border-[#2d6a4f]/70"}">${esc(label)}</button>`;
}

function renderVerify(host: HTMLElement) {
  const person = registrationState.selected;
  if (!person) { registrationState.step = "select"; return renderRegistration(); }
  const expectedSurname = penultimateSurname(person.full_name);
  const surnameOptions = optionList([expectedSurname, ...registrationState.people.map(p => penultimateSurname(p.full_name)).filter(s => norm(s) !== norm(expectedSurname))], ["Silva", "Souza", "Oliveira"]).sort(() => 0.5 - Math.random());
  const classOptions = optionList([person.class_group, "A", "B", "C", "D"]);
  const year = Number(person.birth_year ?? 0);
  const yearOptions = optionList([year, year - 1, year + 1, year + 2].filter(v => v > 1900));
  host.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${errorHtml()}
      <p class="text-[#f0ebe0] font-semibold mb-1">2. Confirme seus dados</p>
      <p class="text-[#7a9a7a] text-sm mb-6">Perfil selecionado: <span class="text-[#f0ebe0]">${esc(person.full_name)}</span></p>
      <div class="flex flex-col gap-6">
        <div><p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual é seu penúltimo sobrenome?</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-2">${surnameOptions.map(opt => answerButton("surname", opt)).join("")}</div></div>
        <div><p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual era sua turma?</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${classOptions.map(opt => answerButton("classGroup", opt, `Turma ${opt}`)).join("")}</div></div>
        <div><p class="text-[#c9a84c] text-xs font-mono uppercase tracking-wider mb-3">Qual é seu ano de nascimento?</p><div class="grid grid-cols-2 sm:grid-cols-4 gap-2">${yearOptions.map(opt => answerButton("birthYear", opt)).join("")}</div></div>
      </div>
      <div class="flex flex-col sm:flex-row gap-3 mt-8"><button data-verify-next class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Continuar</button><button data-verify-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Trocar nome</button></div>
    </div>`;
  host.querySelectorAll<HTMLButtonElement>("[data-answer-key]").forEach(button => {
    button.onclick = () => { registrationState.answers[button.dataset.answerKey!] = button.dataset.answerValue ?? ""; renderRegistration(); };
  });
  host.querySelector<HTMLButtonElement>("[data-verify-back]")!.onclick = () => { registrationState.step = "select"; registrationState.error = ""; renderRegistration(); };
  host.querySelector<HTMLButtonElement>("[data-verify-next]")!.onclick = () => {
    const ok = norm(registrationState.answers.surname) === norm(expectedSurname) && norm(registrationState.answers.classGroup) === norm(person.class_group) && Number(registrationState.answers.birthYear) === Number(person.birth_year);
    if (!ok) { registrationState.error = "As respostas não conferem com o pré-cadastro. Revise os dados ou fale com a organização."; return renderRegistration(); }
    registrationState.error = "";
    registrationState.step = "profile";
    renderRegistration();
  };
}

function field(scope: "profile" | "account", name: string, label: string, value: string, type = "text") {
  const data = scope === "profile" ? "data-profile-field" : "data-account-field";
  return `<label class="block"><span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider mb-2 block">${label}</span><input ${data}="${name}" type="${type}" value="${esc(value)}" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]" /></label>`;
}

function renderProfile(host: HTMLElement) {
  host.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${errorHtml()}<p class="text-[#f0ebe0] font-semibold mb-1">3. Complete seu perfil público</p><p class="text-[#7a9a7a] text-sm mb-6">Esses dados poderão aparecer no site.</p>
      <div class="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-5 mb-5"><label class="aspect-square bg-[#0a120a] border border-dashed border-[#2d6a4f]/40 flex items-center justify-center cursor-pointer overflow-hidden"><input data-profile-photo type="file" accept="image/png,image/jpeg,image/jpg,image/webp" class="sr-only" />${registrationState.photoPreview ? `<img src="${registrationState.photoPreview}" class="w-full h-full object-cover" />` : `<span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider text-center px-4">Enviar foto</span>`}</label><div class="grid grid-cols-1 md:grid-cols-2 gap-4">${field("profile", "displayName", "Nome de exibição", registrationState.profile.displayName)}${field("profile", "nickname", "Apelido", registrationState.profile.nickname)}${field("profile", "profession", "Profissão", registrationState.profile.profession)}${field("profile", "city", "Cidade atual", registrationState.profile.city)}${field("profile", "state", "Estado", registrationState.profile.state)}${field("profile", "country", "País", registrationState.profile.country)}</div></div>
      <label class="block"><span class="text-[#7a9a7a] text-xs font-mono uppercase tracking-wider mb-2 block">Bio curta</span><textarea data-profile-bio rows="4" maxlength="420" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">${esc(registrationState.profile.bio)}</textarea></label>
      <div class="flex flex-col sm:flex-row gap-3 mt-8"><button data-profile-next class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Continuar</button><button data-profile-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Voltar</button></div>
    </div>`;
  host.querySelectorAll<HTMLInputElement>("[data-profile-field]").forEach(input => { input.oninput = () => { registrationState.profile[input.dataset.profileField!] = input.value; }; });
  host.querySelector<HTMLTextAreaElement>("[data-profile-bio]")!.oninput = event => { registrationState.profile.bio = (event.currentTarget as HTMLTextAreaElement).value; };
  host.querySelector<HTMLInputElement>("[data-profile-photo]")!.onchange = event => { const file = (event.currentTarget as HTMLInputElement).files?.[0] ?? null; registrationState.photoFile = file; registrationState.photoPreview = file ? URL.createObjectURL(file) : null; renderRegistration(); };
  host.querySelector<HTMLButtonElement>("[data-profile-back]")!.onclick = () => { registrationState.step = "verify"; renderRegistration(); };
  host.querySelector<HTMLButtonElement>("[data-profile-next]")!.onclick = () => { registrationState.step = "account"; registrationState.error = ""; renderRegistration(); };
}

function renderAccount(host: HTMLElement) {
  host.innerHTML = `
    <div class="bg-[#141f14] border border-[#2d6a4f]/30 p-6 md:p-8">
      ${errorHtml()}<p class="text-[#f0ebe0] font-semibold mb-1">4. Crie seu login</p><p class="text-[#7a9a7a] text-sm mb-6">A validação de e-mail será adicionada futuramente.</p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${field("account", "email", "E-mail", registrationState.account.email, "email")}${field("account", "whatsapp", "WhatsApp", registrationState.account.whatsapp, "tel")}${field("account", "password", "Senha", registrationState.account.password, "password")}${field("account", "confirmPassword", "Repetir senha", registrationState.account.confirmPassword, "password")}</div>
      <div class="flex flex-col sm:flex-row gap-3 mt-8"><button data-account-submit ${registrationState.busy ? "disabled" : ""} class="flex-1 bg-[#2d6a4f] text-[#f0ebe0] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] disabled:opacity-50">${registrationState.busy ? "Criando conta..." : "Finalizar cadastro"}</button><button data-account-back class="flex-1 border border-[#2d6a4f]/40 text-[#7a9a7a] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em]">Voltar</button></div>
    </div>`;
  host.querySelectorAll<HTMLInputElement>("[data-account-field]").forEach(input => { input.oninput = () => { registrationState.account[input.dataset.accountField!] = input.value; }; });
  host.querySelector<HTMLButtonElement>("[data-account-back]")!.onclick = () => { registrationState.step = "profile"; renderRegistration(); };
  host.querySelector<HTMLButtonElement>("[data-account-submit]")!.onclick = completeRegistration;
}

async function completeRegistration() {
  const person = registrationState.selected;
  if (!person) return;
  if (!registrationState.account.email.includes("@")) { registrationState.error = "Informe um e-mail válido."; renderRegistration(); return; }
  if (registrationState.account.whatsapp.trim().length < 8) { registrationState.error = "Informe seu WhatsApp."; renderRegistration(); return; }
  if (registrationState.account.password.length < 6) { registrationState.error = "A senha deve ter pelo menos 6 caracteres."; renderRegistration(); return; }
  if (registrationState.account.password !== registrationState.account.confirmPassword) { registrationState.error = "A repetição da senha não confere."; renderRegistration(); return; }
  registrationState.busy = true;
  registrationState.error = "";
  renderRegistration();
  try {
    const { supabase } = await modules();
    const email = registrationState.account.email.trim().toLowerCase();
    const password = registrationState.account.password;
    const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: registrationState.profile.displayName || person.full_name, whatsapp: registrationState.account.whatsapp } } });
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
    renderRegistration();
    window.setTimeout(() => goTo("/editar-perfil"), 1400);
  } catch (error) {
    registrationState.error = error instanceof Error ? error.message : "Não foi possível concluir o cadastro.";
    registrationState.busy = false;
    renderRegistration();
  }
}

function renderDone(host: HTMLElement) {
  host.innerHTML = `<div class="bg-[#0d2e1a] border border-[#2d6a4f] p-8 text-center"><p class="text-[#f0ebe0] font-['Playfair_Display'] text-3xl font-bold mb-3">Cadastro realizado</p><p class="text-[#8ab89a] text-sm">Seu perfil foi validado e vinculado à sua conta. Redirecionando para edição do perfil...</p></div>`;
}

async function injectBirthYearIntoPersonModal() {
  const modal = Array.from(document.querySelectorAll<HTMLElement>("div")).find(el => el.innerText.includes("Perfil da turma") && el.innerText.includes("Nome completo") && !el.querySelector("[data-birth-year-row='true']"));
  if (!modal) return;
  const title = modal.querySelector("h3")?.textContent?.trim();
  if (!title) return;
  const { services } = await modules();
  const people = await services.getPeople().catch(() => []);
  const person = (people as RegistrationPerson[]).find(item => norm(item.full_name) === norm(title));
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
  mountRegistration();
  injectBirthYearIntoPersonModal().catch(() => {});
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    installProfileRegistrationRuntime();
    new MutationObserver(installProfileRegistrationRuntime).observe(document.body, { childList: true, subtree: true });
  });
}
