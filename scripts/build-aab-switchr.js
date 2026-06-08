/* ═══════════════════════════════════════════════════════════════════
   Switchr — build-aab-switchr.js
   ═══════════════════════════════════════════════════════════════════
   Génère l'AAB Android signé pour Switchr via API PWABuilder cloudapk.
   Output : switchr-package.zip à la racine super-tetris/
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
  packageId: "com.clonex.switchr",
  host: "switchr.landonjouajosephpino.workers.dev",
  name: "Switchr",
  launcherName: "Switchr",
  appVersion: "1.0.0",
  appVersionCode: 1,
  display: "standalone",
  orientation: "portrait",
  themeColor: "#1E90FF",
  backgroundColor: "#FFFFFF",
  navigationColor: "#FFFFFF",
  navigationColorDark: "#FFFFFF",
  navigationDividerColor: "#FFFFFF",
  navigationDividerColorDark: "#FFFFFF",
  startUrl: "/?source=play",
  iconUrl: "https://switchr.landonjouajosephpino.workers.dev/icons/icon-512.png",
  maskableIconUrl: "https://switchr.landonjouajosephpino.workers.dev/icons/icon-512.png",
  monochromeIconUrl: null,
  shortcuts: [],
  signingMode: "new",
  signing: {
    fullName: "Joseph Pino Lando Njoua",
    organization: "CloneX Studio",
    organizationalUnit: "Engineering",
    countryCode: "CM",
    alias: "switchr",
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
  webManifestUrl: "https://switchr.landonjouajosephpino.workers.dev/manifest.webmanifest",
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

const outFile = path.join(__dirname, '..', 'switchr-package.zip');
const out = fs.createWriteStream(outFile);

const req = https.request(options, (res) => {
  console.log('← HTTP ' + res.statusCode);
  if (res.statusCode !== 200) {
    let err = '';
    res.on('data', (c) => err += c);
    res.on('end', () => {
      console.error('✗ ERROR:', err.slice(0, 2000));
      process.exit(1);
    });
    return;
  }
  res.pipe(out);
  out.on('finish', () => {
    out.close();
    const stat = fs.statSync(outFile);
    console.log('✓ Saved ' + outFile + ' (' + (stat.size / 1024).toFixed(1) + ' KB)');
    console.log('\n═══ KEYSTORE PASSWORDS — SAVE NOW ═══');
    console.log('  alias        : switchr');
    console.log('  storePassword: ' + STORE_PWD);
    console.log('  keyPassword  : ' + KEY_PWD);
    console.log('══════════════════════════════════════');
    fs.writeFileSync(
      path.join(__dirname, '..', 'switchr-keystore-passwords.txt'),
      'PWABuilder generated keystore — ' + new Date().toISOString() + '\n\n' +
      'Package:        ' + config.packageId + '\n' +
      'App name:       ' + config.name + '\n\n' +
      'KEYSTORE INFO (needed for ALL future Play Store updates):\n' +
      '  alias         = switchr\n' +
      '  storePassword = ' + STORE_PWD + '\n' +
      '  keyPassword   = ' + KEY_PWD + '\n\n' +
      '⚠️  Save the .keystore file from the ZIP somewhere safe.\n' +
      '⚠️  Without it you cannot update this app on Google Play.\n'
    );
    console.log('✓ Passwords saved to switchr-keystore-passwords.txt');
  });
});

req.on('error', (e) => {
  console.error('✗ Request error:', e.message);
  process.exit(1);
});

req.write(body);
req.end();
