// Executes against the byte-inspection module shared by the browser and Edge Function.
import assert from "node:assert/strict";
import test from "node:test";
import { ImageSecurityError, inspectImageBytes } from "../../supabase/functions/_shared/image-security.ts";

const PNG = Uint8Array.from(Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
));

function metadataPng() {
  const iendOffset = PNG.length - 12;
  const chunk = new Uint8Array(16);
  new DataView(chunk.buffer).setUint32(0, 4, false);
  chunk.set(Buffer.from("tEXt"), 4);
  chunk.set(Buffer.from("EXIF"), 8);
  return new Uint8Array([...PNG.slice(0, iendOffset), ...chunk, ...PNG.slice(iendOffset)]);
}

function hugePng() {
  const copy = PNG.slice();
  const view = new DataView(copy.buffer, copy.byteOffset + 16, 8);
  view.setUint32(0, 50000, false);
  view.setUint32(4, 50000, false);
  return copy;
}

function expectCode(callback: () => unknown, code: string) {
  assert.throws(callback, error => error instanceof ImageSecurityError && error.code === code);
}

test("aceita PNG real e identifica dimensões", () => {
  const result = inspectImageBytes(PNG, { declaredMimeType: "image/png" });
  assert.equal(result.mimeType, "image/png");
  assert.equal(result.width, 1);
  assert.equal(result.height, 1);
  assert.equal(result.hasSensitiveMetadata, false);
});

test("rejeita MIME divergente da assinatura", () => {
  expectCode(() => inspectImageBytes(PNG, { declaredMimeType: "image/jpeg" }), "image_mime_mismatch");
});

test("rejeita EXIF e metadados textuais", () => {
  expectCode(() => inspectImageBytes(metadataPng(), { declaredMimeType: "image/png" }), "image_sensitive_metadata_detected");
  assert.equal(inspectImageBytes(metadataPng(), { rejectSensitiveMetadata: false }).hasSensitiveMetadata, true);
});

test("rejeita arquivo com dados anexados depois da imagem", () => {
  const polyglot = new Uint8Array([...PNG, ...Buffer.from("<script>alert(1)</script>")]);
  expectCode(() => inspectImageBytes(polyglot, { declaredMimeType: "image/png" }), "image_markup_detected");
});

test("rejeita SVG ou HTML disfarçado de imagem", () => {
  const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
  expectCode(() => inspectImageBytes(svg, { declaredMimeType: "image/png" }), "image_markup_detected");
});

test("rejeita dimensões e quantidade de pixels abusivas", () => {
  expectCode(() => inspectImageBytes(hugePng(), { declaredMimeType: "image/png" }), "image_dimensions_exceeded");
});

test("rejeita arquivo acima do limite", () => {
  expectCode(() => inspectImageBytes(PNG, { maxBytes: PNG.length - 1 }), "image_too_large");
});
