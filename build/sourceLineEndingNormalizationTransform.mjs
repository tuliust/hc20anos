import { normalizeModuleId } from "./transformUtils.mjs";

const TARGET_SUFFIXES = [
  "/src/app/App.tsx",
  "/src/lib/services.ts",
];

export function sourceLineEndingNormalizationTransform() {
  return {
    name: "source-line-ending-normalization-transform",
    enforce: "pre",
    transform(source, id) {
      const normalizedId = normalizeModuleId(id);
      if (!TARGET_SUFFIXES.some((suffix) => normalizedId.endsWith(suffix))) return null;

      const normalizedSource = source.replace(/\r\n?/g, "\n");
      if (normalizedSource === source) return null;

      return { code: normalizedSource, map: null };
    },
  };
}
