import 'dotenv/config';
import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import os from 'os';
import archiver from 'archiver';
import multer from 'multer';
import iconv from 'iconv-lite';

const router = express.Router();
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;
const MAX_IMAGES_UPLOAD = process.env.MAX_IMAGES_UPLOAD || 10

// GET http://localhost:3000/
router.get('/', async (req, res) => {
  res.render('main', { 
    query: "",
    stype: "text-scan", 
    mode: "natural", 
    expansion: false, 
    useImageId: false, 
    limit: 100, 
    results: null
  });
});

// POST http://localhost:3000/
router.post('/', async (req, res) => {
  const { query, stype, mode, expansion, useImageId, limit } = req.body;

  //console.log('query =', query, ", stype =", stype, ", mode =", mode, ", expansion =", expansion, ", limit =", limit)

  const results = await fetchSearchResults(query, stype, mode, expansion, useImageId, limit )
  
  res.render('main', { 
    query,
    stype, 
    mode, 
    expansion, 
    useImageId, 
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
  let archives = []

  const r1 = fetch(`http://${HOST}:${PORT}/api/v1/image/info/${id}`)
  const r2 = fetch(`http://${HOST}:${PORT}/api/v1/image/vista/${id}`)
  const r3 = fetch(`http://${HOST}:${PORT}/api/v1/image/archives-by-image/${id}`)

  const [ response1, response2, response3 ] = await Promise.all([ r1, r2, r3 ])

  if (!response1.ok) {
    throw new Error(`HTTP error: ${response1.status}`);
  }
  if (!response2.ok) {
    throw new Error(`HTTP error: ${response2.status}`);
  }
  if (!response3.ok) {
    throw new Error(`HTTP error: ${response2.status}`);
  }

  // Image Trace 
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

  // Vista Trace 
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

  // Archive Trace 
  const text3 = await response3.text();
  if (!text3) {
    //throw new Error('Empty response body');
    console.log('Empty response body')  
    return data
  }
  try {
    archives = JSON.parse(text3);
  } catch (err) {
    throw new Error('Invalid JSON: ' + err.message);
  }

  res.render('view', {id, ...data, vistas, archives });
});

// GET http://localhost:3000/info
router.get('/info', async (req, res) => {
  const info = await fetchSystemInfo()
  const total = info.type.reduce((sum, item) => sum + item.count, 0);
  const randomId = Math.floor(Math.random() * total) + 1;
  
  res.render('info', {...info, randomId})
});

// POST http://localhost:3000/export
router.post('/export', async (req, res) => {
  //const ids = req.body.ids; // e.g. [7, 4, 16]
  let { selected } = req.body;
  // Create a temporary directory using the system’s temp folder.
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'veiltrace-'));

  // If 'selected' is a single value, it’s wrapped into an array.
  if (typeof selected !== 'object') { selected = [ selected ]; }
  //console.log('selected =', selected)
  try {
    const filePaths = [];

    for (const id of selected) {
      // Fetch Metadata and Copy Files
      const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/info/${id}?fullPathOnly=true`);
      if (!response.ok) throw new Error(`Failed to fetch metadata for ID ${id}`);
      const data = await response.json();
      
      const sourcePath = data.fullPath;
      const filename = path.basename(sourcePath);
      const destPath = path.join(tempDir, filename);

      await fs.copyFile(sourcePath, destPath);
      filePaths.push({ path: destPath, name: filename });

      // Update veiltrace 
      const result = await postUpdateVeilTrace(id, 'export')
      if (!result) {
        console.error(`Failed to update veiltrace for ${id}`, id);
      }
    }

    // Create the ZIP Archive and places it inside the temporary folder.
    const zipName = `veiltrace_export_${Date.now()}.zip`;
    const zipPath = path.join(tempDir, zipName);

    const archive = archiver('zip', { zlib: { level: 9 } });
    const output = await fs.open(zipPath, 'w');
    const stream = output.createWriteStream();

    // Sets up the ZIP archive and output stream.
    archive.pipe(stream);

    // Adds each copied image to the archive under a 'veiltrace' folder.
    filePaths.forEach(file => {
      //archive.file(file.path, { name: file.name });
      archive.file(file.path, { name: `veiltrace/${file.name}` });
    });
    // Finalizes the ZIP.
    await archive.finalize();

    // Send the ZIP to the User - via 'res.download'.
    stream.on('close', async () => {
      res.download(zipPath, zipName, async () => {
        // Deletes the temporary folder afterward
        await fs.rm(tempDir, { recursive: true, force: true });
      });
    });

  } catch (err) {
    console.error('Export error:', err);
    await fs.rm(tempDir, { recursive: true, force: true });

    res.status(500).send('Export failed.');
  }
});

// POST http://localhost:3000/archive
router.post('/archive', async (req, res) => {
  //const ids = req.body.ids; // e.g. [7, 4, 16]
  let { selected } = req.body;

  // If 'selected' is a single value, it’s wrapped into an array.
  if (!selected) 
    selected = [] 
  else if (typeof selected !== 'object') 
    { selected = [ selected ]; } 
  //console.log('selected =', selected, typeof selected)

  res.render('archive', { archives: await fetchArchives(), ids: selected });
})  

// GET http://localhost:3000/archive/:id
router.get('/archive/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/archive/${id}`);

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

    data.imageIds = JSON.parse(data.imageIds)
    //console.log('data =', data)
    res.render('archiveDetail', data )
  } catch (error) {
    console.error('Search error:', error);
    console.log('searchUrl =', searchUrl)
    return null; 
  }
})  

