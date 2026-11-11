const path = require('path');
const fs = require('fs');
const { exec, execSync } = require('child_process');
const systemHelper = require('./SystemHelper');
const supervisor = require('./ProcessSupervisor');
const certificateManager = require('./CertificateManager');

class NginxManager {
  constructor() {
    this.defaultVersion = '1.26.2';
    this.refreshPaths();
  }

  resolveInstalledVersion() {
    const config = systemHelper.getConfig();
    if (config.nginxVersion) {
      const configuredExe = path.join(systemHelper.nginxDir, `nginx-${config.nginxVersion}`, 'nginx.exe');
      if (fs.existsSync(configuredExe)) {
        return config.nginxVersion;
      }
    }

    if (fs.existsSync(systemHelper.nginxDir)) {
      try {
        const dirs = fs.readdirSync(systemHelper.nginxDir)
          .filter((name) => /^nginx-\d+\.\d+\.\d+$/i.test(name))
          .filter((name) => fs.existsSync(path.join(systemHelper.nginxDir, name, 'nginx.exe')))
          .map((name) => name.replace(/^nginx-/i, ''))
          .sort((a, b) => systemHelper.compareVersions(b, a));

        if (dirs.length > 0) {
          return dirs[0];
        }
      } catch {}
    }

    return config.nginxVersion || this.defaultVersion;
  }

  refreshPaths() {
    this.version = this.resolveInstalledVersion();
    this.downloadUrl = `https://nginx.org/download/nginx-${this.version}.zip`;
    this.nginxHome = path.join(systemHelper.nginxDir, `nginx-${this.version}`);
    this.confDir = path.join(this.nginxHome, 'conf');
    this.confDDir = path.join(this.confDir, 'conf.d');
  }

  getNginxExe() {
    this.refreshPaths();
    return path.join(this.nginxHome, 'nginx.exe');
  }

  isInstalled() {
    return fs.existsSync(this.getNginxExe());
  }

