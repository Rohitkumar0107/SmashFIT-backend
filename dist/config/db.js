"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
    user: process.env.PG_USER || 'neondb_owner',
    host: process.env.PG_HOST || 'ep-odd-smoke-a1580om4-pooler.ap-southeast-1.aws.neon.tech',
    database: process.env.PG_DATABASE || 'neondb',
    password: process.env.PG_PASSWORD || 'npg_WThf9G1QIbpm',
    port: Number(process.env.PG_PORT) || 5432,
    ssl: {
        rejectUnauthorized: false // Often needed for cloud providers like Neon
    }
});
exports.default = pool;
// const { Pool } = require('pg');
// const pool = new Pool({
//     connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_WThf9G1QIbpm@ep-odd-smoke-a1580om4-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require',
// });
// module.exports = pool;
