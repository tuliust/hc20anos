export interface ProfileBioQuestionAnswer {
  id: string;
  question: string;
  options: string[];
}

export interface GenerateProfileBioInput {
  name: string;
  nickname?: string;
  city?: string;
  profession?: string;
  relationshipStatus?: "single" | "dating" | "married";
  hasChildren?: boolean;
  childrenCount?: number;
  answers: ProfileBioQuestionAnswer[];
}

interface ProfileBioApiResponse {
  bio?: string;
  error?: string;
}

function profileBioErrorMessage(code?: string) {
  switch (code) {
    case "openai_not_configured":
      return "A geração com IA ainda não está disponível. Tente novamente mais tarde.";
    case "rate_limit_exceeded":
      return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.";
    case "invalid_request":
      return "Não foi possível interpretar as respostas. Revise as opções e tente novamente.";
    default:
      return "Não foi possível gerar seu perfil com IA. Tente novamente.";
  }
}

export async function generateProfileBio(input: GenerateProfileBioInput): Promise<string> {
  const response = await fetch("/api/generate-profile-bio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  const payload = await response.json().catch(() => ({})) as ProfileBioApiResponse;

  if (!response.ok) {
    throw new Error(profileBioErrorMessage(payload.error));
  }

  const bio = String(payload.bio ?? "").replace(/\s+/g, " ").trim();
  if (!bio) {
    throw new Error("A IA não retornou um texto válido. Tente novamente.");
  }

  return bio.slice(0, 500);
}
