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
  const fullPathOnly = req.query.fullPathOnly || false;
  
  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    if (fullPathOnly) {
      // Exclusively used by export to minimize payload. 
      const result = await prisma.imagetrace.findUnique({
        where: { id },
        select: { fullPath: true }
      });
  
      res.status(result?200:404).json(result);
    } else {
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
    }
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
        miniature: true,
        fullPath: true
      }
    })

    if (!result?.miniature) {
      // Begin fix (2025/10/01)
      // If no miniature is found, try to return the source image as a last resort!!!  
      //return res.status(404).json({ message: 'Preview not found' });
      if (!result.fullPath) {
        return res.status(404).json({ message: `Image not found for id '${id}'` });
      }
    
      const filePath = path.resolve(result.fullPath);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: `Image not found on disk for id '${id}'` });
      }

      console.log(`Warning: No miniature found for id '${id}', use source image instead...`)
      const mimeType = mime.getType(filePath) || 'application/octet-stream';
      res.setHeader('Content-Type', mimeType);
      return res.status(200).sendFile(filePath);
      // End fix (2025/10/01)
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
  
  //console.log('text-scan >> query =', query, ", offset =", offset, ", limit =", limit)

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

  res.status(result.length>0?200:204).json(result);
});

// GET http://localhost:3000/api/v1/image/searchft?query=chinchilla&mode=natural&expansion=false&offset=0&limit=10
router.get('/searchft', async (req, res) => {
  const query = req.query.query?.trim();
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false

  //console.log('full-text >> query =', query, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  //const modifier = expansion ? 'WITH QUERY EXPANSION' : 'IN ' + mode + ' MODE';
  // const result = await prisma.$queryRawUnsafe(`
  //                         SELECT  id, visited, updatedAt, 
  //                                 MATCH(description) AGAINST(? IN ${mode} MODE) AS relevance
  //                         FROM imagetrace
  //                         WHERE MATCH(description) AGAINST(? ${modifier})
  //                         ORDER BY relevance DESC
  //                         LIMIT ? OFFSET ?;
  //                       `, query, query, limit, offset);
  const result = await findImages(query, mode, offset, limit, expansion)

  res.status(result.length>0?200:204).json(result);
});

// GET http://localhost:3000/api/v1/image/searchse?query=chinchilla&offset=0&limit=10
router.get('/searchse', async (req, res) => {
  const query = req.query.query?.trim();
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const useImageId = req.query.useImageId === 'true'; // ← default is false
  
  //console.log('semantic >> query =', query, ", useImageId =", useImageId, ", offset =", offset, ", limit =", limit)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  // Find similar documents 
  let result = []
  if (useImageId) {
    const imageId = parseInt(query, 10); // base 10

    if (isNaN(imageId)) {
      return res.status(400).json({ message: `Invalid imageId '${imageId}'` });
    }
    //console.log('imageId =', imageId)
    // result = await prisma.$queryRaw`
    //                   SELECT id, visited, updatedAt,
    //                          VEC_DISTANCE_COSINE(
    //                             embedding,
    //                             (SELECT embedding from imagetrace WHERE id=${imageId})
    //                           ) AS distance, 
    //                          id
    //                   FROM imagetrace 
    //                   ORDER BY 4 ASC
    //                   LIMIT ${limit} OFFSET ${offset};
    //                 `; 
    result = await findSimilarImagesWithImageId(imageId, offset, limit)
  } else {
    // const { vector } = await context.getEmbeddingFor(query);
    // //console.log('vector =', vector)
    // result = await prisma.$queryRaw`
    //                   SELECT id, visited, updatedAt,
    //                         VEC_DISTANCE_COSINE(
    //                             embedding,
    //                             VEC_FromText(${JSON.stringify(vector)})
    //                         ) AS distance
    //                   FROM imagetrace 
    //                   ORDER BY 4 ASC
    //                   LIMIT ${limit} OFFSET ${offset};
    //                 `; 
    result = await findSimilarImages(query, offset, limit) 
  }

  res.status(result.length>0?200:204).json(result);
});

// Full-text Search 
async function findImages(query, mode, offset, limit, expansion) {
  const modifier = expansion ? 'WITH QUERY EXPANSION' : 'IN ' + mode + ' MODE';

  const result = await prisma.$queryRawUnsafe(`
                          SELECT  id, visited, updatedAt, 
                                  MATCH(description) AGAINST(? IN ${mode} MODE) AS relevance
                          FROM imagetrace
                          WHERE MATCH(description) AGAINST(? ${modifier})
                          ORDER BY relevance DESC
                          LIMIT ? OFFSET ?;
                        `, query, query, limit, offset);
  
  return result
}

