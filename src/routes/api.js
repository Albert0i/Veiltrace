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
import path from 'path';
import fs from 'fs';
import mime from 'mime';

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

// ─── GET /preview/:id ─────────────────────────────────────────
router.get('/preview/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await prisma.imageTrace.findUnique({
    where: { id }, 
    select: { 
      miniature: true
    }
  })
  
  if (!result?.miniature) {
    return res.status(404).send('Preview not found');
  }

  res.set('Content-Type', 'image/jpeg'); // or 'image/png' if needed
  res.status(200).send(result.miniature);            // Send binary buffer directly
});

// ─── GET /source/:id ─────────────────────────────────────────
router.get('/source/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const result = await prisma.imageTrace.findUnique({
    where: { id }, 
    select: { 
      fullPath: true
    }
  })

  if (!result || !result.fullPath) {
    return res.status(404).send('Image not found');
  }

  const filePath = path.resolve(result.fullPath);
  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Image not found on disk');
  }

  const mimeType = mime.getType(filePath) || 'application/octet-stream';
  res.setHeader('Content-Type', mimeType);
  res.status(200).sendFile(filePath);
});

// ─── GET /types ───────────────────────────────────────────────
router.get('/type', async (req, res) => {
  const result = await prisma.imageTrace.groupBy({
    by: ['fileFormat'],
    _count: { fileFormat: true }
  });
  
  const formats = result.map(entry => ({
    fileFormat: entry.fileFormat,
    count: entry._count.fileFormat
  }));  

  res.json(formats);
});

router.get('/search', async (req, res) => {
  const query = req.query.s?.trim();
  if (!query) return res.status(400).json({ error: 'Missing search query' });

  const results = await prisma.$queryRaw`
      SELECT id,
        MATCH(description) AGAINST(${query}) AS relevance
      FROM imagetrace
      WHERE MATCH(description) AGAINST(${query})
      ORDER BY relevance DESC
      LIMIT 20;
    `;

  res.json(results);
});

// // ─── GET /search ──────────────────────────────────────────────
// router.get('/search', async (req, res) => {
//   const query = req.query.s || '';
//   const results = await IImageTrace.search(query);
//   res.json(results);
// });

export default router;