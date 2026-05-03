/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — build-aab.js
   ═══════════════════════════════════════════════════════════════════
   Appelle l'API PWABuilder cloudapk pour générer l'AAB Android signé
   directement depuis le terminal (pas besoin de la GUI web).

   Usage : node scripts/build-aab.js
   Output : super-tetris.zip à la racine, contenant :
     - app-release-signed.aab (à uploader sur Play Console)
     - signing-key-info.txt   (alias + mots de passe)
     - keystore.bin           (clé de signature, à GARDER PRÉCIEUSEMENT)
   ═══════════════════════════════════════════════════════════════════ */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = 'pwabuilder-cloudapk.azurewebsites.net';
const ENDPOINT = '/generateAppPackage';

// Mot de passe du keystore : aléatoire 24 chars (alphanumériques)
function randomPwd(len) {
  return crypto.randomBytes(len).toString('base64')
    .replace(/[+/=]/g, '').slice(0, len);
}

const STORE_PWD = randomPwd(24);
const KEY_PWD   = randomPwd(24);

const config = {
  packageId: "com.clonex.supertetris",
  host: "super-tetris.landonjouajosephpino.workers.dev",
  name: "Super Tetris",
  launcherName: "Super Tetris",
  appVersion: "1.0.0",
  appVersionCode: 1,
  display: "standalone",
  orientation: "portrait",
  themeColor: "#7c3aed",
  backgroundColor: "#0b1238",
  navigationColor: "#0b1238",
  navigationColorDark: "#0b1238",
  navigationDividerColor: "#0b1238",
  navigationDividerColorDark: "#0b1238",
  startUrl: "/?source=play",
  iconUrl: "https://super-tetris.landonjouajosephpino.workers.dev/icons/icon-512.png",
  maskableIconUrl: "https://super-tetris.landonjouajosephpino.workers.dev/icons/icon-maskable.png",
  monochromeIconUrl: null,
  shortcuts: [],
  signingMode: "new",
  signing: {
    fullName: "Joseph Pino Lando Njoua",
    organization: "CloneX Studio",
    organizationalUnit: "Engineering",
    countryCode: "CM",
    alias: "supertetris",
    storePassword: STORE_PWD,
    keyPassword: KEY_PWD,
  },
  fallbackType: "customtabs",
  features: {
    playBilling: { enabled: false },
    locationDelegation: { enabled: false }
  },
  enableNotifications: false,
  splashScreenFadeOutDuration: 300,
  webManifestUrl: "https://super-tetris.landonjouajosephpino.workers.dev/manifest.json",
};

const body = JSON.stringify(config);

const options = {
  hostname: HOST,
  port: 443,
  path: ENDPOINT,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'User-Agent': 'CloneX-Build-Script/1.0',
  },
};

console.log('→ POST https://' + HOST + ENDPOINT);
console.log('→ Generating signed AAB for ' + config.packageId + '...');
console.log('  (this may take 30-90 sec server-side)');

const outFile = path.join(__dirname, '..', 'super-tetris-package.zip');
const out = fs.createWriteStream(outFile);

const req = https.request(options, (res) => {
  console.log('← HTTP ' + res.statusCode + ' ' + (res.statusMessage || ''));
  console.log('  Content-Type: ' + (res.headers['content-type'] || 'unknown'));
  console.log('  Content-Length: ' + (res.headers['content-length'] || 'unknown'));

  if (res.statusCode !== 200) {
    let err = '';
    res.on('data', function (chunk) { err += chunk; });
    res.on('end', function () {
      console.error('✗ ERROR response:');
      console.error(err.slice(0, 2000));
      process.exit(1);
    });
    return;
  }

  res.pipe(out);
  out.on('finish', () => {
    out.close();
    const stat = fs.statSync(outFile);
    console.log('✓ Saved ' + outFile + ' (' + (stat.size / 1024).toFixed(1) + ' KB)');
    console.log('');
    console.log('═══ KEYSTORE PASSWORDS — SAVE THESE NOW ═══');
    console.log('  alias        : supertetris');
    console.log('  storePassword: ' + STORE_PWD);
    console.log('  keyPassword  : ' + KEY_PWD);
    console.log('═════════════════════════════════════════════');
    // Persiste aussi dans un fichier .txt à côté du zip
    fs.writeFileSync(
      path.join(__dirname, '..', 'super-tetris-keystore-passwords.txt'),
      'PWABuilder generated keystore — ' + new Date().toISOString() + '\n' +
      '\n' +
      'Package:        ' + config.packageId + '\n' +
      'App name:       ' + config.name + '\n' +
      '\n' +
      'KEYSTORE INFO (needed for ALL future Play Store updates) :\n' +
      '  alias         = supertetris\n' +
      '  storePassword = ' + STORE_PWD + '\n' +
      '  keyPassword   = ' + KEY_PWD + '\n' +
      '\n' +
      '⚠️  Save the .keystore file from the ZIP somewhere safe.\n' +
      '⚠️  Without it you cannot update this app on Google Play.\n'
    );
    console.log('✓ Passwords also saved to super-tetris-keystore-passwords.txt');
  });
});

req.on('error', (e) => {
  console.error('✗ Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