// Semantic Search with text 
async function findSimilarImages(query, offset, limit) {
  const { vector } = await context.getEmbeddingFor(query);
  //console.log('vector =', vector)

  const result = await prisma.$queryRaw`
                          SELECT id, visited, updatedAt,
                                VEC_DISTANCE_COSINE(
                                    embedding,
                                    VEC_FromText(${JSON.stringify(vector)})
                                ) AS distance
                          FROM imagetrace 
                          ORDER BY 4 ASC
                          LIMIT ${limit} OFFSET ${offset};
                        `; 

  return result
}

// Semantic Search with Image Id 
async function findSimilarImagesWithImageId(imageId, offset, limit) {
  const result = await prisma.$queryRaw`
                          SELECT id, visited, updatedAt,
                                VEC_DISTANCE_COSINE(
                                    embedding,
                                    (SELECT embedding from imagetrace WHERE id=${imageId})
                                  ) AS distance, 
                                id
                          FROM imagetrace 
                          ORDER BY 4 ASC
                          LIMIT ${limit} OFFSET ${offset};
                        `; 

  return result
}
 

// GET http://localhost:3000/api/v1/image/searchhs?query=chinchilla&offset=0&limit=10
router.get('/searchhs', async (req, res) => {
  const query = req.query.query?.trim();
  const mode = req.query.mode === 'boolean' ? 'BOOLEAN' : 'NATURAL LANGUAGE';
  const offset = parseInt(req.query.offset) || 0;
  const limit = parseInt(req.query.limit) || 20;
  const expansion = req.query.expansion === 'true'; // ← default is false 
  
  //console.log('hybrid >> query =', query, ", mode =", mode, ", expansion =", expansion, ", offset =", offset, ", limit =", limit, ', kft =', process.env.KFT, ', kse =', process.env.KSE)

  if (!query) return res.status(400).json({ message: 'Missing search query' });

  // Find documents with Full-text search 
  const ft = findImages(query, mode, offset, limit, expansion)
  // Find documents with Semantic search 
  const se = findSimilarImages(query, offset, limit) 
  
  // Get result in one go
  const [resultft, resutlse] = await Promise.all([ft, se])
  //console.log('resultft = ', resultft)
  //console.log('resultse = ', resutlse)
  
  const result = calculateRRF(resultft, resutlse, process.env.KFT, process.env.KSE, limit)
  //console.log('result =', result)

  res.status(result.length>0?200:204).json(result);
});

// Function to calculate "Reciprocal Rank Fusion"
function calculateRRF(resultft, resultse, kft = 1, kse = 1, limit = 20) {
  const scores = new Map();

  // Helper to assign RRF scores from a ranked list
  function assignScores(results, k) {
    results.forEach((item, index) => {
      const id = item.id || JSON.stringify(item); // Use unique ID or fallback
      const score = 1 / (k + index + 1); // rank starts at 1
      if (!scores.has(id)) {
        scores.set(id, { item: { ...item }, total: 0 });
      }
      scores.get(id).total += score;
    });
  }

  assignScores(resultft, kft);
  assignScores(resultse, kse);

  // Convert to array, attach score, and sort by total RRF score descending
  const fused = Array.from(scores.values())
    .map(({ item, total }) => ({ ...item, rrfScore: total }))
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, limit); // Apply limit

  return fused;
}


// GET http://localhost:3000/api/v1/image/status
router.get('/status', async (req, res) => {
  const r1 = prisma.$queryRaw`SELECT VERSION() AS version`;
  const r2 = prisma.imagetrace.count();
  const r3 = prisma.vistatrace.count();
  const r4 = prisma.$queryRaw`SELECT table_name AS 'table',
                                      ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'size'
                              FROM information_schema.tables
                              WHERE table_schema = 'veiltrace' AND 
                                    table_name in ('imagetrace', 'vistatrace')`;
  const r5 = prisma.imagetrace.count({ 
                where: {
                  visited: { gt: 0 }
                }
              })
  const r6 = prisma.archivetrace.count();

  const [[{ version }],
            numImages, 
            numVistas, 
         [{ _, size }], 
            visited, 
            numArchives ] = await Promise.all([r1, r2, r3, r4, r5, r6]) 

  res.status(200).json( { 
                          version,
                          numImages,
                          numVistas, 
                          size, 
                          visited, 
                          numArchives
                      } );
});




// GET http://localhost:3000/api/v1/image/archives
router.get('/archives', async (req, res) => {
  const result = await prisma.archivetrace.findMany({
    orderBy: { title: 'asc' }
  });
  
  res.status(200).json( result );
});

