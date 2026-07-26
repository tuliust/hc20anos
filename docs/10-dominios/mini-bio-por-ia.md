---
status: canonical
owner: tuliust
last_verified: 2026-07-26
last_verified_commit: c6966d9e73253c93c6ac719bc94a6a659f9dead4
source_files:
  - api/generate-profile-bio.ts
  - src/lib/profileBioAi.ts
  - src/editProfileQuestionnaireBioEnhancement.ts
  - build/profileClaimProfileAiTransform.mjs
  - scripts/verify-profile-bio-api.mjs
---

# Geração de mini bio por IA

## Objetivo

Auxiliar o ex-aluno a transformar respostas estruturadas do perfil em uma mini biografia curta, editável e adequada à apresentação pública.

## Princípio central

A IA sugere texto. O usuário continua responsável por revisar, editar e decidir se a mini bio será salva e exibida.

A geração não pode:

- inventar fatos;
- inferir informações sensíveis;
- publicar automaticamente;
- substituir preferências de privacidade;
- usar dados de outros usuários;
- retornar contatos privados ou credenciais.

## Componentes

### Cliente

`src/lib/profileBioAi.ts` prepara a chamada para a Vercel Function e normaliza a resposta.

O enhancement de edição do perfil integra a geração ao questionário e à interface existente.

### Vercel Function

`api/generate-profile-bio.ts` executa server-side para proteger credenciais e aplicar controles antes de chamar o modelo.

### Build transform

`profileClaimProfileAiTransform.mjs` injeta ou atualiza a integração no código compilado. Mudanças precisam validar o bundle final, não apenas o texto de `App.tsx`.

## Entrada

A Function recebe somente campos relevantes à mini bio, como respostas sobre trajetória, localização, profissão, interesses ou lembranças, conforme o formulário vigente.

Antes do envio ao modelo:

- campos desconhecidos devem ser descartados;
- textos devem ser normalizados e limitados;
- valores vazios devem ser removidos;
- dados sensíveis ou de contato não devem ser incluídos;
- o payload deve respeitar o schema aceito.

## Saída

O contrato solicita texto em português do Brasil com características como:

- terceira pessoa;
- duas a quatro frases;
- até 500 caracteres;
- tom natural e respeitoso;
- apenas fatos presentes na entrada;
- ausência de dados de contato ou informação sensível.

A resposta é estruturada por schema JSON para reduzir ambiguidades.

## Provedores

A Function aceita, em ordem operacional:

1. chamada direta com `OPENAI_API_KEY`;
2. Vercel AI Gateway com `AI_GATEWAY_API_KEY`;
3. Vercel AI Gateway usando `VERCEL_OIDC_TOKEN` quando disponível.

`OPENAI_PROFILE_MODEL` define o modelo. O padrão atual é `gpt-5-mini`; no Gateway, o prefixo do provedor pode ser acrescentado automaticamente.

## Segurança de origem

A Function verifica a origem da requisição para reduzir uso indevido fora do site esperado. Ambientes locais e previews precisam estar explicitamente contemplados pela configuração ou pelo contrato vigente.

Controle de origem não substitui autenticação, rate limit ou validação do payload.

## Rate limit

O endpoint mantém um limite em memória de oito solicitações por janela de dez minutos, conforme a implementação atual.

Limitações:

- memória não é compartilhada de forma confiável entre todas as instâncias serverless;
- reinicialização da Function pode limpar o contador;
- o controle atual reduz abuso casual, mas não é rate limit distribuído.

Para proteção mais forte, migrar o contador para armazenamento compartilhado ou mecanismo gerenciado.

## Prompt e política de conteúdo

O prompt deve instruir o modelo a:

- não inventar;
- não completar lacunas com suposições;
- não mencionar que é uma IA;
- não incluir e-mail, telefone, documentos ou endereço;
- não produzir texto ofensivo ou discriminatório;
- escrever somente a mini bio solicitada.

O código não deve concatenar instruções do usuário em posição que permita substituir as regras do sistema.

## Fluxo

1. Usuário preenche o questionário.
2. Cliente seleciona e normaliza respostas permitidas.
3. Vercel Function valida método, origem, rate limit e schema.
4. Function escolhe provedor configurado.
5. Modelo retorna JSON estruturado.
6. Function valida e limita a mini bio.
7. Cliente apresenta a sugestão.
8. Usuário pode editar ou descartar.
9. Salvamento do perfil ocorre pelo fluxo normal e respeita flags de privacidade.

## Tratamento de falhas

A interface deve diferenciar:

- configuração ausente;
- rate limit excedido;
- entrada insuficiente;
- erro do provedor;
- resposta inválida;
- indisponibilidade temporária.

Falha de IA não pode impedir edição manual do perfil.

## Privacidade e retenção

- Enviar somente dados necessários.
- Não enviar respostas de reivindicação de identidade.
- Não enviar tokens ou IDs internos sem necessidade.
- Não registrar prompts completos com dados pessoais em logs permanentes.
- Não persistir a resposta antes da confirmação do usuário.
- Tratar a mini bio salva como dado de perfil sujeito à preferência de exibição.

## Testes e verificação

O build executa `scripts/verify-profile-bio-api.mjs`.

Comandos:

```bash
npm run verify:profile-bio-ai
npm run build
```

Cenários mínimos:

- entrada válida gera texto dentro do limite;
- saída permanece em terceira pessoa;
- dado ausente não é inventado;
- contatos presentes na entrada não aparecem na saída;
- payload excessivo é limitado ou rejeitado;
- origem inválida é rejeitada;
- rate limit retorna erro previsível;
- ausência de provedor produz mensagem controlada;
- JSON inválido do modelo não é salvo;
- usuário continua podendo escrever manualmente;
- texto gerado não é publicado sem salvamento e autorização.

## Observabilidade

Registrar apenas:

- status e latência;
- provedor e modelo sem credenciais;
- tipo de erro;
- tamanho aproximado de entrada e saída;
- identificador técnico não sensível quando necessário.

Não registrar o conteúdo integral por padrão.

## Dívidas conhecidas

- Rate limit em memória não é distribuído.
- A integração depende de transform de build.
- Ainda não existe contrato gerado das variáveis e códigos de erro; há inventários manuais em `docs/30-contratos/`.
