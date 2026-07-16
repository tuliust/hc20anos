import { readFile, writeFile } from "node:fs/promises";

const replacements = [
  {
    path: "src/app/SecureCheckoutPage.tsx",
    pairs: [
      ['type CheckoutReturnState = { status: PaymentStatus | "cancelled"; orderId: string } | null;', 'type CheckoutReturnState = { status: PaymentStatus | "cancelled"; publicToken: string } | null;'],
      ['checkoutReturn?.orderId', 'checkoutReturn?.publicToken'],
      ['getCheckoutStatus(checkoutReturn.orderId)', 'getCheckoutStatus(checkoutReturn.publicToken)'],
    ],
  },
  {
    path: "src/app/App.tsx",
    pairs: [
      ['const orderId = params.get("order") ?? params.get("external_reference");', 'const publicToken = params.get("token") ?? params.get("order");'],
      ['if (status && orderId && validStatuses.includes(status)) {', 'if (status && publicToken && validStatuses.includes(status)) {'],
      ['setCheckoutReturn({ status: status as PaymentStatus | "cancelled", orderId });', 'setCheckoutReturn({ status: status as PaymentStatus | "cancelled", publicToken });'],
      ['orderId: string', 'publicToken: string'],
    ],
  },
];

let changedFiles = 0;
for (const target of replacements) {
  let content = await readFile(target.path, "utf8");
  const original = content;

  for (const [from, to] of target.pairs) {
    if (content.includes(to)) continue;
    if (!content.includes(from)) {
      throw new Error(`Expected checkout token fragment not found in ${target.path}: ${from}`);
    }
    content = content.replaceAll(from, to);
  }

  if (content !== original) {
    await writeFile(target.path, content, "utf8");
    changedFiles += 1;
    console.log(`Updated ${target.path}`);
  } else {
    console.log(`Already updated ${target.path}`);
  }
}

console.log(`Checkout public-token rename complete. Changed files: ${changedFiles}`);
