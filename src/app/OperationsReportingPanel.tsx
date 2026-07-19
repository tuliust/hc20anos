import { useCallback, useEffect, useState } from "react";
import { Activity, Download, RefreshCw, Users } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./OperationsReportingPanel.css";

type Metrics={total_tickets:number;active_tickets:number;checked_in_tickets:number;pending_tickets:number;invalid_tickets:number;checkin_rate:number;vouchers_required:number;vouchers_delivered:number;last_checkin_at:string|null};
type ActivityRow={event_id:string;attendee_name:string;action:string;operator_email:string|null;notes:string|null;created_at:string};

function csvCell(value:unknown){const text=String(value??"");return `"${text.replaceAll('"','""')}"`;}

export function OperationsReportingPanel(){
 const[metrics,setMetrics]=useState<Metrics|null>(null);const[activity,setActivity]=useState<ActivityRow[]>([]);const[busy,setBusy]=useState(false);const[error,setError]=useState<string|null>(null);
 const load=useCallback(async()=>{setBusy(true);setError(null);const[{data:m,error:me},{data:a,error:ae}]=await Promise.all([supabase.rpc("get_checkin_operation_metrics"),supabase.rpc("get_checkin_activity",{p_limit:20})]);setBusy(false);if(me||ae)return setError(me?.message??ae?.message??"Falha ao carregar indicadores.");setMetrics(Array.isArray(m)?m[0] as Metrics:m as Metrics);setActivity((a??[]) as ActivityRow[])},[]);
 useEffect(()=>{void load();const id=window.setInterval(()=>void load(),15000);return()=>window.clearInterval(id)},[load]);
 async function exportCsv(){setBusy(true);const{data,error:exportError}=await supabase.rpc("export_checkin_report");setBusy(false);if(exportError)return setError(exportError.message);const rows=(data??[]) as Record<string,unknown>[];const headers=rows[0]?Object.keys(rows[0]):["attendee_name","attendee_email","qr_code","ticket_status","checked_in","checked_in_at","checked_in_by_email","vouchers_delivered","order_id"];const csv=[headers.map(csvCell).join(";"),...rows.map(row=>headers.map(key=>csvCell(row[key])).join(";"))].join("\n");const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"});const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`checkin-hc20-${new Date().toISOString().slice(0,10)}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
 return <section className="operations-reporting">
  <header><div><p>Visão operacional</p><h2>Indicadores do check-in</h2></div><div><button onClick={()=>void load()} disabled={busy}><RefreshCw size={17}/> Atualizar</button><button onClick={()=>void exportCsv()} disabled={busy}><Download size={17}/> Exportar CSV</button></div></header>
  {error&&<div className="operations-reporting-error">{error}</div>}
  {metrics&&<div className="operations-metrics"><article><Users/><strong>{metrics.checked_in_tickets}</strong><span>entradas registradas</span></article><article><Activity/><strong>{metrics.checkin_rate}%</strong><span>taxa de check-in</span></article><article><strong>{metrics.pending_tickets}</strong><span>ingressos pendentes</span></article><article><strong>{metrics.vouchers_delivered}/{metrics.vouchers_required}</strong><span>fichas entregues</span></article></div>}
  <div className="operations-activity"><h3>Atividade recente</h3>{activity.map(item=><article key={item.event_id}><div><strong>{item.attendee_name}</strong><span>{item.action.replaceAll("_"," ")}</span></div><div><span>{item.operator_email??"Operador"}</span><small>{new Date(item.created_at).toLocaleString("pt-BR")}</small></div></article>)}{activity.length===0&&<p>Nenhuma atividade registrada.</p>}</div>
 </section>;
}
