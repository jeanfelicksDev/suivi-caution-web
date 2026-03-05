import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
    const partenaires = await prisma.partenaires.findMany({
        orderBy: { nom_partenaire: 'asc' }
    });

    const dataExcel = partenaires.map((p) => ({
        'ID Partenaire': p.id_partenaire,
        'Nom du Partenaire': p.nom_partenaire,
        'N° FNE': p.num_fne || '',
        'Client ?': p.est_client === 1 ? 'Oui' : 'Non',
        'Transitaire ?': p.est_transitaire === 1 ? 'Oui' : 'Non',
        'Téléphone': p.telephone || '',
        'Email': p.email || '',
    }));

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(dataExcel);

    // Auto-size columns
    const max_widths = dataExcel.reduce((w: any, r: any) => {
        Object.keys(r).forEach((k, i) => {
            const val = r[k] ? r[k].toString() : '';
            w[i] = Math.max(w[i] || 0, val.length + 2, k.length + 2);
        });
        return w;
    }, []);
    worksheet['!cols'] = max_widths.map((w: any) => ({ wch: w }));

    xlsx.utils.book_append_sheet(workbook, worksheet, 'Partenaires');

    const filePath = path.join(process.cwd(), 'Partenaires_Export.xlsx');
    xlsx.writeFile(workbook, filePath);

    console.log(`Excel file successfully created at: ${filePath}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
