/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Buffered Folder Scanner                       │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   This scanner walks first, then writes.                   │
 * │   Each image is a breath. Each output, a trace.            │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';

const IMG_EXTENSIONS = /\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i;
const DEFAULT_FOLDER = path.resolve('./img');
const DATA_FOLDER = path.resolve('./data');

const userArgs = process.argv.slice(2);
const rawPath = userArgs[0];
const compareDate = userArgs[1] || "1900-01-01"; 
const targetFolder = rawPath ? path.resolve(rawPath) : DEFAULT_FOLDER;
const folderName = path.basename(targetFolder);
const outputFile = path.join(DATA_FOLDER, `${folderName}.lst`);

let folderCount = 0;
let imageCount = 0;
const imagePaths = []; // Buffer for image paths

/**
 * Recursively walks through folders and buffers image paths
 */
function scanDirectory(dir) {
  folderCount++;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (IMG_EXTENSIONS.test(entry.name)) {
      const stats = fs.statSync(fullPath);
      if (stats.birthtime.toISOString() >= compareDate)
        imagePaths.push(fullPath);
    }
  }
}

/**
 * Writes buffered image paths to output file
 */
function writeOutput() {
  const outputStream = fs.createWriteStream(outputFile, { flags: 'w' });

  for (const fullPath of imagePaths) {
    const normalizedPath = fullPath.replace(/\\/g, '/');
    outputStream.write(normalizedPath + '\n');
    imageCount++;
  }

  outputStream.end();
}

/**
 * Main entry point
 */
function main() {
  const startTime = Date.now();

  if (!fs.existsSync(targetFolder)) {
    console.error(`[ERROR] Folder not found: ${targetFolder}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
  }

  console.log(`🧭 Scanning folder: ${targetFolder}, with creation date >= ${compareDate}`);
  scanDirectory(targetFolder);
  writeOutput();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Scan complete: ${imageCount} images found in ${folderCount} folders`);
  console.log(`📄 List saved to: ${outputFile}`);
  console.log(`⏱️ Time spent: ${durationSec} seconds`);
}

/*
   main
*/
main();
