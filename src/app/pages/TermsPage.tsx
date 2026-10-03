import { ArrowLeft, FileText } from "lucide-react";
import type { Page } from "../app.types";
import { Btn, DisplayTitle, SectionLabel } from "../components/AppPrimitives";

const SECTIONS = [
  { title: "1. Aceitação dos Termos", body: "Ao utilizar o HC20Anos, espaço digital da Turma 2006 do Henrique Castriciano, você concorda com estes Termos de Uso e com as regras de convivência e privacidade da plataforma." },
  { title: "2. Cancelamento do encontro e pagamentos", body: "O encontro de 20 anos previsto para 2026 foi cancelado. Novas vendas de ingressos estão encerradas. Os pagamentos aprovados realizados antes do cancelamento serão reembolsados integralmente pela organização por meio do Mercado Pago." },
  { title: "3. Dados Pessoais", body: "A coleta e o uso de dados pessoais estão descritos na Política de Privacidade. Ao criar ou atualizar um perfil, você concorda com o tratamento dos dados para as finalidades descritas nessa política." },
  { title: "4. Fotos e Imagens", body: "Ao enviar uma foto, você declara ter o direito de compartilhá-la e autoriza a exibição no site. Fotos ofensivas, inadequadas ou que violem direitos de terceiros poderão ser removidas. Qualquer pessoa pode solicitar a remoção da própria imagem." },
  { title: "5. Perfis de Ex-Alunos", body: "A lista da Turma 2006 foi criada com base em registros históricos. Cada ex-aluno pode reivindicar ou atualizar seu perfil por meio do processo de verificação disponível no site. Informações falsas ou uso indevido podem resultar na suspensão do acesso." },
  { title: "6. Participação e convivência", body: "O HC20Anos existe para registrar memórias, perfis, fotos, curiosidades e informações sobre a turma. Conteúdos ofensivos, discriminatórios, falsos ou que violem direitos de terceiros não são permitidos." },
  { title: "7. Histórico de pedidos e reembolsos", body: "Pedidos e ingressos já emitidos permanecem acessíveis aos respectivos usuários como registro da compra e para acompanhamento do reembolso. Esses registros não representam ingresso válido para um evento futuro." },
  { title: "8. Conteúdo publicado", body: "Fotos, memórias e enquetes são publicadas automaticamente. A administração pode ocultar ou remover conteúdo que viole estes termos ou a Política de Privacidade." },
  { title: "9. Continuidade do site", body: "O cancelamento do encontro não encerra o HC20Anos. A plataforma pode continuar disponível como acervo e espaço de atualização da Turma 2006, com funcionalidades ajustadas ao longo do tempo." },
  { title: "10. Contato", body: "Dúvidas sobre o site, pagamentos ou reembolsos podem ser encaminhadas para hc20anos@gmail.com." },
];

export function TermsPage({ navigate }: { navigate: (page: Page) => void }) {
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
        <DisplayTitle className="text-4xl md:text-5xl mb-3">Termos de Uso</DisplayTitle>
        <p className="text-[#7a9a7a] font-mono text-sm mb-12">Última atualização: 25 de setembro de 2026</p>
        <div className="flex flex-col gap-8">
          {SECTIONS.map(section => (
            <div key={section.title} className="border-l-2 border-[#2d6a4f]/40 pl-6">
              <p className="text-[#c9a84c] font-['Playfair_Display'] font-bold text-lg mb-3">{section.title}</p>
              <p className="text-[#8ab89a] text-sm leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-wrap gap-4">
          <Btn variant="outline" onClick={() => navigate("privacy")}>
            <FileText size={16} />Política de Privacidade
          </Btn>
          <Btn variant="ghost" onClick={() => navigate("home")}>Voltar ao site</Btn>
        </div>
      </div>
    </div>
  );
}
