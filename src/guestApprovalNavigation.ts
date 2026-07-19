const LINK_ID = "hc-guest-approval-link";

function installLink() {
  if (document.getElementById(LINK_ID)) return;
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  if (!["/minha-area", "/ingressos", "/comprar-ingresso"].includes(path)) return;

  const candidates = Array.from(document.querySelectorAll<HTMLElement>("main, [role='main'], section"));
  const host = candidates.find(element => /minha área|ingresso|comprar/i.test(element.textContent ?? "")) ?? document.querySelector("main");
  if (!host) return;

  const link = document.createElement("a");
  link.id = LINK_ID;
  link.href = "/convidado";
  link.textContent = "Convidados externos e aprovações";
  link.setAttribute("style", "display:inline-flex;align-items:center;justify-content:center;margin:16px 0;padding:12px 18px;border-radius:999px;background:#183c2f;color:#fff;text-decoration:none;font-weight:700");
  host.prepend(link);
}

export function installGuestApprovalNavigation() {
  installLink();
  const observer = new MutationObserver(installLink);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener("popstate", installLink);
}
