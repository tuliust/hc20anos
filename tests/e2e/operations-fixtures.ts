import type { Page, Route } from "@playwright/test";
import type { AdminRole } from "../../src/lib/admin.types";
import {
  TEST_USER_ID,
  installAuthenticatedProfileClaimFixtures,
} from "./profile-claim-fixtures";

export const OPERATION_TICKET_ID = "00000000-0000-4000-8000-000000008001";
export const OPERATION_REFUND_ID = "00000000-0000-4000-8000-000000009001";

async function fulfillJson(route: Route, payload: unknown, status = 200) {
  await route.fulfill({
    status,
    contentType: "application/json",
    headers: { "Content-Range": "0-0/1" },
    body: JSON.stringify(payload),
  });
}

export type OperationsCapture = {
  checkinCalls: Record<string, unknown>[];
  voucherCalls: Record<string, unknown>[];
};

export async function installOperationsFixtures(
  page: Page,
  role: AdminRole,
): Promise<OperationsCapture> {
  await installAuthenticatedProfileClaimFixtures(page);

  let checkedIn = false;
  const checkinCalls: Record<string, unknown>[] = [];
  const voucherCalls: Record<string, unknown>[] = [];

  await page.route("**/rest/v1/admin_users*", route => fulfillJson(route, {
    role,
    user_id: TEST_USER_ID,
  }));

  await page.route("**/rest/v1/rpc/get_checkin_dashboard", route => fulfillJson(route, [{
    ticket_id: OPERATION_TICKET_ID,
    attendee_name: "Maria Cabeção",
    attendee_email: "claimant@example.com",
    qr_code: "HC20-CHECKIN-001",
    ticket_status: "active",
    checked_in: checkedIn,
    checked_in_at: checkedIn ? "2026-07-27T18:00:00.000Z" : null,
    order_id: "00000000-0000-4000-8000-000000007001",
    extras: [
      {
        id: "00000000-0000-4000-8000-000000008101",
        type: "drinks",
        quantity: 1,
        units: 4,
        delivered_at: null,
      },
    ],
  }]));

  await page.route("**/rest/v1/rpc/perform_ticket_checkin", async route => {
    checkinCalls.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    checkedIn = !(route.request().postDataJSON() as { p_undo?: boolean } | null)?.p_undo;
    await fulfillJson(route, null);
  });

  await page.route("**/rest/v1/rpc/set_participant_vouchers_delivered", async route => {
    voucherCalls.push((route.request().postDataJSON() ?? {}) as Record<string, unknown>);
    await fulfillJson(route, null);
  });

  await page.route("**/rest/v1/rpc/get_admin_refund_requests", route => fulfillJson(route, [{
    id: OPERATION_REFUND_ID,
    order_id: "00000000-0000-4000-8000-000000007001",
    reason: "Participante não poderá comparecer.",
    status: "requested",
    gross_amount_cents: 15900,
    non_recoverable_fee_cents: 900,
    refund_amount_cents: 15000,
    requested_at: "2026-07-27T17:00:00.000Z",
  }]));

  await page.route("**/rest/v1/rpc/get_checkin_operation_metrics", route => fulfillJson(route, [{
    total_tickets: 10,
    active_tickets: 10,
    checked_in_tickets: 4,
    pending_tickets: 6,
    invalid_tickets: 0,
    checkin_rate: 40,
    vouchers_required: 4,
    vouchers_delivered: 2,
    last_checkin_at: "2026-07-27T18:00:00.000Z",
  }]));

  await page.route("**/rest/v1/rpc/get_checkin_activity", route => fulfillJson(route, [{
    event_id: "00000000-0000-4000-8000-000000006001",
    attendee_name: "Maria Cabeção",
    action: "checkin",
    operator_email: "operador@example.com",
    notes: null,
    created_at: "2026-07-27T18:00:00.000Z",
  }]));

  await page.route("**/rest/v1/rpc/export_checkin_report", route => fulfillJson(route, []));

  return { checkinCalls, voucherCalls };
}
