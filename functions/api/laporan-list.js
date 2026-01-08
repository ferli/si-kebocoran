// SI-KEBOCORAN API: List Laporan (Admin)
// GET /api/laporan-list

export async function onRequestGet(context) {
    const { request, env } = context;

    try {
        const url = new URL(request.url);
        const statusFilter = url.searchParams.get('status');

        // Get stats
        const statsResult = await env.DB.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'baru' THEN 1 ELSE 0 END) as baru,
        SUM(CASE WHEN status = 'proses' THEN 1 ELSE 0 END) as proses,
        SUM(CASE WHEN status = 'selesai' THEN 1 ELSE 0 END) as selesai
      FROM laporan
    `).first();

        // Build query
        let query = 'SELECT * FROM laporan';
        const params = [];

        if (statusFilter) {
            query += ' WHERE status = ?';
            params.push(statusFilter);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        // Execute query
        const stmt = env.DB.prepare(query);
        const result = params.length > 0
            ? await stmt.bind(...params).all()
            : await stmt.all();

        return new Response(JSON.stringify({
            stats: {
                total: statsResult.total || 0,
                baru: statsResult.baru || 0,
                proses: statsResult.proses || 0,
                selesai: statsResult.selesai || 0
            },
            laporan: result.results || []
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({
            error: 'Gagal memuat data'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
