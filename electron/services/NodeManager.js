const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execSync } = require('child_process');
const systemHelper = require('./SystemHelper');

class NodeManager {
  constructor() {
    this.versions = {
      '24': {
        version: '24',
        name: 'Node.js 24 LTS',
        fullVersion: 'v24.21.0',
        npmVersion: '11.19.0',
        url: 'https://nodejs.org/dist/v24.21.0/node-v24.21.0-win-x64.zip',
        archiveFolder: 'node-v24.21.0-win-x64'
      },
      '22': {
        version: '22',
        name: 'Node.js 22 LTS',
        fullVersion: 'v22.23.3',
        npmVersion: '10.9.9',
        url: 'https://nodejs.org/dist/v22.23.3/node-v22.23.3-win-x64.zip',
        archiveFolder: 'node-v22.23.3-win-x64'
      },
      '20': {
        version: '20',
        name: 'Node.js 20 LTS',
        fullVersion: 'v20.20.2',
        npmVersion: '10.8.2',
        url: 'https://nodejs.org/dist/v20.20.2/node-v20.20.2-win-x64.zip',
        archiveFolder: 'node-v20.20.2-win-x64'
      },
      '18': {
        version: '18',
        name: 'Node.js 18 LTS',
        fullVersion: 'v18.20.8',
        npmVersion: '10.8.2',
        url: 'https://nodejs.org/dist/v18.20.8/node-v18.20.8-win-x64.zip',
        archiveFolder: 'node-v18.20.8-win-x64'
      }
    };
    this.latestUpdates = {};
    this._installedVersionCache = new Map();
  }

  getNodeDir(version) {
    return path.join(systemHelper.nodeDir, `node-${version}`);
  }

  getNodeExe(version) {
    return path.join(this.getNodeDir(version), 'node.exe');
  }

  getNpmExe(version) {
    return path.join(this.getNodeDir(version), 'npm.cmd');
  }

  isInstalled(version) {
    return fs.existsSync(this.getNodeExe(version));
  }

  getEnabledVersions() {
    const config = systemHelper.getConfig();
    if (Array.isArray(config.enabledNodeVersions)) {
      return config.enabledNodeVersions;
    }
    const installed = Object.keys(this.versions).filter(v => this.isInstalled(v));
    const def = config.defaultNodeVersion || '22';
    return installed.length > 0 ? Array.from(new Set([...installed, def])) : ['24', '22', '20'];
  }

  async toggleVersion(version, enabled) {
    const meta = this.versions[version];
    if (!meta) throw new Error(`Version Node.js non supportée : ${version}`);

    let enabledList = this.getEnabledVersions();
    if (enabled && !enabledList.includes(version)) {
      enabledList.push(version);
    } else if (!enabled) {
      enabledList = enabledList.filter(v => v !== version);
    }

    systemHelper.saveConfig({ enabledNodeVersions: enabledList });
    return { success: true, enabledNodeVersions: enabledList };
  }

