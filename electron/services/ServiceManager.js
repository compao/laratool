const path = require('path');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const systemHelper = require('./SystemHelper');
const supervisor = require('./ProcessSupervisor');

class ServiceManager {
  constructor() {
    this.serversDir = path.join(systemHelper.rootDir, 'servers');
    this.dataDir = path.join(systemHelper.rootDir, 'data');

    this.defaultEnabledServices = ['mysql', 'postgres', 'redis', 'mailpit', 'meilisearch', 'minio'];

    this.catalog = {
      mysql: {
        id: 'mysql',
        name: 'MySQL / MariaDB',
        category: 'database',
        description: 'Moteur relationnel standard avec créateur de bases en 1 clic.',
        port: 3306,
        defaultVersion: '11.4',
        versions: {
          '11.4': {
            name: 'MariaDB 11.4 LTS',
            downloadUrl: 'https://archive.mariadb.org/mariadb-11.4.5/winx64-packages/mariadb-11.4.5-winx64.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'bin/mariadbd.exe'
          },
          '10.11': {
            name: 'MariaDB 10.11 LTS',
            downloadUrl: 'https://archive.mariadb.org/mariadb-10.11.11/winx64-packages/mariadb-10.11.11-winx64.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'bin/mariadbd.exe'
          }
        },
        envSnippet: `DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_DATABASE=laravel\nDB_USERNAME=root\nDB_PASSWORD=`
      },
      postgres: {
        id: 'postgres',
        name: 'PostgreSQL',
        category: 'database',
        description: 'SGBD relationnel avancé hautement extensible.',
        port: 5432,
        defaultVersion: '16',
        versions: {
          '17': {
            name: 'PostgreSQL 17.2',
            downloadUrl: 'https://get.enterprisedb.com/postgresql/postgresql-17.2-1-windows-x64-binaries.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'pgsql/bin/postgres.exe'
          },
          '16': {
            name: 'PostgreSQL 16.6 LTS',
            downloadUrl: 'https://get.enterprisedb.com/postgresql/postgresql-16.6-1-windows-x64-binaries.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'pgsql/bin/postgres.exe'
          },
          '15': {
            name: 'PostgreSQL 15.10',
            downloadUrl: 'https://get.enterprisedb.com/postgresql/postgresql-15.10-1-windows-x64-binaries.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'pgsql/bin/postgres.exe'
          }
        },
        envSnippet: `DB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=5432\nDB_DATABASE=laravel\nDB_USERNAME=postgres\nDB_PASSWORD=`
      },
      mongodb: {
        id: 'mongodb',
        name: 'MongoDB Community',
        category: 'database',
        description: 'Base de données NoSQL orientée documents (paquet laravel-mongodb).',
        port: 27017,
        defaultVersion: '8.0',
        versions: {
          '8.0': {
            name: 'MongoDB 8.0',
            downloadUrl: 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-8.0.4.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'bin/mongod.exe'
          },
          '7.0': {
            name: 'MongoDB 7.0 LTS',
            downloadUrl: 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.16.zip',
            archiveType: 'zip-folder',
            binaryRelPath: 'bin/mongod.exe'
          }
        },
        envSnippet: `DB_CONNECTION=mongodb\nDB_HOST=127.0.0.1\nDB_PORT=27017\nDB_DATABASE=laravel\nDB_USERNAME=\nDB_PASSWORD=`
      },
      couchdb: {
        id: 'couchdb',
        name: 'Apache CouchDB',
        category: 'database',
        description: 'Base de données NoSQL JSON avec API HTTP REST et interface web Fauxton.',
        port: 5984,
        webPort: 5984,
        downloadUrl: 'https://archive.apache.org/dist/couchdb/binary/win/3.3.3/apache-couchdb-3.3.3.msi',
        archiveType: 'msi',
        binaryRelPath: 'bin/couchdb.cmd',
        envSnippet: `COUCHDB_HOST=127.0.0.1\nCOUCHDB_PORT=5984\nCOUCHDB_USER=admin\nCOUCHDB_PASSWORD=password`
      },
      redis: {
        id: 'redis',
        name: 'Redis',
        category: 'cache',
        description: 'Structure de données en mémoire ultra-rapide pour cache, sessions et queues.',
        port: 6379,
        downloadUrl: 'https://github.com/tporadowski/redis/releases/download/v5.0.14.1/Redis-x64-5.0.14.1.zip',
        archiveType: 'zip',
        binaryRelPath: 'redis-server.exe',
        envSnippet: `CACHE_STORE=redis\nQUEUE_CONNECTION=redis\nSESSION_DRIVER=redis\nREDIS_HOST=127.0.0.1\nREDIS_PORT=6379`
      },
      memcached: {
        id: 'memcached',
        name: 'Memcached',
        category: 'cache',
        description: 'Système de mise en cache d\'objets en mémoire distribué haute performance.',
        port: 11211,
        downloadUrl: 'https://github.com/nono303/memcached/releases/download/v1.6.29/memcached-1.6.29-win64-mingw.zip',
        archiveType: 'zip',
        binaryRelPath: 'memcached.exe',
        envSnippet: `CACHE_STORE=memcached\nMEMCACHED_HOST=127.0.0.1\nMEMCACHED_PORT=11211`
      },
      meilisearch: {
        id: 'meilisearch',
        name: 'Meilisearch (Laravel Scout)',
        category: 'search',
        description: 'Moteur de recherche textuelle ultra-performant pour Laravel Scout.',
        port: 7700,
        downloadUrl: 'https://github.com/meilisearch/meilisearch/releases/download/v1.12.3/meilisearch-windows-amd64.exe',
        archiveType: 'direct-exe',
        binaryRelPath: 'meilisearch.exe',
        envSnippet: `SCOUT_DRIVER=meilisearch\nMEILISEARCH_HOST=http://127.0.0.1:7700\nMEILISEARCH_KEY=masterKey`
      },
      typesense: {
        id: 'typesense',
        name: 'Typesense (Laravel Scout)',
        category: 'search',
        description: 'Moteur de recherche typotolérant ultra-rapide en C++, alternative directe à Meilisearch.',
        port: 8108,
        downloadUrl: 'https://dl.typesense.org/releases/27.1/typesense-server-27.1-windows-amd64.zip',
        archiveType: 'zip',
        binaryRelPath: 'typesense-server.exe',
        envSnippet: `SCOUT_DRIVER=typesense\nTYPESENSE_HOST=127.0.0.1\nTYPESENSE_PORT=8108\nTYPESENSE_PROTOCOL=http\nTYPESENSE_API_KEY=xyz`
      },
      reverb: {
        id: 'reverb',
        name: 'Laravel Reverb (WebSocket)',
        category: 'realtime',
        description: 'Serveur WebSocket officiel ultra-rapide pour le broadcasting en direct de Laravel.',
        port: 8080,
        envSnippet: `BROADCAST_CONNECTION=reverb\nREVERB_APP_ID=app-id\nREVERB_APP_KEY=app-key\nREVERB_APP_SECRET=app-secret\nREVERB_HOST=127.0.0.1\nREVERB_PORT=8080\nREVERB_SCHEME=http`
      },
      soketi: {
        id: 'soketi',
        name: 'Soketi (WebSocket Pusher)',
        category: 'realtime',
        description: 'Serveur WebSocket open source compatible Pusher v7 écrit en Node.js.',
        port: 6001,
        envSnippet: `BROADCAST_CONNECTION=pusher\nPUSHER_APP_ID=app-id\nPUSHER_APP_KEY=app-key\nPUSHER_APP_SECRET=app-secret\nPUSHER_HOST=127.0.0.1\nPUSHER_PORT=6001\nPUSHER_SCHEME=http`
      },
      minio: {
        id: 'minio',
        name: 'MinIO / SeaweedFS (S3)',
        category: 'storage',
        description: 'Stockage d\'objets compatible Amazon S3 et explorateur de fichiers Web.',
        port: 8333,
        webPort: 8888,
        downloadUrl: 'https://github.com/seaweedfs/seaweedfs/releases/download/4.47/windows_amd64.zip',
        archiveType: 'zip',
        binaryRelPath: 'weed.exe',
        envSnippet: `FILESYSTEM_DISK=s3\nAWS_ACCESS_KEY_ID=any\nAWS_SECRET_ACCESS_KEY=any\nAWS_DEFAULT_REGION=us-east-1\nAWS_BUCKET=local-bucket\nAWS_USE_PATH_STYLE_ENDPOINT=true\nAWS_ENDPOINT=http://127.0.0.1:8333`
      },
      mailpit: {
        id: 'mailpit',
        name: 'Mailpit (Email Catcher)',
        category: 'tools',
        description: 'Capture instantanée des e-mails envoyés par Laravel avec Webmail intégré.',
        port: 1025,
        webPort: 8025,
        downloadUrl: 'https://github.com/axllent/mailpit/releases/download/v1.22.3/mailpit-windows-amd64.zip',
        archiveType: 'zip',
        binaryRelPath: 'mailpit.exe',
        envSnippet: `MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=1025\nMAIL_USERNAME=null\nMAIL_PASSWORD=null\nMAIL_ENCRYPTION=null`
      }
    };

    this.services = this.catalog;
    this.initDirs();
  }

