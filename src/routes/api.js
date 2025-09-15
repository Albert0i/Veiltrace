import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import mime from 'mime';

// Prisma 
import { PrismaClient } from '../../src/generated/prisma/index.js'; 

// node-llama-cpp 
import { fileURLToPath } from "url";
import { getLlama } from "node-llama-cpp";

// node-llama-cpp 
const __dirname = path.dirname(
  fileURLToPath(import.meta.url)
);
const llama = await getLlama();
const model = await llama.loadModel({
    modelPath: path.join(__dirname, "..", "..", "models", process.env.MODEL_NAME)
});
const context = await model.createEmbeddingContext();

const prisma = new PrismaClient();
const router = express.Router();

// GET http://localhost:3000/api/v1/image/info/:id
router.get('/info/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    const result = await prisma.imagetrace.findUnique({
      where: { id },
      select: {
        imageName: true, fullPath: true, fileFormat: true,
        fileSize: true, meta: true, description: true,
        visited: true, updatedAt: true, indexedAt: true,
        createdAt: true, updateIdent: true
      }
    });

    res.status(result?200:404).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET http://localhost:3000/api/v1/image/vista/:id
router.get('/vista/:imageId', async (req, res) => {
  const imageId = parseInt(req.params.imageId, 10);

  if (isNaN(imageId)) 
    return res.status(400).json({ message: `Invalid id '${req.params.imageId}'` })
  
  try {
    const result = await prisma.vistatrace.findMany({
      where: { imageId },
      select: { id: true, type: true, createdAt: true },
      orderBy: {
        createdAt: 'desc'
        }
    })

    res.status(result?200:404).json(result);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET http://localhost:3000/api/v1/image/preview/:id
router.get('/preview/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    const result = await prisma.imagetrace.findUnique({
      where: { id }, 
      select: { 
        miniature: true
      }
    })

    if (!result?.miniature) {
      return res.status(404).json({ message: 'Preview not found' });
    }
  
    res.set('Content-Type', 'image/jpeg');  // or 'image/png' if needed
    res.status(200).send(result.miniature); // Send binary buffer directly
  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// GET http://localhost:3000/api/v1/image/view/:id
router.get('/view/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    const result = await prisma.imagetrace.findUnique({
      where: { id }, 
      select: { 
        fullPath: true
      }
    })
  
    if (!result || !result.fullPath) {
      return res.status(404).json({ message: `Image not found for id '${id}'` });
    }
  
    const filePath = path.resolve(result.fullPath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: `Image not found on disk for id '${id}'` });
    }
  
    const updateResult = await updateVeilTrace(id, 'view')
    if (!updateResult) console.log('An error has occurred while updating veiltrace', updateResult)

    const mimeType = mime.getType(filePath) || 'application/octet-stream';
    res.setHeader('Content-Type', mimeType);
    res.status(200).sendFile(filePath);

  } catch (err) {
    res.status(500).json({ message: 'Internal server error', error: err.message });
  }
});

// POST http://localhost:3000/api/v1/image/view
router.post('/view', async (req, res) => {
  const id = parseInt(req.body.id, 10); // Extract ID from request body
  const type = req.body.type

  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.body.id}'` })

  if (type !== 'view' && type !=='export') 
    return res.status(400).json({ message: `Invalid type '${req.body.type}'` })

  const updateResult = await updateVeilTrace(id, type);
  if (!updateResult) console.log('An error has occurred while updating veiltrace', updateResult)

  res.json({ success: updateResult? true: false }); // Respond with the parsed ID
});

