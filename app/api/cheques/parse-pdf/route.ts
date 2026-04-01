import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

// Extraction du texte PDF via pdfjs-dist (ESM dynamique)
// On évite pdf-parse qui accède à des fichiers de test inexistants sur Vercel
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // Import dynamique ESM nécessaire pour pdfjs-dist v5+
  const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);

  // On pointe vers le fichier worker inclus dans pdfjs-dist
  // Sur Vercel, ce fichier est présent grâce à outputFileTracingIncludes
  const workerPath = path.join(
    process.cwd(),
    'node_modules',
    'pdfjs-dist',
    'legacy',
    'build',
    'pdf.worker.mjs'
  );
  pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;

  let fullText = '';
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => ('str' in item ? item.str : ''))
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let text: string;
    try {
      text = await extractTextFromPDF(buffer);
    } catch (pdfError: any) {
      console.error('Erreur extraction PDF:', pdfError);
      return NextResponse.json(
        { error: 'Erreur interne de lecture PDF', details: pdfError.message },
        { status: 500 }
      );
    }

    console.log('PDF text length extracted:', text.length);

    const lines = text
      .split(/[\r\n]+/)
      .map((l: string) => l.trim())
      .filter(Boolean);

    const cheques: any[] = [];

    // Format attendu : DATE N°CHEQUE BANQUE BENEFICIAIRE MONTANT MANDATAIRE FACTURE
    // Ex: 26-mars 1643250 SGCI ISOLDE TRANSIT INTERNATIONALE 400 000 KOUILAN TCHEBLEI FI01511302

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const parts = line.split(/\s+/);

      let num_facture = '';
      let factureIdx = -1;

      for (let j = parts.length - 1; j >= 0; j--) {
        const p = parts[j].toUpperCase();
        if (p.startsWith('FI') || (p.length >= 8 && /^\d+$/.test(p))) {
          num_facture = p;
          factureIdx = j;
          break;
        }
      }

      if (!num_facture || parts.length < 4) continue;

      const lineUntilFacture = parts.slice(0, factureIdx).join(' ');
      const montantMatches = lineUntilFacture.match(/(\d{1,3}(?:\s\d{3})+|\d{4,})/g);

      if (montantMatches && montantMatches.length > 0) {
        let montantStr = '';
        let montantVal = 0;
        const numChequeHypothese = parts[1] || '';

        for (let m = montantMatches.length - 1; m >= 0; m--) {
          const mStr = montantMatches[m];
          const mVal = parseInt(mStr.replace(/\s/g, ''));
          if (mStr.replace(/\s/g, '') !== numChequeHypothese) {
            montantStr = mStr;
            montantVal = mVal;
            break;
          }
        }

        if (!montantStr) {
          montantStr = montantMatches[montantMatches.length - 1];
          montantVal = parseInt(montantStr.replace(/\s/g, ''));
        }

        const num_cheque = parts[1] || '';
        const banque = parts[2] || '';
        const montantPos = lineUntilFacture.lastIndexOf(montantStr);
        const banqueIdx = lineUntilFacture.indexOf(banque);
        const banqueEndPos = banqueIdx + banque.length;

        const beneficiaire = lineUntilFacture.substring(banqueEndPos, montantPos).trim();
        const mandataire = lineUntilFacture.substring(montantPos + montantStr.length).trim();

        cheques.push({
          num_cheque,
          banque,
          montant: montantVal,
          num_facture_caution: num_facture,
          beneficiaire: beneficiaire || '—',
          date_rex: mandataire || '—',
          date_cheque: '',
        });
      }
    }

    return NextResponse.json({ cheques });
  } catch (error: any) {
    console.error('General handling error:', error);
    return NextResponse.json(
      { error: 'Erreur lors du traitement du fichier', details: error.message },
      { status: 500 }
    );
  }
}
