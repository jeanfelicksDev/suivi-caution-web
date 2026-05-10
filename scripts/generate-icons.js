const { createCanvas } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const SIZES = [192, 512];
const VERSION = 'v2'; // To force PWA cache update on devices

async function generateIcons() {
  try {
    for (const size of SIZES) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Texte principal "DSM"
      ctx.fillStyle = '#1D3557'; // Bleu profond
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const fontSizeDSM = size * 0.35;
      ctx.font = `bold ${fontSizeDSM}px Arial, sans-serif`;
      ctx.fillText('DSM', size / 2, size / 2 - size * 0.1);
      
      // Texte secondaire "Suivi remboursement caution"
      const fontSizeSub = size * 0.07;
      ctx.font = `bold ${fontSizeSub}px Arial, sans-serif`;
      
      // Pour éviter que le texte ne dépasse, on peut spécifier maxWidth ou utiliser des sauts de ligne
      // Ici, on met un maxWidth à 90% de l'image
      ctx.fillText('Suivi remboursement caution', size / 2, size / 2 + size * 0.2, size * 0.9);
      
      const buffer = await canvas.encode('png');
      const outputPath = path.join(process.cwd(), 'public', `icon-${size}x${size}-${VERSION}.png`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: icon-${size}x${size}-${VERSION}.png`);
    }
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
