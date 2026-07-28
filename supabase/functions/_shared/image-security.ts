export type SupportedImageMime = "image/jpeg" | "image/png" | "image/webp";
export type SupportedImageExtension = "jpg" | "png" | "webp";

export interface ImageInspection {
  mimeType: SupportedImageMime;
  extension: SupportedImageExtension;
  width: number;
  height: number;
  hasSensitiveMetadata: boolean;
}

export interface ImageInspectionOptions {
  declaredMimeType?: string | null;
  maxBytes?: number;
  maxDimension?: number;
  maxPixels?: number;
  rejectSensitiveMetadata?: boolean;
}

export class ImageSecurityError extends Error {
  constructor(public readonly code: string, message = code) {
    super(message);
    this.name = "ImageSecurityError";
  }
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAX_DEFAULT_BYTES = 10 * 1024 * 1024;
const MAX_DEFAULT_DIMENSION = 12_000;
const MAX_DEFAULT_PIXELS = 40_000_000;

function equalsAt(bytes: Uint8Array, values: number[], offset = 0) {
  return values.every((value, index) => bytes[offset + index] === value);
}

function ascii(bytes: Uint8Array, offset: number, length: number) {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function readUint24LE(bytes: Uint8Array, offset: number) {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function suspiciousMarkup(bytes: Uint8Array) {
  const sampleSize = Math.min(bytes.length, 8192);
  const prefix = bytes.subarray(0, sampleSize);
  const suffix = bytes.length > sampleSize ? bytes.subarray(bytes.length - sampleSize) : new Uint8Array();
  const text = `${new TextDecoder().decode(prefix)}\n${new TextDecoder().decode(suffix)}`.toLowerCase();
  return ["<script", "<html", "<!doctype", "<?xml", "<svg", "javascript:"].some(token => text.includes(token));
}

function inspectPng(bytes: Uint8Array): ImageInspection {
  if (!equalsAt(bytes, PNG_SIGNATURE)) throw new ImageSecurityError("image_signature_invalid");
  let offset = 8;
  let width = 0;
  let height = 0;
  let hasSensitiveMetadata = false;
  let sawIend = false;

  while (offset + 12 <= bytes.length) {
    const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
    const length = view.getUint32(0, false);
    const type = ascii(bytes, offset + 4, 4);
    const end = offset + 12 + length;
    if (end > bytes.length) throw new ImageSecurityError("image_structure_invalid");

    if (type === "IHDR") {
      if (length !== 13 || offset !== 8) throw new ImageSecurityError("image_structure_invalid");
      const dimensions = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 8);
      width = dimensions.getUint32(0, false);
      height = dimensions.getUint32(4, false);
    }
    if (["eXIf", "tEXt", "zTXt", "iTXt"].includes(type)) hasSensitiveMetadata = true;
    if (type === "IEND") {
      if (length !== 0 || end !== bytes.length) throw new ImageSecurityError("image_trailing_data_detected");
      sawIend = true;
      break;
    }
    offset = end;
  }

  if (!sawIend || width < 1 || height < 1) throw new ImageSecurityError("image_structure_invalid");
  return { mimeType: "image/png", extension: "png", width, height, hasSensitiveMetadata };
}

function inspectJpeg(bytes: Uint8Array): ImageInspection {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new ImageSecurityError("image_signature_invalid");
  if (bytes[bytes.length - 2] !== 0xff || bytes[bytes.length - 1] !== 0xd9) {
    throw new ImageSecurityError("image_trailing_data_detected");
  }

  let offset = 2;
  let width = 0;
  let height = 0;
  let hasSensitiveMetadata = false;

  while (offset + 4 <= bytes.length - 2) {
    if (bytes[offset] !== 0xff) throw new ImageSecurityError("image_structure_invalid");
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd9) break;
    if (marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > bytes.length) throw new ImageSecurityError("image_structure_invalid");
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) throw new ImageSecurityError("image_structure_invalid");

    if ([0xe1, 0xed, 0xfe].includes(marker)) hasSensitiveMetadata = true;
    const isSof = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isSof) {
      if (length < 7) throw new ImageSecurityError("image_structure_invalid");
      height = (bytes[offset + 3] << 8) | bytes[offset + 4];
      width = (bytes[offset + 5] << 8) | bytes[offset + 6];
    }
    offset += length;
  }

  if (width < 1 || height < 1) throw new ImageSecurityError("image_dimensions_missing");
  return { mimeType: "image/jpeg", extension: "jpg", width, height, hasSensitiveMetadata };
}

