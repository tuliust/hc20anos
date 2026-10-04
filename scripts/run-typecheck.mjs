import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import { sourceLineEndingNormalizationTransform } from "../build/sourceLineEndingNormalizationTransform.mjs";
import { buyerOrdersSharedRouteTransform } from "../build/buyerOrdersSharedRouteTransform.mjs";
import { profileClaimIdentityTransform } from "../build/profileClaimIdentityTransform.mjs";
import { profileClaimProfileAiTransform } from "../build/profileClaimProfileAiTransform.mjs";
import { photoUploadYearInputTransform } from "../build/photoUploadYearInputTransform.mjs";
import { productionReadinessTransform } from "../build/productionReadinessTransform.mjs";

const ROOT = process.cwd();
const SOURCE_ROOT = path.join(ROOT, "src");
const EXTENSIONS = new Set([".ts", ".tsx"]);
const plugins = [
  sourceLineEndingNormalizationTransform(),
  buyerOrdersSharedRouteTransform(),
  profileClaimIdentityTransform(),
  profileClaimProfileAiTransform(),
  photoUploadYearInputTransform(),
  productionReadinessTransform(),
];

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

async function applyEffectiveBuildTransforms(file, source) {
  let code = source;
  for (const plugin of plugins) {
    const hook = plugin?.transform;
    if (typeof hook !== "function") continue;
    const result = await hook.call(plugin, code, file);
    if (!result) continue;
    code = typeof result === "string" ? result : result.code ?? code;
  }
  return code;
}

const originals = new Map();

try {
  for (const file of await walk(SOURCE_ROOT)) {
    const source = await readFile(file, "utf8");
    const transformed = await applyEffectiveBuildTransforms(file, source);
    if (transformed === source) continue;
    originals.set(file, source);
    await writeFile(file, transformed, "utf8");
  }

  const executable = process.platform === "win32"
    ? path.join(ROOT, "node_modules", ".bin", "tsc.cmd")
    : path.join(ROOT, "node_modules", ".bin", "tsc");
  const result = spawnSync(executable, ["-p", "tsconfig.typecheck.json", "--noEmit"], {
    cwd: ROOT,
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await Promise.all([...originals].map(([file, source]) => writeFile(file, source, "utf8")));
}
