import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const ALLOWED_STATUS = new Set(["canonical", "generated", "draft", "historical", "deprecated"]);
const STRICT_PREFIXES = [
  "docs/00-visao-geral/",
  "docs/10-dominios/",
  "docs/30-contratos/",
  "docs/40-runbooks/",
  "docs/50-governanca/",
  "docs/archive/",
];

const errors = [];
const warnings = [];

function normalizeRelative(filePath) {
  return filePath.split(path.sep).join("/");
}

function isStrictDocument(relativePath) {
  return relativePath === "README.md" || STRICT_PREFIXES.some(prefix => relativePath.startsWith(prefix));
}

async function exists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function walkMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkMarkdown(absolute));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      files.push(absolute);
    }
  }

  return files;
}

function unquote(value) {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseFrontMatter(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return null;

  const normalized = content.replaceAll("\r\n", "\n");
  const end = normalized.indexOf("\n---\n", 4);
  if (end < 0) return { error: "front matter sem delimitador final" };

  const block = normalized.slice(4, end);
  const data = {};
  let activeList = null;

  for (const rawLine of block.split("\n")) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith("#")) continue;

    const listMatch = rawLine.match(/^\s+-\s+(.+)$/);
    if (listMatch && activeList) {
      data[activeList].push(unquote(listMatch[1]));
      continue;
    }

    const keyMatch = rawLine.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!keyMatch) continue;

    const [, key, rawValue] = keyMatch;
    if (!rawValue.trim()) {
      data[key] = [];
      activeList = key;
    } else {
      data[key] = unquote(rawValue);
      activeList = null;
    }
  }

  return { data };
}

function extractMarkdownTargets(content) {
  const targets = [];
  const pattern = /!?\[[^\]]*\]\(([^)]+)\)/g;
  let match;

  while ((match = pattern.exec(content)) !== null) {
    let target = match[1].trim();
    if (!target) continue;

    if (target.startsWith("<") && target.includes(">")) {
      target = target.slice(1, target.indexOf(">"));
    } else {
      target = target.split(/\s+["']/)[0];
    }

    targets.push(target);
  }

  return targets;
}

function localPathFromTarget(target) {
  if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(target)) return null;
  if (target.startsWith("#")) return null;

  const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
  if (!withoutFragment) return null;

  try {
    return decodeURIComponent(withoutFragment);
  } catch {
    return withoutFragment;
  }
}

async function resolveDocumentationTarget(documentPath, target) {
  const local = localPathFromTarget(target);
  if (!local) return true;

  const base = local.startsWith("/")
    ? path.join(ROOT, local.replace(/^\/+/, ""))
    : path.resolve(path.dirname(documentPath), local);

  if (await exists(base)) return true;
  if (await exists(`${base}.md`)) return true;
  if (await exists(path.join(base, "README.md"))) return true;
  return false;
}

async function validateSourceEntries(relativePath, frontMatter) {
  const entries = frontMatter.source_files;
  if (!Array.isArray(entries)) return;

  for (const entry of entries) {
    if (!entry || /[*?\[\]]/.test(entry)) {
      warnings.push(`${relativePath}: source_files não validável automaticamente: ${entry}`);
      continue;
    }

    const absolute = path.resolve(ROOT, entry.replace(/^\/+/, ""));
    if (!await exists(absolute)) {
      errors.push(`${relativePath}: source_file inexistente: ${entry}`);
    }
  }
}

async function validateSupersededEntries(relativePath, frontMatter) {
  for (const key of ["supersedes", "superseded_by"]) {
    const entries = frontMatter[key];
    if (!Array.isArray(entries)) continue;

    for (const entry of entries) {
      const absolute = path.resolve(ROOT, entry.replace(/^\/+/, ""));
      if (!await exists(absolute)) {
        errors.push(`${relativePath}: ${key} aponta para arquivo inexistente: ${entry}`);
      }
    }
  }
}

async function validateDocument(documentPath) {
  const relativePath = normalizeRelative(path.relative(ROOT, documentPath));
  const strict = isStrictDocument(relativePath);
  const content = await readFile(documentPath, "utf8");
  const parsed = parseFrontMatter(content);

  if (relativePath !== "README.md") {
    if (!parsed) {
      const message = `${relativePath}: sem front matter`;
      (strict ? errors : warnings).push(message);
    } else if (parsed.error) {
      errors.push(`${relativePath}: ${parsed.error}`);
    } else {
      const frontMatter = parsed.data;
      const status = frontMatter.status;

      if (!status || !ALLOWED_STATUS.has(status)) {
        errors.push(`${relativePath}: status ausente ou inválido`);
      }
      if (!frontMatter.owner) {
        errors.push(`${relativePath}: owner ausente`);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(frontMatter.last_verified ?? ""))) {
        errors.push(`${relativePath}: last_verified ausente ou inválido`);
      }
      if (status === "generated" && !frontMatter.generation_command) {
        errors.push(`${relativePath}: documento generated sem generation_command`);
      }
      if (status === "deprecated" && !frontMatter.superseded_by) {
        warnings.push(`${relativePath}: deprecated sem superseded_by`);
      }

      await validateSourceEntries(relativePath, frontMatter);
      await validateSupersededEntries(relativePath, frontMatter);
    }
  }

  for (const target of extractMarkdownTargets(content)) {
    if (!await resolveDocumentationTarget(documentPath, target)) {
      const message = `${relativePath}: link local inexistente: ${target}`;
      (strict ? errors : warnings).push(message);
    }
  }
}

async function main() {
  const docsDirectory = path.join(ROOT, "docs");
  const files = [path.join(ROOT, "README.md"), ...await walkMarkdown(docsDirectory)];

  for (const file of files) {
    await validateDocument(file);
  }

  console.log(`Documentos verificados: ${files.length}`);

  if (warnings.length) {
    console.log(`\nAvisos (${warnings.length}):`);
    for (const warning of warnings) console.log(`- ${warning}`);
  }

  if (errors.length) {
    console.error(`\nErros (${errors.length}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.log("\nAuditoria documental concluída sem erros.");
}

main().catch(error => {
  console.error("Falha ao executar auditoria documental:", error);
  process.exitCode = 1;
});
