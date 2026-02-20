const { pool } = require('./config/db');

async function test() {
    try {
        const [rows] = await pool.query("SELECT event_date FROM calendar_events ORDER BY id DESC LIMIT 1");
        console.log("Raw from DB using new config:", rows[0]);
        console.log("Type of event_date:", typeof rows[0].event_date);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

test();
