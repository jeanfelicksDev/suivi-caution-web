import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const XLSX = eval('require')('xlsx');
        const filePath = path.join(process.cwd(), 'LISTE DES COMPTES CLIENTS COMPTANTS.xlsx');
        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Fichier non trouvé.' }, { status: 404 });
        }

        const buffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(buffer);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const dataRows = rows.slice(4);
        let created = 0;
        let updated = 0;

        for (const row of dataRows) {
            const nom = String(row[0] || '').trim();
            const fne = String(row[1] || '').trim();

            if (!nom) continue;

            const existing = await prisma.partenaires.findFirst({
                where: {
                    nom_partenaire: {
                        equals: nom,
                        mode: 'insensitive'
                    }
                }
            });

            if (existing) {
                await prisma.partenaires.update({
                    where: { id_partenaire: existing.id_partenaire },
                    data: { 
                        num_fne: fne,
                        updated_at: new Date()
                    }
                });
                updated++;
            } else {
                await prisma.partenaires.create({
                    data: {
                        nom_partenaire: nom,
                        num_fne: fne,
                        est_client: 1,
                    }
                });
                created++;
            }
        }

        return NextResponse.json({ success: true, created, updated });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
