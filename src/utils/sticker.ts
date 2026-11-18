import { readFile } from "node:fs/promises";
import decodeJpeg, { init as initJpeg } from "@jsquash/jpeg/decode.js";
import { decode as decodePng, init as initPng } from "@jsquash/png/decode.js";
import resize, { initResize } from "@jsquash/resize";
import decodeWebp, { init as initWebpDecode } from "@jsquash/webp/decode.js";
import encodeWebp, { init as initWebpEncode } from "@jsquash/webp/encode.js";

type StickerImageData = ImageData;

class ImageDataPolyfill implements ImageData {
  readonly data: Uint8ClampedArray<ArrayBuffer>;
  readonly width: number;
  readonly height: number;
  readonly colorSpace: PredefinedColorSpace = "srgb";

  constructor(
    data: Uint8ClampedArray<ArrayBuffer>,
    width: number,
    height: number,
  ) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

// jSquash's PNG decoder and resize module expect the browser ImageData global.
if (!("ImageData" in globalThis)) {
  Object.defineProperty(globalThis, "ImageData", {
    value: ImageDataPolyfill,
    configurable: true,
    writable: true,
  });
}

let wasmInitialization: Promise<void> | undefined;

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

async function initializeWasm(): Promise<void> {
  const [jpegWasm, pngWasm, resizeWasm, webpDecodeWasm, webpEncodeWasmSimd] =
    await Promise.all([
      readFile(
        new URL(
          "../../node_modules/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../../node_modules/@jsquash/png/codec/pkg/squoosh_png_bg.wasm",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../../node_modules/@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../../node_modules/@jsquash/webp/codec/dec/webp_dec.wasm",
          import.meta.url,
        ),
      ),
      readFile(
        new URL(
          "../../node_modules/@jsquash/webp/codec/enc/webp_enc_simd.wasm",
          import.meta.url,
        ),
      ),
    ]);

  const webpEncoderWasm = WebAssembly.validate(webpEncodeWasmSimd)
    ? webpEncodeWasmSimd
    : await readFile(
        new URL(
          "../../node_modules/@jsquash/webp/codec/enc/webp_enc.wasm",
          import.meta.url,
        ),
      );

  const jpegOptions = { wasmBinary: toArrayBuffer(jpegWasm) };
  const webpDecodeOptions = { wasmBinary: toArrayBuffer(webpDecodeWasm) };
  const webpEncodeOptions = { wasmBinary: toArrayBuffer(webpEncoderWasm) };

  await Promise.all([
    initJpeg(jpegOptions),
    initPng(pngWasm),
    initResize(resizeWasm),
    initWebpDecode(webpDecodeOptions),
    initWebpEncode(webpEncodeOptions),
  ]);
}

function getWasmInitialization(): Promise<void> {
  if (!wasmInitialization) {
    wasmInitialization = initializeWasm();
  }
  return wasmInitialization;
}

async function decodeImage(buffer: Buffer): Promise<StickerImageData> {
  const image = toArrayBuffer(buffer);

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return decodeJpeg(image);
  }

  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer.toString("ascii", 1, 4) === "PNG"
  ) {
    return decodePng(image);
  }

  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return decodeWebp(image);
  }

  throw new Error("Unsupported image format. Use a JPEG, PNG, or WebP image.");
}

export async function createSticker(
  buffer: Buffer,
  packname = "",
  author = "",
): Promise<Buffer> {
  await getWasmInitialization();
  const image = await decodeImage(buffer);
  const scale = Math.min(1, 512 / image.width, 512 / image.height);
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const resized = await resize(image, { width, height });
  const webp = Buffer.from(await encodeWebp(resized));

  const exifObj = {
    "sticker-pack-id": "com.wa.bot",
    "sticker-pack-name": packname || "",
    "sticker-pack-publisher": author || "",
  };

  const data = JSON.stringify(exifObj);

  const header = Buffer.from([
    0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
    0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
  ]);

  const dataBuf = Buffer.from(data, "utf8");
  header.writeUIntLE(dataBuf.length, 14, 4);
  const exifPayload = Buffer.concat([header, dataBuf]);

  const exifHeader = Buffer.alloc(8);
  exifHeader.write("EXIF", 0, "ascii");
  exifHeader.writeUInt32LE(exifPayload.length, 4);
  let exifChunk = Buffer.concat([exifHeader, exifPayload]);
  if (exifPayload.length % 2 === 1) {
    exifChunk = Buffer.concat([exifChunk, Buffer.from([0x00])]);
  }

  if (
    webp.length < 12 ||
    webp.toString("ascii", 0, 4) !== "RIFF" ||
    webp.toString("ascii", 8, 12) !== "WEBP"
  ) {
    throw new Error("WASM encoder returned an invalid WebP image.");
  }

  const riffHeader = webp.slice(0, 12);
  let body = webp.slice(12);
  let added = 0;

  const vp8xPos = body.indexOf(Buffer.from("VP8X", "ascii"));
  if (vp8xPos !== -1) {
    const flagsOffset = vp8xPos + 8;
    const orig = body.readUInt8(flagsOffset);
    const updated = orig | 0x10;
    body.writeUInt8(updated, flagsOffset);
  } else {
    const vp8xPayload = Buffer.alloc(10);
    vp8xPayload.writeUInt8(0x10, 0);
    vp8xPayload.writeUIntLE(width - 1, 4, 3);
    vp8xPayload.writeUIntLE(height - 1, 7, 3);

    const vp8xHeader = Buffer.alloc(8);
    vp8xHeader.write("VP8X", 0, "ascii");
    vp8xHeader.writeUInt32LE(vp8xPayload.length, 4);
    const vp8xChunk = Buffer.concat([vp8xHeader, vp8xPayload]);

    body = Buffer.concat([vp8xChunk, body]);
    added += vp8xChunk.length;
  }

  body = Buffer.concat([body, exifChunk]);
  added += exifChunk.length;

  const originalRiffSize = webp.readUInt32LE(4);
  const newRiffSize = originalRiffSize + added;

  const out = Buffer.concat([riffHeader, body]);
  out.writeUInt32LE(newRiffSize, 4);
  return out;
}
