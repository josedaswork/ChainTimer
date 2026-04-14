import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, 'public', 'icon.svg');

// Single source → all destinations
const androidResDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');
const publicDir = path.join(__dirname, 'public');

const androidSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

const webOutputs = [
  { file: 'favicon.png', size: 32 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
];

async function generate() {
  // ── Android icons → android/app/src/main/res/mipmap-*/
  for (const { name, size } of androidSizes) {
    const dir = path.join(androidResDir, name);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const buf = await sharp(svgPath).resize(size, size).png().toBuffer();
    await sharp(buf).toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(buf).toFile(path.join(dir, 'ic_launcher_round.png'));
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // ── Web / PWA icons → public/
  for (const { file, size } of webOutputs) {
    await sharp(svgPath).resize(size, size).png().toFile(path.join(publicDir, file));
    console.log(`  ✓ ${file} (${size}x${size})`);
  }

  console.log('\n✅ All icons written directly to final destinations.');
  console.log('   Android: android/app/src/main/res/mipmap-*/');
  console.log('   Web:     public/');
}

generate().catch(console.error);
