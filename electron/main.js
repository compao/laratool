const { app, BrowserWindow, ipcMain, dialog, Tray, Menu, nativeImage, session, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const systemHelper = require('./services/SystemHelper');
const supervisor = require('./services/ProcessSupervisor');
const phpManager = require('./services/PhpManager');
const nginxManager = require('./services/NginxManager');
const projectScanner = require('./services/ProjectScanner');
const hostsManager = require('./services/HostsManager');
const serviceManager = require('./services/ServiceManager');
const nodeManager = require('./services/NodeManager');
const certificateManager = require('./services/CertificateManager');
const tunnelManager = require('./services/TunnelManager');
const projectCreator = require('./services/ProjectCreator');
const preinstalledTools = require('./services/PreinstalledTools');

let mainWindow = null;
let tray = null;
let rendererReady = false;
const pendingMainErrors = [];

function recordMainError(source, err) {
  const message = err instanceof Error ? err.message : String(err || 'Erreur inconnue');
  const stack = err instanceof Error ? err.stack : '';
  console.error(`[${source}]`, err);

  try {
    const logPath = path.join(systemHelper.logsDir, 'app-errors.log');
    const line = `[${new Date().toISOString()}] [${source}] ${stack || message}\n`;
    fs.appendFileSync(logPath, line, 'utf-8');
  } catch (_) {}

  const payload = { source, message };
  if (mainWindow && !mainWindow.isDestroyed() && rendererReady) {
    mainWindow.webContents.send('app:error', payload);
  } else {
    pendingMainErrors.push(payload);
  }
}

process.on('uncaughtException', (err) => {
  recordMainError('uncaughtException', err);
});

process.on('unhandledRejection', (reason) => {
  recordMainError('unhandledRejection', reason);
});

const isDev = process.env.NODE_ENV !== 'production' && !app.isPackaged;

if (process.platform === 'win32') {
  app.setAppUserModelId('com.laratool.app');
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      if (!mainWindow.isVisible()) mainWindow.show();
      mainWindow.focus();
    }
  });
}

function getTrayIcon() {
  const trayIconPath = path.join(__dirname, 'assets', 'tray.png');
  if (fs.existsSync(trayIconPath)) {
    const img = nativeImage.createFromPath(trayIconPath);
    if (!img.isEmpty()) return img;
  }
  return nativeImage.createFromBuffer(
    Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAExJREFUOE9jZKAQMFKon2HUAAYGBoa/DAwM//9jk2f8j4s+ZBhQZAGyAAYGBu4/dHEdTBXwGgZUg+EwYEAaDAX8eAEMDAwM3zDkAQZMAOUzHhXlqE1YAAAAAElFTkSuQmCC', 'base64')
  );
}

function createWindow() {
  Menu.setApplicationMenu(null);
  rendererReady = false;

  const windowIconPath = path.join(__dirname, 'assets', 'tray.png');

  mainWindow = new BrowserWindow({
    width: 1140,
    height: 740,
    minWidth: 960,
    minHeight: 600,
    title: 'LaraTool',
    icon: fs.existsSync(windowIconPath) ? windowIconPath : undefined,
    backgroundColor: '#0f172a', // Slate 900
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#94a3b8',
      height: 64
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      webviewTag: true
    }
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
      shell.openExternal(url).catch(() => {});
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const allowedPrefix = isDev ? 'http://localhost:5173' : 'file://';
    if (!url.startsWith(allowedPrefix)) {
      event.preventDefault();
      if (url.startsWith('http://') || url.startsWith('https://')) {
        shell.openExternal(url).catch(() => {});
      }
    }
  });

  mainWindow.webContents.on('did-finish-load', () => {
    rendererReady = true;
    while (pendingMainErrors.length > 0) {
      const nextErr = pendingMainErrors.shift();
      mainWindow?.webContents.send('app:error', nextErr);
    }
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (isDev && (input.key === 'F12' || (input.control && input.shift && input.key.toLowerCase() === 'i'))) {
      mainWindow.webContents.toggleDevTools();
    }
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
    // Only reload the application if the main window failed to load (e.g. Vite starting)
    // NEVER reload if an iframe preview inside a project view fails to load!
    if (!isMainFrame) return;
    if (errorCode === -3) return; // ERR_ABORTED

    if (isDev) {
      setTimeout(() => {
        mainWindow?.loadURL('http://localhost:5173');
      }, 1000);
    }
  });

  mainWindow.on('close', (event) => {
    const config = systemHelper.getConfig();
    const shouldMinimize = config.minimizeToTray !== false;

    if (!app.isQuitting && shouldMinimize) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
    app.isQuitting = true;
  });
}

