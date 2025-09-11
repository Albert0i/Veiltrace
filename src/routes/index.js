/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace Main Routes — /*                               │
 * │   Fetch from back end API                                  │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross                     │
 * └────────────────────────────────────────────────────────────┘
 */

import 'dotenv/config';
import express from 'express';
const router = express.Router();
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import archiver from 'archiver';
// Prisma 
import { PrismaClient } from '../../src/generated/prisma/index.js'; 
const prisma = new PrismaClient();

// GET "/" — Main search page
router.get('/', async (req, res) => {
  res.render('main', { 
    query: "",
    stype: "full-text", 
    mode: "natural", 
    expansion: false, 
    limit: 100, 
    results: null
  });
});

// POST "/" — Handle search form
router.post('/', async (req, res) => {
  const { query, stype, mode, expansion, limit } = req.body;

  //console.log('query =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", limit =", limit)

  const results = await fetchSearchResults(query, stype, mode, expansion, limit )
  
  res.render('main', { 
    query,
    stype, 
    mode, 
    expansion, 
    limit, 
    results
  });
});

// Route to render view page
router.get('/view/:id', async (req, res) => {
  const id = req.params.id;
  //console.log('id =', id)

  const HOST = process.env.HOST || 'localhost';
  const PORT = process.env.PORT || 3000;
  let data = []
  let vistas = []

  // ImageTrace 
  const url1 = `http://${HOST}:${PORT}/api/v1/image/info/${id}`;

  try {
    const response = await fetch(url1);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    if (!response.ok) {
      const text = await response.text(); // safer fallback
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  
    const text = await response.text();
        
    if (!text) {
      //throw new Error('Empty response body');
      console.log('Empty response body')
    }
    
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    // const data = await response.json();
    // console.log('Search results:', data);
    // // Ritual continues: render or process the archive
  } catch (error) {
    console.error('Search error:', error);
    console.log('url1 =', url1)
  }
  // VistaTrace 
  const url2 = `http://${HOST}:${PORT}/api/v1/image/vista/${id}`;

  try {
    const response = await fetch(url2);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    if (!response.ok) {
      const text = await response.text(); // safer fallback
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  
    const text = await response.text();
        
    if (!text) {
      //throw new Error('Empty response body');
      console.log('Empty response body')
    }
    
    try {
      vistas = JSON.parse(text);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    // const data = await response.json();
    // console.log('Search results:', data);
    // // Ritual continues: render or process the archive
  } catch (error) {
    console.error('Search error:', error);
    console.log('url2 =', url2)
  }  

  //res.render('view', {id, ...sample2 });
  res.render('view', {id, ...data, vistas });
});

// Route to render info page
router.get('/info', async (req, res) => {
  res.render('info', {  });
});

// POST "/export" — Handle export action
// router.post('/export', async (req, res) => {
//   const { selected } = req.body;
//   // Placeholder: await your instructions
//   res.send(`Exporting images: ${selected}`);
// });
router.post('/export', async (req, res) => {
  //const ids = req.body.ids; // e.g. [7, 4, 16]
  const { selected } = req.body;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veiltrace-'));
  const HOST = process.env.HOST || 'localhost';
  const PORT = process.env.PORT || 3000;

  try {
    const filePaths = [];

    for (const id of selected) {
      const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/info/${id}`);
      if (!response.ok) throw new Error(`Failed to fetch metadata for ID ${id}`);
      const data = await response.json();

      const sourcePath = data.fullPath;
      const filename = path.basename(sourcePath);
      const destPath = path.join(tempDir, filename);

      await fs.copyFile(sourcePath, destPath);
      filePaths.push({ path: destPath, name: filename });

        // update imagetrace 
      const updatedAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const r1 = await prisma.imagetrace.update({
        where: { id: Number(id) }, // or use another unique field like fullPath
        data: {
          visited: { increment: 1 },         // increment visit count
          updatedAt: updatedAt.toISOString() // set to current timestamp
        }
      });
      // update vistatrace 
      const r2 = await prisma.vistatrace.create({
        data: {
          imageId: Number(id),    // ID of the image being accessed
          type: 'export',         // export
          createdAt: updatedAt.toISOString()  // set to current timestamp
        }
      });
      //console.log('r1 =', r1, ', r2 =', r2)
        }

    const zipName = `veiltrace_export_${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipName);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = await fs.open(zipPath, 'w');
    const stream = output.createWriteStream();

    archive.pipe(stream);
    filePaths.forEach(file => {
      //archive.file(file.path, { name: file.name });
      archive.file(file.path, { name: `veiltrace/${file.name}` });
    });

    await archive.finalize();

    stream.on('close', async () => {
      res.download(zipPath, zipName, async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });

  } catch (err) {
    console.error('Export error:', err);
    await fs.rm(tempDir, { recursive: true, force: true });
    res.status(500).send('Export failed.');
  }
});

export default router;

async function fetchSearchResults(query, stype, mode, expansion, limit) {
  const params = new URLSearchParams({
    query: encodeURIComponent(query),
    stype, 
    mode,
    expansion: expansion ? true : false, 
    limit
  });
  switch(params.get('stype')) {
    case "full-text":
      stype = "ft"
      break;
    case "semantic":
      stype = "se"
      break;
    default:
      stype = ""
  }
  const HOST = process.env.HOST || 'localhost';
  const PORT = process.env.PORT || 3000;
  const url = `http://${HOST}:${PORT}/api/v1/image/search${stype}?${params.toString()}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    if (!response.ok) {
      const text = await response.text(); // safer fallback
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
  
    const text = await response.text();
    let data = []
    
    if (!text) {
      //throw new Error('Empty response body');
      console.log('Empty response body')
      return data; 
    }
    
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    // const data = await response.json();
    // console.log('Search results:', data);
    // // Ritual continues: render or process the archive
    return data
  } catch (error) {
    console.error('Search error:', error);
    console.log('url =', url)
    return null; 
  }
}

const sample2 = {
    "imageName": "539429830_767705962525439_1268665176191374100_n.jpg",
    "fullPath": "D:/RU/Veiltrace/img/chin/539429830_767705962525439_1268665176191374100_n.jpg",
    "fileFormat": "JPG",
    "fileSize": 190,
    "meta": "...",
    "description": "...",
    "visited": 0,
    "updatedAt": null,
    "indexedAt": "2025-09-11 09:22:08.865000",
    "createdAt": "2025-09-01 08:10:12.554000",
    "updateIdent": 0,
    "vistas": [
    {
      "id": 3,
      "type": "view",
      "createdAt": "2025-09-11T10:55:18.469Z"
    },
    {
      "id": 2,
      "type": "view",
      "createdAt": "2025-09-11T10:55:17.957Z"
    },
    {
      "id": 1,
      "type": "view",
      "createdAt": "2025-09-11T10:55:16.285Z"
    }
  ] 
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