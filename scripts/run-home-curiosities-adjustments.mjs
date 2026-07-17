import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = path.resolve("scripts/apply-home-curiosities-content-adjustments.mjs");
const tempPath = path.resolve("scripts/.apply-home-curiosities-content-adjustments.tmp.mjs");

let script = fs.readFileSync(sourcePath, "utf8");
script = script.replace("text\\[#e74c3c\\]", "text-\\[#e74c3c\\]");

fs.writeFileSync(tempPath, script, "utf8");
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
