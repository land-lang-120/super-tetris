const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcIcon = path.join(__dirname, '..', 'icons', 'icon-512.png');
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const mipmaps = [
  { dir: 'mipmap-mdpi', size: 48, fgSize: 108 },
  { dir: 'mipmap-hdpi', size: 72, fgSize: 162 },
  { dir: 'mipmap-xhdpi', size: 96, fgSize: 216 },
  { dir: 'mipmap-xxhdpi', size: 144, fgSize: 324 },
  { dir: 'mipmap-xxxhdpi', size: 192, fgSize: 432 },
];

async function generate() {
  console.log('─── 1. Génération des icônes de l\'application Android (Launcher) ───');
  
  for (const m of mipmaps) {
    const targetDir = path.join(resDir, m.dir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    // ic_launcher.png standard
    await sharp(srcIcon)
      .resize(m.size, m.size)
      .toFile(path.join(targetDir, 'ic_launcher.png'));

    // ic_launcher_round.png
    await sharp(srcIcon)
      .resize(m.size, m.size)
      .toFile(path.join(targetDir, 'ic_launcher_round.png'));

    // ic_launcher_foreground.png (pour adaptive icons)
    await sharp(srcIcon)
      .resize(m.fgSize, m.fgSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .toFile(path.join(targetDir, 'ic_launcher_foreground.png'));

    console.log(`  [+] ${m.dir}: ${m.size}px + foreground ${m.fgSize}px générés`);
  }

  // ─── Supprimer ou remplacer le vector robot drawable-v24/ic_launcher_foreground.xml ───
  const vectorRobot = path.join(resDir, 'drawable-v24', 'ic_launcher_foreground.xml');
  if (fs.existsSync(vectorRobot)) {
    fs.unlinkSync(vectorRobot);
    console.log('  [x] Supprimé le robot vectoriel par défaut (drawable-v24/ic_launcher_foreground.xml)');
  }

  // ─── Mettre à jour le background adaptatif couleur sombre #0b1238 ───
  const bgXml = path.join(resDir, 'values', 'ic_launcher_background.xml');
  const bgContent = `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0b1238</color>\n</resources>\n`;
  fs.writeFileSync(bgXml, bgContent, 'utf8');
  console.log('  [+] Couleur background launcher mise à jour (#0b1238)');

  // ─── Remplacer les splash screens par l\'icône Super Tetris ───
  console.log('─── 2. Génération des Splash Screens avec le logo officiel ───');
  const splashDirs = [
    { dir: 'drawable', w: 480, h: 800 },
    { dir: 'drawable-port-mdpi', w: 320, h: 480 },
    { dir: 'drawable-port-hdpi', w: 480, h: 800 },
    { dir: 'drawable-port-xhdpi', w: 720, h: 1280 },
    { dir: 'drawable-port-xxhdpi', w: 960, h: 1600 },
    { dir: 'drawable-port-xxxhdpi', w: 1280, h: 1920 },
  ];

  for (const s of splashDirs) {
    const sDir = path.join(resDir, s.dir);
    if (!fs.existsSync(sDir)) fs.mkdirSync(sDir, { recursive: true });
    
    // Créer un splash avec fond #0b1238 et le logo au centre
    const logoSize = Math.min(s.w, s.h) * 0.45;
    const logoBuffer = await sharp(srcIcon)
      .resize(Math.round(logoSize), Math.round(logoSize))
      .toBuffer();

    await sharp({
      create: {
        width: s.w,
        height: s.h,
        channels: 4,
        background: '#0b1238',
      }
    })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile(path.join(sDir, 'splash.png'));

    console.log(`  [+] Splash généré pour ${s.dir} (${s.w}x${s.h})`);
  }

  console.log('✓ Toutes les icônes et splash screens sont désormais 100% Super Tetris !');
}

generate().catch(console.error);
