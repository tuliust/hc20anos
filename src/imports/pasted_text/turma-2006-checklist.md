CHECKLIST — PENDÊNCIAS
Revisão da segunda rodada do projeto "Turma 2006 — 20 anos depois".
Avaliação baseada no App.tsx atualmente ativo (v1) + arquivos Supabase.

CONTEXTO IMPORTANTE:
A segunda escrita do App.tsx (com todas as novas features) falhou por erro de ferramenta.
O App.tsx atual é a versão 1 — sem login, sem pagamento recusado, sem lotes, sem upload modal,
sem reivindicação completa, sem configurações, sem termos, sem moderação de marcações.
O Supabase está conectado (credenciais em utils/supabase/info.tsx, projectId: tjnqqsbwgjcdzcxykyif),
mas o servidor (supabase/functions/server/index.tsx) só tem health check — sem rotas customizadas.

Legenda:
[x] Criado
[~] Parcial — existe mas incompleto
[ ] Não criado
[!] Crítico — bloqueia outros fluxos


───────────────────────────────────────────────────────────────────────────────
1. LOGIN / AUTENTICAÇÃO
───────────────────────────────────────────────────────────────────────────────

[ ] [!] Tela de login criada  ← ausente no App.tsx atual
[ ] Tela de cadastro criada
[ ] Fluxo de logout criado
[ ] Estado de usuário autenticado criado
[ ] Estado de usuário não autenticado criado
[ ] [!] Área do ex-aluno protegida por login  ← acessível sem login
[ ] Página de edição de perfil protegida por login  ← acessível sem login
[ ] Upload de fotos protegido por login  ← botão existe, sem proteção
[ ] Reivindicação de perfil conectada ao usuário autenticado
[ ] [!] Área admin protegida por login  ← link no rodapé, sem senha
[ ] Diferenciação visual entre usuário comum e admin
[ ] Mensagem de acesso negado criada
[ ] Estado de carregamento da autenticação criado
[ ] Integração com Supabase Auth criada ou preparada
  ↳ Nota: Supabase conectado (credenciais ok), mas sem supabase.auth.* em nenhum componente.


Status geral: [ ] Pendente


───────────────────────────────────────────────────────────────────────────────
2. ESTADO DE PAGAMENTO RECUSADO
───────────────────────────────────────────────────────────────────────────────

[ ] Estado visual de pagamento recusado criado
[ ] Mensagem clara de pagamento recusado
[ ] Botão para tentar novamente
[ ] Botão para escolher outro meio de pagamento
[ ] Indicação de que o ingresso não foi confirmado
[ ] Status "declined" previsto no StatusBadge
  ↳ Nota: v1 tem apenas pending/approved/valid/used/invalid — "declined" ausente.
[ ] Estado aparece no checkout
  ↳ Nota: checkout v1 tem step 3 como "aguardando" com botão simulado → direto para confirmation.
[ ] Estado aparece na página de confirmação/retorno
[ ] Estado aparece no admin de pedidos
  ↳ Nota: tabela de pedidos v1 não tem linha com status declined.
[ ] Estado aparece na área "Meu Ingresso"


Status geral: [ ] Pendente


───────────────────────────────────────────────────────────────────────────────
3. GESTÃO DE LOTES NO ADMIN
───────────────────────────────────────────────────────────────────────────────

[ ] Tela admin de ingressos/lotes criada
  ↳ Nota: admin v1 tem 5 abas — dashboard, pedidos, participantes, fotos, perfis. Sem aba Lotes.
[ ] Lista de lotes criada
[ ] Criar novo lote
[ ] Editar lote existente
[ ] Ativar lote
[ ] Pausar lote
[ ] Encerrar lote
[ ] Marcar lote como esgotado
[ ] Definir nome do lote
[ ] Definir preço
[ ] Definir quantidade disponível
[ ] Definir data de início das vendas
[ ] Definir data de fim das vendas
[ ] Definir se permite acompanhante
[ ] Ver quantidade vendida por lote
[ ] Ver quantidade restante por lote
[ ] Integração com tabela ticket_types no Supabase criada ou preparada


Status geral: [ ] Pendente


───────────────────────────────────────────────────────────────────────────────
4. UPLOAD DE FOTOS COMPLETO
───────────────────────────────────────────────────────────────────────────────

