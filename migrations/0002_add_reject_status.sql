-- Migration: Add 'ditolak' status to laporan table

-- 1. Rename existing table
ALTER TABLE laporan RENAME TO laporan_old;

-- 2. Create new table with updated CHECK constraint
CREATE TABLE laporan (
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

-- 3. Copy data from old table
INSERT INTO laporan (id, nama, telepon, alamat, deskripsi, latitude, longitude, foto_url, status, created_at, updated_at)
SELECT id, nama, telepon, alamat, deskripsi, latitude, longitude, foto_url, status, created_at, updated_at
FROM laporan_old;

-- 4. Drop old table
DROP TABLE laporan_old;

-- 5. Recreate indexes
CREATE INDEX idx_laporan_status ON laporan(status);
CREATE INDEX idx_laporan_created ON laporan(created_at DESC);
