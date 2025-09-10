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
    select: { id: true, type: true, createdAt: true },
    orderBy: {
      createdAt: 'desc'
      }
  })

  res.status(result.length>0?200:204).json(result);
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

  res.set('Content-Type', 'image/jpeg');  // or 'image/png' if needed
  res.status(200).send(result.miniature); // Send binary buffer directly
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

  // update imagetrace 
  const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const r1 = await prisma.imageTrace.update({
    where: { id }, // or use another unique field like fullPath
    data: {
      visited: { increment: 1 },         // increment visit count
      updatedAt: updatedAt.toISOString() // set to current timestamp
    }
  });
  // update vistatrace 
  const r2 = await prisma.vistaTrace.create({
    data: {
      imageId: id,                        // ID of the image being accessed
      createdAt: updatedAt.toISOString()  // set to current timestamp
    }
  });
  //console.log('r1 =', r1, ', r2 =', r2)

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

// ─── GET /search?query=xxx&offset=10&limit=10&expansion=true────────── 
router.get('/search', async (req, res) => {
  const query = req.query.query?.trim();
  const stype = req.query.stype
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false

  console.log('query =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

  res.status(200).json(sample);
});

// ─── GET /searchft?query=xxx&offset=10&limit=10&expansion=true──────────
router.get('/searchft', async (req, res) => {
  const query = req.query.query?.trim();
  const stype = req.query.stype
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false

  console.log('query =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ error: 'Missing search query' });

  const modifier = expansion ? 'WITH QUERY EXPANSION' : 'IN ' + mode + ' MODE';
  const result = await prisma.$queryRawUnsafe(`
        SELECT  id, visited, updatedAt, 
                MATCH(description) AGAINST(? IN ${mode} MODE) AS relevance
        FROM imagetrace
        WHERE MATCH(description) AGAINST(? ${modifier})
        ORDER BY relevance DESC
        LIMIT ? OFFSET ?;
      `, query, query, limit, offset);

  res.status(result.length>0?200:204).json(result);
});

// ─── GET /searchse?query=xxx&offset=10&limit=10&expansion=true────────── 
router.get('/searchse', async (req, res) => {
  const query = req.query.query?.trim();
  const stype = req.query.stype
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false

  console.log('query =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

  res.status(200).json(sample);
});

// // ─── GET /presearch?s=xxx─────────────────────────────────────────
// router.get('/presearch', async (req, res) => {
//   const query = req.query.query?.trim();
//   const stype = req.query.stype
//   const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
//   const expansion = req.query.expansion === 'true'; // ← default is false

//   console.log('s =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

//   if (!query) return res.status(400).json({ error: 'Missing search query' });

//   const modifier = expansion ? 'WITH QUERY EXPANSION' : 'IN ' + mode + ' MODE';
//   const countResult = await prisma.$queryRawUnsafe(`
//         SELECT  count(*) as count
//         FROM imagetrace
//         WHERE MATCH(description) AGAINST(? ${modifier})
//       `, query);
      
//   // countResult = [ { count: 4n } ]
//   const count = Number(countResult[0]?.count)
//   res.status(count>0?200:204).json( { count } );
// });

// ─── GET /status────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  const [{ version }] = await prisma.$queryRaw`SELECT VERSION() AS version`;
  const numImages = await prisma.ImageTrace.count()
  const numVistas = await prisma.VistaTrace.count()
  const [{ _, size }] = await await prisma.$queryRaw`
                            SELECT table_name AS 'table',
                                    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'size'
                            FROM information_schema.tables
                            WHERE table_schema = 'veiltrace' AND 
                                  table_name in ('imagetrace', 'vistatrace');
                            `;
  const visited = await prisma.ImageTrace.count({ 
    where: {
      visited: { gt: 0 }
    }
  })

  res.status(200).json( { 
                          version,
                          numImages,
                          numVistas, 
                          size, 
                          visited, 
                      } );
});

export default router;

const sample = [
  {
    "id": 22,
    "visited": 0,
    "updatedAt": null,
    "relevance": 4.93323230743408
  },
  {
    "id": 20,
    "visited": 0,
    "updatedAt": null,
    "relevance": 3.83695840835571
  },
  {
    "id": 21,
    "visited": 3,
    "updatedAt": "2025-09-09T09:40:03.733Z",
    "relevance": 2.74068450927734
  },
  {
    "id": 19,
    "visited": 0,
    "updatedAt": null,
    "relevance": 2.19254755973816
  }
]

/*
   Full-Text Index Overview
   https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/full-text-indexes/full-text-index-overview

   CRUD
   https://www.prisma.io/docs/orm/prisma-client/queries/crud
*/