// app.js
import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import indexRouter from './routes/index.js';
import apiRouter from './routes/api.js';
import { cleanupTempFolders } from './utils.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.use('/', indexRouter);
app.use('/api/v1/image', apiRouter);
app.use((req, res) => {
  res.status(404).render('404');
});

// 🌿 Ritual sweep before the archive awakens
await cleanupTempFolders();

// Start server
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
} ).on('error', (error) => {
  throw new Error(error.message)
} );

process.on('SIGINT', async () => {
  console.log('Caught Ctrl+C (SIGINT). Cleaning up...');
  // Perform cleanup here (e.g., close DB, stop server)
  process.exit(0); // Exit gracefully
});

/*
   Favicon Generators
   https://favicon.io/
*/