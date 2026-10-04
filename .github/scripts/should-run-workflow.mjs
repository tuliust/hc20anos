import { execFileSync } from "node:child_process";

const workflow = process.argv[2];
const eventName = process.env.EVENT_NAME ?? "";

const patternsByWorkflow = {
  "commerce-functional-tests.yml": [
    "src/main.tsx", "src/app/SecureCheckoutPage.tsx", "src/app/PublicTicketsCatalogMount.tsx",
    "src/lib/checkout.ts", "src/lib/currentTicketCatalog.ts", "src/lib/publicTicketCatalog.ts",
    "src/lib/commerce.types.ts", "tests/e2e/checkout-flow.spec.ts", "tests/e2e/commerce-fixtures.ts",
    "tests/e2e/ticket-catalog-source-of-truth.spec.ts", "tests/e2e/home-fixtures.ts",
    "tests/e2e/profile-claim-fixtures.ts", "playwright.config.ts", "package.json", "package-lock.json",
    ".github/workflows/commerce-functional-tests.yml",
  ],
  "database-migrations.yml": [
    "supabase/config.toml", "supabase/migrations/**", "supabase/tests/**", "supabase/manual/**",
    "scripts/generate-database-contracts.mjs", "scripts/validate-supabase-migrations.mjs",
    "scripts/repair-supabase-migration-history.ps1", "build/profileClaimIdentityTransform.mjs",
    "src/lib/profileClaimIdentity.ts", "src/lib/database.generated.ts", "tests/e2e/profile-claim-*.ts",
    "playwright.config.ts", "package.json", "package-lock.json", "docs/30-contratos/banco.generated.md",
    "docs/30-contratos/RPCs.generated.md", "docs/30-contratos/RLS.generated.md",
    "docs/30-contratos/erd.generated.mmd", "docs/30-contratos/database.types.generated.ts",
    ".github/workflows/database-migrations.yml",
  ],
  "documentation.yml": [
    "README.md", "docs/**", "scripts/audit-docs.mjs", "package.json", "package-lock.json",
    ".github/CODEOWNERS", ".github/pull_request_template.md", ".github/workflows/documentation.yml",
  ],
  "editorial-moderation-functional-tests.yml": [
    "src/app/App.tsx", "src/lib/services.ts", "src/lib/engagement.types.ts", "src/lib/photo.types.ts",
    "tests/e2e/editorial-moderation-flow.spec.ts", "tests/e2e/editorial-moderation-fixtures.ts",
    "tests/e2e/profile-claim-fixtures.ts", "playwright.config.ts", "package.json", "package-lock.json",
    ".github/workflows/editorial-moderation-functional-tests.yml",
  ],
  "engagement-functional-tests.yml": [
    "index.html", "src/app/App.tsx", "src/contentSyncEnhancements.ts", "src/exAlumniEnhancements.ts",
    "src/styles.css", "src/historyContentEnhancements.ts", "src/lib/services.ts", "src/lib/engagement.types.ts",
    "tests/e2e/engagement-flow.spec.ts", "tests/e2e/home-alumni-clickable.spec.ts",
    "tests/e2e/home-fixtures.ts", "tests/e2e/engagement-fixtures.ts", "tests/e2e/profile-claim-fixtures.ts",
    "playwright.config.ts", "package.json", "package-lock.json",
    ".github/workflows/engagement-functional-tests.yml",
  ],
  "functional-tests.yml": [
    "src/app/home/**", "src/app/admin/faq/**", "src/lib/faq*.ts", "src/lib/profileClaim*.ts",
    "src/lib/people.types.ts", "src/lib/identity.types.ts", "tests/unit/faq.test.mjs",
    "tests/e2e/faq-*.ts", "tests/e2e/profile-claim-*.ts", "playwright.config.ts", "package.json",
    "package-lock.json", ".github/workflows/functional-tests.yml",
  ],
  "operations-functional-tests.yml": [
    "src/main.tsx", "src/app/OperationsRouteGuard.tsx", "src/app/OperationsPage.tsx",
    "src/app/OperationsReportingPanel.tsx", "src/app/CheckinScanner.tsx", "src/lib/admin.types.ts",
    "tests/e2e/operations-flow.spec.ts", "tests/e2e/operations-fixtures.ts",
    "tests/e2e/profile-claim-fixtures.ts", "playwright.config.ts", "package.json", "package-lock.json",
    ".github/workflows/operations-functional-tests.yml",
  ],
  "phase1-environment-security.yml": [
    "src/**", "api/**", "build/**", "supabase/functions/**", "supabase/migrations/**", "supabase/tests/**",
    "scripts/generate-consumed-rpc-contracts.mjs", "scripts/migrate-rpc-any-casts.mjs",
    "docs/30-contratos/database.types.generated.ts", "docs/30-contratos/permissoes.md",
    "package.json", "package-lock.json", ".github/workflows/phase1-environment-security.yml",
  ],
  "phase2-content-storage.yml": [
    "src/**", "supabase/functions/**", "supabase/migrations/**", "supabase/tests/**",
    "scripts/apply-phase2-content-storage.mjs", "scripts/apply-phase2-test-fixtures.mjs",
    "scripts/test-phase2-content-storage.mjs", "scripts/generate-database-contracts.mjs",
    "tests/unit/image-upload-security.test.mts", "tests/e2e/phase2-content-security.spec.ts",
    "tests/e2e/engagement-fixtures.ts", "tests/e2e/photo-interactions-fixtures.ts",
    "package.json", "package-lock.json", ".github/workflows/phase2-content-storage.yml",
  ],
  "photo-interactions-functional-tests.yml": [
    "src/app/App.tsx", "src/lib/services.ts", "src/lib/photo.types.ts",
    "tests/e2e/photo-interactions-flow.spec.ts", "tests/e2e/photo-interactions-fixtures.ts",
    "tests/e2e/profile-claim-fixtures.ts", "playwright.config.ts", "package.json", "package-lock.json",
    ".github/workflows/photo-interactions-functional-tests.yml",
  ],
  "stage3-modals-e2e.yml": [
    "src/app/App.tsx", "src/lib/services.ts", "src/lib/people.types.ts", "src/lib/photo.types.ts",
    "src/historyContentEnhancements.ts", "src/historyPersonFilterEnhancement.ts",
    "src/historyPhotoRefreshEnhancement.ts", "tests/e2e/home-fixtures.ts", "tests/e2e/stage3-*.spec.ts",
    "playwright.config.ts", "package.json", "package-lock.json", ".github/workflows/stage3-modals-e2e.yml",
  ],
  "static-contracts.yml": [
    "api/**", "supabase/functions/**", "src/**", "build/**", "vite.config.ts", "vercel.json",
    "scripts/generate-static-contracts.mjs", "scripts/generate-routes-contract.mjs", "scripts/audit-docs.mjs",
    "docs/30-contratos/README.md", "docs/30-contratos/geracao-estatica.md", "package.json",
    ".github/workflows/static-contracts.yml",
  ],
  "type-compatibility.yml": [
    "src/**", "docs/30-contratos/database.types.generated.ts", "scripts/audit-database-types.mjs",
    "scripts/generate-database-type-consumers.mjs", "package.json", ".github/workflows/type-compatibility.yml",
  ],
};

