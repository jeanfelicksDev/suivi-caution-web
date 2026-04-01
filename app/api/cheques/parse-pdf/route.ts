import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

// ── Types ────────────────────────────────────────────────────
interface PdfItem {
  str: string;
  x: number;
  y: number;
}

interface ChequeRow {
  num_cheque: string;
  banque: string;
  montant: number;
  num_facture_caution: string;
  beneficiaire: string;
  date_rex: string;
  date_cheque: string;
}

// ── Colonnes identifiées par plage X (mesurées dans le PDF) ──
// DATE ~146 | N°CHEQUE ~241 | BANQUE ~278 | BENEFICIAIRE ~316
// MONTANT ~411 | MANDATAIRE ~440 | FACTURE ~506
const COLS = {
  date:        { xMin: 130, xMax: 230 },
  num_cheque:  { xMin: 230, xMax: 270 },
  banque:      { xMin: 270, xMax: 295 },
  beneficiaire:{ xMin: 295, xMax: 400 },
  montant:     { xMin: 400, xMax: 440 },
  mandataire:  { xMin: 440, xMax: 500 },
  facture:     { xMin: 500, xMax: 560 },
};

function getCol(x: number): keyof typeof COLS | null {
  for (const [col, range] of Object.entries(COLS)) {
    if (x >= range.xMin && x < range.xMax) return col as keyof typeof COLS;
  }
  return null;
}

// ── Extraction des items positionnés depuis le PDF ───────────
async function extractItemsFromPDF(buffer: Buffer): Promise<PdfItem[]> {
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);

  const workerPath = path.join(
    process.cwd(),
    'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.mjs'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const pdfDocument = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

  const allItems: PdfItem[] = [];
  for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();

    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const x = Math.round(item.transform[4]);
      const y = Math.round(item.transform[5]);
      allItems.push({ str: item.str.trim(), x, y });
    }
  }

  return allItems;
}

// ── Regroupement par ligne (Y similaire) puis par colonne X ──
function parseItemsToRows(items: PdfItem[]): ChequeRow[] {
  // 1. Regrouper les items par valeur Y (tolérance ±2px)
  const lineMap = new Map<number, PdfItem[]>();
  for (const item of items) {
    let matched = false;
    for (const [key] of lineMap) {
      if (Math.abs(item.y - key) <= 2) {
        lineMap.get(key)!.push(item);
        matched = true;
        break;
      }
    }
    if (!matched) lineMap.set(item.y, [item]);
  }

  // 2. Trier les lignes par Y décroissant (PDF: Y part du bas)
  const sortedLines = Array.from(lineMap.entries())
    .sort((a, b) => b[0] - a[0]);

  const cheques: ChequeRow[] = [];

  for (const [, lineItems] of sortedLines) {
    // Trier les items de la ligne par X croissant
    lineItems.sort((a, b) => a.x - b.x);

    // Mapper chaque item vers sa colonne
    const row: Record<string, string> = {};
    for (const item of lineItems) {
      const col = getCol(item.x);
      if (col) {
        // Concaténer si plusieurs items dans la même colonne (ex: "400 000")
        row[col] = row[col] ? row[col] + ' ' + item.str : item.str;
      }
    }

    // Valider que c'est bien une ligne de chèque (doit avoir FACTURE et N°CHEQUE)
    const facture = row['facture']?.trim().toUpperCase() || '';
    const numCheque = row['num_cheque']?.trim() || '';

    if (!facture || !numCheque) continue;
    // Ignorer les lignes d'en-tête
    if (facture === 'FACTURE' || numCheque === 'N°CHEQUE' || numCheque.toUpperCase() === 'N°CHEQUE') continue;
    // La facture doit commencer par FI ou être numérique long
    if (!facture.startsWith('FI') && !/^\d{8,}$/.test(facture)) continue;

    const montantStr = (row['montant'] || '').replace(/\s/g, '');
    const montant = parseInt(montantStr) || 0;

    cheques.push({
      num_cheque: numCheque,
      banque: row['banque']?.trim() || '',
      montant,
      num_facture_caution: facture,
      beneficiaire: row['beneficiaire']?.trim() || '—',
      date_rex: row['mandataire']?.trim() || '—',
      date_cheque: '',
    });
  }

  return cheques;
}

// ── Handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let items: PdfItem[];
    try {
      items = await extractItemsFromPDF(buffer);
    } catch (pdfError: any) {
      console.error('Erreur extraction PDF:', pdfError);
      return NextResponse.json(
        { error: 'Erreur interne de lecture PDF', details: pdfError.message },
        { status: 500 }
      );
    }

    console.log(`PDF items extracted: ${items.length}`);

    const cheques = parseItemsToRows(items);

    console.log(`Cheques parsed: ${cheques.length}`);

    return NextResponse.json({ cheques });
  } catch (error: any) {
    console.error('General handling error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier', details: error.message },
      { status: 500 }
    );
  }
}
