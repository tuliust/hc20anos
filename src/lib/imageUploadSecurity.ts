import {
  ImageSecurityError,
  inspectImageBytes,
  type ImageInspection,
  type SupportedImageMime,
} from "../../supabase/functions/_shared/image-security";

const DEFAULT_MAX_INPUT_BYTES = 10 * 1024 * 1024;
const DEFAULT_MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const DEFAULT_MAX_DIMENSION = 4096;
const DEFAULT_MAX_PIXELS = 16_000_000;

export interface PrepareImageOptions {
  maxInputBytes?: number;
  maxOutputBytes?: number;
  maxDimension?: number;
  maxPixels?: number;
  quality?: number;
  outputMimeType?: "image/webp" | "image/jpeg";
}

export interface PreparedImageUpload {
  file: File;
  inspection: ImageInspection;
  originalInspection: ImageInspection;
  originalSize: number;
  metadataRemoved: boolean;
}

const ERROR_MESSAGES: Record<string, string> = {
  image_too_small: "O arquivo não contém uma imagem válida.",
  image_too_large: "A imagem ultrapassa o limite permitido.",
  image_markup_detected: "O arquivo contém conteúdo executável ou marcação não permitida.",
  image_signature_invalid: "O conteúdo do arquivo não corresponde a uma imagem JPEG, PNG ou WebP válida.",
  image_structure_invalid: "A estrutura interna da imagem é inválida ou está corrompida.",
  image_trailing_data_detected: "O arquivo contém dados adicionais não permitidos depois da imagem.",
  image_dimensions_missing: "Não foi possível identificar as dimensões da imagem.",
  image_mime_mismatch: "O tipo informado pelo arquivo não corresponde ao conteúdo real da imagem.",
  image_dimensions_exceeded: "A imagem possui dimensões ou quantidade de pixels acima do limite permitido.",
  image_sensitive_metadata_detected: "A imagem ainda contém metadados sensíveis.",
};

function securityMessage(error: unknown) {
  if (error instanceof ImageSecurityError) return ERROR_MESSAGES[error.code] ?? error.message;
  return error instanceof Error ? error.message : "Não foi possível validar a imagem.";
}

function baseName(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[^a-z0-9_-]+/gi, "-").replace(/^-+|-+$/g, "") || "imagem";
}

function targetFileName(originalName: string, mimeType: SupportedImageMime) {
  const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
  return `${baseName(originalName)}-segura.${extension}`;
}

async function canvasBlob(canvas: HTMLCanvasElement, mimeType: "image/webp" | "image/jpeg", quality: number) {
  const primary = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, mimeType, quality));
  if (primary) return primary;
  const fallback = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
  if (!fallback) throw new Error("O navegador não conseguiu reprocessar a imagem.");
  return fallback;
}

function targetDimensions(width: number, height: number, maxDimension: number, maxPixels: number) {
  const dimensionScale = Math.min(1, maxDimension / width, maxDimension / height);
  const pixelScale = Math.min(1, Math.sqrt(maxPixels / (width * height)));
  const scale = Math.min(dimensionScale, pixelScale);
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export async function prepareImageForUpload(
  input: File,
  options: PrepareImageOptions = {},
): Promise<PreparedImageUpload> {
  const maxInputBytes = options.maxInputBytes ?? DEFAULT_MAX_INPUT_BYTES;
  const maxOutputBytes = options.maxOutputBytes ?? DEFAULT_MAX_OUTPUT_BYTES;
  const maxDimension = options.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const maxPixels = options.maxPixels ?? DEFAULT_MAX_PIXELS;
  const quality = Math.min(0.95, Math.max(0.65, options.quality ?? 0.88));
  const outputMimeType = options.outputMimeType ?? "image/webp";

  let originalInspection: ImageInspection;
  try {
    originalInspection = inspectImageBytes(new Uint8Array(await input.arrayBuffer()), {
      declaredMimeType: input.type,
      maxBytes: maxInputBytes,
      maxDimension: 12_000,
      maxPixels: 80_000_000,
      rejectSensitiveMetadata: false,
    });
  } catch (error) {
    throw new Error(securityMessage(error));
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input, { imageOrientation: "from-image" });
  } catch {
    throw new Error("O navegador não conseguiu decodificar esta imagem. Use JPEG, PNG ou WebP.");
  }

  try {
    const dimensions = targetDimensions(bitmap.width, bitmap.height, maxDimension, maxPixels);
    const canvas = document.createElement("canvas");
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const context = canvas.getContext("2d", { alpha: outputMimeType === "image/webp" });
    if (!context) throw new Error("O navegador não conseguiu preparar a imagem.");

    if (outputMimeType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, dimensions.width, dimensions.height);
    }
    context.drawImage(bitmap, 0, 0, dimensions.width, dimensions.height);

    const blob = await canvasBlob(canvas, outputMimeType, quality);
    const normalizedMime = (blob.type || outputMimeType).replace("image/jpg", "image/jpeg") as SupportedImageMime;
    const file = new File([blob], targetFileName(input.name, normalizedMime), {
      type: normalizedMime,
      lastModified: Date.now(),
    });

    let inspection: ImageInspection;
    try {
      inspection = inspectImageBytes(new Uint8Array(await file.arrayBuffer()), {
        declaredMimeType: file.type,
        maxBytes: maxOutputBytes,
        maxDimension,
        maxPixels,
        rejectSensitiveMetadata: true,
      });
    } catch (error) {
      throw new Error(securityMessage(error));
    }

    return {
      file,
      inspection,
      originalInspection,
      originalSize: input.size,
      metadataRemoved: originalInspection.hasSensitiveMetadata || input.size !== file.size,
    };
  } finally {
    bitmap.close();
  }
}
