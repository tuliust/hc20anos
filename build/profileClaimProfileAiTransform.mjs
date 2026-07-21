function replaceRequired(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`[profile-claim-ai] Trecho não encontrado: ${label}`);
  const second = source.indexOf(search, first + search.length);
  if (second >= 0) throw new Error(`[profile-claim-ai] Trecho duplicado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function replaceRangeRequired(source, start, end, replacement, label) {
  const first = source.indexOf(start);
  if (first < 0) throw new Error(`[profile-claim-ai] Início não encontrado: ${label}`);
  const second = source.indexOf(start, first + start.length);
  if (second >= 0) throw new Error(`[profile-claim-ai] Início duplicado: ${label}`);
  const endIndex = source.indexOf(end, first + start.length);
  if (endIndex < 0) throw new Error(`[profile-claim-ai] Fim não encontrado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(endIndex);
}

function assertMarkers(code) {
  const required = [
    "Apelido, nickname ou ex-perfil do Fotolog",
    "Meu perfil",
    "Responda 5 perguntas",
    "Gerando perfil com IA",
    "Eu vou!",
    "Não sei ainda...",
    "Solteiro (a)",
    "Casado (a)",
    "generateProfileBio",
  ];

  const forbidden = [
    "A integração com IA será ativada depois. Por enquanto, o modal prepara uma prévia editável a partir das respostas.",
    "Mini bio em 5 perguntas",
    "Apresente seu perfil com apenas 5 perguntas",
    "Refazer mini bio com 5 perguntas",
    "Gerar prévia",
  ];

  for (const marker of required) {
    if (!code.includes(marker)) throw new Error(`[profile-claim-ai] Marcador obrigatório ausente: ${marker}`);
  }
  for (const marker of forbidden) {
    if (code.includes(marker)) throw new Error(`[profile-claim-ai] Marcador legado permaneceu: ${marker}`);
  }
}

