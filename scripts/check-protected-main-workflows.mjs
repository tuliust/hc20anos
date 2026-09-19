import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const workflowsDir = new URL("../.github/workflows/", import.meta.url);
const allowedPush = /git push origin ["']?HEAD:\$HEAD_REF["']?/;

const violations = [];
const pushLines = [];

for (const name of readdirSync(workflowsDir).filter(name => /\.ya?ml$/i.test(name)).sort()) {
  const filePath = join(workflowsDir.pathname, name);
  const lines = readFileSync(filePath, "utf8").split(/\r?\n/);

  lines.forEach((line, index) => {
    if (!/\bgit push\b/.test(line)) return;
    const entry = `${name}:${index + 1}: ${line.trim()}`;
    pushLines.push(entry);

    if (name === "database-migrations.yml" && allowedPush.test(line)) return;
    violations.push(entry);
  });
}

if (violations.length) {
  console.error("Pushes Git diretos não permitidos nos workflows:");
  for (const violation of violations) console.error(`- ${violation}`);
  console.error("A única exceção permitida é atualizar a branch HEAD de um PR do mesmo repositório.");
  process.exit(1);
}

console.log("Proteção de main validada.");
if (pushLines.length) {
  console.log("Push permitido encontrado:");
  for (const line of pushLines) console.log(`- ${line}`);
} else {
  console.log("Nenhum workflow executa git push.");
}