  async resolveLatestDownloadVersion() {
    try {
      const https = require('https');
      const html = await new Promise((resolve, reject) => {
        const req = https.get('https://nginx.org/en/download.html', { timeout: 8000 }, (res) => {
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode}`));
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (c) => { body += c; });
          res.on('end', () => resolve(body));
        });
        req.on('timeout', () => req.destroy(new Error('Timeout')));
        req.on('error', reject);
      });
      const matches = [...html.matchAll(/\/download\/nginx-(\d+\.\d+\.\d+)\.zip/g)].map((m) => m[1]);
      if (matches.length > 0) {
        matches.sort((a, b) => systemHelper.compareVersions(b, a));
        return matches[0];
      }
    } catch {}
    return this.defaultVersion;
  }

  async install(onProgress) {
    if (this.isInstalled()) return true;

    const latestVersion = await this.resolveLatestDownloadVersion();
    this.version = latestVersion;
    this.downloadUrl = `https://nginx.org/download/nginx-${latestVersion}.zip`;
    this.nginxHome = path.join(systemHelper.nginxDir, `nginx-${latestVersion}`);
    this.confDir = path.join(this.nginxHome, 'conf');
    this.confDDir = path.join(this.confDir, 'conf.d');

    const tempZip = path.join(systemHelper.rootDir, `temp-nginx-${this.version}.zip`);
    try {
      await systemHelper.downloadFile(this.downloadUrl, tempZip, onProgress);
      await systemHelper.extractZip(tempZip, systemHelper.nginxDir);
      systemHelper.saveConfig({ nginxVersion: this.version });

      if (!fs.existsSync(this.confDDir)) {
        fs.mkdirSync(this.confDDir, { recursive: true });
      }

      await this.writeMainConfig();
      return true;
    } finally {
      if (fs.existsSync(tempZip)) {
        fs.unlinkSync(tempZip);
      }
    }
  }

  getEffectivePort() {
    const config = systemHelper.getConfig();
    return config.nginxPort || 80;
  }

  async writeMainConfig() {
    const port = await this.getEffectivePort();
    const mainConfPath = path.join(this.confDir, 'nginx.conf');
    const logsPath = systemHelper.logsDir.replace(/\\/g, '/');
    const confDPath = this.confDDir.replace(/\\/g, '/');

    const sslStatus = certificateManager.getStatus();
    const hasWildcard = sslStatus.wildcardReady;

    const sslHttpBlock = `
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
`;

    const certPathClean = (sslStatus?.certPath || '').replace(/\\/g, '/');
    const keyPathClean = (sslStatus?.keyPath || '').replace(/\\/g, '/');

    const sslFallbackServer = hasWildcard ? `
    # Fallback server HTTPS
    server {
        listen       443 ssl default_server;
        server_name  localhost;
        ssl_certificate "${certPathClean}";
        ssl_certificate_key "${keyPathClean}";

        location / {
            return 200 'LaraTool Nginx HTTPS is active on port 443!';
            add_header Content-Type text/plain;
        }
    }
` : '';

    const config = `
# Generated automatically by LaraTool
worker_processes 2;

error_log "${logsPath}/nginx_error.log" warn;
pid       "${logsPath}/nginx.pid";

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  "${logsPath}/nginx_access.log"  main;

    sendfile        on;
    tcp_nopush      on;
    tcp_nodelay     on;
    keepalive_timeout  65;
    types_hash_max_size 2048;
    server_names_hash_bucket_size 128;
    server_names_hash_max_size 4096;
    client_max_body_size 128M;
${sslHttpBlock}
    # Fallback server HTTP
    server {
        listen       ${port} default_server;
        server_name  localhost;

        location / {
            return 200 'LaraTool Nginx is active on port ${port}!';
            add_header Content-Type text/plain;
        }
    }
${sslFallbackServer}
    # Project virtual hosts
    include "${confDPath}/*.conf";
}
`;
    fs.writeFileSync(mainConfPath, config, 'utf-8');
  }

  async generateSiteConfig(site) {
    const port = await this.getEffectivePort();
    if (!fs.existsSync(this.confDDir)) {
      fs.mkdirSync(this.confDDir, { recursive: true });
    }

    const confFile = path.join(this.confDDir, `${site.name}.conf`);
    const cleanPublicPath = site.publicPath.replace(/\\/g, '/');

    // Use individual project certificate if ready, or wildcard fallback if site.isSsl is enabled
    let sslDirective = '';
    if (site.isSsl) {
      let certPath, keyPath;
      if (certificateManager.isProjectCertReady(site.domain)) {
        const projectPaths = certificateManager.getProjectCertPaths(site.domain);
        certPath = projectPaths.cert;
        keyPath = projectPaths.key;
      } else if (certificateManager.getStatus().wildcardReady) {
        const wildcardPaths = certificateManager.getCertPaths();
        certPath = wildcardPaths.cert;
        keyPath = wildcardPaths.key;
      }

      const certPathClean = (certPath || '').replace(/\\/g, '/');
      const keyPathClean = (keyPath || '').replace(/\\/g, '/');

      if (certPathClean && keyPathClean) {
        sslDirective = `
    listen 443 ssl;
    ssl_certificate "${certPathClean}";
    ssl_certificate_key "${keyPathClean}";
`;
      }
    }

    const content = `
# LaraTool Site Configuration for ${site.domain}
server {
    listen ${port};${sslDirective}
    server_name ${site.domain} www.${site.domain};
    root "${cleanPublicPath}";

    # Allow framing for LaraTool local live preview
    # add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php index.html;
    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \\.php$ {
        fastcgi_pass 127.0.0.1:${site.phpPort || 9183};
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
        fastcgi_hide_header X-Frame-Options;
        fastcgi_read_timeout 300;
    }

    location ~ /\\.(?!well-known).* {
        deny all;
    }
}
`;
    fs.writeFileSync(confFile, content, 'utf-8');
  }

  removeSiteConfig(siteName) {
    const confFile = path.join(this.confDDir, `${siteName}.conf`);
    if (fs.existsSync(confFile)) {
      fs.unlinkSync(confFile);
    }
  }

  async isRunning() {
    const port = await this.getEffectivePort();
    const portActive = await systemHelper.isPortInUse(port);
    return supervisor.isRunning('nginx') || (portActive && supervisor.processes.has('nginx'));
  }

  async start() {
    if (!this.isInstalled()) {
      throw new Error("Nginx n'est pas encore installé. Téléchargement nécessaire.");
    }

    await this.writeMainConfig();

    const exe = this.getNginxExe();
    supervisor.start('nginx', exe, [], {
      cwd: this.nginxHome
    });

    return { success: true };
  }

  async reload() {
    if (!this.isInstalled()) return { success: false };

    // On Windows, 'nginx -s reload' frequently fails to terminate old worker processes,
    // which leaves stale sockets holding outdated certificates in memory.
    // A clean stop & start guarantees that old workers are terminated and new certificates are loaded.
    try {
      await this.stop();
      await new Promise(r => setTimeout(r, 400));
      await this.start();
      return { success: true };
    } catch (err) {
      console.error('Nginx reload error:', err);
      return { success: false, error: err.message };
    }
  }

  async stop() {
    await supervisor.stop('nginx');
    const pidFile = path.join(systemHelper.logsDir, 'nginx.pid');
    if (fs.existsSync(pidFile)) {
      try {
        const pid = fs.readFileSync(pidFile, 'utf-8').trim();
        if (pid) {
          execSync(`taskkill /pid ${pid} /f /t`);
        }
      } catch (e) {}
    }
    return { success: true };
  }

  openConfig() {
    const mainConf = path.join(this.confDir, 'nginx.conf');
    return systemHelper.openInEditor(mainConf);
  }

  openConfD() {
    return systemHelper.openInExplorer(this.confDDir);
  }

  openSiteConfig(siteName) {
    const cleanName = siteName.replace(/\.conf$/, '');
    const confFile = path.join(this.confDDir, `${cleanName}.conf`);
    return systemHelper.openInEditor(confFile);
  }

  openFolder() {
    return systemHelper.openInExplorer(this.nginxHome);
  }

  listSiteConfigs() {
    if (!fs.existsSync(this.confDDir)) return [];
    try {
      return fs.readdirSync(this.confDDir)
        .filter(f => f.endsWith('.conf'))
        .map(f => {
          const site = f.replace(/\.conf$/, '');
          return {
            filename: f,
            siteName: site,
            path: path.join(this.confDDir, f)
          };
        });
    } catch {
      return [];
    }
  }
}

module.exports = new NginxManager();
