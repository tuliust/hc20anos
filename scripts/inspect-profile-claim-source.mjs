import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../src/app/App.tsx", import.meta.url), "utf8");
const lines = source.split(/\r?\n/);
const needle = 'window.sessionStorage.removeItem("hc-attendance-intent");';

for (let index = 0; index < lines.length; index += 1) {
  if (!lines[index].includes(needle)) continue;
  const start = Math.max(0, index - 6);
  const end = Math.min(lines.length, index + 7);
  console.log(`--- ocorrência na linha ${index + 1} ---`);
  for (let lineIndex = start; lineIndex < end; lineIndex += 1) {
    console.log(`${String(lineIndex + 1).padStart(5, " ")}: ${lines[lineIndex]}`);
  }
}
