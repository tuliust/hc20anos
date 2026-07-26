import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const SCAN_ROOTS = ["api", "supabase/functions", "src", "build", "scripts"];

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

async function exists(target) {
  try {
    await readFile(target);
    return true;
  } catch {
    try {
      await readdir(target);
      return true;
    } catch {
      return false;
    }
  }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
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
      const value = match[1];
      if (value && !value.includes("${")) results.push({ value, index: match.index });
    }
  }
  return results;
}

function extractMethods(content) {
  const methods = new Set();
  const directPatterns = [
    /\.method\s*===?\s*["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi,
    /\.method\s*!==?\s*["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi,
  ];

  for (const pattern of directPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) methods.add(match[1].toUpperCase());
  }

  const arrayPattern = /\[([^\]]+)\]\.includes\([^)]*\.method\)/gi;
  let arrayMatch;
  while ((arrayMatch = arrayPattern.exec(content)) !== null) {
    for (const item of arrayMatch[1].matchAll(/["'`](GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)["'`]/gi)) {
      methods.add(item[1].toUpperCase());
    }
  }

  return [...methods].sort();
}

function extractAuthSignals(content) {
  const signals = [];
  const checks = [
    ["Bearer Supabase", /authorization|bearer/i],
    ["service role", /SUPABASE_SERVICE_ROLE_KEY/],
    ["anon key", /SUPABASE_ANON_KEY/],
    ["assinatura Mercado Pago", /x-signature|MERCADO_PAGO_WEBHOOK_SECRET/i],
    ["worker key", /x-worker-key|NOTIFICATION_WORKER_KEY/i],
    ["admin_users", /admin_users/],
  ];

  for (const [label, pattern] of checks) if (pattern.test(content)) signals.push(label);
  return signals;
}

function apiRoute(relativePath) {
  const withoutPrefix = relativePath
    .replace(/^api\//, "")
    .replace(/\.(tsx?|jsx?|mjs|cjs)$/i, "");
  return `/api/${withoutPrefix.replace(/\/index$/i, "")}`;
}

function frontMatter({ title, sources, commit, date }) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${date}`,
    `last_verified_commit: ${commit}`,
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
  const unique = [...new Set(files)].sort((a, b) => normalize(a).localeCompare(normalize(b)));

  return Promise.all(unique.map(async absolute => ({
    absolute,
    relative: normalize(path.relative(ROOT, absolute)),
    content: await readFile(absolute, "utf8"),
  })));
}

function generateApis(files, metadata) {
  const apiFiles = files.filter(file => file.relative.startsWith("api/"));
  const lines = frontMatter({ title: "Vercel Functions", sources: ["api/"], ...metadata });

  if (!apiFiles.length) lines.push("Nenhuma Vercel Function encontrada.", "");

  for (const file of apiFiles) {
    const methods = extractMethods(file.content);
    const envs = collectMatches(file.content, [
      /process\.env\.([A-Z][A-Z0-9_]*)/g,
      /process\.env\[["'`]([A-Z][A-Z0-9_]*)["'`]\]/g,
    ]).map(item => item.value);
    const rpcs = collectMatches(file.content, [
      /\.rpc\(\s*["'`]([A-Za-z0-9_]+)["'`]/g,
    ]).map(item => item.value);

    lines.push(`## ${markdownCode(apiRoute(file.relative))}`, "");
    lines.push(`- **Arquivo:** ${markdownCode(file.relative)}`);
    lines.push(`- **Métodos detectados:** ${methods.length ? methods.map(markdownCode).join(", ") : "não inferidos estaticamente"}`);
    lines.push(`- **Sinais de autenticação:** ${extractAuthSignals(file.content).join(", ") || "nenhum sinal estático identificado"}`);
    lines.push(`- **Variáveis:** ${[...new Set(envs)].sort().map(markdownCode).join(", ") || "nenhuma"}`);
    lines.push(`- **RPCs chamadas:** ${[...new Set(rpcs)].sort().map(markdownCode).join(", ") || "nenhuma"}`, "");
  }

  return `${lines.join("\n")}\n`;
}

