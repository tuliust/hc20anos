import { readFile, writeFile } from "node:fs/promises";

const appPath = new URL("../src/app/App.tsx", import.meta.url);
let source = await readFile(appPath, "utf8");

const importAnchor = 'import { CmsAssetsPanel } from "./CmsAdminPanels";';
const secureImport = 'import { SecureCheckoutPage } from "./SecureCheckoutPage";';

if (!source.includes(secureImport)) {
  if (!source.includes(importAnchor)) throw new Error("Import anchor not found in App.tsx");
  source = source.replace(importAnchor, `${importAnchor}\n${secureImport}`);
}

const legacyRoute = '{page === "checkout"      && <CheckoutPage      navigate={navigate} auth={auth} ticketTypes={ticketTypes} selectedTicketTypeId={selectedTicketTypeId} checkoutReturn={checkoutReturn} />}';
const secureRoute = '{page === "checkout"      && <SecureCheckoutPage navigate={navigate} auth={auth} ticketTypes={ticketTypes} selectedTicketTypeId={selectedTicketTypeId} checkoutReturn={checkoutReturn} />}';

if (source.includes(legacyRoute)) {
  source = source.replace(legacyRoute, secureRoute);
} else if (!source.includes(secureRoute)) {
  throw new Error("Checkout route anchor not found in App.tsx");
}

await writeFile(appPath, source, "utf8");
console.log("Secure checkout route enabled in src/app/App.tsx");
