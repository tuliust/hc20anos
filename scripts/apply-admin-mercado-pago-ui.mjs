import fs from "node:fs";
import path from "node:path";

const appPath = path.resolve("src/app/App.tsx");
const source = fs.readFileSync(appPath, "utf8");

function replaceOnce(input, before, after, label) {
  const occurrences = input.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${label}: expected exactly one match, found ${occurrences}`);
  }
  return input.replace(before, after);
}

const dashboardBefore = `        {!loading && tab === "dashboard" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {([
                [String(reports.tickets_sold ?? 0), "Ingressos vendidos", "Total"],
                ["R$ " + ((reports.revenue_cents ?? 0) / 100).toFixed(2), "Receita total", "Aprovado"],
                [String(reports.orders_pending ?? 0), "Pagamentos pendentes", "Aguardando"],
                [String(reports.checkins_done ?? 0), "Check-ins realizados", "Evento"],
              ] as const).map(([val,label,delta]) => (
                <div key={label} className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                  <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-3xl mb-1">{val}</p>
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{label}</p>
                  <p className="text-[#c9a84c] text-xs mt-1">{delta}</p>
                </div>
              ))}
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Ingressos por tipo</p>
              {lots.length === 0 ? <EmptyState title="Nenhum lote encontrado" /> : lots.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-4 mb-3">
                  <span className="text-[#7a9a7a] font-mono text-xs w-32 truncate">{l.name}</span>
                  <div className="flex-1 h-2 bg-[#1a2e1a]">
                    <div className="h-full" style={{ width: String(l.available_quantity ? (l.sold_quantity/l.available_quantity)*100 : 0) + "%", background:["#2d6a4f","#40916c","#c9a84c"][idx % 3] }} />
                  </div>
                  <span className="text-[#f0ebe0] font-mono text-xs">{l.sold_quantity}/{l.available_quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}`;

const dashboardAfter = `        {!loading && tab === "dashboard" && (
          <div className="flex flex-col gap-6">
            {(reports.commerce_data_quality_alerts ?? 0) > 0 && (
              <div className="border border-[#c9a84c]/40 bg-[#c9a84c]/10 p-4">
                <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Atenção à base histórica</p>
                <p className="text-[#f0ebe0] text-sm mt-2">{reports.commerce_data_quality_alerts} registro(s) legado(s) exigem revisão de status de reserva. Esses dados não são contabilizados como transações do checkout novo.</p>
              </div>
            )}
            <div>
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">Mercado Pago · fluxo novo</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  [String(reports.mercado_pago_tickets_sold ?? 0), "Ingressos emitidos", "Checkout novo"],
                  ["R$ " + ((reports.mercado_pago_revenue_cents ?? 0) / 100).toFixed(2), "Receita aprovada", "Mercado Pago"],
                  [String(reports.mercado_pago_orders_total ?? 0), "Pedidos", "Transacionais"],
                  [String(reports.mercado_pago_participants ?? 0), "Participantes", "Modelo novo"],
                ] as const).map(([val,label,delta]) => (
                  <div key={label} className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
                    <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-3xl mb-1">{val}</p>
                    <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{label}</p>
                    <p className="text-[#c9a84c] text-xs mt-1">{delta}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">Histórico legado</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                  [String(reports.legacy_tickets_sold ?? 0), "Ingressos históricos", "Legado"],
                  ["R$ " + ((reports.legacy_revenue_cents ?? 0) / 100).toFixed(2), "Receita histórica", "Legado"],
                  [String(reports.legacy_orders_total ?? 0), "Pedidos históricos", "Legado"],
                  [String(reports.legacy_active_reservations ?? 0), "Reservas a revisar", "Qualidade"],
                ] as const).map(([val,label,delta]) => (
                  <div key={label} className="bg-[#101810] border border-[#2d6a4f]/15 p-5">
                    <p className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-2xl mb-1">{val}</p>
                    <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{label}</p>
                    <p className="text-[#7a9a7a] text-xs mt-1">{delta}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#141f14] border border-[#2d6a4f]/25 p-6">
              <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-4">Ingressos por tipo</p>
              {lots.length === 0 ? <EmptyState title="Nenhum lote encontrado" /> : lots.map((l, idx) => (
                <div key={l.id} className="flex items-center gap-4 mb-3">
                  <span className="text-[#7a9a7a] font-mono text-xs w-32 truncate">{l.name}</span>
                  <div className="flex-1 h-2 bg-[#1a2e1a]">
                    <div className="h-full" style={{ width: String(l.available_quantity ? Math.min((l.sold_quantity/l.available_quantity)*100, 100) : 0) + "%", background:["#2d6a4f","#40916c","#c9a84c"][idx % 3] }} />
                  </div>
                  <span className="text-[#f0ebe0] font-mono text-xs">{l.sold_quantity}/{l.available_quantity}</span>
                </div>
              ))}
            </div>
          </div>
        )}`;

const ordersBefore = `        {!loading && tab === "orders" && (
          <div className="overflow-x-auto">
            <div className="flex gap-2 mb-4">
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" variant="ghost" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
            {orders.length === 0 ? <EmptyState title="Nenhum pedido encontrado" /> : (
              <table className="w-full">
                <thead><tr className="border-b border-[#2d6a4f]/20">{["Codigo","Nome","Ingresso","Valor","Status"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{h}</th>)}</tr></thead>
                <tbody>{orders.map(o => (
                  <tr key={o.id} className="border-b border-[#2d6a4f]/10 hover:bg-[#141f14] transition-colors">
                    <td className="py-4 px-4 text-[#c9a84c] font-['JetBrains_Mono'] text-xs">{o.id}</td>
                    <td className="py-4 px-4 text-[#f0ebe0] text-sm">{o.buyer_name}</td>
                    <td className="py-4 px-4 text-[#7a9a7a] text-sm">{o.ticket_type_id}</td>
                    <td className="py-4 px-4 text-[#f0ebe0] font-mono text-sm">R$ {(o.total_amount_cents / 100).toFixed(2)}</td>
                    <td className="py-4 px-4"><StatusBadge status={o.payment_status} /></td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        )}`;

const ordersAfter = `        {!loading && tab === "orders" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2">
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" variant="ghost" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
            {orders.length === 0 ? <EmptyState title="Nenhum pedido encontrado" /> : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1280px]">
                  <thead><tr className="border-b border-[#2d6a4f]/20">{["Origem","Pedido","Comprador","Produto / lote","Participantes","Valor","Pagamento","Reserva","Mercado Pago","Webhook","Status"].map(h => <th key={h} className="text-left py-3 px-4 text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
                  <tbody>{orders.map(o => (
                    <tr key={o.id} className="border-b border-[#2d6a4f]/10 hover:bg-[#141f14] transition-colors align-top">
                      <td className="py-4 px-4"><span className={"inline-flex px-2 py-1 text-[9px] font-mono uppercase tracking-wider " + (o.commerce_source === "mercado_pago" ? "bg-[#2d6a4f]/30 text-[#74c69d]" : "bg-[#1e2a1e] text-[#7a9a7a]")}>{o.commerce_source === "mercado_pago" ? "Mercado Pago" : "Legado"}</span>{o.data_quality_alert && <p className="text-[#c9a84c] text-[10px] mt-2 max-w-[180px]">Revisar reserva</p>}</td>
                      <td className="py-4 px-4 text-[#c9a84c] font-['JetBrains_Mono'] text-xs max-w-[180px] break-all">{o.id}</td>
                      <td className="py-4 px-4"><p className="text-[#f0ebe0] text-sm">{o.buyer_name}</p><p className="text-[#7a9a7a] text-xs mt-1">{o.buyer_email}</p></td>
                      <td className="py-4 px-4"><p className="text-[#f0ebe0] text-sm">{o.ticket_type_id}</p><p className="text-[#7a9a7a] text-xs mt-1">{o.lot_name ?? "Sem lote"}</p></td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-xs">{o.participant_count ?? 0} pessoa(s)<br />{o.extras_count ?? 0} extra(s)</td>
                      <td className="py-4 px-4 text-[#f0ebe0] font-mono text-sm">R$ {(Number(o.total_amount_cents ?? 0) / 100).toFixed(2)}{Number(o.extras_amount_cents ?? 0) > 0 && <p className="text-[#7a9a7a] text-[10px] mt-1">Extras R$ {(Number(o.extras_amount_cents) / 100).toFixed(2)}</p>}</td>
                      <td className="py-4 px-4 text-[#7a9a7a] text-xs">{o.payment_type ?? o.payment_method ?? "Não informado"}{o.installments ? <p className="mt-1">{o.installments}x</p> : null}</td>
                      <td className="py-4 px-4"><StatusBadge status={o.reservation_status ?? "unknown"} /></td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-[10px] max-w-[220px] break-all"><p>{o.payment_provider_order_id ?? "Sem pagamento"}</p><p className="mt-2">{o.payment_provider_preference_id ?? "Sem preferência"}</p><p className="mt-2 uppercase">{o.payment_environment ?? "-"}</p></td>
                      <td className="py-4 px-4 text-[#7a9a7a] font-mono text-xs">{o.webhook_events ?? 0} evento(s){Number(o.webhook_failures ?? 0) > 0 && <p className="text-[#e74c3c] mt-1">{o.webhook_failures} falha(s)</p>}</td>
                      <td className="py-4 px-4"><StatusBadge status={o.payment_status} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}`;

const reportsBefore = `        {!loading && tab === "reports" && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(reports).map(([key, value]) => (
                <div key={key} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5">
                  <p className="text-[#f0ebe0] font-mono text-2xl">{key.includes("cents") ? "R$ " + (Number(value)/100).toFixed(2) : value}</p>
                  <p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{key.replaceAll("_", " ")}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {canExport && <Btn size="sm" onClick={exportPeopleCSV}><Download size={14} />CSV ex-alunos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
          </div>
        )}`;

const reportsAfter = `        {!loading && tab === "reports" && (
          <div className="flex flex-col gap-6">
            {[
              ["Mercado Pago", ["mercado_pago_orders_total","mercado_pago_orders_approved","mercado_pago_revenue_cents","mercado_pago_tickets_sold","mercado_pago_participants","pix_orders","card_orders","preferences_active","preferences_expired","payment_events_total","payment_events_failed","notification_jobs_pending","notification_jobs_failed"]],
              ["Histórico legado", ["legacy_orders_total","legacy_orders_approved","legacy_revenue_cents","legacy_tickets_sold","legacy_active_reservations"]],
              ["Pedidos e reservas", ["orders_total","orders_pending","orders_approved","orders_rejected","orders_cancelled","orders_expired","orders_refunded","orders_charged_back","reservations_active","reservations_converted","reservations_expired"]],
              ["Financeiro e extras", ["revenue_cents","subtotal_cents","extras_revenue_cents","average_order_cents","drinks_packages","barbecue_packages","vouchers_delivered","refund_requests_open","refund_amount_cents","transfers_open"]],
              ["Evento e conteúdo", ["tickets_sold","participants_approved","checkins_done","checkins_pending","people_confirmed","people_claimed","people_unclaimed","photos_total","photos_approved","photos_pending","photos_rejected","claims_pending","disputes_pending","removals_pending","commerce_data_quality_alerts"]],
            ].map(([group, keys]) => (
              <section key={String(group)}>
                <p className="text-[#7a9a7a] font-mono text-xs uppercase tracking-wider mb-3">{group}</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(keys as string[]).filter(key => Object.prototype.hasOwnProperty.call(reports, key)).map(key => {
                    const value = reports[key] ?? 0;
                    return <div key={key} className="bg-[#141f14] border border-[#2d6a4f]/25 p-5"><p className="text-[#f0ebe0] font-mono text-2xl">{key.includes("cents") ? "R$ " + (Number(value)/100).toFixed(2) : value}</p><p className="text-[#7a9a7a] font-mono text-[10px] uppercase tracking-wider">{key.replaceAll("_", " ")}</p></div>;
                  })}
                </div>
              </section>
            ))}
            <div className="flex flex-wrap gap-2">
              {canExport && <Btn size="sm" onClick={exportPeopleCSV}><Download size={14} />CSV ex-alunos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportOrdersCSV(event.id)}><Download size={14} />CSV pedidos</Btn>}
              {canExport && <Btn size="sm" onClick={() => event && exportTicketsCSV(event.id)}><Download size={14} />CSV ingressos</Btn>}
            </div>
          </div>
        )}`;

let updated = source;
updated = replaceOnce(updated, dashboardBefore, dashboardAfter, "dashboard block");
updated = replaceOnce(updated, ordersBefore, ordersAfter, "orders block");
updated = replaceOnce(updated, reportsBefore, reportsAfter, "reports block");

fs.writeFileSync(appPath, updated);
console.log("Updated src/app/App.tsx with Mercado Pago-aware admin UI.");
