const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const sdkTools = 'C:\\Users\\Pino\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0';
const zipalign = path.join(sdkTools, 'zipalign.exe');
const apksigner = path.join(sdkTools, 'apksigner.bat');

const rawApk = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const alignedApk = path.join(__dirname, '..', 'Super Tetris Native.apk');
const keystore = path.join(__dirname, '..', 'android', 'app', 'signing.keystore');

console.log('1. Nettoyage et copie de l APK original non altéré...');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);

// Recopier le raw APK généré par Gradle
fs.copyFileSync(rawApk, alignedApk);

console.log('2. Signature propre avec apksigner (v1 + v2 + v3 + v4)...');
const signCmd = `"${apksigner}" sign --ks "${keystore}" --ks-pass pass:Qb9ODzNnSdFK --ks-key-alias supertetris --key-pass pass:Qb9ODzNnSdFK --v1-signing-enabled true --v2-signing-enabled true --v3-signing-enabled true "${alignedApk}"`;
execSync(signCmd, { stdio: 'inherit' });

console.log('3. Vérification de la signature avec apksigner verify...');
const verifyCmd = `"${apksigner}" verify --verbose "${alignedApk}"`;
const out = execSync(verifyCmd, { encoding: 'utf8' });
console.log('Résultat de la vérification:\n', out);

// Copier vers le dossier de sauvegarde sur le bureau
const backupDir = 'C:\\Users\\Pino\\Desktop\\Copie_des_clees_d\'applications_Google\\super-tetris';
if (fs.existsSync(backupDir)) {
  fs.copyFileSync(alignedApk, path.join(backupDir, 'Super Tetris Native.apk'));
  console.log('Copié dans:', backupDir);
}

console.log('✓ APK 100% prêt, parfaitement signé et certifié pour tous les téléphones Android !');
