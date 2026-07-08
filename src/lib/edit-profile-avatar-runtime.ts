async function editAvatarModules() {
  const [supabaseModule] = await Promise.all([import("./supabase")]);
  return { supabase: supabaseModule.supabase };
}

function editAvatarActive() {
  return window.location.pathname === "/editar-perfil" && document.body.innerText.includes("Foto de perfil");
}

function avatarToast(message: string, type: "success" | "error" = "success") {
  document.querySelector("[data-avatar-sync-toast='true']")?.remove();
  const toast = document.createElement("div");
  toast.dataset.avatarSyncToast = "true";
  toast.className = `fixed top-24 right-4 z-[110] max-w-sm border px-5 py-4 shadow-xl text-sm ${
    type === "success"
      ? "bg-[#0d2e1a] border-[#2d6a4f] text-[#74c69d]"
      : "bg-[#2e0a0a] border-[#c0392b]/70 text-[#e74c3c]"
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

async function syncAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  if (file.size > 5 * 1024 * 1024) throw new Error("A imagem deve ter no máximo 5 MB.");

  const { supabase } = await editAvatarModules();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) throw new Error("Faça login para enviar a foto.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp"].includes(ext) ? ext : "jpg";
  const path = `${session.user.id}/avatar-${Date.now()}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { contentType: file.type, upsert: true });
  if (uploadError) throw uploadError;

  const publicUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  if (!publicUrl) throw new Error("Não foi possível gerar a URL pública do avatar.");

  const { error: rpcError } = await (supabase as any).rpc("update_my_public_profile", {
    p_current_photo_url: publicUrl,
    p_avatar_url: publicUrl,
  });
  if (rpcError) throw rpcError;

  document.querySelectorAll<HTMLImageElement>("img").forEach(img => {
    const context = img.closest("div")?.innerText ?? "";
    if (context.includes("Foto de perfil") || img.alt) img.src = publicUrl;
  });
  avatarToast("Foto armazenada e sincronizada nos avatares.", "success");
}

function installAvatarSyncFallback() {
  if (!editAvatarActive()) return;
  const input = Array.from(document.querySelectorAll<HTMLInputElement>("input[type='file']"))
    .find(el => (el.accept || "").includes("image"));
  if (!input || input.dataset.avatarSyncFallback === "true") return;
  input.dataset.avatarSyncFallback = "true";
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    window.setTimeout(() => {
      syncAvatarFile(file).catch(error => {
        avatarToast(error instanceof Error ? error.message : "Erro ao enviar foto.", "error");
      });
    }, 300);
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("DOMContentLoaded", () => {
    installAvatarSyncFallback();
    new MutationObserver(installAvatarSyncFallback).observe(document.body, { childList: true, subtree: true });
  });
}
