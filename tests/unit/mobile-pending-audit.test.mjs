import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const authPages = readFileSync(new URL('../../src/app/pages/auth/AuthPages.tsx', import.meta.url), 'utf8');
const app = readFileSync(new URL('../../src/app/App.tsx', import.meta.url), 'utf8');
const publicPages = readFileSync(new URL('../../src/app/pages/public/PublicPages.tsx', import.meta.url), 'utf8');
const mobileCss = readFileSync(new URL('../../src/mobile.css', import.meta.url), 'utf8');

test('salvar perfil redireciona para a área do ex-aluno', () => {
  assert.match(authPages, /setTimeout\(\(\) => navigate\("alumni-area"\),\s*900\)/);
});

test('ScrollToTop global reage ao pathname', () => {
  assert.match(app, /function ScrollToTop/);
  assert.match(app, /\[pathname\]/);
  assert.match(app, /window\.scrollTo\(\{\s*top:\s*0/);
});

test('multiselect de anos expõe aria-expanded', () => {
  assert.match(publicPages, /data-year-multiselect[\s\S]*?aria-expanded=\{yearDropdownOpen\}/);
});

test('multiselect de pessoas expõe aria-expanded', () => {
  assert.match(publicPages, /data-person-multiselect[\s\S]*?aria-expanded=\{personDropdownOpen\}/);
});

test('CSS mobile não mascara overflow horizontal globalmente', () => {
  const forbidden = /(?:html|body|\[data-app-root\])[^\{]*\{[^\}]*overflow-x\s*:\s*(?:hidden|clip)/gis;
  assert.doesNotMatch(mobileCss, forbidden);
});
