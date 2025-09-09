/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace Main Routes — /*                               │
 * │   Fetch from back end API                                  │
 * │                                                            │
 * │   Crafted by Iong, guided by Albatross                     │
 * └────────────────────────────────────────────────────────────┘
 */

import express from 'express';
const router = express.Router();

// GET "/" — Main search page
router.get('/', (req, res) => {
  res.render('main', { 
    query: "",
    mode: "natural", 
    expansion: false, 
    limit: 100, 
    results: []
  });
});

// POST "/" — Handle search form
router.post('/', async (req, res) => {
  const { query, mode, expansion, limit } = req.body;

  console.log('query =', query, ", mode =", mode, ", expansion =", expansion, ", limit =", limit)
  res.render('main', { 
    query,
    mode, 
    expansion, 
    limit, 
    results: sample
  });
  // let results = []
  // try {
  //   const response = await fetch('/api/v1/image/search', {
  //     method: 'GET',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ query, mode, expansion })
  //   });

  //   results = await response.json();
  // } catch (err) {
  //   console.error('Search error:', err);
  // }

  // res.render('main', { 
  //   query,
  //   mode, 
  //   expansion, 
  //   results
  // });
});

// POST "/export" — Handle export action
router.post('/export', (req, res) => {
  const { selected } = req.body;
  // Placeholder: await your instructions
  res.send(`Exporting images: ${selected}`);
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