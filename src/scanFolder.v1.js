import fs from 'fs';
import path from 'path';

const IMG_EXTENSIONS = /\.(jpg|jpeg|png|webp|bmp|gif|tiff)$/i;
const DEFAULT_FOLDER = path.resolve('./img');
const DATA_FOLDER = path.resolve('./data');

// Parse CLI argument: `npm run scan -- d:\tmp`
const userArgs = process.argv.slice(2);
const rawPath = userArgs[0];
const targetFolder = rawPath ? path.resolve(rawPath) : DEFAULT_FOLDER;
const folderName = path.basename(targetFolder);
const outputFile = path.join(DATA_FOLDER, `${folderName}.lst`);

const imagePaths = [];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDirectory(fullPath);
    } else if (IMG_EXTENSIONS.test(entry.name)) {
      imagePaths.push(fullPath.replace(/\\/g, '/'));
    }
  }
}

function main() {
  const startTime = Date.now();

  if (!fs.existsSync(targetFolder)) {
    console.error(`[ERROR] Folder not found: ${targetFolder}`);
    process.exit(1);
  }

  if (!fs.existsSync(DATA_FOLDER)) {
    fs.mkdirSync(DATA_FOLDER);
  }

  console.log(`🧭 Scanning folder: ${targetFolder}`);
  scanDirectory(targetFolder);

  fs.writeFileSync(outputFile, imagePaths.join('\n'), 'utf8');

  const endTime = Date.now();
  const durationSec = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`✅ Scan complete: ${imagePaths.length} images found`);
  console.log(`📄 List saved to: ${outputFile}`);
  console.log(`⏱️ Time spent: ${durationSec} seconds`);
}

main();