[~] Tela ou modal de upload criado
  ↳ Nota: botão "Enviar foto" existe em PhotoWallPage e AlumniAreaPage, mas sem modal ou tela.
[ ] Upload com preview da imagem
[ ] Campo de legenda
[ ] Campo de ano aproximado
[ ] Campo de local
[ ] Campo para marcar pessoas na foto
[~] Busca de ex-alunos na lista pré-carregada
  ↳ Nota: existe na página de detalhe de foto para tagging pós-publicação, não no upload.
[ ] Possibilidade de remover pessoa marcada antes do envio
[ ] Checkbox obrigatório de autorização de uso da imagem
[ ] Estado de envio em andamento
[ ] Estado de envio concluído
[ ] Estado de erro no envio
[~] Foto enviada com status "pendente"
  ↳ Nota: admin mostra fotos para aprovação, mas sem fluxo de envio que gere esse status.
[~] Mensagem informando que a foto passará por moderação
  ↳ Nota: texto estático "todas passam por aprovação" existe em PhotoWallPage.
[ ] Integração com Supabase Storage criada ou preparada
[ ] Integração com tabela photos criada ou preparada
[ ] Integração com tabela photo_tags criada ou preparada


Status geral: [ ] Pendente (botão sem funcionalidade)


───────────────────────────────────────────────────────────────────────────────
5. REIVINDICAÇÃO DE PERFIL COMPLETA
───────────────────────────────────────────────────────────────────────────────

[x] Tela de busca do nome  ← step 1 com input e resultados em tempo real
[x] Tela de seleção do perfil  ← lista de resultados clicável no step 1
[x] Tela para informar e-mail  ← step 2
[x] Tela para informar WhatsApp  ← step 2
[x] Tela de código de verificação  ← step 3 com 6 caixas visuais + input
[ ] Perguntas de confirmação criadas  ← ausente; fluxo pula direto para enviado
[x] Estado "solicitação enviada"  ← step 4
[x] Estado "em análise"  ← badge no step 4
[ ] Estado "aprovado"  ← ausente; não há tela de retorno pós-aprovação
[ ] Estado "rejeitado"  ← ausente
[ ] Estado "perfil já reivindicado"  ← ausente; perfis claimed/confirmed aparecem nos resultados
  sem tratamento diferenciado ou bloqueio visual.
[ ] Orientação para caso de perfil reivindicado por outra pessoa
[ ] Botão para abrir disputa de perfil
[~] Admin consegue aprovar reivindicação  ← botão "Aprovar" existe na aba Perfis do admin
  mas sem lógica de estado — clicar não muda nada visualmente no protótipo atual.
[~] Admin consegue rejeitar reivindicação  ← mesmo caso; botão existe sem efeito.
[ ] Integração com profile_claims criada ou preparada
[ ] Integração com profile_claim_answers criada ou preparada


Status geral: [~] Parcial — 5 de 17 itens criados


───────────────────────────────────────────────────────────────────────────────
6. CONFIGURAÇÕES GERAIS DO EVENTO
───────────────────────────────────────────────────────────────────────────────

[ ] Tela admin de configurações criada
  ↳ Nota: admin v1 não tem aba "Configurações". Abas existentes: dashboard, pedidos,
    participantes, fotos, perfis.
[ ] Campo para editar nome do evento
[ ] Campo para editar descrição do evento
[ ] Campo para editar data
[ ] Campo para editar horário
[ ] Campo para editar local
[ ] Campo para editar endereço
[ ] Campo para editar status do evento
[ ] Campo para editar status das vendas
[ ] Campo para editar texto principal da landing page
[ ] Campo para editar contato da organização
[ ] Campo para editar WhatsApp
[ ] Campo para editar e-mail
[ ] Campo para editar regras gerais
[ ] Campo para editar política de acompanhante
[ ] Campo para editar política de reembolso
[ ] Botão salvar alterações
[ ] Estado de salvamento
[ ] Estado de erro
[ ] Estado de sucesso
[ ] Integração com tabela events no Supabase criada ou preparada


Status geral: [ ] Pendente


───────────────────────────────────────────────────────────────────────────────
7. CHECK-IN MAIS COMPLETO
───────────────────────────────────────────────────────────────────────────────

