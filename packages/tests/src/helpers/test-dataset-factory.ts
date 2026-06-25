import JSZip from "jszip";
import { deflateRawSync } from "zlib";

// ── PNG Generator ───────────────────────────────────────────────────────────

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

/** Build a PNG chunk: length(4) + type(4) + data(N) + crc32(4). */
function pngChunk(type: string, data: Buffer): Buffer {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcInput = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeInt32BE(crc32(crcInput), 0);

  return Buffer.concat([length, typeBuffer, data, crc]);
}

/** CRC-32 lookup table and computation. */
const CRC_TABLE = new Int32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c;
}

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ -1;
}

/**
 * Create a minimal valid 1×1 white PNG image (~68 bytes).
 * Used as a placeholder in test dataset ZIPs.
 */
export function createTinyPng(): Buffer {
  // IHDR: 1×1, 8-bit RGB
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(1, 0);  // width
  ihdr.writeUInt32BE(1, 4);  // height
  ihdr[8] = 8;               // bit depth
  ihdr[9] = 2;               // color type: RGB

  // IDAT: single white pixel (filter=0, R=255, G=255, B=255)
  const raw = Buffer.from([0, 255, 255, 255]);
  const compressed = deflateRawSync(raw);
  const idat = Buffer.concat([
    Buffer.from([0x78, 0x01]), // zlib header: CMF + FLG
    compressed,
  ]);

  return Buffer.concat([
    PNG_SIGNATURE,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", idat),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── COCO ZIP ────────────────────────────────────────────────────────────────

/**
 * Create a minimal valid COCO-format dataset ZIP in memory.
 *
 * Structure:
 * ```
 * train/
 *   img_001.jpg
 *   _annotations.coco.json
 * test/
 *   img_001.jpg
 *   _annotations.coco.json
 * val/
 *   img_001.jpg
 *   _annotations.coco.json
 * ```
 *
 * Each split contains 1 image with 1 annotation per class.
 *
 * @param classNames — label names (e.g. ["apple", "banana"])
 */
export async function createCocoZip(classNames: string[]): Promise<Buffer> {
  const zip = new JSZip();
  const png = createTinyPng();

  const categories = classNames.map((name, idx) => ({
    id: idx + 1,
    name,
    supercategory: "none",
  }));

  const splits = ["train", "test", "val"];

  for (const split of splits) {
    zip.file(`${split}/img_001.jpg`, png);

    const annotations = classNames.map((_, idx) => ({
      id: idx + 1,
      image_id: 1,
      category_id: idx + 1,
      bbox: [10, 10, 50, 50],
      area: 2500,
      iscrowd: 0,
      segmentation: [[10, 10, 60, 10, 60, 60, 10, 60]],
    }));

    const coco = {
      images: [
        {
          id: 1,
          file_name: "img_001.jpg",
          width: 640,
          height: 480,
        },
      ],
      annotations,
      categories,
    };

    zip.file(`${split}/_annotations.coco.json`, JSON.stringify(coco, null, 2));
  }

  return zip.generateAsync({ type: "nodebuffer" });
}

// ── YOLO ZIP ────────────────────────────────────────────────────────────────

/**
 * Create a minimal valid YOLO-format dataset ZIP in memory.
 *
 * Structure:
 * ```
 * train/
 *   images/img_001.jpg
 *   labels/img_001.txt
 * test/
 *   images/img_001.jpg
 *   labels/img_001.txt
 * val/
 *   images/img_001.jpg
 *   labels/img_001.txt
 * data.yaml
 * ```
 *
 * Each split contains 1 image with 1 annotation per class.
 * YOLO label format: `<class_id> <x_center> <y_center> <width> <height>`
 * (all normalised 0–1).
 *
 * @param classNames — label names (e.g. ["apple", "banana"])
 */
export async function createYoloZip(classNames: string[]): Promise<Buffer> {
  const zip = new JSZip();
  const png = createTinyPng();

  const splits = ["train", "test", "val"];

  for (const split of splits) {
    zip.file(`${split}/images/img_001.jpg`, png);

    // One annotation per class: class_id x_center y_center width height
    const labels = classNames
      .map((_, idx) => `${idx} 0.5 0.5 0.3 0.3`)
      .join("\n");
    zip.file(`${split}/labels/img_001.txt`, labels);
  }

  // data.yaml
  const yaml = [
    `nc: ${classNames.length}`,
    `names: [${classNames.join(", ")}]`,
    "",
  ].join("\n");
  zip.file("data.yaml", yaml);

  return zip.generateAsync({ type: "nodebuffer" });
}
