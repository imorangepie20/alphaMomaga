import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = await readFile(new URL('../public/ChatGPT Image Sep 4, 2026, 11_49_33 AM.png', import.meta.url));
const sizes = [16, 32, 48];
const images = [];
for (const size of sizes) images.push(await sharp(source).resize(size, size, { fit: 'contain', background: '#ffffff00' }).png().toBuffer());
const header = Buffer.alloc(6 + sizes.length * 16);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
for (let index = 0; index < sizes.length; index++) {
  const entry = 6 + index * 16;
  header[entry] = sizes[index];
  header[entry + 1] = sizes[index];
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[index].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[index].length;
}
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), Buffer.concat([header, ...images]));
