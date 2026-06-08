/**
 * Génère 8 screenshots Play Store marketing pour Super Tetris.
 * Format : 1080×1920 PNG.
 * Sortie : play-store-assets/screenshots/01..08-*.png
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'play-store-assets', 'screenshots');
await fs.mkdir(OUT_DIR, { recursive: true });

const W = 1080;
const H = 1920;

// Palette Super Tetris
const BG1 = '#0b1238';
const BG2 = '#3a1d6b';
const ACCENT = '#ffd23f';
const PURPLE = '#7c3aed';
const CYAN = '#22d3ee';
const RED = '#ef4444';
const GREEN = '#10b981';
const ORANGE = '#f97316';
const YELLOW = '#facc15';

// Helper pour multi-line SVG text
function svgMultiline(text, x, dyPerLine) {
  const lines = text.split('\n');
  return lines
    .map((line, i) => {
      const escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;');
      return `<tspan x="${x}" dy="${i === 0 ? 0 : dyPerLine}">${escaped}</tspan>`;
    })
    .join('');
}

function buildCardSvg({ bgGrad, accent, title, subtitle, badge, illustration }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${bgGrad[0]}"/>
      <stop offset="100%" stop-color="${bgGrad[1]}"/>
    </linearGradient>
    <linearGradient id="block-shine" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Étoiles décoratives -->
  ${Array.from({ length: 50 }, () => {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 2.5 + 0.5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(Math.random() * 0.4 + 0.2).toFixed(2)}"/>`;
  }).join('\n')}

  <!-- Badge -->
  ${badge ? `
  <g transform="translate(540, 130)">
    <rect x="-200" y="-32" width="400" height="64" rx="32" fill="${ACCENT}"/>
    <text y="10" text-anchor="middle"
          font-family="-apple-system, BlinkMacSystemFont, sans-serif"
          font-size="22" font-weight="900" fill="${BG1}" letter-spacing="2">
      ${badge}
    </text>
  </g>` : ''}

  <!-- Titre principal -->
  <text x="540" y="${badge ? 290 : 230}"
        font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="86" font-weight="900"
        fill="${accent}" text-anchor="middle"
        letter-spacing="-2">
    ${svgMultiline(title, 540, 100)}
  </text>

  <!-- Illustration au centre -->
  <g transform="translate(0, ${badge ? 530 : 470})">
    ${illustration}
  </g>

  <!-- Sous-titre en bas -->
  <text x="540" y="1730"
        font-family="-apple-system, BlinkMacSystemFont, sans-serif"
        font-size="36" font-weight="500"
        fill="#FFFFFF" text-anchor="middle"
        opacity="0.9">
    ${svgMultiline(subtitle, 540, 50)}
  </text>

  <!-- Logo en pied -->
  <g transform="translate(440, 1820)">
    <rect width="200" height="60" rx="14" fill="${ACCENT}"/>
    <text x="100" y="42"
          font-family="sans-serif"
          font-size="22" font-weight="900" fill="${BG1}" text-anchor="middle">SUPER TETRIS</text>
  </g>
</svg>`;
}

// ─── Helpers pour dessiner des pièces Tetris ───────────────────────

/** Dessine une pièce Tetris à (x, y) avec une couleur donnée. */
function tetrisBlock(x, y, size, color, darkColor) {
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${color}" stroke="${darkColor}" stroke-width="3"/>
    <rect x="${x + 4}" y="${y + 4}" width="${size - 8}" height="${(size - 8) / 3}" fill="#ffffff" opacity="0.4"/>
  `;
}

// ─── 8 Illustrations ────────────────────────────────────────────────

/** 1. Game board avec pile et tetromino tombant */
const ill_gameplay = `
<g transform="translate(240, 0)">
  <!-- Game frame -->
  <rect x="0" y="0" width="600" height="900" rx="20" fill="#000814" stroke="${ACCENT}" stroke-width="4"/>
  <!-- HUD top -->
  <text x="30" y="50" font-family="sans-serif" font-size="22" font-weight="700" fill="${ACCENT}">SCORE</text>
  <text x="30" y="85" font-family="sans-serif" font-size="36" font-weight="900" fill="#FFFFFF">123,456</text>
  <text x="570" y="50" font-family="sans-serif" font-size="22" font-weight="700" fill="${ACCENT}" text-anchor="end">NIVEAU</text>
  <text x="570" y="85" font-family="sans-serif" font-size="36" font-weight="900" fill="#FFFFFF" text-anchor="end">12</text>
  <!-- Game grid (10 col × 14 rows visible) -->
  <g transform="translate(60, 130)">
    ${Array.from({ length: 14 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        const x = col * 48;
        const y = row * 48;
        return `<rect x="${x}" y="${y}" width="48" height="48" fill="none" stroke="#1f2547" stroke-width="1"/>`;
      }).join(''),
    ).join('')}
    <!-- Tetromino tombant (T piece) violet -->
    ${tetrisBlock(48 * 4, 48 * 3, 48, PURPLE, '#3b0764')}
    ${tetrisBlock(48 * 3, 48 * 4, 48, PURPLE, '#3b0764')}
    ${tetrisBlock(48 * 4, 48 * 4, 48, PURPLE, '#3b0764')}
    ${tetrisBlock(48 * 5, 48 * 4, 48, PURPLE, '#3b0764')}
    <!-- Pile en bas -->
    ${tetrisBlock(0, 48 * 12, 48, RED, '#7f1d1d')}
    ${tetrisBlock(48, 48 * 12, 48, RED, '#7f1d1d')}
    ${tetrisBlock(48 * 2, 48 * 12, 48, ORANGE, '#7c2d12')}
    ${tetrisBlock(48 * 3, 48 * 12, 48, GREEN, '#064e3b')}
    ${tetrisBlock(48 * 4, 48 * 12, 48, CYAN, '#0c4a6e')}
    ${tetrisBlock(48 * 5, 48 * 12, 48, CYAN, '#0c4a6e')}
    ${tetrisBlock(48 * 6, 48 * 12, 48, YELLOW, '#713f12')}
    ${tetrisBlock(48 * 7, 48 * 12, 48, PURPLE, '#3b0764')}
    ${tetrisBlock(48 * 8, 48 * 12, 48, GREEN, '#064e3b')}
    ${tetrisBlock(48 * 9, 48 * 12, 48, ORANGE, '#7c2d12')}
    ${tetrisBlock(0, 48 * 13, 48, ORANGE, '#7c2d12')}
    ${tetrisBlock(48, 48 * 13, 48, ORANGE, '#7c2d12')}
    ${tetrisBlock(48 * 2, 48 * 13, 48, ORANGE, '#7c2d12')}
    ${tetrisBlock(48 * 4, 48 * 13, 48, RED, '#7f1d1d')}
    ${tetrisBlock(48 * 5, 48 * 13, 48, RED, '#7f1d1d')}
    ${tetrisBlock(48 * 6, 48 * 13, 48, GREEN, '#064e3b')}
    ${tetrisBlock(48 * 7, 48 * 13, 48, GREEN, '#064e3b')}
    ${tetrisBlock(48 * 8, 48 * 13, 48, GREEN, '#064e3b')}
    ${tetrisBlock(48 * 9, 48 * 13, 48, YELLOW, '#713f12')}
  </g>
  <!-- Boutons HUD bottom -->
  <g transform="translate(0, 800)">
    <rect x="40" y="20" width="100" height="80" rx="12" fill="${PURPLE}"/>
    <text x="90" y="70" font-family="sans-serif" font-size="40" fill="#FFFFFF" text-anchor="middle">↻</text>
    <rect x="160" y="20" width="100" height="80" rx="12" fill="${CYAN}"/>
    <text x="210" y="70" font-family="sans-serif" font-size="40" fill="#FFFFFF" text-anchor="middle">↺</text>
    <rect x="340" y="20" width="100" height="80" rx="12" fill="${ORANGE}"/>
    <text x="390" y="68" font-family="sans-serif" font-size="38" fill="#FFFFFF" text-anchor="middle">⬇</text>
    <rect x="460" y="20" width="100" height="80" rx="12" fill="${RED}"/>
    <text x="510" y="73" font-family="sans-serif" font-size="44" fill="#FFFFFF" text-anchor="middle">⤓</text>
  </g>
