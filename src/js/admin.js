// SI-KEBOCORAN Admin Dashboard
// Handles listing, filtering, and updating reports

const API_URL = '/api/laporan';
let currentLaporanId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadLaporan();

    document.getElementById('refreshBtn').addEventListener('click', loadLaporan);
    document.getElementById('filterStatus').addEventListener('change', loadLaporan);
    document.getElementById('updateBtn').addEventListener('click', updateStatus);
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

        updateStats(data.stats || {});
        renderList(data.laporan || []);
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
    <div class="laporan-card" onclick="showDetail(${JSON.stringify(item).replace(/"/g, '&quot;')})">
      <div class="laporan-header">
        <span class="laporan-id">LPR-${String(item.id).padStart(5, '0')}</span>
        <span class="laporan-time">${formatDate(item.created_at)}</span>
      </div>
      <div class="laporan-alamat">${escapeHtml(item.alamat)}</div>
      <div class="laporan-footer">
        <span class="laporan-pelapor">👤 ${escapeHtml(item.nama)}</span>
        <span class="status-badge status-${item.status}">${getStatusLabel(item.status)}</span>
      </div>
    </div>
  `).join('');
}

function showDetail(item) {
    currentLaporanId = item.id;
    const modal = document.getElementById('detailModal');
    const body = document.getElementById('modalBody');
    const statusSelect = document.getElementById('updateStatus');

    statusSelect.value = item.status;

    let locationHtml = '-';
    if (item.latitude && item.longitude) {
        locationHtml = `<a href="https://maps.google.com/?q=${item.latitude},${item.longitude}" target="_blank">📍 Lihat di Peta</a>`;
    }

    let fotoHtml = '';
    if (item.foto_url) {
        fotoHtml = `<div class="detail-foto"><img src="${item.foto_url}" alt="Foto kebocoran"></div>`;
    }

    body.innerHTML = `
    <div class="detail-row">
      <div class="detail-label">Nomor Laporan</div>
      <div class="detail-value">LPR-${String(item.id).padStart(5, '0')}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Nama Pelapor</div>
      <div class="detail-value">${escapeHtml(item.nama)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Telepon</div>
      <div class="detail-value"><a href="tel:${item.telepon}">${item.telepon}</a></div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Alamat</div>
      <div class="detail-value">${escapeHtml(item.alamat)}</div>
    </div>
    <div class="detail-row">
      <div class="detail-label">Deskripsi</div>
      <div class="detail-value">${escapeHtml(item.deskripsi || '-')}</div>
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
    if (!currentLaporanId) return;

    const newStatus = document.getElementById('updateStatus').value;
    const btn = document.getElementById('updateBtn');

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

        closeModal();
        loadLaporan();
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Perbarui Status';
    }
}

// Helpers
function getStatusLabel(status) {
    const labels = { baru: '🔴 Baru', proses: '🟡 Diproses', selesai: '🟢 Selesai' };
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
