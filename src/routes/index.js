import 'dotenv/config';
import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import archiver from 'archiver';

const router = express.Router();
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

// GET http://localhost:3000/
router.get('/', async (req, res) => {
  res.render('main', { 
    query: "",
    stype: "text-scan", 
    mode: "natural", 
    expansion: false, 
    limit: 100, 
    results: null
  });
});

// POST http://localhost:3000/
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

// GET http://localhost:3000/view/:id
router.get('/view/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  let data = []
  let vistas = []

  const r1 = fetch(`http://${HOST}:${PORT}/api/v1/image/info/${id}`)
  const r2 = fetch(`http://${HOST}:${PORT}/api/v1/image/vista/${id}`)

  const [ response1, response2 ] = await Promise.all([ r1, r2 ])

  if (!response1.ok) {
    throw new Error(`HTTP error: ${response1.status}`);
  }
  if (!response2.ok) {
    throw new Error(`HTTP error: ${response2.status}`);
  }

  // ImageTrace 
  const text1 = await response1.text();
  if (!text1) {
    //throw new Error('Empty response body');
    console.log('Empty response body')  
    return data
  }
  try {
    data = JSON.parse(text1);
  } catch (err) {
    throw new Error('Invalid JSON: ' + err.message);
  }

  // VistaTrace 
  const text2 = await response2.text();
  if (!text2) {
    //throw new Error('Empty response body');
    console.log('Empty response body')  
    return data
  }
  try {
    vistas = JSON.parse(text2);
  } catch (err) {
    throw new Error('Invalid JSON: ' + err.message);
  }

  res.render('view', {id, ...data, vistas });
});

// GET http://localhost:3000/info
router.get('/info', async (req, res) => {
  const info = await fetchSystemInfo()
  const total = info.type.reduce((sum, item) => sum + item.count, 0);
  const randomId = Math.floor(Math.random() * total) + 1;
  
  res.render('info', {...info, randomId})
});

// GET http://localhost:3000/export/:id
router.post('/export', async (req, res) => {
  //const ids = req.body.ids; // e.g. [7, 4, 16]
  let { selected } = req.body;
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veiltrace-'));

  if (typeof selected !== 'object') { selected = [ selected ]; }
  //console.log('selected =', selected)
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

      const result = await postUpdateVeilTrace(id, 'export')
      if (!result) {
        console.error(`Failed to update veiltrace for ${id}`, id);
      }
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
  const searchUrl = `http://${HOST}:${PORT}/api/v1/image/search${stype}?${params.toString()}`;

  try {
    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
  
    const text = await response.text();
    let data = []
    
    if (!text) {
      //throw new Error('Empty response body');
      // console.log(`Empty response body for ${params.get('stype')} query '${query}'`)
      return data; 
    }
    
    try {
      data = JSON.parse(text);
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    // console.log('Search results:', data);
    return data
  } catch (error) {
    console.error('Search error:', error);
    console.log('searchUrl =', searchUrl)
    return null; 
  }
}

async function fetchSystemInfo() {
  try {
    const r1 = fetch(`http://${HOST}:${PORT}/api/v1/image/status`);
    const r2 = fetch(`http://${HOST}:${PORT}/api/v1/image/type`);

    const [ response1, response2 ] = await Promise.all([ r1, r2 ])

    if (!response1.ok) {
      throw new Error(`HTTP error: ${response1.status}`);
    }
    if (!response2.ok) {
      throw new Error(`HTTP error: ${response2.status}`);
    }

    const [ text1, text2 ] = await Promise.all([ response1.text(), response2.text() ])

    if (!text1) {
      console.log('Empty response1 body')
      return data; 
    }
    if (!text2) {
      console.log('Empty response2 body')
      return data; 
    }
    
    let data = []
    try {
      data = JSON.parse(text1);
      data.type = JSON.parse(text2)
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    return data
  } catch (error) {
    console.error('Fetch error:', error);
    return null; 
  }
}

async function postUpdateVeilTrace(id, type='view') {
  try {
    const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/view`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, type }) // Send id and type in the body
    });

    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status}`);
    }

    const result = await response.json();
    //console.log('result =', result);
    return result 
  } catch (error) {
    console.error('Failed to update veiltrace', error);
    return null
  }
}

export default router;