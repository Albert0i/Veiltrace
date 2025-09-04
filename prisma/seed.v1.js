/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Seed Script for ImageTrace                   │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross (Microsoft Copilot) │
 * │   Each record is a breath. Each update, a trace.           │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
// Prisma 
import { PrismaClient } from '../src/generated/prisma/index.js'; 

const prisma = new PrismaClient();
const jsonlPath = path.resolve('./data/img.jsonl');

async function seed() {
  const lines = fs.readFileSync(jsonlPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`📄\tSeeding ${lines.length} records from ${jsonlPath}`);

  for (const line of lines) {
    const record = JSON.parse(line);

    // Normalize timestamps
    //const updatedAt = new Date(Date.now());
    const createdAt = new Date(record.createdAt || Date.now());

    const miniature = await sharp(record.fullPath)
      .resize(256, 256, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();

    try {
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

      console.log(`✅\tUpserted: ${record.imageName}`);
    } catch (err) {
      console.error(`❌\tFailed for ${record.imageName}: ${err.message}`);
    }
  }

  await prisma.$disconnect();
  console.log(`🌿\tSeeding complete`);
}

/*
   main 
*/
seed();
