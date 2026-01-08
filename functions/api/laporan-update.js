// SI-KEBOCORAN API: Update Laporan Status
// PATCH /api/laporan-update

export async function onRequestPatch(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { id, status } = body;

        // Validation
        if (!id || !status) {
            return new Response(JSON.stringify({
                error: 'ID dan status wajib diisi'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const validStatuses = ['baru', 'proses', 'selesai'];
        if (!validStatuses.includes(status)) {
            return new Response(JSON.stringify({
                error: 'Status tidak valid'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update database
        const result = await env.DB.prepare(`
      UPDATE laporan 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(status, id).run();

        if (result.meta.changes === 0) {
            return new Response(JSON.stringify({
                error: 'Laporan tidak ditemukan'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({
            success: true,
            id,
            status
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
            error: 'Gagal memperbarui status'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
