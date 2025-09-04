import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve('.');
const BIN = path.join(ROOT, 'bin');
const MODELS = path.join(ROOT, 'models');

const EXECUTABLE = path.join(BIN, 'llama-mtmd-cli.exe');
const MODEL = path.join(MODELS, 'gemma-3-4b-it-Q6_K.gguf');
const MMPROJ = path.join(MODELS, 'mmproj-gemma-3-4b-it-f16.gguf');
const PROMPT = 'Describe the image in detail, using approximately 300 words. Structure your response into three paragraphs, separated by "[BREAK]". Begin your answer with "[START]".';

export async function processImage(imagePath) {
  return new Promise((resolve, reject) => {
    const imageName = path.basename(imagePath);
    const args = [
      '-m', MODEL,
      '--mmproj', MMPROJ,
      '--image', imagePath.replace(/\\/g, '/'),
      '--prompt', PROMPT
    ];

    //const cli = spawn(EXECUTABLE, args, { windowsHide: true });
    const cli = spawn("systeminfo", null, { windowsHide: true });

    let output = '';
    cli.stdout.setEncoding('utf8');
    cli.stdout.on('data', chunk => {
      output += chunk;
    });

    cli.stderr.setEncoding('utf8');
    cli.stderr.on('data', data => {
      console.error(`[STDERR] ${data}`);
    });

    cli.on('close', () => {
      try {
        const stats = fs.statSync(imagePath);
        const description = output.trim().replace(/\s+/g, ' ');
        const record = {
          imageName,
          fullPath: imagePath,
          fileFormat: path.extname(imageName).slice(1),
          fileSize: Math.round(stats.size / 1024),
          createdAt: stats.birthtime.toISOString(),
          description
        };
        resolve(record);
      } catch (err) {
        reject(new Error(`[ERROR] Failed to finalize record for ${imageName}: ${err.message}`));
      }
    });

    cli.on('error', err => {
      reject(new Error(`[ERROR] Failed to spawn process for ${imageName}: ${err.message}`));
    });
  });
}