// GET http://localhost:3000/slideshow/:id
router.get('/slideshow/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) 
    return res.status(400).json({ message: `Invalid id '${req.params.id}'` })

  try {
    const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/archive/${id}`);

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

    data.imageIds = JSON.parse(data.imageIds)
    const interval = process.env.INTERVAL || 3000; 
    data.interval = parseInt(interval, 10)

    //console.log('data =', data)
    res.render('slideShow', data )
  } catch (error) {
    console.error('Search error:', error);
    console.log('searchUrl =', searchUrl)
    return null; 
  }
})




// Multer config
const storage = multer.diskStorage({
  destination: async (_, __, cb) => {
    const today = new Date();
    const yyyyMMdd = today.toISOString().slice(0, 10); // e.g., "2025-10-07"
    // The upload folder
    const uploadDir = path.resolve('./upload', yyyyMMdd);

    // Ensure the folder exists *before* Multer uses it
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (_, file, cb) => {
    // Preserve original image name and handle Chinese
    const raw = Buffer.from(file.originalname, 'binary');
    const decoded = iconv.decode(raw, 'utf8');
    cb(null, decoded);
  }
});

// Multer middleware configured with custom diskStorage.
// Handles multipart/form-data uploads, saves files to date-based folders,
// and decodes original filenames (including symbolic or Chinese glyphs).
//const upload = multer({ storage });
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10 MB per file!!!
    files: MAX_IMAGES_UPLOAD     // Max files per request
  }
});

// GET /upload — render upload page
router.get('/upload', async (req, res) => {  
  res.render('upload', { message: "", max: MAX_IMAGES_UPLOAD });
});

// POST /upload — handle image uploads
router.post('/upload', upload.array('images', MAX_IMAGES_UPLOAD), async (req, res) => { 
  // Access uploaded files via req.files which contain decoded filenames and paths
  const imgs = req.files.map(f => f.filename)
  const count = imgs.length;

  const listed = imgs.map(name => `'${name}'`);
  const last = listed.pop();
  const joined = listed.length ? listed.join(', ') + ' and ' + last : last;

  const message = `${count} image${ count > 1? "s": "" } uploaded and ${ count > 1? "they are": "it is" } ${joined}.`;
  console.log(message)

  // Wait for 5 seconds... 
  //await new Promise(r => setTimeout(r, 5000));
  res.render('upload', { message, max: MAX_IMAGES_UPLOAD } );
});




async function fetchSearchResults(query, stype, mode, expansion, useImageId, limit) {
  const params = new URLSearchParams({
    query: encodeURIComponent(query),
    stype, 
    mode,
    useImageId: useImageId ? true : false, 
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
    case "hybrid":
      stype = "hs"
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

async function fetchArchives() {
  try {
    const response = await fetch(`http://${HOST}:${PORT}/api/v1/image/archives`)

    if (!response.ok) {
      throw new Error(`HTTP error: ${response1.status}`);
    }
    const text = await response.text()

    if (!text) {
      console.log('Empty response1 body')
      return null; 
    }    
    let data = []
    try {
      data = JSON.parse(text);      
    } catch (err) {
      throw new Error('Invalid JSON: ' + err.message);
    }    
    return data
  } catch (error) {
    console.error('Fetch error:', error);
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

/*
   multer
   https://www.npmjs.com/package/multer
*/