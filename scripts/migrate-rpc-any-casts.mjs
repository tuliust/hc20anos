import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const FIX = process.argv.includes("--fix");
const ROOTS = ["src", "build"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts", ".cts"]);
const UNSAFE_RPC = /\(\s*supabase\s+as\s+any\s*\)\s*\.rpc/g;

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function walk(relativeDirectory) {
  const absolute = path.join(ROOT, relativeDirectory);
  if (!await exists(absolute)) return [];
  const entries = await readdir(absolute, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(relative));
    else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) files.push(relative);
  }
  return files;
}

const files = (await Promise.all(ROOTS.map(walk))).flat().sort();
const findings = [];

for (const relative of files) {
  const absolute = path.join(ROOT, relative);
  const content = await readFile(absolute, "utf8");
  const matches = [...content.matchAll(UNSAFE_RPC)];
  if (matches.length === 0) continue;

  const lines = matches.map(match => content.slice(0, match.index).split("\n").length);
  findings.push({ file: relative.split(path.sep).join("/"), count: matches.length, lines });

  if (FIX) {
    await writeFile(absolute, content.replace(UNSAFE_RPC, "supabase.rpc"), "utf8");
  }
}

if (findings.length > 0) {
  for (const finding of findings) {
    console.log(`${FIX ? "Corrigido" : "Detectado"}: ${finding.file}:${finding.lines.join(",")} (${finding.count})`);
  }
  if (!FIX) {
    console.error("Chamadas RPC ainda contornam SupabaseClient<Database> com cast para any.");
    process.exit(1);
  }
}

console.log(`${FIX ? "Migração" : "Verificação"} concluída: ${findings.reduce((sum, item) => sum + item.count, 0)} ocorrência(s).`);
