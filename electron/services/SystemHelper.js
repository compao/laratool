const path = require('path');
const fs = require('fs');
const os = require('os');
const net = require('net');
const https = require('https');
const http = require('http');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');

class SystemHelper {
  constructor() {
    // Isolated directory in ~/.config/laratool
    this.rootDir = path.join(os.homedir(), '.config', 'laratool');
    this.binDir = path.join(this.rootDir, 'bin');
    this.phpDir = path.join(this.rootDir, 'php');
    this.nodeDir = path.join(this.rootDir, 'nodejs');
    this.nginxDir = path.join(this.rootDir, 'nginx');
    this.sitesDir = path.join(this.rootDir, 'sites');
    this.cmderDir = path.join(this.rootDir, 'cmder');
    this.logsDir = path.join(this.rootDir, 'logs');
    this.sslDir = path.join(this.rootDir, 'ssl');
    this.configPath = path.join(this.rootDir, 'config.json');

    this.initDirectories();
  }

  initDirectories() {
    [this.rootDir, this.binDir, this.phpDir, this.nodeDir, this.cmderDir, this.nginxDir, this.sitesDir, this.logsDir, this.sslDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    this.ensureCmderShim();

    if (!fs.existsSync(this.configPath)) {
      const defaultConfig = {
        parkedPaths: [path.join(os.homedir(), 'OneDrive', 'Documents', 'Projects')],
        defaultPhpVersion: '8.4',
        defaultNodeVersion: '22',
        nginxPort: 80,
        sslEnabled: false,
        theme: 'dark'
      };
      fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    }
  }

  ensureCmderShim() {
    const cmderExe = path.join(this.cmderDir, 'Cmder.exe');
    if (fs.existsSync(cmderExe)) {
      const batPath = path.join(this.binDir, 'cmder.bat');
      const batContent = `@echo off\r\nrem LaraTool Cmder CLI Shim\r\n"${cmderExe}" %*\r\n`;
      fs.writeFileSync(batPath, batContent, 'utf-8');
    }
  }

  hasWindowsTerminal() {
    if (this._hasWt !== undefined) return this._hasWt;
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe wt', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this._hasWt = !!(out && out.trim());
    } catch {
      this._hasWt = false;
    }
    return this._hasWt;
  }

