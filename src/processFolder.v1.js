import fs from 'fs';
import path from 'path';

// Get folder name from CLI or default to "img"
const userArgs = Array.isArray(process.argv) ? process.argv.slice(2) : [];
const folderName = userArgs[0]?.trim() || 'img';

const dataDir = path.resolve('./data');
const lstPath = path.join(dataDir, `${folderName}.lst`);
const savPath = path.join(dataDir, `${folderName}.sav`);

// Read non-empty lines from .lst
function readList(filePath) {
  return fs.readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line !== '');
}

// Write content to .sav
function writeSav(content) {
  fs.writeFileSync(savPath, content, 'utf8');
}

// Placeholder async process function
async function process(entry) {
  console.log(`🔧 Processing: ${entry}`);
  // Simulate async work
  await new Promise(resolve => setTimeout(resolve, 10000));
}

// Main logic
async function main() {
  const startTime = Date.now();

  if (!fs.existsSync(lstPath)) {
    console.error(`[ERROR] Missing list file: ${lstPath}`);
    process.exit(1);
  }

  const entries = readList(lstPath);
  const savExists = fs.existsSync(savPath);
  const savContent = savExists ? fs.readFileSync(savPath, 'utf8').trim() : '';

  // Case 2: .sav exists and is empty → finished
  if (savExists && savContent === '') {
    console.log(`✅ Processing already complete for "${folderName}"`);
    return;
  }

  // Case 1: .lst exists, .sav missing → start fresh
  if (!savExists) {
    console.log(`🧭 Starting fresh scan of "${folderName}"`);
    for (const entry of entries) {
      writeSav(entry);
      await process(entry);
    }
    writeSav('');
    console.log(`✅ Finished processing ${entries.length} entries`);
    return;
  }

  // Case 3: .lst and .sav exist, .sav has content → resume
  console.log(`⏳ Resuming interrupted scan of "${folderName}"`);
  const startIndex = entries.findIndex(line => line === savContent);

  if (startIndex === -1) {
    console.error(`[ERROR] Entry in .sav not found in .lst: "${savContent}"`);
    process.exit(1);
  }

  for (let i = startIndex; i < entries.length; i++) {
    writeSav(entries[i]);
    await process(entries[i]);
  }

  writeSav('');
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`✅ Finished resumed processing from index ${startIndex}`);
  console.log(`⏱️ Time spent: ${durationSec} seconds`);
}

main();