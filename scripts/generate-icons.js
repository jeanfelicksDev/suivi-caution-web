const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fs = require('fs');
const path = require('path');

const LOGO_PATH = path.join(process.cwd(), 'public', 'logo-agl.png');
const SIZES = [192, 512];

async function generateIcons() {
  try {
    const bufferLogo = fs.readFileSync(LOGO_PATH);
    const image = await loadImage(bufferLogo);
    
    for (const size of SIZES) {
      const canvas = createCanvas(size, size);
      const ctx = canvas.getContext('2d');
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Calculate new dimensions to fit while keeping aspect ratio
      const ratio = Math.min(size / image.width, size / image.height) * 0.8; // 80% size for padding
      const newWidth = image.width * ratio;
      const newHeight = image.height * ratio;
      const x = (size - newWidth) / 2;
      const y = (size - newHeight) / 2;
      
      ctx.drawImage(image, x, y, newWidth, newHeight);
      
      const buffer = await canvas.encode('png');
      const outputPath = path.join(process.cwd(), 'public', `icon-${size}x${size}.png`);
      fs.writeFileSync(outputPath, buffer);
      console.log(`Generated: icon-${size}x${size}.png`);
    }
  } catch (err) {
    console.error('Error generating icons:', err);
  }
}

generateIcons();
