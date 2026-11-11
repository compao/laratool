const path = require('path');
const fs = require('fs');
const os = require('os');
const systemHelper = require('./SystemHelper');
const supervisor = require('./ProcessSupervisor');

const BUILTIN_MODULES = new Set([
  'core', 'date', 'pcre', 'reflection', 'spl', 'standard', 'hash',
  'filter', 'json', 'random', 'readline', 'session', 'tokenizer', 'zlib', 'ctype', 'iconv'
]);

const KNOWN_EXTENSIONS_META = {
  curl: { name: 'curl', category: 'Web & API', desc: 'Requêtes HTTP et communication API (Guzzle, cURL)' },
  fileinfo: { name: 'fileinfo', category: 'Fichiers', desc: 'Détection du type MIME lors de l\'upload de fichiers' },
  gd: { name: 'gd', category: 'Médias', desc: 'Génération et manipulation d\'images (JPEG, PNG, WebP)' },
  intl: { name: 'intl', category: 'Internationalisation', desc: 'Gestion avancée des locales, dates et devises' },
  mbstring: { name: 'mbstring', category: 'Chaînes', desc: 'Support des caractères multi-octets (UTF-8, emojis)' },
  mysqli: { name: 'mysqli', category: 'Base de données', desc: 'Pilote classique MySQL / MariaDB' },
  openssl: { name: 'openssl', category: 'Sécurité', desc: 'Chiffrement, certificats et protocoles HTTPS/TLS' },
  pdo_mysql: { name: 'pdo_mysql', category: 'Base de données', desc: 'Pilote PDO pour MySQL et MariaDB (Laravel DB)' },
  pdo_pgsql: { name: 'pdo_pgsql', category: 'Base de données', desc: 'Pilote PDO pour PostgreSQL' },
  pdo_sqlite: { name: 'pdo_sqlite', category: 'Base de données', desc: 'Pilote PDO pour SQLite' },
  sqlite3: { name: 'sqlite3', category: 'Base de données', desc: 'Moteur de base de données embarqué SQLite 3' },
  zip: { name: 'zip', category: 'Fichiers', desc: 'Lecture et création d\'archives ZIP (Composer)' },
  redis: { name: 'redis', category: 'Cache & Queue', desc: 'Connecteur haute performance Redis (Horizon, Cache)' },
  mongodb: { name: 'mongodb', category: 'Base de données', desc: 'Pilote NoSQL pour bases de données MongoDB' },
  opcache: { name: 'opcache', category: 'Performance', desc: 'Cache bytecode OPcache en mémoire vive' },
  soap: { name: 'soap', category: 'Web & API', desc: 'Support des services web et protocoles SOAP/WSDL' },
  sockets: { name: 'sockets', category: 'Réseau', desc: 'Communication sockets bas niveau TCP/UDP' },
  sodium: { name: 'sodium', category: 'Sécurité', desc: 'Cryptographie moderne Libsodium (Argon2id)' },
  exif: { name: 'exif', category: 'Médias', desc: 'Lecture des métadonnées EXIF des photos numériques' },
  ftp: { name: 'ftp', category: 'Réseau', desc: 'Client de transfert de fichiers FTP' },
  bz2: { name: 'bz2', category: 'Fichiers', desc: 'Compression et décompression d\'archives Bzip2' },
  tidy: { name: 'tidy', category: 'Web & API', desc: 'Nettoyage et réparation de code HTML/XML' },
  xsl: { name: 'xsl', category: 'Web & API', desc: 'Transformations de feuilles de style XSLT' },
  gmp: { name: 'gmp', category: 'Math', desc: 'Calculs de très grande précision GNU MP' },
  ldap: { name: 'ldap', category: 'Annuaire', desc: 'Authentification d\'entreprise LDAP / Active Directory' },
  imap: { name: 'imap', category: 'Email', desc: 'Gestion des boîtes aux lettres IMAP / POP3' },
  bcmath: { name: 'bcmath', category: 'Math', desc: 'Arithmétique binaire de précision arbitraire' },
  calendar: { name: 'calendar', category: 'Utilitaires', desc: 'Conversions entre formats de calendriers' },
  ffi: { name: 'ffi', category: 'Système', desc: 'Foreign Function Interface pour bibliothèques C' },
  odbc: { name: 'odbc', category: 'Base de données', desc: 'Pilote standard ODBC' },
  snmp: { name: 'snmp', category: 'Réseau', desc: 'Protocole SNMP de surveillance réseau' }
};

class PhpManager {
  constructor() {
    this.versions = {
      '8.5': {
        version: '8.5',
        name: 'PHP 8.5',
        latestVersion: '8.5.11',
        port: 9185,
        url: 'https://windows.php.net/downloads/releases/php-8.5.11-nts-Win32-vs17-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/archives/php-8.5.11-nts-Win32-vs17-x64.zip'
      },
      '8.4': {
        version: '8.4',
        name: 'PHP 8.4',
        latestVersion: '8.4.26',
        port: 9184,
        url: 'https://windows.php.net/downloads/releases/php-8.4.26-nts-Win32-vs17-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/archives/php-8.4.26-nts-Win32-vs17-x64.zip'
      },
      '8.3': {
        version: '8.3',
        name: 'PHP 8.3',
        latestVersion: '8.3.35',
        port: 9183,
        url: 'https://windows.php.net/downloads/releases/php-8.3.35-nts-Win32-vs16-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/archives/php-8.3.35-nts-Win32-vs16-x64.zip'
      },
      '8.2': {
        version: '8.2',
        name: 'PHP 8.2',
        latestVersion: '8.2.34',
        port: 9182,
        url: 'https://windows.php.net/downloads/releases/php-8.2.34-nts-Win32-vs16-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/archives/php-8.2.34-nts-Win32-vs16-x64.zip'
      },
      '8.1': {
        version: '8.1',
        name: 'PHP 8.1',
        latestVersion: '8.1.34',
        port: 9181,
        url: 'https://windows.php.net/downloads/releases/php-8.1.34-nts-Win32-vs16-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/archives/php-8.1.34-nts-Win32-vs16-x64.zip'
      },
      '8.0': {
        version: '8.0',
        name: 'PHP 8.0',
        latestVersion: '8.0.30',
        port: 9180,
        url: 'https://windows.php.net/downloads/releases/archives/php-8.0.30-nts-Win32-vs16-x64.zip',
        fallbackUrl: 'https://windows.php.net/downloads/releases/php-8.0.30-nts-Win32-vs16-x64.zip'
      }
    };
    this.latestUpdates = {};
    this._installedVersionCache = new Map();
    this.registerInstalledBranches();
  }

