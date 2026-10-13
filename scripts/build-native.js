const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('─── 1. Recompilation du bundle.js ───');
execSync('node build.js', { stdio: 'inherit' });

console.log('─── 2. Préparation du dossier www/ autonome ───');
const wwwDir = path.join(__dirname, '..', 'www');
if (fs.existsSync(wwwDir)) {
  fs.rmSync(wwwDir, { recursive: true, force: true });
}
fs.mkdirSync(wwwDir, { recursive: true });

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copier les fichiers essentiels
const filesToCopy = [
  'index.html',
  'bundle.js',
  'manifest.json',
  'sw.js',
];

for (const file of filesToCopy) {
  const src = path.join(__dirname, '..', file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(wwwDir, file));
    console.log('  [+] Copié:', file);
  }
}

// Copier les dossiers
const dirsToCopy = [
  'vendor',
  'src/styles',
  'icons',
];

for (const dir of dirsToCopy) {
  const src = path.join(__dirname, '..', dir);
  if (fs.existsSync(src)) {
    copyRecursive(src, path.join(wwwDir, dir));
    console.log('  [+] Copié dossier:', dir);
  }
}

console.log('✓ Dossier www/ préparé avec succès pour le build natif Android !');
