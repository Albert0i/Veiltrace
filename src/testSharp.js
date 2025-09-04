/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Sharp Test Program                            │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   This test resizes an image to 128×128 and saves output.  │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Define input and output paths
const inputPath = 'D:/RU/Veiltrace/img/character/movie/1969 Братья Карамазовы 卡拉馬佐夫兄弟 1.ENG[13-14-54].JPG'; // Replace with your test image
const outputPath = path.resolve('./miniature.jpg');

async function testSharp() {
  try {
    console.log(`🧪\tReading image: ${inputPath}`);

    const buffer = await sharp(inputPath)
      .resize(128, 128, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    fs.writeFileSync(outputPath, buffer);
    console.log(`✅\tMiniature saved to: ${outputPath}`);
  } catch (err) {
    console.error(`❌\tSharp test failed: ${err.message}`);
  }
}

testSharp();