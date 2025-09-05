/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace API Routes — /api/v1/image/*                   │
 * │   Directly uses prismaClient and IImageTrace               │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross                     │
 * └────────────────────────────────────────────────────────────┘
 */

import express from 'express';
// Prisma 
import { PrismaClient } from '../../src/generated/prisma/index.js'; 
import fs from 'fs';

const prisma = new PrismaClient();
const router = express.Router();

// ─── GET /info/:id ────────────────────────────────────────────
router.get('/info/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await prisma.imageTrace.findUnique({
    where: { id }, 
    select: { 
      imageName: true, fullPath: true,  fileFormat: true,  
      fileSize: true,  meta: true,  description: true,  
      visited: true,  updatedAt: true,  indexedAt: true,  
      createdAt: true,  updateIdent: true
    }
  })

  res.status(result?200:404).json(result);
});

// ─── GET /vista/:imageId ────────────────────────────────────────────
router.get('/vista/:imageId', async (req, res) => {
  const imageId = parseInt(req.params.imageId);
  const result = await prisma.VistaTrace.findMany({
    where: { imageId },
    select: { id: true, createdAt: true },
    orderBy: {
      createdAt: 'desc'
      }
  })

  res.status(result.length>0?200:404).json(result);
});

// // ─── GET /preview/:id ─────────────────────────────────────────
// router.get('/preview/:id', async (req, res) => {
//   const id = parseInt(req.params.id);
//   const miniature = await IImageTrace.getMiniature(id);
//   if (!miniature) return res.status(404).send('Miniature not found');
//   res.set('Content-Type', 'image/jpeg');
//   res.send(miniature);
// });

// // ─── GET /original/:id ────────────────────────────────────────
// router.get('/original/:id', async (req, res) => {
//   const id = parseInt(req.params.id);
//   const fullPath = await IImageTrace.getOriginalPath(id);
//   if (!fullPath || !fs.existsSync(fullPath)) {
//     return res.status(404).send('Original image not found');
//   }
//   res.sendFile(fullPath);
// });

// // ─── GET /search ──────────────────────────────────────────────
// router.get('/search', async (req, res) => {
//   const query = req.query.s || '';
//   const results = await IImageTrace.search(query);
//   res.json(results);
// });

// // ─── GET /types ───────────────────────────────────────────────
// router.get('/types', async (req, res) => {
//   const types = await IImageTrace.getTypes();
//   res.json(types);
// });

export default router;