/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Miniature Preview Script                      │
 * │                                                            │
 * │   Fetches miniature from DB and saves as preview.jpg       │
 * │   Crafted by Iong, guided by Albatross                     │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import fs from 'fs';
import path from 'path';
// Prisma 
import { PrismaClient } from '../src/generated/prisma/index.js'; 

const prisma = new PrismaClient();
const fullPathKey = 'D:/RU/Veiltrace/img/character/movie/sample.jpg'; // Replace with your target

async function previewMiniature() {
  try {
    // const record = await prisma.imageTrace.findUnique({
    //   where: { fullPath: fullPathKey },
    //   select: { imageName: true, miniature: true }
    // });
    const record = await prisma.imageTrace.findUnique({
        where: { id: 21 },
        select: { imageName: true, miniature: true }
      });

    if (!record?.miniature) {
      console.log(`⚠️ No miniature found for: ${record?.imageName || fullPathKey}`);
      return;
    }

    const outputPath = path.resolve('./preview.jpg');
    fs.writeFileSync(outputPath, record.miniature);
    console.log(`✅ Miniature saved as: ${outputPath}`);
  } catch (err) {
    console.error(`❌ Failed to fetch miniature: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

previewMiniature();