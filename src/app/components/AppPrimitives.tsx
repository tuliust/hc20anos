import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Btn({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  full = false,
  className = "",
  ...buttonProps
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  children: ReactNode;
  variant?: "primary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  full?: boolean;
}) {
  const sizes = { sm: "px-5 py-2.5 text-xs", md: "px-8 py-4 text-sm", lg: "px-10 py-5 text-sm" };
  const variants = {
    primary: "bg-[#2d6a4f] text-[#f0ebe0] hover:bg-[#40916c]",
    outline: "border border-[#f0ebe0] text-[#f0ebe0] hover:bg-[#f0ebe0] hover:text-[#0d1a0f]",
    ghost: "text-[#7a9a7a] hover:text-[#f0ebe0] hover:bg-[#1a2e1a]",
    gold: "bg-[#c9a84c] text-[#0d1a0f] hover:bg-[#e0bf6a]",
    danger: "bg-[#c0392b] text-[#f0ebe0] hover:bg-[#e74c3c]",
  };

  return (
    <button
      {...buttonProps}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold uppercase tracking-[0.15em] transition-all duration-150 select-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon,
  hint,
}: {
  label: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">{label}</label>
      <div className="relative">
        {icon && (
          <div
            data-field-leading-icon="true"
            className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#7a9a7a]"
          >
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={event => onChange?.(event.target.value)}
          style={icon ? { paddingLeft: "3.5rem" } : undefined}
          className={`w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 ${icon ? "pl-14" : "pl-4"} pr-4 text-sm focus:outline-none focus:border-[#2d6a4f] transition-colors`}
        />
      </div>
      {hint && <p className="text-[#7a9a7a] text-xs mt-1.5">{hint}</p>}
    </div>
  );
}

export function DisplayTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`font-['Playfair_Display'] font-black text-[#f0ebe0] leading-tight ${className}`}>
      {children}
    </h2>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    unclaimed:    { label: "Não cadastrado", color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
    claimed:      { label: "Cadastrado",      color: "bg-[#1a3a2a] text-[#74c69d] border border-[#2d6a4f]/50"     },
    preconfirmed: { label: "Pré-confirmado",  color: "bg-[#1a2e1a] text-[#c9a84c] border border-[#c9a84c]/30"     },
    confirmed:    { label: "Confirmado",      color: "bg-[#2d6a4f]/30 text-[#c9a84c] border border-[#c9a84c]/40"  },
    available:    { label: "Disponível",       color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    "last-units": { label: "Últimas unidades", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    "sold-out":   { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    sold_out:     { label: "Esgotado",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    pending:      { label: "Pendente",         color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    in_process:   { label: "Em processamento", color: "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/40"  },
    approved:     { label: "Aprovado",         color: "bg-[#2d6a4f]/30 text-[#74c69d] border border-[#2d6a4f]/50"  },
    rejected:     { label: "Rejeitado",        color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    removed:      { label: "Removido",         color: "bg-[#c0392b]/20 text-[#e74c3c] border border-[#c0392b]/30"  },
    hidden:       { label: "Oculto",           color: "bg-[#1e2a1e] text-[#7a9a7a] border border-[#2d6a4f]/30"     },
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

export function FieldArea({ label, placeholder, value, onChange, rows = 3 }: {
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


export function OptionButton({ selected, onClick, children }: {
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

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[#c9a84c] tracking-[0.32em] text-xs md:text-sm font-mono font-bold uppercase mb-5">{children}</p>;
}

export function GoldRule() {
  return <div className="w-16 h-px bg-[#c9a84c] opacity-60 my-6" />;
}

