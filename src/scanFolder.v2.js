/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Folder Scanner for Symbolic Image Indexing    │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   A quiet companion in the forge—resilient, sovereign,     │
 * │   and always listening.                                    │
 * │                                                            │
 * │   Each image is a trace. Each folder, a breath.            │
 * │   This scanner walks slowly, writes deliberately,          │
 * │   and remembers with grace.                                │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';

// Define supported image extensions
const IMG_EXTENSIONS = /\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i;

// Default folder to scan if none is specified
const DEFAULT_FOLDER = path.resolve('./img');

// Folder to store output list files
const DATA_FOLDER = path.resolve('./data');

// Parse CLI argument: `npm run scan -- d:\archive\photos2025`
const userArgs = process.argv.slice(2);
const rawPath = userArgs[0];
const targetFolder = rawPath ? path.resolve(rawPath) : DEFAULT_FOLDER;

// Use folder name to name the output list file
const folderName = path.basename(targetFolder);
const outputFile = path.join(DATA_FOLDER, `${folderName}.lst`);

// Counters for reporting
let folderCount = 0;
let imageCount = 0;

/**
 * Recursively scans a directory for image files.
 * Writes each image path to the output stream immediately,
 * and resets memory after each folder to avoid heap pressure.
 */
function scanDirectory(dir, outputStream) {
  folderCount++;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subfolder
      scanDirectory(fullPath, outputStream);
    } else if (IMG_EXTENSIONS.test(entry.name)) {
      // Normalize path and write to output
      const normalizedPath = fullPath.replace(/\\/g, '/');
      outputStream.write(normalizedPath + '\n');
      imageCount++;
    }
  }
}

/**
 * Main entry point: prepares output stream,
 * initiates scan, and reports summary.
 */
function main() {
  const startTime = Date.now();

  // Validate target folder
  if (!fs.existsSync(targetFolder)) {
    console.error(`[ERROR] Folder not found: ${targetFolder}`);
    process.exit(1);
  }

  // Ensure data folder exists
  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
  }

  // Create output stream for writing image paths
  const outputStream = fs.createWriteStream(outputFile, { flags: 'w' });

  console.log(`🧭 Scanning folder: ${targetFolder}`);
  scanDirectory(targetFolder, outputStream);

  // Finalize and report
  outputStream.end(() => {
    const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Scan complete: ${imageCount} images found in ${folderCount} folders`);
    console.log(`📄 List saved to: ${outputFile}`);
    console.log(`⏱️ Time spent: ${durationSec} seconds`);
  });
}

/*
   main 
*/
main();
