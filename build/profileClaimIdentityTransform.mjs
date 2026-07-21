function replaceRequired(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`[profile-claim-identity] Trecho não encontrado: ${label}`);
  const second = source.indexOf(search, first + search.length);
  if (second >= 0) throw new Error(`[profile-claim-identity] Trecho duplicado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function transformApp(source) {
  let code = `import {\n  clearPendingProfileRegistration,\n  formatProfileClaimDisputeSubtitle,\n  getProfileClaimPenultimateSurname,\n  isValidDeclaredBirthDate,\n  persistPendingProfileRegistration,\n  readPendingProfileRegistration,\n} from "../lib/profileClaimIdentity";\n${source}`;

  code = replaceRequired(
    code,
    `function getPenultimateSurname(fullName: string) {\n  const parts = fullName.trim().split(/\\s+/).filter(Boolean);\n  return parts.length >= 2 ? parts[parts.length - 2] : parts[0] ?? "";\n}`,
    `function getPenultimateSurname(fullName: string) {\n  return getProfileClaimPenultimateSurname(fullName);\n}`,
    "regra do penúltimo sobrenome",
  );

  code = replaceRequired(
    code,
    `const [answers, setAnswers] = useState({ penultimateSurname: "", classGroup: "", birthYear: "" });`,
    `const [answers, setAnswers] = useState({ penultimateSurname: "", classGroup: "", birthDate: "" });`,
    "estado das respostas de identidade",
  );

  code = replaceRequired(
    code,
    `setAnswers({ penultimateSurname: "", classGroup: "", birthYear: "" });`,
    `setAnswers({ penultimateSurname: "", classGroup: "", birthDate: "" });`,
    "limpeza das respostas de identidade",
  );

  code = replaceRequired(
    code,
    `  function validateIdentity() {\n    if (!selected) return "Selecione seu nome na lista.";\n    const expectedSurname = getPenultimateSurname(selected.full_name);\n    if (normalizeLoose(answers.penultimateSurname) !== normalizeLoose(expectedSurname)) return "O penúltimo sobrenome não confere.";\n    if (normalizeLoose(answers.classGroup) !== normalizeLoose(selected.class_group)) return "A turma informada não confere.";\n    if (!selected.birth_year || Number(answers.birthYear) !== Number(selected.birth_year)) return "O ano de nascimento não confere.";\n    return "";\n  }`,
    `  function validateIdentity() {\n    if (!selected) return "Selecione seu nome na lista.";\n    const expectedSurname = getPenultimateSurname(selected.full_name);\n    if (normalizeLoose(answers.penultimateSurname) !== normalizeLoose(expectedSurname)) return "O penúltimo sobrenome não confere.";\n    if (normalizeLoose(answers.classGroup) !== normalizeLoose(selected.class_group)) return "A turma informada não confere.";\n    if (!answers.birthDate) return "Informe sua data de nascimento.";\n    if (!isValidDeclaredBirthDate(answers.birthDate)) return "Informe uma data de nascimento válida.";\n    return "";\n  }`,
    "validação de identidade",
  );

  code = replaceRequired(
    code,
    `    const validationError = validateAccountStep();\n    if (validationError) { showError(validationError); return; }\n\n    setBusy(true);`,
    `    const validationError = validateAccountStep();\n    if (validationError) { showError(validationError); return; }\n\n    const registrationPayload = {\n      personId: selected.id,\n      penultimateSurname: answers.penultimateSurname,\n      classGroupConfirmation: answers.classGroup,\n      declaredBirthDate: answers.birthDate,\n      fullName: profileDraft.fullName.trim(),\n      displayName: profileDraft.displayName.trim() || profileDraft.fullName.trim(),\n      classGroup: profileDraft.classGroup.trim(),\n      currentPhotoUrl: null,\n      currentCity: profileDraft.city.trim() || null,\n      currentState: profileDraft.state.trim() || null,\n      currentCountry: profileDraft.country.trim() || "Brasil",\n      profession: profileDraft.profession.trim() || null,\n      bio: profileDraft.bio.trim() || null,\n      nicknameAtSchool: profileDraft.nickname.trim() || null,\n      instagramUrl: normalizeSocialUrl(profileDraft.instagram, "https://instagram.com/"),\n      linkedinUrl: normalizeSocialUrl(profileDraft.linkedin, "https://linkedin.com/in/"),\n      contactEmail: account.email.trim(),\n      contactWhatsapp: normalizeWhatsapp(account.whatsapp),\n      relationshipStatus: profileDraft.relationshipStatus || null,\n      hasChildren: profileDraft.hasChildren === "yes",\n      childrenCount: profileDraft.hasChildren === "yes" && profileDraft.childrenCount.trim() ? Number(profileDraft.childrenCount) : null,\n      intendsToAttend: profileDraft.intendsToAttend ? profileDraft.intendsToAttend === "yes" : null,\n      showCurrentPhoto: privacy.showCurrentPhoto,\n      showCity: privacy.showCity,\n      showProfession: privacy.showProfession,\n      showSocialLinks: privacy.showSocial,\n      allowPhotoTags: privacy.allowTagging,\n      showConfirmedStatus: privacy.showInList,\n    };\n\n    setBusy(true);`,
    "payload do cadastro",
  );

  code = replaceRequired(
    code,
    `        if (!data.session) {\n          setPendingEmailConfirmation(true);\n          setDone(true);\n          goToStep(6);\n          showSuccess("Conta criada. Confirme seu e-mail para concluir o vínculo do perfil.");\n          return;\n        }`,
    `        if (!data.session) {\n          persistPendingProfileRegistration({\n            registration: registrationPayload,\n            questionnaireAnswers: bioAssistantAnswers,\n            createdAt: new Date().toISOString(),\n          });\n          setPendingEmailConfirmation(true);\n          setDone(true);\n          goToStep(6);\n          showSuccess("Conta criada. Confirme seu e-mail para concluir o vínculo do perfil.");\n          return;\n        }`,
    "persistência durante confirmação de e-mail",
  );

  code = replaceRequired(
    code,
    `      const completedProfile = await completeProfileRegistration({\n        personId: selected.id,\n        penultimateSurname: answers.penultimateSurname,\n        classGroupConfirmation: answers.classGroup,\n        birthYear: Number(answers.birthYear),\n        fullName: profileDraft.fullName.trim(),\n        displayName: profileDraft.displayName.trim() || profileDraft.fullName.trim(),\n        classGroup: profileDraft.classGroup.trim(),\n        currentPhotoUrl: photoUrl,\n        currentCity: profileDraft.city.trim() || null,\n        currentState: profileDraft.state.trim() || null,\n        currentCountry: profileDraft.country.trim() || "Brasil",\n        profession: profileDraft.profession.trim() || null,\n        bio: profileDraft.bio.trim() || null,\n        nicknameAtSchool: profileDraft.nickname.trim() || null,\n        instagramUrl: normalizeSocialUrl(profileDraft.instagram, "https://instagram.com/"),\n        linkedinUrl: normalizeSocialUrl(profileDraft.linkedin, "https://linkedin.com/in/"),\n        contactEmail: account.email.trim(),\n        contactWhatsapp: normalizeWhatsapp(account.whatsapp),\n        relationshipStatus: profileDraft.relationshipStatus || null,\n        hasChildren: profileDraft.hasChildren === "yes",\n        childrenCount: profileDraft.hasChildren === "yes" && profileDraft.childrenCount.trim() ? Number(profileDraft.childrenCount) : null,\n        intendsToAttend: profileDraft.intendsToAttend ? profileDraft.intendsToAttend === "yes" : null,\n        showCurrentPhoto: privacy.showCurrentPhoto,\n        showCity: privacy.showCity,\n        showProfession: privacy.showProfession,\n        showSocialLinks: privacy.showSocial,\n        allowPhotoTags: privacy.allowTagging,\n        showConfirmedStatus: privacy.showInList,\n      });`,
    `      const completedProfile = await completeProfileRegistration({\n        ...registrationPayload,\n        currentPhotoUrl: photoUrl,\n      });`,
    "chamada transacional de cadastro",
  );

  code = replaceRequired(
    code,
    `      window.sessionStorage.removeItem("hc-attendance-intent");`,
    `      clearPendingProfileRegistration();\n      window.sessionStorage.removeItem("hc-attendance-intent");`,
    "limpeza do cadastro pendente",
  );

  code = replaceRequired(
    code,
    `              <p className="text-[#7a9a7a] text-sm">Esses dados são comparados ao pré-cadastro para evitar vínculo indevido.</p>`,
    `              <p className="text-[#7a9a7a] text-sm">Essas informações ajudam a proteger o vínculo do perfil e poderão ser consultadas em auditorias e disputas.</p>`,
    "texto explicativo da confirmação",
  );

  code = replaceRequired(
    code,
    `            <Field label="Qual é seu ano de nascimento?" type="number" value={answers.birthYear} onChange={v => setAnswers(a => ({ ...a, birthYear: v.replace(/\\D/g, "").slice(0, 4) }))} placeholder="Ex.: 1988" />`,
    `            <Field label="Qual é a sua data de nascimento?" type="date" value={answers.birthDate} onChange={v => setAnswers(a => ({ ...a, birthDate: v }))} />`,
    "campo de data de nascimento",
  );

  code = replaceRequired(
    code,
    `const navigationGuardRef = useRef<AdminNavigationGuard | null>(null);`,
    `const navigationGuardRef = useRef<AdminNavigationGuard | null>(null);\n  const pendingClaimResumeRef = useRef(false);`,
    "controle de retomada do cadastro",
  );

  code = replaceRequired(
    code,
    `  useEffect(() => {\n    getPeople().then(setPeople).catch(() => DEV_MODE && setPeople(MOCK_PEOPLE));\n    getApprovedPhotos(DEFAULT_EVENT_ID).then(setApprovedPhotos).catch(() => DEV_MODE && setApprovedPhotos([]));\n    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => DEV_MODE && setApprovedMemories([]));\n    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));\n    refreshPublicEventData();\n  }, []);\n\n  useEffect(() => {\n    const rememberBrowserUrl = () => {`,
    `  useEffect(() => {\n    getPeople().then(setPeople).catch(() => DEV_MODE && setPeople(MOCK_PEOPLE));\n    getApprovedPhotos(DEFAULT_EVENT_ID).then(setApprovedPhotos).catch(() => DEV_MODE && setApprovedPhotos([]));\n    getApprovedMemories(DEFAULT_EVENT_ID).then(setApprovedMemories).catch(() => DEV_MODE && setApprovedMemories([]));\n    getAttendanceIntentPersonIds().then(setAttendanceIntentPersonIds).catch(() => setAttendanceIntentPersonIds(new Set()));\n    refreshPublicEventData();\n  }, []);\n\n  useEffect(() => {\n    if (authLoading || !auth.loggedIn || !auth.userId || pendingClaimResumeRef.current) return;\n    const pending = readPendingProfileRegistration();\n    if (!pending) return;\n\n    pendingClaimResumeRef.current = true;\n    void (async () => {\n      try {\n        const completedProfile = await completeProfileRegistration(pending.registration);\n        await saveSchoolQuestionnaireAnswers({\n          eventId: DEFAULT_EVENT_ID,\n          profileId: completedProfile.id,\n          personId: pending.registration.personId,\n          answers: pending.questionnaireAnswers,\n        }).catch(() => {});\n        clearPendingProfileRegistration();\n        getPeople().then(setPeople).catch(() => {});\n      } catch (error) {\n        console.error("Não foi possível retomar a reivindicação de perfil após o login.", error);\n      } finally {\n        pendingClaimResumeRef.current = false;\n      }\n    })();\n  }, [authLoading, auth.loggedIn, auth.userId]);\n\n  useEffect(() => {\n    const rememberBrowserUrl = () => {`,
    "retomada após confirmação de e-mail",
  );

  code = replaceRequired(
    code,
    `getSubtitle={d => (d.people?.full_name ?? d.person_id) + " · " + d.reason}`,
    `getSubtitle={d => formatProfileClaimDisputeSubtitle(d)}`,
    "evidência na lista de disputas",
  );

  code = replaceRequired(
    code,
    `{ title: "1. Dados que coletamos",               body: "Nome completo, e-mail, telefone/WhatsApp, CPF (para compra de ingresso), cidade de residência, profissão, fotos enviadas voluntariamente, respostas Ã s perguntas de verificação de identidade, e dados de navegação como logs de acesso." },`,
    `{ title: "1. Dados que coletamos",               body: "Nome completo, e-mail, telefone/WhatsApp, CPF (para compra de ingresso), cidade de residência, profissão, fotos enviadas voluntariamente, data de nascimento declarada e respostas às perguntas de verificação de identidade, além de dados de navegação como logs de acesso." },`,
    "dados coletados na política de privacidade",
  );

  code = replaceRequired(
    code,
    `{ title: "2. Como usamos seus dados",            body: "Processamento de ingressos e pagamentos, verificação de identidade para reivindicação de perfis, exibição no mural e na lista de confirmados (somente com sua autorização), envio de comunicações sobre o evento, e check-in no dia." },`,
    `{ title: "2. Como usamos seus dados",            body: "Processamento de ingressos e pagamentos, proteção do vínculo de perfis, auditoria e resolução de disputas, exibição no mural e na lista de confirmados (somente com sua autorização), envio de comunicações sobre o evento e check-in no dia. A data de nascimento declarada não é exibida publicamente." },`,
    "uso dos dados na política de privacidade",
  );

  code = replaceRequired(
    code,
    `<p className="text-[#7a9a7a] font-mono text-sm mb-12">Última atualização: 1 de julho de 2026 · Em conformidade com a LGPD</p>`,
    `<p className="text-[#7a9a7a] font-mono text-sm mb-12">Última atualização: 21 de julho de 2026 · Em conformidade com a LGPD</p>`,
    "data da política de privacidade",
  );

  if (code.includes("answers.birthYear")) {
    throw new Error("[profile-claim-identity] A referência answers.birthYear permaneceu no App.tsx transformado.");
  }

  return code;
}

function transformServices(source) {
  let code = source;

  code = replaceRequired(
    code,
    `  birthYear: number;`,
    `  declaredBirthDate: string;`,
    "tipo da data declarada",
  );

  code = replaceRequired(
    code,
    `.rpc("complete_profile_registration_v2", {`,
    `.rpc("complete_profile_registration_v3", {`,
    "versão da RPC de cadastro",
  );

  code = replaceRequired(
    code,
    `    p_birth_year: params.birthYear,`,
    `    p_declared_birth_date: params.declaredBirthDate,`,
    "parâmetro da data declarada",
  );

  code = replaceRequired(
    code,
    `  await writeAudit("complete_profile_registration", "profiles", (data as DbProfile)?.id ?? null, {\n    person_id: params.personId,\n  }).catch(() => {});`,
    `  await writeAudit("complete_profile_registration", "profiles", (data as DbProfile)?.id ?? null, {\n    person_id: params.personId,\n    identity_birth_date_provided: Boolean(params.declaredBirthDate),\n  }).catch(() => {});`,
    "metadado de auditoria",
  );

  code = replaceRequired(
    code,
    `export async function getProfileClaimDisputes(status?: string): Promise<(DbProfileClaimDispute & { people?: Partial<DbPerson> })[]> {\n  return withFallback(async () => {\n    let q = supabase.from("profile_claim_disputes")\n      .select("*, people(full_name, nickname_at_school, class_group)")\n      .order("created_at", { ascending: false });\n    if (status) q = (q as any).eq("status", status);\n    const { data, error } = await q;\n    if (error) throw error;\n    return (data ?? []) as any;\n  }, []);\n}`,
    `export async function getProfileClaimDisputes(status?: string): Promise<(DbProfileClaimDispute & { people?: Partial<DbPerson> })[]> {\n  return withFallback(async () => {\n    const { data, error } = await (supabase as any).rpc("admin_get_profile_claim_disputes_with_identity", {\n      p_status: status ?? null,\n    });\n    if (error) throw error;\n    return (data ?? []) as any;\n  }, []);\n}`,
    "consulta administrativa de disputas",
  );

  if (code.includes("params.birthYear") || code.includes("p_birth_year: params")) {
    throw new Error("[profile-claim-identity] A validação antiga de ano permaneceu em services.ts.");
  }

  return code;
}

export function profileClaimIdentityTransform() {
  return {
    name: "profile-claim-identity-transform",
    enforce: "pre",
    transform(source, id) {
      const normalizedId = id.replaceAll("\\", "/").split("?")[0];
      if (normalizedId.endsWith("/src/app/App.tsx")) return { code: transformApp(source), map: null };
      if (normalizedId.endsWith("/src/lib/services.ts")) return { code: transformServices(source), map: null };
      return null;
    },
  };
}
