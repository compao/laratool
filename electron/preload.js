const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('laratool', {
  // PHP APIs
  php: {
    list: () => ipcRenderer.invoke('php:list'),
    getCatalog: () => ipcRenderer.invoke('php:getCatalog'),
    getDetails: (version) => ipcRenderer.invoke('php:getDetails', version),
    openIni: (version) => ipcRenderer.invoke('php:openIni', version),
    openFolder: (version) => ipcRenderer.invoke('php:openFolder', version),
    openTerminal: (version) => ipcRenderer.invoke('php:openTerminal', version),
    toggle: (version, enabled, options) => ipcRenderer.invoke('php:toggle', version, enabled, options),
    setPort: (version, port) => ipcRenderer.invoke('php:setPort', version, port),
    install: (version, options) => ipcRenderer.invoke('php:install', version, options),
    checkUpdates: () => ipcRenderer.invoke('php:checkUpdates'),
    update: (version) => ipcRenderer.invoke('php:update', version),
    start: (version) => ipcRenderer.invoke('php:start', version),
    stop: (version) => ipcRenderer.invoke('php:stop', version),
    restart: (version) => ipcRenderer.invoke('php:restart', version),
    setDefault: (version) => ipcRenderer.invoke('php:setDefault', version),
    toggleExtension: (version, extName, enabled) => ipcRenderer.invoke('php:toggleExtension', version, extName, enabled),
    toggleXdebug: (version, enabled, options) => ipcRenderer.invoke('php:toggleXdebug', version, enabled, options),
    updateIniDirective: (version, key, value) => ipcRenderer.invoke('php:updateIniDirective', version, key, value)
  },

  // Nginx APIs
  nginx: {
    isInstalled: () => ipcRenderer.invoke('nginx:isInstalled'),
    install: () => ipcRenderer.invoke('nginx:install'),
    isRunning: () => ipcRenderer.invoke('nginx:isRunning'),
    start: () => ipcRenderer.invoke('nginx:start'),
    stop: () => ipcRenderer.invoke('nginx:stop'),
    reload: () => ipcRenderer.invoke('nginx:reload'),
    getLogs: () => ipcRenderer.invoke('nginx:getLogs'),
    openConfig: () => ipcRenderer.invoke('nginx:openConfig'),
    openConfD: () => ipcRenderer.invoke('nginx:openConfD'),
    openSiteConfig: (siteName) => ipcRenderer.invoke('nginx:openSiteConfig', siteName),
    openFolder: () => ipcRenderer.invoke('nginx:openFolder'),
    listSiteConfigs: () => ipcRenderer.invoke('nginx:listSiteConfigs')
  },

  // System Helpers
  system: {
    openInEditor: (filePath) => ipcRenderer.invoke('system:openInEditor', filePath),
    openInExplorer: (targetPath) => ipcRenderer.invoke('system:openInExplorer', targetPath),
    openExternal: (url) => ipcRenderer.invoke('system:openExternal', url)
  },

  // Projects APIs
  projects: {
    scan: () => ipcRenderer.invoke('projects:scan'),
    setPhp: (projectPath, version) => ipcRenderer.invoke('projects:setPhp', projectPath, version),
    setNode: (projectPath, version) => ipcRenderer.invoke('projects:setNode', projectPath, version),
    openExplorer: (path) => ipcRenderer.invoke('projects:openExplorer', path),
    openEditor: (path) => ipcRenderer.invoke('projects:openEditor', path),
    openTerminal: (path) => ipcRenderer.invoke('projects:openTerminal', path),
    openBrowser: (domain, ssl) => ipcRenderer.invoke('projects:openBrowser', domain, ssl),
    runCommand: (path, command) => ipcRenderer.invoke('projects:runCommand', path, command),
    installPackage: (path, pkg, isDev) => ipcRenderer.invoke('projects:installPackage', path, pkg, isDev),
    setSsl: (path, enabled) => ipcRenderer.invoke('projects:setSsl', path, enabled),
    getLogs: (path, fileName, maxEntries) => ipcRenderer.invoke('projects:getLogs', path, fileName, maxEntries),
    clearLog: (path, fileName) => ipcRenderer.invoke('projects:clearLog', path, fileName),
    openLogFile: (path, fileName) => ipcRenderer.invoke('projects:openLogFile', path, fileName),
    openLogsFolder: (path) => ipcRenderer.invoke('projects:openLogsFolder', path),
    getDbInfo: (path) => ipcRenderer.invoke('projects:getDbInfo', path),
    validateNew: (name, parkedPath) => ipcRenderer.invoke('projects:validateNew', name, parkedPath),
    create: (options) => ipcRenderer.invoke('projects:create', options),
    getAbout: (path) => ipcRenderer.invoke('projects:getAbout', path),
    toggleMaintenance: (path, enable, secret) => ipcRenderer.invoke('projects:toggleMaintenance', path, enable, secret),
    clearCaches: (path) => ipcRenderer.invoke('projects:clearCaches', path),
    optimizeCaches: (path) => ipcRenderer.invoke('projects:optimizeCaches', path),
    createStorageLink: (path) => ipcRenderer.invoke('projects:createStorageLink', path)
  },

  // Node.js APIs
  node: {
    list: () => ipcRenderer.invoke('node:list'),
    getCatalog: () => ipcRenderer.invoke('node:getCatalog'),
    toggle: (version, enabled) => ipcRenderer.invoke('node:toggle', version, enabled),
    install: (version) => ipcRenderer.invoke('node:install', version),
    checkUpdates: () => ipcRenderer.invoke('node:checkUpdates'),
    update: (version) => ipcRenderer.invoke('node:update', version),
    setDefault: (version) => ipcRenderer.invoke('node:setDefault', version),
    openTerminal: (version) => ipcRenderer.invoke('node:openTerminal', version)
  },

  // Config & System APIs
  config: {
    get: () => ipcRenderer.invoke('config:get'),
    save: (cfg) => ipcRenderer.invoke('config:save', cfg),
    selectDirectory: () => ipcRenderer.invoke('config:selectDirectory'),
    addParkedPath: (path) => ipcRenderer.invoke('config:addParkedPath', path),
    removeParkedPath: (path) => ipcRenderer.invoke('config:removeParkedPath', path)
  },

  // Hosts & Domains
  hosts: {
    addDomain: (domain) => ipcRenderer.invoke('hosts:addDomain', domain),
    syncAll: (domains) => ipcRenderer.invoke('hosts:syncAll', domains)
  },

  // SSL & Certificates
  ssl: {
    getStatus: () => ipcRenderer.invoke('ssl:getStatus'),
    toggle: (enabled) => ipcRenderer.invoke('ssl:toggle', enabled),
    installCa: () => ipcRenderer.invoke('ssl:installCa')
  },

  // Databases & Extra Services (MySQL, Postgres, MongoDB, CouchDB, Redis, Mailpit, Meilisearch, S3)
  services: {
    list: () => ipcRenderer.invoke('services:list'),
    getCatalog: () => ipcRenderer.invoke('services:getCatalog'),
    getDetails: (id) => ipcRenderer.invoke('services:getDetails', id),
    saveConfig: (id, config) => ipcRenderer.invoke('services:saveConfig', id, config),
    saveConfigFile: (id, content) => ipcRenderer.invoke('services:saveConfigFile', id, content),
    toggle: (id, enabled, options) => ipcRenderer.invoke('services:toggle', id, enabled, options),
    install: (id, versionKey) => ipcRenderer.invoke('services:install', id, versionKey),
    setVersion: (id, versionKey) => ipcRenderer.invoke('services:setVersion', id, versionKey),
    start: (id) => ipcRenderer.invoke('services:start', id),
    stop: (id) => ipcRenderer.invoke('services:stop', id),
    restart: (id) => ipcRenderer.invoke('services:restart', id),
    createDb: (type, dbName) => ipcRenderer.invoke('services:createDb', type, dbName),
    openWeb: (id) => ipcRenderer.invoke('services:openWeb', id),
    openPath: (targetPath) => ipcRenderer.invoke('services:openPath', targetPath)
  },

  // Public Tunneling APIs (Cloudflare & Ngrok)
  tunnels: {
    getProviders: () => ipcRenderer.invoke('tunnels:getProviders'),
    downloadCloudflared: () => ipcRenderer.invoke('tunnels:downloadCloudflared'),
    downloadNgrok: () => ipcRenderer.invoke('tunnels:downloadNgrok'),
    start: (projectName, domain, provider, port) => ipcRenderer.invoke('tunnels:start', projectName, domain, provider, port),
    stop: (projectName) => ipcRenderer.invoke('tunnels:stop', projectName),
    get: (projectName) => ipcRenderer.invoke('tunnels:get', projectName),
    list: () => ipcRenderer.invoke('tunnels:list'),
    getNgrokAuthStatus: () => ipcRenderer.invoke('tunnels:getNgrokAuthStatus'),
    setNgrokAuthToken: (token) => ipcRenderer.invoke('tunnels:setNgrokAuthToken', token),
    updateNgrok: () => ipcRenderer.invoke('tunnels:updateNgrok'),
    getLogs: (projectName) => ipcRenderer.invoke('tunnels:getLogs', projectName),
    clearLogs: (projectName) => ipcRenderer.invoke('tunnels:clearLogs', projectName),
    ping: (url) => ipcRenderer.invoke('tunnels:ping', url),
    onStatusChanged: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('tunnels:status-changed', listener);
      return () => ipcRenderer.removeListener('tunnels:status-changed', listener);
    },
    onLog: (callback) => {
      const listener = (event, data) => callback(data);
      ipcRenderer.on('tunnels:log', listener);
      return () => ipcRenderer.removeListener('tunnels:log', listener);
    }
  },

  // Event Listeners (progress, logs, etc.)
  onDownloadProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('download:progress', listener);
    return () => ipcRenderer.removeListener('download:progress', listener);
  },
  onProjectCreateProgress: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('project-create:progress', listener);
    return () => ipcRenderer.removeListener('project-create:progress', listener);
  },
  onAppError: (callback) => {
    const listener = (event, data) => callback(data);
    ipcRenderer.on('app:error', listener);
    return () => ipcRenderer.removeListener('app:error', listener);
  },

  // Window & UI APIs
  window: {
    setTheme: (isDark) => ipcRenderer.invoke('window:setTheme', isDark)
  }
});
