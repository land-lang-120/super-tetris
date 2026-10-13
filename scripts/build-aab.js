/* ═══════════════════════════════════════════════════════════════════
   Super Tetris — build-aab.js
   ═══════════════════════════════════════════════════════════════════
   Appelle l'API PWABuilder cloudapk pour générer l'AAB Android signé
   directement depuis le terminal (pas besoin de la GUI web).

   Usage : node scripts/build-aab.js
   Output : super-tetris-package.zip à la racine, contenant :
     - app-release-signed.aab (à uploader sur Play Console)
     - signing-key-info.txt   (alias + mots de passe)
     - keystore.bin           (clé de signature, à GARDER PRÉCIEUSEMENT)
   ═══════════════════════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const HOST = 'pwabuilder-cloudapk.azurewebsites.net';
const ENDPOINT = '/generateAppPackage';

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
  appVersion: "1.0.3",
  appVersionCode: 4,
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
    // NOTE: playBilling: { enabled: true } cause une erreur 500 sur le serveur
    // PWABuilder CloudAPK (août 2026). L'API Digital Goods API fonctionne
    // néanmoins côté TWA car elle est native au navigateur Chrome 101+.
    // Les produits doivent être configurés dans la Google Play Console.
    locationDelegation: { enabled: false }
  },
  enableNotifications: false,
  splashScreenFadeOutDuration: 300,
  webManifestUrl: "https://super-tetris.landonjouajosephpino.workers.dev/manifest.json",
};

(async function main() {
  console.log('→ POST https://' + HOST + ENDPOINT);
  console.log('→ Generating signed AAB for ' + config.packageId + '...');
  console.log('  (this may take 30-90 sec server-side)');

  const url = 'https://' + HOST + ENDPOINT;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CloneX-Build-Script/1.0',
      },
      body: JSON.stringify(config),
    });

    console.log('← HTTP ' + res.status + ' ' + (res.statusText || ''));

    if (!res.ok) {
      const errText = await res.text();
      console.error('✗ ERROR response:');
      console.error(errText.slice(0, 2000));
      process.exit(1);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const outFile = path.join(__dirname, '..', 'super-tetris-package.zip');
    fs.writeFileSync(outFile, buffer);

    console.log('✓ Saved ' + outFile + ' (' + (buffer.length / 1024).toFixed(1) + ' KB)');

    // Vérification de l'intégrité de l'archive ZIP
    try {
      const check = execSync('python -c "import zipfile; z = zipfile.ZipFile(\'' + outFile.replace(/\\/g, '/') + '\'); print(z.namelist())"');
      console.log('✓ Archive ZIP valide ! Contenu :', check.toString().trim());
    } catch (zipErr) {
      console.error('⚠ Avertissement : Le zip généré par le serveur PWABuilder semble incomplet :', zipErr.message);
    }

    console.log('');
    console.log('═══ KEYSTORE PASSWORDS — SAVE THESE NOW ═══');
    console.log('  alias        : supertetris');
    console.log('  storePassword: ' + STORE_PWD);
    console.log('  keyPassword  : ' + KEY_PWD);
    console.log('═════════════════════════════════════════════');
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
  } catch (err) {
    console.error('✗ Fetch error:', err.message);
    process.exit(1);
  }
})();