function transformApp(source) {
  let code = `import { generateProfileBio } from "../lib/profileBioAi";\n${source}`;

  code = replaceRequired(
    code,
    `  const [bioGenerated, setBioGenerated] = useState(false);`,
    `  const [bioGenerated, setBioGenerated] = useState(false);\n  const [bioGenerating, setBioGenerating] = useState(false);`,
    "estado de geração com IA",
  );

  code = replaceRangeRequired(
    code,
    `  function formatBioList(items: string[]) {`,
    `  function selectPerson(person: DbPerson) {`,
    `  async function finishBioAssistant() {\n    const name = (profileDraft.displayName || profileDraft.fullName || "Esse ex-aluno").trim();\n    const answersForGeneration = SCHOOL_PROFILE_QUESTIONS.map(question => ({\n      id: question.id,\n      question: question.title,\n      options: bioAssistantAnswers[question.id] ?? [],\n    }));\n\n    setBioGenerating(true);\n    try {\n      const generatedBio = await generateProfileBio({\n        name,\n        nickname: profileDraft.nickname.trim() || undefined,\n        city: profileDraft.city.trim() || undefined,\n        profession: profileDraft.profession.trim() || undefined,\n        answers: answersForGeneration,\n      });\n\n      setProfileDraft(f => ({ ...f, bio: generatedBio }));\n      setBioGenerated(true);\n      setBioAssistantOpen(false);\n      showSuccess("Perfil gerado com IA. Você pode revisar o texto antes de continuar.");\n    } catch (error) {\n      showError(error instanceof Error ? error.message : "Não foi possível gerar seu perfil com IA.");\n    } finally {\n      setBioGenerating(false);\n    }\n  }\n\n`,
    "substituição do gerador local pela OpenAI",
  );

  const replacements = [
    [
      `<Field label="Apelido da época" value={profileDraft.nickname} onChange={v => setProfileDraft(f => ({ ...f, nickname: v }))} />`,
      `<Field label="Apelido, nickname ou ex-perfil do Fotolog" value={profileDraft.nickname} onChange={v => setProfileDraft(f => ({ ...f, nickname: v }))} />`,
      "label do apelido no cadastro",
    ],
    [`>Mini bio</p>`, `>Meu perfil</p>`, "título da seção"],
    [
      `{profileDraft.bio.trim() ? "Refazer mini bio com 5 perguntas" : "Apresente seu perfil com apenas 5 perguntas"}`,
      `Responda 5 perguntas`,
      "texto do botão",
    ],
    [
      `              <p className="text-[#7a9a7a] text-xs mt-2">A integração com IA será ativada depois. Por enquanto, o modal prepara uma prévia editável a partir das respostas.</p>\n`,
      ``,
      "remoção do aviso de IA futura",
    ],
    [`<FieldArea label="Texto da mini bio"`, `<FieldArea label="Texto do meu perfil"`, "label do texto gerado"],
    [
      `<OptionButton selected={profileDraft.relationshipStatus === "single"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "single" }))}>Solteiro(a)</OptionButton>`,
      `<OptionButton selected={profileDraft.relationshipStatus === "single"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "single" }))}>Solteiro (a)</OptionButton>`,
      "label solteiro",
    ],
    [
      `<OptionButton selected={profileDraft.relationshipStatus === "married"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "married" }))}>Casado(a)</OptionButton>`,
      `<OptionButton selected={profileDraft.relationshipStatus === "married"} onClick={() => setProfileDraft(f => ({ ...f, relationshipStatus: "married" }))}>Casado (a)</OptionButton>`,
      "label casado",
    ],
    [
      `<OptionButton selected={profileDraft.intendsToAttend === "yes"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "yes" }))}>Sim, pretendo ir</OptionButton>`,
      `<OptionButton selected={profileDraft.intendsToAttend === "yes"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "yes" }))}>Eu vou!</OptionButton>`,
      "label presença positiva",
    ],
    [
      `<OptionButton selected={profileDraft.intendsToAttend === "no"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "no" }))}>Ainda não / não pretendo</OptionButton>`,
      `<OptionButton selected={profileDraft.intendsToAttend === "no"} onClick={() => setProfileDraft(f => ({ ...f, intendsToAttend: "no" }))}>Não sei ainda...</OptionButton>`,
      "label presença indefinida",
    ],
    [`title="Mini bio em 5 perguntas"`, `title="Gerando perfil com IA"`, "título do modal"],
    [
      `const advance = () => isLastQuestion ? finishBioAssistant() : goToBioAssistantStep(bioAssistantStep + 1);`,
      `const advance = () => {\n              if (bioGenerating) return;\n              if (isLastQuestion) { void finishBioAssistant(); return; }\n              goToBioAssistantStep(bioAssistantStep + 1);\n            };`,
      "avanço do modal",
    ],
    [
      `<Btn full variant="ghost" onClick={advance}>Pular</Btn>`,
      `<Btn full variant="ghost" onClick={advance} disabled={bioGenerating}>Pular</Btn>`,
      "bloqueio do botão pular",
    ],
    [
      `{bioAssistantStep > 0 && <Btn full variant="outline" onClick={() => goToBioAssistantStep(bioAssistantStep - 1)}>Voltar</Btn>}`,
      `{bioAssistantStep > 0 && <Btn full variant="outline" onClick={() => goToBioAssistantStep(bioAssistantStep - 1)} disabled={bioGenerating}>Voltar</Btn>}`,
      "bloqueio do botão voltar",
    ],
    [
      `                  <Btn full onClick={advance}>\n                    <MessageCircle size={16} />{isLastQuestion ? "Gerar prévia" : "Continuar"}\n                  </Btn>`,
      `                  <Btn full onClick={advance} disabled={bioGenerating}>\n                    {bioGenerating\n                      ? <><RefreshCw size={16} className="animate-spin" />Gerando...</>\n                      : <><MessageCircle size={16} />{isLastQuestion ? "Gerar perfil" : "Continuar"}</>}\n                  </Btn>`,
      "botão de geração",
    ],
  ];

  for (const [search, replacement, label] of replacements) {
    code = replaceRequired(code, search, replacement, label);
  }

  assertMarkers(code);
  return code;
}

export function profileClaimProfileAiTransform() {
  return {
    name: "profile-claim-profile-ai-transform",
    enforce: "pre",
    transform(source, id) {
      const normalizedId = id.replaceAll("\\", "/").split("?")[0];
      if (normalizedId.endsWith("/src/app/App.tsx")) return { code: transformApp(source), map: null };
      return null;
    },
  };
}
