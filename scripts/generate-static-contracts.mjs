import { execFileSync } from "node:child_process";
import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SCAN_ROOTS = ["api", "supabase/functions", "src", "build", "scripts"];
const SOURCE_PATHS = [...SCAN_ROOTS, "scripts/generate-static-contracts.mjs", ":(exclude)src/lib/database.generated.ts", ":(exclude)src/lib/rpc.generated.ts"];
const OUTPUTS = {
  apis: "docs/30-contratos/APIs.generated.md",
  edge: "docs/30-contratos/edge-functions.generated.md",
  env: "docs/30-contratos/variaveis-de-ambiente.generated.md",
  errors: "docs/30-contratos/codigos-de-erro.generated.md",
};
const ENV_PATTERNS = [
  /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\.([A-Z][A-Z0-9_]*)/g,
  /process\.env\[["'`]([A-Z][A-Z0-9_]*)["'`]\]/g,
  /Deno\.env\.get\(\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\)/g,
  /\bruntimeEnv\.([A-Z][A-Z0-9_]*)/g,
];

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git", ".vercel", ".supabase"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && CODE_EXTENSIONS.has(path.extname(entry.name))) files.push(absolute);
  }
  return files;
}

function gitValue(args, fallback) {
  try {
    return execFileSync("git", args, {
      cwd: ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim() || fallback;
  } catch {
    return fallback;
  }
}

function sourceMetadata() {
  const pathArgs = ["--", ...SOURCE_PATHS];
  return {
    commit: gitValue(["log", "--no-merges", "-1", "--format=%H", ...pathArgs], "unknown"),
    date: gitValue(["log", "--no-merges", "-1", "--format=%cs", ...pathArgs], "1970-01-01"),
  };
}

function markdownCode(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function lineNumber(content, index) {
  return content.slice(0, index).split("\n").length;
}

function collectMatches(content, patterns) {
  const results = [];
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      if (match[1] && !match[1].includes("${")) results.push({ value: match[1], index: match.index });
    }
  }
  return results;
}

function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractMethods(content) {
  const methods = new Set();
  for (const pattern of [
    /\.method\s*===?\s*["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi,
    /\.method\s*!==?\s*["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi,
  ]) {
    let match;
    while ((match = pattern.exec(content)) !== null) methods.add(match[1].toUpperCase());
  }
  for (const match of content.matchAll(/\[([^\]]+)\]\.includes\([^)]*\.method\)/gi)) {
    for (const item of match[1].matchAll(/["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi)) {
      methods.add(item[1].toUpperCase());
    }
  }
  return [...methods].sort();
}

function extractAuthSignals(content) {
  const signals = [];
  const checks = [
    ["Bearer Supabase", /auth\.getUser|SUPABASE_ANON_KEY|request\.headers(?:\.|\[)[^\n]*authorization/i],
    ["service role", /SUPABASE_SERVICE_ROLE_KEY/],
    ["anon key", /SUPABASE_ANON_KEY/],
    ["assinatura Mercado Pago", /x-signature|MERCADO_PAGO_WEBHOOK_SECRET/i],
    ["worker key", /x-worker-key|NOTIFICATION_WORKER_KEY/i],
    ["admin_users", /admin_users/],
    ["same-origin", /isSameOriginRequest|forbidden_origin/],
    ["rate limit", /isRateLimited|rate_limit_exceeded/],
    ["Vercel OIDC", /VERCEL_OIDC_TOKEN|x-vercel-oidc-token/],
  ];
  for (const [label, pattern] of checks) if (pattern.test(content)) signals.push(label);
  return signals;
}

function apiRoute(relativePath) {
  return `/api/${relativePath.replace(/^api\//, "").replace(/\.(tsx?|jsx?|mjs|cjs)$/i, "").replace(/\/index$/i, "")}`;
}

function frontMatter(title, sources, metadata) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${metadata.date}`,
    `last_verified_commit: ${metadata.commit}`,
    "generation_command: npm run docs:generate-contracts",
    "source_files:",
    ...sources.map(source => `  - ${source}`),
    "---",
    "",
    `# ${title}`,
    "",
    "> Arquivo gerado automaticamente. Não editar manualmente.",
    "",
  ];
}

async function loadSources() {
  const files = [];
  for (const root of SCAN_ROOTS) files.push(...await walk(path.join(ROOT, root)));
  const unique = [...new Set(files.map(file => path.resolve(file)))].sort((a, b) => a.localeCompare(b));
  return Promise.all(unique.map(async absolute => ({
    absolute,
    relative: normalize(path.relative(ROOT, absolute)),
    content: await readFile(absolute, "utf8"),
  })));
}

function functionSection(file) {
  const methods = extractMethods(file.content);
  const envs = uniqueSorted(collectMatches(file.content, ENV_PATTERNS).map(item => item.value));
  const rpcs = uniqueSorted(collectMatches(file.content, [/\.rpc\(\s*["'`]([A-Za-z0-9_]+)["'`]/g]).map(item => item.value));
  return [
    `- **Arquivo:** ${markdownCode(file.relative)}`,
    `- **Métodos detectados:** ${methods.length ? methods.map(markdownCode).join(", ") : "não inferidos estaticamente"}`,
    `- **Sinais de autenticação:** ${extractAuthSignals(file.content).join(", ") || "nenhum sinal estático identificado"}`,
    `- **Variáveis:** ${envs.length ? envs.map(markdownCode).join(", ") : "nenhuma"}`,
    `- **RPCs chamadas:** ${rpcs.length ? rpcs.map(markdownCode).join(", ") : "nenhuma"}`,
    "",
  ];
}

function generateApis(files, metadata) {
  const lines = frontMatter("Vercel Functions", ["api/"], metadata);
  const apiFiles = files.filter(file => file.relative.startsWith("api/"));
  if (!apiFiles.length) lines.push("Nenhuma Vercel Function encontrada.", "");
  for (const file of apiFiles) lines.push(`## ${markdownCode(apiRoute(file.relative))}`, "", ...functionSection(file));
  return `${lines.join("\n")}\n`;
}

function generateEdgeFunctions(files, metadata) {
  const lines = frontMatter("Supabase Edge Functions", ["supabase/functions/"], metadata);
  const edgeFiles = files.filter(file => /^supabase\/functions\/[^/]+\/index\.(ts|tsx|js|jsx)$/i.test(file.relative));
  if (!edgeFiles.length) lines.push("Nenhuma Edge Function encontrada.", "");
  for (const file of edgeFiles) lines.push(`## ${markdownCode(file.relative.split("/")[2])}`, "", ...functionSection(file));
  return `${lines.join("\n")}\n`;
}

function generateEnvironment(files, metadata) {
  const consumers = new Map();
  for (const file of files) {
    for (const match of collectMatches(file.content, ENV_PATTERNS)) {
      if (!consumers.has(match.value)) consumers.set(match.value, new Set());
      consumers.get(match.value).add(file.relative);
    }
  }
  const lines = frontMatter("Variáveis de ambiente", SCAN_ROOTS.map(root => `${root}/`), metadata);
  lines.push("| Variável | Exposição | Consumidores |", "|---|---|---|");
  for (const variable of [...consumers.keys()].sort()) {
    const exposure = variable.startsWith("VITE_") ? "pública no bundle" : "server-side";
    const list = [...consumers.get(variable)].sort().map(markdownCode).join("<br>");
    lines.push(`| ${markdownCode(variable)} | ${exposure} | ${list} |`);
  }
  if (!consumers.size) lines.push("| — | — | Nenhuma variável encontrada |");
  lines.push("", "Valores e secrets são deliberadamente omitidos.", "");
  return `${lines.join("\n")}\n`;
}

function generateErrors(files, metadata) {
  const occurrences = new Map();
  const patterns = [
    /\berror\s*:\s*["'`]([a-z][a-z0-9_.:-]{2,})["'`]/g,
    /new\s+Error\(\s*["'`]([a-z][a-z0-9_.:-]{2,})["'`]/g,
    /throw\s+["'`]([a-z][a-z0-9_.:-]{2,})["'`]/g,
  ];
  for (const file of files) {
    for (const match of collectMatches(file.content, patterns)) {
      if (!occurrences.has(match.value)) occurrences.set(match.value, []);
      occurrences.get(match.value).push(`${file.relative}:${lineNumber(file.content, match.index)}`);
    }
  }
  const lines = frontMatter("Códigos de erro estáticos", SCAN_ROOTS.map(root => `${root}/`), metadata);
  lines.push("| Código | Ocorrências |", "|---|---|");
  for (const errorCode of [...occurrences.keys()].sort()) {
    const locations = uniqueSorted(occurrences.get(errorCode)).map(markdownCode).join("<br>");
    lines.push(`| ${markdownCode(errorCode)} | ${locations} |`);
  }
  if (!occurrences.size) lines.push("| — | Nenhum código literal encontrado |");
  lines.push("", "Este contrato cobre apenas códigos literais detectáveis estaticamente. Mensagens dinâmicas, erros SQL e respostas de provedores exigem geradores específicos.", "");
  return `${lines.join("\n")}\n`;
}

async function writeOrCheck(relativePath, content) {
  const absolute = path.join(ROOT, relativePath);
  if (CHECK_MODE) {
    let existing = null;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      // Arquivo ausente é drift.
    }
    if (existing !== content) {
      console.error(`Contrato desatualizado: ${relativePath}`);
      process.exitCode = 1;
    }
    return;
  }
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  console.log(`Gerado: ${relativePath}`);
}

async function main() {
  const metadata = sourceMetadata();
  const files = await loadSources();
  const outputs = new Map([
    [OUTPUTS.apis, generateApis(files, metadata)],
    [OUTPUTS.edge, generateEdgeFunctions(files, metadata)],
    [OUTPUTS.env, generateEnvironment(files, metadata)],
    [OUTPUTS.errors, generateErrors(files, metadata)],
  ]);
  for (const [relativePath, content] of outputs) await writeOrCheck(relativePath, content);
  if (CHECK_MODE && !process.exitCode) console.log("Contratos estáticos estão atualizados.");
}

main().catch(error => {
  console.error("Falha ao gerar contratos estáticos:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
