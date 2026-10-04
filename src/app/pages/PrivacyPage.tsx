import { ArrowLeft, FileText } from "lucide-react";
import type { Page } from "../app.types";
import { Btn, DisplayTitle, SectionLabel } from "../components/AppPrimitives";

const SECTIONS = [
  { title: "1. Dados que coletamos", body: "Podemos tratar nome, e-mail, telefone/WhatsApp, cidade, profissão, fotos enviadas voluntariamente, data de nascimento declarada, respostas de verificação de identidade, informações de perfil e dados técnicos de navegação. Dados associados a pedidos antigos, inclusive identificadores necessários ao pagamento, permanecem vinculados ao histórico comercial e ao reembolso." },
  { title: "2. Como usamos seus dados", body: "Os dados são usados para identificar ex-alunos, permitir criação e atualização de perfis, exibir informações autorizadas no diretório e nas curiosidades, administrar conteúdo publicado, operar a conta do usuário e, quando aplicável, manter o histórico de pagamentos e processar reembolsos." },
  { title: "3. Dados de ex-alunos pré-cadastrados", body: "A lista foi constituída com base em registros históricos do Colégio HC. Os dados iniciais incluem apenas informações necessárias para identificar integrantes da turma. O ex-aluno pode reivindicar, corrigir ou solicitar a remoção do próprio perfil." },
  { title: "4. Dados de pagamento e reembolso", body: "Os pagamentos foram processados pelo Mercado Pago. O HC20Anos não armazena dados completos de cartão. Identificadores de pedidos e pagamentos podem ser mantidos para conciliação, auditoria e execução dos reembolsos decorrentes do cancelamento do encontro." },
  { title: "5. Fotos e marcações", body: "Fotos enviadas são armazenadas com segurança e exibidas imediatamente. Qualquer pessoa pode solicitar a remoção da própria imagem ou de uma marcação." },
  { title: "6. Controles de privacidade", body: "Você pode escolher exibir ou ocultar informações como cidade, profissão, redes sociais e presença no diretório público. Também pode controlar permissões relacionadas a marcações em fotos." },
  { title: "7. Solicitações de remoção", body: "Você pode solicitar correção ou remoção de informações e imagens pelos recursos disponíveis na plataforma ou pelo contato informado abaixo. Solicitações serão analisadas conforme a natureza do dado e as obrigações legais aplicáveis." },
  { title: "8. Seus direitos (LGPD)", body: "Nos termos da Lei 13.709/2018 (LGPD), você pode solicitar acesso, correção, informações sobre tratamento, revogação de consentimento e exclusão quando juridicamente aplicável. Registros que precisem ser mantidos por obrigação legal ou para defesa de direitos poderão ser preservados pelo prazo necessário." },
  { title: "9. Contato", body: "Para exercer seus direitos ou tirar dúvidas sobre privacidade, escreva para hc20anos@gmail.com." },
];

export function PrivacyPage({ navigate }: { navigate: (page: Page) => void }) {
  return (
    <div className="min-h-screen bg-[#0d1a0f] pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4">
        <button
          onClick={() => navigate("home")}
          className="flex items-center gap-2 text-[#7a9a7a] text-sm font-mono mb-8 hover:text-[#f0ebe0] transition-colors"
        >
          <ArrowLeft size={16} /> Voltar
        </button>
        <SectionLabel>Colégio Henrique Castriciano · Turma 2006</SectionLabel>
        <DisplayTitle className="text-4xl md:text-5xl mb-3">Política de Privacidade</DisplayTitle>
        <p className="text-[#7a9a7a] font-mono text-sm mb-12">
          Última atualização: 25 de setembro de 2026 · Em conformidade com a LGPD
        </p>
        <div className="flex flex-col gap-8">
          {SECTIONS.map(section => (
            <div key={section.title} className="border-l-2 border-[#2d6a4f]/40 pl-6">
              <p className="text-[#c9a84c] font-['Playfair_Display'] font-bold text-lg mb-3">{section.title}</p>
              <p className="text-[#8ab89a] text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Btn variant="outline" onClick={() => navigate("terms")}>
            <FileText size={16} />Termos de Uso
          </Btn>
          <Btn variant="ghost" onClick={() => navigate("home")}>Voltar ao site</Btn>
        </div>
      </div>
    </div>
  );
}
