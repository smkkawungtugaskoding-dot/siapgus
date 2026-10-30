import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { createInitialDatabase } from './src/storage/defaultData';
import { AppDatabase } from './src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High payload limit for school logo and bulk records
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Persistent Server-side Database Storage
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory cached database synced with disk
let serverDatabase: AppDatabase;

function loadDatabaseFromDisk(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && parsed.users && parsed.profile) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading database from disk, fallback to initial database:', err);
  }

  // Initialize with complete initial dataset
  const initial = createInitialDatabase();
  saveDatabaseToDisk(initial);
  return initial;
}

function saveDatabaseToDisk(db: AppDatabase): void {
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Error saving database to disk:', err);
  }
}

// Load database on server boot
serverDatabase = loadDatabaseFromDisk();

// ---------------- REST API ENDPOINTS ----------------

// 1. Health & Server Info
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'online',
    app: 'SiApgus - Sistem Aplikasi Guru Sekolah',
    version: '1.0.0',
    serverTime: new Date().toISOString(),
    totalUsers: serverDatabase.users?.length || 0,
    totalSiswa: serverDatabase.siswa?.length || 0,
    totalGuru: serverDatabase.guru?.length || 0,
  });
});

// 2. Fetch Centralized Database (Accessible by all users and devices)
app.get('/api/database', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.json({
    status: 'success',
    data: serverDatabase,
    serverTime: new Date().toISOString(),
  });
});

// 3. Save / Update Centralized Database
app.post('/api/database', (req, res) => {
  try {
    const incomingData = req.body;
    if (!incomingData || !incomingData.users || !incomingData.profile) {
      return res.status(400).json({
        status: 'error',
        message: 'Data payload tidak valid. Harus menyertakan objek profil dan pengguna.',
      });
    }

    serverDatabase = incomingData as AppDatabase;
    saveDatabaseToDisk(serverDatabase);

    return res.json({
      status: 'success',
      message: 'Database server berhasil diperbarui secara permanen.',
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('API /api/database save error:', err);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Gagal menyimpan database server.',
    });
  }
});

// 4. Reset to Initial Seed Database
app.post('/api/database/reset', (_req, res) => {
  serverDatabase = createInitialDatabase();
  saveDatabaseToDisk(serverDatabase);
  res.json({
    status: 'success',
    message: 'Database berhasil direset ke pengaturan awal.',
    data: serverDatabase,
  });
});

// 5. Download / View Google Apps Script files
app.get(['/Code.gs', '/api/code-gs'], (_req, res) => {
  const filePath = path.join(__dirname, 'Code.gs');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Code.gs not found');
  }
});

app.get(['/Index.html', '/api/index-html'], (_req, res) => {
  const filePath = path.join(__dirname, 'Index.html');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(filePath);
  } else {
    res.status(404).send('Index.html not found');
  }
});

// ---------------- VITE & STATIC FILES ----------------
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    // Development mode: Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built dist
    const distPath = path.join(__dirname, 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SiApgus Server] Server aktif dan melayani database di port ${PORT}`);
  });
}

startServer();
