const ADMIN_PATH_PREFIX = "/admin";

const NULL_FALLBACK_ENDPOINTS = new Set([
  "/rest/v1/events",
  "/rest/v1/home_page_content",
  "/rest/v1/event_page_content",
  "/rest/v1/event_archive_settings",
  "/rest/v1/content_moderation_settings",
]);

const ARRAY_FALLBACK_ENDPOINTS = new Set([
  "/rest/v1/ticket_types",
  "/rest/v1/people",
  "/rest/v1/public_profile_cards",
  "/rest/v1/photos",
  "/rest/v1/photo_tags",
  "/rest/v1/photo_comments",
  "/rest/v1/memories",
  "/rest/v1/polls",
  "/rest/v1/profile_claims",
  "/rest/v1/photo_removal_requests",
  "/rest/v1/profile_claim_disputes",
  "/rest/v1/admin_users",
  "/rest/v1/audit_logs",
  "/rest/v1/rpc/get_admin_orders",
]);

const OBJECT_FALLBACK_ENDPOINTS = new Set([
  "/rest/v1/rpc/get_event_reports",
]);

let installed = false;

function isAdminRoute() {
  return window.location.pathname.startsWith(ADMIN_PATH_PREFIX);
}

function getRequestUrl(input: RequestInfo | URL) {
  if (input instanceof Request) return input.url;
  return String(input);
}

function getRequestMethod(input: RequestInfo | URL, init?: RequestInit) {
  return (init?.method || (input instanceof Request ? input.method : "GET")).toUpperCase();
}

function getFallbackBody(pathname: string, method: string): string | null {
  const isReadMethod = method === "GET" || method === "HEAD";

  if (isReadMethod && NULL_FALLBACK_ENDPOINTS.has(pathname)) return "null";
  if (isReadMethod && ARRAY_FALLBACK_ENDPOINTS.has(pathname)) return "[]";
  if (method === "POST" && ARRAY_FALLBACK_ENDPOINTS.has(pathname)) return "[]";
  if (method === "POST" && OBJECT_FALLBACK_ENDPOINTS.has(pathname)) return "{}";

  return null;
}

function fallbackResponse(body: string, source: Response) {
  const headers = new Headers(source.headers);
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-hc-admin-read-fallback", "true");
  headers.delete("content-length");
  headers.delete("content-range");

  return new Response(body, {
    status: 200,
    statusText: "OK",
    headers,
  });
}

export function installAdminReadResilience() {
  if (installed || typeof window === "undefined" || typeof window.fetch !== "function") return;
  installed = true;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await originalFetch(input, init);
    if (response.ok || !isAdminRoute()) return response;

    let url: URL;
    try {
      url = new URL(getRequestUrl(input), window.location.origin);
    } catch {
      return response;
    }

    const method = getRequestMethod(input, init);
    const fallbackBody = getFallbackBody(url.pathname, method);
    if (fallbackBody === null) return response;

    const responseBody = await response.clone().text().catch(() => "");
    console.error("[Admin] Consulta opcional ao Supabase falhou; usando resposta vazia.", {
      method,
      endpoint: url.pathname,
      status: response.status,
      statusText: response.statusText,
      response: responseBody,
    });

    return fallbackResponse(fallbackBody, response);
  };
}
