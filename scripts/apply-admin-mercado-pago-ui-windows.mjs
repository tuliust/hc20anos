import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const appPath = path.resolve("src/app/App.tsx");
const migrationPath = path.resolve("scripts/apply-admin-mercado-pago-ui.mjs");
const original = fs.readFileSync(appPath, "utf8");
const usedCrlf = original.includes("\r\n");

try {
  // The original migration uses exact LF-delimited source blocks.
  fs.writeFileSync(appPath, original.replace(/\r\n/g, "\n"));
  await import(`${pathToFileURL(migrationPath).href}?run=${Date.now()}`);
} catch (error) {
  fs.writeFileSync(appPath, original);
  throw error;
}

if (usedCrlf) {
  const migrated = fs.readFileSync(appPath, "utf8");
  fs.writeFileSync(appPath, migrated.replace(/(?<!\r)\n/g, "\r\n"));
}

console.log("Admin Mercado Pago UI migration completed with Windows line-ending compatibility.");
