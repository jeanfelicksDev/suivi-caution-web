import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const prisma = new PrismaClient();
const sqlitePath = 'C:/Users/HP/AntiGravity/suivi_caution/suivi_caution.db';

async function main() {
    console.log('Connecting to SQLite database:', sqlitePath);
    const sqlite = new Database(sqlitePath, { readonly: true });

    const runMigration = async (tableName: string, modelName: string, idField: string) => {
        try {
            const rows: any[] = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
            console.log(`Found ${rows.length} rows in ${tableName}. Migrating...`);

            let count = 0;
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                for (const key of Object.keys(row)) {
                    const isDateTimeField = ['created_at', 'updated_at', 'imported_at', 'date_cheqq'].includes(key) ||
                        (tableName === 'cheque_details' && ['date_cheque', 'date_cloture'].includes(key));

                    if (isDateTimeField && row[key] !== null) {
                        row[key] = new Date(row[key]);
                    }
                }

                // Field mappings for dossiers_caution
                if (tableName === 'dossiers_caution') {
                    if (row.type_rembt !== undefined) { row.type_remboursement = row.type_rembt; delete row.type_rembt; }
                    if (row.mandataire_piece_id !== undefined) { row.num_piece_mandataire = row.mandataire_piece_id; delete row.mandataire_piece_id; }
                    if (row.transmis_sce_detention !== undefined) { row.date_trans_sce_detention = row.transmis_sce_detention; delete row.transmis_sce_detention; }
                    if (row.commentaire_trop_percu !== undefined) { row.raison_suspension = row.commentaire_trop_percu; delete row.commentaire_trop_percu; }
                    if (row.nbre_jrs_franchise !== undefined) { row.jours_franchise = row.nbre_jrs_franchise; delete row.nbre_jrs_franchise; }
                    if (row.commentaire_validation !== undefined) { row.commentaire_avoir = row.commentaire_validation; delete row.commentaire_validation; }
                }

                try {
                    await (prisma as any)[modelName].create({ data: row });
                    count++;
                } catch (e: any) {
                    if (e.code === 'P2002') {
                        // Ignore
                    } else {
                        // console.error(`Error row in ${tableName}:`, e.message);
                    }
                }
            }
            console.log(`Copied ${count} rows into ${tableName}.`);

            if (rows.length > 0 && idField !== 'num_dispo_cheque') {
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

    await runMigration('dossiers_caution', 'dossiers_caution', 'id');
    // Also run cheque_details and facture_dmdt in case they failed.
    await runMigration('cheque_details', 'cheque_details', 'id');
    await runMigration('facture_dmdt', 'facture_dmdt', 'id');

    console.log('Migration Fix completed successfully!');
}

main().catch(console.error).finally(() => {
    prisma.$disconnect();
});