</g>`;

/** 2. 4 Boosters avec icônes et effets */
const ill_boosters = `
<g>
  <!-- Title bar -->
  <text x="540" y="40" font-family="sans-serif" font-size="32" font-weight="800" fill="${ACCENT}" text-anchor="middle">DÉBLOQUE LES 4 BOOSTERS</text>
  <!-- Grid 2×2 des boosters -->
  <!-- Freeze -->
  <g transform="translate(120, 100)">
    <rect width="380" height="380" rx="30" fill="#0c4a6e" stroke="${CYAN}" stroke-width="4"/>
    <text x="190" y="130" font-family="sans-serif" font-size="120" text-anchor="middle">❄️</text>
    <text x="190" y="220" font-family="sans-serif" font-size="36" font-weight="900" fill="${CYAN}" text-anchor="middle">FREEZE</text>
    <text x="190" y="280" font-family="sans-serif" font-size="20" fill="#7dd3fc" text-anchor="middle">Stoppe la chute</text>
    <text x="190" y="310" font-family="sans-serif" font-size="20" fill="#7dd3fc" text-anchor="middle">15 secondes</text>
    <rect x="60" y="335" width="260" height="34" rx="17" fill="${CYAN}"/>
    <text x="190" y="360" font-family="sans-serif" font-size="18" font-weight="900" fill="#082f49" text-anchor="middle">⏱ TEMPS POUR RÉFLÉCHIR</text>
  </g>
  <!-- Laser -->
  <g transform="translate(580, 100)">
    <rect width="380" height="380" rx="30" fill="#7c2d12" stroke="${ORANGE}" stroke-width="4"/>
    <text x="190" y="130" font-family="sans-serif" font-size="120" text-anchor="middle">⚡</text>
    <text x="190" y="220" font-family="sans-serif" font-size="36" font-weight="900" fill="${ORANGE}" text-anchor="middle">LASER</text>
    <text x="190" y="280" font-family="sans-serif" font-size="20" fill="#fed7aa" text-anchor="middle">Détruit 4 lignes</text>
    <text x="190" y="310" font-family="sans-serif" font-size="20" fill="#fed7aa" text-anchor="middle">basses + cascade</text>
    <rect x="60" y="335" width="260" height="34" rx="17" fill="${ORANGE}"/>
    <text x="190" y="360" font-family="sans-serif" font-size="18" font-weight="900" fill="#7c2d12" text-anchor="middle">💥 LIBÈRE LA PILE</text>
  </g>
  <!-- Meteor -->
  <g transform="translate(120, 510)">
    <rect width="380" height="380" rx="30" fill="#581c87" stroke="${PURPLE}" stroke-width="4"/>
    <text x="190" y="130" font-family="sans-serif" font-size="120" text-anchor="middle">☄️</text>
    <text x="190" y="220" font-family="sans-serif" font-size="36" font-weight="900" fill="#c4b5fd" text-anchor="middle">METEOR</text>
    <text x="190" y="280" font-family="sans-serif" font-size="20" fill="#ddd6fe" text-anchor="middle">10 météorites</text>
    <text x="190" y="310" font-family="sans-serif" font-size="20" fill="#ddd6fe" text-anchor="middle">détruisent le top</text>
    <rect x="60" y="335" width="260" height="34" rx="17" fill="${PURPLE}"/>
    <text x="190" y="360" font-family="sans-serif" font-size="18" font-weight="900" fill="#FFFFFF" text-anchor="middle">🌠 PLUIE D'ÉTOILES</text>
  </g>
  <!-- Magnet -->
  <g transform="translate(580, 510)">
    <rect width="380" height="380" rx="30" fill="#064e3b" stroke="${GREEN}" stroke-width="4"/>
    <text x="190" y="130" font-family="sans-serif" font-size="120" text-anchor="middle">🧲</text>
    <text x="190" y="220" font-family="sans-serif" font-size="36" font-weight="900" fill="#6ee7b7" text-anchor="middle">MAGNET</text>
    <text x="190" y="280" font-family="sans-serif" font-size="20" fill="#a7f3d0" text-anchor="middle">Compresse tout</text>
    <text x="190" y="310" font-family="sans-serif" font-size="20" fill="#a7f3d0" text-anchor="middle">ferme les trous</text>
    <rect x="60" y="335" width="260" height="34" rx="17" fill="${GREEN}"/>
    <text x="190" y="360" font-family="sans-serif" font-size="18" font-weight="900" fill="#064e3b" text-anchor="middle">🎯 NETTOYAGE PARFAIT</text>
  </g>
