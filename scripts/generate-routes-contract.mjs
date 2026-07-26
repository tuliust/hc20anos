import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import process from "node:process";

const ROOT = process.cwd();
const CHECK_MODE = process.argv.includes("--check");
const OUTPUT = "docs/30-contratos/rotas.generated.md";
const SOURCE_PATHS = [
  "src/app/App.tsx",
  "src/main.tsx",
  "build/buyerOrdersSharedRouteTransform.mjs",
  "vite.config.ts",
  "vercel.json",
  "scripts/generate-routes-contract.mjs",
];

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
    commit: gitValue(["log", "-1", "--format=%H", ...pathArgs], "unknown"),
    date: gitValue(["log", "-1", "--format=%cs", ...pathArgs], "1970-01-01"),
  };
}

function quotedValues(content) {
  return [...content.matchAll(/["'`]([^"'`]+)["'`]/g)].map(match => match[1]);
}

function requiredBlock(content, pattern, label) {
  const match = content.match(pattern);
  if (!match) throw new Error(`Bloco obrigatório não encontrado: ${label}`);
  return match[1];
}

function parsePagePaths(content) {
  const block = requiredBlock(
    content,
    /const PAGE_PATHS:\s*Record<Page, string>\s*=\s*\{([\s\S]*?)\n\};/,
    "PAGE_PATHS",
  );
  const entries = [];
  const pattern = /^\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_-]+)):\s*["'`]([^"'`]+)["'`]\s*,?\s*$/gm;
  let match;
  while ((match = pattern.exec(block)) !== null) {
    entries.push({ page: match[1] ?? match[2] ?? match[3], path: match[4] });
  }
  if (!entries.length) throw new Error("PAGE_PATHS não possui entradas reconhecíveis");
  return entries;
}

function parsePageArray(content, name) {
  const block = requiredBlock(
    content,
    new RegExp(`const ${name}:\\s*Page\\[\\]\\s*=\\s*\\[([^\\]]*)\\]`),
    name,
  );
  return new Set(quotedValues(block));
}

function parseLegacyRoutes(content) {
  const block = requiredBlock(
    content,
    /const legacyRoutes:\s*Record<string, Page>\s*=\s*\{([\s\S]*?)\n\s*\};/,
    "legacyRoutes",
  );
  const routes = [];
  const pattern = /["'`]([^"'`]+)["'`]\s*:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = pattern.exec(block)) !== null) routes.push({ path: match[1], page: match[2] });
  return routes;
}

function parseStringSet(content, name) {
  const block = requiredBlock(
    content,
    new RegExp(`const ${name}\\s*=\\s*new Set\\(\\[([^\\]]*)\\]\\)`),
    name,
  );
  return quotedValues(block);
}

function accessForPage(page, protectedAlumni, protectedAdmin) {
  if (protectedAdmin.has(page)) return "administrativo";
  if (protectedAlumni.has(page)) return "autenticado";
  return "público";
}

function escapeCell(value) {
  return String(value ?? "—")
    .replaceAll("|", "\\|")
    .replaceAll("\n", "<br>");
}

function code(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function table(headers, rows) {
  const lines = [
    `| ${headers.join(" | ")} |`,
    `|${headers.map(() => "---").join("|")}|`,
  ];
  for (const row of rows) lines.push(`| ${row.map(escapeCell).join(" | ")} |`);
  return lines;
}

async function transformedAppSource() {
  const appPath = path.join(ROOT, "src/app/App.tsx");
  const transformPath = path.join(ROOT, "build/buyerOrdersSharedRouteTransform.mjs");
  const source = await readFile(appPath, "utf8");
  const moduleUrl = `${pathToFileURL(transformPath).href}?contract=${Date.now()}`;
  const { buyerOrdersSharedRouteTransform } = await import(moduleUrl);
  const plugin = buyerOrdersSharedRouteTransform();
  const result = plugin.transform(source, appPath);
  const code = typeof result === "string" ? result : result?.code;
  if (!code) throw new Error("buyerOrdersSharedRouteTransform não retornou código");
  return code;
}

async function generate() {
  const metadata = sourceMetadata();
  const [app, main, vercelText] = await Promise.all([
    transformedAppSource(),
    readFile(path.join(ROOT, "src/main.tsx"), "utf8"),
    readFile(path.join(ROOT, "vercel.json"), "utf8"),
  ]);

  const pagePaths = parsePagePaths(app);
  const protectedAlumni = parsePageArray(app, "PROTECTED_ALUMNI");
  const protectedAdmin = parsePageArray(app, "PROTECTED_ADMIN");
  const legacyRoutes = parseLegacyRoutes(app);
  const operationsRoutes = parseStringSet(main, "operationsRoutes");
  const legacyRedirects = parseStringSet(main, "legacyGuestApprovalRoutes");
  const redirectDestination = main.match(/legacyGuestApprovalRoutes\.has\([^)]*\)[\s\S]*?window\.location\.replace\(["'`]([^"'`]+)["'`]\)/)?.[1];
  if (!redirectDestination) throw new Error("Destino dos redirects legados não encontrado");

  const vercel = JSON.parse(vercelText);
  const rewrites = Array.isArray(vercel.rewrites) ? vercel.rewrites : [];
  const pageById = new Map(pagePaths.map(entry => [entry.page, entry.path]));
  const grouped = new Map();
  for (const entry of pagePaths) {
    if (!grouped.has(entry.path)) grouped.set(entry.path, []);
    grouped.get(entry.path).push(entry.page);
  }

  const canonicalRows = [];
  for (const [routePath, pages] of grouped) {
    const resolvedPage = pages[0];
    canonicalRows.push([
      code(routePath),
      code(resolvedPage),
      pages.map(code).join(", "),
      accessForPage(resolvedPage, protectedAlumni, protectedAdmin),
      "shell compartilhado de App.tsx",
    ]);
  }

  const aliasRows = legacyRoutes.map(route => {
    const destination = pageById.get(route.page) ?? "/";
    return [
      code(route.path),
      code(destination),
      code(route.page),
      accessForPage(route.page, protectedAlumni, protectedAdmin),
    ];
  });

  const standaloneRows = operationsRoutes.map(routePath => [
    code(routePath),
    "OperationsPage + OperationsReportingPanel",
    "administrativo/operacional",
    "mount standalone em src/main.tsx",
  ]);

  const redirectRows = legacyRedirects.map(routePath => [
    code(routePath),
    code(redirectDestination),
    "window.location.replace",
  ]);

  const duplicatedPaths = [...grouped.entries()].filter(([, pages]) => pages.length > 1);
  const checkoutQueryDetected = app.includes('params.get("checkout")')
    && app.includes('params.get("token")')
    && app.includes('params.get("order")');
  const adminPrefixDetected = app.includes('normalized.startsWith("/admin/")');
  const fallbackHomeDetected = /return found\?\.\[0\]\s*\?\?\s*["'`]home["'`]/.test(app);

  const lines = [
    "---",
    "status: generated",
    "owner: tuliust",
    `last_verified: ${metadata.date}`,
    `last_verified_commit: ${metadata.commit}`,
    "generation_command: npm run docs:generate-routes",
    "source_files:",
    ...SOURCE_PATHS.map(source => `  - ${source}`),
    "---",
    "",
    "# Rotas efetivas",
    "",
    "> Contrato gerado após aplicar o transform de pedidos ao App.tsx. Não editar manualmente.",
    "",
    "## Arquitetura de roteamento",
    "",
    "A aplicação usa estado interno de página, `window.location`, History API e mounts condicionais em `src/main.tsx`. O contrato aplica `buyerOrdersSharedRouteTransform` antes da extração para representar `/meus-pedidos` e `/meus-ingressos` como existem no runtime compilado.",
    "",
    "## Rotas canônicas do shell compartilhado",
    "",
    ...table(
      ["Caminho", "Página resolvida na entrada", "IDs internos associados", "Acesso", "Montagem"],
      canonicalRows,
    ),
    "",
    "## Aliases legados interpretados pelo App",
    "",
    ...table(["Alias", "Destino canônico", "Página interna", "Acesso"], aliasRows),
    "",
    "## Rotas standalone",
    "",
    ...table(["Caminho", "Componentes", "Acesso", "Montagem"], standaloneRows),
    "",
    "As rotas standalone são interceptadas antes de `App.tsx` e, portanto, prevalecem sobre o fallback genérico `/admin/*`.",
    "",
    "## Redirecionamentos legados",
    "",
    ...table(["Origem", "Destino", "Mecanismo"], redirectRows),
    "",
    "## Regras de resolução",
    "",
    `- Prefixo administrativo genérico: ${adminPrefixDetected ? "qualquer `/admin/*` não standalone resolve para a página `admin`" : "não detectado"}.`,
    `- Rota desconhecida: ${fallbackHomeDetected ? "resolve para `home` e caminho `/`" : "fallback não reconhecido"}.`,
    `- Retorno do checkout por query string: ${checkoutQueryDetected ? "`checkout=<status>` com `token=<public_token>` ou parâmetro legado `order=<token>` força a página interna `checkout`" : "não detectado"}.`,
    "- Proteção frontend redireciona páginas autenticadas ou administrativas para `/login`, mas não substitui RLS e autorização server-side.",
    "",
    "## Caminhos compartilhados por mais de uma página interna",
    "",
  ];

  if (duplicatedPaths.length) {
    lines.push(...table(
      ["Caminho", "Páginas internas", "Página resolvida por acesso direto"],
      duplicatedPaths.map(([routePath, pages]) => [code(routePath), pages.map(code).join(", "), code(pages[0])]),
    ));
  } else {
    lines.push("Nenhum caminho duplicado foi detectado.");
  }

  lines.push(
    "",
    "## Rewrite da hospedagem",
    "",
    ...table(
      ["Origem", "Destino"],
      rewrites.map(item => [code(item.source), code(item.destination)]),
    ),
    "",
    "O rewrite da Vercel entrega a SPA para acessos diretos. A resolução funcional continua sendo responsabilidade do frontend.",
    "",
    "## Limitações",
    "",
    "- o contrato cobre rotas declaradas em `PAGE_PATHS`, aliases, transform de pedidos, mounts standalone e redirects de `main.tsx`;",
    "- parâmetros internos de componentes, estados de modal e tabs administrativas não são tratados como rotas independentes;",
    "- regras condicionais introduzidas por novos transforms devem ser adicionadas ao gerador;",
    "- a existência de uma rota não comprova autorização server-side;",
    "- links externos e âncoras não entram neste inventário.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

async function writeOrCheck(content) {
  const absolute = path.join(ROOT, OUTPUT);
  if (CHECK_MODE) {
    let existing = null;
    try {
      existing = await readFile(absolute, "utf8");
    } catch {
      // Arquivo ausente é drift.
    }
    if (existing !== content) {
      console.error(`Contrato desatualizado: ${OUTPUT}`);
      process.exitCode = 1;
    } else {
      console.log("Contrato de rotas está atualizado.");
    }
    return;
  }
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, content, "utf8");
  console.log(`Gerado: ${OUTPUT}`);
}

async function main() {
  await writeOrCheck(await generate());
}

main().catch(error => {
  console.error("Falha ao gerar contrato de rotas:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