function createTray() {
  const icon = getTrayIcon();

  tray = new Tray(icon);
  tray.setToolTip('LaraTool - Laravel Local Environment');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Ouvrir LaraTool',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Démarrer tous les services',
      click: async () => {
        const config = systemHelper.getConfig();
        const defPhp = config.defaultPhpVersion || '8.3';
        if (phpManager.isInstalled(defPhp)) {
          await phpManager.start(defPhp);
        }
        if (nginxManager.isInstalled()) {
          await nginxManager.start();
        }
      }
    },
    {
      label: 'Arrêter tous les services',
      click: async () => {
        await supervisor.stopAll();
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// Register IPC Handlers
function setupIpcHandlers() {
  // PHP
  ipcMain.handle('php:list', async () => phpManager.listVersions());
  ipcMain.handle('php:getCatalog', async () => phpManager.getCatalog());
  ipcMain.handle('php:getDetails', async (event, version) => phpManager.getDetails(version));
  ipcMain.handle('php:openIni', async (event, version) => phpManager.openIni(version));
  ipcMain.handle('php:openFolder', async (event, version) => phpManager.openFolder(version));
  ipcMain.handle('php:openTerminal', async (event, version) => phpManager.openTerminal(version));
  ipcMain.handle('php:toggle', async (event, version, enabled, options) => phpManager.toggleVersion(version, enabled, options));
  ipcMain.handle('php:setPort', async (event, version, port) => phpManager.setPort(version, port));
  ipcMain.handle('php:install', async (event, version, options) => {
    return phpManager.downloadAndInstall(version, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: `php-${version}`, percent });
    }, options);
  });
  ipcMain.handle('php:checkUpdates', async () => phpManager.checkUpdates());
  ipcMain.handle('php:update', async (event, version) => {
    return phpManager.updateVersion(version, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: `php-${version}`, percent });
    });
  });
  ipcMain.handle('php:start', async (event, version) => phpManager.start(version));
  ipcMain.handle('php:stop', async (event, version) => phpManager.stop(version));
  ipcMain.handle('php:restart', async (event, version) => phpManager.restart(version));
  ipcMain.handle('php:setDefault', async (event, version) => phpManager.setDefault(version));
  ipcMain.handle('php:toggleExtension', async (event, version, extName, enabled) => phpManager.toggleExtension(version, extName, enabled));
  ipcMain.handle('php:toggleXdebug', async (event, version, enabled, options) => phpManager.toggleXdebug(version, enabled, options));
  ipcMain.handle('php:updateIniDirective', async (event, version, key, value) => phpManager.updateIniDirective(version, key, value));

  // Node.js
  ipcMain.handle('node:list', async () => nodeManager.listVersions());
  ipcMain.handle('node:getCatalog', async () => nodeManager.getCatalog());
  ipcMain.handle('node:toggle', async (event, version, enabled) => nodeManager.toggleVersion(version, enabled));
  ipcMain.handle('node:install', async (event, version) => {
    return nodeManager.downloadAndInstall(version, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: `node-${version}`, percent });
    });
  });
  ipcMain.handle('node:checkUpdates', async () => nodeManager.checkUpdates());
  ipcMain.handle('node:update', async (event, version) => {
    return nodeManager.updateVersion(version, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: `node-${version}`, percent });
    });
  });
  ipcMain.handle('node:setDefault', async (event, version) => nodeManager.setDefault(version));
  ipcMain.handle('node:openTerminal', (event, version) => nodeManager.openTerminal(version));

  // Nginx
  ipcMain.handle('nginx:isInstalled', async () => nginxManager.isInstalled());
  ipcMain.handle('nginx:install', async () => {
    return nginxManager.install((percent) => {
      mainWindow?.webContents.send('download:progress', { item: 'nginx', percent });
    });
  });
  ipcMain.handle('nginx:isRunning', async () => nginxManager.isRunning());
  ipcMain.handle('nginx:start', async () => nginxManager.start());
  ipcMain.handle('nginx:stop', async () => nginxManager.stop());
  ipcMain.handle('nginx:reload', async () => nginxManager.reload());
  ipcMain.handle('nginx:getLogs', async () => supervisor.getLogs('nginx'));
  ipcMain.handle('nginx:openConfig', async () => nginxManager.openConfig());
  ipcMain.handle('nginx:openConfD', async () => nginxManager.openConfD());
  ipcMain.handle('nginx:openSiteConfig', async (event, siteName) => nginxManager.openSiteConfig(siteName));
  ipcMain.handle('nginx:openFolder', async () => nginxManager.openFolder());
  ipcMain.handle('nginx:listSiteConfigs', async () => nginxManager.listSiteConfigs());

  // System Helpers
  ipcMain.handle('system:openInEditor', async (event, filePath) => systemHelper.openInEditor(filePath));
  ipcMain.handle('system:openInExplorer', async (event, targetPath) => systemHelper.openInExplorer(targetPath));
  ipcMain.handle('system:openExternal', async (event, url) => {
    if (url && (typeof url === 'string') && (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('mailto:'))) {
      return shell.openExternal(url);
    }
    return false;
  });

  // Projects
  ipcMain.handle('projects:scan', async () => projectScanner.scanAll());
  ipcMain.handle('projects:setPhp', async (event, projectPath, version) => projectScanner.setProjectPhp(projectPath, version));
  ipcMain.handle('projects:setNode', async (event, projectPath, version) => projectScanner.setProjectNode(projectPath, version));
  ipcMain.handle('projects:openExplorer', (event, p) => projectScanner.openInExplorer(p));
  ipcMain.handle('projects:openEditor', (event, p) => projectScanner.openInEditor(p));
  ipcMain.handle('projects:openTerminal', (event, p) => projectScanner.openTerminal(p));
  ipcMain.handle('projects:openBrowser', (event, domain, ssl) => projectScanner.openInBrowser(domain, ssl));
  ipcMain.handle('projects:runCommand', async (event, projectPath, command) => projectScanner.runCommand(projectPath, command));
  ipcMain.handle('projects:installPackage', async (event, projectPath, packageName, isDev) => projectScanner.installComposerPackage(projectPath, packageName, isDev));
  ipcMain.handle('projects:setSsl', async (event, projectPath, enabled) => projectScanner.setProjectSsl(projectPath, enabled));
  ipcMain.handle('projects:getLogs', async (event, projectPath, logFileName, maxEntries) => projectScanner.getLogs(projectPath, logFileName, maxEntries));
  ipcMain.handle('projects:clearLog', async (event, projectPath, logFileName) => projectScanner.clearLog(projectPath, logFileName));
  ipcMain.handle('projects:openLogFile', async (event, projectPath, logFileName) => projectScanner.openLogFile(projectPath, logFileName));
  ipcMain.handle('projects:openLogsFolder', async (event, projectPath) => projectScanner.openLogsFolder(projectPath));
  ipcMain.handle('projects:validateNew', async (event, name, parkedPath) => projectCreator.validate(name, parkedPath));
  ipcMain.handle('projects:create', async (event, options) => {
    return projectCreator.createProject(options, (progressData) => {
      mainWindow?.webContents.send('project-create:progress', progressData);
    });
  });
  ipcMain.handle('projects:getAbout', async (event, projectPath) => projectScanner.getProjectAbout(projectPath));
  ipcMain.handle('projects:toggleMaintenance', async (event, projectPath, enable, secret) => projectScanner.toggleMaintenance(projectPath, enable, secret));
  ipcMain.handle('projects:clearCaches', async (event, projectPath) => projectScanner.clearCaches(projectPath));
  ipcMain.handle('projects:optimizeCaches', async (event, projectPath) => projectScanner.optimizeCaches(projectPath));
  ipcMain.handle('projects:createStorageLink', async (event, projectPath) => projectScanner.createStorageLink(projectPath));

  // Config
  ipcMain.handle('config:get', async () => systemHelper.getConfig());
  ipcMain.handle('config:save', async (event, cfg) => systemHelper.saveConfig(cfg));
  ipcMain.handle('config:selectDirectory', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    return res.filePaths[0] || null;
  });
  ipcMain.handle('config:addParkedPath', async (event, newPath) => {
    const config = systemHelper.getConfig();
    const paths = new Set(config.parkedPaths || []);
    paths.add(newPath);
    systemHelper.saveConfig({ parkedPaths: Array.from(paths) });
    return projectScanner.scanAll();
  });
  ipcMain.handle('config:removeParkedPath', async (event, targetPath) => {
    const config = systemHelper.getConfig();
    const paths = (config.parkedPaths || []).filter(p => p !== targetPath);
    systemHelper.saveConfig({ parkedPaths: paths });
    return projectScanner.scanAll();
  });

  // Hosts
  ipcMain.handle('hosts:addDomain', async (event, domain) => hostsManager.addDomain(domain));
  ipcMain.handle('hosts:syncAll', async (event, domains) => hostsManager.syncAll(domains));

  // SSL & Certificates
  ipcMain.handle('ssl:getStatus', async () => certificateManager.getStatus());
  ipcMain.handle('ssl:toggle', async (event, enabled) => {
    const res = await certificateManager.toggleSsl(enabled, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: 'mkcert', percent });
    });
    if (nginxManager.isInstalled()) {
      await nginxManager.writeMainConfig();
      const sites = projectScanner.getSavedSites();
      for (const site of sites) {
        await nginxManager.generateSiteConfig(site);
      }
      await nginxManager.reload();
    }
    return res;
  });
  ipcMain.handle('ssl:installCa', async () => {
    const res = await certificateManager.installCa((percent) => {
      mainWindow?.webContents.send('download:progress', { item: 'mkcert', percent });
    });
    if (certificateManager.getStatus().enabled) {
      await certificateManager.generateWildcardCert();
      if (nginxManager.isInstalled()) {
        await nginxManager.writeMainConfig();
        const sites = projectScanner.getSavedSites();
        for (const site of sites) {
          await nginxManager.generateSiteConfig(site);
        }
        await nginxManager.reload();
      }
    }
    return res;
  });

  // Services (Catalog, MySQL, Postgres, MongoDB, CouchDB, Redis, Mailpit, Meilisearch, S3)
  ipcMain.handle('services:list', async () => serviceManager.listAll());
  ipcMain.handle('services:getCatalog', async () => serviceManager.getCatalog());
  ipcMain.handle('services:toggle', async (event, id, enabled, options) => serviceManager.toggleService(id, enabled, options));
  ipcMain.handle('services:install', async (event, id, versionKey) => {
    const progressItem = versionKey ? `${id}-${versionKey}` : id;
    return serviceManager.install(id, versionKey, (percent) => {
      mainWindow?.webContents.send('download:progress', { item: progressItem, percent });
    });
  });
  ipcMain.handle('services:setVersion', async (event, id, versionKey) => serviceManager.setActiveVersion(id, versionKey));
  ipcMain.handle('services:start', async (event, id) => serviceManager.start(id));
  ipcMain.handle('services:stop', async (event, id) => serviceManager.stop(id));
  ipcMain.handle('services:restart', async (event, id) => serviceManager.restart(id));
  ipcMain.handle('services:createDb', async (event, typeOrDbName, maybeDbName) => {
    const type = maybeDbName ? typeOrDbName : 'mysql';
    const dbName = maybeDbName ? maybeDbName : typeOrDbName;
    return serviceManager.createDatabase(type, dbName);
  });
  ipcMain.handle('services:openWeb', (event, id) => serviceManager.openWebUi(id));
  ipcMain.handle('services:getDetails', async (event, id) => serviceManager.getServiceDetails(id));
  ipcMain.handle('services:saveConfig', async (event, id, config) => serviceManager.saveServiceConfig(id, config));
  ipcMain.handle('services:saveConfigFile', async (event, id, content) => serviceManager.saveConfigFile(id, content));
  ipcMain.handle('services:openPath', async (event, targetPath) => {
    if (targetPath) shell.openPath(targetPath);
  });

  ipcMain.handle('projects:getDbInfo', async (event, projectPath) => projectScanner.getProjectDbInfo(projectPath));

  // Public Tunneling (Cloudflare & Ngrok)
  ipcMain.handle('tunnels:getProviders', () => tunnelManager.getProviders());
  ipcMain.handle('tunnels:downloadCloudflared', () => {
    return tunnelManager.downloadCloudflared((percent) => {
      mainWindow?.webContents.send('download:progress', { item: 'cloudflared', percent });
    });
  });
  ipcMain.handle('tunnels:downloadNgrok', () => {
    return tunnelManager.downloadNgrok((percent) => {
      mainWindow?.webContents.send('download:progress', { item: 'ngrok', percent });
    });
  });
  ipcMain.handle('tunnels:start', (event, projectName, domain, provider, port) => tunnelManager.startTunnel(projectName, domain, provider, port));
  ipcMain.handle('tunnels:stop', (event, projectName) => tunnelManager.stopTunnel(projectName));
  ipcMain.handle('tunnels:get', (event, projectName) => tunnelManager.getTunnel(projectName));
  ipcMain.handle('tunnels:list', () => tunnelManager.listTunnels());
  ipcMain.handle('tunnels:getNgrokAuthStatus', () => tunnelManager.getNgrokAuthStatus());
  ipcMain.handle('tunnels:setNgrokAuthToken', (event, token) => tunnelManager.setNgrokAuthToken(token));
  ipcMain.handle('tunnels:updateNgrok', () => tunnelManager.updateNgrok());
  ipcMain.handle('tunnels:getLogs', (event, projectName) => tunnelManager.getLogs(projectName));
  ipcMain.handle('tunnels:clearLogs', (event, projectName) => tunnelManager.clearLogs(projectName));
  ipcMain.handle('tunnels:ping', (event, url) => tunnelManager.pingTunnel(url));

  tunnelManager.on('status-changed', (data) => {
    mainWindow?.webContents.send('tunnels:status-changed', data);
  });
  tunnelManager.on('log', (data) => {
    mainWindow?.webContents.send('tunnels:log', data);
  });
  tunnelManager.on('download-progress', (data) => {
    mainWindow?.webContents.send('download:progress', data);
  });

  // Window UI Theme
  ipcMain.handle('window:setTheme', (event, isDark) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      try {
        mainWindow.setTitleBarOverlay({
          color: isDark ? '#0f172a' : '#ffffff',
          symbolColor: isDark ? '#94a3b8' : '#475569',
          height: 64
        });
      } catch (e) {
        // Ignored if not supported
      }
    }
  });
}

