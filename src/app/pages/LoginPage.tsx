import { useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, RefreshCw } from "lucide-react";
import { DEV_MODE, supabase } from "../../lib/supabase";
import { getCurrentAdminUser, MOCK_PEOPLE } from "../../lib/services";
import type { AuthState, Page } from "../app.types";
import { Btn, DisplayTitle, Field } from "../components/AppPrimitives";

export function LoginPage({
  navigate,
  onLogin,
}: {
  navigate: (page: Page) => void;
  onLogin: (auth: AuthState) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError("");
    setLoading(true);

    try {
      if (!email.includes("@")) {
        setError("Informe um e-mail válido.");
        setLoading(false);
        return;
      }

      if (password.length < 4) {
        setError("Senha muito curta. Use ao menos 4 caracteres.");
        setLoading(false);
        return;
      }

      const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

      if (authErr || !data.user) {
        if (!DEV_MODE) {
          setError("Credenciais inválidas.");
          setLoading(false);
          return;
        }

        const prefix = email.split("@")[0].split(".")[0].toLowerCase();
        const match = MOCK_PEOPLE.find(person => person.full_name.toLowerCase().includes(prefix));

        onLogin({
          loggedIn: true,
          isAdmin: false,
          name: match?.full_name || "Ana Paula Oliveira",
          userId: "dev-user",
          email,
          role: null,
        });

        setLoading(false);
        return;
      }

      const displayName = data.user.user_metadata?.full_name ?? data.user.email ?? "Ex-aluno";
      const adminUser = await getCurrentAdminUser(data.user.id).catch(() => null);

      onLogin({
        loggedIn: true,
        isAdmin: !!adminUser,
        name: displayName,
        userId: data.user.id,
        email: data.user.email,
        role: adminUser?.role ?? null,
      });
    } catch {
      setError("Erro de conexão. Tente novamente.");
    }

    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: "radial-gradient(ellipse 100% 80% at 50% 20%, #1a4d2e 0%, #0a140b 70%)" }}
    >
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <p className="text-[#c9a84c] tracking-[0.4em] text-[10px] font-mono font-bold uppercase mb-4">
            Colégio Henrique Castriciano · Natal, RN
          </p>
          <h1 className="font-['Playfair_Display'] font-black text-[#f0ebe0] text-4xl uppercase mb-2">Turma 2006</h1>
          <p className="font-['Playfair_Display'] italic text-[#c9a84c] text-xl">20 anos depois</p>
        </div>

        <div className="bg-[#141f14] border border-[#2d6a4f]/30 p-8">
          <div className="flex flex-col gap-5">
            <DisplayTitle className="text-xl">Entrar como ex-aluno</DisplayTitle>

            <Field
              label="E-mail"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={setEmail}
              icon={<Mail size={16} />}
            />

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-[#7a9a7a] mb-2">Senha</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#7a9a7a]" />
                <input
                  type={showPw ? "text" : "password"}
                  data-native-password-visibility="true"
                  placeholder="••••••••"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  onKeyDown={event => event.key === "Enter" && submit()}
                  className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 pl-12 pr-12 text-sm focus:outline-none focus:border-[#2d6a4f]"
                />
                <button
                  type="button"
                  data-native-password-toggle="true"
                  aria-label={showPw ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPw}
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7a9a7a] hover:text-[#f0ebe0]"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-[#e74c3c] text-xs font-mono bg-[#c0392b]/10 border border-[#c0392b]/30 px-4 py-3">
                {error}
              </p>
            )}

            <Btn full onClick={submit} disabled={loading}>
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Btn>

            <p className="text-[#7a9a7a] text-xs text-center">
              Ainda não tem conta?{" "}
              <button
                onClick={() => navigate("claim-profile")}
                className="text-[#2d6a4f] hover:text-[#40916c] underline"
              >
                Criar meu perfil
              </button>
            </p>

            {DEV_MODE && (
              <p className="text-[#3a5a3a] text-[10px] font-mono text-center border-t border-[#2d6a4f]/10 pt-4">
                Modo desenvolvimento: qualquer e-mail + senha com 4+ caracteres
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("home")}
            className="text-[#7a9a7a] text-sm hover:text-[#f0ebe0] transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Voltar ao site
          </button>
        </div>
      </div>
    </div>
  );
}
