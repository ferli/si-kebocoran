// Laporan Kebocoran PDAM Form LogicHandler
// Handles form submission, GPS location, Map Picker, and photo upload

const API_URL = '/api/laporan';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('laporForm');
  const getLocationBtn = document.getElementById('getLocationBtn');
  const locationStatus = document.getElementById('locationStatus');
  const fotoInput = document.getElementById('foto');
  const photoPreview = document.getElementById('photoPreview');
  const submitBtn = document.getElementById('submitBtn');
  const successMessage = document.getElementById('successMessage');
  const ticketNumber = document.getElementById('ticketNumber');

  // Map Handler Variables
  let map, marker;
  const openMapBtn = document.getElementById('openMapBtn');
  const mapContainer = document.getElementById('mapContainer');

  // 1. Map Toggle Handler
  if (openMapBtn) {
    openMapBtn.addEventListener('click', () => {
      mapContainer.classList.remove('hidden');
      initMap();
    });
  }

  // 2. Map Initialization Logic
  function initMap(lat = -6.200000, lng = 106.816666) {
    if (map) {
      map.invalidateSize();
      return;
    }

    // Use current input or default
    const startLat = document.getElementById('latitude').value || lat;
    const startLng = document.getElementById('longitude').value || lng;

    map = L.map('map').setView([startLat, startLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(map);

    marker = L.marker([startLat, startLng], { draggable: true }).addTo(map);

    // Update inputs when marker is dragged
    marker.on('dragend', function (e) {
      const position = marker.getLatLng();
      updateLocationInputs(position.lat, position.lng, '📌 Lokasi dari Peta');
    });

    // Tap on map to move marker
    map.on('click', function (e) {
      marker.setLatLng(e.latlng);
      updateLocationInputs(e.latlng.lat, e.latlng.lng, '📌 Lokasi dari Peta');
    });
  }

  // 3. Helper to Update Hidden Inputs & UI
  function updateLocationInputs(lat, lng, statusMsg, accuracy) {
    document.getElementById('latitude').value = lat;
    document.getElementById('longitude').value = lng;

    const accStr = accuracy && accuracy < 1000 ? `(Akurasi: ±${Math.round(accuracy)}m)` : '';
    locationStatus.innerHTML = `✅ ${statusMsg} ${accStr}<br><a href="https://maps.google.com/?q=${lat},${lng}" target="_blank" class="map-link">Lihat di Peta</a>`;
    locationStatus.className = 'location-status success';
    getLocationBtn.textContent = '✅ Lokasi Tersimpan';
    getLocationBtn.disabled = false;
  }

  // 4. GPS Location Handler
  getLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showError('❌ GPS tidak didukung. Gunakan pilihan peta.');
      return;
    }

    locationStatus.textContent = '📍 Sedang mencari titik lokasi...';
    locationStatus.className = 'location-status';
    getLocationBtn.disabled = true;

    const optionsHighAccuracy = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
    const optionsLowAccuracy = { enableHighAccuracy: false, timeout: 10000, maximumAge: 0 };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => {
        // Fallback Strategy
        if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
          locationStatus.textContent = '⚠️ Sinyal lemah, mencoba mode hemat daya...';
          navigator.geolocation.getCurrentPosition(
            onSuccess,
            (fallbackError) => handleGeoError(fallbackError, true),
            optionsLowAccuracy
          );
        } else {
          handleGeoError(error, false);
        }
      },
      optionsHighAccuracy
    );
  });

  function onSuccess(position) {
    const { latitude, longitude, accuracy } = position.coords;

    // Update Inputs
    updateLocationInputs(latitude, longitude, 'Lokasi GPS', accuracy);

    // Sync Map if Open
    if (map && marker) {
      const newLatLng = new L.LatLng(latitude, longitude);
      marker.setLatLng(newLatLng);
      map.setView(newLatLng, 17);
    }
  }

  function handleGeoError(error, isFallback) {
    let message = '❌ Gagal mendapatkan lokasi';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        message = '❌ Izin lokasi ditolak. Mohon gunakan "Pilih di Peta".';
        break;
      case error.POSITION_UNAVAILABLE:
        message = '❌ Sinyal GPS hilang. Mohon gunakan "Pilih di Peta".';
        break;
      case error.TIMEOUT:
        message = '❌ Waktu habis. Mohon gunakan "Pilih di Peta".';
        break;
      default:
        message = `❌ Error GPS: ${error.message}`;
    }
    showError(message);
    // Optional: Auto open map? No, let user choose.
  }

  function showError(msg) {
    locationStatus.textContent = msg;
    locationStatus.className = 'location-status error';
    getLocationBtn.disabled = false;
    getLocationBtn.textContent = '📍 Coba Lagi';
  }

  // 5. Photo Preview Handler
  fotoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        photoPreview.innerHTML = `<img src="${event.target.result}" alt="Preview foto">`;
      };
      reader.readAsDataURL(file);
    } else {
      photoPreview.innerHTML = '';
    }
  });

  // 6. Form Submission Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="loading"></span> Mengirim...';

    try {
      const formData = new FormData(form);

      // Convert foto to base64 if exists
      const fotoFile = fotoInput.files[0];
      if (fotoFile) {
        const base64 = await fileToBase64(fotoFile);
        formData.set('foto', base64);
      }

      // Convert FormData to JSON
      const data = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        form.classList.add('hidden');
        successMessage.classList.remove('hidden');
        ticketNumber.textContent = result.ticketId || 'LPR-' + Date.now();
      } else {
        throw new Error(result.error || 'Gagal mengirim laporan');
      }
    } catch (error) {
      alert('Error: ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = '📤 Kirim Laporan';
    }
  });
});

// Helper: Convert file to base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
