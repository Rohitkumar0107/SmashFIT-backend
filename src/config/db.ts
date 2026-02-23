import { Pool } from 'pg'
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    user: process.env.PG_USER ||'postgres',
    host: process.env.PG_HOST||'localhost',
    database:process.env.PG_DATABASE||'SmashitDB',
    password:  process.env.PG_PASSWORD||'root',
    port: Number(process.env.PG_PORT)||5432,
})

export default pool;