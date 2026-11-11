const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const systemHelper = require('./SystemHelper');
const nginxManager = require('./NginxManager');
const phpManager = require('./PhpManager');
const hostsManager = require('./HostsManager');
const certificateManager = require('./CertificateManager');

class ProjectScanner {
  constructor() {
    this.sitesFile = path.join(systemHelper.sitesDir, 'sites.json');
  }

  getSavedSites() {
    try {
      if (fs.existsSync(this.sitesFile)) {
        return JSON.parse(fs.readFileSync(this.sitesFile, 'utf-8'));
      }
    } catch {
      // ignore
    }
    return [];
  }

  saveSites(sites) {
    fs.writeFileSync(this.sitesFile, JSON.stringify(sites, null, 2), 'utf-8');
  }

  /**
   * Scan all parked directories for Laravel / PHP projects
   */
  async scanAll() {
    const config = systemHelper.getConfig();
    const parkedPaths = config.parkedPaths || [];
    const defaultPhp = config.defaultPhpVersion || '8.4';

    const sslStatus = certificateManager.getStatus();
    const isSsl = !!(sslStatus.enabled && sslStatus.wildcardReady);
    const detectedSites = [];

    for (const basePath of parkedPaths) {
      if (!fs.existsSync(basePath)) continue;

      try {
        const entries = fs.readdirSync(basePath, { withFileTypes: true });

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;

          // Skip hidden or system folders
          if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'vendor') continue;

          const projectPath = path.join(basePath, entry.name);
          const isLaravel = fs.existsSync(path.join(projectPath, 'artisan'));
          const hasPublicIndex = fs.existsSync(path.join(projectPath, 'public', 'index.php'));
          const hasRootIndex = fs.existsSync(path.join(projectPath, 'index.php'));

          if (isLaravel || hasPublicIndex || hasRootIndex) {
            const siteName = entry.name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
            const tld = config.tld || 'test';
            const domain = `${siteName}.${tld}`;

            // Detect per-project PHP, Node & SSL from .laratool.json
            let projectPhp = defaultPhp;
            let projectNode = config.defaultNodeVersion || '20';
            let projectSsl = false;
            const projectConfigFile = path.join(projectPath, '.laratool.json');
            if (fs.existsSync(projectConfigFile)) {
              try {
                const pConfig = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
                if (pConfig.phpVersion) projectPhp = pConfig.phpVersion;
                if (pConfig.nodeVersion) projectNode = pConfig.nodeVersion;
                if (pConfig.ssl !== undefined) projectSsl = !!pConfig.ssl;
              } catch {}
            }

            const publicPath = (isLaravel || hasPublicIndex)
              ? path.join(projectPath, 'public')
              : projectPath;

            // Detect Laravel version from composer.json
            let framework = isLaravel ? 'Laravel' : 'PHP';
            let frameworkVersion = '';
            const composerFile = path.join(projectPath, 'composer.json');
            if (fs.existsSync(composerFile)) {
              try {
                const composerData = JSON.parse(fs.readFileSync(composerFile, 'utf-8'));
                if (composerData.require && composerData.require['laravel/framework']) {
                  frameworkVersion = composerData.require['laravel/framework'];
                }
              } catch {}
            }

            const phpPort = (phpManager.getPort ? phpManager.getPort(projectPhp) : null) || phpManager.versions[projectPhp]?.port || 9183;
            const details = this.parseProjectDetails(projectPath);

            const siteSsl = projectSsl && (
              certificateManager.isProjectCertReady(domain) ||
              (certificateManager.getStatus().wildcardReady && certificateManager.getStatus().enabled)
            );

            detectedSites.push({
              name: siteName,
              domain,
              path: projectPath,
              publicPath,
              isLaravel,
              framework,
              frameworkVersion,
              phpVersion: projectPhp,
              phpPort,
              nodeVersion: projectNode,
              inHosts: hostsManager.isConfigured(domain),
              isSsl: siteSsl,
              sslConfigured: projectSsl,
              details,
              dbInfo: this.getProjectDbInfo(projectPath)
            });
          }
        }
      } catch (err) {
        console.error(`Error scanning parked path ${basePath}:`, err);
      }
    }

    this.saveSites(detectedSites);

    // Sync Nginx configurations
    if (nginxManager.isInstalled()) {
      for (const site of detectedSites) {
        await nginxManager.generateSiteConfig(site);
      }
      await nginxManager.reload();
    }

    // Automatically sync domains to Windows hosts file
    try {
      const allDomains = detectedSites.map(s => s.domain);
      if (allDomains.length > 0) {
        await hostsManager.syncAll(allDomains);
      }
    } catch (hostsErr) {
      console.warn('[ProjectScanner] Failed to auto-sync hosts file:', hostsErr.message);
    }

    return detectedSites;
  }

  /**
   * Set PHP version for a specific project
   */
  async setProjectPhp(projectPath, phpVersion) {
    const projectConfigFile = path.join(projectPath, '.laratool.json');
    let data = {};
    if (fs.existsSync(projectConfigFile)) {
      try {
        data = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
      } catch {}
    }

    data.phpVersion = phpVersion;
    fs.writeFileSync(projectConfigFile, JSON.stringify(data, null, 2), 'utf-8');

    // Rescan & reload Nginx
    return this.scanAll();
  }

  /**
   * Set Node.js version for a specific project
   */
  async setProjectNode(projectPath, nodeVersion) {
    const projectConfigFile = path.join(projectPath, '.laratool.json');
    let data = {};
    if (fs.existsSync(projectConfigFile)) {
      try {
        data = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
      } catch {}
    }

    data.nodeVersion = nodeVersion;
    fs.writeFileSync(projectConfigFile, JSON.stringify(data, null, 2), 'utf-8');

    return this.scanAll();
  }

  /**
   * Set SSL status for a specific project
   */
  async setProjectSsl(projectPath, enabled) {
    const projectConfigFile = path.join(projectPath, '.laratool.json');
    let data = {};
    if (fs.existsSync(projectConfigFile)) {
      try {
        data = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
      } catch {}
    }

    const siteName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const domain = `${siteName}.test`;

    if (enabled) {
      // Generate dedicated certificate for this project domain
      await certificateManager.generateProjectCert(domain);
      data.ssl = true;
    } else {
      data.ssl = false;
    }

    fs.writeFileSync(projectConfigFile, JSON.stringify(data, null, 2), 'utf-8');

    // Rescan & reload Nginx
    return this.scanAll();
  }

  openInExplorer(dirPath) {
    exec(`explorer.exe "${dirPath}"`);
  }

  openInEditor(dirPath) {
    const config = systemHelper.getConfig();
    const editor = config.preferredEditor || 'code';
    exec(`${editor} "${dirPath}"`, (err) => {
      if (err) {
        this.openInExplorer(dirPath);
      }
    });
  }

  parseProjectDetails(projectPath) {
    const details = {
      hasEnv: false,
      hasVendor: fs.existsSync(path.join(projectPath, 'vendor')),
      hasNodeModules: fs.existsSync(path.join(projectPath, 'node_modules')),
      hasGit: fs.existsSync(path.join(projectPath, '.git')),
      gitBranch: null,
      env: {}
    };

    const envFile = path.join(projectPath, '.env');
    if (fs.existsSync(envFile)) {
      details.hasEnv = true;
      try {
        const content = fs.readFileSync(envFile, 'utf-8');
        const lines = content.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const eqIndex = trimmed.indexOf('=');
            if (eqIndex > 0) {
              const key = trimmed.substring(0, eqIndex).trim();
              let val = trimmed.substring(eqIndex + 1).trim();
              if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
                val = val.substring(1, val.length - 1);
              }
              details.env[key] = val;
            }
          }
        }
      } catch {}
    }

    if (details.hasGit) {
      const headFile = path.join(projectPath, '.git', 'HEAD');
      if (fs.existsSync(headFile)) {
        try {
          const headContent = fs.readFileSync(headFile, 'utf-8').trim();
          if (headContent.startsWith('ref: refs/heads/')) {
            details.gitBranch = headContent.replace('ref: refs/heads/', '');
          } else {
            details.gitBranch = headContent.substring(0, 7);
          }
        } catch {}
      }
    }

    details.composerPackages = {};
    const composerFile = path.join(projectPath, 'composer.json');
    if (fs.existsSync(composerFile)) {
      try {
        const cJson = JSON.parse(fs.readFileSync(composerFile, 'utf-8'));
        details.composerPackages = {
          ...(cJson.require || {}),
          ...(cJson['require-dev'] || {})
        };
      } catch {}
    }

    return details;
  }

  async installComposerPackage(projectPath, packageName, isDev = false) {
    const flag = isDev ? '--dev' : '';
    const cmd = `composer require ${packageName} ${flag}`.trim();
    const res = await this.runCommand(projectPath, cmd);
    const updatedDetails = this.parseProjectDetails(projectPath);
    return {
      ...res,
      details: updatedDetails
    };
  }

  openTerminal(dirPath) {
    const projectConfigFile = path.join(dirPath, '.laratool.json');
    const config = systemHelper.getConfig();
    let nodeVer = config.defaultNodeVersion || '22';
    let phpVer = config.defaultPhpVersion || '8.4';

    if (fs.existsSync(projectConfigFile)) {
      try {
        const pConfig = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
        if (pConfig.nodeVersion) nodeVer = pConfig.nodeVersion;
        if (pConfig.phpVersion) phpVer = pConfig.phpVersion;
      } catch {}
    }

    const projectName = path.basename(dirPath);
    const targetPhpDir = path.join(systemHelper.phpDir, `php-${phpVer}`);
    const targetNodeDir = path.join(systemHelper.nodeDir, `node-${nodeVer}`);

    const pathDirs = [];
    if (fs.existsSync(targetPhpDir)) pathDirs.push(targetPhpDir);
    if (fs.existsSync(targetNodeDir)) pathDirs.push(targetNodeDir);
    pathDirs.push(systemHelper.binDir);

    const pathString = pathDirs.join(';') + ';';
    const banner = `Write-Host '=========================================' -ForegroundColor DarkGray; Write-Host '  LaraTool - Environnement de Projet' -ForegroundColor Magenta; Write-Host '=========================================' -ForegroundColor DarkGray; Write-Host '📁 Projet  : ${projectName}' -ForegroundColor Cyan; Write-Host '🐘 PHP     : ${phpVer}' -ForegroundColor Green; Write-Host '🟢 Node.js : ${nodeVer}' -ForegroundColor Green; Write-Host ''; Write-Host 'Commandes prêtes : php, composer, node, npm, npx' -ForegroundColor Gray; Write-Host ''`;
    const psScript = `Set-Location -LiteralPath '${dirPath.replace(/'/g, "''")}'; $env:PATH = '${pathString}' + $env:PATH; ${banner}`;
    const b64Cmd = Buffer.from(psScript, 'utf16le').toString('base64');

    const preferredTerminal = config.preferredTerminal || (systemHelper.hasWindowsTerminal() ? 'wt' : (systemHelper.hasCmder() ? 'cmder' : 'powershell'));

    if (preferredTerminal === 'cmder' && systemHelper.hasCmder()) {
      const cmderExe = systemHelper.getCmderPath();
      exec(`"${cmderExe}" /SINGLE /START "${dirPath}"`, {
        env: {
          ...process.env,
          PATH: `${pathString}${process.env.PATH || ''}`
        }
      }, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else if (preferredTerminal === 'wt' && systemHelper.hasWindowsTerminal()) {
      // Use -EncodedCommand to avoid semicolons being parsed by Windows Terminal as multiple tab splitters
      const wtCmd = `wt.exe --title "LaraTool: ${projectName}" -d "${dirPath}" powershell.exe -NoExit -EncodedCommand ${b64Cmd}`;
      exec(wtCmd, (err) => {
        if (err) {
          exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
        }
      });
    } else {
      exec(`powershell.exe -NoExit -EncodedCommand ${b64Cmd}`);
    }
  }

  async openInBrowser(domain, ssl = null) {
    if (typeof domain === 'object' && domain !== null) {
      if (ssl === null && domain.isSsl !== undefined) {
        ssl = domain.isSsl;
      }
      domain = domain.domain;
    }
    const isSsl = ssl !== null ? !!ssl : (certificateManager.getStatus().enabled && certificateManager.getStatus().wildcardReady);
    const protocol = isSsl ? 'https' : 'http';
    const port = isSsl ? 443 : await nginxManager.getEffectivePort();
    const portSuffix = (port === 80 || port === 443) ? '' : `:${port}`;
    const url = `${protocol}://${domain}${portSuffix}`;
    try {
      const { shell } = require('electron');
      await shell.openExternal(url);
    } catch {
      exec(`start "" "${url}"`);
    }
  }

  runCommand(projectPath, command) {
    return new Promise((resolve) => {
      const config = systemHelper.getConfig();
      let nodeVer = config.defaultNodeVersion || '22';
      let phpVer = config.defaultPhpVersion || '8.4';
      const projectConfigFile = path.join(projectPath, '.laratool.json');
      if (fs.existsSync(projectConfigFile)) {
        try {
          const cfg = JSON.parse(fs.readFileSync(projectConfigFile, 'utf-8'));
          if (cfg.nodeVersion) nodeVer = cfg.nodeVersion;
          if (cfg.phpVersion) phpVer = cfg.phpVersion;
        } catch {}
      }

      const targetPhpDir = path.join(systemHelper.phpDir, `php-${phpVer}`);
      const targetNodeDir = path.join(systemHelper.nodeDir, `node-${nodeVer}`);
      const pathDirs = [];
      if (fs.existsSync(targetPhpDir)) pathDirs.push(targetPhpDir);
      if (fs.existsSync(targetNodeDir)) pathDirs.push(targetNodeDir);
      pathDirs.push(systemHelper.binDir);

      const env = {
        ...process.env,
        PATH: pathDirs.join(';') + ';' + (process.env.PATH || '')
      };

      exec(command, { cwd: projectPath, env, maxBuffer: 1024 * 1024 * 5 }, (err, stdout, stderr) => {
        resolve({
          success: !err,
          stdout: stdout || '',
          stderr: stderr || (err ? err.message : '')
        });
      });
    });
  }

  /**
   * Format byte count to human-readable size
   */
  formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'Ko', 'Mo', 'Go'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Get Laravel logs for a project with real-time parsing
   */
  async getLogs(projectPath, requestedFile = null, maxEntries = 150) {
    const logsDir = path.join(projectPath, 'storage', 'logs');
    if (!fs.existsSync(logsDir)) {
      return {
        exists: false,
        files: [],
        selectedFile: null,
        entries: [],
        stats: { total: 0, errors: 0, warnings: 0, infos: 0, debugs: 0 }
      };
    }

    // List all .log files in storage/logs
    let logFiles = [];
    try {
      const dirEntries = fs.readdirSync(logsDir, { withFileTypes: true });
      logFiles = dirEntries
        .filter(e => e.isFile() && e.name.endsWith('.log'))
        .map(e => {
          const filePath = path.join(logsDir, e.name);
          const stat = fs.statSync(filePath);
          return {
            name: e.name,
            size: stat.size,
            sizeFormatted: this.formatBytes(stat.size),
            updatedAt: stat.mtime.toISOString()
          };
        })
        .sort((a, b) => {
          if (a.name === 'laravel.log') return -1;
          if (b.name === 'laravel.log') return 1;
          return new Date(b.updatedAt) - new Date(a.updatedAt);
        });
    } catch {
      // ignore
    }

    if (logFiles.length === 0) {
      return {
        exists: true,
        files: [],
        selectedFile: null,
        entries: [],
        stats: { total: 0, errors: 0, warnings: 0, infos: 0, debugs: 0 }
      };
    }

    const selectedFile = (requestedFile && logFiles.some(f => f.name === requestedFile))
      ? requestedFile
      : logFiles[0].name;

    const targetFilePath = path.join(logsDir, selectedFile);
    if (!fs.existsSync(targetFilePath)) {
      return {
        exists: true,
        files: logFiles,
        selectedFile,
        entries: [],
        stats: { total: 0, errors: 0, warnings: 0, infos: 0, debugs: 0 }
      };
    }

    const stat = fs.statSync(targetFilePath);
    if (stat.size === 0) {
      return {
        exists: true,
        files: logFiles,
        selectedFile,
        fileSize: 0,
        fileSizeFormatted: '0 B',
        updatedAt: stat.mtime.toISOString(),
        entries: [],
        stats: { total: 0, errors: 0, warnings: 0, infos: 0, debugs: 0 }
      };
    }

    // Read last 512KB if large
    const maxBytes = 512 * 1024;
    let buffer;
    if (stat.size > maxBytes) {
      const fd = fs.openSync(targetFilePath, 'r');
      buffer = Buffer.alloc(maxBytes);
      fs.readSync(fd, buffer, 0, maxBytes, stat.size - maxBytes);
      fs.closeSync(fd);
    } else {
      buffer = fs.readFileSync(targetFilePath);
    }

    const content = buffer.toString('utf-8');
    const lines = content.split(/\r?\n/);

    const headerRegex = /^\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:[+-]\d{2}:?\d{2}|Z)?)\]\s+([a-zA-Z0-9_-]+)\.([A-Z]+):\s*(.*)$/;

    const rawEntries = [];
    let currentEntry = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(headerRegex);

      if (match) {
        if (currentEntry) {
          rawEntries.push(currentEntry);
        }
        currentEntry = {
          timestamp: match[1],
          environment: match[2],
          level: match[3].toUpperCase(),
          rawMessage: match[4] || '',
          stackLines: []
        };
      } else if (currentEntry) {
        currentEntry.stackLines.push(line);
      }
    }

    if (currentEntry) {
      rawEntries.push(currentEntry);
    }

    const stats = { total: rawEntries.length, errors: 0, warnings: 0, infos: 0, debugs: 0 };

    const processed = rawEntries.map((e, index) => {
      // Stats
      if (['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(e.level)) {
        stats.errors++;
      } else if (e.level === 'WARNING') {
        stats.warnings++;
      } else if (['INFO', 'NOTICE'].includes(e.level)) {
        stats.infos++;
      } else {
        stats.debugs++;
      }

      let message = e.rawMessage;
      let context = '';
      let exceptionClass = null;

      const excMatch = message.match(/([a-zA-Z0-9_]+Exception|[a-zA-Z0-9_]+Error)/);
      if (excMatch) {
        exceptionClass = excMatch[1];
      }

      const lastBraceIndex = message.lastIndexOf('{');
      if (lastBraceIndex > 0 && message.endsWith('}')) {
        try {
          const potentialJson = message.substring(lastBraceIndex);
          JSON.parse(potentialJson);
          context = potentialJson;
          message = message.substring(0, lastBraceIndex).trim();
        } catch {}
      }

      const fullStack = e.stackLines.join('\n').trim();

      return {
        id: `log-${index}-${Date.now()}`,
        timestamp: e.timestamp,
        environment: e.environment,
        level: e.level,
        message: message.trim(),
        context: context,
        exceptionClass,
        stackTrace: fullStack,
        hasStack: fullStack.length > 0
      };
    });

    return {
      exists: true,
      files: logFiles,
      selectedFile,
      fileSize: stat.size,
      fileSizeFormatted: this.formatBytes(stat.size),
      updatedAt: stat.mtime.toISOString(),
      entries: processed.reverse().slice(0, maxEntries),
      stats
    };
  }

  /**
   * Clear (truncate) a project log file
   */
  async clearLog(projectPath, logFileName = 'laravel.log') {
    const filePath = path.join(projectPath, 'storage', 'logs', logFileName);
    if (fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf-8');
      return { success: true };
    }
    return { success: false, error: 'Fichier log introuvable' };
  }

  /**
   * Open log file in code editor
   */
  async openLogFile(projectPath, logFileName = 'laravel.log') {
    const filePath = path.join(projectPath, 'storage', 'logs', logFileName);
    if (fs.existsSync(filePath)) {
      return systemHelper.openInEditor(filePath);
    }
    return false;
  }

  /**
   * Open storage/logs folder in Explorer
   */
  async openLogsFolder(projectPath) {
    const logsDir = path.join(projectPath, 'storage', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return systemHelper.openInExplorer(logsDir);
  }

  getProjectDbInfo(projectPath) {
    const envPath = path.join(projectPath, '.env');
    let connection = 'mysql';
    let host = '127.0.0.1';
    let port = '3306';
    let database = '';
    let username = 'root';

    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf-8');
        const getVal = (key, defaultVal) => {
          const match = content.match(new RegExp(`^\\s*${key}\\s*=\\s*(.*)$`, 'm'));
          if (match) {
            let v = match[1].trim();
            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
              v = v.slice(1, -1);
            }
            return v;
          }
          return defaultVal;
        };

        connection = getVal('DB_CONNECTION', 'mysql');
        host = getVal('DB_HOST', '127.0.0.1');
        port = getVal('DB_PORT', connection === 'pgsql' ? '5432' : '3306');
        database = getVal('DB_DATABASE', '');
        username = getVal('DB_USERNAME', connection === 'pgsql' ? 'postgres' : 'root');
      } catch {}
    }

    const isSqlite = connection === 'sqlite';
    let sqlitePath = null;
    if (isSqlite) {
      if (database && (database.startsWith('/') || database.includes(':'))) {
        sqlitePath = database;
      } else {
        sqlitePath = path.resolve(projectPath, database || 'database/database.sqlite');
      }
    }

    return {
      connection,
      host,
      port,
      database: isSqlite ? sqlitePath : database,
      username,
      isSqlite,
      sqlitePath,
      exists: isSqlite ? fs.existsSync(sqlitePath) : true
    };
  }

  /**
   * Get detailed site information (Herd "About" inspector)
   */
  async getProjectAbout(projectPath) {
    const isLaravel = fs.existsSync(path.join(projectPath, 'artisan'));
    if (!isLaravel) {
      return {
        isLaravel: false,
        sections: null
      };
    }

    let aboutData = null;
    let fallback = false;

    // 1. Try running `php artisan about --json`
    try {
      const res = await this.runCommand(projectPath, 'php artisan about --json');
      if (res.success && res.stdout) {
        const jsonMatch = res.stdout.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aboutData = JSON.parse(jsonMatch[0]);
        }
      }
    } catch (e) {
      console.warn('php artisan about --json failed:', e.message);
    }

    // 2. Fallback if aboutData is null or incomplete
    if (!aboutData || !aboutData.environment) {
      fallback = true;
      aboutData = this.buildFallbackAbout(projectPath);
    }

    // Check storage link
    const publicStorage = path.join(projectPath, 'public', 'storage');
    const storageLinked = fs.existsSync(publicStorage);

    // Double check maintenance mode directly from file in storage/framework/down
    const downFile = path.join(projectPath, 'storage', 'framework', 'down');
    const isDown = fs.existsSync(downFile);
    if (aboutData.environment) {
      aboutData.environment.maintenance_mode = isDown;
    }

    return {
      isLaravel: true,
      fallback,
      storageLinked,
      data: aboutData
    };
  }

  buildFallbackAbout(projectPath) {
    const details = this.parseProjectDetails(projectPath);
    const env = details.env || {};
    const composerFile = path.join(projectPath, 'composer.json');
    let composerJson = {};
    if (fs.existsSync(composerFile)) {
      try {
        composerJson = JSON.parse(fs.readFileSync(composerFile, 'utf-8'));
      } catch {}
    }

    // Check cache files
    const configCached = fs.existsSync(path.join(projectPath, 'bootstrap', 'cache', 'config.php'));
    const routesCached = fs.existsSync(path.join(projectPath, 'bootstrap', 'cache', 'routes-v7.php'));
    const eventsCached = fs.existsSync(path.join(projectPath, 'bootstrap', 'cache', 'events.php'));
    const viewsDir = path.join(projectPath, 'storage', 'framework', 'views');
    let viewsCached = false;
    if (fs.existsSync(viewsDir)) {
      try {
        viewsCached = fs.readdirSync(viewsDir).filter(f => f.endsWith('.php')).length > 0;
      } catch {}
    }

    const downFile = path.join(projectPath, 'storage', 'framework', 'down');
    const isDown = fs.existsSync(downFile);

    const laravelVersion = composerJson.require?.['laravel/framework'] || details.composerPackages?.['laravel/framework'] || '';
    const siteName = path.basename(projectPath);

    return {
      environment: {
        application_name: env.APP_NAME || siteName,
        laravel_version: laravelVersion.replace(/[\^~]/g, ''),
        php_version: process.versions.php || '',
        composer_version: '',
        environment: env.APP_ENV || 'local',
        debug_mode: env.APP_DEBUG === 'true' || env.APP_DEBUG === '1',
        url: env.APP_URL || `${siteName}.test`,
        maintenance_mode: isDown
      },
      cache: {
        config: configCached,
        events: eventsCached,
        routes: routesCached,
        views: viewsCached
      },
      drivers: {
        broadcasting: env.BROADCAST_CONNECTION || env.BROADCAST_DRIVER || 'log',
        cache: env.CACHE_STORE || env.CACHE_DRIVER || 'file',
        database: env.DB_CONNECTION || 'mysql',
        logs: [env.LOG_CHANNEL || 'single'],
        mail: env.MAIL_MAILER || env.MAIL_DRIVER || 'smtp',
        queue: env.QUEUE_CONNECTION || env.QUEUE_DRIVER || 'sync',
        session: env.SESSION_DRIVER || 'file'
      }
    };
  }

  async toggleMaintenance(projectPath, enable, secret = null) {
    const cmd = enable 
      ? (secret ? `php artisan down --secret="${secret}"` : 'php artisan down')
      : 'php artisan up';
    const res = await this.runCommand(projectPath, cmd);
    const about = await this.getProjectAbout(projectPath);
    return {
      ...res,
      about
    };
  }

  async clearCaches(projectPath) {
    const res = await this.runCommand(projectPath, 'php artisan optimize:clear');
    const about = await this.getProjectAbout(projectPath);
    return {
      ...res,
      about
    };
  }

  async optimizeCaches(projectPath) {
    const res = await this.runCommand(projectPath, 'php artisan optimize');
    const about = await this.getProjectAbout(projectPath);
    return {
      ...res,
      about
    };
  }

  async createStorageLink(projectPath) {
    const res = await this.runCommand(projectPath, 'php artisan storage:link');
    const about = await this.getProjectAbout(projectPath);
    return {
      ...res,
      about
    };
  }
}

module.exports = new ProjectScanner();