// GET http://localhost:3000/api/v1/image/archives-by-image
router.get('/archives-by-image/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` });
  }

  try {
    const result = await prisma.$queryRaw`
      SELECT * FROM archivetrace
      WHERE JSON_CONTAINS(imageIds, ${JSON.stringify([id])})
      ORDER BY description;`;

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET http://localhost:3000/api/v1/image/archive/:id
router.get('/archive/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` });
  }

  try {
    const result = await prisma.archivetrace.findUnique({ where: { id } });
    if (!result) {
      return res.status(404).json({ message: `Archive '${id}' not found` });
    }
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST http://localhost:3000/api/v1/image/archive
router.post('/archive', async (req, res) => {
  // Current timestamp 
  const createdAt = new Date(Date.now() + 8 * 60 * 60 * 1000);  
  const title = req.body.title || `Archive ${createdAt.toISOString()}`;
  const description = req.body.description;
  const ids = req.body.ids
  const avatarId = Number(req.body.avatarId) || Number(ids[0])

  //console.log('ids = ', ids, ', avatarId =', avatarId)
  try {
    let result = await prisma.archivetrace.create({
      data: {
        imageIds: JSON.stringify([]),
        avatarId, 
        title, 
        description,
        createdAt: createdAt.toISOString(),
      }
    });

    if (ids && ids.length > 0) {
      result = await updateArchive(result.id, "add", ids)
    }

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating archive:', error);
    res.status(500).json({ message: 'Failed to create archive' });
  }
});

// PUT http://localhost:3000/api/v1/image/archive
router.put('/archive/:id', async (req, res) => {
  //const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  const id = parseInt(req.params.id, 10);
  const { action, ids }  = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` });
  }
  //console.log('id =', id, ", action =", action, ", ids=", ids)
  const result = await updateArchive(id, action, ids)
  
  res.status(200).json(result);
});

// DELETE http://localhost:3000/api/v1/image/archive
router.delete('/archive/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` });
  }

  try {
    const result = await prisma.archivetrace.delete({
      where: { id }
    });

    res.status(200).json(result);
  } catch (error) {
    console.error('Delete failed:', error);
    res.status(404).json({ message: `ArchiveTrace with id '${id}' not found.` });
  }
});

async function updateArchive(id, action, ids) {
  const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
  let { imageIds } = await prisma.archivetrace.findUnique({
    where: { id },
    select: { imageIds: true }
  });
  if ( imageIds && imageIds !== "" )
    imageIds = JSON.parse(imageIds)
  else 
    imageIds = []

  let newImageIds = [];
  switch (action) {
    case "add":
      newImageIds = MergeArray(imageIds, ids);
      break;
    case "remove":
      newImageIds = subtractArray(imageIds, ids);
      break;
    default:
      return { message: `Invalid action '${action}'` }
  }

  const result = await prisma.archivetrace.update({
    where: { id },
    data: {
      imageIds: JSON.stringify(newImageIds),
      updatedAt: updatedAt.toISOString(),
      updateIdent: { increment: 1 }
    }
  });

  return result
}

function MergeArray(arr1, arr2) {
  return [...new Set([...arr1, ...arr2])];
}

function subtractArray(base = [], toRemove = []) {
  const removeSet = new Set(toRemove || []);
  return Array.isArray(base) ? base.filter(x => !removeSet.has(x)) : [];
}




async function updateVeilTrace(id, type) {
  // Current timestamp 
  const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  // update imagetrace 
  const r1 = prisma.imagetrace.update({
    where: { id },                       // id of the image being accessed
    data: {
      visited: { increment: 1 },         // increment visit count
      updatedAt: updatedAt.toISOString() // set to current timestamp
    }
  });
  // update vistatrace 
  const r2 = prisma.vistatrace.create({
    data: {
      imageId: id,                        // id of the image being accessed
      type, 
      createdAt: updatedAt.toISOString()  // set to current timestamp
    }
  });

  const [ result1, result2 ] = await Promise.all([r1, r2])  
  if (!result1) console.log('An error has occurred while updating imagetrace', result1)
  if (!result2) console.log('An error has occurred while updating vistatrace', result2)    

  return result1 && result2 ? true : false 
}

export default router;

/*
   Full-Text Index Overview
   https://mariadb.com/docs/server/ha-and-performance/optimization-and-tuning/optimization-and-indexes/full-text-indexes/full-text-index-overview

   CRUD
   https://www.prisma.io/docs/orm/prisma-client/queries/crud
*/