function replaceRequired(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`[photo-upload-year-input] Trecho não encontrado: ${label}`);
  const second = source.indexOf(search, first + search.length);
  if (second >= 0) throw new Error(`[photo-upload-year-input] Trecho duplicado: ${label}`);
  return source.slice(0, first) + replacement + source.slice(first + search.length);
}

function transformApp(source) {
  let code = source;

  code = replaceRequired(
    code,
    `    if (!file)       { setUploadError("Selecione uma foto antes de enviar."); return; }\n    if (!caption)    { setUploadError("Adicione uma legenda para a foto."); return; }\n    if (!authorized) { setUploadError("Confirme que você tem o direito de compartilhar esta imagem."); return; }`,
    `    if (!file)       { setUploadError("Selecione uma foto antes de enviar."); return; }\n    if (!caption)    { setUploadError("Adicione uma legenda para a foto."); return; }\n    if (!/^\\d{4}$/.test(year)) { setUploadError("Digite o ano com quatro dígitos (YYYY)."); return; }\n    if (!authorized) { setUploadError("Confirme que você tem o direito de compartilhar esta imagem."); return; }`,
    "validação do ano da foto",
  );

  code = replaceRequired(
    code,
    `              <select value={year} onChange={e => setYear(e.target.value)}\n                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]">\n                {["2003","2004","2005","2006","2007"].map(y => <option key={y} value={y}>{y}</option>)}\n              </select>`,
    `              <input\n                type="text"\n                inputMode="numeric"\n                autoComplete="off"\n                pattern="[0-9]{4}"\n                maxLength={4}\n                aria-label="Ano aproximado no formato YYYY"\n                placeholder="YYYY"\n                value={year}\n                onChange={e => setYear(e.target.value.replace(/\\D/g, "").slice(0, 4))}\n                className="w-full bg-[#1a2e1a] border border-[#2d6a4f]/30 text-[#f0ebe0] placeholder:text-[#3a4a3a] py-4 px-4 text-sm focus:outline-none focus:border-[#2d6a4f]"\n              />`,
    "campo digitável de ano da foto",
  );

  return code;
}

export function photoUploadYearInputTransform() {
  return {
    name: "photo-upload-year-input-transform",
    enforce: "pre",
    transform(source, id) {
      const normalizedId = id.replaceAll("\\", "/").split("?")[0];
      if (normalizedId.endsWith("/src/app/App.tsx")) return { code: transformApp(source), map: null };
      return null;
    },
  };
}
