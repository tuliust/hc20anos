import { execFileSync } from "node:child_process";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const OUTPUT_PATH = "docs/30-contratos/consumidores-dos-tipos.generated.md";
const SOURCE_PATHS = ["src/", "scripts/generate-database-type-consumers.mjs", ":(exclude)src/lib/database.generated.ts", ":(exclude)src/lib/rpc.generated.ts"];
const CODE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".d.ts"]);

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

function metadata() {
  const paths = ["--", ...SOURCE_PATHS];
  return {
    commit: gitValue(["log", "--no-merges", "-1", "--format=%H", ...paths], "unknown"),
    date: gitValue(["log", "--no-merges", "-1", "--format=%cs", ...paths], "1970-01-01"),
  };
}

function normalize(filePath) {
  return filePath.split(path.sep).join("/");
}

async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", ".git"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile()) {
      const extension = entry.name.endsWith(".d.ts") ? ".d.ts" : path.extname(entry.name);
      if (CODE_EXTENSIONS.has(extension)) files.push(absolute);
    }
  }
  return files;
}

function unique(values) {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function category(relativePath) {
  if (relativePath === "src/lib/supabase.ts") return "cliente Supabase";
  if (relativePath.endsWith(".d.ts")) return "augmentação de módulo";
  if (relativePath.startsWith("src/app/admin/")) return "admin";
  if (relativePath.startsWith("src/app/home/")) return "home";
  if (relativePath.startsWith("src/app/")) return "componente/página";
  if (relativePath.startsWith("src/lib/")) return "serviço/biblioteca";
  if (/Enhancement\.(ts|tsx)$/.test(relativePath)) return "enhancement";
  return "outro runtime";
}

function namedEntries(specifier) {
  const block = specifier.match(/\{([\s\S]*?)\}/)?.[1];
  if (!block) return [];
  return block.split(",").map(item => item.trim()).filter(Boolean);
}

function parseImports(content) {
  const imports = [];
  const statements = content.match(/(?:^|\n)\s*import\s+[\s\S]*?;(?=\s*(?:\n|$))/g) ?? [];

  for (const rawStatement of statements) {
    const statement = rawStatement.trim();
    const source = statement.match(/\sfrom\s+["']([^"']+)["']/)?.[1];
    if (!source || !source.includes("database.types")) continue;

    const specifier = statement.match(/^import\s+([\s\S]*?)\s+from\s+["']/)?.[1]?.trim() ?? "";
    const wholeImportType = specifier.startsWith("type ");
    const normalizedSpecifier = specifier.replace(/^type\s+/, "").trim();
    const entries = namedEntries(normalizedSpecifier);
    const symbols = entries
      .map(item => item.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    const withoutNamed = normalizedSpecifier.replace(/\{[\s\S]*?\}/, "").trim();
    const defaultMatch = withoutNamed.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:,|$)/);
    const namespaceMatch = normalizedSpecifier.match(/\*\s+as\s+([A-Za-z_$][A-Za-z0-9_$]*)/);
    const namedOnlyType = entries.length > 0 && entries.every(item => item.startsWith("type "));

    imports.push({
      module: source,
      typeOnly: wholeImportType || namedOnlyType,
      symbols: unique([
        ...symbols,
        ...(defaultMatch ? [defaultMatch[1]] : []),
        ...(namespaceMatch ? [`* as ${namespaceMatch[1]}`] : []),
      ]).filter(symbol => symbol !== "type"),
    });
  }

  return imports;
}

function parseAugmentations(content) {
  const modules = [];
  const pattern = /declare\s+module\s+["']([^"']*database\.types)["']/g;
  let match;
  while ((match = pattern.exec(content)) !== null) modules.push(match[1]);
  return unique(modules);
}

function code(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function codeList(values) {
  return values.length ? values.map(code).join(", ") : "—";
}

function cell(value) {
  return String(value ?? "—").replaceAll("|", "\\|").replaceAll("\n", "<br>");
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
    ...rows.map(row => `| ${row.map(cell).join(" | ")} |`),
  ];
}

function frontMatter(meta) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${meta.date}`,
    `last_verified_commit: ${meta.commit}`,
    "generation_command: npm run docs:generate-type-consumers",
    "source_files:",
    ...SOURCE_PATHS.map(source => `  - ${source}`),
    "---",
    "",
    "# Consumidores dos tipos manuais do banco",
    "",
    "> Inventário gerado a partir de imports e augmentações de `database.types`. Não editar manualmente.",
    "",
  ];
}

async function generateReport() {
  const files = await walk(path.join(ROOT, "src"));
  const consumers = [];
  const symbolConsumers = new Map();
  const categoryCounts = new Map();

  for (const absolute of files) {
    const relative = normalize(path.relative(ROOT, absolute));
    if (relative === "src/lib/database.types.ts") continue;
    const content = await readFile(absolute, "utf8");
    const imports = parseImports(content);
    const augmentations = parseAugmentations(content);
    if (!imports.length && !augmentations.length) continue;

    const consumerCategory = category(relative);
    categoryCounts.set(consumerCategory, (categoryCounts.get(consumerCategory) ?? 0) + 1);

    for (const item of imports) {
      consumers.push({
        file: relative,
        category: consumerCategory,
        mode: item.typeOnly ? "import type" : "import",
        module: item.module,
        symbols: item.symbols,
      });
      for (const symbol of item.symbols) {
        if (!symbolConsumers.has(symbol)) symbolConsumers.set(symbol, new Set());
        symbolConsumers.get(symbol).add(relative);
      }
    }

    for (const module of augmentations) {
      consumers.push({
        file: relative,
        category: consumerCategory,
        mode: "declare module",
        module,
        symbols: [],
      });
    }
  }

  consumers.sort((a, b) => a.file.localeCompare(b.file) || a.mode.localeCompare(b.mode));
  const symbols = [...symbolConsumers.entries()]
    .map(([symbol, filesSet]) => ({ symbol, files: [...filesSet].sort() }))
    .sort((a, b) => b.files.length - a.files.length || a.symbol.localeCompare(b.symbol));

  const meta = metadata();
  const output = frontMatter(meta);
  output.push(
    "## Resumo",
    "",
    ...table(
      ["Métrica", "Quantidade"],
      [
        ["Arquivos consumidores", unique(consumers.map(item => item.file)).length],
        ["Declarações de import ou augmentação", consumers.length],
        ["Símbolos importados distintos", symbols.length],
        ["Imports que não são exclusivamente `import type`", consumers.filter(item => item.mode === "import").length],
        ["Augmentações de módulo", consumers.filter(item => item.mode === "declare module").length],
      ],
    ),
    "",
    "## Consumidores por categoria",
    "",
    ...table(
      ["Categoria", "Arquivos"],
      [...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    ),
    "",
    "## Arquivos consumidores",
    "",
    ...table(
      ["Arquivo", "Categoria", "Modo", "Módulo", "Símbolos"],
      consumers.map(item => [
        code(item.file),
        item.category,
        item.mode,
        code(item.module),
        codeList(item.symbols),
      ]),
    ),
    "",
    "## Símbolos por alcance",
    "",
    ...table(
      ["Símbolo", "Consumidores", "Arquivos"],
      symbols.map(item => [code(item.symbol), item.files.length, item.files.map(code).join("<br>")]),
    ),
    "",
    "## Interpretação para a migração",
    "",
    "- `src/lib/supabase.ts` já foi migrado para a baseline gerada e não aparece entre os consumidores do arquivo manual.",
    "- arquivos em `src/lib/` tendem a combinar queries, adaptadores e tipos de domínio; exigem revisão antes de trocar aliases.",
    "- componentes e páginas devem migrar depois dos services, evitando acoplamento direto ao formato bruto de tabelas.",
    "- módulos de FAQ formam um grupo funcional próprio e podem ser migrados em conjunto.",
    "- enhancements precisam ser validados contra o bundle transformado, porque podem injetar imports ou formas adicionais.",
    "- augmentações de módulo devem ser eliminadas ou substituídas por tipos de domínio explícitos antes de remover o arquivo manual.",
    "",
    "## Ordem recomendada",
    "",
    "1. services e bibliotecas sem UI;",
    "2. FAQ;",
    "3. perfis e conteúdo público;",
    "4. fotos, memórias e enquetes;",
    "5. checkout, pedidos e catálogo;",
    "6. componentes administrativos;",
    "7. enhancements e augmentações;",
    "8. limpeza do arquivo manual.",
    "",
    "## Limitações",
    "",
    "- o inventário cobre imports estáticos terminados por ponto e vírgula e `declare module`;",
    "- usos indiretos por reexportação podem exigir análise adicional;",
    "- um import sem `type` pode ser removido do JavaScript pelo compilador, mas é classificado conservadoramente;",
    "- o relatório não prova que todos os símbolos importados são efetivamente usados;",
    "- transforms podem introduzir consumidores somente no bundle final.",
    "",
  );

  return `${output.join("\n")}\n`;
}

async function writeOrCheck(content) {
  const absolute = path.join(ROOT, OUTPUT_PATH);
  if (CHECK_MODE) {
    let current = null;
    try {
      current = await readFile(absolute, "utf8");
    } catch {
      // Ausência é drift.
    }
    if (current !== content) {
      console.error(`Inventário desatualizado: ${OUTPUT_PATH}`);
      process.exitCode = 1;
    } else {
      console.log("Inventário de consumidores está atualizado.");
    }
    return;
  }

  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  console.log(`Gerado: ${OUTPUT_PATH}`);
}

async function main() {
  await writeOrCheck(await generateReport());
}

main().catch(error => {
  console.error("Falha ao gerar inventário de consumidores:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
