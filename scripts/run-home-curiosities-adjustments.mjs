import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = path.resolve("scripts/apply-home-curiosities-content-adjustments.mjs");
const tempPath = path.resolve("scripts/.apply-home-curiosities-content-adjustments.tmp.mjs");

let script = fs.readFileSync(sourcePath, "utf8");

// Corrige padrões frágeis do aplicador sem modificar o script histórico.
script = script.replace("text\\[#e74c3c\\]", "text-\\[#e74c3c\\]");
script = script.replace(
  'let source = fs.readFileSync(file, "utf8");',
  'let source = fs.readFileSync(file, "utf8").replace(/\\r\\n/g, "\\n");',
);
script = script.replace(
  '/\\n  return \\(\\n    <section data-home-section="hero"/',
  '/\\n\\s*return \\(\\n\\s*<section data-home-section="hero"/',
);

fs.writeFileSync(tempPath, script, "utf8");
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
