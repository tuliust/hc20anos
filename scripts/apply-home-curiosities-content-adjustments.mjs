import fs from "node:fs";

const file = "src/app/App.tsx";
let source = fs.readFileSync(file, "utf8");

function replaceOnce(label, pattern, replacement) {
  const before = source;
  source = source.replace(pattern, replacement);
  if (source === before) throw new Error(`Replacement not applied: ${label}`);
}

function replaceOptional(label, pattern, replacement) {
  if (pattern.test(source)) source = source.replace(pattern, replacement);
  else console.log(`Optional replacement already applied or unavailable: ${label}`);
}

// Shared public ticket catalog.
replaceOnce(
  "public ticket catalog import",
  'import { AdminFaqPanel, type FaqSectionSettings } from "./admin/faq/AdminFaqPanel";',
  'import { AdminFaqPanel, type FaqSectionSettings } from "./admin/faq/AdminFaqPanel";\nimport { formatLotLabel, selectPublicTicketCards } from "../lib/publicTicketCatalog";',
);

// User account menu: Minha Área first.
replaceOnce(
  "desktop account menu",
  /<div className="pt-3 flex flex-col">\s*\{auth\.role === "superadmin"[\s\S]*?<button onClick=\{\(\) => \{ setProfileMenuOpen\(false\); logout\(\); \}\} className="text-left px-3 py-3 text\[#e74c3c\][\s\S]*?<\/button>\s*<\/div>/,
  `<div className="pt-3 flex flex-col">
                      <button onClick={() => go("alumni-area")} className="text-left px-3 py-3 text-[#c9a84c] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Minha Área</button>
                      {auth.role === "superadmin" && (
                        <button onClick={() => go("admin")} className="text-left px-3 py-3 text-[#c9a84c] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">PAINEL ADMIN</button>
                      )}
                      <button onClick={() => go("edit-profile")} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Editar perfil</button>
                      <button onClick={() => { setProfileMenuOpen(false); setPhotoModalOpen(true); }} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Alterar foto</button>
                      <button onClick={() => { setProfileMenuOpen(false); setPasswordModalOpen(true); }} className="text-left px-3 py-3 text-[#f0ebe0] hover:bg-[#141f14] text-xs font-mono uppercase tracking-wider transition-colors">Mudar senha</button>
                      <button onClick={() => { setProfileMenuOpen(false); logout(); }} className="text-left px-3 py-3 text-[#e74c3c] hover:bg-[#2e0a0a] text-xs font-mono uppercase tracking-wider transition-colors">Sair</button>
                    </div>`,
);

// Hero attendance intent.
replaceOnce(
  "hero signature",
  'function Hero({ navigate, content, event }: { navigate: (p: Page) => void; content: HomePageContent; event: DbEvent | null }) {',
  'function Hero({ navigate, content, event, auth }: { navigate: (p: Page) => void; content: HomePageContent; event: DbEvent | null; auth: AuthState }) {',
);
replaceOnce(
  "hero attendance state",
  '  const [time, setTime] = useState(() => getTimeLeft(getEventDateTime(event)));',
  `  const [time, setTime] = useState(() => getTimeLeft(getEventDateTime(event)));
  const [attendanceState, setAttendanceState] = useState<"idle" | "saving" | "saved" | "error">("idle");`,
);
replaceOnce(
  "hero attendance handler",
  /\n  return \(\n    <section data-home-section="hero"/,
  `
  async function handleAttendanceIntent() {
    window.sessionStorage.setItem("hc-attendance-intent", "yes");
    if (!auth.loggedIn || !auth.userId) {
      navigate("claim-profile");
      return;
    }
    setAttendanceState("saving");
    try {
      await saveMyPublicProfile(auth.userId, { intends_to_attend: true });
      window.sessionStorage.removeItem("hc-attendance-intent");
      setAttendanceState("saved");
    } catch {
      setAttendanceState("error");
    }
  }

  return (
    <section data-home-section="hero"`,
);
replaceOnce(
  "hero secondary CTA",
  '<Btn size="lg" variant="outline" className="max-sm:px-6 max-sm:py-3" onClick={() => navigate(normalizePage(extendedContent.secondary_cta_page, "who-going"))}>{content.secondary_cta_label}</Btn>',
  '<Btn size="lg" variant="outline" className="max-sm:px-6 max-sm:py-3" disabled={attendanceState === "saving"} onClick={handleAttendanceIntent}>{attendanceState === "saving" ? "Salvando..." : attendanceState === "saved" ? "Presença marcada" : content.secondary_cta_label}</Btn>',
);
replaceOnce(
  "hero attendance feedback",
  '        </div>\n        <div className="inline-flex">',
  `        </div>
        {attendanceState === "saved" && <p className="-mt-5 mb-7 text-sm font-mono text-[#74c69d]">Sua intenção de participar foi registrada.</p>}
        {attendanceState === "error" && <p className="-mt-5 mb-7 text-sm font-mono text-[#e07a5f]">Não foi possível marcar sua presença. Tente novamente.</p>}
        <div className="inline-flex">`,
);
replaceOnce(
  "landing hero auth",
  'hero: <Hero navigate={navigate} content={content} event={event} />,',
  'hero: <Hero navigate={navigate} content={content} event={event} auth={auth} />,',
);

// Claim flow preserves intent from the Hero.
replaceOnce(
  "claim intent preset",
  '    intendsToAttend: "" as "" | "yes" | "no",',
  '    intendsToAttend: (window.sessionStorage.getItem("hc-attendance-intent") === "yes" ? "yes" : "") as "" | "yes" | "no",',
);
replaceOnce(
  "claim intent cleanup",
  '      setPendingEmailConfirmation(false);\n      setDone(true);',
  '      window.sessionStorage.removeItem("hc-attendance-intent");\n      setPendingEmailConfirmation(false);\n      setDone(true);',
);

// Home tickets: exactly three public cards, no stock counter or description.
replaceOnce(
  "tickets preview",
  /function TicketsPreview\([\s\S]*?\n}\n\nfunction WhoGoingPreview/,
  `function TicketsPreview({
  navigate,
  content,
  ticketTypes,
  onSelectTicket,
}: {
  navigate: (p: Page) => void;
  content: HomePageContent;
  ticketTypes: DbTicketType[];
  onSelectTicket: (id: string) => void;
}) {
  const extendedContent = getExtendedHomeContent(content);
  const publicTickets = selectPublicTicketCards(ticketTypes);

  return (
    <section className="home-section bg-[#0a120a]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-12">
          <div><SectionLabel>{content.tickets_eyebrow}</SectionLabel><DisplayTitle className="text-4xl md:text-5xl">{content.tickets_title}</DisplayTitle></div>
        </div>

        {publicTickets.length === 0 ? (
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8 text-center">
            <Ticket size={36} className="text-[#c9a84c] mx-auto mb-4" />
            <p className="font-['Playfair_Display'] font-bold text-[#f0ebe0] text-2xl mb-2">{extendedContent.tickets_empty_title}</p>
            <p className="text-[#7a9a7a] text-sm mb-6">{extendedContent.tickets_empty_subtitle}</p>
            <Btn variant="outline" onClick={() => navigate("tickets")}>{extendedContent.tickets_empty_cta_label}</Btn>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {publicTickets.map(card => {
              const ticket = card.ticketType;
              const visualStatus = getTicketVisualStatus(ticket);
              const disabled = visualStatus === "sold-out";
              return (
                <div key={ticket.id} className={"bg-[#141f14] border p-8 flex min-h-[300px] flex-col gap-6 transition-colors " + (disabled ? "border-[#c0392b]/20 opacity-60" : "border-[#2d6a4f]/30 hover:border-[#2d6a4f]/60")}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{formatLotLabel("lot_1", "1º lote")}</p>
                      <p className="text-[#f0ebe0] font-['Playfair_Display'] font-bold text-2xl mt-2">{card.displayName}</p>
                    </div>
                    <StatusBadge status={visualStatus} />
                  </div>
                  <div className="border-t border-[#2d6a4f]/20 pt-5">
                    <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl">{formatCurrencyBR(ticket.price_cents)}</p>
                  </div>
                  <div className="mt-auto">
                    <Btn full disabled={disabled} onClick={() => { onSelectTicket(ticket.id); navigate("checkout"); }} variant={visualStatus === "last-units" ? "gold" : "primary"}>
                      {disabled ? extendedContent.tickets_sold_out_label : extendedContent.tickets_buy_label}
                    </Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function WhoGoingPreview`,
);

// Curiosities: remove declared-child-count chart and use the same interactive map.
replaceOptional("children count rows", /\n  const childrenCountRows = profileStats\?\.children_count_distribution \?\? \[\];/, "");
replaceOptional(
  "children count chart",
  /\n              \{childrenCountRows\.length > 0 && \([\s\S]*?<\/div>\n              \)\}/,
  "",
);
replaceOnce(
  "curiosities map",
  /\{topLocations\.length === 0 \? \([\s\S]*?\n              \)\}/,
  `{locations.length === 0 ? (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
                  <EmptyState icon={<MapPin size={42} />} title="Mapa ainda sem dados públicos" subtitle="As cidades aparecerão conforme os ex-alunos autorizarem a exibição da localização." />
                </div>
              ) : (
                <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-5 md:p-6">
                  <HomeMapChart
                    configs={[
                      { key: "foreign", label: "Exterior" },
                      { key: "other_state", label: "Outros estados" },
                      { key: "interior", label: "Interior do RN" },
                      { key: "natal", label: "Natal/RN" },
                    ] as HomeMapStatConfig[]}
                    locations={locations}
                  />
                </div>
              )}`,
);
replaceOptional("top locations constant", /\n  const topLocations = locations\.slice\(0, 8\);/, "");

// Polls: result visualization only after the current user has voted.
replaceOnce(
  "curiosities poll card body",
  /const votedOptions = myVotes\.filter\(v => v\.poll_id === poll\.id\)\.map\(v => v\.option_id\);\n                    return \([\s\S]*?\n                    \);/,
  `const votedOptions = myVotes.filter(v => v.poll_id === poll.id).map(v => v.option_id);
                    const hasVoted = votedOptions.length > 0;
                    return (
                      <div key={poll.id} className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest mb-2">Enquete</p>
                            <h3 className="text-[#f0ebe0] font-['Playfair_Display'] text-2xl font-bold leading-tight">{poll.question}</h3>
                            {poll.description && <p className="text-[#7a9a7a] text-sm mt-2">{poll.description}</p>}
                          </div>
                          <StatusBadge status={poll.status} />
                        </div>

                        <div className="flex flex-col gap-3">
                          {options.map(option => {
                            const count = results[poll.id]?.[option.id] ?? 0;
                            const percent = Math.round((count / total) * 100);
                            const voted = votedOptions.includes(option.id);
                            const disabled = !auth.loggedIn || poll.status !== "open" || busy === option.id || (hasVoted && !poll.allow_multiple_votes);
                            return (
                              <button key={option.id} disabled={disabled} onClick={() => submitVote(poll, option.id)}
                                className={\`text-left border p-4 transition-colors disabled:cursor-not-allowed \${voted ? "border-[#c9a84c] bg-[#1a2e1a]" : "border-[#2d6a4f]/25 bg-[#0d1a0f] hover:border-[#2d6a4f]/60"}\`}>
                                <div className={\`flex items-center justify-between gap-3 \${hasVoted ? "mb-2" : ""}\`}>
                                  <span className="text-[#f0ebe0] text-sm font-semibold">{option.option_text}</span>
                                  {hasVoted && <span className="text-[#7a9a7a] font-mono text-xs">{count} voto{count === 1 ? "" : "s"}</span>}
                                </div>
                                {hasVoted && <>
                                  <div className="h-2 bg-[#1a2e1a] overflow-hidden"><div className="h-full bg-[#2d6a4f]" style={{ width: \`\${percent}%\` }} /></div>
                                  <p className="text-[#7a9a7a] font-mono text-[10px] mt-2">{percent}%</p>
                                </>}
                              </button>
                            );
                          })}
                        </div>

                        {!auth.loggedIn && poll.status === "open" && <p className="text-[#c9a84c] text-xs font-mono">Faça login para votar e visualizar os resultados.</p>}
                        {auth.loggedIn && !hasVoted && poll.status === "open" && <p className="text-[#7a9a7a] text-xs font-mono">Os resultados serão exibidos depois do seu voto.</p>}
                        {poll.allow_multiple_votes && <p className="text-[#7a9a7a] text-xs font-mono">Esta enquete permite múltiplos votos.</p>}
                      </div>
                    );`,
);

// Nossa História is curated with the existing Admin "destaque" control.
replaceOnce(
  "managed history photos",
  '  const filteredPhotos = photos.filter(p => {',
  '  const managedPhotos = photos.filter(p => p.is_featured);\n  const filteredPhotos = managedPhotos.filter(p => {',
);
replaceOnce(
  "history featured duplicate",
  '  const featuredPhotos = photos.filter(p => p.is_featured).slice(0, 6);',
  '  const featuredPhotos: DbPhoto[] = [];',
);
replaceOnce(
  "history popular photos",
  '  const popularPhotos = [...photos].sort((a, b) => (stats[b.id]?.likes_count ?? 0) - (stats[a.id]?.likes_count ?? 0)).slice(0, 6);',
  '  const popularPhotos = [...managedPhotos].sort((a, b) => (stats[b.id]?.likes_count ?? 0) - (stats[a.id]?.likes_count ?? 0)).slice(0, 6);',
);
replaceOnce(
  "history count",
  '<p className="text-[#7a9a7a] mt-2 font-mono text-sm">{photos.length} fotos · curtidas e comentários moderados</p>',
  '<p className="text-[#7a9a7a] mt-2 font-mono text-sm">{managedPhotos.length} fotos selecionadas pela organização</p>',
);

fs.writeFileSync(file, source, "utf8");
console.log("App adjustments applied successfully.");
