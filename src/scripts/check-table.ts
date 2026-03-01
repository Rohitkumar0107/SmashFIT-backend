import pool from '../config/db';
const check = async () => {
    const r = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema='sm' AND table_name='tournament_categories' ORDER BY ordinal_position`);
    console.log(JSON.stringify(r.rows, null, 2));
    await pool.end();
};
check();