// GET http://localhost:3000/api/v1/image/type
router.get('/type', async (req, res) => {
  try {
    const result = await prisma.imagetrace.groupBy({
      by: ['fileFormat'],
      _count: { fileFormat: true },
      orderBy: {
        _count: {
          fileFormat: 'desc'
        }
      }
    });

    // Map into a flat structure 
    /*
      [
        {
          "_count": {
            "fileFormat": 39
          },
          "fileFormat": "JPG"
        },
        {
          "_count": {
            "fileFormat": 3
          },
          "fileFormat": "JPEG"
        }
      ]
      ➡️➡️➡️
      [
        {
          "fileFormat": "JPG",
          "count": 39
        },
        {
          "fileFormat": "JPEG",
          "count": 3
        }
      ]
    */
    const formattedResult = result.map(entry => ({
      fileFormat: entry.fileFormat,
      count: entry._count.fileFormat
    }));  

    res.status(200).json(formattedResult);
  } catch (err) {
    res.status(500).json({
      message: 'Internal server error while grouping image formats',
      error: err.message
    });
  }
});

// GET http://localhost:3000/api/v1/image/search?query=chin&offset=0&limit=10
router.get('/search', async (req, res) => {
  const query = req.query.query?.trim();
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = parseInt(req.query.limit, 10) || 20;
  
  console.log('text-scan >> query =', query, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  const result = await prisma.imagetrace.findMany({
    where: {
      description: {
        contains: query, // Case-insensitive if collation is set correctly
      }
    },
    select: {
      id: true, 
      visited: true,
      updatedAt: true
    },
    skip: offset, 
    take: limit
  }); 

  res.status(result.length>0?200:404).json(result);
});

// GET http://localhost:3000/api/v1/image/searchft?query=chinchilla&mode=natural&expansion=false&offset=0&limit=10
router.get('/searchft', async (req, res) => {
  const query = req.query.query?.trim();
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false

  console.log('full-text >> query =', query, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  const modifier = expansion ? 'WITH QUERY EXPANSION' : 'IN ' + mode + ' MODE';
  const result = await prisma.$queryRawUnsafe(`
        SELECT  id, visited, updatedAt, 
                MATCH(description) AGAINST(? IN ${mode} MODE) AS relevance
        FROM imagetrace
        WHERE MATCH(description) AGAINST(? ${modifier})
        ORDER BY relevance DESC
        LIMIT ? OFFSET ?;
      `, query, query, limit, offset);

  res.status(result.length>0?200:404).json(result);
});

// GET http://localhost:3000/api/v1/image/searchse?query=chinchilla&offset=0&limit=10
router.get('/searchse', async (req, res) => {
  const query = req.query.query?.trim();
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  
  console.log('semantic >> query =', query, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  const { vector } = await context.getEmbeddingFor(query);

  // Find similar documents 
  const result = await prisma.$queryRaw`
                        SELECT id, visited, updatedAt,
                               VEC_DISTANCE_COSINE(
                                  embedding,
                                  VEC_FromText(${JSON.stringify(vector)})
                                  ) AS distance, 
                               id
                        FROM imagetrace 
                        ORDER BY 4 ASC
                        LIMIT ${limit} OFFSET ${offset};
                      `; 

  res.status(result.length>0?200:404).json(result);
});

// GET http://localhost:3000/api/v1/image/status
router.get('/status', async (req, res) => {
  const [{ version }] = await prisma.$queryRaw`SELECT VERSION() AS version`;
  const numImages = await prisma.imagetrace.count()
  const numVistas = await prisma.vistatrace.count()
  const [{ _, size }] = await await prisma.$queryRaw`
                            SELECT table_name AS 'table',
                                    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'size'
                            FROM information_schema.tables
                            WHERE table_schema = 'veiltrace' AND 
                                  table_name in ('imagetrace', 'vistatrace');
                            `;
  const visited = await prisma.imagetrace.count({ 
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

async function updateVeilTrace(id, type) {
    // update imagetrace 
    const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const r1 = await prisma.imagetrace.update({
      where: { id }, // or use another unique field like fullPath
      data: {
        visited: { increment: 1 },         // increment visit count
        updatedAt: updatedAt.toISOString() // set to current timestamp
      }
    });
    // update vistatrace 
    const r2 = await prisma.vistatrace.create({
      data: {
        imageId: id,                        // ID of the image being accessed
        type, 
        createdAt: updatedAt.toISOString()  // set to current timestamp
      }
    });
    //console.log('r1 =', r1, ', r2 =', r2)

    return { r1, r2 }
}

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