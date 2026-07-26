import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const MANUAL_PATH = "src/lib/database.types.ts";
const GENERATED_PATH = "docs/30-contratos/database.types.generated.ts";
const OUTPUT_PATH = "docs/30-contratos/compatibilidade-de-tipos.generated.md";
const SOURCE_PATHS = [MANUAL_PATH, GENERATED_PATH, "scripts/generate-type-compatibility-report.mjs"];

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
  const pathArgs = ["--", ...SOURCE_PATHS];
  return {
    commit: gitValue(["log", "-1", "--format=%H", ...pathArgs], "unknown"),
    date: gitValue(["log", "-1", "--format=%cs", ...pathArgs], "1970-01-01"),
  };
}

function lines(content) {
  return content.replaceAll("\r\n", "\n").split("\n");
}

function sectionRange(contentLines, section) {
  const start = contentLines.findIndex(line => line === `    ${section}: {`);
  if (start < 0) throw new Error(`Seção public.${section} não encontrada`);
  let end = contentLines.length;
  for (let index = start + 1; index < contentLines.length; index += 1) {
    if (/^    (Tables|Views|Functions|Enums|CompositeTypes): \{$/.test(contentLines[index])) {
      end = index;
      break;
    }
    if (contentLines[index] === "  }") {
      end = index;
      break;
    }
  }
  return { start, end };
}

function sectionNames(contentLines, section) {
  const { start, end } = sectionRange(contentLines, section);
  const result = [];
  for (let index = start + 1; index < end; index += 1) {
    const match = contentLines[index].match(/^      ([A-Za-z0-9_]+):/);
    if (match && match[1] !== "_") result.push(match[1]);
  }
  return [...new Set(result)];
}

function manualRowMappings(contentLines, section) {
  const { start, end } = sectionRange(contentLines, section);
  const result = new Map();
  for (let index = start + 1; index < end; index += 1) {
    const match = contentLines[index].match(/^      ([A-Za-z0-9_]+):\s*\{\s*Row:\s*([^;]+);/);
    if (match) result.set(match[1], match[2].trim());
  }
  return result;
}

function interfaceFields(contentLines) {
  const result = new Map();
  for (let index = 0; index < contentLines.length; index += 1) {
    const start = contentLines[index].match(/^export interface ([A-Za-z0-9_]+)(?:\s+extends[^\{]+)?\s*\{$/);
    if (!start) continue;
    const fields = [];
    for (let cursor = index + 1; cursor < contentLines.length; cursor += 1) {
      if (contentLines[cursor] === "}") {
        index = cursor;
        break;
      }
      const field = contentLines[cursor].match(/^\s{2}([A-Za-z0-9_]+)\??\s*:/);
      if (field) fields.push(field[1]);
    }
    result.set(start[1], [...new Set(fields)]);
  }
  return result;
}

function generatedRowFields(contentLines, section) {
  const { start, end } = sectionRange(contentLines, section);
  const result = new Map();
  let index = start + 1;
  while (index < end) {
    const objectMatch = contentLines[index].match(/^      ([A-Za-z0-9_]+): \{$/);
    if (!objectMatch) {
      index += 1;
      continue;
    }
    const objectName = objectMatch[1];
    let rowStart = -1;
    for (let cursor = index + 1; cursor < end; cursor += 1) {
      if (/^      }/.test(contentLines[cursor])) break;
      if (contentLines[cursor] === "        Row: {") {
        rowStart = cursor;
        break;
      }
    }
    const fields = [];
    if (rowStart >= 0) {
      for (let cursor = rowStart + 1; cursor < end; cursor += 1) {
        if (contentLines[cursor] === "        }") break;
        const field = contentLines[cursor].match(/^          ([A-Za-z0-9_]+)\??:/);
        if (field) fields.push(field[1]);
      }
    }
    result.set(objectName, [...new Set(fields)]);
    index += 1;
  }
  return result;
}

function sorted(values) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function difference(left, right) {
  const rightSet = new Set(right);
  return sorted(left.filter(value => !rightSet.has(value)));
}

function intersection(left, right) {
  const rightSet = new Set(right);
  return sorted(left.filter(value => rightSet.has(value)));
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

function driftRows(manualMappings, manualInterfaces, generatedRows) {
  const rows = [];
  for (const [objectName, rowType] of manualMappings) {
    if (!generatedRows.has(objectName)) continue;
    if (rowType === "any" || rowType === "never") {
      rows.push([code(objectName), code(rowType), "não comparável", "não comparável"]);
      continue;
    }
    const manualFields = manualInterfaces.get(rowType);
    if (!manualFields) {
      rows.push([code(objectName), code(rowType), "tipo manual não analisável", "tipo manual não analisável"]);
      continue;
    }
    const generatedFields = generatedRows.get(objectName) ?? [];
    const missing = difference(generatedFields, manualFields);
    const extra = difference(manualFields, generatedFields);
    if (missing.length || extra.length) rows.push([code(objectName), code(rowType), codeList(missing), codeList(extra)]);
  }
  return rows;
}

function frontMatter(meta) {
  return [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${meta.date}`,
    `last_verified_commit: ${meta.commit}`,
    "generation_command: npm run docs:generate-type-compatibility",
    "source_files:",
    ...SOURCE_PATHS.map(source => `  - ${source}`),
    "---",
    "",
    "# Compatibilidade dos tipos Supabase",
    "",
    "> Relatório gerado por comparação estrutural. Não editar manualmente.",
    "",
  ];
}

async function generateReport() {
  const [manualContent, generatedContent] = await Promise.all([
    readFile(path.join(ROOT, MANUAL_PATH), "utf8"),
    readFile(path.join(ROOT, GENERATED_PATH), "utf8"),
  ]);
  const manualLines = lines(manualContent);
  const generatedLines = lines(generatedContent);
  const meta = metadata();

  const manualTables = sectionNames(manualLines, "Tables");
  const manualViews = sectionNames(manualLines, "Views");
  const manualFunctions = sectionNames(manualLines, "Functions");
  const manualEnums = sectionNames(manualLines, "Enums");
  const generatedTables = sectionNames(generatedLines, "Tables");
  const generatedViews = sectionNames(generatedLines, "Views");
  const generatedFunctions = sectionNames(generatedLines, "Functions");
  const generatedEnums = sectionNames(generatedLines, "Enums");

  const manualTableMappings = manualRowMappings(manualLines, "Tables");
  const manualViewMappings = manualRowMappings(manualLines, "Views");
  const manualInterfaces = interfaceFields(manualLines);
  const generatedTableRows = generatedRowFields(generatedLines, "Tables");
  const generatedViewRows = generatedRowFields(generatedLines, "Views");

  const missingTables = difference(generatedTables, manualTables);
  const extraTables = difference(manualTables, generatedTables);
  const missingViews = difference(generatedViews, manualViews);
  const extraViews = difference(manualViews, generatedViews);
  const missingFunctions = difference(generatedFunctions, manualFunctions);
  const extraFunctions = difference(manualFunctions, generatedFunctions);
  const missingEnums = difference(generatedEnums, manualEnums);
  const extraEnums = difference(manualEnums, generatedEnums);
  const tablesThatAreViews = intersection(manualTables, generatedViews);
  const viewsThatAreTables = intersection(manualViews, generatedTables);
  const fields = [
    ...driftRows(manualTableMappings, manualInterfaces, generatedTableRows),
    ...driftRows(manualViewMappings, manualInterfaces, generatedViewRows),
  ];

  const anyMappings = [...manualTableMappings, ...manualViewMappings]
    .filter(([, rowType]) => rowType === "any")
    .map(([name]) => name);

  const linesOut = frontMatter(meta);
  linesOut.push(
    "## Conclusão",
    "",
    "`src/lib/database.types.ts` não é uma saída atual da Supabase CLI. Ele combina interfaces de domínio, tipos compostos de interface, aliases históricos e um mapa parcial de banco.",
    "",
    "O arquivo não deve ser substituído automaticamente pela baseline gerada, porque diversos componentes importam seus nomes ergonômicos. A migração segura deve separar o contrato real do Supabase dos tipos de domínio e de apresentação.",
    "",
    "## Cobertura estrutural",
    "",
    ...table(
      ["Categoria", "Baseline gerada", "Mapa manual", "Ausentes no manual", "Somente no manual"],
      [
        ["Tabelas", generatedTables.length, manualTables.length, missingTables.length, extraTables.length],
        ["Views", generatedViews.length, manualViews.length, missingViews.length, extraViews.length],
        ["Funções/RPCs", generatedFunctions.length, manualFunctions.length, missingFunctions.length, extraFunctions.length],
        ["Enums", generatedEnums.length, manualEnums.length, missingEnums.length, extraEnums.length],
      ],
    ),
    "",
    "## Objetos ausentes no mapa manual",
    "",
    `### Tabelas (${missingTables.length})`,
    "",
    codeList(missingTables),
    "",
    `### Views (${missingViews.length})`,
    "",
    codeList(missingViews),
    "",
    `### Funções e RPCs (${missingFunctions.length})`,
    "",
    codeList(missingFunctions),
    "",
    `### Enums (${missingEnums.length})`,
    "",
    codeList(missingEnums),
    "",
    "## Objetos presentes somente no mapa manual",
    "",
    `- Tabelas: ${codeList(extraTables)}.`,
    `- Views: ${codeList(extraViews)}.`,
    `- Funções: ${codeList(extraFunctions)}.`,
    `- Enums: ${codeList(extraEnums)}.`,
    "",
    "Essas diferenças podem representar aliases históricos, objetos removidos, classificação incorreta ou tipos de aplicação que nunca foram objetos físicos do banco.",
    "",
    "## Classificação divergente",
    "",
    `- Entradas tratadas como tabela no arquivo manual, mas geradas como view: ${codeList(tablesThatAreViews)}.`,
    `- Entradas tratadas como view no arquivo manual, mas geradas como tabela: ${codeList(viewsThatAreTables)}.`,
    "",
    "## Linhas sem tipagem efetiva",
    "",
    `Mapeamentos com \`Row: any\`: ${codeList(sorted(anyMappings))}.`,
    "",
    "## Divergência de campos nos objetos comparáveis",
    "",
  );

  if (fields.length) {
    linesOut.push(...table(
      ["Objeto", "Interface manual", "Campos ausentes no manual", "Campos extras no manual"],
      fields,
    ));
  } else {
    linesOut.push("Nenhuma divergência de campos foi detectada nos objetos comparáveis.");
  }

  linesOut.push(
    "",
    "## Estratégia recomendada",
    "",
    "1. Manter `database.types.generated.ts` como contrato bruto e não editável.",
    "2. Configurar o cliente Supabase com o tipo bruto gerado.",
    "3. Mover interfaces de tela, conteúdo JSON e agregados para um módulo de tipos de domínio.",
    "4. Substituir gradualmente interfaces `Db*` por aliases derivados de `Database[\"public\"]` quando a forma for realmente idêntica.",
    "5. Criar adaptadores explícitos quando a interface de domínio combinar tabela, view, RPC ou campos calculados.",
    "6. Remover `any` e objetos inexistentes somente depois de corrigir os consumidores.",
    "7. Executar build, TypeScript e E2E a cada grupo de migração.",
    "",
    "## Critérios para substituir o arquivo manual",
    "",
    "- nenhum consumidor depende de campo ausente no banco;",
    "- views não são declaradas como tabelas;",
    "- RPCs usadas pelo código existem na baseline gerada;",
    "- tipos de conteúdo JSON possuem adaptadores ou aliases próprios;",
    "- não há `Row: any`;",
    "- build e testes passam com o cliente tipado pela saída gerada;",
    "- a migração é dividida em commits revisáveis, sem troca massiva não auditada.",
    "",
    "## Limitações da auditoria",
    "",
    "- compara nomes e campos, não equivalência completa de tipos TypeScript;",
    "- não interpreta aliases condicionais ou generics complexos;",
    "- tipos de domínio sem correspondência direta são intencionalmente preservados;",
    "- diferenças podem exigir análise funcional antes de correção.",
    "",
  );

  return `${linesOut.join("\n")}\n`;
}

async function writeOrCheck(content) {
  const absolute = path.join(ROOT, OUTPUT_PATH);
  if (CHECK_MODE) {
    let existing = null;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      // Ausência é drift.
    }
    if (existing !== content) {
      console.error(`Relatório desatualizado: ${OUTPUT_PATH}`);
      process.exitCode = 1;
    } else {
      console.log("Relatório de compatibilidade está atualizado.");
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
  console.error("Falha ao gerar relatório de compatibilidade:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
