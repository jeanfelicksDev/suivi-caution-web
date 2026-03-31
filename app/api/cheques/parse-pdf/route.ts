import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Utilisation d'un import classique statique pour obliger Vercel à inclure le module
    const pdfParse = require('pdf-parse');
    const { PDFParse } = pdfParse;

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();

    const lines = result.text.split('\n');
    const cheques: any[] = [];

    // Simple regex or split logic to parse the lines based on the structure we saw
    // DATE N°CHEQUE BANQUE BENEFICIAIRE MONTANT MANDATAIRE FACTURE
    // 26-mars 1643250 SGCI ISOLDE TRANSIT INTERNATIONALE 400 000 KOUILAN TCHEBLEI ZAPELEZ FI01511302

    for (const line of lines) {
      // Normalize spaces (convert NBSP to normal space)
      const normalizedLine = line.replace(/[\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ');
      const trimmedLine = normalizedLine.trim();
      
      console.log('Parsing line:', trimmedLine);
      if (!trimmedLine || trimmedLine.startsWith('LISTE') || trimmedLine.startsWith('DATE') || trimmedLine.startsWith('#') || trimmedLine.startsWith('--')) {
        continue;
      }

      const parts = trimmedLine.split(/\s+/);
      if (parts.length < 5) continue;

      let num_facture = '';
      // On cherche une partie qui ressemble à une facture (FI... ou un numéro long)
      for (let i = parts.length - 1; i >= 0; i--) {
        const pStr = parts[i];
        if (pStr.startsWith('FI') || (pStr.length >= 8 && /^\d+$/.test(pStr))) {
          num_facture = pStr;
          break;
        }
      }

      if (!num_facture) {
          // Si on n'a rien trouvé avec FI, on prend le dernier élément si c'est alphanumérique long
          const lastPart = parts[parts.length - 1];
          if (lastPart.length > 5 && /[a-zA-Z]/.test(lastPart) && /\d/.test(lastPart)) {
              num_facture = lastPart;
          } else {
              continue;
          }
      }

      const num_cheque = parts[1];
      const banque = parts[2];
      
      // Montant usually follows banque and beneficiaire
      // Regex: look for 1-3 digits followed by groups of 3 digits
      const montantRegex = /\s(\d{1,3}(?:\s\d{3})*)\s/;
      const match = trimmedLine.match(montantRegex);
      
      if (match) {
        const montantStr = match[1];
        const montantVal = parseInt(montantStr.replace(/\s/g, ''));
        const montantPos = trimmedLine.indexOf(montantStr);
        const montantEndPos = montantPos + montantStr.length;
        
        const banquePos = trimmedLine.indexOf(banque);
        const banqueEndPos = banquePos + banque.length;
        const beneficiaire = trimmedLine.substring(banqueEndPos, montantPos).trim();
        
        const numFacturePos = trimmedLine.indexOf(num_facture);
        const mandataire = trimmedLine.substring(montantEndPos, numFacturePos).trim();
        
        cheques.push({
          num_cheque,
          banque,
          montant: montantVal,
          num_facture_caution: num_facture,
          beneficiaire,
          date_rex: mandataire,
          date_cheque: ''
        });
      }
    }

    return NextResponse.json({ cheques });
  } catch (error: any) {
    console.error('Error parsing PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