  initDirs() {
    [this.serversDir, this.dataDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    ['redis', 'meilisearch', 'seaweedfs', 'typesense'].forEach(sub => {
      const p = path.join(this.dataDir, sub);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
      }
    });
  }

  getEnabledServiceIds() {
    const config = systemHelper.getConfig();
    return Array.isArray(config.enabledServices) ? config.enabledServices : this.defaultEnabledServices;
  }

  getPort(serviceId) {
    const meta = this.catalog[serviceId];
    if (!meta) return null;
    const config = systemHelper.getConfig();
    return (config.servicePorts && config.servicePorts[serviceId]) ? parseInt(config.servicePorts[serviceId], 10) : meta.port;
  }

  getEnvSnippet(serviceId, port = null) {
    const meta = this.catalog[serviceId];
    if (!meta) return '';
    const p = port || this.getPort(serviceId);

    switch (serviceId) {
      case 'mysql':
        return `DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=${p}\nDB_DATABASE=laravel\nDB_USERNAME=root\nDB_PASSWORD=`;
      case 'postgres':
        return `DB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=${p}\nDB_DATABASE=laravel\nDB_USERNAME=postgres\nDB_PASSWORD=`;
      case 'mongodb':
        return `DB_CONNECTION=mongodb\nDB_HOST=127.0.0.1\nDB_PORT=${p}\nDB_DATABASE=laravel\nDB_USERNAME=\nDB_PASSWORD=`;
      case 'couchdb':
        return `COUCHDB_HOST=127.0.0.1\nCOUCHDB_PORT=${p}\nCOUCHDB_USER=admin\nCOUCHDB_PASSWORD=password`;
      case 'redis':
        return `CACHE_STORE=redis\nQUEUE_CONNECTION=redis\nSESSION_DRIVER=redis\nREDIS_HOST=127.0.0.1\nREDIS_PORT=${p}`;
      case 'memcached':
        return `CACHE_STORE=memcached\nMEMCACHED_HOST=127.0.0.1\nMEMCACHED_PORT=${p}`;
      case 'mailpit':
        return `MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=${p}\nMAIL_USERNAME=null\nMAIL_PASSWORD=null\nMAIL_ENCRYPTION=null`;
      case 'meilisearch':
        return `SCOUT_DRIVER=meilisearch\nMEILISEARCH_HOST=http://127.0.0.1:${p}\nMEILISEARCH_KEY=masterKey`;
      case 'typesense':
        return `SCOUT_DRIVER=typesense\nTYPESENSE_HOST=127.0.0.1\nTYPESENSE_PORT=${p}\nTYPESENSE_PROTOCOL=http\nTYPESENSE_API_KEY=xyz`;
      case 'reverb':
        return `BROADCAST_CONNECTION=reverb\nREVERB_APP_ID=app-id\nREVERB_APP_KEY=app-key\nREVERB_APP_SECRET=app-secret\nREVERB_HOST=127.0.0.1\nREVERB_PORT=${p}\nREVERB_SCHEME=http`;
      case 'soketi':
        return `BROADCAST_CONNECTION=pusher\nPUSHER_APP_ID=app-id\nPUSHER_APP_KEY=app-key\nPUSHER_APP_SECRET=app-secret\nPUSHER_HOST=127.0.0.1\nPUSHER_PORT=${p}\nPUSHER_SCHEME=http`;
      case 'minio':
        return `FILESYSTEM_DISK=s3\nAWS_ACCESS_KEY_ID=any\nAWS_SECRET_ACCESS_KEY=any\nAWS_DEFAULT_REGION=us-east-1\nAWS_BUCKET=local-bucket\nAWS_USE_PATH_STYLE_ENDPOINT=true\nAWS_ENDPOINT=http://127.0.0.1:${p}`;
      default:
        return meta.envSnippet || '';
    }
  }

