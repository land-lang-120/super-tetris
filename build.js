/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — Build script
   ═══════════════════════════════════════════════════════════════════
   Transpile tous les .js et .jsx de src/ vers un seul bundle.js
   à la racine. Aucun runtime Babel n'est embarqué côté client (le
   bundle est ES5+ pur, prêt à exécuter dans tous les navigateurs).

   Run : node build.js
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

// Ordre d'inclusion important :
// 1. Game logic (window.STxxx) chargée AVANT les composants qui les utilisent
// 2. Hooks AVANT les composants qui les utilisent
// 3. Components dans l'ordre de dépendance (Starfield avant les autres)
// 4. App.jsx en avant-dernier
// 5. main.jsx en dernier (mount React)
const FILES = [
  // ─── Game logic (no React, just window.STxxx exports) ─────
  'src/game/pieces.js',
  'src/game/bag.js',
  'src/game/core.js',
  'src/game/scoring.js',
  'src/game/render.js',
  // FX modules (audio + haptics + particles) — Batch 7 (Tetroid parity)
  'src/game/audio.js',
  'src/game/haptics.js',
  'src/game/particles.js',
  // Musique iconique Korobeiniki (port de Tetroid) — v1.8
  'src/game/music.js',
  // Boosters (logique fonctionnelle des 4 boosters consommables)
  'src/game/boosters.js',
  // VFX boosters (laser beams, meteor trails, freeze flakes, magnet waves)
  'src/game/booster-fx.js',
  // Moteur 3D Crush pour le Jeu Bonus
  'src/game/crush-engine.js',

  // ─── Services (Google Play Billing & AdMob) ──────────────────
  'src/services/billing.js',
  'src/services/admob.js',

  // ─── Hooks (window.useXxx exports) ─────────────────────────
  'src/hooks/useGameLoop.js',
  'src/hooks/useStorage.js',

  // ─── Components (window.Xxx exports, ordre de dépendance) ─
  'src/i18n.js',
  'src/components/Starfield.jsx',
  'src/components/HUD.jsx',
  'src/components/BoosterButtons.jsx',
  'src/components/RewardedAd.jsx',
  'src/components/LoadingScreen.jsx',
  'src/components/HomeScreen.jsx',
  'src/components/BonusGameScreen.jsx',
  'src/components/GameScreen.jsx',
  'src/components/GameOverScreen.jsx',
  'src/components/FortuneWheel.jsx',
  'src/components/ShopScreen.jsx',
  'src/components/StatsScreen.jsx',
  'src/components/SettingsScreen.jsx',

  // ─── App + entry point ────────────────────────────────────
  'src/App.jsx',
  'src/main.jsx',
];

const BABEL_OPTS = {
  presets: [
    ['@babel/preset-env', { targets: '> 0.5%, last 2 versions, Firefox ESR, not dead' }],
    ['@babel/preset-react', { runtime: 'classic' }],
  ],
  babelrc: false,
  configFile: false,
};

const HEADER = '/* Super Tetris — bundle.js (auto-generated, do not edit by hand) */\n';
const SEPARATOR = '\n\n/* ─────────────────────────────────────────────────────────── */\n\n';

(async function main() {
  const t0 = Date.now();
  let parts = [HEADER];
  let totalIn = 0;
  let count = 0;

  for (const rel of FILES) {
    const abs = path.join(__dirname, rel);
    if (!fs.existsSync(abs)) {
      console.warn('  ⚠ Skipping missing file:', rel);
      continue;
    }
    const src = fs.readFileSync(abs, 'utf8');
    totalIn += src.length;
    try {
      const result = babel.transformSync(src, BABEL_OPTS);
      const code = (result && result.code) || src;
      parts.push('/* === ' + rel + ' === */\n' + code);
      count++;
    } catch (e) {
      console.error('✗ Babel error in', rel, ':', e.message);
      process.exit(1);
    }
  }

  let bundle = parts.join(SEPARATOR);

  try {
    const terser = require('terser');
    const minifyResult = await terser.minify(bundle, {
      compress: {
        drop_console: false,
        passes: 2,
      },
      mangle: true,
      format: { comments: false },
    });
    if (minifyResult.code) {
      bundle = minifyResult.code;
    }
  } catch (e) {
    console.warn('  ⚠ Terser non disponible, bundle non minifié :', e.message);
  }

  const out = path.join(__dirname, 'bundle.js');
  fs.writeFileSync(out, bundle, 'utf8');

  // Synchronisation automatique vers les cibles de déploiement
  function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
      for (const child of fs.readdirSync(src)) {
        copyRecursiveSync(path.join(src, child), path.join(dest, child));
      }
    } else {
      if (!fs.existsSync(path.dirname(dest))) fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
    }
  }

  const syncDirs = [
    path.join(__dirname, 'www'),
    path.join(__dirname, 'preview-public'),
    path.join(__dirname, 'android', 'app', 'src', 'main', 'assets', 'public'),
  ];
  for (const dir of syncDirs) {
    if (fs.existsSync(dir)) {
      fs.writeFileSync(path.join(dir, 'bundle.js'), bundle, 'utf8');
      const staticFiles = ['index.html', '404.html', 'privacy.html', 'support.html', 'sw.js', 'manifest.json'];
      for (const f of staticFiles) {
        const s = path.join(__dirname, f);
        if (fs.existsSync(s)) fs.copyFileSync(s, path.join(dir, f));
      }
      copyRecursiveSync(path.join(__dirname, 'vendor'), path.join(dir, 'vendor'));
      copyRecursiveSync(path.join(__dirname, 'src', 'styles'), path.join(dir, 'src', 'styles'));
    }
  }

  const dt = Date.now() - t0;
  const kb = (bundle.length / 1024).toFixed(1);
  console.log('✓ Bundle créé : ' + count + ' fichiers → bundle.js (' + kb + ' KB) en ' + dt + ' ms');
})();
