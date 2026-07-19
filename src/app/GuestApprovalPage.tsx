import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, Check, Clock3, Search, ShieldCheck, UserPlus, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./GuestApprovalPage.css";

type Sponsor = {
  person_id: string;
  full_name: string;
  class_group: string | null;
  avatar_url: string | null;
  approved_guests: number;
  available_slots: number;
};

type RequestRow = {
  id: string;
  perspective: "guest" | "sponsor";
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  relationship_to_alumni: string;
  sponsor_person_id: string;
  sponsor_name: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  decided_at: string | null;
  decision_notes: string | null;
};

const labels: Record<string, string> = {
  pending: "Aguardando decisão",
  approved: "Aprovado",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
  expired: "Expirado",
  archived: "Arquivado",
};

export function GuestApprovalPage() {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sponsor | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", relationship: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      window.location.assign(`/entrar?next=${encodeURIComponent("/convidado")}`);
      return;
    }
    const [{ data: sponsorData, error: sponsorError }, { data: requestData, error: requestError }] = await Promise.all([
      supabase.rpc("search_external_guest_sponsors", { p_search: search || null }),
      supabase.rpc("get_my_guest_approval_requests"),
    ]);
    if (sponsorError || requestError) setNotice(sponsorError?.message ?? requestError?.message ?? "Falha ao carregar dados.");
    else {
      setSponsors((sponsorData ?? []) as Sponsor[]);
      setRequests((requestData ?? []) as RequestRow[]);
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { void load(); }, [load]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected) return setNotice("Selecione o ex-aluno responsável.");
    setNotice(null);
    const { error } = await supabase.rpc("create_guest_approval_request", {
      p_sponsor_person_id: selected.person_id,
      p_guest_name: form.name,
      p_guest_email: form.email,
      p_guest_phone: form.phone,
      p_relationship_to_alumni: form.relationship,
    });
    if (error) return setNotice(error.message);
    setForm({ name: "", email: "", phone: "", relationship: "" });
    setSelected(null);
    setNotice("Solicitação enviada. O pagamento ficará disponível somente após a aprovação.");
    await load();
  }

  async function decide(id: string, decision: "approved" | "rejected") {
    const notes = window.prompt(decision === "approved" ? "Observação opcional" : "Motivo da rejeição") ?? "";
    const { error } = await supabase.rpc("respond_guest_approval_request", { p_request_id: id, p_decision: decision, p_notes: notes || null });
    if (error) return setNotice(error.message);
    setNotice(decision === "approved" ? "Convidado aprovado." : "Solicitação rejeitada.");
    await load();
  }

  async function cancel(id: string) {
    const { error } = await supabase.rpc("cancel_guest_approval_request", { p_request_id: id });
    if (error) return setNotice(error.message);
    setNotice("Solicitação cancelada.");
    await load();
  }

  const received = requests.filter(item => item.perspective === "sponsor");
  const sent = requests.filter(item => item.perspective === "guest");

  return <main className="guest-page">
    <header className="guest-header">
      <button onClick={() => window.location.assign("/minha-area")}><ArrowLeft size={18}/> Minha área</button>
      <div><p>Convidados externos</p><h1>Solicitações e aprovações</h1><span>O convite precisa ser aprovado por um ex-aluno antes da compra.</span></div>
    </header>

    {notice && <div className="guest-notice">{notice}</div>}
    {loading && <div className="guest-empty">Carregando...</div>}

    {!loading && <div className="guest-grid">
      <section className="guest-panel">
        <div className="guest-panel-title"><UserPlus/><div><h2>Solicitar aprovação</h2><p>Escolha o ex-aluno que será responsável pelo convite.</p></div></div>
        <label className="guest-search"><Search size={18}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por nome ou turma"/></label>
        <div className="guest-sponsors">
          {sponsors.map(sponsor => <button type="button" key={sponsor.person_id} className={selected?.person_id === sponsor.person_id ? "selected" : ""} disabled={sponsor.available_slots <= 0} onClick={() => setSelected(sponsor)}>
            <span className="guest-avatar">{sponsor.avatar_url ? <img src={sponsor.avatar_url} alt=""/> : sponsor.full_name.slice(0,1)}</span>
            <span><strong>{sponsor.full_name}</strong><small>Turma {sponsor.class_group ?? "—"} · {sponsor.available_slots} vagas disponíveis</small></span>
            {selected?.person_id === sponsor.person_id && <Check size={18}/>} 
          </button>)}
        </div>
        <form className="guest-form" onSubmit={submit}>
          <input required value={form.name} onChange={event => setForm({...form,name:event.target.value})} placeholder="Nome completo do convidado"/>
          <input required type="email" value={form.email} onChange={event => setForm({...form,email:event.target.value})} placeholder="E-mail"/>
          <input required value={form.phone} onChange={event => setForm({...form,phone:event.target.value})} placeholder="WhatsApp com DDD"/>
          <input required value={form.relationship} onChange={event => setForm({...form,relationship:event.target.value})} placeholder="Relação com o ex-aluno"/>
          <button disabled={!selected}><ShieldCheck size={18}/> Enviar solicitação</button>
        </form>
      </section>

      <section className="guest-panel">
        <div className="guest-panel-title"><Clock3/><div><h2>Minhas solicitações</h2><p>Acompanhe pedidos enviados e recebidos.</p></div></div>
        <h3>Recebidas para decisão</h3>
        <div className="guest-requests">
          {received.map(item => <article key={item.id}>
            <div><strong>{item.guest_name}</strong><span>{item.relationship_to_alumni}</span><small>{item.guest_email} · {item.guest_phone}</small></div>
            <span className={`guest-status ${item.status}`}>{labels[item.status] ?? item.status}</span>
            {item.status === "pending" && <div className="guest-actions"><button onClick={() => void decide(item.id,"approved")}><Check size={16}/> Aprovar</button><button onClick={() => void decide(item.id,"rejected")}><X size={16}/> Rejeitar</button></div>}
          </article>)}
          {received.length === 0 && <div className="guest-empty">Nenhuma solicitação recebida.</div>}
        </div>
        <h3>Enviadas</h3>
        <div className="guest-requests">
          {sent.map(item => <article key={item.id}>
            <div><strong>{item.sponsor_name}</strong><span>Responsável por {item.guest_name}</span>{item.decision_notes && <small>{item.decision_notes}</small>}</div>
            <span className={`guest-status ${item.status}`}>{labels[item.status] ?? item.status}</span>
            {item.status === "pending" && <div className="guest-actions"><button onClick={() => void cancel(item.id)}><X size={16}/> Cancelar</button></div>}
          </article>)}
          {sent.length === 0 && <div className="guest-empty">Nenhuma solicitação enviada.</div>}
        </div>
      </section>
    </div>}
  </main>;
}
