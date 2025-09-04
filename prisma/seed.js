/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Streamed Seed Script for ImageTrace           │
 * │                                                            │
 * │   Reads .jsonl line by line, upserts into MariaDB          │
 * │   Crafted by Iong, guided by Albatross                     │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import readline from 'readline';
import path from 'path';
import sharp from 'sharp';
// Prisma 
import { PrismaClient } from '../src/generated/prisma/index.js'; 

const DEFAULT_JSNOL = './data/img.jsonl'  // Default jsonl to seed 
const DEFAULT_MINIATURE = 128             // Size of miniature

const prisma = new PrismaClient();
const jsonlPath = path.resolve(DEFAULT_JSNOL);

async function seed() {
  const stream = fs.createReadStream(jsonlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);

      // Normalize timestamps
      const createdAt = new Date(record.createdAt || Date.now());

      const miniature = await sharp(record.fullPath)
        .resize(DEFAULT_MINIATURE, DEFAULT_MINIATURE, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

      await prisma.imageTrace.upsert({
        where: { fullPath: record.fullPath },
        update: {
          updateIdent: { increment: 1 },
        },
        create: {
          imageName: record.imageName,
          fullPath: record.fullPath,
          fileFormat: record.fileFormat,
          fileSize: record.fileSizeKB,
          meta: record.meta || '',
          description: record.description || '',
          miniature,
          createdAt
        }
      });

      count++;
      console.log(`✅ Upserted: ${record.imageName}`);
    } catch (err) {
      console.error(`❌ Failed on line ${count + 1}: ${err.message}`);
    }
  }

  await prisma.$disconnect();
  console.log(`🌿 Seeding complete — ${count} records processed`);
}

/*
   main 
*/
seed();