</g>`;

/** 3. Roue de la fortune */
const ill_wheel = `
<g transform="translate(0, 0)">
  <!-- Wheel arc segments -->
  <circle cx="540" cy="450" r="380" fill="${BG1}" stroke="${ACCENT}" stroke-width="8"/>
  <!-- Segments (8 = boosters and coins) -->
  ${[
    { angle: 0, color: ORANGE, label: '⚡' },
    { angle: 45, color: CYAN, label: '❄️' },
    { angle: 90, color: PURPLE, label: '☄️' },
    { angle: 135, color: GREEN, label: '🧲' },
    { angle: 180, color: YELLOW, label: '💰' },
    { angle: 225, color: RED, label: '×2' },
    { angle: 270, color: '#ec4899', label: '⭐' },
    { angle: 315, color: '#3b82f6', label: '🎁' },
  ]
    .map(({ angle, color, label }) => {
      const a1 = (angle - 22.5) * (Math.PI / 180);
      const a2 = (angle + 22.5) * (Math.PI / 180);
      const r = 370;
      const x1 = 540 + Math.cos(a1) * r;
      const y1 = 450 + Math.sin(a1) * r;
      const x2 = 540 + Math.cos(a2) * r;
      const y2 = 450 + Math.sin(a2) * r;
      const lblX = 540 + Math.cos(angle * Math.PI / 180) * 250;
      const lblY = 450 + Math.sin(angle * Math.PI / 180) * 250 + 25;
      return `
        <path d="M 540 450 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z" fill="${color}" stroke="${BG1}" stroke-width="4"/>
        <text x="${lblX}" y="${lblY}" font-family="sans-serif" font-size="64" text-anchor="middle">${label}</text>
      `;
    })
    .join('')}
  <!-- Center hub -->
  <circle cx="540" cy="450" r="80" fill="${ACCENT}" stroke="${BG1}" stroke-width="6"/>
  <text x="540" y="468" font-family="sans-serif" font-size="48" font-weight="900" fill="${BG1}" text-anchor="middle">SPIN</text>
  <!-- Pointer arrow at top -->
  <polygon points="540,40 510,110 570,110" fill="${RED}" stroke="${BG1}" stroke-width="4"/>
