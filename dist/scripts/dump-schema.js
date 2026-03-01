"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = __importDefault(require("../config/db"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dumpSchema = () => __awaiter(void 0, void 0, void 0, function* () {
    const tables = yield db_1.default.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='sm' ORDER BY table_name`);
    let ddl = '-- ═══════════════════════════════════════════════════\n';
    ddl += '-- SmashFIT Production Database Schema\n';
    ddl += '-- Generated: ' + new Date().toISOString() + '\n';
    ddl += '-- ═══════════════════════════════════════════════════\n\n';
    ddl += 'CREATE SCHEMA IF NOT EXISTS sm;\n\n';
    ddl += '-- Enable UUID extension\n';
    ddl += 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";\n\n';
    for (const t of tables.rows) {
        const tname = t.table_name;
        const cols = yield db_1.default.query(`
      SELECT column_name, data_type, udt_name, character_maximum_length, 
             is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_schema='sm' AND table_name=$1 
      ORDER BY ordinal_position
    `, [tname]);
        const pk = yield db_1.default.query(`
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='sm' AND tc.table_name=$1 AND tc.constraint_type='PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    `, [tname]);
        const fks = yield db_1.default.query(`
      SELECT kcu.column_name, ccu.table_name AS ref_table, ccu.column_name AS ref_column,
             rc.delete_rule, rc.update_rule
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
      WHERE tc.table_schema='sm' AND tc.table_name=$1 AND tc.constraint_type='FOREIGN KEY'
    `, [tname]);
        const uqs = yield db_1.default.query(`
      SELECT tc.constraint_name, array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
      WHERE tc.table_schema='sm' AND tc.table_name=$1 AND tc.constraint_type='UNIQUE'
      GROUP BY tc.constraint_name
    `, [tname]);
        ddl += `-- ───────────────────────────────────────\n`;
        ddl += `CREATE TABLE IF NOT EXISTS sm.${tname} (\n`;
        const colDefs = [];
        const pkCols = pk.rows.map((r) => r.column_name);
        for (const c of cols.rows) {
            let colType = '';
            if (c.udt_name === 'uuid')
                colType = 'UUID';
            else if (c.udt_name === 'int4')
                colType = 'INTEGER';
            else if (c.udt_name === 'int8')
                colType = 'BIGINT';
            else if (c.udt_name === 'float8')
                colType = 'DOUBLE PRECISION';
            else if (c.udt_name === 'numeric')
                colType = 'NUMERIC';
            else if (c.udt_name === 'bool')
                colType = 'BOOLEAN';
            else if (c.udt_name === 'text')
                colType = 'TEXT';
            else if (c.udt_name === 'jsonb')
                colType = 'JSONB';
            else if (c.udt_name === 'json')
                colType = 'JSON';
            else if (c.udt_name === 'date')
                colType = 'DATE';
            else if (c.udt_name === 'timestamp')
                colType = 'TIMESTAMP';
            else if (c.udt_name === 'timestamptz')
                colType = 'TIMESTAMPTZ';
            else if (c.udt_name === 'varchar')
                colType = c.character_maximum_length ? `VARCHAR(${c.character_maximum_length})` : 'VARCHAR(255)';
            else
                colType = c.data_type.toUpperCase();
            let def = `  ${c.column_name} ${colType}`;
            if (c.column_default) {
                let defaultVal = c.column_default;
                if (defaultVal.includes('gen_random_uuid'))
                    defaultVal = 'gen_random_uuid()';
                else if (defaultVal.includes('now()') || defaultVal.includes('CURRENT_TIMESTAMP'))
                    defaultVal = 'NOW()';
                def += ` DEFAULT ${defaultVal}`;
            }
            if (c.is_nullable === 'NO')
                def += ' NOT NULL';
            colDefs.push(def);
        }
        if (pkCols.length > 0) {
            colDefs.push(`  PRIMARY KEY (${pkCols.join(', ')})`);
        }
        for (const fk of fks.rows) {
            let fkDef = `  FOREIGN KEY (${fk.column_name}) REFERENCES sm.${fk.ref_table}(${fk.ref_column})`;
            if (fk.delete_rule !== 'NO ACTION')
                fkDef += ` ON DELETE ${fk.delete_rule}`;
            if (fk.update_rule !== 'NO ACTION')
                fkDef += ` ON UPDATE ${fk.update_rule}`;
            colDefs.push(fkDef);
        }
        for (const uq of uqs.rows) {
            colDefs.push(`  UNIQUE (${uq.columns.join(', ')})`);
        }
        ddl += colDefs.join(',\n');
        ddl += '\n);\n\n';
    }
    // Indexes
    const indexes = yield db_1.default.query(`
    SELECT indexname, indexdef 
    FROM pg_indexes 
    WHERE schemaname='sm' 
    AND indexname NOT LIKE '%_pkey'
    ORDER BY tablename, indexname
  `);
    if (indexes.rows.length > 0) {
        ddl += '-- ═══════════════════════════════════════════════════\n';
        ddl += '-- INDEXES\n';
        ddl += '-- ═══════════════════════════════════════════════════\n\n';
        for (const idx of indexes.rows) {
            ddl += idx.indexdef + ';\n';
        }
    }
    // Seed roles
    ddl += '\n-- ═══════════════════════════════════════════════════\n';
    ddl += '-- DEFAULT ROLES\n';
    ddl += '-- ═══════════════════════════════════════════════════\n\n';
    const roles = yield db_1.default.query(`SELECT * FROM sm.roles ORDER BY id`);
    for (const r of roles.rows) {
        ddl += `INSERT INTO sm.roles (id, name, description) VALUES (${r.id}, '${r.name}', '${r.description || ''}') ON CONFLICT (id) DO NOTHING;\n`;
    }
    const outPath = path.resolve(__dirname, '..', '..', 'schema.sql');
    fs.writeFileSync(outPath, ddl, 'utf8');
    console.log(`\n✅ Schema written to: ${outPath}`);
    console.log(`   Tables: ${tables.rows.length}`);
    console.log(`   Indexes: ${indexes.rows.length}`);
    yield db_1.default.end();
});
dumpSchema();
