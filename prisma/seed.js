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

// node-llama-cpp 
import {fileURLToPath} from "url";
import {getLlama} from "node-llama-cpp";

// node-llama-cpp 
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "..", "models", process.env.MODEL_NAME)
});
const context = await model.createEmbeddingContext();

// Prisma 
import { PrismaClient } from '../src/generated/prisma/index.js'; 
import { splitDescription } from '../src/utils.js'

const DEFAULT_JSNOL = './data/img.jsonl'  // Default jsonl to seed 
const DEFAULT_MINIATURE = 128             // Size of miniature

const prisma = new PrismaClient();
const jsonlPath = path.resolve(process.argv[2] || DEFAULT_JSNOL);

async function seed() {
  const stream = fs.createReadStream(jsonlPath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;

  console.log('Seeding from', jsonlPath);
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);

      // Normalize timestamps      
      const createdAt = new Date(record.createdAt || Date.now());
      //const indexedAt = new Date(Date.now());
      const indexedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const { meta, content } = splitDescription(record.description, '\n\n');

      console.log('content.length =', content.length)
      const { vector } = await context.getEmbeddingFor(content);  

      const miniature = await sharp(record.fullPath)
        .resize(DEFAULT_MINIATURE, DEFAULT_MINIATURE, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer();

        await prisma.$executeRaw`
                INSERT INTO imagetrace ( imageName, fullPath, fileFormat, fileSize, meta, 
                                         description, embedding, miniature, indexedAt, createdAt ) 
                  VALUES( ${record.imageName}, ${record.fullPath}, ${record.fileFormat.toUpperCase()}, ${record.fileSizeKB}, ${meta}, 
                          ${content}, VEC_FromText(${JSON.stringify(vector)}), null, ${indexedAt}, ${createdAt} ) 
                  ON DUPLICATE KEY 
                  UPDATE updateIdent = updateIdent + 1;
                `;  
      // await prisma.imagetrace.upsert({
      //   where: { fullPath: record.fullPath },
      //   update: {
      //     updateIdent: { increment: 1 },
      //   },
      //   create: {
      //     imageName: record.imageName,
      //     fullPath: record.fullPath,
      //     fileFormat: record.fileFormat.toUpperCase(),
      //     fileSize: record.fileSizeKB,
      //     meta, 
      //     description: content,

      //     miniature,
      //     indexedAt: indexedAt.toISOString(),
      //     createdAt: createdAt.toISOString()
      //   }
      // });

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

/*
      await prisma.imagetrace.upsert({
        where: { fullPath: record.fullPath },
        update: {
          updateIdent: { increment: 1 },
        },
        create: {
          imageName: record.imageName,
          fullPath: record.fullPath,
          fileFormat: record.fileFormat.toUpperCase(),
          fileSize: record.fileSizeKB,
          meta, 
          description: content,
          
          miniature,
          indexedAt: indexedAt.toISOString(),
          createdAt: createdAt.toISOString()
        }
      });
*/