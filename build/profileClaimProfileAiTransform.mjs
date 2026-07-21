function replaceRequired(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`[profile-claim-ai] Trecho não encontrado: ${label}`);
  const second = source.indexOf(search, first + search.length);
  if (second >= 0) throw new Error(`[profile-claim-ai] Trecho duplicado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
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
    "Apelido da época",
    "A integração com IA será ativada depois",
    "Mini bio em 5 perguntas",
    "Apresente seu perfil com apenas 5 perguntas",
    "Sim, pretendo ir",
    "Ainda não / não pretendo",
    "Solteiro(a)",
    "Casado(a)",
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

  code = replaceRequired(
    code,
    `  function formatBioList(items: string[]) {\n    const normalized = items.map(item => item.trim()).filter(Boolean);\n    if (normalized.length === 0) return "";\n    if (normalized.length === 1) return normalized[0].toLowerCase();\n    return \`${"${normalized.slice(0, -1).map(item => item.toLowerCase()).join(\", \")} e ${normalized[normalized.length - 1].toLowerCase()}"}\`;\n  }\n\n`,
    ``,
    "remoção do gerador local",
  );

  code = replaceRequired(
    code,
    `  function finishBioAssistant() {\n    const name = (profileDraft.displayName || profileDraft.fullName || "Esse ex-aluno").trim();\n    const selectedByQuestion = Object.fromEntries(\n      SCHOOL_PROFILE_QUESTIONS.map(question => [question.id, bioAssistantAnswers[question.id] ?? []])\n    ) as Record<string, string[]>;\n\n    const sentences = [\n      selectedByQuestion.school_personality?.length\n        ? \`Na época do HC, ${"${name}"} tinha um jeito bem próprio: ${"${formatBioList(selectedByQuestion.school_personality)}"}.\`\n        : "",\n      selectedByQuestion.school_places?.length\n        ? \`Aparecia muito ${"${formatBioList(selectedByQuestion.school_places)}"}.\`\n        : "",\n      selectedByQuestion.school_memories?.length\n        ? \`Guarda dessa fase ${"${formatBioList(selectedByQuestion.school_memories)}"}.\`\n        : "",\n      selectedByQuestion.school_vibe?.length\n        ? \`Sua vibe na turma era de ${"${formatBioList(selectedByQuestion.school_vibe)}"}.\`\n        : "",\n      selectedByQuestion.reunion_expectation?.length\n        ? \`No reencontro, quer ${"${formatBioList(selectedByQuestion.reunion_expectation)}"}.\`\n        : "",\n    ].filter(Boolean);\n\n    const generatedBio = sentences.length > 0\n      ? sentences.join(" ").slice(0, 500)\n      : \`${"${name}"} está atualizando seu perfil para reencontrar a turma, relembrar os tempos de HC e viver uma noite de boas histórias.\`;\n\n    setProfileDraft(f => ({ ...f, bio: generatedBio }));\n    setBioGenerated(true);\n    setBioAssistantOpen(false);\n    showSuccess("Mini bio gerada. Você pode revisar o texto antes de continuar.");\n  }`,
    `  async function finishBioAssistant() {\n    const name = (profileDraft.displayName || profileDraft.fullName || "Esse ex-aluno").trim();\n    const answersForGeneration = SCHOOL_PROFILE_QUESTIONS.map(question => ({\n      id: question.id,\n      question: question.title,\n      options: bioAssistantAnswers[question.id] ?? [],\n    }));\n\n    setBioGenerating(true);\n    try {\n      const generatedBio = await generateProfileBio({\n        name,\n        nickname: profileDraft.nickname.trim() || undefined,\n        city: profileDraft.city.trim() || undefined,\n        profession: profileDraft.profession.trim() || undefined,\n        answers: answersForGeneration,\n      });\n\n      setProfileDraft(f => ({ ...f, bio: generatedBio }));\n      setBioGenerated(true);\n      setBioAssistantOpen(false);\n      showSuccess("Perfil gerado com IA. Você pode revisar o texto antes de continuar.");\n    } catch (error) {\n      showError(error instanceof Error ? error.message : "Não foi possível gerar seu perfil com IA.");\n    } finally {\n      setBioGenerating(false);\n    }\n  }`,
    "geração real do perfil com IA",
  );

  const replacements = [
    [`<Field label="Apelido da época"`, `<Field label="Apelido, nickname ou ex-perfil do Fotolog"`, "label do apelido"],
    [`>Mini bio</p>`, `>Meu perfil</p>`, "título da seção"],
    [`{profileDraft.bio.trim() ? "Refazer mini bio com 5 perguntas" : "Apresente seu perfil com apenas 5 perguntas"}`, `{profileDraft.bio.trim() ? "Refazer respostas" : "Responda 5 perguntas"}`, "texto do botão"],
    [`              <p className="text-[#7a9a7a] text-xs mt-2">A integração com IA será ativada depois. Por enquanto, o modal prepara uma prévia editável a partir das respostas.</p>\n`, ``, "remoção do aviso de IA futura"],
    [`<FieldArea label="Texto da mini bio"`, `<FieldArea label="Texto do meu perfil"`, "label do texto gerado"],
    [`>Solteiro(a)</OptionButton>`, `>Solteiro (a)</OptionButton>`, "label solteiro"],
    [`>Casado(a)</OptionButton>`, `>Casado (a)</OptionButton>`, "label casado"],
    [`>Sim, pretendo ir</OptionButton>`, `>Eu vou!</OptionButton>`, "label presença positiva"],
    [`>Ainda não / não pretendo</OptionButton>`, `>Não sei ainda...</OptionButton>`, "label presença indefinida"],
    [`title="Mini bio em 5 perguntas"`, `title="Gerando perfil com IA"`, "título do modal"],
    [`const advance = () => isLastQuestion ? finishBioAssistant() : goToBioAssistantStep(bioAssistantStep + 1);`, `const advance = () => {\n              if (bioGenerating) return;\n              if (isLastQuestion) { void finishBioAssistant(); return; }\n              goToBioAssistantStep(bioAssistantStep + 1);\n            };`, "avanço do modal"],
    [`<Btn full variant="ghost" onClick={advance}>Pular</Btn>`, `<Btn full variant="ghost" onClick={advance} disabled={bioGenerating}>Pular</Btn>`, "bloqueio do botão pular"],
    [`{bioAssistantStep > 0 && <Btn full variant="outline" onClick={() => goToBioAssistantStep(bioAssistantStep - 1)}>Voltar</Btn>}`, `{bioAssistantStep > 0 && <Btn full variant="outline" onClick={() => goToBioAssistantStep(bioAssistantStep - 1)} disabled={bioGenerating}>Voltar</Btn>}`, "bloqueio do botão voltar"],
    [`                  <Btn full onClick={advance}>\n                    <MessageCircle size={16} />{isLastQuestion ? "Gerar prévia" : "Continuar"}\n                  </Btn>`, `                  <Btn full onClick={advance} disabled={bioGenerating}>\n                    {bioGenerating\n                      ? <><RefreshCw size={16} className="animate-spin" />Gerando...</>\n                      : <><MessageCircle size={16} />{isLastQuestion ? "Gerar perfil" : "Continuar"}</>}\n                  </Btn>`, "botão de geração"],
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
