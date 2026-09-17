# Ajustes de perfil — 17/09/2026

Primeira rodada do backlog solicitado para o HC 20 Anos.

## Implementado

- respostas do questionário de `/editar-perfil` passam a ser salvas automaticamente;
- botão manual `Salvar respostas` fica oculto;
- ação `Gerar perfil com IA` foi reposicionada para a área da Mini Bio;
- geração de mini bio passa a usar primeira pessoa e não usar o nome da pessoa no texto;
- novos perfis de ex-alunos usam preferências públicas ativas por padrão, incluindo redes sociais;
- cadastro de Usuário Externo passa a perguntar se estudou no HC e, conforme a resposta, coleta ano/sala ou relação com a Turma 2006;
- dados de vínculo do usuário externo são armazenados em campos estruturados de `profiles` sem tornar o perfil externo público.

## Banco

Campos adicionados em `public.profiles`:

- `studied_at_hc`;
- `hc_graduation_year`;
- `hc_class_group`;
- `relationship_to_class`.

O default de `show_social_links` foi alterado para `true` para novos perfis. Preferências já salvas por usuários existentes não são sobrescritas.
