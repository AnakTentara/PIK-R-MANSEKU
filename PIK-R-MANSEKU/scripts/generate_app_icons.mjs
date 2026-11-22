import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const SRC_LOGO = path.resolve('public/media/logos/logo_pik-r.png');
const RES_DIR = path.resolve('../pikr_app/android/app/src/main/res');

const SIZES = [
  { dir: 'mipmap-mdpi', size: 48 },
  { dir: 'mipmap-hdpi', size: 72 },
  { dir: 'mipmap-xhdpi', size: 96 },
  { dir: 'mipmap-xxhdpi', size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

async function generate() {
  console.log('Generating icons from:', SRC_LOGO);
  if (!fs.existsSync(SRC_LOGO)) {
    throw new Error('Source logo not found: ' + SRC_LOGO);
  }

  for (const { dir, size } of SIZES) {
    const targetDir = path.join(RES_DIR, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const outPath = path.join(targetDir, 'ic_launcher.png');
    await sharp(SRC_LOGO)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(outPath);

    console.log(`✓ Generated ${dir}/ic_launcher.png (${size}x${size})`);
  }

  console.log('All icons generated successfully!');
}

generate().catch(console.error);
