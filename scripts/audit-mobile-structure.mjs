import { readFileSync } from 'node:fs';

const mobileCss = readFileSync(new URL('../src/mobile.css', import.meta.url), 'utf8');
const publicPages = readFileSync(new URL('../src/app/pages/public/PublicPages.tsx', import.meta.url), 'utf8');
const authPages = readFileSync(new URL('../src/app/pages/auth/AuthPages.tsx', import.meta.url), 'utf8');

const checks = [
  {
    label: 'Sem máscara global de overflow horizontal',
    ok: !/(?:html|body|\[data-app-root\])[^\{]*\{[^\}]*overflow-x\s*:\s*(?:hidden|clip)/gis.test(mobileCss),
  },
  {
    label: 'Scroll após salvar perfil direciona para alumni-area',
    ok: /setTimeout\(\(\) => navigate\("alumni-area"\),\s*900\)/.test(authPages),
  },
  {
    label: 'Dropdown de anos expõe aria-expanded',
    ok: /data-year-multiselect[\s\S]*?aria-expanded=\{yearDropdownOpen\}/.test(publicPages),
  },
  {
    label: 'Opção Todas as pessoas está dentro do dropdown',
    ok: /data-person-multiselect[\s\S]*?Todas as pessoas/.test(publicPages),
  },
];

const warnings = [];
if (/p:last-child/.test(mobileCss)) warnings.push('mobile.css ainda contém seletor estrutural p:last-child.');
if (!/data-person-multiselect[\s\S]*?aria-expanded=\{personDropdownOpen\}/.test(publicPages)) warnings.push('Dropdown de pessoas ainda não expõe aria-expanded.');
if (!/keydown|Escape/.test(publicPages.slice(publicPages.indexOf('export function PhotoWallPage'), publicPages.indexOf('// ─── PHOTO DETAIL')))) warnings.push('PhotoWallPage ainda não registra fechamento por Escape.');

console.log('Auditoria mobile estrutural:');
for (const check of checks) console.log(`- ${check.ok ? 'OK' : 'FALHA'}: ${check.label}`);
for (const warning of warnings) console.log(`- AVISO: ${warning}`);

if (checks.some(check => !check.ok)) process.exitCode = 1;
