export function normalizeModuleId(id) {
  return id.replaceAll("\\", "/").split("?")[0];
}

export function replaceRequired(source, search, replacement, label, scope) {
  const first = source.indexOf(search);
  if (first < 0) {
    throw new Error(`[${scope}] Trecho não encontrado: ${label}`);
  }

  const second = source.indexOf(search, first + search.length);
  if (second >= 0) {
    throw new Error(`[${scope}] Trecho duplicado: ${label}`);
  }

  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

export function replaceRangeRequired(source, start, end, replacement, label, scope) {
  const first = source.indexOf(start);
  if (first < 0) {
    throw new Error(`[${scope}] Início não encontrado: ${label}`);
  }

  const second = source.indexOf(start, first + start.length);
  if (second >= 0) {
    throw new Error(`[${scope}] Início duplicado: ${label}`);
  }

  const endIndex = source.indexOf(end, first + start.length);
  if (endIndex < 0) {
    throw new Error(`[${scope}] Fim não encontrado: ${label}`);
  }

  return source.slice(0, first) + replacement + source.slice(endIndex);
}
