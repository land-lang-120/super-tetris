const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('─── 1. Build bundle & assets ───');
execSync('node scripts/build-native.js', { stdio: 'inherit' });

console.log('─── 2. Capacitor sync android ───');
execSync('npx cap sync android', { stdio: 'inherit' });

console.log('─── 2b. Génération des icônes et splash natifs ───');
execSync('node scripts/generate-android-icons.js', { stdio: 'inherit' });

console.log('─── 3. Gradle build release APK & AAB ───');
const env = Object.assign({}, process.env, {
  JAVA_HOME: 'C:\\Program Files\\Android\\Android Studio\\jbr',
  ANDROID_HOME: 'C:\\Users\\Pino\\AppData\\Local\\Android\\Sdk',
  PATH: 'C:\\Program Files\\Android\\Android Studio\\jbr\\bin;' + process.env.PATH,
});

execSync('.\\gradlew.bat assembleRelease bundleRelease --max-workers=2', {
  cwd: path.join(__dirname, '..', 'android'),
  env,
  stdio: 'inherit',
});

console.log('─── 4. Signature officielle avec apksigner ───');
execSync('node scripts/sign-apk.js', { stdio: 'inherit' });

// Copier aussi le bundle AAB vers la racine et le bureau
const aabSrc = path.join(__dirname, '..', 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
const aabDest = path.join(__dirname, '..', 'Super Tetris Native.aab');
fs.copyFileSync(aabSrc, aabDest);

const backupDir = 'C:\\Users\\Pino\\Desktop\\Copie_des_clees_d\'applications_Google\\super-tetris';
if (fs.existsSync(backupDir)) {
  fs.copyFileSync(aabDest, path.join(backupDir, 'Super Tetris Native.aab'));
}

console.log('═══════════════════════════════════════════════════════');
console.log('✓ RECONSTRUCTION TERMINÉE AVEC SUCCÈS !');
console.log('  - Super Tetris Native.apk (prêt à installer sur téléphone)');
console.log('  - Super Tetris Native.aab (prêt pour le Play Store)');
console.log('═══════════════════════════════════════════════════════');