</g>`;

/** 4. T-Spin score animation */
const ill_tspin = `
<g>
  <!-- Mini board avec T-spin -->
  <rect x="240" y="0" width="600" height="700" rx="20" fill="#000814" stroke="${ACCENT}" stroke-width="4"/>
  <g transform="translate(280, 50)">
    ${Array.from({ length: 12 }, (_, row) =>
      Array.from({ length: 10 }, (_, col) => {
        return `<rect x="${col * 50}" y="${row * 50}" width="50" height="50" fill="none" stroke="#1f2547" stroke-width="1"/>`;
      }).join(''),
    ).join('')}
    <!-- T-Spin triple — pile haute avec trou T au milieu -->
    ${[
      [0, 8], [0, 9], [0, 10], [0, 11],
      [1, 9], [1, 10], [1, 11],
      [2, 10], [2, 11],
      [3, 8], [3, 11],
      [4, 8], [4, 9], [4, 11],
      [5, 11],
      [6, 11],
      [7, 8], [7, 9], [7, 10], [7, 11],
      [8, 9], [8, 10], [8, 11],
      [9, 8], [9, 9], [9, 10], [9, 11],
    ]
      .map(([col, row]) => tetrisBlock(col * 50, row * 50, 50, GREEN, '#064e3b'))
      .join('')}
    <!-- T-piece au milieu (highlighted) -->
    ${tetrisBlock(4 * 50, 9 * 50, 50, PURPLE, '#3b0764')}
    ${tetrisBlock(5 * 50, 9 * 50, 50, PURPLE, '#3b0764')}
    ${tetrisBlock(6 * 50, 9 * 50, 50, PURPLE, '#3b0764')}
    ${tetrisBlock(5 * 50, 10 * 50, 50, PURPLE, '#3b0764')}
  </g>
  <!-- Score popup -->
  <g transform="translate(540, 800)">
    <rect x="-300" y="-60" width="600" height="160" rx="30" fill="${ACCENT}"/>
    <text y="-15" font-family="sans-serif" font-size="38" font-weight="900" fill="${BG1}" text-anchor="middle">★ T-SPIN TRIPLE ★</text>
    <text y="35" font-family="sans-serif" font-size="56" font-weight="900" fill="${RED}" text-anchor="middle">+19,200</text>
    <text y="78" font-family="sans-serif" font-size="20" font-weight="600" fill="${BG1}" text-anchor="middle">1600 × niveau 12 · Back-to-back ×1.5</text>
  </g>
