// Laporan Kebocoran PDAM Admin Dashboard
// Handles listing, filtering, and updating reports

const API_URL = '/api/laporan';
let currentLaporanId = null;
let laporanData = []; // Store data globally

document.addEventListener('DOMContentLoaded', () => {
  loadLaporan();

  document.getElementById('refreshBtn').addEventListener('click', loadLaporan);
  document.getElementById('filterStatus').addEventListener('change', loadLaporan);
  document.getElementById('updateBtn').addEventListener('click', updateStatus);

  // Explicit close handler
  const closeBtn = document.querySelector('.modal-close');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
});

async function loadLaporan() {
  const listEl = document.getElementById('laporanList');
  const filter = document.getElementById('filterStatus').value;

  listEl.innerHTML = '<div class="loading-placeholder">Memuat data...</div>';

  try {
    let url = API_URL + '-list';
    if (filter) url += `?status=${filter}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) throw new Error(data.error);

    // Update global state
    laporanData = data.laporan || [];

    updateStats(data.stats || {});
    renderList(laporanData);
  } catch (error) {
    listEl.innerHTML = `<div class="loading-placeholder">❌ Error: ${error.message}</div>`;
  }
}

function updateStats(stats) {
  document.getElementById('totalLaporan').textContent = stats.total || 0;
  document.getElementById('laporanBaru').textContent = stats.baru || 0;
  document.getElementById('laporanProses').textContent = stats.proses || 0;
  document.getElementById('laporanSelesai').textContent = stats.selesai || 0;
}

function renderList(laporan) {
  const listEl = document.getElementById('laporanList');

  if (laporan.length === 0) {
    listEl.innerHTML = '<div class="loading-placeholder">Tidak ada laporan</div>';
    return;
  }

  listEl.innerHTML = laporan.map(item => `
    <div class="laporan-card" onclick="showDetail(${item.id})">
      <div class="laporan-header">
        <span class="laporan-id">LPR-${String(item.id).padStart(5, '0')}</span>
        <span class="laporan-time">${formatDate(item.created_at)}</span>
      </div>
      <div class="laporan-alamat">${escapeHtml(item.alamat)}</div>
      <div class="laporan-footer">
        <span class="laporan-pelapor">👤 ${escapeHtml(item.nama)}</span>
        <span class="status-badge status-${item.status}">${getStatusLabel(item.status)}</span>
      </div>
      ${getSLABadge(item.created_at, item.status)}
    </div>
  `).join('');
}

// Made global so it can be called from onclick
window.showDetail = function (id) {
  console.log(`Open detail for ID: ${id} (type: ${typeof id})`);

  // Use loose equality to match string IDs from HTML attributes with number IDs from JSON
  const item = laporanData.find(l => l.id == id);

  if (!item) {
    console.error('Laporan not found for ID:', id);
    alert('Error: Data laporan tidak ditemukan.');
    return;
  }

  console.log('Found item:', item);

  currentLaporanId = item.id;
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  const statusSelect = document.getElementById('updateStatus');

  if (statusSelect) {
    statusSelect.value = item.status;
  }

  let locationHtml = '-';
  if (item.latitude && item.longitude) {
    locationHtml = `<a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank">📍 Lihat di Peta</a>`;
  }

  let fotoHtml = '';
  if (item.foto_url) {
    fotoHtml = `<div class="detail-foto"><img src="${item.foto_url}" alt="Foto kebocoran"></div>`;
  }

  // Ensure safe access to properties
  const safeNama = escapeHtml(item.nama) || '-';
  const safeTelepon = item.telepon || '-';
  const safeAlamat = escapeHtml(item.alamat) || '-';
  const safeDeskripsi = escapeHtml(item.deskripsi) || '-';
  const safeId = String(item.id).padStart(5, '0');

  body.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">Nomor Laporan</div>
      <div class="detail-value">LPR-${safeId}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Nama Pelapor</div>
      <div class="detail-value">${safeNama}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Telepon</div>
      <div class="detail-value"><a href="tel:${safeTelepon}">${safeTelepon}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Alamat</div>
      <div class="detail-value">${safeAlamat}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Deskripsi</div>
      <div class="detail-value">${safeDeskripsi}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Lokasi GPS</div>
      <div class="detail-value">${locationHtml}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Waktu Lapor</div>
      <div class="detail-value">${formatDate(item.created_at)}</div>
    </div>
    ${fotoHtml}
  `;

  modal.classList.remove('hidden');
}

function closeModal() {
  document.getElementById('detailModal').classList.add('hidden');
  currentLaporanId = null;
}

async function updateStatus() {
  console.log('Update status clicked for ID:', currentLaporanId);
  if (!currentLaporanId) {
    console.warn('No current text ID');
    return;
  }

  const newStatus = document.getElementById('updateStatus').value;
  const btn = document.getElementById('updateBtn');

  console.log(`Updating ID ${currentLaporanId} to status ${newStatus}`);

  btn.disabled = true;
  btn.textContent = 'Menyimpan...';

  try {
    const response = await fetch(API_URL + '-update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: currentLaporanId, status: newStatus })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error);
    }

    console.log('Update success');
    closeModal();
    loadLaporan();
  } catch (error) {
    console.error('Update failed:', error);
    alert('Error: ' + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Perbarui Status';
  }
}

// Helpers
function getStatusLabel(status) {
  const labels = {
    baru: '🔴 Baru',
    proses: '🟡 Diproses',
    selesai: '🟢 Selesai',
    ditolak: '⚫ Ditolak'
  };
  return labels[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function getSLABadge(dateStr, status) {
  if (status === 'selesai' || status === 'ditolak' || !dateStr) return '';

  const created = new Date(dateStr);
  const now = new Date();
  const diffHours = (now - created) / (1000 * 60 * 60);

  if (diffHours > 4) {
    return `<div class="sla-badge critical">🔥 Telat > 4 Jam</div>`;
  } else if (diffHours > 1) {
    return `<div class="sla-badge warning">⚠️ > 1 Jam</div>`;
  }
  return '';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Close modal on background click
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target.id === 'detailModal') closeModal();
});
