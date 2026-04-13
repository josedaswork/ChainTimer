import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const svgPath = path.join(__dirname, 'public', 'icon.svg');

// Android mipmap sizes
const androidSizes = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

// Web / PWA sizes
const webSizes = [
  { name: 'favicon-16', size: 16 },
  { name: 'favicon-32', size: 32 },
  { name: 'icon-192', size: 192 },
  { name: 'icon-512', size: 512 },
];

const outDir = path.join(__dirname, 'generated-icons');

async function generate() {
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Android icons
  const androidDir = path.join(outDir, 'android');
  for (const { name, size } of androidSizes) {
    const dir = path.join(androidDir, name);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round variant
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Web / PWA icons
  const webDir = path.join(outDir, 'web');
  if (!existsSync(webDir)) mkdirSync(webDir, { recursive: true });
  for (const { name, size } of webSizes) {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(path.join(webDir, `${name}.png`));
    console.log(`  ✓ ${name} (${size}x${size})`);
  }

  // Favicon .ico (32x32 png renamed)
  await sharp(svgPath)
    .resize(32, 32)
    .png()
    .toFile(path.join(webDir, 'favicon.png'));

  // Copy 192 and 512 to public
  const publicDir = path.join(__dirname, 'public');
  await sharp(svgPath).resize(192, 192).png().toFile(path.join(publicDir, 'icon-192.png'));
  await sharp(svgPath).resize(512, 512).png().toFile(path.join(publicDir, 'icon-512.png'));
  await sharp(svgPath).resize(32, 32).png().toFile(path.join(publicDir, 'favicon.png'));

  console.log('\n✅ All icons generated in ./generated-icons/');
  console.log('   Web icons also copied to ./public/');
  console.log('\n📱 Android: copy generated-icons/android/* into android/app/src/main/res/');
}

generate().catch(console.error);
