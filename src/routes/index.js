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

// GET "/" — Main search page
router.get('/', (req, res) => {
  res.render('main', { 
    query: "",
    mode: "natural", 
    expansion: false, 
    limit: 100, 
    results: null
  });
});

// POST "/" — Handle search form
router.post('/', async (req, res) => {
  const { query, mode, expansion, limit } = req.body;

  console.log('query =', query, ", mode =", mode, ", expansion =", expansion, ", limit =", limit)

  const results = await fetchSearchResults(query, mode, expansion, limit )
  
  res.render('main', { 
    query,
    mode, 
    expansion, 
    limit, 
    results
  });
});

// POST "/export" — Handle export action
router.post('/export', (req, res) => {
  const { selected } = req.body;
  // Placeholder: await your instructions
  res.send(`Exporting images: ${selected}`);
});

export default router;

async function fetchSearchResults(query, mode, expansion, limit) {
  const params = new URLSearchParams({
    s: encodeURIComponent(query),
    mode,
    expansion: expansion ? true : false, 
    limit
  });

  const HOST = process.env.HOST || 'localhost';
  const PORT = process.env.PORT || 3000;
  const url = `http://${HOST}:${PORT}/api/v1/image/search?${params.toString()}`;

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