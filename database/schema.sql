-- SI-KEBOCORAN Database Schema
-- Cloudflare D1 (SQLite)

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

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_laporan_status ON laporan(status);

-- Index for ordering by date
CREATE INDEX IF NOT EXISTS idx_laporan_created ON laporan(created_at DESC);
