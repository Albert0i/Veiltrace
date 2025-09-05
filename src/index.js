/**
 * ┌────────────────────────────────────────────────────────────┐
 * │                                                            │
 * │   Veiltrace: Express Entry Point                           │
 * │                                                            │
 * │   Breathes form data, JSON, cookies, and symbolic routes   │
 * │   Crafted by Iong, guided by Albatross                     │
 * │                                                            │
 * └────────────────────────────────────────────────────────────┘
 */

import 'dotenv/config'
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import apiRoutes from './routes/api.js';
import viewRoutes from './routes/view.js';

dotenv.config();
const app = express();

// ─── Middleware Rituals ────────────────────────────────────────
app.use(express.urlencoded({ extended: true })); // Handles form POSTs
app.use(express.json());                         // Handles JSON POSTs
app.use(cookieParser());                         // Parses cookies

// ─── Static & View Setup ───────────────────────────────────────
app.use(express.static(path.join(process.cwd(), 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'views'));

// ─── Route Mounting ────────────────────────────────────────────
app.use('/api/v1/img', apiRoutes); // Backend API routes
app.use('/img', viewRoutes);       // Frontend EJS routes

// ─── Root Redirect or Welcome ──────────────────────────────────
app.get('/', (req, res) => {
  res.redirect('/img/search');
});

// ─── Server Start ──────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Veiltrace backend breathing on port ${PORT}`);
});

process.on('SIGINT', async () => {
  console.log('Caught Ctrl+C (SIGINT). Cleaning up...');
  // Perform cleanup here (e.g., close DB, stop server)
  process.exit(0); // Exit gracefully
});