  registerBranchMeta(branch, latestVersion = null) {
    if (this.versions[branch]) return;
    const digits = String(branch).replace('.', '');
    const port = 9100 + (parseInt(digits, 10) || 86);
    this.versions = {
      [branch]: {
        version: branch,
        name: `PHP ${branch}`,
        latestVersion: latestVersion || `${branch}.0`,
        port,
        url: '',
        fallbackUrl: ''
      },
      ...this.versions
    };
  }

  registerInstalledBranches() {
    if (!fs.existsSync(systemHelper.phpDir)) return;
    try {
      const dirs = fs.readdirSync(systemHelper.phpDir);
      for (const name of dirs) {
        const m = name.match(/^php-(\d+\.\d+)$/i);
        if (!m) continue;
        const branch = m[1];
        if (!this.versions[branch] && this.isInstalled(branch)) {
          this.registerBranchMeta(branch);
        }
      }
    } catch {}
  }

  getPort(version) {
    const meta = this.versions[version];
    if (!meta) return null;
    const config = systemHelper.getConfig();
    return (config.phpPorts && config.phpPorts[version]) ? parseInt(config.phpPorts[version], 10) : meta.port;
  }

  async setPort(version, port) {
    const numPort = parseInt(port, 10);
    if (isNaN(numPort) || numPort < 1 || numPort > 65535) {
      throw new Error(`Port FastCGI invalide: ${port}`);
    }
    const serviceName = `php-${version}`;
    const wasRunning = supervisor.isRunning(serviceName);
    if (wasRunning) {
      await this.stop(version);
    }
    const config = systemHelper.getConfig();
    const phpPorts = { ...(config.phpPorts || {}), [version]: numPort };
    systemHelper.saveConfig({ phpPorts });

    if (wasRunning && this.isInstalled(version)) {
      await this.start(version);
    }
    return { success: true, port: numPort };
  }

  getEnabledVersions() {
    const config = systemHelper.getConfig();
    if (Array.isArray(config.enabledPhpVersions)) {
      return config.enabledPhpVersions;
    }
    // Default: show installed versions or default version
    const installed = Object.keys(this.versions).filter(v => this.isInstalled(v));
    const def = config.defaultPhpVersion || '8.3';
    return installed.length > 0 ? Array.from(new Set([...installed, def])) : [def];
  }

  async toggleVersion(version, enabled, options = {}) {
    const meta = this.versions[version];
    if (!meta) throw new Error(`Version PHP non supportée : ${version}`);

    let enabledList = this.getEnabledVersions();
    const config = systemHelper.getConfig();
    let phpPorts = { ...(config.phpPorts || {}) };
    let needsRestart = false;

    if (options && options.port) {
      const p = parseInt(options.port, 10);
      if (!isNaN(p) && p > 0 && p <= 65535) {
        if (phpPorts[version] !== p) {
          phpPorts[version] = p;
          needsRestart = true;
        }
      }
    }

    if (enabled && !enabledList.includes(version)) {
      enabledList.push(version);
    } else if (!enabled) {
      const serviceName = `php-${version}`;
      if (supervisor.isRunning(serviceName)) {
        await this.stop(version);
      }
      enabledList = enabledList.filter(v => v !== version);
    }

    systemHelper.saveConfig({ enabledPhpVersions: enabledList, phpPorts });

    if (enabled && needsRestart && supervisor.isRunning(`php-${version}`)) {
      await this.restart(version);
    }

    return {
      success: true,
      enabledPhpVersions: enabledList,
      port: this.getPort(version)
    };
  }

