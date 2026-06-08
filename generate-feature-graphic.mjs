/**
 * Génère la feature graphic Play Store 1024×500 pour Super Tetris.
 * Sortie : play-store-assets/feature-graphic-1024x500.png
 */
import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, 'play-store-assets');
await fs.mkdir(OUT_DIR, { recursive: true });

const W = 1024;
const H = 500;

// Couleurs Super Tetris
const BG1 = '#0b1238';
const BG2 = '#3a1d6b';
const ACCENT = '#ffd23f';
const PURPLE = '#7c3aed';
const CYAN = '#22d3ee';
const RED = '#ef4444';
const GREEN = '#10b981';
const ORANGE = '#f97316';

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${BG1}"/>
      <stop offset="50%" stop-color="${BG2}"/>
      <stop offset="100%" stop-color="${BG1}"/>
    </linearGradient>
    <linearGradient id="grad-block" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Stars -->
  ${Array.from({ length: 30 }, () => {
    const x = Math.random() * W;
    const y = Math.random() * H;
    const r = Math.random() * 2 + 0.5;
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${r.toFixed(1)}" fill="#ffffff" opacity="${(Math.random() * 0.5 + 0.3).toFixed(2)}"/>`;
  }).join('\n')}

  <!-- Tetris pieces décoratifs droite -->
  <!-- I piece (cyan) -->
  <g transform="translate(720, 90)">
    <rect x="0" y="0" width="48" height="48" fill="${CYAN}" stroke="#0c4a6e" stroke-width="3"/>
    <rect x="48" y="0" width="48" height="48" fill="${CYAN}" stroke="#0c4a6e" stroke-width="3"/>
    <rect x="96" y="0" width="48" height="48" fill="${CYAN}" stroke="#0c4a6e" stroke-width="3"/>
    <rect x="144" y="0" width="48" height="48" fill="${CYAN}" stroke="#0c4a6e" stroke-width="3"/>
    <rect x="0" y="0" width="192" height="48" fill="url(#grad-block)" pointer-events="none"/>
  </g>

  <!-- T piece (purple) -->
  <g transform="translate(820, 170)">
    <rect x="48" y="0" width="48" height="48" fill="${PURPLE}" stroke="#3b0764" stroke-width="3"/>
    <rect x="0" y="48" width="48" height="48" fill="${PURPLE}" stroke="#3b0764" stroke-width="3"/>
    <rect x="48" y="48" width="48" height="48" fill="${PURPLE}" stroke="#3b0764" stroke-width="3"/>
    <rect x="96" y="48" width="48" height="48" fill="${PURPLE}" stroke="#3b0764" stroke-width="3"/>
  </g>

  <!-- L piece (orange) -->
  <g transform="translate(720, 320)">
    <rect x="0" y="48" width="48" height="48" fill="${ORANGE}" stroke="#7c2d12" stroke-width="3"/>
    <rect x="48" y="48" width="48" height="48" fill="${ORANGE}" stroke="#7c2d12" stroke-width="3"/>
    <rect x="96" y="48" width="48" height="48" fill="${ORANGE}" stroke="#7c2d12" stroke-width="3"/>
    <rect x="96" y="0" width="48" height="48" fill="${ORANGE}" stroke="#7c2d12" stroke-width="3"/>
  </g>

  <!-- S piece (green) -->
  <g transform="translate(900, 380)">
    <rect x="48" y="0" width="48" height="48" fill="${GREEN}" stroke="#064e3b" stroke-width="3"/>
    <rect x="96" y="0" width="48" height="48" fill="${GREEN}" stroke="#064e3b" stroke-width="3"/>
    <rect x="0" y="48" width="48" height="48" fill="${GREEN}" stroke="#064e3b" stroke-width="3"/>
    <rect x="48" y="48" width="48" height="48" fill="${GREEN}" stroke="#064e3b" stroke-width="3"/>
  </g>

  <!-- Title block gauche -->
  <g transform="translate(70, 130)">
    <!-- Sub badge -->
    <rect x="0" y="0" width="280" height="44" rx="22" fill="${ACCENT}" opacity="0.95"/>
    <text x="140" y="30"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="18" font-weight="900"
          fill="${BG1}" text-anchor="middle" letter-spacing="2">★ JEU EMBLÉMATIQUE ★</text>

    <!-- Big title -->
    <text x="0" y="120"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="92" font-weight="900"
          fill="#FFFFFF" letter-spacing="-3">SUPER</text>
    <text x="0" y="200"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="92" font-weight="900"
          fill="${ACCENT}" letter-spacing="-3">TETRIS</text>

    <!-- Tagline -->
    <text x="0" y="252"
          font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          font-size="22" font-weight="700"
          fill="#FFFFFF" opacity="0.9">4 boosters fun · Musique légendaire</text>

    <!-- Pills features -->
    <g transform="translate(0, 280)">
      <rect x="0" y="0" width="130" height="40" rx="20" fill="#FFFFFF" opacity="0.18"/>
      <text x="65" y="27"
            font-family="sans-serif" font-size="15" font-weight="700"
            fill="#FFFFFF" text-anchor="middle">🎮 100% gratuit</text>

      <rect x="142" y="0" width="120" height="40" rx="20" fill="#FFFFFF" opacity="0.18"/>
      <text x="202" y="27"
            font-family="sans-serif" font-size="15" font-weight="700"
            fill="#FFFFFF" text-anchor="middle">🌍 Hors ligne</text>

      <rect x="274" y="0" width="120" height="40" rx="20" fill="#FFFFFF" opacity="0.18"/>
      <text x="334" y="27"
            font-family="sans-serif" font-size="15" font-weight="700"
            fill="#FFFFFF" text-anchor="middle">🚫 Sans pubs</text>
    </g>
  </g>
</svg>
`;

const out = path.join(OUT_DIR, 'feature-graphic-1024x500.png');
await sharp(Buffer.from(svg)).png().toFile(out);
console.log(`✓ ${out} (${W}x${H})`);
