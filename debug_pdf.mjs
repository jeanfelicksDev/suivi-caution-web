import { readFileSync } from 'fs';

async function test() {
  const { getSortedPDFItems } = await import('unpdf');
  
  const buffer = readFileSync('pdf LISTE DE CHEQUES RBMNT CAUTION AU 260326.pdf');
  const items = await getSortedPDFItems(new Uint8Array(buffer));
  
  console.log(`Total items: ${items.length}`);
  // Afficher quelques items avec leurs positions
  items.slice(0, 15).forEach(item => {
    console.log(`x=${Math.round(item.x)} y=${Math.round(item.y)} : "${item.text}"`);
  });
}

test().catch(err => {
  console.error('ERROR:', err.message);
  // Essayons l'API alternative
  import('unpdf').then(m => console.log('API disponible:', Object.keys(m)));
});
