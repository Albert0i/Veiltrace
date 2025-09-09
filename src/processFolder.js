/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Image Processor for Symbolic Description      │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   Each image is a breath. Each record, a trace.            │
 * │   This processor walks with memory, resumes with grace.    │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
//import { processImage } from './utils.js'; // External async function
import { processImage } from './utils.js'; // External async function

// Parse CLI argument or default to "img"
const folderName = process.argv[2]?.trim() || 'img';

// Define paths for .lst, .sav, .jsonl, and .fail.lst
const dataDir = path.resolve('./data');
const lstPath = path.join(dataDir, `${folderName}.lst`);
const savPath = path.join(dataDir, `${folderName}.sav`);
const jsonlPath = path.join(dataDir, `${folderName}.jsonl`);
const failListPath = path.join(dataDir, `${folderName}.fail.lst`);

/**
 * Reads non-empty lines from .lst file
 */
function readList(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '');
}

/**
 * Writes current image path to .sav (used for resume logic)
 */
function writeSav(content) {
  fs.writeFileSync(savPath, content, 'utf8');
}

/**
 * Appends structured JSON record to .jsonl file
 */
function appendJsonl(record) {
  fs.appendFileSync(jsonlPath, JSON.stringify(record) + '\n', 'utf8');
}

/**
 * Checks if a string contains only ASCII characters
 */
function isAsciiSafe(str) {
  return /^[\x00-\x7F]*$/.test(str);
}

/**
 * Copies image to temp folder if path is not ASCII-safe
 */
function getSafePath(imagePath) {
  if (isAsciiSafe(imagePath)) return imagePath;

  //const tempPath = "C:\\Users\\alber\\AppData\\Local\\Temp\\veiltrace.jpg"
  const tempPath = path.join(os.tmpdir(), 'veiltrace.' + 
                   path.extname(imagePath).slice(1));
  console.log(`📁 \tCopy ${imagePath} → ${tempPath}`);
  fs.copyFileSync(imagePath, tempPath);
  return tempPath;
}

/**
 * Main processing logic
 */
async function main() {
  const startTime = Date.now();

  // Validate .lst file exists
  if (!fs.existsSync(lstPath)) {
    console.error(`[ERROR] Missing list file: ${lstPath}`);
    process.exit(1);
  }

  const entries = readList(lstPath);
  const savExists = fs.existsSync(savPath);
  const savContent = savExists ? fs.readFileSync(savPath, 'utf8').trim() : '';

  // Case 2: .sav exists and is empty → already finished
  if (savExists && savContent === '') {
    console.log(`✅ Processing already complete for "${folderName}"`);
    return;
  }

  // Case 1: .lst exists, .sav missing → start fresh
  let startIndex = 0;

  // Case 3: .lst and .sav exist, .sav has content → resume
  if (savExists && savContent !== '') {
    startIndex = entries.findIndex(line => line === savContent);

    if (startIndex === -1) {
      console.error(`[ERROR] Entry in .sav not found in .lst: "${savContent}"`);
      process.exit(1);
    }
  }

  console.log(`🔄 Starting processing from index ${startIndex} (${entries[startIndex]})`);

  // Process each image from startIndex onward
  for (let i = startIndex; i < entries.length; i++) {
    const imagePath = entries[i];
    writeSav(imagePath); // Save progress

    const safePath = getSafePath(imagePath); // Use fallback if needed

    try {
      const record = await processImage(safePath); // External async call
      const description = record.description?.trim() || '';
      //const isValid = description.length > 100 || description.includes('[START]');
      const isValid = description.length > 100;

      if (!isValid) {
        record.description = '[FAILED TO GENERATE DESCRIPTION]';
        fs.appendFileSync(failListPath, imagePath + '\n');
      }

      // Change back to original image name and full path 
      if (safePath !== imagePath && fs.existsSync(safePath)) {
        record.imageName = path.basename(imagePath);
        record.fullPath = imagePath;
      }
      appendJsonl(record); // Write structured output
      console.log(`✅ Processed: ${record.imageName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to process ${imagePath}: ${err.message}`);
      fs.appendFileSync(failListPath, imagePath + '\n');
    } finally {
      // Clean up temp file if used
      if (safePath !== imagePath && fs.existsSync(safePath)) {
        try {
          console.log(`📁 \tRemove ${safePath}`);
          fs.unlinkSync(safePath);
        } catch (e) {
          console.warn(`[WARN] Failed to delete temp file: ${safePath}`);
        }
      }
    }
  }

  // Clear .sav to mark completion
  writeSav('');
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ Finished processing ${entries.length - startIndex} entries`);
  console.log(`📄 Output saved to: ${jsonlPath}`);
  console.log(`📄 Failures logged to: ${failListPath}`);
  console.log(`⏱️ Time spent: ${durationSec} seconds`);
}

/*
   main
*/
main();