  getCmderPath() {
    // 1. Check internal LaraTool cmder directory
    const internalCmder = path.join(this.cmderDir, 'Cmder.exe');
    if (fs.existsSync(internalCmder)) {
      this.ensureCmderShim();
      return internalCmder;
    }

    if (this._cmderPath !== undefined) return this._cmderPath;
    const candidates = [
      'C:\\laragon\\bin\\cmder\\Cmder.exe',
      'C:\\cmder\\Cmder.exe',
      'C:\\tools\\cmder\\Cmder.exe',
      'C:\\Program Files\\cmder\\Cmder.exe',
      path.join(os.homedir(), 'cmder', 'Cmder.exe')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        this._cmderPath = c;
        return c;
      }
    }
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe cmder', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (out && out.trim()) {
        const found = out.trim().split(/\r?\n/)[0];
        if (fs.existsSync(found)) {
          this._cmderPath = found;
          return found;
        }
      }
    } catch {}
    this._cmderPath = null;
    return null;
  }

  hasCmder() {
    return !!this.getCmderPath();
  }

  hasVsCode() {
    if (this._hasVsCode !== undefined) return this._hasVsCode;
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe code', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this._hasVsCode = !!(out && out.trim());
    } catch {
      const defaultPaths = [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Microsoft VS Code', 'Code.exe'),
        'C:\\Program Files\\Microsoft VS Code\\Code.exe'
      ];
      this._hasVsCode = defaultPaths.some(p => fs.existsSync(p));
    }
    return this._hasVsCode;
  }

  hasCursor() {
    if (this._hasCursor !== undefined) return this._hasCursor;
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe cursor', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this._hasCursor = !!(out && out.trim());
    } catch {
      const defaultPaths = [
        path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'cursor', 'Cursor.exe')
      ];
      this._hasCursor = defaultPaths.some(p => fs.existsSync(p));
    }
    return this._hasCursor;
  }

  hasPhpStorm() {
    if (this._hasPhpStorm !== undefined) return this._hasPhpStorm;
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe phpstorm', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this._hasPhpStorm = !!(out && out.trim());
    } catch {
      this._hasPhpStorm = false;
    }
    return this._hasPhpStorm;
  }

  hasSublime() {
    if (this._hasSublime !== undefined) return this._hasSublime;
    try {
      const { execSync } = require('child_process');
      const out = execSync('where.exe subl', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      this._hasSublime = !!(out && out.trim());
    } catch {
      const defaultPaths = [
        'C:\\Program Files\\Sublime Text\\sublime_text.exe',
        'C:\\Program Files\\Sublime Text 3\\sublime_text.exe'
      ];
      this._hasSublime = defaultPaths.some(p => fs.existsSync(p));
    }
    return this._hasSublime;
  }

  hasNotepadPlusPlus() {
    if (this._hasNpp !== undefined) return this._hasNpp;
    const defaultPaths = [
      'C:\\Program Files\\Notepad++\\notepad++.exe',
      'C:\\Program Files (x86)\\Notepad++\\notepad++.exe'
    ];
    this._hasNpp = defaultPaths.some(p => fs.existsSync(p));
    return this._hasNpp;
  }

  hasGitBash() {
    if (this._hasGitBash !== undefined) return this._hasGitBash;
    const defaultPaths = [
      'C:\\Program Files\\Git\\git-bash.exe',
      'C:\\Program Files\\Git\\bin\\bash.exe',
      path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Git', 'git-bash.exe')
    ];
    this._hasGitBash = defaultPaths.some(p => fs.existsSync(p));
    return this._hasGitBash;
  }

  getConfig() {
    let cfg = {};
    try {
      cfg = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
    } catch {
      cfg = { 
        parkedPaths: [], 
        defaultPhpVersion: '8.4', 
        defaultNodeVersion: '22',
        nginxPort: 80,
        httpsPort: 443,
        tld: 'test'
      };
    }

    cfg.hasWindowsTerminal = this.hasWindowsTerminal();
    cfg.hasCmder = this.hasCmder();
    cfg.cmderPath = this.getCmderPath();
    cfg.hasVsCode = this.hasVsCode();
    cfg.hasCursor = this.hasCursor();
    cfg.hasPhpStorm = this.hasPhpStorm();
    cfg.hasSublime = this.hasSublime();
    cfg.hasNotepadPlusPlus = this.hasNotepadPlusPlus();
    cfg.hasGitBash = this.hasGitBash();

    cfg.rootDir = this.rootDir;
    cfg.binDir = this.binDir;
    cfg.sslDir = this.sslDir;
    cfg.logsDir = this.logsDir;
    cfg.phpDir = this.phpDir;
    cfg.nginxDir = this.nginxDir;
    cfg.sitesDir = this.sitesDir;

    if (!cfg.preferredTerminal) {
      cfg.preferredTerminal = cfg.hasWindowsTerminal ? 'wt' : (cfg.hasCmder ? 'cmder' : 'powershell');
    }
    if (!cfg.preferredEditor) {
      cfg.preferredEditor = cfg.hasVsCode ? 'code' : (cfg.hasCursor ? 'cursor' : 'notepad');
    }
    if (!cfg.tld) cfg.tld = 'test';
    if (!cfg.nginxPort) cfg.nginxPort = 80;
    if (!cfg.httpsPort) cfg.httpsPort = 443;
    if (cfg.autoStartEnvironment === undefined) cfg.autoStartEnvironment = true;
    if (cfg.minimizeToTray === undefined) cfg.minimizeToTray = true;

    return cfg;
  }

  saveConfig(newConfig) {
    const current = this.getConfig();
    const updated = { ...current, ...newConfig };
    fs.writeFileSync(this.configPath, JSON.stringify(updated, null, 2), 'utf-8');
    return updated;
  }

  /**
   * Check if a TCP port is in use
   */
  isPortInUse(port) {
    return new Promise((resolve) => {
      const client = new net.Socket();
      client.setTimeout(400);

      client.once('connect', () => {
        client.destroy();
        resolve(true); // Port is in use
      });

      client.once('timeout', () => {
        client.destroy();
        resolve(false);
      });

      client.once('error', (err) => {
        resolve(false); // Refused -> port is free
      });

      client.connect(port, '127.0.0.1');
    });
  }

  /**
   * Fetch and parse JSON from a URL (follows redirects)
   */
  fetchJson(url, timeoutMs = 10000, maxRedirects = 5) {
    return new Promise((resolve, reject) => {
      const request = (targetUrl, redirectsLeft) => {
        try {
          const parsed = new URL(targetUrl);
          const getter = parsed.protocol === 'https:' ? https : http;
          const options = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            timeout: timeoutMs,
            headers: {
              'User-Agent': 'LaraTool/1.0 (+https://github.com/laratool)',
              'Accept': 'application/json'
            }
          };

          const req = getter.get(options, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              res.resume();
              if (redirectsLeft <= 0) {
                return reject(new Error('Trop de redirections HTTP'));
              }
              const redirectUrl = new URL(res.headers.location, targetUrl).href;
              return request(redirectUrl, redirectsLeft - 1);
            }

            if (res.statusCode !== 200) {
              res.resume();
              return reject(new Error(`Erreur HTTP ${res.statusCode}: ${res.statusMessage || ''}`));
            }

            let raw = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { raw += chunk; });
            res.on('end', () => {
              try {
                resolve(JSON.parse(raw));
              } catch (parseErr) {
                reject(new Error(`Réponse JSON invalide: ${parseErr.message}`));
              }
            });
          });

          req.on('timeout', () => {
            req.destroy(new Error('Délai de connexion dépassé lors de la vérification des mises à jour'));
          });
          req.on('error', reject);
        } catch (err) {
          reject(err);
        }
      };

      request(url, maxRedirects);
    });
  }

  /**
   * Compare two semver-like version strings (e.g. "v24.22.2" vs "v24.21.0" or "8.4.27-1" vs "8.4.26").
   * Returns 1 if a > b, -1 if a < b, 0 if equal on base numeric parts.
   */
  compareVersions(a, b) {
    const parse = (v) => {
      if (!v) return [0, 0, 0];
      const cleaned = String(v).trim().replace(/^v/i, '').split('-')[0];
      const parts = cleaned.split('.').map(n => parseInt(n, 10) || 0);
      while (parts.length < 3) parts.push(0);
      return parts.slice(0, 3);
    };

    const pa = parse(a);
    const pb = parse(b);
    for (let i = 0; i < 3; i++) {
      if (pa[i] > pb[i]) return 1;
      if (pa[i] < pb[i]) return -1;
    }
    return 0;
  }

  /**
   * Download a file from URL to destination with progress
   */
  downloadFile(url, destPath, onProgress) {
    return new Promise((resolve, reject) => {
      const tempPath = destPath + '.tmp';
      const file = fs.createWriteStream(tempPath);

      const cleanupTemp = () => {
        try {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
        } catch (_) {}
      };

      const request = (targetUrl) => {
        try {
          const parsed = new URL(targetUrl);
          const getter = parsed.protocol === 'https:' ? https : http;

          const options = {
            protocol: parsed.protocol,
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 LaraTool/1.0'
            }
          };

          getter.get(options, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
              const redirectUrl = new URL(response.headers.location, targetUrl).href;
              return request(redirectUrl);
            }

            if (response.statusCode !== 200) {
              cleanupTemp();
              return reject(new Error(`Échec du téléchargement (${response.statusCode}): ${response.statusMessage || ''}`));
            }

            const totalBytes = parseInt(response.headers['content-length'] || 0, 10);
            let downloadedBytes = 0;

            response.on('data', (chunk) => {
              downloadedBytes += chunk.length;
              if (totalBytes > 0 && onProgress) {
                const percent = Math.round((downloadedBytes / totalBytes) * 100);
                onProgress(percent, downloadedBytes, totalBytes);
              }
            });

            response.pipe(file);

            file.on('error', (err) => {
              cleanupTemp();
              reject(err);
            });

            file.on('finish', () => {
              file.close(() => {
                try {
                  if (totalBytes > 0 && downloadedBytes < totalBytes) {
                    cleanupTemp();
                    return reject(new Error(`Téléchargement incomplet (${downloadedBytes}/${totalBytes} octets)`));
                  }
                  if (fs.existsSync(destPath)) {
                    fs.unlinkSync(destPath);
                  }
                  fs.renameSync(tempPath, destPath);
                  resolve();
                } catch (e) {
                  cleanupTemp();
                  reject(e);
                }
              });
            });
          }).on('error', (err) => {
            cleanupTemp();
            reject(err);
          });
        } catch (err) {
          cleanupTemp();
          reject(err);
        }
      };

      request(url);
    });
  }

  /**
   * Extract zip archive into target directory
   */
  extractZip(zipPath, targetDir) {
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const fallbackAdmZip = () => {
          try {
            const zip = new AdmZip(zipPath);
            zip.extractAllTo(targetDir, true);
            resolve(true);
          } catch (admErr) {
            reject(admErr);
          }
        };

        if (process.platform === 'win32') {
          const { execFile } = require('child_process');
          execFile('tar.exe', ['-xf', zipPath, '-C', targetDir], { windowsHide: true }, (err) => {
            if (!err) return resolve(true);
            fallbackAdmZip();
          });
          return;
        }

        fallbackAdmZip();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Add a path to the Windows User PATH variable
   */
  async addUserPath(newPath) {
    return new Promise((resolve) => {
      const psScript = `
        $path = [Environment]::GetEnvironmentVariable('Path', 'User')
        if ($path -notlike '*${newPath}*') {
          [Environment]::SetEnvironmentVariable('Path', "$path;${newPath}", 'User')
          Write-Output 'ADDED'
        } else {
          Write-Output 'ALREADY_EXISTS'
        }
      `;
      exec(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, (err, stdout) => {
        resolve(!err);
      });
    });
  }

  /**
   * Open file in VS Code / default code editor, fallback to default text app
   */
  openInEditor(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Le fichier n'existe pas : ${filePath}`);
    }
    const config = this.getConfig();
    const editor = config.preferredEditor || 'code';
    exec(`${editor} "${filePath}"`, (err) => {
      if (err) {
        exec(`notepad.exe "${filePath}"`);
      }
    });
    return { success: true, path: filePath };
  }

  /**
   * Open file or folder in Windows Explorer
   */
  openInExplorer(targetPath) {
    if (!fs.existsSync(targetPath)) {
      throw new Error(`Le chemin n'existe pas : ${targetPath}`);
    }
    const isFile = fs.statSync(targetPath).isFile();
    if (isFile) {
      exec(`explorer.exe /select,"${targetPath}"`);
    } else {
      exec(`explorer.exe "${targetPath}"`);
    }
    return { success: true, path: targetPath };
  }
}

module.exports = new SystemHelper();
