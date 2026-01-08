const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || 'local-database.sqlite';

// Initialize Database
const db = new Database(DB_PATH);

// Create Table if not exists
db.exec(`
  CREATE TABLE IF NOT EXISTS laporan (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nama TEXT NOT NULL,
    telepon TEXT NOT NULL,
    alamat TEXT NOT NULL,
    deskripsi TEXT,
    latitude REAL,
    longitude REAL,
    foto_url TEXT,
    status TEXT DEFAULT 'baru' CHECK (status IN ('baru', 'proses', 'selesai', 'ditolak')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan(status);
  CREATE INDEX IF NOT EXISTS idx_laporan_created ON laporan(created_at DESC);
`);

console.log(`Database connected at ${DB_PATH}`);

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support large data URLs for photos
app.use(express.static(path.join(__dirname, 'src')));

// API Routes

// 1. Submit Laporan
app.post('/api/laporan', (req, res) => {
    try {
        const { nama, telepon, alamat, deskripsi, latitude, longitude, foto } = req.body;

        if (!nama || !telepon || !alamat) {
            return res.status(400).json({ error: 'Nama, telepon, dan alamat wajib diisi' });
        }

        const stmt = db.prepare(`
            INSERT INTO laporan (nama, telepon, alamat, deskripsi, latitude, longitude, foto_url)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const result = stmt.run(
            nama, telepon, alamat, deskripsi || null, latitude || null, longitude || null, foto || null
        );

        const ticketId = `LPR-${String(result.lastInsertRowid).padStart(5, '0')}`;

        res.status(201).json({
            success: true,
            ticketId,
            id: result.lastInsertRowid
        });
    } catch (error) {
        console.error('Error submit laporan:', error);
        res.status(500).json({ error: 'Gagal menyimpan laporan' });
    }
});

// 2. List Laporan
app.get('/api/laporan-list', (req, res) => {
    try {
        const { status } = req.query;

        // Stats
        const stats = db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'baru' THEN 1 ELSE 0 END) as baru,
                SUM(CASE WHEN status = 'proses' THEN 1 ELSE 0 END) as proses,
                SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai
            FROM laporan
        `).get();

        // Query
        let sql = 'SELECT * FROM laporan';
        if (status) {
            sql += ' WHERE status = ?';
        }
        sql += ' ORDER BY created_at DESC LIMIT 100';

        const rows = status ? db.prepare(sql).all(status) : db.prepare(sql).all();

        res.json({
            stats: {
                total: stats.total || 0,
                baru: stats.baru || 0,
                proses: stats.proses || 0,
                selesai: stats.selesai || 0
            },
            laporan: rows
        });
    } catch (error) {
        console.error('Error list laporan:', error);
        res.status(500).json({ error: 'Gagal memuat data' });
    }
});

// 3. Update Laporan
app.patch('/api/laporan-update', (req, res) => {
    try {
        const { id, status } = req.body;

        if (!id || !status) {
            return res.status(400).json({ error: 'ID dan status wajib diisi' });
        }

        const validStatuses = ['baru', 'proses', 'selesai', 'ditolak'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Status tidak valid' });
        }

        const result = db.prepare(`
            UPDATE laporan 
            SET status = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Laporan tidak ditemukan' });
        }

        res.json({ success: true, id, status });
    } catch (error) {
        console.error('Error update status:', error);
        res.status(500).json({ error: 'Gagal memperbarui status' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log('Serving UI from /src');
});