  getInstalledVersionInfo(version) {
    if (!this.isInstalled(version)) return null;
    const nodeExe = this.getNodeExe(version);
    try {
      const mtimeMs = fs.statSync(nodeExe).mtimeMs;
      const cached = this._installedVersionCache.get(version);
      if (cached && cached.mtimeMs === mtimeMs) {
        return cached;
      }

      const fullVersion = execSync(`"${nodeExe}" -v`, { encoding: 'utf-8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      let npmVersion = this.versions[version]?.npmVersion || null;
      const npmPkgPath = path.join(this.getNodeDir(version), 'node_modules', 'npm', 'package.json');
      if (fs.existsSync(npmPkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(npmPkgPath, 'utf-8'));
          if (pkg && pkg.version) npmVersion = pkg.version;
        } catch {}
      }

      const info = { fullVersion, npmVersion, mtimeMs };
      this._installedVersionCache.set(version, info);
      return info;
    } catch {
      return null;
    }
  }

  hasUpdateAvailable(version, installedInfo = null) {
    const latestMeta = this.latestUpdates[version];
    const latestVersion = latestMeta?.fullVersion || this.versions[version]?.fullVersion;
    if (!latestVersion) return false;

    const info = installedInfo || this.getInstalledVersionInfo(version);
    if (!info || !info.fullVersion) return false;

    return systemHelper.compareVersions(latestVersion, info.fullVersion) > 0;
  }

  async checkUpdates() {
    const index = await systemHelper.fetchJson('https://nodejs.org/dist/index.json');
    if (!Array.isArray(index)) {
      throw new Error('Réponse inattendue de nodejs.org');
    }

    const checkedAt = new Date().toISOString();
    const latestByMajor = new Map();

    for (const entry of index) {
      if (!entry || !entry.version || !Array.isArray(entry.files) || !entry.files.includes('win-x64-zip')) {
        continue;
      }
      const match = String(entry.version).match(/^v(\d+)\./);
      if (!match) continue;
      const major = match[1];
      if (latestByMajor.has(major)) continue;

      const numericMajor = parseInt(major, 10);
      const isKnown = !!this.versions[major];
      const isNewLts = !isKnown && numericMajor >= 25 && !!entry.lts;
      if (isKnown || isNewLts) {
        latestByMajor.set(major, entry);
      }
    }

    for (const [major, entry] of latestByMajor.entries()) {
      const url = `https://nodejs.org/dist/${entry.version}/node-${entry.version}-win-x64.zip`;
      const archiveFolder = `node-${entry.version}-win-x64`;
      const label = entry.lts ? `Node.js ${major} LTS` : `Node.js ${major}`;

      if (!this.versions[major]) {
        this.versions[major] = {
          version: major,
          name: label,
          fullVersion: entry.version,
          npmVersion: entry.npm || null,
          url,
          archiveFolder
        };
      } else {
        this.versions[major].fullVersion = entry.version;
        if (entry.npm) this.versions[major].npmVersion = entry.npm;
        this.versions[major].url = url;
        this.versions[major].archiveFolder = archiveFolder;
      }

      this.latestUpdates[major] = {
        fullVersion: entry.version,
        npmVersion: entry.npm || this.versions[major].npmVersion || null,
        url,
        archiveFolder,
        checkedAt
      };
    }

    // Keep version keys sorted descending (newest major first)
    const sortedEntries = Object.entries(this.versions).sort((a, b) => parseInt(b[0], 10) - parseInt(a[0], 10));
    this.versions = Object.fromEntries(sortedEntries);

    const updates = {};
    let updatesAvailableCount = 0;
    for (const version of Object.keys(this.versions)) {
      const installedInfo = this.getInstalledVersionInfo(version);
      const hasUpdate = this.hasUpdateAvailable(version, installedInfo);
      if (hasUpdate) updatesAvailableCount++;
      const latestMeta = this.latestUpdates[version];
      updates[version] = {
        installed: !!installedInfo,
        installedVersion: installedInfo?.fullVersion || null,
        latestVersion: latestMeta?.fullVersion || this.versions[version].fullVersion || null,
        latestNpmVersion: latestMeta?.npmVersion || this.versions[version].npmVersion || null,
        hasUpdate
      };
    }

    return { updates, updatesAvailableCount, checkedAt };
  }

  async getCatalog() {
    const config = systemHelper.getConfig();
    const enabledList = this.getEnabledVersions();
    const result = [];

    for (const [key, meta] of Object.entries(this.versions)) {
      const installed = this.isInstalled(key);
      const installedInfo = installed ? this.getInstalledVersionInfo(key) : null;
      const latestMeta = this.latestUpdates[key];
      const latestVersion = latestMeta?.fullVersion || meta.fullVersion;
      const hasUpdate = installed ? this.hasUpdateAvailable(key, installedInfo) : false;

      result.push({
        id: key,
        name: meta.name,
        fullVersion: installedInfo?.fullVersion || meta.fullVersion,
        npmVersion: installedInfo?.npmVersion || meta.npmVersion,
        latestVersion,
        latestNpmVersion: latestMeta?.npmVersion || meta.npmVersion,
        hasUpdate,
        checkedAt: latestMeta?.checkedAt || null,
        installed,
        isDefault: (config.defaultNodeVersion || '22') === key,
        enabled: enabledList.includes(key),
        path: installed ? this.getNodeDir(key) : null
      });
    }

    return result;
  }

  async listVersions() {
    const config = systemHelper.getConfig();
    const result = [];

    for (const [key, meta] of Object.entries(this.versions)) {
      const installed = this.isInstalled(key);
      const installedInfo = installed ? this.getInstalledVersionInfo(key) : null;
      const latestMeta = this.latestUpdates[key];
      const latestVersion = latestMeta?.fullVersion || meta.fullVersion;
      const hasUpdate = installed ? this.hasUpdateAvailable(key, installedInfo) : false;

      result.push({
        id: key,
        name: meta.name,
        fullVersion: installedInfo?.fullVersion || meta.fullVersion,
        npmVersion: installedInfo?.npmVersion || meta.npmVersion,
        latestVersion,
        latestNpmVersion: latestMeta?.npmVersion || meta.npmVersion,
        hasUpdate,
        checkedAt: latestMeta?.checkedAt || null,
        installed,
        isDefault: (config.defaultNodeVersion || '22') === key,
        path: installed ? this.getNodeDir(key) : null
      });
    }

    return result;
  }

  async updateVersion(version, onProgress) {
    if (!this.versions[version]) {
      throw new Error(`Version Node.js ${version} non supportée`);
    }
    try {
      await this.checkUpdates();
    } catch (err) {
      if (!this.versions[version]?.url) throw err;
    }
    return this.downloadAndInstall(version, onProgress, { isUpdate: true });
  }

  async downloadAndInstall(version, onProgress, options = {}) {
    const meta = this.versions[version];
    if (!meta) throw new Error(`Version Node.js ${version} non supportée`);

    const isUpdate = !!(options && options.isUpdate);
    const targetDir = this.getNodeDir(version);
    const tempZip = path.join(systemHelper.rootDir, `temp-node-${version}.zip`);

    // Check if machine has a matching Program Files installation to fast copy (fresh installs only)
    const sysProgDir = 'C:\\Program Files\\nodejs';
    if (!isUpdate && !this.isInstalled(version) && fs.existsSync(path.join(sysProgDir, 'node.exe'))) {
      try {
        const sysVer = execSync(`"${path.join(sysProgDir, 'node.exe')}" -v`, { encoding: 'utf-8' }).trim();
        if (sysVer.startsWith(`v${version}.`)) {
          if (onProgress) onProgress(30);
          this.copyDirRecursiveSync(sysProgDir, targetDir);
          if (onProgress) onProgress(80);
          this._installedVersionCache.delete(version);
          await this.ensureShims();
          // Auto enable
          let enabledList = this.getEnabledVersions();
          if (!enabledList.includes(version)) {
            enabledList.push(version);
            systemHelper.saveConfig({ enabledNodeVersions: enabledList });
          }
          if (onProgress) onProgress(100);
          return true;
        }
      } catch {}
    }

    const tempExtractDir = path.join(systemHelper.rootDir, `temp-extract-node-${version}`);
    const globalBackupDir = path.join(systemHelper.rootDir, `temp-node-globals-${version}`);

    try {
      await systemHelper.downloadFile(meta.url, tempZip, onProgress);

      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
      fs.mkdirSync(tempExtractDir, { recursive: true });

      await systemHelper.extractZip(tempZip, tempExtractDir);

      // Find the folder inside the extracted zip (e.g. node-v22.14.0-win-x64)
      let innerDir = path.join(tempExtractDir, meta.archiveFolder);
      if (!fs.existsSync(innerDir)) {
        const subdirs = fs.readdirSync(tempExtractDir).filter(f => fs.statSync(path.join(tempExtractDir, f)).isDirectory());
        if (subdirs.length > 0) {
          innerDir = path.join(tempExtractDir, subdirs[0]);
        }
      }

      // Preserve user-installed global npm packages and shims when updating
      if (fs.existsSync(globalBackupDir)) {
        fs.rmSync(globalBackupDir, { recursive: true, force: true });
      }
      let hasGlobalBackups = false;
      if (isUpdate && fs.existsSync(targetDir)) {
        const coreNodeModules = new Set(['npm', 'corepack', '.bin', '.package-lock.json']);
        const coreRootFiles = new Set([
          'node.exe', 'nodevars.bat', 'install_tools.bat',
          'npm', 'npm.cmd', 'npm.ps1',
          'npx', 'npx.cmd', 'npx.ps1',
          'corepack', 'corepack.cmd', 'corepack.ps1',
          'node_modules', 'changelog.md', 'license', 'readme.md'
        ]);

        const oldModulesDir = path.join(targetDir, 'node_modules');
        if (fs.existsSync(oldModulesDir)) {
          for (const modName of fs.readdirSync(oldModulesDir)) {
            if (coreNodeModules.has(modName)) continue;
            const destMod = path.join(globalBackupDir, 'node_modules', modName);
            this.copyDirOrFileSync(path.join(oldModulesDir, modName), destMod);
            hasGlobalBackups = true;
          }
        }

        for (const rootEntry of fs.readdirSync(targetDir)) {
          if (coreRootFiles.has(rootEntry.toLowerCase())) continue;
          this.copyDirOrFileSync(path.join(targetDir, rootEntry), path.join(globalBackupDir, rootEntry));
          hasGlobalBackups = true;
        }
      }

      if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      if (fs.existsSync(innerDir)) {
        fs.renameSync(innerDir, targetDir);
      } else {
        fs.renameSync(tempExtractDir, targetDir);
      }

      // Restore preserved global npm packages
      if (hasGlobalBackups && fs.existsSync(globalBackupDir)) {
        this.copyDirRecursiveSync(globalBackupDir, targetDir);
      }

      // Auto enable
      let enabledList = this.getEnabledVersions();
      if (!enabledList.includes(version)) {
        enabledList.push(version);
        systemHelper.saveConfig({ enabledNodeVersions: enabledList });
      }

      this._installedVersionCache.delete(version);
      await this.ensureShims();
      return true;
    } finally {
      if (fs.existsSync(tempZip)) {
        try { fs.unlinkSync(tempZip); } catch {}
      }
      if (fs.existsSync(tempExtractDir)) {
        try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch {}
      }
      if (fs.existsSync(globalBackupDir)) {
        try { fs.rmSync(globalBackupDir, { recursive: true, force: true }); } catch {}
      }
    }
  }

  copyDirOrFileSync(source, target) {
    const stat = fs.lstatSync(source);
    if (stat.isDirectory()) {
      this.copyDirRecursiveSync(source, target);
    } else {
      const parent = path.dirname(target);
      if (!fs.existsSync(parent)) {
        fs.mkdirSync(parent, { recursive: true });
      }
      fs.copyFileSync(source, target);
    }
  }

  copyDirRecursiveSync(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    const files = fs.readdirSync(source);
    for (const file of files) {
      const curSource = path.join(source, file);
      const curTarget = path.join(target, file);
      if (fs.lstatSync(curSource).isDirectory()) {
        this.copyDirRecursiveSync(curSource, curTarget);
      } else {
        fs.copyFileSync(curSource, curTarget);
      }
    }
  }

  async setDefault(version) {
    if (!this.isInstalled(version)) {
      throw new Error(`Node.js ${version} n'est pas encore installé`);
    }
    systemHelper.saveConfig({ defaultNodeVersion: version });
    await this.ensureShims();
    return { success: true, defaultNodeVersion: version };
  }

  async ensureShims() {
    const config = systemHelper.getConfig();
    const defaultVersion = config.defaultNodeVersion || '22';
    const nodeDir = this.getNodeDir(defaultVersion);
    const nodeExe = this.getNodeExe(defaultVersion);
    const npmCmd = this.getNpmExe(defaultVersion);
    const npxCmd = path.join(nodeDir, 'npx.cmd');

    if (!fs.existsSync(nodeExe)) return;

    // node.bat
    const nodeBatPath = path.join(systemHelper.binDir, 'node.bat');
    const nodeBatContent = `@echo off
rem LaraTool Node.js CLI Shim
set "NODE_BIN=${nodeExe}"
if exist "%NODE_BIN%" (
  "%NODE_BIN%" %*
) else (
  echo [LaraTool] Node.js ${defaultVersion} n'est pas installe dans "%NODE_BIN%"
  exit /b 1
)
`;
    fs.writeFileSync(nodeBatPath, nodeBatContent, 'utf-8');

    // npm.bat
    const npmBatPath = path.join(systemHelper.binDir, 'npm.bat');
    const npmBatContent = `@echo off
rem LaraTool NPM CLI Shim
set "NPM_BIN=${npmCmd}"
if exist "%NPM_BIN%" (
  call "%NPM_BIN%" %*
) else (
  echo [LaraTool] npm n'est pas installe dans "%NPM_BIN%"
  exit /b 1
)
`;
    fs.writeFileSync(npmBatPath, npmBatContent, 'utf-8');

    // npx.bat
    const npxBatPath = path.join(systemHelper.binDir, 'npx.bat');
    const npxBatContent = `@echo off
rem LaraTool NPX CLI Shim
set "NPX_BIN=${npxCmd}"
if exist "%NPX_BIN%" (
  call "%NPX_BIN%" %*
) else (
  echo [LaraTool] npx n'est pas installe dans "%NPX_BIN%"
  exit /b 1
)
`;
    fs.writeFileSync(npxBatPath, npxBatContent, 'utf-8');

    await systemHelper.addUserPath(systemHelper.binDir);
  }

  openTerminal(version) {
    const nodeDir = this.getNodeDir(version);
    if (!fs.existsSync(nodeDir)) {
      throw new Error(`Node.js ${version} n'est pas installé`);
    }

    const config = systemHelper.getConfig();
    const preferredTerminal = config.preferredTerminal || (systemHelper.hasWindowsTerminal() ? 'wt' : (systemHelper.hasCmder() ? 'cmder' : 'powershell'));
    const psScript = `$env:PATH = '${nodeDir};${systemHelper.binDir};' + $env:PATH; Write-Host '🟢 LaraTool Node.js ${version} Active' -ForegroundColor Green; node -v; npm -v; Write-Host ''`;
    const b64Cmd = Buffer.from(psScript, 'utf16le').toString('base64');

    if (preferredTerminal === 'cmder' && systemHelper.hasCmder()) {
      const cmderExe = systemHelper.getCmderPath();
      exec(`"${cmderExe}" /SINGLE /START "${nodeDir}"`, {
        env: {
          ...process.env,
          PATH: `${nodeDir};${systemHelper.binDir};${process.env.PATH || ''}`
        }
      }, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else if (preferredTerminal === 'wt' && systemHelper.hasWindowsTerminal()) {
      exec(`wt.exe --title "LaraTool: Node ${version}" powershell.exe -NoExit -EncodedCommand ${b64Cmd}`, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else {
      exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
    }
  }
}

module.exports = new NodeManager();
