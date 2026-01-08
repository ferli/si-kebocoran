// SI-KEBOCORAN Form Handler
// Handles form submission, GPS location, and photo upload

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

  // GPS Location Handler
  getLocationBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      locationStatus.textContent = '❌ Browser tidak mendukung GPS';
      locationStatus.className = 'location-status error';
      return;
    }

    locationStatus.textContent = '📍 Mengambil lokasi...';
    locationStatus.className = 'location-status';
    getLocationBtn.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        document.getElementById('latitude').value = latitude;
        document.getElementById('longitude').value = longitude;
        
        locationStatus.innerHTML = `✅ Lokasi ditemukan: <a href="https://maps.google.com/?q=${latitude},${longitude}" target="_blank">${latitude.toFixed(6)}, ${longitude.toFixed(6)}</a>`;
        locationStatus.className = 'location-status success';
        getLocationBtn.textContent = '✅ Lokasi Didapat';
      },
      (error) => {
        let message = '❌ Gagal mendapatkan lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = '❌ Izin lokasi ditolak';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '❌ Lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            message = '❌ Waktu habis';
            break;
        }
        locationStatus.textContent = message;
        locationStatus.className = 'location-status error';
        getLocationBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });

  // Photo Preview Handler
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

  // Form Submission Handler
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
