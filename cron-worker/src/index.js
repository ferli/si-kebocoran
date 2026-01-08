export default {
    async scheduled(event, env, ctx) {
        console.log("Running scheduled maintenance: Wiping data...");

        // Wiping the 'laporan' table
        try {
            const result = await env.DB.prepare("DELETE FROM laporan").run();
            console.log(`Deleted ${result.meta.changes} rows from laporan.`);
        } catch (e) {
            console.error("Error wiping data:", e);
        }
    },
};
