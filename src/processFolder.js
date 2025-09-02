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
import { processImage } from './utils.js'; // External async function

// Parse CLI argument or default to "img"
const userArgs = Array.isArray(process.argv) ? process.argv.slice(2) : [];
const folderName = userArgs[0]?.trim() || 'img';

// Define paths for .lst, .sav, and .jsonl
const dataDir = path.resolve('./data');
const lstPath = path.join(dataDir, `${folderName}.lst`);
const savPath = path.join(dataDir, `${folderName}.sav`);
const jsonlPath = path.join(dataDir, `${folderName}.jsonl`);

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
 * Main processing logic:
 * - Handles three cases: fresh start, resume, already finished
 * - Calls processImage() for each image path
 * - Writes progress to .sav and output to .jsonl
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

  // Case 1: .sav missing → start fresh
  let startIndex = 0;

  // Case 3: .sav exists and has content → resume from saved entry
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

    try {
      const record = await processImage(imagePath); // External async call
      appendJsonl(record); // Write structured output
      console.log(`✅ Processed: ${record.imageName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to process ${imagePath}: ${err.message}`);
    }
  }

  // Clear .sav to mark completion
  writeSav('');
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log(`✅ Finished processing ${entries.length - startIndex} entries`);
  console.log(`📄 Output saved to: ${jsonlPath}`);
  console.log(`⏱️ Time spent: ${durationSec} seconds`);
}

/*
   main 
*/
main();