function inspectWebp(bytes: Uint8Array): ImageInspection {
  if (bytes.length < 20 || ascii(bytes, 0, 4) !== "RIFF" || ascii(bytes, 8, 4) !== "WEBP") {
    throw new ImageSecurityError("image_signature_invalid");
  }
  const declaredSize = new DataView(bytes.buffer, bytes.byteOffset + 4, 4).getUint32(0, true) + 8;
  if (declaredSize !== bytes.length) throw new ImageSecurityError("image_trailing_data_detected");

  let offset = 12;
  let width = 0;
  let height = 0;
  let hasSensitiveMetadata = false;

  while (offset + 8 <= bytes.length) {
    const type = ascii(bytes, offset, 4);
    const length = new DataView(bytes.buffer, bytes.byteOffset + offset + 4, 4).getUint32(0, true);
    const dataOffset = offset + 8;
    const end = dataOffset + length;
    if (end > bytes.length) throw new ImageSecurityError("image_structure_invalid");

    if (["EXIF", "XMP "].includes(type)) hasSensitiveMetadata = true;
    if (type === "VP8X" && length >= 10) {
      width = readUint24LE(bytes, dataOffset + 4) + 1;
      height = readUint24LE(bytes, dataOffset + 7) + 1;
    } else if (type === "VP8L" && length >= 5 && bytes[dataOffset] === 0x2f) {
      const b1 = bytes[dataOffset + 1];
      const b2 = bytes[dataOffset + 2];
      const b3 = bytes[dataOffset + 3];
      const b4 = bytes[dataOffset + 4];
      width = 1 + (((b2 & 0x3f) << 8) | b1);
      height = 1 + (((b4 & 0x0f) << 10) | (b3 << 2) | ((b2 & 0xc0) >> 6));
    } else if (type === "VP8 " && length >= 10 && bytes[dataOffset + 3] === 0x9d && bytes[dataOffset + 4] === 0x01 && bytes[dataOffset + 5] === 0x2a) {
      width = ((bytes[dataOffset + 7] << 8) | bytes[dataOffset + 6]) & 0x3fff;
      height = ((bytes[dataOffset + 9] << 8) | bytes[dataOffset + 8]) & 0x3fff;
    }

    offset = end + (length % 2);
  }

  if (offset !== bytes.length || width < 1 || height < 1) throw new ImageSecurityError("image_structure_invalid");
  return { mimeType: "image/webp", extension: "webp", width, height, hasSensitiveMetadata };
}

export function inspectImageBytes(bytes: Uint8Array, options: ImageInspectionOptions = {}): ImageInspection {
  const maxBytes = options.maxBytes ?? MAX_DEFAULT_BYTES;
  if (bytes.length < 32) throw new ImageSecurityError("image_too_small");
  if (bytes.length > maxBytes) throw new ImageSecurityError("image_too_large");
  if (suspiciousMarkup(bytes)) throw new ImageSecurityError("image_markup_detected");

  const inspection = equalsAt(bytes, PNG_SIGNATURE)
    ? inspectPng(bytes)
    : bytes[0] === 0xff && bytes[1] === 0xd8
      ? inspectJpeg(bytes)
      : ascii(bytes, 0, Math.min(4, bytes.length)) === "RIFF"
        ? inspectWebp(bytes)
        : (() => { throw new ImageSecurityError("image_signature_invalid"); })();

  const declared = String(options.declaredMimeType ?? "").toLowerCase().replace("image/jpg", "image/jpeg");
  if (declared && declared !== inspection.mimeType) throw new ImageSecurityError("image_mime_mismatch");

  const maxDimension = options.maxDimension ?? MAX_DEFAULT_DIMENSION;
  const maxPixels = options.maxPixels ?? MAX_DEFAULT_PIXELS;
  if (inspection.width > maxDimension || inspection.height > maxDimension || inspection.width * inspection.height > maxPixels) {
    throw new ImageSecurityError("image_dimensions_exceeded");
  }
  if ((options.rejectSensitiveMetadata ?? true) && inspection.hasSensitiveMetadata) {
    throw new ImageSecurityError("image_sensitive_metadata_detected");
  }
  return inspection;
}
