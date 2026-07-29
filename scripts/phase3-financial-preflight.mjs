import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const ROOT = process.cwd();
const REQUIRE_ENV = process.argv.includes("--require-env");
const REPORT_PATH = path.join(ROOT, "artifacts", "phase3-financial-readiness.json");

const sourceChecks = [
  {
    file: "supabase/functions/checkout-create/index.ts",
    markers: [
      "MERCADO_PAGO_ENV",
      "sandbox_init_point",
      "X-Idempotency-Key",
      "create_checkout_order",
      "payment_preferences",
    ],
  },
  {
    file: "supabase/functions/payment-webhook/index.ts",
    markers: [
      "MERCADO_PAGO_WEBHOOK_SECRET",
      "x-signature",
      "x-request-id",
      "HMAC",
      "apply_mercado_pago_payment",
      "payment_events",
    ],
  },
  {
    file: "supabase/functions/refund-processor/index.ts",
    markers: [
      "X-Idempotency-Key",
      "restore_refunded_order_inventory",
      "payment_refunded",
      "refund_requests",
    ],
  },
  {
    file: "supabase/functions/notification-worker/index.ts",
    markers: [
      "NOTIFICATION_WORKER_KEY",
      "claim_notification_jobs",
      "complete_notification_job",
      "RESEND_API_KEY",
    ],
  },
  {
    file: "supabase/migrations/20260719000009_transfers_refunds_checkin_operations.sql",
    markers: [
      "request_ticket_transfer",
      "accept_ticket_transfer",
      "cancel_ticket_transfer",
      "request_order_refund",
      "review_refund_request",
    ],
  },
  {
    file: "supabase/migrations/20260719000010_refund_inventory_restore.sql",
    markers: ["restore_refunded_order_inventory"],
  },
  {
    file: "docs/40-runbooks/validacao-de-pagamentos.md",
    markers: [
      "MERCADO_PAGO_ENV=test",
      "Assinatura inválida",
      "Webhook duplicado",
      "Notificações",
      "Critérios de interrupção",
    ],
  },
];

const requiredEnvironment = [
  "PHASE3_SUPABASE_URL",
  "PHASE3_SUPABASE_ANON_KEY",
  "PHASE3_BUYER_EMAIL",
  "PHASE3_BUYER_PASSWORD",
  "PHASE3_ADMIN_EMAIL",
  "PHASE3_ADMIN_PASSWORD",
  "PHASE3_TRANSFER_RECIPIENT_EMAIL",
  "PHASE3_TRANSFER_RECIPIENT_PASSWORD",
  "PHASE3_MERCADO_PAGO_ACCESS_TOKEN",
  "PHASE3_MERCADO_PAGO_WEBHOOK_SECRET",
  "PHASE3_NOTIFICATION_WORKER_KEY",
  "PHASE3_CHECKOUT_PAYLOAD_JSON",
];

const optionalNotificationEnvironment = [
  "PHASE3_RESEND_API_KEY",
  "PHASE3_TRANSACTIONAL_FROM_EMAIL",
  "PHASE3_TEST_RECIPIENT_EMAIL",
  "PHASE3_WHATSAPP_ACCESS_TOKEN",
  "PHASE3_WHATSAPP_PHONE_NUMBER_ID",
  "PHASE3_WHATSAPP_GRAPH_VERSION",
  "PHASE3_TEST_RECIPIENT_PHONE",
];

function safePresence(name) {
  return Boolean(String(process.env[name] ?? "").trim());
}

function fail(message) {
  const error = new Error(message);
  error.code = "phase3_preflight_failed";
  throw error;
}

async function inspectSources() {
  const results = [];
  for (const check of sourceChecks) {
    const absolute = path.join(ROOT, check.file);
    const content = await readFile(absolute, "utf8");
    const missingMarkers = check.markers.filter((marker) => !content.includes(marker));
    results.push({ file: check.file, ok: missingMarkers.length === 0, missing_markers: missingMarkers });
  }
  return results;
}

function inspectEnvironment() {
  const missing = requiredEnvironment.filter((name) => !safePresence(name));
  const optionalPresent = optionalNotificationEnvironment.filter(safePresence);

  const phaseEnvironment = String(process.env.PHASE3_ENV ?? "test").trim();
  const confirmation = String(process.env.PHASE3_CONFIRMATION ?? "").trim();
  const url = String(process.env.PHASE3_SUPABASE_URL ?? "").trim();

  const errors = [];
  if (phaseEnvironment !== "test") errors.push("PHASE3_ENV deve ser exatamente test");
  if (confirmation !== "PREPARAR_FASE_3_TESTE") errors.push("PHASE3_CONFIRMATION inválida");
  if (url && !/^https:\/\//i.test(url)) errors.push("PHASE3_SUPABASE_URL deve usar HTTPS");

  if (safePresence("PHASE3_CHECKOUT_PAYLOAD_JSON")) {
    try {
      const payload = JSON.parse(process.env.PHASE3_CHECKOUT_PAYLOAD_JSON);
      const forbiddenFields = ["price", "unit_price", "total", "total_amount", "total_amount_cents", "ticket_type_id"];
      const leakedAuthority = forbiddenFields.filter((field) => Object.hasOwn(payload, field));
      if (leakedAuthority.length > 0) errors.push(`payload contém autoridade financeira proibida: ${leakedAuthority.join(", ")}`);
      if (!payload.product_code) errors.push("PHASE3_CHECKOUT_PAYLOAD_JSON sem product_code");
      if (!Array.isArray(payload.participants) || payload.participants.length < 1) errors.push("PHASE3_CHECKOUT_PAYLOAD_JSON sem participants válidos");
    } catch {
      errors.push("PHASE3_CHECKOUT_PAYLOAD_JSON não é JSON válido");
    }
  }

  return {
    checked: REQUIRE_ENV,
    required_names: requiredEnvironment,
    missing_required_names: missing,
    optional_notification_names_present: optionalPresent,
    errors,
  };
}

async function main() {
  const sourceResults = await inspectSources();
  const sourceFailures = sourceResults.filter((item) => !item.ok);
  const environment = inspectEnvironment();

  const report = {
    status: "prepared_not_executed",
    generated_at: new Date().toISOString(),
    network_calls_performed: false,
    provider_calls_performed: false,
    financial_mutations_performed: false,
    source_checks: sourceResults,
    environment,
    next_command: "node scripts/phase3-financial-preflight.mjs --require-env",
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  if (sourceFailures.length > 0) {
    fail(`Marcadores ausentes em ${sourceFailures.map((item) => item.file).join(", ")}`);
  }
  if (REQUIRE_ENV && environment.missing_required_names.length > 0) {
    fail(`Secrets/variáveis ausentes: ${environment.missing_required_names.join(", ")}`);
  }
  if (REQUIRE_ENV && environment.errors.length > 0) {
    fail(environment.errors.join("; "));
  }

  console.log(JSON.stringify({
    status: report.status,
    source_checks: sourceResults.length,
    environment_checked: REQUIRE_ENV,
    missing_required_names: environment.missing_required_names,
    report: path.relative(ROOT, REPORT_PATH),
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
