import sharp from "sharp";

export async function createSticker(
  buffer: Buffer,
  packname = "",
  author = "",
): Promise<Buffer> {
  const webp = await sharp(buffer)
    .resize({ width: 512, height: 512, fit: "inside" })
    .webp()
    .toBuffer();

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
    return webp;
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
    const meta = await sharp(webp).metadata();
    const width = (meta.width || 512) - 1;
    const height = (meta.height || 512) - 1;

    const vp8xPayload = Buffer.alloc(10);
    vp8xPayload.writeUInt8(0x10, 0);
    vp8xPayload.writeUIntLE(width, 4, 3);
    vp8xPayload.writeUIntLE(height, 7, 3);

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