[~] Tela de leitura de QR Code criada
  ↳ Nota: área visual com ícone Scan existe. Câmera não funcional (protótipo), sem estado
    de câmera ativa/inativa.
[~] Busca manual por nome
  ↳ Nota: campo único aceita qualquer texto. Busca funciona cruzando com códigos de teste
    hardcoded. Não filtra ALUMNI por nome.
[ ] Busca manual por e-mail  ← campo único; sem modo separado por e-mail
[ ] Busca manual por telefone  ← idem
[~] Busca manual por código/QR Code  ← funciona com HC2006-0042, 0041, 0040
[x] Estado "ingresso válido"  ← tela verde com CheckCircle2
[x] Estado "ingresso já utilizado"  ← tela âmbar com AlertTriangle
[x] Estado "pagamento pendente"  ← tela âmbar com Clock
[ ] Estado "pagamento recusado"  ← ausente
[ ] Estado "ingresso cancelado"  ← ausente
[x] Estado "ingresso não encontrado"  ← tela vermelha com XCircle
[~] Botão "Registrar entrada"
  ↳ Nota: botão existe no estado "válido", mas clicar não gera estado visual de confirmação.
    Não há pós-check-in — a tela fica com o mesmo estado "válido".
[ ] Confirmação visual após check-in realizado  ← ausente
[ ] Registro de horário do check-in  ← ausente
[ ] Registro de quem realizou o check-in  ← ausente
[~] Prevenção visual de check-in duplicado
  ↳ Nota: estado "já utilizado" simula isso para o código 0041, mas sem lógica real.
[ ] Integração com tickets criada ou preparada
[ ] Integração com checked_in e checked_in_at criada ou preparada


Status geral: [~] Parcial — estados criados; busca incompleta; pós-check-in ausente


───────────────────────────────────────────────────────────────────────────────
8. TERMOS DE USO E PRIVACIDADE
───────────────────────────────────────────────────────────────────────────────

[ ] Página /termos criada  ← ausente no App.tsx atual
[ ] Página /privacidade criada  ← ausente
[ ] Link para Termos no rodapé  ← rodapé v1 não tem esses links
[ ] Link para Privacidade no rodapé
[ ] Termos cobrem compra de ingressos
[ ] Termos cobrem uso do mural de fotos
[ ] Termos cobrem responsabilidade sobre fotos enviadas
[ ] Termos cobrem moderação de conteúdo
[ ] Termos cobrem check-in
[ ] Privacidade explica dados coletados
[ ] Privacidade explica finalidade dos dados
[ ] Privacidade explica uso de dados de pagamento
[ ] Privacidade explica perfis de ex-alunos
[ ] Privacidade explica fotos e marcações
[ ] Privacidade explica solicitações de remoção
[ ] Privacidade informa contato da organização
[ ] Checkbox de aceite dos Termos no checkout
[ ] Checkbox de consentimento no upload de fotos


Status geral: [ ] Pendente


───────────────────────────────────────────────────────────────────────────────
9. MODERAÇÃO DE MARCAÇÕES
───────────────────────────────────────────────────────────────────────────────

[ ] Tela admin separada de moderação de marcações criada
  ↳ Nota: admin v1 tem aba "Fotos" (moderar fotos inteiras), mas sem aba para marcações.
[ ] Lista de marcações pendentes
[ ] Lista de marcações aprovadas
[ ] Lista de marcações rejeitadas
[ ] Visualização da foto relacionada
[ ] Visualização da pessoa marcada
[ ] Visualização de quem criou a marcação
[ ] Botão aprovar marcação
[ ] Botão rejeitar marcação
[ ] Botão remover marcação
[ ] Link para detalhe da foto
[ ] Estado de marcação pendente
[ ] Estado de marcação aprovada
[ ] Estado de marcação rejeitada
[ ] Estado de marcação removida
[ ] Integração com tabela photo_tags criada ou preparada
[ ] Registro de quem aprovou/rejeitou
[ ] Registro de data da aprovação/rejeição


Status geral: [ ] Pendente
  ↳ Obs: em PhotoDetailPage existe botão "Remover marcação" por pessoa, mas sem fila de
    moderação centralizada no admin.


───────────────────────────────────────────────────────────────────────────────
RESUMO FINAL DA REVISÃO — Segunda rodada
───────────────────────────────────────────────────────────────────────────────

