
import os from 'os';
import path from 'path';
import fs from 'fs';

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

  const tempPath = path.join(os.tmpdir(), 'veiltrace.jpg');
  fs.copyFileSync(imagePath, tempPath);
  return tempPath;
}

//const fullPath = 'D:/RU/Veiltrace/img/character/movie/1969 Братья Карамазовы 卡拉馬佐夫兄弟 1.ENG[13-14-54].JPG'; 
//const fullPath = 'D:/RU/Veiltrace/img/494676074_692523446713565_5302889079689387211_n.jpg'; 
const fullPath = 'D:/Pictures20250830/Photos/相片 101.png'; 

console.log(getSafePath(fullPath))

/*
  if (!isAsciiSafe(imagePath)) {
    fs.unlinkSync(tempPath); // Remove temp file
  }
*/