  async toggleService(serviceId, enabled, options = {}) {
    const meta = this.catalog[serviceId];
    if (!meta) {
      throw new Error(`Service inconnu dans le catalogue: ${serviceId}`);
    }

    let enabledList = this.getEnabledServiceIds();
    const config = systemHelper.getConfig();
    let servicePorts = { ...(config.servicePorts || {}) };
    let serviceVersions = { ...(config.serviceVersions || {}) };
    let needsRestart = false;

    if (options && options.port) {
      const p = parseInt(options.port, 10);
      if (!isNaN(p) && p > 0 && p <= 65535) {
        if (servicePorts[serviceId] !== p) {
          servicePorts[serviceId] = p;
          needsRestart = true;
        }
      }
    }

    if (options && options.version && meta.versions && meta.versions[options.version]) {
      if (serviceVersions[serviceId] !== options.version) {
        serviceVersions[serviceId] = options.version;
        needsRestart = true;
      }
    }

    if (enabled && !enabledList.includes(serviceId)) {
      enabledList.push(serviceId);
    } else if (!enabled) {
      if (supervisor.isRunning(serviceId)) {
        await this.stop(serviceId);
      }
      enabledList = enabledList.filter(id => id !== serviceId);
    }

    systemHelper.saveConfig({ enabledServices: enabledList, servicePorts, serviceVersions });

    if (enabled && needsRestart && supervisor.isRunning(serviceId)) {
      await this.restart(serviceId);
    }

    return {
      success: true,
      enabledServices: enabledList,
      port: this.getPort(serviceId),
      activeVersion: this.getActiveVersion(serviceId)
    };
  }

  async getCatalog() {
    const enabledList = this.getEnabledServiceIds();
    const result = [];

    for (const [id, meta] of Object.entries(this.catalog)) {
      const installed = this.isInstalled(id);
      const isSupervised = supervisor.isRunning(id);
      const effectivePort = this.getPort(id);
      const portActive = await systemHelper.isPortInUse(effectivePort);

      const activeVer = meta.versions ? this.getActiveVersion(id) : null;
      const activeVerName = (activeVer && meta.versions[activeVer]) ? meta.versions[activeVer].name : null;

      result.push({
        id,
        name: meta.name,
        category: meta.category,
        description: meta.description,
        port: effectivePort,
        defaultPort: meta.port,
        webPort: meta.webPort || null,
        enabled: enabledList.includes(id),
        installed,
        running: isSupervised,
        portConflict: !isSupervised && portActive,
        hasVersions: !!meta.versions,
        defaultVersion: meta.defaultVersion || null,
        activeVersion: activeVer,
        activeVersionName: activeVerName,
        versions: meta.versions ? Object.entries(meta.versions).map(([vKey, vMeta]) => ({
          key: vKey,
          name: vMeta.name,
          installed: this.isInstalled(id, vKey)
        })) : null,
        envSnippet: this.getEnvSnippet(id, effectivePort)
      });
    }

    return result;
  }

