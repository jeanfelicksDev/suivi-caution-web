/**
 * backup_script.js
 * Sauvegarde complète de la base Neon PostgreSQL en fichier SQL local.
 * Usage : node SaveDB/backup_script.js
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL =
    'postgresql://neondb_owner:npg_VmsL9fEQ6pZj@ep-jolly-recipe-aldunwcu-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require';

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const ts = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
const outFile = path.join(__dirname, `backup_${ts}.sql`);

async function main() {
    const client = new Client({ connectionString: DATABASE_URL });
    await client.connect();
    console.log('✅ Connecté à la base Neon');

    let sql = '';
    sql += `-- Sauvegarde Suivi-Caution-Web\n`;
    sql += `-- Date : ${now.toISOString()}\n`;
    sql += `-- Base  : neondb (Neon PostgreSQL)\n\n`;
    sql += `SET client_encoding = 'UTF8';\n`;
    sql += `SET standard_conforming_strings = on;\n\n`;

    // Récupérer toutes les tables du schéma public
    const tablesRes = await client.query(`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY tablename;
    `);
    const tables = tablesRes.rows.map(r => r.tablename);
    console.log(`📋 Tables trouvées : ${tables.join(', ')}`);

    for (const table of tables) {
        console.log(`  📤 Export de la table "${table}"...`);

        // Colonnes
        const colRes = await client.query(`
            SELECT column_name, data_type, character_maximum_length,
                   is_nullable, column_default, ordinal_position
            FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = $1
            ORDER BY ordinal_position;
        `, [table]);

        // CREATE TABLE
        sql += `-- ──────────────────────────────────────────\n`;
        sql += `-- Table : ${table}\n`;
        sql += `-- ──────────────────────────────────────────\n`;

        // DATA : INSERT statements
        const dataRes = await client.query(`SELECT * FROM "${table}"`);
        if (dataRes.rows.length === 0) {
            sql += `-- (table vide)\n\n`;
            continue;
        }

        const cols = colRes.rows.map(c => `"${c.column_name}"`).join(', ');
        sql += `-- ${dataRes.rows.length} ligne(s)\n`;

        for (const row of dataRes.rows) {
            const values = colRes.rows.map(c => {
                const val = row[c.column_name];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'number' || typeof val === 'boolean') return String(val);
                if (val instanceof Date) return `'${val.toISOString()}'`;
                // Escape single quotes
                return `'${String(val).replace(/'/g, "''")}'`;
            }).join(', ');
            sql += `INSERT INTO "${table}" (${cols}) VALUES (${values});\n`;
        }
        sql += '\n';
    }

    await client.end();

    fs.writeFileSync(outFile, sql, 'utf8');
    const sizeMB = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2);
    console.log(`\n✅ Sauvegarde terminée !`);
    console.log(`📁 Fichier : ${outFile}`);
    console.log(`📦 Taille  : ${sizeMB} MB`);
}

main().catch(err => {
    console.error('❌ Erreur :', err.message);
    process.exit(1);
});
