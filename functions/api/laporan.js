// SI-KEBOCORAN API: Submit Laporan
// POST /api/laporan

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { nama, telepon, alamat, deskripsi, latitude, longitude, foto } = body;

        // Validation
        if (!nama || !telepon || !alamat) {
            return new Response(JSON.stringify({
                error: 'Nama, telepon, dan alamat wajib diisi'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Store foto as data URL for simplicity (production: use R2)
        const foto_url = foto || null;

        // Insert into database
        const result = await env.DB.prepare(`
      INSERT INTO laporan (nama, telepon, alamat, deskripsi, latitude, longitude, foto_url)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
            nama,
            telepon,
            alamat,
            deskripsi || null,
            latitude || null,
            longitude || null,
            foto_url
        ).run();

        const ticketId = `LPR-${String(result.meta.last_row_id).padStart(5, '0')}`;

        // Send WhatsApp notification (optional)
        if (env.WA_WEBHOOK_URL) {
            try {
                await sendWhatsAppNotification(env.WA_WEBHOOK_URL, {
                    ticketId,
                    nama,
                    alamat,
                    latitude,
                    longitude
                });
            } catch (e) {
                console.error('WhatsApp notification failed:', e);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            ticketId,
            id: result.meta.last_row_id
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
            error: 'Gagal menyimpan laporan'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

async function sendWhatsAppNotification(webhookUrl, data) {
    const message = `🚨 *LAPORAN KEBOCORAN BARU*\n\n` +
        `📋 No: ${data.ticketId}\n` +
        `👤 Pelapor: ${data.nama}\n` +
        `📍 Lokasi: ${data.alamat}\n` +
        (data.latitude && data.longitude
            ? `🗺️ Map: https://maps.google.com/?q=${data.latitude},${data.longitude}\n`
            : '') +
        `\nSegera tindaklanjuti!`;

    await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
    });
}