if (gotTheLock) {
  app.whenReady().then(async () => {
    // Clean up any zombie processes from prior abnormal exits
    await supervisor.cleanupOrphanedPids().catch(() => {});

    // Seed bundled minimal tools (Nginx, PHP, Node.js, Composer, mkcert, Ngrok, Cloudflared) if missing
    await preinstalledTools.seedIfNeeded().catch((err) => {
      recordMainError('preinstalledTools.seedIfNeeded', err);
    });

    // Strip X-Frame-Options and Content-Security-Policy frame-ancestors only for iframe previews
    session.defaultSession.webRequest.onHeadersReceived({ urls: ['*://*/*'] }, (details, callback) => {
      if (details.resourceType !== 'subFrame') {
        callback({ cancel: false, responseHeaders: details.responseHeaders });
        return;
      }

      const responseHeaders = { ...details.responseHeaders };

      for (const key of Object.keys(responseHeaders)) {
        const lower = key.toLowerCase();
        if (
          lower === 'x-frame-options' ||
          lower === 'cross-origin-resource-policy' ||
          lower === 'cross-origin-embedder-policy' ||
          lower === 'cross-origin-opener-policy'
        ) {
          delete responseHeaders[key];
        }
        if (lower === 'content-security-policy') {
          responseHeaders[key] = responseHeaders[key].map(csp =>
            csp.replace(/frame-ancestors[^;]+;?/gi, '')
          );
        }
      }

      callback({ cancel: false, responseHeaders });
    });

    setupIpcHandlers();
    createWindow();
    createTray();

    // Initial setup shims
    await phpManager.ensureShims().catch(() => {});

    // Check auto-start environment setting
    const config = systemHelper.getConfig();
    if (config.autoStartEnvironment !== false) {
      const defPhp = config.defaultPhpVersion || '8.3';
      if (phpManager.isInstalled(defPhp)) {
        phpManager.start(defPhp).catch(() => {});
      }
      if (nginxManager.isInstalled()) {
        nginxManager.start().catch(() => {});
      }
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });
}

let isCleanupFinished = false;

app.on('before-quit', (event) => {
  if (!gotTheLock || isCleanupFinished) return;

  event.preventDefault();
  app.isQuitting = true;

  (async () => {
    try {
      if (tunnelManager) tunnelManager.stopAll();
      if (supervisor) await supervisor.stopAll();
    } catch (err) {
      console.error('Error during graceful shutdown:', err);
    } finally {
      isCleanupFinished = true;
      app.quit();
    }
  })();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Keep running in tray
  }
});
