import { normalizeModuleId, replaceRequired as replaceStrict } from "./transformUtils.mjs";

const replaceRequired = (source, search, replacement, label) =>
  replaceStrict(source, search, replacement, label, "production-readiness");

export function productionReadinessTransform() {
  return {
    name: 'production-readiness-transform',
    enforce: 'pre',
    transform(source, id) {
      const normalizedId = normalizeModuleId(id);
      let code = source;

      if (normalizedId.endsWith('/src/app/App.tsx')) {
        code = replaceRequired(
          code,
          'const FALLBACK_EVENT_DATE_TIME = "2026-10-17T19:00:00-03:00";',
          'const FALLBACK_EVENT_DATE_TIME = "2026-09-26T14:00:00-03:00";',
          'data fallback do evento',
        );

        code = replaceRequired(
          code,
          `    } catch {\n      setAttendanceState("error");\n    }`,
          `    } catch (error) {\n      const message = error instanceof Error ? error.message : String(error ?? "");\n      if (message.includes("Perfil ainda não reivindicado") || message.includes("cadastro de ex-aluno")) {\n        navigate("claim-profile");\n        return;\n      }\n      console.error("Não foi possível marcar presença.", error);\n      setAttendanceState("error");\n    }`,
          'retomada do cadastro ao marcar presença',
        );
      }

      if (normalizedId.endsWith('/src/lib/services.ts')) {
        code = replaceRequired(
          code,
          'let q = supabase.from("people").select("*").order("full_name");',
          'let q = supabase.from("people").select("id,full_name,class_year,class_group,nickname_at_school,profile_status,is_visible,avatar_url,display_name,gender,created_at,updated_at").order("full_name");',
          'projeção segura de pessoas',
        );

        code = replaceRequired(
          code,
          `.from("people")\n      .select("*")\n      .eq("is_visible", true)`,
          `.from("people")\n      .select("id,full_name,class_year,class_group,nickname_at_school,profile_status,is_visible,avatar_url,display_name,gender,created_at,updated_at")\n      .eq("is_visible", true)`,
          'projeção segura de pessoas públicas',
        );
      }

      return code === source ? null : { code, map: null };
    },
  };
}
