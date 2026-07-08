type MyProfileRow = {
  id: string;
  person_id: string;
  current_photo_url: string | null;
  display_name: string | null;
  current_city: string | null;
  current_state: string | null;
  current_country: string | null;
  profession: string | null;
  bio: string | null;
  memory_text: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  people?: {
    nickname_at_school?: string | null;
    avatar_url?: string | null;
  } | null;
};

let editProfileRow: MyProfileRow | null = null;
let editProfileLoading: Promise<MyProfileRow | null> | null = null;
let lastSyncedAt = 0;

async function editProfileModules() {
  const [supabaseModule] = await Promise.all([import("./supabase")]);
  return { supabase: supabaseModule.supabase };
}

function editProfileActive() {
  return window.location.pathname === "/editar-perfil" && document.body.innerText.includes("Editar meu perfil");
}

function normalizeUf(value: string) {
  return value.replace(/[^a-zA-Z]/g, "").slice(0, 2).toUpperCase();
}

function setNativeValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function showEditToast(message: string, type: "success" | "error" = "success") {
  document.querySelector("[data-edit-profile-toast='true']")?.remove();
  const toast = document.createElement("div");
  toast.dataset.editProfileToast = "true";
  toast.className = `fixed top-24 right-4 z-[100] max-w-sm border px-5 py-4 shadow-xl text-sm ${
    type === "success"
      ? "bg-[#0d2e1a] border-[#2d6a4f] text-[#74c69d]"
      : "bg-[#2e0a0a] border-[#c0392b]/70 text-[#e74c3c]"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

function goToEditProfileNextPage() {
  window.history.pushState({}, "", "/minha-area");
  window.dispatchEvent(new Event("popstate"));
  window.scrollTo(0, 0);
}

async function loadMyEditProfile() {
  if (editProfileRow) return editProfileRow;
  if (editProfileLoading) return editProfileLoading;
  editProfileLoading = (async () => {
    const { supabase } = await editProfileModules();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, person_id, current_photo_url, display_name, current_city, current_state, current_country, profession, bio, memory_text, instagram_url, linkedin_url, people(nickname_at_school, avatar_url)")
      .eq("user_id", session.user.id)
      .maybeSingle();
    if (error) throw error;
    editProfileRow = data as MyProfileRow | null;
    return editProfileRow;
  })();
  return editProfileLoading;
}

function labelText(label: string) {
  return Array.from(document.querySelectorAll<HTMLLabelElement>("label"))
    .find(el => el.textContent?.trim().toLowerCase() === label.toLowerCase());
}

function inputByLabel(label: string) {
  const labelEl = labelText(label);
  if (!labelEl) return null;
  return labelEl.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>("input, textarea") ?? null;
}

function hideStaticNicknameRow() {
  const rows = Array.from(document.querySelectorAll<HTMLElement>("div"));
  const row = rows.find(el => {
    const text = el.innerText?.trim() ?? "";
    return text.startsWith("Apelido da época") && !el.querySelector("input") && !el.dataset.editNicknameField;
  });
  if (row) row.style.display = "none";
}

async function installNicknameField() {
  if (document.querySelector("[data-edit-nickname-field='true']")) return;
  const profile = await loadMyEditProfile().catch(() => null);
  const anchor = labelText("Nome de exibição")?.parentElement;
  if (!anchor?.parentElement) return;

  const wrap = document.createElement("div");
  wrap.dataset.editNicknameField = "true";
  wrap.innerHTML = `
    <label class="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Apelido da época</label>
    <div class="relative">
      <input data-edit-nickname-input type="text" value="${escapeAttr(profile?.people?.nickname_at_school ?? "")}" placeholder="Como te chamavam no HC" class="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 pl-4 pr-4 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors" />
    </div>
  `;
  anchor.insertAdjacentElement("afterend", wrap);
  hideStaticNicknameRow();
}

function escapeAttr(value: string) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function installStateFieldRules() {
  const input = inputByLabel("Estado") as HTMLInputElement | null;
  if (!input || input.dataset.ufRuntime === "true") return;
  input.dataset.ufRuntime = "true";
  input.placeholder = "UF";
  input.maxLength = 2;
  const normalized = normalizeUf(input.value);
  if (input.value !== normalized) setNativeValue(input, normalized);
  input.addEventListener("input", () => {
    const next = normalizeUf(input.value);
    if (input.value !== next) setNativeValue(input, next);
  });
}

function normalizeSocialValue(value: string, prefix: string) {
  const trimmed = value.trim();
  if (!trimmed) return prefix;
  if (trimmed === prefix) return prefix;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${prefix}${trimmed.replace(/^@+/, "")}`;
}