  getActiveVersion(serviceId) {
    const meta = this.catalog[serviceId];
    if (!meta || !meta.versions) return null;
    const config = systemHelper.getConfig();
    return (config.serviceVersions && config.serviceVersions[serviceId]) || meta.defaultVersion;
  }

  async setActiveVersion(serviceId, versionKey) {
    const meta = this.catalog[serviceId];
    if (!meta || !meta.versions || !meta.versions[versionKey]) {
      throw new Error(`Version inconnue ${versionKey} pour ${serviceId}`);
    }

    const wasRunning = supervisor.isRunning(serviceId);
    if (wasRunning) {
      await this.stop(serviceId);
    }

    const config = systemHelper.getConfig();
    const serviceVersions = { ...(config.serviceVersions || {}), [serviceId]: versionKey };
    systemHelper.saveConfig({ serviceVersions });

    if (wasRunning && this.isInstalled(serviceId, versionKey)) {
      await this.start(serviceId);
    }

    return { success: true, activeVersion: versionKey };
  }

  getServiceDir(serviceId, versionKey = null) {
    const meta = this.catalog[serviceId];
    if (meta && meta.versions) {
      const ver = versionKey || this.getActiveVersion(serviceId);
      return path.join(this.serversDir, `${serviceId}-${ver}`);
    }
    return path.join(this.serversDir, serviceId);
  }

  getDataDir(serviceId, versionKey = null) {
    const meta = this.catalog[serviceId];
    if (meta && meta.versions) {
      const ver = versionKey || this.getActiveVersion(serviceId);
      const dataP = path.join(this.dataDir, `${serviceId}-${ver}`);
      if (!fs.existsSync(dataP)) {
        fs.mkdirSync(dataP, { recursive: true });
      }
      return dataP;
    }
    const dataP = path.join(this.dataDir, serviceId);
    if (!fs.existsSync(dataP)) {
      fs.mkdirSync(dataP, { recursive: true });
    }
    return dataP;
  }

  getServiceExe(serviceId, versionKey = null) {
    const meta = this.catalog[serviceId];
    if (!meta) return null;

    let binaryRelPath = meta.binaryRelPath;
    if (meta.versions) {
      const ver = versionKey || this.getActiveVersion(serviceId);
      const verMeta = meta.versions[ver];
      if (verMeta) binaryRelPath = verMeta.binaryRelPath;
    }

    if (!binaryRelPath) return null;

    const baseDir = this.getServiceDir(serviceId, versionKey);
    const directPath = path.join(baseDir, binaryRelPath);
    if (fs.existsSync(directPath)) return directPath;

    if (fs.existsSync(baseDir)) {
      const exeName = path.basename(binaryRelPath);
      const found = this.findFileRecursive(baseDir, exeName);
      if (found) return found;
    }

    return directPath;
  }

