/* ═══════════════════════════════════════════════════════════════════
   Byer — build-aab-byer.js
   ═══════════════════════════════════════════════════════════════════
   Appelle l'API PWABuilder cloudapk pour générer l'AAB Android signé
   de Byer, sans GUI.

   Output : byer-package.zip à la racine du dossier super-tetris/
   ═══════════════════════════════════════════════════════════════════ */

const https = require('https');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = 'pwabuilder-cloudapk.azurewebsites.net';
const ENDPOINT = '/generateAppPackage';

function randomPwd(len) {
  return crypto.randomBytes(len).toString('base64')
    .replace(/[+/=]/g, '').slice(0, len);
}

const STORE_PWD = randomPwd(24);
const KEY_PWD   = randomPwd(24);

const config = {
  packageId: "com.clonex.byer",
  host: "byer.landonjouajosephpino.workers.dev",
  name: "Byer — Location Cameroun",
  launcherName: "Byer",
  appVersion: "1.0.0",
  appVersionCode: 1,
  display: "standalone",
  orientation: "portrait",
  themeColor: "#FF5A5F",
  backgroundColor: "#FFFFFF",
  navigationColor: "#FFFFFF",
  navigationColorDark: "#FFFFFF",
  navigationDividerColor: "#FFFFFF",
  navigationDividerColorDark: "#FFFFFF",
  startUrl: "/?source=play",
  iconUrl: "https://byer.landonjouajosephpino.workers.dev/icons/icon-512.png",
  maskableIconUrl: "https://byer.landonjouajosephpino.workers.dev/icons/icon-maskable-512.png",
  monochromeIconUrl: null,
  shortcuts: [],
  signingMode: "new",
  signing: {
    fullName: "Joseph Pino Lando Njoua",
    organization: "CloneX Studio",
    organizationalUnit: "Engineering",
    countryCode: "CM",
    alias: "byer",
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
  webManifestUrl: "https://byer.landonjouajosephpino.workers.dev/manifest.json",
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

const outFile = path.join(__dirname, '..', 'byer-package.zip');
const out = fs.createWriteStream(outFile);

const req = https.request(options, (res) => {
  console.log('← HTTP ' + res.statusCode);
  console.log('  Content-Type: ' + (res.headers['content-type'] || 'unknown'));

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
    console.log('  alias        : byer');
    console.log('  storePassword: ' + STORE_PWD);
    console.log('  keyPassword  : ' + KEY_PWD);
    console.log('═════════════════════════════════════════════');
    fs.writeFileSync(
      path.join(__dirname, '..', 'byer-keystore-passwords.txt'),
      'PWABuilder generated keystore — ' + new Date().toISOString() + '\n' +
      '\n' +
      'Package:        ' + config.packageId + '\n' +
      'App name:       ' + config.name + '\n' +
      '\n' +
      'KEYSTORE INFO (needed for ALL future Play Store updates) :\n' +
      '  alias         = byer\n' +
      '  storePassword = ' + STORE_PWD + '\n' +
      '  keyPassword   = ' + KEY_PWD + '\n' +
      '\n' +
      '⚠️  Save the .keystore file from the ZIP somewhere safe.\n' +
      '⚠️  Without it you cannot update this app on Google Play.\n'
    );
    console.log('✓ Passwords also saved to byer-keystore-passwords.txt');
  });
});

req.on('error', (e) => {
  console.error('✗ Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
