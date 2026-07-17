import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const sourcePath = path.resolve("scripts/apply-home-curiosities-content-adjustments.mjs");
const tempPath = path.resolve("scripts/.apply-home-curiosities-content-adjustments.tmp.mjs");

let script = fs.readFileSync(sourcePath, "utf8");

// Corrige padrões frágeis do aplicador sem alterar o script histórico original.
script = script.replace("text\\[#e74c3c\\]", "text-\\[#e74c3c\\]");
script = script.replace(
  '/\\n  return \\(\\n    <section data-home-section="hero"/',
  `'  return (\\n    <section data-home-section="hero"'`,
);
script = script.replace(
  '/\\{topLocations\\.length === 0 \\? \\([\\s\\S]*?\\n              \\)\\}/',
  '/\\{topLocations\\.length === 0 \\? \\([\\s\\S]*?\\n              \\)\\}/',
);

fs.writeFileSync(tempPath, script, "utf8");
try {
  await import(`${pathToFileURL(tempPath).href}?run=${Date.now()}`);
} finally {
  fs.rmSync(tempPath, { force: true });
}
