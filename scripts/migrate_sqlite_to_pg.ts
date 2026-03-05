import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();
const sqlitePath = 'C:/Users/HP/AntiGravity/suivi_caution/suivi_caution.db';

async function main() {
    console.log('Connecting to SQLite database:', sqlitePath);
    const sqlite = new Database(sqlitePath, { readonly: true });

    // Function to migrate a list of rows from SQLite to Postgres
    const runMigration = async (tableName: string, modelName: string, idField: string) => {
        try {
            const rows: any[] = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
            console.log(`Found ${rows.length} rows in ${tableName}. Migrating...`);

            let count = 0;
            for (const row of rows) {
                // Convert timestamp numbers or valid string dates into JS Date objects
                for (const key of Object.keys(row)) {
                    // Convert only fields that are explicitly defined as DateTime in Prisma schema
                    const isDateTimeField = ['created_at', 'updated_at', 'imported_at', 'date_cheqq'].includes(key) ||
                        (tableName === 'cheque_details' && ['date_cheque', 'date_cloture'].includes(key));

                    if (isDateTimeField && row[key] !== null) {
                        row[key] = new Date(row[key]);
                    }
                }

                try {
                    await (prisma as any)[modelName].create({ data: row });
                    count++;
                } catch (e: any) {
                    if (e.code === 'P2002') {
                        // Ignore, already imported
                    } else {
                        console.error(`Error row in ${tableName}:`, e.message);
                    }
                }
            }
            console.log(`Copied ${count} rows into ${tableName}.`);

            // Sync Postgres sequence (so autoincrement ID works nicely next time)
            if (rows.length > 0 && idField !== 'num_dispo_cheque') { // num_dispo_cheque doesn't have a sequence
                try {
                    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('${tableName}', '${idField}'), COALESCE(max(${idField}), 1), max(${idField}) IS NOT NULL) FROM ${tableName};`);
                } catch (e: any) {
                    console.log(`Warning: Could not sync sequence for ${tableName}.`);
                }
            }
        } catch (err: any) {
            console.error(`Error reading ${tableName} from SQLite:`, err.message);
        }
    }

    await runMigration('users', 'users', 'id');
    await runMigration('clients', 'clients', 'id_client');
    await runMigration('transitaires', 'transitaires', 'id_transitaire');
    await runMigration('partenaires', 'partenaires', 'id_partenaire');
    await runMigration('dossiers_caution', 'dossiers_caution', 'id');
    await runMigration('cheques_emis', 'cheques_emis', 'id');
    await runMigration('cheque_disponible', 'cheque_disponible', 'num_dispo_cheque');
    await runMigration('cheque_details', 'cheque_details', 'id');
    await runMigration('facture_dmdt', 'facture_dmdt', 'id');

    console.log('Migration completed successfully!');
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
});