  findFileRecursive(dir, fileName) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const res = this.findFileRecursive(fullPath, fileName);
        if (res) return res;
      } else if (entry.name.toLowerCase() === fileName.toLowerCase()) {
        return fullPath;
      }
    }
    return null;
  }

  isInstalled(serviceId, versionKey = null) {
    const meta = this.catalog[serviceId];
    if (!meta) return false;

    // Services managed externally or through Artisan/NPX
    if (serviceId === 'reverb' || serviceId === 'soketi') {
      return true;
    }

    let binaryRelPath = meta.binaryRelPath;
    if (meta.versions) {
      const ver = versionKey || this.getActiveVersion(serviceId);
      const verMeta = meta.versions[ver];
      if (verMeta) binaryRelPath = verMeta.binaryRelPath;
    }

    if (!binaryRelPath) return false;

    const targetDir = this.getServiceDir(serviceId, versionKey);
    const tempFile = path.join(targetDir, binaryRelPath + '.tmp');
    if (fs.existsSync(tempFile)) return false;

    const exe = this.getServiceExe(serviceId, versionKey);
    if (!exe || !fs.existsSync(exe)) return false;

    try {
      const stats = fs.statSync(exe);
      if (serviceId === 'minio') {
        return stats.size > 10 * 1024 * 1024;
      }
      if (serviceId === 'postgres') {
        const shareBki = path.join(path.dirname(path.dirname(exe)), 'share', 'postgres.bki');
        if (!fs.existsSync(shareBki)) return false;
      }
      return stats.size > 1024;
    } catch {
      return false;
    }
  }

  async listAll() {
    const results = [];

    for (const [id, meta] of Object.entries(this.catalog)) {
      const installed = this.isInstalled(id);
      const isSupervised = supervisor.isRunning(id);
      const effectivePort = this.getPort(id);
      const portActive = await systemHelper.isPortInUse(effectivePort);

      const activeVer = meta.versions ? this.getActiveVersion(id) : null;
      const activeVerName = (activeVer && meta.versions[activeVer]) ? meta.versions[activeVer].name : null;

      const item = {
        id,
        name: meta.name,
        category: meta.category,
        description: meta.description,
        port: effectivePort,
        defaultPort: meta.port,
        webPort: meta.webPort || null,
        installed,
        running: isSupervised,
        portConflict: !isSupervised && portActive,
        envSnippet: this.getEnvSnippet(id, effectivePort),
        path: installed ? this.getServiceDir(id) : null,
        hasVersions: !!meta.versions,
        defaultVersion: meta.defaultVersion || null,
        activeVersion: activeVer,
        activeVersionName: activeVerName,
        versions: meta.versions ? Object.entries(meta.versions).map(([vKey, vMeta]) => ({
          key: vKey,
          name: vMeta.name,
          installed: this.isInstalled(id, vKey)
        })) : null
      };

      results.push(item);
    }
    return results;
  }

  async install(serviceId, versionKeyOrProgress, maybeProgress) {
    const meta = this.catalog[serviceId];
    if (!meta) throw new Error(`Service inconnu: ${serviceId}`);

    let versionKey = null;
    let onProgress = null;

    if (typeof versionKeyOrProgress === 'function') {
      onProgress = versionKeyOrProgress;
      versionKey = meta.versions ? this.getActiveVersion(serviceId) : null;
    } else {
      versionKey = versionKeyOrProgress;
      onProgress = maybeProgress;
    }

    let downloadUrl = meta.downloadUrl;
    let archiveType = meta.archiveType;
    let binaryRelPath = meta.binaryRelPath;

    if (meta.versions) {
      if (!versionKey) versionKey = this.getActiveVersion(serviceId);
      const verMeta = meta.versions[versionKey];
      if (!verMeta) throw new Error(`Version inconnue ${versionKey} pour ${serviceId}`);
      downloadUrl = verMeta.downloadUrl;
      archiveType = verMeta.archiveType;
      binaryRelPath = verMeta.binaryRelPath;
    }

    const targetDir = this.getServiceDir(serviceId, versionKey);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    if (archiveType === 'direct-exe') {
      const targetExe = path.join(targetDir, binaryRelPath);
      await systemHelper.downloadFile(downloadUrl, targetExe, onProgress);
    } else if (archiveType === 'msi') {
      const tempMsi = path.join(systemHelper.rootDir, `temp-${serviceId}.msi`);
      try {
        await systemHelper.downloadFile(downloadUrl, tempMsi, onProgress);
        await new Promise((resolve, reject) => {
          exec(`msiexec /a "${tempMsi}" /qn TARGETDIR="${targetDir}"`, (err) => {
            if (err) return reject(err);
            resolve(true);
          });
        });
      } finally {
        if (fs.existsSync(tempMsi)) {
          fs.unlinkSync(tempMsi);
        }
      }
    } else {
      const tempZipName = versionKey ? `temp-${serviceId}-${versionKey}.zip` : `temp-${serviceId}.zip`;
      const tempZip = path.join(systemHelper.rootDir, tempZipName);
      try {
        await systemHelper.downloadFile(downloadUrl, tempZip, onProgress);
        await systemHelper.extractZip(tempZip, targetDir);
      } finally {
        if (fs.existsSync(tempZip)) {
          fs.unlinkSync(tempZip);
        }
      }
    }

    // Post-install initializations
    await this.postInstallInit(serviceId, versionKey);
    return true;
  }

  async postInstallInit(serviceId, versionKey = null) {
    if (serviceId === 'mysql') {
      const exe = this.getServiceExe('mysql', versionKey);
      if (!exe || !fs.existsSync(exe)) return;
      const baseDir = path.dirname(path.dirname(exe));
      const installDbExe = path.join(path.dirname(exe), 'mariadb-install-db.exe');
      const dataPath = this.getDataDir('mysql', versionKey);

      const isDataEmpty = !fs.existsSync(dataPath) || fs.readdirSync(dataPath).length === 0;
      if (isDataEmpty && fs.existsSync(installDbExe)) {
        await new Promise((resolve) => {
          exec(`"${installDbExe}" --datadir="${dataPath}"`, { cwd: baseDir }, () => resolve(true));
        });
      }
    } else if (serviceId === 'postgres') {
      const exe = this.getServiceExe('postgres', versionKey);
      if (!exe || !fs.existsSync(exe)) return;
      const binDir = path.dirname(exe);
      const pgsqlRoot = path.dirname(binDir);
      const shareBki = path.join(pgsqlRoot, 'share', 'postgres.bki');
      if (!fs.existsSync(shareBki)) {
        throw new Error(`Installation PostgreSQL incomplète : fichier "${shareBki}" introuvable.`);
      }

      const initDbExe = path.join(binDir, 'initdb.exe');
      const dataPath = this.getDataDir('postgres', versionKey);
      const confPath = path.join(dataPath, 'postgresql.conf');

      if (!fs.existsSync(confPath) && fs.existsSync(initDbExe)) {
        const isDataEmpty = !fs.existsSync(dataPath) || fs.readdirSync(dataPath).length === 0;
        if (!isDataEmpty) return;

        await new Promise((resolve, reject) => {
          exec(`"${initDbExe}" -D "${dataPath}" -U postgres -A trust -E UTF8`, { cwd: binDir, windowsHide: true }, (err, stdout, stderr) => {
            if (err) {
              const detail = (stderr || stdout || err.message || '').trim();
              return reject(new Error(`Échec initdb PostgreSQL : ${detail}`));
            }
            resolve(true);
          });
        });
      }
    } else if (serviceId === 'mongodb') {
      this.getDataDir('mongodb', versionKey);
    }
  }

  async start(serviceId) {
    if (!this.isInstalled(serviceId)) {
      throw new Error(`Le service ${serviceId} n'est pas encore installé ou le téléchargement est en cours`);
    }

    const meta = this.catalog[serviceId];
    if (supervisor.isRunning(serviceId)) {
      return { success: true, message: 'Déjà actif' };
    }

    if (serviceId === 'reverb') {
      throw new Error(`Laravel Reverb est exécutable depuis votre projet Laravel via : php artisan reverb:start --port=${this.getPort(serviceId)}`);
    }

    const exe = this.getServiceExe(serviceId);
    if (!exe && serviceId !== 'soketi') {
      throw new Error(`Exécutable introuvable pour ${serviceId}`);
    }
    const serviceDir = exe ? path.dirname(exe) : this.serversDir;
    const port = this.getPort(serviceId);

    if (serviceId === 'mailpit') {
      supervisor.start('mailpit', exe, [
        '--smtp', `127.0.0.1:${port}`,
        '--listen', `127.0.0.1:${meta.webPort}`
      ], { cwd: serviceDir });
    } else if (serviceId === 'meilisearch') {
      const dataPath = this.getDataDir('meilisearch');
      supervisor.start('meilisearch', exe, [
        '--http-addr', `127.0.0.1:${port}`,
        '--db-path', dataPath,
        '--env', 'development'
      ], { cwd: serviceDir });
    } else if (serviceId === 'redis') {
      const dataPath = this.getDataDir('redis');
      supervisor.start('redis', exe, [
        '--port', `${port}`,
        '--dir', dataPath
      ], { cwd: serviceDir });
    } else if (serviceId === 'mysql') {
      const dataPath = this.getDataDir('mysql');
      supervisor.start('mysql', exe, [
        `--datadir=${dataPath}`,
        `--port=${port}`,
        '--bind-address=127.0.0.1',
        '--console'
      ], { cwd: serviceDir });
    } else if (serviceId === 'postgres') {
      await this.postInstallInit('postgres');
      const dataPath = this.getDataDir('postgres');
      const confPath = path.join(dataPath, 'postgresql.conf');
      if (!fs.existsSync(confPath)) {
        throw new Error(`Base PostgreSQL non initialisée (postgresql.conf manquant dans ${dataPath}).`);
      }
      supervisor.start('postgres', exe, [
        '-D', dataPath,
        '-p', `${port}`
      ], { cwd: serviceDir });
      await new Promise((r) => setTimeout(r, 400));
      if (!supervisor.isRunning('postgres')) {
        const recent = supervisor.getLogs('postgres', 5).join(' | ');
        throw new Error(`PostgreSQL s'est arrêté immédiatement : ${recent || 'consultez postgres.log'}`);
      }
    } else if (serviceId === 'mongodb') {
      const dataPath = this.getDataDir('mongodb');
      supervisor.start('mongodb', exe, [
        '--dbpath', dataPath,
        '--port', `${port}`,
        '--bind_ip', '127.0.0.1'
      ], { cwd: serviceDir });
    } else if (serviceId === 'couchdb') {
      supervisor.start('couchdb', exe, [], { cwd: serviceDir });
    } else if (serviceId === 'minio') {
      const dataPath = this.getDataDir('seaweedfs');
      supervisor.start('minio', exe, [
        'mini',
        `-dir=${dataPath}`,
        `-s3.port=${port}`,
        `-filer.port=${meta.webPort}`,
        '-bucket=local-bucket',
        '-webdav=false'
      ], {
        cwd: serviceDir,
        env: {
          ...process.env,
          AWS_ACCESS_KEY_ID: 'any',
          AWS_SECRET_ACCESS_KEY: 'any',
          S3_BUCKET: 'local-bucket'
        }
      });
    } else if (serviceId === 'typesense') {
      const dataPath = this.getDataDir('typesense');
      supervisor.start('typesense', exe, [
        `--data-dir=${dataPath}`,
        `--api-port=${port}`,
        '--api-key=xyz',
        '--enable-cors=true'
      ], { cwd: serviceDir });
    } else if (serviceId === 'memcached') {
      supervisor.start('memcached', exe, [
        '-p', `${port}`,
        '-m', '64'
      ], { cwd: serviceDir });
    } else if (serviceId === 'soketi') {
      const nodeManager = require('./NodeManager');
      const defaultNode = systemHelper.getConfig().defaultNodeVersion || '22';
      const nodeExe = nodeManager.getNodeExe(defaultNode);
      const soketiCli = path.join(this.serversDir, 'soketi', 'node_modules', 'soketi', 'bin', 'server.js');

      if (fs.existsSync(soketiCli) && fs.existsSync(nodeExe)) {
        supervisor.start('soketi', nodeExe, [soketiCli, 'start', `--port=${port}`], {
          cwd: path.dirname(soketiCli),
          env: { ...process.env, SOKETI_PORT: `${port}` }
        });
      } else {
        throw new Error("Soketi n'est pas encore installé ou Node.js est manquant.");
      }
    }

    return { success: true, port };
  }

  async stop(serviceId) {
    await supervisor.stop(serviceId);
    return { success: true };
  }

  async restart(serviceId) {
    await this.stop(serviceId);
    await new Promise(r => setTimeout(r, 600));
    return this.start(serviceId);
  }

  /**
   * Unified Database Creator supporting MySQL, PostgreSQL, MongoDB, CouchDB
   */
  async createDatabase(type, dbName) {
    const cleanDbName = dbName.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!cleanDbName) throw new Error('Nom de base de données invalide');

    if (type === 'mysql') {
      return this.createMysqlDatabase(cleanDbName);
    } else if (type === 'postgres') {
      return this.createPostgresDatabase(cleanDbName);
    } else if (type === 'mongodb') {
      return this.createMongoDatabase(cleanDbName);
    } else if (type === 'couchdb') {
      return this.createCouchDatabase(cleanDbName);
    } else {
      throw new Error(`Type de base de données non supporté : ${type}`);
    }
  }

  /**
   * Create a database in MySQL in 1 click
   */
  async createMysqlDatabase(dbName) {
    const cleanDbName = dbName.replace(/[^a-zA-Z0-9_]/g, '_');
    const exe = this.getServiceExe('mysql');
    if (!exe || !fs.existsSync(exe)) throw new Error("MySQL n'est pas installé");

    const port = this.getPort('mysql');
    const inUse = await systemHelper.isPortInUse(port);
    if (!inUse) {
      await this.start('mysql');
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (await systemHelper.isPortInUse(port)) break;
      }
    }

    const mysqlCli = path.join(path.dirname(exe), 'mariadb.exe');
    const fallbackCli = path.join(path.dirname(exe), 'mysql.exe');
    const cliToUse = fs.existsSync(mysqlCli) ? mysqlCli : fallbackCli;

    return new Promise((resolve, reject) => {
      exec(`"${cliToUse}" -u root -h 127.0.0.1 -P ${port} -e "CREATE DATABASE IF NOT EXISTS \`${cleanDbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"`, (err) => {
        if (err) return reject(new Error(`Erreur MySQL: ${err.message}`));
        resolve({ success: true, type: 'mysql', dbName: cleanDbName });
      });
    });
  }

  /**
   * Create a database in PostgreSQL
   */
  async createPostgresDatabase(dbName) {
    const cleanDbName = dbName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const exe = this.getServiceExe('postgres');
    if (!exe || !fs.existsSync(exe)) throw new Error("PostgreSQL n'est pas installé");

    const port = this.getPort('postgres');
    const inUse = await systemHelper.isPortInUse(port);
    if (!inUse) {
      await this.start('postgres');
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (await systemHelper.isPortInUse(port)) break;
      }
    }

    const binDir = path.dirname(exe);
    const psqlCli = path.join(binDir, 'psql.exe');
    const createdbCli = path.join(binDir, 'createdb.exe');

    return new Promise((resolve, reject) => {
      if (fs.existsSync(createdbCli)) {
        exec(`"${createdbCli}" -U postgres -h 127.0.0.1 -p ${port} -E UTF8 "${cleanDbName}"`, (err) => {
          if (err && !err.message.includes('already exists')) {
            return reject(new Error(`Erreur PostgreSQL: ${err.message}`));
          }
          resolve({ success: true, type: 'postgres', dbName: cleanDbName });
        });
      } else if (fs.existsSync(psqlCli)) {
        exec(`"${psqlCli}" -U postgres -h 127.0.0.1 -p ${port} -c "CREATE DATABASE \\"${cleanDbName}\\" ENCODING 'UTF8';"`, (err) => {
          if (err && !err.message.includes('already exists')) {
            return reject(new Error(`Erreur PostgreSQL: ${err.message}`));
          }
          resolve({ success: true, type: 'postgres', dbName: cleanDbName });
        });
      } else {
        reject(new Error("Client psql ou createdb introuvable"));
      }
    });
  }

  /**
   * Initialize a MongoDB database
   */
  async createMongoDatabase(dbName) {
    const cleanDbName = dbName.replace(/[^a-zA-Z0-9_]/g, '_');
    if (!this.isInstalled('mongodb')) throw new Error("MongoDB n'est pas installé");

    const port = this.getPort('mongodb');
    const inUse = await systemHelper.isPortInUse(port);
    if (!inUse) {
      await this.start('mongodb');
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (await systemHelper.isPortInUse(port)) break;
      }
    }

    return { success: true, type: 'mongodb', dbName: cleanDbName, note: 'Base initialisée sur MongoDB (prête à l\'emploi)' };
  }

  /**
   * Create a CouchDB database via REST API
   */
  async createCouchDatabase(dbName) {
    const cleanDbName = dbName.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
    if (!this.isInstalled('couchdb')) throw new Error("CouchDB n'est pas installé");

    const port = this.getPort('couchdb');
    const inUse = await systemHelper.isPortInUse(port);
    if (!inUse) {
      await this.start('couchdb');
      for (let i = 0; i < 6; i++) {
        await new Promise(r => setTimeout(r, 500));
        if (await systemHelper.isPortInUse(port)) break;
      }
    }

    return new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port,
        path: `/${cleanDbName}`,
        method: 'PUT'
      }, (res) => {
        if (res.statusCode === 201 || res.statusCode === 412) {
          resolve({ success: true, type: 'couchdb', dbName: cleanDbName });
        } else {
          reject(new Error(`CouchDB a retourné le code HTTP ${res.statusCode}`));
        }
      });

      req.on('error', (err) => reject(new Error(`Connexion CouchDB impossible: ${err.message}`)));
      req.end();
    });
  }

  async openWebUi(serviceId) {
    const meta = this.catalog[serviceId];
    let url = null;
    if (serviceId === 'couchdb') {
      url = 'http://localhost:5984/_utils/';
    } else if (meta && meta.webPort) {
      url = `http://localhost:${meta.webPort}`;
    } else if (serviceId === 'meilisearch') {
      url = `http://localhost:${meta.port}`;
    }

    if (url) {
      try {
        const { shell } = require('electron');
        await shell.openExternal(url);
      } catch {
        exec(`start "" "${url}"`);
      }
    }
  }

  async getServiceDetails(serviceId) {
    const meta = this.catalog[serviceId];
    if (!meta) return null;

    const installed = this.isInstalled(serviceId);
    const isSupervised = supervisor.isRunning(serviceId);
    const effectivePort = this.getPort(serviceId);
    const portActive = await systemHelper.isPortInUse(effectivePort);

    const activeVer = meta.versions ? this.getActiveVersion(serviceId) : null;
    const activeVerName = (activeVer && meta.versions[activeVer]) ? meta.versions[activeVer].name : null;
    const serverDir = this.getServiceDir(serviceId);
    const dataDir = this.getDataDir(serviceId);
    const exe = this.getServiceExe(serviceId);

    const processInfo = supervisor.getProcessInfo ? supervisor.getProcessInfo(serviceId) : null;
    const logs = supervisor.getLogs ? supervisor.getLogs(serviceId, 60) : [];

    // Search for config file
    let configFile = null;
    let configContent = null;
    if (serviceId === 'mysql') {
      const candidates = [path.join(serverDir, 'my.ini'), path.join(dataDir, 'my.ini')];
      for (const c of candidates) {
        if (fs.existsSync(c)) { configFile = c; break; }
      }
    } else if (serviceId === 'postgres') {
      const candidates = [path.join(dataDir, 'postgresql.conf')];
      for (const c of candidates) {
        if (fs.existsSync(c)) { configFile = c; break; }
      }
    } else if (serviceId === 'redis') {
      const candidates = [path.join(serverDir, 'redis.windows.conf'), path.join(serverDir, 'redis.conf')];
      for (const c of candidates) {
        if (fs.existsSync(c)) { configFile = c; break; }
      }
    }

    if (configFile && fs.existsSync(configFile)) {
      try {
        configContent = fs.readFileSync(configFile, 'utf8');
      } catch (err) {
        configContent = null;
      }
    }

    return {
      id: serviceId,
      name: meta.name,
      category: meta.category,
      description: meta.description,
      port: effectivePort,
      defaultPort: meta.port,
      webPort: meta.webPort || null,
      installed,
      running: isSupervised || (installed && portActive),
      envSnippet: this.getEnvSnippet(serviceId, effectivePort),
      serverDir: fs.existsSync(serverDir) ? serverDir : null,
      dataDir: fs.existsSync(dataDir) ? dataDir : null,
      binaryPath: (exe && fs.existsSync(exe)) ? exe : null,
      hasVersions: !!meta.versions,
      defaultVersion: meta.defaultVersion || null,
      activeVersion: activeVer,
      activeVersionName: activeVerName,
      versions: meta.versions ? Object.entries(meta.versions).map(([vKey, vMeta]) => ({
        key: vKey,
        name: vMeta.name,
        installed: this.isInstalled(serviceId, vKey)
      })) : null,
      configFile,
      configContent,
      processInfo,
      logs
    };
  }

  async saveServiceConfig(serviceId, { port, version }) {
    const meta = this.catalog[serviceId];
    if (!meta) throw new Error(`Service inconnu: ${serviceId}`);

    const config = systemHelper.getConfig();
    let servicePorts = { ...(config.servicePorts || {}) };
    let serviceVersions = { ...(config.serviceVersions || {}) };
    let needsRestart = false;

    if (port) {
      const p = parseInt(port, 10);
      if (!isNaN(p) && p > 0 && p <= 65535) {
        if (servicePorts[serviceId] !== p) {
          servicePorts[serviceId] = p;
          needsRestart = true;
        }
      }
    }

    if (version && meta.versions && meta.versions[version]) {
      if (serviceVersions[serviceId] !== version) {
        serviceVersions[serviceId] = version;
        needsRestart = true;
      }
    }

    systemHelper.saveConfig({ servicePorts, serviceVersions });

    if (needsRestart && supervisor.isRunning(serviceId)) {
      await this.restart(serviceId);
    }

    return this.getServiceDetails(serviceId);
  }

  async saveConfigFile(serviceId, content) {
    const details = await this.getServiceDetails(serviceId);
    if (!details || !details.configFile) {
      throw new Error(`Aucun fichier de configuration local détecté pour ${serviceId}`);
    }

    fs.writeFileSync(details.configFile, content, 'utf8');

    if (supervisor.isRunning(serviceId)) {
      await this.restart(serviceId);
    }

    return { success: true };
  }
}

module.exports = new ServiceManager();