</g>`;

/** 5. Système de rangs (médailles) */
const ill_ranks = `
<g>
  <text x="540" y="50" font-family="sans-serif" font-size="32" font-weight="800" fill="${ACCENT}" text-anchor="middle">8 RANGS À CONQUÉRIR</text>
  <!-- Ranks list -->
  ${[
    { y: 100, color: '#cd7f32', label: '🥉 RECRUE', sub: 'Niveau de départ' },
    { y: 200, color: '#cd7f32', label: '🥉 BRONZE', sub: '5 000 points cumulés' },
    { y: 300, color: '#94a3b8', label: '🥈 ARGENT', sub: '20 000 points cumulés' },
    { y: 400, color: ACCENT, label: '🥇 OR', sub: '100 000 points cumulés' },
    { y: 500, color: CYAN, label: '💎 DIAMANT', sub: '500 000 points cumulés' },
    { y: 600, color: PURPLE, label: '🟣 MAÎTRE', sub: '1M points cumulés' },
    { y: 700, color: ACCENT, label: '👑 LÉGENDE', sub: '5M points cumulés' },
    { y: 800, color: RED, label: '🔥 GRAND MAÎTRE', sub: '20M points + classements' },
  ]
    .map(({ y, color, label, sub }) => `
      <g transform="translate(80, ${y})">
        <rect width="920" height="80" rx="16" fill="${BG2}" opacity="0.7"/>
        <rect width="12" height="80" rx="6" fill="${color}"/>
        <text x="40" y="52" font-family="sans-serif" font-size="30" font-weight="900" fill="${color}">${label}</text>
        <text x="920" y="52" font-family="sans-serif" font-size="22" fill="#FFFFFF" opacity="0.7" text-anchor="end">${sub}</text>
      </g>
    `)
    .join('')}
</g>`;

/** 6. Music note + Korobeiniki */
const ill_music = `
<g>
  <!-- Vinyl record -->
  <circle cx="540" cy="450" r="350" fill="#1a1a1a" stroke="${ACCENT}" stroke-width="6"/>
  <circle cx="540" cy="450" r="280" fill="#0a0a0a" opacity="0.8"/>
  <circle cx="540" cy="450" r="220" fill="#1a1a1a" opacity="0.5"/>
  <circle cx="540" cy="450" r="160" fill="#0a0a0a" opacity="0.7"/>
  <circle cx="540" cy="450" r="100" fill="${ACCENT}"/>
  <text x="540" y="430" font-family="sans-serif" font-size="22" font-weight="900" fill="${BG1}" text-anchor="middle">SUPER</text>
  <text x="540" y="470" font-family="sans-serif" font-size="22" font-weight="900" fill="${BG1}" text-anchor="middle">TETRIS</text>
  <circle cx="540" cy="450" r="14" fill="${BG1}"/>

  <!-- Notes -->
  <text x="220" y="280" font-family="sans-serif" font-size="120" fill="${ACCENT}" opacity="0.8">♪</text>
  <text x="780" y="350" font-family="sans-serif" font-size="100" fill="${CYAN}" opacity="0.8">♫</text>
  <text x="280" y="800" font-family="sans-serif" font-size="110" fill="${PURPLE}" opacity="0.8">♬</text>
  <text x="800" y="820" font-family="sans-serif" font-size="90" fill="${GREEN}" opacity="0.8">♪</text>
