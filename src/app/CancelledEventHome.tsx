import type { HomePageContent } from "../lib/services";

export function CancelledEventHome({ content }: { content: HomePageContent }) {
  const logoUrl = content.header_logo_url?.trim();
  const logoAlt = content.header_logo_alt?.trim() || "Turma 2006 — 20 anos";

  return (
    <section
      data-cancelled-event-home="true"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pb-16 pt-28 md:px-8 md:pb-20 md:pt-32"
      style={{ background: "radial-gradient(ellipse 100% 85% at 50% 15%, #1a4d2e 0%, #0a140b 72%)" }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.055]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.55) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[#2d6a4f] opacity-10 blur-[120px]" />

      <div className="relative z-10 mx-auto w-full max-w-3xl text-center">
        <div className="mb-8 flex min-h-24 items-center justify-center md:mb-10">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={logoAlt}
              className="max-h-28 max-w-[280px] object-contain md:max-h-36 md:max-w-[360px]"
            />
          ) : (
            <div className="border border-[#c9a84c]/50 px-6 py-4">
              <p className="font-mono text-xs font-bold uppercase tracking-[0.24em] text-[#c9a84c]">Turma 2006</p>
              <p className="mt-1 font-['Playfair_Display'] text-2xl font-black text-[#f0ebe0]">20 anos</p>
            </div>
          )}
        </div>

        <p className="mb-5 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-[#c9a84c] md:text-xs">
          Comunicado oficial
        </p>

        <h1 className="font-['Playfair_Display'] text-4xl font-black leading-[0.98] text-[#f0ebe0] sm:text-5xl md:text-6xl">
          Evento cancelado
        </h1>

        <div className="mx-auto my-7 h-px w-20 bg-[#c9a84c]/55" />

        <p className="mx-auto max-w-2xl text-base leading-7 text-[#d8ddd8] md:text-lg md:leading-8">
          Devido à baixa adesão de participantes, o encontro de comemoração dos 20 anos da Turma 2006 foi cancelado.
        </p>

        <div className="mx-auto mt-8 max-w-2xl border border-[#2d6a4f]/50 bg-[#101b11]/85 p-6 text-left shadow-2xl shadow-black/10 md:p-8">
          <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#c9a84c]">
            Reembolso dos pagamentos
          </p>
          <h2 className="font-['Playfair_Display'] text-2xl font-bold text-[#f0ebe0] md:text-3xl">
            O valor pago será devolvido integralmente.
          </h2>
          <p className="mt-4 text-sm leading-6 text-[#a9b8ac] md:text-base md:leading-7">
            Estamos processando o reembolso integral de todas as compras realizadas. A devolução será feita pelo Mercado Pago para o mesmo meio de pagamento utilizado na compra.
          </p>
          <p className="mt-3 text-sm leading-6 text-[#7f9784]">
            O prazo para o valor aparecer na conta ou na fatura pode variar conforme a forma de pagamento e a instituição financeira.
          </p>
        </div>

        <p className="mx-auto mt-7 max-w-xl text-sm leading-6 text-[#7a9a7a]">
          Não é necessário solicitar o reembolso individualmente. Os pagamentos serão processados pela organização.
        </p>
      </div>
    </section>
  );
}
