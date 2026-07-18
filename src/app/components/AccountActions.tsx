import type { Page } from "../shared";

interface AccountActionsProps {
  isSuperadmin: boolean;
  variant: "desktop" | "mobile";
  onNavigate: (page: Page) => void;
  onChangePhoto: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
}

export function AccountActions({
  isSuperadmin,
  variant,
  onNavigate,
  onChangePhoto,
  onChangePassword,
  onLogout,
}: AccountActionsProps) {
  const isMobile = variant === "mobile";
  const baseClass = isMobile
    ? "mobile-account-action"
    : "text-left px-3 py-3 text-xs font-mono uppercase tracking-wider transition-colors";

  return (
    <div
      data-account-actions
      data-account-actions-variant={variant}
      className={isMobile ? "mobile-account-actions-grid" : "pt-3 flex flex-col"}
    >
      <button
        type="button"
        onClick={() => onNavigate("alumni-area")}
        className={`${baseClass} ${isMobile ? "" : "text-[#c9a84c] hover:bg-[#141f14]"}`}
      >
        Minha Área
      </button>
      {isSuperadmin && (
        <button
          type="button"
          onClick={() => onNavigate("admin")}
          className={`${baseClass} ${isMobile ? "" : "text-[#c9a84c] hover:bg-[#141f14]"}`}
        >
          Painel Admin
        </button>
      )}
      <button
        type="button"
        onClick={() => onNavigate("edit-profile")}
        className={`${baseClass} ${isMobile ? "" : "text-[#f0ebe0] hover:bg-[#141f14]"}`}
      >
        Editar perfil
      </button>
      <button
        type="button"
        onClick={onChangePhoto}
        className={`${baseClass} ${isMobile ? "" : "text-[#f0ebe0] hover:bg-[#141f14]"}`}
      >
        Alterar foto
      </button>
      <button
        type="button"
        onClick={onChangePassword}
        className={`${baseClass} ${isMobile ? "" : "text-[#f0ebe0] hover:bg-[#141f14]"}`}
      >
        Mudar senha
      </button>
      <button
        type="button"
        onClick={onLogout}
        className={`${baseClass} ${isMobile ? "mobile-account-action-danger" : "text-[#e74c3c] hover:bg-[#2e0a0a]"}`}
      >
        Sair
      </button>
    </div>
  );
}