Login/autenticação:
[x] Pendente — nenhum item criado. Bloqueia upload, área do ex-aluno e admin.

Pagamento recusado:
[x] Pendente — checkout v1 não tem estado de falha. Checkout termina em "aguardando".

Gestão de lotes:
[x] Pendente — aba ausente no admin v1.

Upload de fotos:
[x] Pendente — botão existe sem modal ou funcionalidade. Supabase Storage não integrado.

Reivindicação de perfil:
[~] Parcial — 5/17 itens criados (busca, seleção, contatos, código, enviado).
    Faltam: perguntas de confirmação, aprovado, rejeitado, perfil já reivindicado, disputa,
    integração backend.

Configurações do evento:
[x] Pendente — aba ausente no admin v1.

Check-in:
[~] Parcial — 4 estados criados, busca por código funciona.
    Faltam: busca por nome/e-mail/telefone separados, pós-registro, timestamp, integração.

Termos e Privacidade:
[x] Pendente — páginas e links no rodapé ausentes.

Moderação de marcações:
[x] Pendente — aba admin ausente. Apenas botão inline no detalhe da foto.


───────────────────────────────────────────────────────────────────────────────
ESTADO DO SUPABASE
───────────────────────────────────────────────────────────────────────────────

[x] Projeto conectado  ← projectId: tjnqqsbwgjcdzcxykyif em utils/supabase/info.tsx
[x] Credenciais disponíveis  ← publicAnonKey presente
[x] KV Store disponível  ← kv_store_62fab262 com set/get/del/mset/mget/getByPrefix
[x] Servidor Hono disponível  ← supabase/functions/server/index.tsx rodando
[ ] Endpoint de autenticação  ← sem rotas de auth no servidor
[ ] Tabela users/profiles  ← não criada
[ ] Tabela tickets/orders  ← não criada
[ ] Tabela events  ← não criada
[ ] Tabela ticket_types (lotes)  ← não criada
[ ] Tabela photos  ← não criada
[ ] Tabela photo_tags  ← não criada
[ ] Tabela profile_claims  ← não criada
[ ] Tabela profile_claim_answers  ← não criada
[ ] Supabase Storage bucket para fotos  ← não criado
[ ] Supabase Auth integrado no frontend  ← não integrado


───────────────────────────────────────────────────────────────────────────────
PRÓXIMAS PRIORIDADES (ordem de desbloqueio)
───────────────────────────────────────────────────────────────────────────────

1. [CRÍTICO] Re-aplicar a escrita do App.tsx v2 (perdida por erro de ferramenta)
   Conteúdo pronto: login, pagamento recusado, lotes, upload modal, claim completo,
   configurações, check-in completo, termos, privacidade, tag moderation, Modal component.

2. [CRÍTICO] Login / autenticação
   Desbloqueia: área do ex-aluno, upload, reivindicação vinculada, admin protegido.
   Base: Supabase Auth (já conectado). Fluxo: email/password para ex-aluno, código para admin.

3. [ALTA] Estado de pagamento recusado
   Adicionar step declined no checkout + badge "declined" no StatusBadge + linha no admin.

4. [ALTA] Upload de fotos com modal completo
   Modal: preview, legenda, ano, local, tagging, checkbox de autorização, envio para moderação.
   Base: Supabase Storage (bucket photos) + tabela photos + tabela photo_tags.

5. [MÉDIA] Gestão de lotes no admin
   Nova aba "Lotes" com tabela editável, toggle open/closed, criar novo lote.

6. [MÉDIA] Reivindicação de perfil completa
   Adicionar: perguntas de confirmação, aprovado, rejeitado, perfil já reivindicado, disputa.

7. [MÉDIA] Configurações gerais do evento
   Nova aba "Config" no admin com todos os campos editáveis.

8. [MÉDIA] Termos de Uso e Política de Privacidade
   Duas páginas completas + links no rodapé + checkboxes no checkout e upload.

9. [BAIXA] Check-in completo
   Busca por nome/e-mail/telefone separados + confirmação visual pós-registro + timestamp.

10. [BAIXA] Moderação de marcações
    Nova aba no admin com lista de marcações pendentes/aprovadas/rejeitadas.
