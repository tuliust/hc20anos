function replaceRequired(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`[buyer-orders-shared-route] Trecho não encontrado: ${label}`);
  const second = source.indexOf(search, first + search.length);
  if (second >= 0) throw new Error(`[buyer-orders-shared-route] Trecho duplicado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function transformApp(source) {
  let code = source;

  code = replaceRequired(
    code,
    `import { SecureCheckoutPage } from "./SecureCheckoutPage";`,
    `import { SecureCheckoutPage } from "./SecureCheckoutPage";\nimport { BuyerOrdersPage } from "./BuyerOrdersPage";`,
    "importação da página de pedidos",
  );

  code = replaceRequired(
    code,
    `  | "my-ticket" | "archive";`,
    `  | "my-ticket" | "buyer-orders" | "archive";`,
    "tipo da rota de pedidos",
  );

  code = replaceRequired(
    code,
    `const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile", "my-ticket", "checkout"];`,
    `const PROTECTED_ALUMNI: Page[] = ["alumni-area", "edit-profile", "my-ticket", "buyer-orders", "checkout"];`,
    "proteção autenticada da rota",
  );

  code = replaceRequired(
    code,
    `  "my-ticket": "/meu-ingresso",\n  archive: "/pos-festa",`,
    `  "my-ticket": "/meu-ingresso",\n  "buyer-orders": "/meus-pedidos",\n  archive: "/pos-festa",`,
    "caminho público da rota",
  );

  code = replaceRequired(
    code,
    `    "/enquetes": "curiosities",`,
    `    "/enquetes": "curiosities",\n    "/meus-ingressos": "buyer-orders",`,
    "alias legado da rota",
  );

  code = replaceRequired(
    code,
    `        {page === "my-ticket"     && <MyTicketPage       navigate={navigate} auth={auth}                           />}\n        {page === "archive"       && <ArchivePage        navigate={navigate} auth={auth} photos={approvedPhotos} people={people} />}`,
    `        {page === "my-ticket"     && <MyTicketPage       navigate={navigate} auth={auth}                           />}\n        {page === "buyer-orders"  && <BuyerOrdersPage    navigate={navigate}                                         />}\n        {page === "archive"       && <ArchivePage        navigate={navigate} auth={auth} photos={approvedPhotos} people={people} />}`,
    "renderização dentro do shell compartilhado",
  );

  return code;
}

export function buyerOrdersSharedRouteTransform() {
  return {
    name: "buyer-orders-shared-route-transform",
    enforce: "pre",
    transform(source, id) {
      const normalizedId = id.replaceAll("\\", "/").split("?")[0];
      if (normalizedId.endsWith("/src/app/App.tsx")) return { code: transformApp(source), map: null };
      return null;
    },
  };
}