function generateEdgeFunctions(files, metadata) {
  const edgeFiles = files.filter(file => /^supabase\/functions\/[^/]+\/index\.(ts|tsx|js|jsx)$/i.test(file.relative));
  const lines = frontMatter({ title: "Supabase Edge Functions", sources: ["supabase/functions/"], ...metadata });

  if (!edgeFiles.length) lines.push("Nenhuma Edge Function encontrada.", "");

  for (const file of edgeFiles) {
    const name = file.relative.split("/")[2];
    const methods = extractMethods(file.content);
    const envs = collectMatches(file.content, [
      /Deno\.env\.get\(\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\)/g,
    ]).map(item => item.value);
    const rpcs = collectMatches(file.content, [
      /\.rpc\(\s*["'`]([A-Za-z0-9_]+)["'`]/g,
    ]).map(item => item.value);

    lines.push(`## ${markdownCode(name)}`, "");
    lines.push(`- **Arquivo:** ${markdownCode(file.relative)}`);
    lines.push(`- **Métodos detectados:** ${methods.length ? methods.map(markdownCode).join(", ") : "não inferidos estaticamente"}`);
    lines.push(`- **Sinais de autenticação:** ${extractAuthSignals(file.content).join(", ") || "nenhum sinal estático identificado"}`);
    lines.push(`- **Variáveis:** ${[...new Set(envs)].sort().map(markdownCode).join(", ") || "nenhuma"}`);
    lines.push(`- **RPCs chamadas:** ${[...new Set(rpcs)].sort().map(markdownCode).join(", ") || "nenhuma"}`, "");
  }

  return `${lines.join("\n")}\n`;
}

function generateEnvironment(files, metadata) {
  const consumers = new Map();
  const patterns = [
    /import\.meta\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\.([A-Z][A-Z0-9_]*)/g,
    /process\.env\[["'`]([A-Z][A-Z0-9_]*)["'`]\]/g,
    /Deno\.env\.get\(\s*["'`]([A-Z][A-Z0-9_]*)["'`]\s*\)/g,
  ];

  for (const file of files) {
    for (const match of collectMatches(file.content, patterns)) {
      if (!consumers.has(match.value)) consumers.set(match.value, new Set());
      consumers.get(match.value).add(file.relative);
    }
  }

  const lines = frontMatter({
    title: "Variáveis de ambiente",
    sources: SCAN_ROOTS.map(root => `${root}/`),
    ...metadata,
  });
  lines.push("| Variável | Exposição | Consumidores |", "|---|---|---|");

  for (const variable of [...consumers.keys()].sort()) {
    const exposure = variable.startsWith("VITE_") ? "pública no bundle" : "server-side";
    const filesList = [...consumers.get(variable)].sort().map(markdownCode).join("<br>");
    lines.push(`| ${markdownCode(variable)} | ${exposure} | ${filesList} |`);
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

  const lines = frontMatter({
    title: "Códigos de erro estáticos",
    sources: SCAN_ROOTS.map(root => `${root}/`),
    ...metadata,
  });
  lines.push("| Código | Ocorrências |", "|---|---|");

  for (const code of [...occurrences.keys()].sort()) {
    const locations = [...new Set(occurrences.get(code))].sort().map(markdownCode).join("<br>");
    lines.push(`| ${markdownCode(code)} | ${locations} |`);
  }

  if (!occurrences.size) lines.push("| — | Nenhum código literal encontrado |");
  lines.push(
    "",
    "Este contrato cobre apenas códigos literais detectáveis estaticamente. Mensagens dinâmicas, erros SQL e respostas de provedores exigem geradores específicos.",
    "",
  );
  return `${lines.join("\n")}\n`;
}

async function writeOrCheck(relativePath, content) {
  const absolute = path.join(ROOT, relativePath);

  if (CHECK_MODE) {
    let existing = null;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      // Arquivo ausente é tratado como drift.
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
  const commit = gitValue(["rev-parse", "HEAD"], "unknown");
  const date = gitValue(["show", "-s", "--format=%cs", "HEAD"], "1970-01-01");
  const metadata = { commit, date };
  const files = await loadSources();

  const outputs = new Map([
    ["docs/30-contratos/APIs.generated.md", generateApis(files, metadata)],
    ["docs/30-contratos/edge-functions.generated.md", generateEdgeFunctions(files, metadata)],
    ["docs/30-contratos/variaveis-de-ambiente.generated.md", generateEnvironment(files, metadata)],
    ["docs/30-contratos/codigos-de-erro.generated.md", generateErrors(files, metadata)],
  ]);

  for (const [relativePath, content] of outputs) await writeOrCheck(relativePath, content);

  if (CHECK_MODE && !process.exitCode) console.log("Contratos estáticos estão atualizados.");
}

main().catch(error => {
  console.error("Falha ao gerar contratos estáticos:", error);
  process.exitCode = 1;
});
