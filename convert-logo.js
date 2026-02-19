const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public', 'trophy-icon-v2.svg');
const outputDir = path.join(__dirname, 'public');

const sizes = [
  { name: 'logo-small.png', width: 200 },
  { name: 'logo-192.png', width: 192 },
  { name: 'logo-512.png', width: 512 },
  { name: 'logo.png', width: 512 }
];

async function convertSvgToPng() {
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, size.name);

    await sharp(svgBuffer)
      .resize(size.width, size.width)
      .png()
      .toFile(outputPath);

    console.log(`✓ Created ${size.name} (${size.width}x${size.width})`);
  }

  console.log('\nAll logo files updated successfully!');
}

convertSvgToPng().catch(console.error);
