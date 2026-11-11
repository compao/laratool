const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const releaseDir = path.join(rootDir, 'release');
// Build outside OneDrive/cloud-synced folders to avoid Windows file-lock errors during NSIS uninstaller extraction
const stagingOutputDir = path.join(os.tmpdir(), 'laratool-release');

function run(command) {
  execSync(command, { cwd: rootDir, stdio: 'inherit' });
}

fs.rmSync(stagingOutputDir, { recursive: true, force: true });
fs.mkdirSync(stagingOutputDir, { recursive: true });

run('npx vite build');
run(`npx electron-builder --win --publish never "--config.directories.output=${stagingOutputDir}"`);

fs.rmSync(releaseDir, { recursive: true, force: true });
fs.mkdirSync(releaseDir, { recursive: true });

for (const entry of fs.readdirSync(stagingOutputDir)) {
  if (entry.endsWith('.exe') || entry.endsWith('.blockmap') || entry === 'latest.yml') {
    fs.copyFileSync(path.join(stagingOutputDir, entry), path.join(releaseDir, entry));
  }
}

console.log(`Build complete. Release artifacts copied to: ${releaseDir}`);
