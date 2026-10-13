const { execSync } = require('child_process');
const path = require('path');

const apksigner = 'C:\\Users\\Pino\\AppData\\Local\\Android\\Sdk\\build-tools\\35.0.0\\apksigner.bat';
const apk = path.join(__dirname, '..', 'Super Tetris Native.apk');

try {
  const out = execSync(`"${apksigner}" verify --verbose "${apk}"`, { encoding: 'utf8' });
  console.log('Verification output:\n', out);
} catch (e) {
  console.error('Verification error:\n', e.stdout || e.message);
}
