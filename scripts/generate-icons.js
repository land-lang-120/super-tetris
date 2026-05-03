/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — generate-icons.js
   ═══════════════════════════════════════════════════════════════════
   Convertit icons/icon-source.svg en PNG aux tailles requises pour
   le manifest PWA + Play Store :

     icon-192.png   (192×192)   — manifest PWA standard
     icon-512.png   (512×512)   — manifest PWA standard + Play Store
     icon-maskable.png (512×512)— Android adaptive icon (purpose:maskable)

   Run : node scripts/generate-icons.js
   ═══════════════════════════════════════════════════════════════════ */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC  = path.join(__dirname, '..', 'icons', 'icon-source.svg');
const OUT  = path.join(__dirname, '..', 'icons');

const TARGETS = [
  { size: 192, file: 'icon-192.png' },
  { size: 512, file: 'icon-512.png' },
  { size: 512, file: 'icon-maskable.png', maskable: true },
];

async function main() {
  if (!fs.existsSync(SRC)) {
    console.error('✗ Source not found:', SRC);
    process.exit(1);
  }
  const svg = fs.readFileSync(SRC);

  for (const t of TARGETS) {
    const out = path.join(OUT, t.file);
    let pipeline = sharp(svg, { density: 300 }).resize(t.size, t.size);
    // Pour maskable : padding ~10% de safe zone (Android va cropper en cercle)
    if (t.maskable) {
      // On ajoute un padding pour que les éléments restent dans la zone safe
      const padding = Math.round(t.size * 0.05);
      pipeline = sharp(svg, { density: 300 })
        .resize(t.size - padding * 2, t.size - padding * 2)
        .extend({
          top: padding, bottom: padding, left: padding, right: padding,
          background: { r: 11, g: 18, b: 56, alpha: 1 } // var(--bg1)
        });
    }
    await pipeline.png({ quality: 95, compressionLevel: 9 }).toFile(out);
    const stat = fs.statSync(out);
    console.log('✓ ' + t.file + ' (' + t.size + '×' + t.size + ', ' + (stat.size / 1024).toFixed(1) + ' KB)');
  }
}

main().catch(function (e) {
  console.error('✗ Error:', e.message);
  process.exit(1);
});