  getInstalledVersionInfo(version) {
    if (!this.isInstalled(version)) return null;
    const phpExe = this.getPhpExe(version);
    try {
      const mtimeMs = fs.statSync(phpExe).mtimeMs;
      const cached = this._installedVersionCache.get(version);
      if (cached && cached.mtimeMs === mtimeMs) {
        return cached;
      }

      const { execSync } = require('child_process');
      const vOutput = execSync(`"${phpExe}" -n -v`, { encoding: 'utf-8', timeout: 3000, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const match = vOutput.match(/PHP\s+(\d+\.\d+\.\d+)/i);
      const fullVersion = match ? match[1] : null;

      let release = null;
      const releaseMetaPath = path.join(this.getPhpDir(version), '.laratool-release.json');
      if (fs.existsSync(releaseMetaPath)) {
        try {
          const meta = JSON.parse(fs.readFileSync(releaseMetaPath, 'utf-8'));
          if (meta && meta.release && fullVersion && String(meta.release).split('-')[0] === fullVersion) {
            release = String(meta.release);
          }
        } catch {}
      }

      const info = { fullVersion, release, mtimeMs };
      this._installedVersionCache.set(version, info);
      return info;
    } catch {
      return null;
    }
  }

  hasUpdateAvailable(version, installedInfo = null) {
    const updateMeta = this.latestUpdates[version];
    const latestVersion = updateMeta?.latestVersion || this.versions[version]?.latestVersion;
    const latestRelease = updateMeta?.latestRelease || latestVersion;
    if (!latestVersion) return false;

    const info = installedInfo || this.getInstalledVersionInfo(version);
    if (!info || !info.fullVersion) return false;

    const cmp = systemHelper.compareVersions(latestVersion, info.fullVersion);
    if (cmp > 0) return true;
    if (cmp === 0 && info.release && latestRelease && info.release !== latestRelease) {
      const revA = parseInt(String(latestRelease).split('-')[1] || '0', 10) || 0;
      const revB = parseInt(String(info.release).split('-')[1] || '0', 10) || 0;
      return revA > revB;
    }
    return false;
  }

  async checkUpdates() {
    const releases = await systemHelper.fetchJson('https://windows.php.net/downloads/releases/releases.json');
    const checkedAt = new Date().toISOString();
    const updates = {};
    let updatesAvailableCount = 0;

    for (const [branch, entry] of Object.entries(releases || {})) {
      if (!entry || typeof entry !== 'object') continue;
      const ntsKey = Object.keys(entry).find(k => /^nts-.*-x64$/i.test(k));
      const zipPath = ntsKey && entry[ntsKey]?.zip?.path;
      const rawVersion = entry.version;
      if (!zipPath || !rawVersion) continue;

      const baseVersion = String(rawVersion).split('-')[0];
      const existing = this.versions[branch];
      const numericBranch = parseFloat(branch);

      // Update existing branches or discover newer PHP 8.x branches (>= 8.6)
      if (!existing && (isNaN(numericBranch) || numericBranch < 8.6)) {
        continue;
      }

      const primaryUrl = `https://windows.php.net/downloads/releases/${zipPath}`;
      const archiveUrl = `https://windows.php.net/downloads/releases/archives/${zipPath}`;

      if (!existing) {
        const digits = branch.replace('.', '');
        this.versions[branch] = {
          version: branch,
          name: `PHP ${branch}`,
          latestVersion: baseVersion,
          port: 9100 + (parseInt(digits, 10) || 86),
          url: primaryUrl,
          fallbackUrl: archiveUrl
        };
      } else {
        existing.latestVersion = baseVersion;
        if (branch === '8.0') {
          existing.url = archiveUrl;
          existing.fallbackUrl = primaryUrl;
        } else {
          existing.url = primaryUrl;
          existing.fallbackUrl = archiveUrl;
        }
      }

      this.latestUpdates[branch] = {
        latestVersion: baseVersion,
        latestRelease: String(rawVersion),
        url: this.versions[branch].url,
        fallbackUrl: this.versions[branch].fallbackUrl,
        checkedAt
      };
    }

    for (const version of Object.keys(this.versions)) {
      const installedInfo = this.getInstalledVersionInfo(version);
      const hasUpdate = this.hasUpdateAvailable(version, installedInfo);
      if (hasUpdate) updatesAvailableCount++;
      const latestMeta = this.latestUpdates[version];
      updates[version] = {
        installed: !!installedInfo,
        installedVersion: installedInfo?.fullVersion || null,
        latestVersion: latestMeta?.latestVersion || this.versions[version].latestVersion || null,
        latestRelease: latestMeta?.latestRelease || null,
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
      const isRunning = supervisor.isRunning(`php-${key}`);
      const effectivePort = this.getPort(key);
      const isPortActive = await systemHelper.isPortInUse(effectivePort);
      const latestMeta = this.latestUpdates[key];
      const latestVersion = latestMeta?.latestVersion || meta.latestVersion || null;
      const hasUpdate = installed ? this.hasUpdateAvailable(key, installedInfo) : false;

      result.push({
        id: key,
        name: meta.name,
        port: effectivePort,
        defaultPort: meta.port,
        installed,
        running: isRunning,
        portConflict: !isRunning && isPortActive,
        isDefault: config.defaultPhpVersion === key,
        enabled: enabledList.includes(key),
        fullVersion: installedInfo?.fullVersion || null,
        latestVersion,
        hasUpdate,
        checkedAt: latestMeta?.checkedAt || null,
        path: installed ? this.getPhpDir(key) : null
      });
    }

    return result;
  }

  // Strictly isolated path in ~/.config/laratool/php/php-<version>
  getPhpDir(version) {
    return path.join(systemHelper.phpDir, `php-${version}`);
  }

  getPhpExe(version) {
    return path.join(this.getPhpDir(version), 'php.exe');
  }

  getPhpCgiExe(version) {
    return path.join(this.getPhpDir(version), 'php-cgi.exe');
  }

  isInstalled(version) {
    return fs.existsSync(this.getPhpExe(version)) && fs.existsSync(this.getPhpCgiExe(version));
  }

  async listVersions() {
    const config = systemHelper.getConfig();
    const result = [];

    for (const [key, meta] of Object.entries(this.versions)) {
      const installed = this.isInstalled(key);
      const installedInfo = installed ? this.getInstalledVersionInfo(key) : null;
      const isRunning = supervisor.isRunning(`php-${key}`);
      const effectivePort = this.getPort(key);
      const isPortActive = await systemHelper.isPortInUse(effectivePort);
      const latestMeta = this.latestUpdates[key];
      const latestVersion = latestMeta?.latestVersion || meta.latestVersion || null;
      const hasUpdate = installed ? this.hasUpdateAvailable(key, installedInfo) : false;

      result.push({
        id: key,
        name: meta.name,
        port: effectivePort,
        defaultPort: meta.port,
        installed,
        running: isRunning,
        portConflict: !isRunning && isPortActive,
        isDefault: config.defaultPhpVersion === key,
        fullVersion: installedInfo?.fullVersion || null,
        latestVersion,
        hasUpdate,
        checkedAt: latestMeta?.checkedAt || null,
        path: installed ? this.getPhpDir(key) : null
      });
    }

    return result;
  }

  async updateVersion(version, onProgress) {
    if (!this.versions[version]) {
      throw new Error(`Version PHP ${version} non supportée`);
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
    if (!meta) throw new Error(`Version PHP ${version} non supportée`);

    const isUpdate = !!(options && options.isUpdate);
    const serviceName = `php-${version}`;
    const wasRunning = supervisor.isRunning(serviceName);

    if (options && options.port) {
      await this.setPort(version, options.port);
    }

    let enabledList = this.getEnabledVersions();
    if (!enabledList.includes(version)) {
      enabledList.push(version);
      systemHelper.saveConfig({ enabledPhpVersions: enabledList });
    }

    const targetDir = this.getPhpDir(version);
    const tempZip = path.join(systemHelper.rootDir, `temp-php-${version}.zip`);

    // Fast copy if local cache/source exists on machine (only for fresh installs, never for updates)
    const cleanVer = version.replace('.', '');
    const localExistingDir = path.join(os.homedir(), '.config', 'herd', 'bin', `php${cleanVer}`);

    if (!isUpdate && !this.isInstalled(version) && fs.existsSync(path.join(localExistingDir, 'php.exe')) && fs.existsSync(path.join(localExistingDir, 'php-cgi.exe'))) {
      if (onProgress) onProgress(20);
      this.copyDirRecursiveSync(localExistingDir, targetDir);
      if (onProgress) onProgress(80);
      this.configurePhpIni(version);
      this._installedVersionCache.delete(version);
      await this.ensureShims();
      if (onProgress) onProgress(100);
      return true;
    }

    const tempExtractDir = path.join(systemHelper.rootDir, `temp-extract-php-${version}`);
    let preservedIni = null;
    const preservedExtFiles = [];

    try {
      try {
        await systemHelper.downloadFile(meta.url, tempZip, onProgress);
      } catch (err) {
        if (meta.fallbackUrl) {
          await systemHelper.downloadFile(meta.fallbackUrl, tempZip, onProgress);
        } else {
          throw err;
        }
      }

      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
      await systemHelper.extractZip(tempZip, tempExtractDir);

      if (wasRunning) {
        await this.stop(version);
        await new Promise(r => setTimeout(r, 300));
      }

      // Preserve existing php.ini and any custom extension DLLs (e.g. php_xdebug.dll)
      if (fs.existsSync(targetDir)) {
        const existingIniPath = path.join(targetDir, 'php.ini');
        if (fs.existsSync(existingIniPath)) {
          preservedIni = fs.readFileSync(existingIniPath, 'utf-8');
        }

        const oldExtDir = path.join(targetDir, 'ext');
        const newExtDir = path.join(tempExtractDir, 'ext');
        if (fs.existsSync(oldExtDir)) {
          const newExtSet = new Set(
            fs.existsSync(newExtDir) ? fs.readdirSync(newExtDir).map(f => f.toLowerCase()) : []
          );
          for (const file of fs.readdirSync(oldExtDir)) {
            if (file.toLowerCase().endsWith('.dll') && !newExtSet.has(file.toLowerCase())) {
              preservedExtFiles.push({
                name: file,
                content: fs.readFileSync(path.join(oldExtDir, file))
              });
            }
          }
        }

        fs.rmSync(targetDir, { recursive: true, force: true });
      }

      fs.renameSync(tempExtractDir, targetDir);

      if (preservedIni !== null) {
        fs.writeFileSync(path.join(targetDir, 'php.ini'), preservedIni, 'utf-8');
      } else {
        this.configurePhpIni(version);
      }

      if (preservedExtFiles.length > 0) {
        const targetExtDir = path.join(targetDir, 'ext');
        if (!fs.existsSync(targetExtDir)) {
          fs.mkdirSync(targetExtDir, { recursive: true });
        }
        for (const extFile of preservedExtFiles) {
          fs.writeFileSync(path.join(targetExtDir, extFile.name), extFile.content);
        }
      }

      const releaseTag = this.latestUpdates[version]?.latestRelease || meta.latestVersion;
      if (releaseTag) {
        try {
          fs.writeFileSync(
            path.join(targetDir, '.laratool-release.json'),
            JSON.stringify({ release: releaseTag, updatedAt: new Date().toISOString() }, null, 2),
            'utf-8'
          );
        } catch {}
      }

      this._installedVersionCache.delete(version);
      await this.ensureShims();

      if (wasRunning) {
        await this.start(version);
      }

      return true;
    } finally {
      if (fs.existsSync(tempZip)) {
        try { fs.unlinkSync(tempZip); } catch {}
      }
      if (fs.existsSync(tempExtractDir)) {
        try { fs.rmSync(tempExtractDir, { recursive: true, force: true }); } catch {}
      }
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

  configurePhpIni(version) {
    const phpDir = this.getPhpDir(version);
    const iniPath = path.join(phpDir, 'php.ini');
    const devIni = path.join(phpDir, 'php.ini-development');
    const prodIni = path.join(phpDir, 'php.ini-production');

    let baseContent = '';
    if (fs.existsSync(iniPath)) {
      baseContent = fs.readFileSync(iniPath, 'utf-8');
    } else if (fs.existsSync(devIni)) {
      baseContent = fs.readFileSync(devIni, 'utf-8');
    } else if (fs.existsSync(prodIni)) {
      baseContent = fs.readFileSync(prodIni, 'utf-8');
    }

    const extDir = path.join(phpDir, 'ext').replace(/\\/g, '/');

    // Remove old LaraTool block if present to prevent stacking duplicates
    baseContent = baseContent.replace(/; --- LaraTool Configuration ---[\s\S]*?; --- End LaraTool Configuration ---/g, '').trim();

    const settings = `
; --- LaraTool Configuration ---
extension_dir = "${extDir}"
extension=curl
extension=fileinfo
extension=gd
extension=intl
extension=mbstring
extension=mysqli
extension=openssl
extension=pdo_mysql
extension=pdo_pgsql
extension=pdo_sqlite
extension=sqlite3
extension=zip

memory_limit = 512M
upload_max_filesize = 128M
post_max_size = 128M
max_execution_time = 300
date.timezone = UTC
cgi.force_redirect = 0
; --- End LaraTool Configuration ---
`;
    fs.writeFileSync(iniPath, baseContent + '\n' + settings, 'utf-8');
  }

  isXdebugAvailable(version) {
    const phpDir = this.getPhpDir(version);
    const targetDll = path.join(phpDir, 'ext', 'php_xdebug.dll');
    if (fs.existsSync(targetDll)) return true;

    const candidates = [
      `C:\\Program Files\\Herd\\resources\\app.asar.unpacked\\resources\\bin\\xdebug\\xdebug-${version}.dll`,
      path.join(os.homedir(), '.config', 'herd', 'bin', 'xdebug', `xdebug-${version}.dll`),
      path.join(os.homedir(), '.config', 'herd', 'bin', `php${version.replace('.', '')}`, 'ext', 'php_xdebug.dll')
    ];
    return candidates.some(c => fs.existsSync(c));
  }

  ensureXdebug(version) {
    const phpDir = this.getPhpDir(version);
    const extDir = path.join(phpDir, 'ext');
    const targetDll = path.join(extDir, 'php_xdebug.dll');
    if (fs.existsSync(targetDll)) return true;

    const candidates = [
      `C:\\Program Files\\Herd\\resources\\app.asar.unpacked\\resources\\bin\\xdebug\\xdebug-${version}.dll`,
      path.join(os.homedir(), '.config', 'herd', 'bin', 'xdebug', `xdebug-${version}.dll`),
      path.join(os.homedir(), '.config', 'herd', 'bin', `php${version.replace('.', '')}`, 'ext', 'php_xdebug.dll')
    ];

    for (const cand of candidates) {
      if (fs.existsSync(cand)) {
        if (!fs.existsSync(extDir)) fs.mkdirSync(extDir, { recursive: true });
        fs.copyFileSync(cand, targetDll);
        return true;
      }
    }
    return false;
  }

  async toggleExtension(version, extName, enabled) {
    const phpDir = this.getPhpDir(version);
    const iniPath = path.join(phpDir, 'php.ini');
    if (!fs.existsSync(iniPath)) {
      this.configurePhpIni(version);
    }

    const cleanName = extName.toLowerCase().replace(/^php_/, '').replace(/\.dll$/, '').trim();
    if (cleanName === 'xdebug') {
      return this.toggleXdebug(version, enabled);
    }

    const isZend = cleanName === 'opcache';
    const directive = isZend ? 'zend_extension' : 'extension';
    
    let content = fs.readFileSync(iniPath, 'utf-8');

    // Regex to match extension = <cleanName> (with or without php_ prefix, with or without .dll, quotes)
    const escaped = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const extRegex = new RegExp(
      `^([ \\t]*)(;*)([ \\t]*(?:zend_)?extension[ \\t]*=[ \\t]*['"]?(?:php_)?${escaped}(?:\\.dll)?['"]?[ \\t]*)$`,
      'gmi'
    );

    const hasMatch = extRegex.test(content);
    extRegex.lastIndex = 0;

    if (enabled) {
      if (hasMatch) {
        content = content.replace(extRegex, `$1${directive}=${cleanName}`);
      } else {
        const laraBlockRegex = /(; --- LaraTool Configuration ---[\s\S]*?)(; --- End LaraTool Configuration ---)/i;
        if (laraBlockRegex.test(content)) {
          content = content.replace(laraBlockRegex, `$1${directive}=${cleanName}\n$2`);
        } else {
          content += `\n${directive}=${cleanName}\n`;
        }
      }
    } else {
      if (hasMatch) {
        content = content.replace(extRegex, (match, p1, p2, p3) => {
          return `${p1};${p3.replace(/^;+/, '')}`;
        });
      }
    }

    fs.writeFileSync(iniPath, content, 'utf-8');

    if (supervisor.isRunning(`php-${version}`)) {
      await this.restart(version);
    }

    return this.getDetails(version);
  }

  async toggleXdebug(version, enabled, options = {}) {
    const phpDir = this.getPhpDir(version);
    const iniPath = path.join(phpDir, 'php.ini');
    if (!fs.existsSync(iniPath)) {
      this.configurePhpIni(version);
    }

    if (enabled) {
      this.ensureXdebug(version);
    }

    let content = fs.readFileSync(iniPath, 'utf-8');

    const mode = options.mode || 'debug,develop';
    const port = options.clientPort || 9003;
    const idekey = options.idekey || 'PHPSTORM';
    const startWithRequest = options.startWithRequest || 'yes';

    const xdebugBlockRegex = /; --- LaraTool Xdebug ---[\s\S]*?; --- End LaraTool Xdebug ---/i;

    if (enabled) {
      const newBlock = `; --- LaraTool Xdebug ---
zend_extension = xdebug
xdebug.mode = ${mode}
xdebug.start_with_request = ${startWithRequest}
xdebug.client_port = ${port}
xdebug.client_host = 127.0.0.1
xdebug.idekey = ${idekey}
; --- End LaraTool Xdebug ---`;

      if (xdebugBlockRegex.test(content)) {
        content = content.replace(xdebugBlockRegex, newBlock);
      } else {
        content += `\n\n${newBlock}\n`;
      }
    } else {
      if (xdebugBlockRegex.test(content)) {
        content = content.replace(xdebugBlockRegex, (block) => {
          return block.replace(/^([ \t]*)zend_extension[ \t]*=[ \t]*xdebug/gmi, '$1;zend_extension = xdebug');
        });
      }
      const looseXdebug = /^([ \t]*)zend_extension[ \t]*=[ \t]*['"]?(?:php_)?xdebug(?:\.dll)?['"]?[ \t]*$/gmi;
      content = content.replace(looseXdebug, '$1;zend_extension = xdebug');
    }

    fs.writeFileSync(iniPath, content, 'utf-8');

    if (supervisor.isRunning(`php-${version}`)) {
      await this.restart(version);
    }

    return this.getDetails(version);
  }

  async updateIniDirective(version, key, value) {
    const phpDir = this.getPhpDir(version);
    const iniPath = path.join(phpDir, 'php.ini');
    if (!fs.existsSync(iniPath)) {
      this.configurePhpIni(version);
    }

    let content = fs.readFileSync(iniPath, 'utf-8');

    const escapedKey = key.replace(/\./g, '\\.');
    const directiveRegex = new RegExp(`^([ \\t]*;*[ \\t]*)${escapedKey}([ \\t]*=[ \\t]*)(.*)$`, 'gmi');

    if (directiveRegex.test(content)) {
      content = content.replace(directiveRegex, `${key} = ${value}`);
    } else {
      const laraBlockRegex = /(; --- LaraTool Configuration ---[\s\S]*?)(; --- End LaraTool Configuration ---)/i;
      if (laraBlockRegex.test(content)) {
        content = content.replace(laraBlockRegex, `$1${key} = ${value}\n$2`);
      } else {
        content += `\n${key} = ${value}\n`;
      }
    }

    fs.writeFileSync(iniPath, content, 'utf-8');

    if (supervisor.isRunning(`php-${version}`)) {
      await this.restart(version);
    }

    return this.getDetails(version);
  }

  async start(version) {
    if (!this.isInstalled(version)) {
      throw new Error(`PHP ${version} n'est pas encore installé dans .config/laratool`);
    }

    const meta = this.versions[version];
    const cgiExe = this.getPhpCgiExe(version);
    const serviceName = `php-${version}`;

    if (supervisor.isRunning(serviceName)) {
      return { success: true, message: `PHP ${version} est déjà actif` };
    }

    const phpDir = this.getPhpDir(version);
    const port = this.getPort(version);

    supervisor.start(serviceName, cgiExe, ['-b', `127.0.0.1:${port}`], {
      cwd: phpDir,
      autoRestart: true,
      env: {
        ...process.env,
        PATH: `${phpDir};${path.join(phpDir, 'ext')};${process.env.PATH}`,
        PHP_FCGI_MAX_REQUESTS: '1000'
      }
    });

    return { success: true, port };
  }

  async stop(version) {
    const serviceName = `php-${version}`;
    await supervisor.stop(serviceName);
    return { success: true };
  }

  async restart(version) {
    await this.stop(version);
    await new Promise(r => setTimeout(r, 500));
    return this.start(version);
  }

  async setDefault(version) {
    if (!this.isInstalled(version)) {
      throw new Error(`PHP ${version} n'est pas installé`);
    }
    systemHelper.saveConfig({ defaultPhpVersion: version });
    await this.ensureShims();
    return { success: true, defaultPhpVersion: version };
  }

  async ensureShims() {
    const config = systemHelper.getConfig();
    const defaultVersion = config.defaultPhpVersion || '8.3';
    const phpExe = this.getPhpExe(defaultVersion);

    const phpBatPath = path.join(systemHelper.binDir, 'php.bat');
    const phpBatContent = `@echo off
rem LaraTool PHP CLI Shim
set "CURRENT_DIR=%CD%"
set "PHP_BIN=${phpExe}"
if exist "%PHP_BIN%" (
  "%PHP_BIN%" %*
) else (
  echo [LaraTool] PHP ${defaultVersion} n'est pas trouve dans %PHP_BIN%
  exit /b 1
)
`;
    fs.writeFileSync(phpBatPath, phpBatContent, 'utf-8');

    const composerPhar = path.join(systemHelper.binDir, 'composer.phar');
    const composerBat = path.join(systemHelper.binDir, 'composer.bat');

    if (!fs.existsSync(composerPhar)) {
      try {
        await systemHelper.downloadFile('https://getcomposer.org/composer-stable.phar', composerPhar);
      } catch (e) {
        console.error('Failed to download composer.phar:', e);
      }
    }

    const composerBatContent = `@echo off
rem LaraTool Composer Shim
call "%~dp0php.bat" "%~dp0composer.phar" %*
`;
    fs.writeFileSync(composerBat, composerBatContent, 'utf-8');

    await systemHelper.addUserPath(systemHelper.binDir);
  }

  async getDetails(version) {
    const meta = this.versions[version];
    if (!meta) throw new Error(`Version PHP non supportée : ${version}`);

    const installed = this.isInstalled(version);
    const phpDir = this.getPhpDir(version);
    const phpExe = this.getPhpExe(version);
    const phpCgiExe = this.getPhpCgiExe(version);
    const iniPath = path.join(phpDir, 'php.ini');
    const extDir = path.join(phpDir, 'ext');
    const isRunning = supervisor.isRunning(`php-${version}`);
    const port = this.getPort(version);
    const config = systemHelper.getConfig();

    let buildInfo = '';
    let compiler = '';
    let architecture = 'x64';
    let threadSafety = 'NTS';
    let extensions = [];
    let iniValues = {};
    let availableDlls = [];

    if (installed) {
      const { execSync } = require('child_process');

      // Ensure php.ini exists
      if (!fs.existsSync(iniPath)) {
        this.configurePhpIni(version);
      }

      // 1. Get php -v
      try {
        const vOutput = execSync(`"${phpExe}" -v`, { encoding: 'utf-8', timeout: 3000 }).trim();
        buildInfo = vOutput.split(/\r?\n/)[0] || '';
        if (vOutput.includes('NTS')) threadSafety = 'NTS';
        else if (vOutput.includes('TS')) threadSafety = 'TS';
        if (vOutput.includes('x64')) architecture = 'x64';
        else if (vOutput.includes('x86')) architecture = 'x86';
        if (vOutput.includes('Visual C++')) {
          const match = vOutput.match(/Visual C\+\+ [0-9]+/);
          if (match) compiler = match[0];
        }
      } catch {}

      // 2. Get loaded modules php -m
      try {
        const mOutput = execSync(`"${phpExe}" -d xdebug.mode=off -m`, { encoding: 'utf-8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] });
        extensions = mOutput.split(/\r?\n/)
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('[') && !s.endsWith(']'));
      } catch {}

      // 3. Get key ini directives & Xdebug
      try {
        const phpCode = `echo json_encode([
          'memory_limit' => ini_get('memory_limit'),
          'upload_max_filesize' => ini_get('upload_max_filesize'),
          'post_max_size' => ini_get('post_max_size'),
          'max_execution_time' => ini_get('max_execution_time'),
          'max_input_time' => ini_get('max_input_time'),
          'date.timezone' => ini_get('date.timezone') ?: 'UTC',
          'display_errors' => ini_get('display_errors'),
          'error_reporting' => ini_get('error_reporting'),
          'opcache.enable' => ini_get('opcache.enable'),
          'short_open_tag' => ini_get('short_open_tag'),
          'xdebug_loaded' => extension_loaded('xdebug'),
          'xdebug_version' => extension_loaded('xdebug') ? (phpversion('xdebug') ?: '') : '',
          'xdebug_mode' => ini_get('xdebug.mode') ?: '',
          'xdebug_port' => ini_get('xdebug.client_port') ?: '',
          'xdebug_idekey' => ini_get('xdebug.idekey') ?: '',
          'xdebug_start_with_request' => ini_get('xdebug.start_with_request') ?: ''
        ]);`;
        const iniOutput = execSync(`"${phpExe}" -d xdebug.mode=off -r "${phpCode.replace(/\r?\n/g, ' ')}"`, { encoding: 'utf-8', timeout: 3000, stdio: ['pipe', 'pipe', 'ignore'] });
        iniValues = JSON.parse(iniOutput.trim());
      } catch {}

      // 4. Scan available extension DLLs in ext/
      if (fs.existsSync(extDir)) {
        try {
          availableDlls = fs.readdirSync(extDir)
            .filter(f => f.endsWith('.dll') && (f.startsWith('php_') || f.startsWith('xdebug')))
            .map(f => f.replace(/^php_/, '').replace(/\.dll$/, ''));
        } catch {}
      }
    }

    // 5. Build Xdebug & Extension Catalog
    let iniContent = '';
    if (fs.existsSync(iniPath)) {
      try {
        iniContent = fs.readFileSync(iniPath, 'utf-8');
      } catch {}
    }

    const isExtInIni = (name) => {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const reg = new RegExp(`^[ \\t]*(?:zend_)?extension[ \\t]*=[ \\t]*['"]?(?:php_)?${escaped}(?:\\.dll)?['"]?[ \\t]*$`, 'mi');
      return reg.test(iniContent);
    };

    const isXdebugLoaded = !!iniValues.xdebug_loaded || extensions.map(e => e.toLowerCase()).includes('xdebug');
    const isXdebugInIni = isExtInIni('xdebug');
    const xdebugAvailable = this.isXdebugAvailable(version);

    // Extract INI values if not active in CLI
    const xdebugModeMatch = iniContent.match(/^[ \t]*xdebug\.mode[ \t]*=[ \t]*(.+)$/m);
    const xdebugPortMatch = iniContent.match(/^[ \t]*xdebug\.client_port[ \t]*=[ \t]*(.+)$/m);
    const xdebugIdekeyMatch = iniContent.match(/^[ \t]*xdebug\.idekey[ \t]*=[ \t]*(.+)$/m);
    const xdebugStartMatch = iniContent.match(/^[ \t]*xdebug\.start_with_request[ \t]*=[ \t]*(.+)$/m);

    const xdebug = {
      installed: xdebugAvailable,
      enabled: isXdebugLoaded || isXdebugInIni,
      version: iniValues.xdebug_version || (isXdebugLoaded ? '3.x' : ''),
      mode: iniValues.xdebug_mode || (xdebugModeMatch ? xdebugModeMatch[1].trim() : 'debug,develop'),
      clientPort: iniValues.xdebug_port || (xdebugPortMatch ? parseInt(xdebugPortMatch[1].trim(), 10) : 9003),
      idekey: iniValues.xdebug_idekey || (xdebugIdekeyMatch ? xdebugIdekeyMatch[1].trim() : 'PHPSTORM'),
      startWithRequest: iniValues.xdebug_start_with_request || (xdebugStartMatch ? xdebugStartMatch[1].trim() : 'yes')
    };

    const lowerExtensions = new Set(extensions.map(e => e.toLowerCase()));
    const catalogMap = new Map();

    // Add known common extensions
    for (const [key, meta] of Object.entries(KNOWN_EXTENSIONS_META)) {
      const isBuiltin = BUILTIN_MODULES.has(key);
      const isLoaded = lowerExtensions.has(key) || (key === 'opcache' && lowerExtensions.has('zend opcache'));
      const inIni = isExtInIni(key);
      const hasDll = availableDlls.includes(key);

      if (isLoaded || hasDll || inIni || isBuiltin) {
        catalogMap.set(key, {
          name: key,
          category: meta.category,
          description: meta.desc,
          enabled: isLoaded || inIni,
          isBuiltin,
          isZend: key === 'opcache',
          isCommon: true
        });
      }
    }

    // Add other available DLLs from ext/
    for (const dll of availableDlls) {
      const lowerDll = dll.toLowerCase();
      if (!catalogMap.has(lowerDll) && lowerDll !== 'xdebug') {
        const isLoaded = lowerExtensions.has(lowerDll);
        const inIni = isExtInIni(dll);
        catalogMap.set(lowerDll, {
          name: dll,
          category: 'Complémentaire',
          description: `Extension DLL standard (php_${dll}.dll)`,
          enabled: isLoaded || inIni,
          isBuiltin: false,
          isZend: false,
          isCommon: false
        });
      }
    }

    // Add remaining loaded modules
    for (const ext of extensions) {
      const lower = ext.toLowerCase();
      if (lower === 'zend opcache' || lower === 'xdebug') continue;
      if (!catalogMap.has(lower)) {
        const isBuiltin = BUILTIN_MODULES.has(lower);
        catalogMap.set(lower, {
          name: ext,
          category: isBuiltin ? 'Noyau PHP' : 'Module Actif',
          description: isBuiltin ? 'Module compilé en dur dans le moteur PHP' : 'Module dynamique chargé',
          enabled: true,
          isBuiltin,
          isZend: false,
          isCommon: false
        });
      }
    }

    const extensionCatalog = Array.from(catalogMap.values()).sort((a, b) => {
      // Sort common extensions first, then alphabetically
      if (a.isCommon && !b.isCommon) return -1;
      if (!a.isCommon && b.isCommon) return 1;
      return a.name.localeCompare(b.name);
    });

    const installedInfo = installed ? this.getInstalledVersionInfo(version) : null;
    const latestMeta = this.latestUpdates[version];
    const latestVersion = latestMeta?.latestVersion || meta.latestVersion || null;
    const hasUpdate = installed ? this.hasUpdateAvailable(version, installedInfo) : false;

    return {
      id: version,
      name: meta.name,
      version: meta.version,
      installed,
      running: isRunning,
      isDefault: config.defaultPhpVersion === version,
      fullVersion: installedInfo?.fullVersion || null,
      latestVersion,
      hasUpdate,
      checkedAt: latestMeta?.checkedAt || null,
      port,
      phpDir,
      phpExe,
      phpCgiExe,
      iniPath,
      buildInfo,
      compiler,
      architecture,
      threadSafety,
      extensions,
      iniValues,
      availableDlls,
      extensionCatalog,
      xdebug
    };
  }

  openIni(version) {
    const phpDir = this.getPhpDir(version);
    const iniPath = path.join(phpDir, 'php.ini');
    if (!fs.existsSync(iniPath)) {
      this.configurePhpIni(version);
    }
    return systemHelper.openInEditor(iniPath);
  }

  openFolder(version) {
    const phpDir = this.getPhpDir(version);
    return systemHelper.openInExplorer(phpDir);
  }

  openTerminal(version) {
    const phpDir = this.getPhpDir(version);
    if (!fs.existsSync(phpDir)) {
      throw new Error(`PHP ${version} n'est pas installé`);
    }

    const { exec } = require('child_process');
    const config = systemHelper.getConfig();
    const preferredTerminal = config.preferredTerminal || (systemHelper.hasWindowsTerminal() ? 'wt' : (systemHelper.hasCmder() ? 'cmder' : 'powershell'));
    const psScript = `$env:PATH = '${phpDir};${path.join(phpDir, 'ext')};${systemHelper.binDir};' + $env:PATH; Write-Host '🐘 LaraTool PHP ${version} Active' -ForegroundColor Magenta; php -v; Write-Host ''; Write-Host 'Commandes prêtes : php, composer' -ForegroundColor Gray; Write-Host ''`;
    const b64Cmd = Buffer.from(psScript, 'utf16le').toString('base64');

    if (preferredTerminal === 'cmder' && systemHelper.hasCmder()) {
      const cmderExe = systemHelper.getCmderPath();
      exec(`"${cmderExe}" /SINGLE /START "${phpDir}"`, {
        env: {
          ...process.env,
          PATH: `${phpDir};${path.join(phpDir, 'ext')};${systemHelper.binDir};${process.env.PATH || ''}`
        }
      }, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else if (preferredTerminal === 'wt' && systemHelper.hasWindowsTerminal()) {
      exec(`wt.exe --title "LaraTool: PHP ${version}" powershell.exe -NoExit -EncodedCommand ${b64Cmd}`, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else {
      exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
    }
    return { success: true };
  }
}

module.exports = new PhpManager();
