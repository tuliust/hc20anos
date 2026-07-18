import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const assetsDir = path.resolve('dist/assets');
const warningLimitBytes = 500 * 1024;
const errorLimitBytes = 750 * 1024;

let entries;
try {
  entries = await readdir(assetsDir);
} catch {
  console.error('Bundle audit: dist/assets não existe. Execute npm run build primeiro.');
  process.exit(1);
}

const javascriptFiles = [];
for (const filename of entries) {
  if (!filename.endsWith('.js')) continue;
  const filePath = path.join(assetsDir, filename);
  const metadata = await stat(filePath);
  javascriptFiles.push({ filename, size: metadata.size });
}

javascriptFiles.sort((a, b) => b.size - a.size);

console.log('Bundle audit — arquivos JavaScript de produção:');
for (const file of javascriptFiles) {
  const kib = file.size / 1024;
  const marker = file.size > errorLimitBytes ? 'ERRO' : file.size > warningLimitBytes ? 'AVISO' : 'OK';
  console.log(`- ${marker}: ${file.filename} — ${kib.toFixed(2)} KiB`);
}

const oversized = javascriptFiles.filter(file => file.size > errorLimitBytes);
if (oversized.length > 0) {
  console.error(`Bundle audit falhou: ${oversized.length} arquivo(s) excedem 750 KiB.`);
  process.exit(1);
}

if (javascriptFiles.some(file => file.size > warningLimitBytes)) {
  console.warn('Bundle audit passou com aviso: há arquivos acima de 500 KiB.');
} else {
  console.log('Bundle audit passou sem arquivos JavaScript acima de 500 KiB.');
}
