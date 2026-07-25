const ORDERS_ROUTE = "/admin/tickets";

let showPendingOrders = false;
let scheduled = false;
let observer: MutationObserver | null = null;

function normalize(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function isOrdersRoute(): boolean {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const tab = new URLSearchParams(window.location.search).get("tab");
  return path === ORDERS_ROUTE && (tab === null || tab === "orders");
}

function findOrdersTable(): HTMLTableElement | null {
  const tables = Array.from(document.querySelectorAll<HTMLTableElement>("table"));

  return tables.find(table => {
    const headers = Array.from(table.querySelectorAll("thead th"))
      .map(header => normalize(header.textContent));

    return headers.includes("comprador")
      && headers.includes("pagamento")
      && headers.includes("status");
  }) ?? null;
}

function isApprovedStatus(value: string): boolean {
  const status = normalize(value);
  return status.includes("aprovad")
    || status === "approved"
    || status.includes("pago")
    || status === "paid";
}

function restoreRows(): void {
  document.querySelectorAll<HTMLTableRowElement>("tr[data-hc-order-filtered]")
    .forEach(row => {
      row.style.display = "";
      delete row.dataset.hcOrderFiltered;
    });

  document.querySelectorAll<HTMLElement>("[data-hc-orders-summary],[data-hc-orders-empty-confirmed]")
    .forEach(node => node.remove());

  document.querySelectorAll<HTMLTableElement>("table")
    .forEach(table => {
      if (table.parentElement?.style.display === "none") {
        table.parentElement.style.display = "";
      }
    });
}

function enhanceOrdersPage(): void {
  if (!isOrdersRoute()) {
    restoreRows();
    return;
  }

  const table = findOrdersTable();
  if (!table) return;

  const rows = Array.from(table.querySelectorAll<HTMLTableRowElement>("tbody tr"));
  if (rows.length === 0) return;

  let approvedCount = 0;
  let pendingCount = 0;

  rows.forEach(row => {
    const cells = Array.from(row.querySelectorAll<HTMLTableCellElement>("td"));
    const statusText = cells.at(-1)?.textContent ?? "";
    const approved = isApprovedStatus(statusText);

    if (approved) approvedCount += 1;
    else pendingCount += 1;

    row.dataset.hcOrderFiltered = "true";
    row.style.display = approved || showPendingOrders ? "" : "none";
  });

  const tableWrapper = table.parentElement;
  const section = tableWrapper?.parentElement;
  if (!tableWrapper || !section) return;

  let summary = section.querySelector<HTMLElement>("[data-hc-orders-summary]");
  if (!summary) {
    summary = document.createElement("div");
    summary.dataset.hcOrdersSummary = "true";
    summary.className = "border border-[#2d6a4f]/30 bg-[#0a120a] p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3";
    section.insertBefore(summary, tableWrapper);
  }

  const signature = `${approvedCount}:${pendingCount}:${showPendingOrders ? "all" : "approved"}`;

  if (summary.dataset.hcOrdersSignature !== signature) {
    summary.dataset.hcOrdersSignature = signature;
    summary.replaceChildren();

    const text = document.createElement("div");
    text.innerHTML = `
      <p class="text-[#f0ebe0] text-sm font-semibold">Vendas confirmadas: ${approvedCount}</p>
      <p class="text-[#7a9a7a] text-xs mt-1">${pendingCount} pedido(s) pendente(s) ou tentativa(s) de checkout não são contabilizados como venda.</p>
    `;

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "border border-[#2d6a4f]/40 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-[#74c69d] hover:bg-[#2d6a4f]/10 transition-colors disabled:opacity-40";
    toggle.textContent = showPendingOrders
      ? "Ocultar pendentes"
      : `Exibir pendentes (${pendingCount})`;
    toggle.disabled = pendingCount === 0;
    toggle.addEventListener("click", () => {
      showPendingOrders = !showPendingOrders;
      enhanceOrdersPage();
    });

    summary.append(text, toggle);
  }

  let empty = section.querySelector<HTMLElement>("[data-hc-orders-empty-confirmed]");

  if (approvedCount === 0 && !showPendingOrders) {
    if (!empty) {
      empty = document.createElement("div");
      empty.dataset.hcOrdersEmptyConfirmed = "true";
      empty.className = "border border-[#2d6a4f]/20 bg-[#141f14] p-8 text-center";
      empty.innerHTML = `
        <p class="text-[#f0ebe0] font-semibold">Nenhuma venda confirmada</p>
        <p class="text-[#7a9a7a] text-sm mt-2">Os pedidos pendentes permanecem disponíveis para consulta, mas não representam ingressos vendidos.</p>
      `;
      section.insertBefore(empty, tableWrapper);
    }
    tableWrapper.style.display = "none";
  } else {
    empty?.remove();
    tableWrapper.style.display = "";
  }
}

function scheduleEnhancement(): void {
  if (scheduled) return;
  scheduled = true;

  window.setTimeout(() => {
    scheduled = false;
    enhanceOrdersPage();
  }, 0);
}

export function installAdminOrdersDisplayEnhancements(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  observer?.disconnect();
  observer = new MutationObserver(scheduleEnhancement);
  observer.observe(document.body, { childList: true, subtree: true });

  window.addEventListener("popstate", scheduleEnhancement);
  window.addEventListener("pushstate", scheduleEnhancement as EventListener);
  scheduleEnhancement();
}
