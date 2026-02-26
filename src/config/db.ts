import { Pool } from 'pg'
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.PG_USER || 'neondb_owner',
    host: process.env.PG_HOST || 'ep-odd-smoke-a1580om4-pooler.ap-southeast-1.aws.neon.tech',
    database: process.env.PG_DATABASE || 'neondb',
    password: process.env.PG_PASSWORD || 'npg_WThf9G1QIbpm',
    port: Number(process.env.PG_PORT) || 5432,
    ssl: {
        rejectUnauthorized: false // Often needed for cloud providers like Neon
    }
});

export default pool;
