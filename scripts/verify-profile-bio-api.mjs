import { readFile } from "node:fs/promises";
import process from "node:process";

const serverPath = new URL("../api/generate-profile-bio.ts", import.meta.url);
const clientPath = new URL("../src/lib/profileBioAi.ts", import.meta.url);

const [server, client] = await Promise.all([
  readFile(serverPath, "utf8"),
  readFile(clientPath, "utf8"),
]);

const checks = [
  [server.includes("OPENAI_API_KEY"), "endpoint usa a variável server-side OPENAI_API_KEY"],
  [server.includes("https://api.openai.com/v1/responses"), "endpoint usa a Responses API"],
  [server.includes("store: false"), "respostas não são armazenadas pela integração"],
  [server.includes("json_schema"), "saída da IA é validada por JSON Schema"],
  [server.includes("RATE_LIMIT_MAX_REQUESTS"), "endpoint possui limitação de tentativas"],
  [server.includes("relationship_status"), "prompt inclui o relacionamento declarado"],
  [server.includes("children: childrenLabel"), "prompt inclui a informação declarada sobre filhos"],
  [client.includes("relationshipStatus"), "cliente aceita o relacionamento do formulário"],
  [client.includes("hasChildren"), "cliente aceita a informação sobre filhos"],
  [client.includes("/api/generate-profile-bio"), "cliente chama somente o endpoint interno"],
  [!client.includes("OPENAI_API_KEY"), "cliente não referencia a chave da OpenAI"],
  [!client.includes("api.openai.com"), "cliente não chama a OpenAI diretamente"],
  [!client.includes("declaredBirthDate"), "data de nascimento não é enviada para geração"],
  [!client.includes("whatsapp"), "WhatsApp não é enviado para geração"],
  [!client.includes("contactEmail"), "e-mail não é enviado para geração"],
];

const failed = checks.filter(([passed]) => !passed);
for (const [passed, label] of checks) {
  console.log(`${passed ? "PASS" : "FAIL"}: ${label}`);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} verificação(ões) da integração OpenAI falharam.`);
  process.exit(1);
}

console.log("\nContrato da integração OpenAI validado.");