</g>`;

/** 7. No ads, free, offline */
const ill_freedom = `
<g>
  <!-- 3 large cards -->
  <g transform="translate(60, 30)">
    <rect width="960" height="240" rx="30" fill="${GREEN}"/>
    <text x="480" y="100" font-family="sans-serif" font-size="72" font-weight="900" fill="#FFFFFF" text-anchor="middle">🆓 100% GRATUIT</text>
    <text x="480" y="170" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Aucune limite, aucun timer, aucun pay-to-win</text>
    <text x="480" y="210" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Joue tant que tu veux</text>
  </g>
  <g transform="translate(60, 300)">
    <rect width="960" height="240" rx="30" fill="${RED}"/>
    <text x="480" y="100" font-family="sans-serif" font-size="72" font-weight="900" fill="#FFFFFF" text-anchor="middle">🚫 ZÉRO PUB</text>
    <text x="480" y="170" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Pas de bannière, pas de vidéo forcée</text>
    <text x="480" y="210" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Ton attention t'appartient</text>
  </g>
  <g transform="translate(60, 570)">
    <rect width="960" height="240" rx="30" fill="${PURPLE}"/>
    <text x="480" y="100" font-family="sans-serif" font-size="72" font-weight="900" fill="#FFFFFF" text-anchor="middle">🌍 HORS LIGNE</text>
    <text x="480" y="170" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Joue dans le métro, en avion, partout</text>
    <text x="480" y="210" font-family="sans-serif" font-size="28" fill="#FFFFFF" text-anchor="middle">Aucune connexion requise</text>
  </g>
</g>`;

/** 8. Made in Cameroun */
const ill_proud = `
<g>
  <!-- Flag -->
  <g transform="translate(220, 60)">
    <rect x="0" y="0" width="226" height="280" fill="#007A5E"/>
    <rect x="226" y="0" width="226" height="280" fill="#CE1126"/>
    <rect x="452" y="0" width="188" height="280" fill="#FCD116"/>
    <text x="339" y="200" font-family="sans-serif" font-size="160" fill="#FCD116" text-anchor="middle" font-weight="900">★</text>
  </g>
  <!-- Card -->
  <rect x="120" y="400" width="840" height="500" rx="40" fill="#FFFFFF"/>
  <text x="540" y="500" font-family="sans-serif" font-size="48" font-weight="900" fill="${PURPLE}" text-anchor="middle">100% Cameroun</text>
  <text x="540" y="560" font-family="sans-serif" font-size="28" fill="#1A1A1A" text-anchor="middle">Conçu et codé à Bafoussam</text>
  <text x="540" y="600" font-family="sans-serif" font-size="28" fill="#1A1A1A" text-anchor="middle">par CloneX Studio 🇨🇲</text>
  <!-- Stats -->
  <g transform="translate(160, 660)">
    <text x="190" y="60" font-family="sans-serif" font-size="64" font-weight="900" fill="${PURPLE}" text-anchor="middle">7</text>
    <text x="190" y="110" font-family="sans-serif" font-size="22" fill="#1A1A1A" text-anchor="middle">Pièces classiques</text>
  </g>
  <g transform="translate(540, 660)">
    <text x="190" y="60" font-family="sans-serif" font-size="64" font-weight="900" fill="${ORANGE}" text-anchor="middle">4</text>
    <text x="190" y="110" font-family="sans-serif" font-size="22" fill="#1A1A1A" text-anchor="middle">Boosters fun</text>
  </g>
  <g transform="translate(160, 800)">
    <text x="190" y="60" font-family="sans-serif" font-size="64" font-weight="900" fill="${GREEN}" text-anchor="middle">8</text>
    <text x="190" y="110" font-family="sans-serif" font-size="22" fill="#1A1A1A" text-anchor="middle">Rangs à conquérir</text>
  </g>
  <g transform="translate(540, 800)">
    <text x="190" y="60" font-family="sans-serif" font-size="64" font-weight="900" fill="${CYAN}" text-anchor="middle">∞</text>
    <text x="190" y="110" font-family="sans-serif" font-size="22" fill="#1A1A1A" text-anchor="middle">Heures de jeu</text>
  </g>