const commonPatterns = [".github/scripts/should-run-workflow.mjs"];

function globToRegex(glob) {
  const specials = new Set("\\^$.*+?()[]{}|".split(""));
  let source = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const char = glob[index];
    if (char === "*" && glob[index + 1] === "*") {
      source += ".*";
      index += 1;
    } else if (char === "*") {
      source += "[^/]*";
    } else {
      source += specials.has(char) ? "\\" + char : char;
    }
  }
  return new RegExp(source + "$");
}

if (!workflow || !patternsByWorkflow[workflow]) {
  console.error("Workflow sem configuração de paths: " + String(workflow));
  process.exit(2);
}

if (eventName !== "pull_request") {
  console.log("run=true");
  process.exit(0);
}

const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA;
if (!baseSha || !headSha) {
  console.error("BASE_SHA e HEAD_SHA são obrigatórios em pull_request.");
  process.exit(2);
}

const changedFiles = execFileSync("git", ["diff", "--name-only", baseSha, headSha], {
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);

const patterns = [...patternsByWorkflow[workflow], ...commonPatterns];
const matchers = patterns.map(globToRegex);
const relevant = changedFiles.some(file => matchers.some(regex => regex.test(file)));

console.error(
  relevant
    ? "Mudanças relevantes para " + workflow + ": " + changedFiles.filter(file => matchers.some(regex => regex.test(file))).join(", ")
    : "Nenhuma mudança relevante para " + workflow + ".",
);
console.log("run=" + String(relevant));
