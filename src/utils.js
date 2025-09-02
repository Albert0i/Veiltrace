/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Image Description Wrapper                     │
 * │                                                            │
 * │   Function: processImage(imagePath)                        │
 * │   Wraps llama-mtmd-cli.exe to extract symbolic description │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   A quiet companion in the forge—resilient, poetic,        │
 * │   and always listening.                                    │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Define paths and prompt
const ROOT = path.resolve('.');
const BIN = path.join(ROOT, 'bin');
const MODELS = path.join(ROOT, 'models');

const EXECUTABLE = path.join(BIN, 'llama-mtmd-cli.exe');
const MODEL = path.join(MODELS, 'gemma-3-4b-it-Q6_K.gguf');
const MMPROJ = path.join(MODELS, 'mmproj-gemma-3-4b-it-f16.gguf');

const PROMPT = 'Describe the image in detail, using approximately 300 words. Structure your response into not more than four paragraphs, separated by "[BREAK]". Begin your answer with "[START]".';

/**
 * Asynchronously processes a single image by invoking llama-mtmd-cli.exe.
 * Captures stdout as description and returns a structured record.
 *
 * @param {string} imagePath - Full path to the image file
 * @returns {Promise<object>} - { imageName, fullPath, fileFormat, fileSizeKB, createdAt, description }
 */
export async function processImage(imagePath) {
  return new Promise((resolve, reject) => {
    const imageName = path.basename(imagePath);
    const args = [
      '-m', MODEL,
      '--mmproj', MMPROJ,
      '--image', imagePath.replace(/\\/g, '/'),
      '--prompt', PROMPT
    ];

    const cli = spawn(EXECUTABLE, args, { windowsHide: true });

    let stdout = '';
    let stderr = '';

    // Capture standard output
    cli.stdout.setEncoding('utf8');
    cli.stdout.on('data', chunk => {
      stdout += chunk;
    });

    // Capture standard error
    cli.stderr.setEncoding('utf8');
    cli.stderr.on('data', chunk => {
      stderr += chunk;
    });

    // Handle spawn error
    cli.on('error', err => {
      reject(new Error(`[ERROR] Failed to spawn process for ${imageName}: ${err.message}`));
    });

    // Finalize when process exits
    cli.on('close', code => {
      console.log(`[INFO] CLI exited with code ${code}`);
      if (stderr) console.error(`[STDERR]\n${stderr}`);
      console.log(`[INFO] STDOUT:\n${stdout}`);

      try {
        const stats = fs.statSync(imagePath);
        const description = stdout.trim().replace(/\s+/g, ' ');
        const record = {
          imageName,
          fullPath: imagePath,
          fileFormat: path.extname(imageName).slice(1),
          fileSizeKB: Math.round(stats.size / 1024),
          createdAt: stats.birthtime.toISOString(),
          description: description || '[EMPTY OUTPUT]'
        };
        resolve(record);
      } catch (err) {
        reject(new Error(`[ERROR] Failed to finalize record for ${imageName}: ${err.message}`));
      }
    });
  });
}