function installSocialPrefixes() {
  const instagram = inputByLabel("Instagram") as HTMLInputElement | null;
  if (instagram && instagram.dataset.socialPrefix !== "true") {
    instagram.dataset.socialPrefix = "true";
    const apply = () => {
      const next = normalizeSocialValue(instagram.value, "https://instagram.com/");
      if (instagram.value !== next) setNativeValue(instagram, next);
    };
    if (!instagram.value.trim()) apply();
    instagram.addEventListener("focus", apply);
    instagram.addEventListener("blur", apply);
  }

  const linkedin = inputByLabel("LinkedIn") as HTMLInputElement | null;
  if (linkedin && linkedin.dataset.socialPrefix !== "true") {
    linkedin.dataset.socialPrefix = "true";
    const apply = () => {
      const next = normalizeSocialValue(linkedin.value, "https://linkedin.com/in/");
      if (linkedin.value !== next) setNativeValue(linkedin, next);
    };
    if (!linkedin.value.trim()) apply();
    linkedin.addEventListener("focus", apply);
    linkedin.addEventListener("blur", apply);
  }
}

function currentAvatarUrl() {
  const photoSection = Array.from(document.querySelectorAll<HTMLElement>("div"))
    .find(el => el.innerText.includes("Foto de perfil") && el.querySelector("input[type='file']"));
  const img = photoSection?.querySelector<HTMLImageElement>("img[src]");
  return img?.src ?? editProfileRow?.current_photo_url ?? editProfileRow?.people?.avatar_url ?? null;
}

function value(label: string) {
  return inputByLabel(label)?.value.trim() ?? "";
}

function textAreaValue(label: string) {
  return inputByLabel(label)?.value.trim() ?? "";
}

async function syncProfileExtras(redirectAfterSave = false) {
  const now = Date.now();
  if (now - lastSyncedAt < 800) return;
  lastSyncedAt = now;

  const state = normalizeUf(value("Estado"));
  if (state && state.length !== 2) {
    showEditToast("Estado deve ser informado como UF, com duas letras.", "error");
    return;
  }

  try {
    const { supabase } = await editProfileModules();
    const { error } = await (supabase as any).rpc("update_my_public_profile", {
      p_display_name: value("Nome de exibição") || null,
      p_current_photo_url: currentAvatarUrl(),
      p_current_city: value("Cidade atual") || null,
      p_current_state: state || null,
      p_current_country: value("País") || null,
      p_profession: value("Profissão") || null,
      p_bio: textAreaValue("Mini bio") || null,
      p_memory_text: textAreaValue("Memória favorita do HC") || null,
      p_instagram_url: normalizeSocialValue(value("Instagram"), "https://instagram.com/") || null,
      p_linkedin_url: normalizeSocialValue(value("LinkedIn"), "https://linkedin.com/in/") || null,
      p_nickname_at_school: document.querySelector<HTMLInputElement>("[data-edit-nickname-input]")?.value.trim() ?? null,
      p_avatar_url: currentAvatarUrl(),
    });
    if (error) throw error;
    editProfileRow = null;
    editProfileLoading = null;
    showEditToast("Perfil salvo com sucesso.", "success");
    if (redirectAfterSave) window.setTimeout(goToEditProfileNextPage, 900);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar perfil.";
    showEditToast(message, "error");
  }
}

function installSaveHandler() {
  const saveButton = Array.from(document.querySelectorAll<HTMLButtonElement>("button"))
    .find(button => button.innerText.toLowerCase().includes("salvar alterações"));
  if (!saveButton || saveButton.dataset.editProfileSaveRuntime === "true") return;
  saveButton.dataset.editProfileSaveRuntime = "true";
  saveButton.addEventListener("click", () => {
    window.setTimeout(() => syncProfileExtras(true), 900);
  });
}

async function uploadAndSyncAvatar(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

  const { supabase } = await editProfileModules();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para enviar a foto.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${session.user.id}/avatar-${Date.now()}.${safeExt}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  if (!publicUrl) throw new Error("Não foi possível gerar a URL pública do avatar.");

  const { error: rpcError } = await (supabase as any).rpc("update_my_public_profile", {
    p_current_photo_url: publicUrl,
    p_avatar_url: publicUrl,
  });
  if (rpcError) throw rpcError;

  editProfileRow = null;
  editProfileLoading = null;
  document.querySelectorAll<HTMLImageElement>("img").forEach(img => {
    if (img.alt?.toLowerCase().includes("tulius") || img.closest("div")?.innerText.includes("Foto de perfil")) img.src = publicUrl;
  });
  showEditToast("Foto salva e sincronizada nos avatares.", "success");
}

function installAvatarSync() {
  const input = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='file']"))
    .find(el => el.accept.includes("image") && el.closest("div")?.innerText.includes("Foto de perfil"));
  if (!input || input.dataset.avatarRuntime === "true") return;
  input.dataset.avatarRuntime = "true";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    window.setTimeout(() => {
      uploadAndSyncAvatar(file).catch(error => {
        showEditToast(error instanceof Error ? error.message : "Erro ao enviar foto.", "error");
      });
    }, 250);
  });
}

function installEditProfileRuntime() {
  if (!editProfileActive()) return;
  installNicknameField().catch(() => {});
  installStateFieldRules();
  installSocialPrefixes();
  installAvatarSync();
  installSaveHandler();
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    installEditProfileRuntime();
    new MutationObserver(installEditProfileRuntime).observe(document.body, { childList: true, subtree: true });
  });
}