</g>`;

// ─── 8 cartes ───────────────────────────────────────────────────────

const CARDS = [
  {
    file: '01-iconic',
    bgGrad: [BG1, BG2],
    accent: '#FFFFFF',
    badge: '★ JEU EMBLÉMATIQUE ★',
    title: 'Le Tetris que tu connais\ndepuis l\'enfance',
    subtitle: 'La musique légendaire (Korobeiniki)\net le gameplay officiel SRS.',
    illustration: ill_gameplay,
  },
  {
    file: '02-boosters',
    bgGrad: [BG1, '#1e1147'],
    accent: ACCENT,
    badge: '🎁 4 BOOSTERS FUN',
    title: 'Casse les règles\nclassiques',
    subtitle: 'Freeze, Laser, Meteor, Magnet —\n4 super-pouvoirs à débloquer.',
    illustration: ill_boosters,
  },
  {
    file: '03-tspin',
    bgGrad: [BG2, BG1],
    accent: '#FFFFFF',
    badge: '🏆 SCORING OFFICIEL',
    title: 'T-Spins, combos\net back-to-back',
    subtitle: 'Score Tetris Guideline officiel.\nJusqu\'à 19 200 points sur un seul T-Spin Triple.',
    illustration: ill_tspin,
  },
  {
    file: '04-wheel',
    bgGrad: [BG1, BG2],
    accent: ACCENT,
    badge: '🎰 ROUE DE LA FORTUNE',
    title: '1 spin gratuit\nchaque 24h',
    subtitle: 'Gagne pièces or, boosters,\nmultiplicateurs XP. Tous les jours.',
    illustration: ill_wheel,
  },
  {
    file: '05-ranks',
    bgGrad: [BG1, '#1e1147'],
    accent: '#FFFFFF',
    badge: '👑 PROGRESSION',
    title: 'Recrue → Grand Maître',
    subtitle: '8 rangs à conquérir.\nProgresse à chaque partie.',
    illustration: ill_ranks,
  },
  {
    file: '06-music',
    bgGrad: [BG2, BG1],
    accent: ACCENT,
    badge: '🎵 MUSIQUE ICONIQUE',
    title: 'La mélodie que tu\nfredonnes encore',
    subtitle: 'Korobeiniki recréée :\nmélodie + basse + batterie.',
    illustration: ill_music,
  },
  {
    file: '07-freedom',
    bgGrad: [BG1, '#0a3a2e'],
    accent: ACCENT,
    badge: '🆓 GRATUIT · SANS PUB',
    title: 'Joue librement,\npartout',
    subtitle: 'Pas de timer, pas de pub,\npas de connexion requise.',
    illustration: ill_freedom,
  },
  {
    file: '08-cameroun',
    bgGrad: [BG2, '#4f1d9e'],
    accent: ACCENT,
    badge: '🇨🇲 100% LOCAL',
    title: 'Made in Cameroun\npar des Camerounais',
    subtitle: 'Studio CloneX, basé à Bafoussam.\nNote-nous si tu kiffes !',
    illustration: ill_proud,
  },
];

console.log(`Generating ${CARDS.length} marketing screenshots…`);
for (const card of CARDS) {
  const svg = buildCardSvg(card);
  const out = path.join(OUT_DIR, `${card.file}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`  ✓ ${card.file}.png`);
}
console.log('Done.');
