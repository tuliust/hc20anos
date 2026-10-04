import { useEffect, useState } from "react";
import { ArrowLeft, Send, Star } from "lucide-react";
import { createMemory, getApprovedMemories } from "../../lib/services";
import type { DbMemory } from "../../lib/engagement.types";
import type { AuthState, Page } from "../app.types";
import { DEFAULT_EVENT_ID } from "../app.constants";
import { formatDateShortBR } from "../appFormatters";
import { Btn, DisplayTitle, EmptyState, FieldArea, LoadingState, SectionLabel } from "../components/AppPrimitives";

export function MemoriesPage({ navigate, auth }: { navigate: (p: Page) => void; auth: AuthState }) {
  const [memories, setMemories] = useState<DbMemory[]>([]);
  const [memoryText, setMemoryText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const maxChars = 420;

  async function loadMemories() {
    setLoading(true);
    setError("");
    try {
      setMemories(await getApprovedMemories(DEFAULT_EVENT_ID));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar memórias.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMemories(); }, []);

  async function submitMemory() {
    if (!auth.loggedIn) { navigate("login"); return; }
    if (memoryText.trim().length < 10) { setError("Escreva uma memória com pelo menos 10 caracteres."); return; }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await createMemory({
        eventId: DEFAULT_EVENT_ID,
        userId: auth.userId,
        authorName: auth.name,
        memoryText: memoryText.trim().slice(0, maxChars),
        isAnonymous: false,
      });
      setMemoryText("");
      setMessage("Memória adicionada à caixa de memórias.");
      await loadMemories();
    } catch (err) {
      const nextMessage = err instanceof Error ? err.message : "Erro ao enviar memória.";
      setError(nextMessage.includes("profile_registration_required") ? "Conclua seu cadastro antes de enviar uma memória." : nextMessage);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080f08] pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4">
        <button onClick={() => navigate("photo-wall")} className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"><ArrowLeft size={16} /> Voltar à Nossa História</button>
        <SectionLabel>Caixa de Memórias</SectionLabel>
        <DisplayTitle className="text-4xl md:text-6xl mb-4">O que ficou daquele tempo?</DisplayTitle>
        <p className="text-[#8ab89a] text-sm md:text-base max-w-2xl mb-10">Compartilhe uma lembrança curta da turma, dos professores, dos corredores, das gincanas ou de qualquer momento que mereça ficar no acervo do reencontro.</p>

        <div className="grid grid-cols-1 md:grid-cols-[0.9fr_1.1fr] gap-8">
          <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-6 flex flex-col gap-5 h-fit">
            <p className="text-[#c9a84c] font-mono text-xs uppercase tracking-wider">Enviar memória</p>
            <FieldArea label="Sua memória" value={memoryText} onChange={value => setMemoryText(value.slice(0, maxChars))} rows={6} />
            <div className="text-xs font-mono text-[#7a9a7a]"><span>{memoryText.length}/{maxChars} caracteres</span></div>
            {message && <p className="text-[#74c69d] text-xs font-mono bg-[#2d6a4f]/10 border border-[#2d6a4f]/30 px-4 py-3">{message}</p>}
            {error && <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">{error}</p>}
            <Btn full onClick={submitMemory} disabled={busy}><Send size={16} />Adicionar memória</Btn>
          </div>

          <div className="flex flex-col gap-4">
            {loading && <LoadingState message="Carregando memórias..." />}
            {!loading && memories.length === 0 && <EmptyState title="Nenhuma memória ainda" subtitle="Compartilhe uma lembrança para ela aparecer aqui." />}
            {memories.map(memory => (
              <div key={memory.id} className={`bg-[#141f14] border p-6 ${memory.is_featured ? "border-[#c9a84c]/60" : "border-[#2d6a4f]/25"}`}>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[#c9a84c] font-mono text-[10px] uppercase tracking-widest">{memory.is_featured ? "Memória destacada" : "Memória da turma"}</p>
                  {memory.is_featured && <Star size={14} className="text-[#c9a84c]" />}
                </div>
                <p className="text-[#f0ebe0] text-lg leading-relaxed font-['Playfair_Display']">“{memory.memory_text}”</p>
                <p className="text-[#7a9a7a] font-mono text-xs mt-4">{memory.is_anonymous ? "Anônimo" : (memory.author_name ?? "Ex-aluno")} · {formatDateShortBR(memory.created_at)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
