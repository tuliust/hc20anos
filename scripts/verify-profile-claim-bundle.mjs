import { readdir, readFile } from "node:fs/promises";
import { extname, join, relative } from "node:path";
import process from "node:process";

const root = process.cwd();
const distDir = join(root, "dist");

async function collectJavaScriptFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolutePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectJavaScriptFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && [".js", ".mjs"].includes(extname(entry.name))) {
      files.push(absolutePath);
    }
  }

  return files;
}

const requiredMarkers = [
  "Qual é a sua data de nascimento?",
  "Essas informações ajudam a proteger o vínculo do perfil",
  "complete_profile_registration_v3",
];

const forbiddenMarkers = [
  "Qual é seu ano de nascimento?",
  "Ex.: 1988",
];

let files;
try {
  files = await collectJavaScriptFiles(distDir);
} catch (error) {
  console.error("Não foi possível ler o diretório dist. Execute `npm run build` antes desta verificação.");
  console.error(error);
  process.exit(1);
}

if (files.length === 0) {
  console.error("Nenhum bundle JavaScript foi encontrado em dist.");
  process.exit(1);
}

const bundles = await Promise.all(
  files.map(async file => ({
    file,
    content: await readFile(file, "utf8"),
  })),
);

const failures = [];

for (const marker of requiredMarkers) {
  const matches = bundles.filter(bundle => bundle.content.includes(marker));
  if (matches.length === 0) {
    failures.push(`Marcador obrigatório ausente: ${JSON.stringify(marker)}`);
    continue;
  }
  console.log(`PASS obrigatório: ${JSON.stringify(marker)} em ${matches.map(match => relative(root, match.file)).join(", ")}`);
}

for (const marker of forbiddenMarkers) {
  const matches = bundles.filter(bundle => bundle.content.includes(marker));
  if (matches.length > 0) {
    failures.push(`Marcador legado ainda presente: ${JSON.stringify(marker)} em ${matches.map(match => relative(root, match.file)).join(", ")}`);
    continue;
  }
  console.log(`PASS legado ausente: ${JSON.stringify(marker)}`);
}

if (failures.length > 0) {
  console.error("\nFalha na verificação do bundle da reivindicação de perfil:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`\nBundle validado em ${files.length} arquivo(s) JavaScript.`);
