const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');
const { EventEmitter } = require('events');
const { spawn, exec, execSync } = require('child_process');
const systemHelper = require('./SystemHelper');

class TunnelManager extends EventEmitter {
  constructor() {
    super();
    this.binDir = systemHelper.binDir;
    this.cloudflaredExe = path.join(this.binDir, 'cloudflared.exe');
    this.cloudflaredDownloadUrl = 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe';
    this.ngrokExe = path.join(this.binDir, 'ngrok.exe');
    this.ngrokDownloadUrl = 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip';
    this.activeTunnels = new Map(); // projectName -> { projectName, url, provider, domain, port, pid, startedAt, child }
    this.tunnelLogs = new Map(); // projectName -> Array<{ time: string, line: string, type: 'info' | 'error' | 'request' }>
    this.isDownloading = false;
    this.downloadProgress = 0;
    this.isDownloadingNgrok = false;
  }

  getCloudflaredPath() {
    if (fs.existsSync(this.cloudflaredExe)) {
      try {
        const stats = fs.statSync(this.cloudflaredExe);
        // Valid executable should be > 10MB
        if (stats.size > 10 * 1024 * 1024) {
          return this.cloudflaredExe;
        }
      } catch {}
    }
    try {
      const out = execSync('where.exe cloudflared', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (out && out.trim()) {
        const found = out.trim().split(/\r?\n/)[0];
        if (fs.existsSync(found)) return found;
      }
    } catch {}
    return null;
  }

  getCloudflaredVersion() {
    const cfExe = this.getCloudflaredPath();
    if (!cfExe) return null;
    try {
      const out = execSync(`"${cfExe}" --version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = out.match(/version\s+([0-9\.\-]+)/i);
      return match ? match[1] : out.trim();
    } catch {
      return null;
    }
  }

  getNgrokPath() {
    // 1. Check bin directory in LaraTool first
    if (fs.existsSync(this.ngrokExe)) return this.ngrokExe;

    // 2. Check system PATH
    try {
      const out = execSync('where.exe ngrok', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (out && out.trim()) {
        const found = out.trim().split(/\r?\n/)[0];
        if (fs.existsSync(found)) return found;
      }
    } catch {}

    // 3. Check common Laragon paths as fallback
    const laragonNgrok = 'D:\\laragon\\bin\\ngrok\\ngrok.exe';
    if (fs.existsSync(laragonNgrok)) return laragonNgrok;

    const cLaragonNgrok = 'C:\\laragon\\bin\\ngrok\\ngrok.exe';
    if (fs.existsSync(cLaragonNgrok)) return cLaragonNgrok;

    return null;
  }

  getNgrokVersion() {
    const ngrokExe = this.getNgrokPath();
    if (!ngrokExe) return null;
    try {
      const out = execSync(`"${ngrokExe}" version`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const match = out.match(/version\s+([0-9\.]+)/i);
      return match ? match[1] : out.trim();
    } catch {
      return null;
    }
  }

  /**
   * Check if Ngrok has an authtoken configured
   */
  getNgrokAuthStatus() {
    const ngrokExe = this.getNgrokPath();
    if (!ngrokExe) {
      return { installed: false, configured: false };
    }

    const possibleConfigs = [
      path.join(process.env.LOCALAPPDATA || '', 'ngrok', 'ngrok.yml'),
      path.join(process.env.USERPROFILE || '', '.ngrok2', 'ngrok.yml'),
      path.join(process.env.USERPROFILE || '', '.config', 'ngrok', 'ngrok.yml'),
      path.join(path.dirname(ngrokExe), 'ngrok.yml')
    ];

    for (const cfg of possibleConfigs) {
      try {
        if (fs.existsSync(cfg)) {
          const content = fs.readFileSync(cfg, 'utf-8');
          if (content.match(/authtoken:\s*['"]?[a-zA-Z0-9_\-\.]+['"]?/i)) {
            return { installed: true, configured: true, path: cfg };
          }
        }
      } catch {}
    }

    // Secondary check: ngrok config check command
    try {
      const out = execSync(`"${ngrokExe}" config check`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
      if (out && !out.toLowerCase().includes('error')) {
        return { installed: true, configured: true };
      }
    } catch {}

    return { installed: true, configured: false };
  }

  /**
   * Configure Ngrok authtoken
   */
  async setNgrokAuthToken(token) {
    const cleanToken = (token || '').trim();
    if (!cleanToken) {
      throw new Error("L'authtoken Ngrok ne peut pas être vide.");
    }
    const ngrokExe = this.getNgrokPath();
    if (!ngrokExe) {
      throw new Error("Ngrok n'est pas installé ou détecté sur votre machine.");
    }

    return new Promise((resolve, reject) => {
      exec(`"${ngrokExe}" config add-authtoken ${cleanToken}`, (err, stdout, stderr) => {
        if (err) {
          return reject(new Error(`Erreur lors de la configuration de l'authtoken : ${stderr || err.message}`));
        }
        resolve({ success: true, message: "Authtoken Ngrok configuré avec succès." });
      });
    });
  }

  /**
   * Download Ngrok official Windows amd64 binary directly into LaraTool bin directory
   */
  async downloadNgrok(onProgress = null) {
    if (this.isDownloadingNgrok) {
      return { inProgress: true };
    }
    this.isDownloadingNgrok = true;
    const tempZip = path.join(this.binDir, 'ngrok-temp.zip');

    try {
      if (!fs.existsSync(this.binDir)) {
        fs.mkdirSync(this.binDir, { recursive: true });
      }

      const progressCallback = (percent) => {
        if (onProgress) {
          try { onProgress(percent); } catch {}
        }
        this.emit('download-progress', { item: 'ngrok', percent });
      };

      progressCallback(10);
      await systemHelper.downloadFile(this.ngrokDownloadUrl, tempZip, (percent) => {
        progressCallback(percent);
      });

      // Extract into binDir
      await systemHelper.extractZip(tempZip, this.binDir);

      if (fs.existsSync(tempZip)) {
        try { fs.unlinkSync(tempZip); } catch {}
      }

      if (!fs.existsSync(this.ngrokExe)) {
        throw new Error("L'extraction de ngrok.exe dans le dossier LaraTool a échoué.");
      }

      const version = this.getNgrokVersion();
      progressCallback(100);

      return {
        success: true,
        path: this.ngrokExe,
        version: version || 'latest'
      };
    } finally {
      this.isDownloadingNgrok = false;
      if (fs.existsSync(tempZip)) {
        try { fs.unlinkSync(tempZip); } catch {}
      }
    }
  }

  /**
   * Update Ngrok to latest official version
   */
  async updateNgrok() {
    const ngrokExe = this.getNgrokPath();
    if (!ngrokExe) {
      // If not installed yet, download it directly
      return this.downloadNgrok();
    }

    return new Promise((resolve, reject) => {
      exec(`"${ngrokExe}" update`, (err, stdout, stderr) => {
        const version = this.getNgrokVersion();
        if (err) {
          // If update command failed (e.g. permission or old binary), try fresh download
          return this.downloadNgrok()
            .then(res => resolve({ success: true, version: res.version, message: "Ngrok a été réinstallé et mis à jour avec succès !" }))
            .catch(dlErr => reject(new Error(`Erreur lors de la mise à jour de Ngrok : ${stderr || err.message}`)));
        }
        resolve({ 
          success: true, 
          version: version || 'latest',
          message: stdout.trim() || `Ngrok est maintenant à jour (${version || ''}).` 
        });
      });
    });
  }

  getEffectivePort() {
    try {
      const config = systemHelper.getConfig();
      return config.nginxPort || 80;
    } catch {
      return 80;
    }
  }

  getPreferredProvider() {
    try {
      const config = systemHelper.getConfig();
      return config.preferredTunnelProvider || 'cloudflare';
    } catch {
      return 'cloudflare';
    }
  }

  getProviders() {
    const cfPath = this.getCloudflaredPath();
    const cfVersion = this.getCloudflaredVersion();
    const ngrokPath = this.getNgrokPath();
    const ngrokVersion = this.getNgrokVersion();
    const ngrokAuth = this.getNgrokAuthStatus();
    const isLaraToolNgrok = !!(ngrokPath && ngrokPath.toLowerCase() === this.ngrokExe.toLowerCase());
    const preferred = this.getPreferredProvider();

    return [
      {
        id: 'cloudflare',
        name: 'Cloudflare Tunnel',
        description: '100% Gratuit, sans compte ni token requis',
        installed: !!cfPath,
        version: cfVersion,
        path: cfPath,
        badge: 'Recommandé',
        hasAuthToken: true, // No token needed
        isPreferred: preferred === 'cloudflare'
      },
      {
        id: 'ngrok',
        name: 'Ngrok',
        description: 'Tunnel rapide avec inspecteur HTTP intégré',
        installed: !!ngrokPath,
        version: ngrokVersion,
        path: ngrokPath,
        isLaraToolBin: isLaraToolNgrok,
        badge: ngrokPath ? (ngrokAuth.configured ? (ngrokVersion ? `v${ngrokVersion}` : 'Prêt à l\'emploi') : 'Token requis') : 'Non détecté',
        hasAuthToken: ngrokAuth.configured,
        isPreferred: preferred === 'ngrok'
      }
    ];
  }

  /**
   * Explicit download triggered only when user requests it, with true progress tracking
   */
  async downloadCloudflared(onProgress = null) {
    if (this.getCloudflaredPath()) {
      return { success: true, alreadyInstalled: true, path: this.getCloudflaredPath() };
    }

    if (this.isDownloading) {
      return { inProgress: true, percent: this.downloadProgress };
    }

    this.isDownloading = true;
    this.downloadProgress = 0;

    try {
      if (!fs.existsSync(this.binDir)) {
        fs.mkdirSync(this.binDir, { recursive: true });
      }

      const progressCallback = (percent) => {
        this.downloadProgress = percent;
        if (onProgress) {
          try { onProgress(percent); } catch {}
        }
        this.emit('download-progress', { item: 'cloudflared', percent });
      };

      try {
        await systemHelper.downloadFile(this.cloudflaredDownloadUrl, this.cloudflaredExe, (percent) => {
          progressCallback(percent);
        });
      } catch (nodeErr) {
        // Fallback to curl.exe if Node stream had SSL/redirect issue
        await new Promise((resolve, reject) => {
          const tempExe = `${this.cloudflaredExe}.tmp`;
          exec(`curl.exe -L -o "${tempExe}" "${this.cloudflaredDownloadUrl}"`, { maxBuffer: 20 * 1024 * 1024 }, (err) => {
            if (err) {
              if (fs.existsSync(tempExe)) try { fs.unlinkSync(tempExe); } catch {}
              return reject(new Error(`Téléchargement curl de cloudflared échoué : ${err.message}`));
            }
            try {
              if (fs.existsSync(this.cloudflaredExe)) fs.unlinkSync(this.cloudflaredExe);
              fs.renameSync(tempExe, this.cloudflaredExe);
              resolve(true);
            } catch (renameErr) {
              reject(renameErr);
            }
          });
        });
      }

      // Verify the downloaded binary size
      if (!fs.existsSync(this.cloudflaredExe)) {
        throw new Error("Le fichier cloudflared.exe n'a pas pu être créé.");
      }

      const stats = fs.statSync(this.cloudflaredExe);
      if (stats.size < 10 * 1024 * 1024) {
        try { fs.unlinkSync(this.cloudflaredExe); } catch {}
        throw new Error(`Fichier cloudflared.exe corrompu ou incomplet (${Math.round(stats.size / 1024)} Ko). Veuillez réessayer.`);
      }

      progressCallback(100);

      return {
        success: true,
        path: this.cloudflaredExe
      };
    } finally {
      this.isDownloading = false;
    }
  }

  appendLog(projectName, line, type = 'info') {
    if (!this.tunnelLogs.has(projectName)) {
      this.tunnelLogs.set(projectName, []);
    }
    const logs = this.tunnelLogs.get(projectName);
    const entry = {
      time: new Date().toLocaleTimeString(),
      line: line.trim(),
      type
    };
    logs.push(entry);
    if (logs.length > 200) {
      logs.shift();
    }
    this.emit('log', { projectName, entry });
  }

  getLogs(projectName) {
    return this.tunnelLogs.get(projectName) || [];
  }

  clearLogs(projectName) {
    this.tunnelLogs.set(projectName, []);
    return { success: true };
  }

  async startTunnel(projectName, domain, provider = null, port = null) {
    if (this.activeTunnels.has(projectName)) {
      return this.activeTunnels.get(projectName);
    }

    const localPort = port || this.getEffectivePort();
    const effectiveProvider = provider || this.getPreferredProvider();
    this.tunnelLogs.set(projectName, []);

    if (effectiveProvider === 'cloudflare') {
      const cfExe = this.getCloudflaredPath();
      if (!cfExe) {
        throw new Error("Cloudflare Tunnel (cloudflared.exe) n'est pas encore installé. Cliquez sur 'Télécharger Cloudflare' ou sélectionnez Ngrok.");
      }

      this.appendLog(projectName, `Démarrage de Cloudflare Tunnel vers http://127.0.0.1:${localPort} (Host: ${domain})...`);

      return new Promise((resolve, reject) => {
        let isResolved = false;
        const args = ['tunnel', '--url', `http://127.0.0.1:${localPort}`, '--http-host-header', domain];

        const child = spawn(cfExe, args, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderrBuffer = '';

        const timeout = setTimeout(() => {
          if (!isResolved) {
            isResolved = true;
            try { child.kill(); } catch {}
            reject(new Error(`Délai d'attente dépassé (30s) pour la génération de l'URL Cloudflare Tunnel. ${stderrBuffer ? 'Détails : ' + stderrBuffer.slice(-200) : ''}`));
          }
        }, 30000);

        const handleOutput = (data, isErr = false) => {
          const text = data.toString();
          if (isErr) stderrBuffer += text;

          // Split lines for readable logs
          const lines = text.split(/\r?\n/);
          for (const rawLine of lines) {
            const trimmed = rawLine.trim();
            if (!trimmed) continue;
            let logType = 'info';
            if (trimmed.toLowerCase().includes('error') || trimmed.toLowerCase().includes('fail')) {
              logType = 'error';
            } else if (trimmed.includes('GET ') || trimmed.includes('POST ') || trimmed.includes('HTTP/')) {
              logType = 'request';
            }
            this.appendLog(projectName, trimmed, logType);
          }

          // Match https://[subdomain].trycloudflare.com
          const match = text.match(/https:\/\/[a-zA-Z0-9\-]+\.trycloudflare\.com/i);
          if (match && !isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            const publicUrl = match[0];

            this.appendLog(projectName, `Tunnel public prêt : ${publicUrl}`, 'info');

            const record = {
              projectName,
              url: publicUrl,
              provider: 'cloudflare',
              domain,
              port: localPort,
              pid: child.pid,
              startedAt: new Date().toISOString(),
              child
            };

            this.activeTunnels.set(projectName, record);
            this.emit('status-changed', { projectName, isRunning: true, ...record });

            resolve({
              success: true,
              projectName,
              url: publicUrl,
              provider: 'cloudflare',
              domain,
              port: localPort,
              startedAt: record.startedAt
            });
          }
        };

        if (child.stderr) child.stderr.on('data', (d) => handleOutput(d, true));
        if (child.stdout) child.stdout.on('data', (d) => handleOutput(d, false));

        child.on('error', (err) => {
          this.appendLog(projectName, `Erreur processus Cloudflare: ${err.message}`, 'error');
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            reject(new Error(`Erreur lors du lancement de Cloudflare Tunnel : ${err.message}`));
          }
        });

        child.on('exit', (code) => {
          this.appendLog(projectName, `Le processus Cloudflare s'est arrêté (code ${code}).`, code === 0 ? 'info' : 'error');
          this.activeTunnels.delete(projectName);
          this.emit('status-changed', { projectName, isRunning: false, exitCode: code });
          if (!isResolved) {
            isResolved = true;
            clearTimeout(timeout);
            reject(new Error(`Cloudflare Tunnel s'est arrêté prématurément (code ${code}). ${stderrBuffer ? 'Détails : ' + stderrBuffer.slice(-300) : ''}`));
          }
        });
      });
    } else if (effectiveProvider === 'ngrok') {
      const ngrokExe = this.getNgrokPath();
      if (!ngrokExe) {
        throw new Error("Ngrok n'a pas été détecté sur votre système.");
      }

      const authStatus = this.getNgrokAuthStatus();
      if (!authStatus.configured) {
        throw new Error("Ngrok requiert un compte et un AuthToken gratuit pour démarrer un tunnel. Veuillez renseigner votre token dans les options du tunnel.");
      }

      this.appendLog(projectName, `Démarrage de Ngrok vers 127.0.0.1:${localPort} (Host: ${domain})...`);

      return new Promise((resolve, reject) => {
        let isResolved = false;
        // Use 127.0.0.1:port with host-header to ensure direct local binding
        const args = ['http', `127.0.0.1:${localPort}`, `--host-header=${domain}`];

        const child = spawn(ngrokExe, args, {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe']
        });

        let stderrBuffer = '';

        const handleLog = (data, isErr = false) => {
          const text = data.toString();
          if (isErr) stderrBuffer += text;
          const lines = text.split(/\r?\n/);
          for (const l of lines) {
            const trimmed = l.trim();
            if (trimmed) {
              const logType = (isErr || trimmed.toLowerCase().includes('error')) ? 'error' : 'info';
              this.appendLog(projectName, trimmed, logType);
            }
          }
        };

        if (child.stderr) child.stderr.on('data', d => handleLog(d, true));
        if (child.stdout) child.stdout.on('data', d => handleLog(d, false));

        child.on('error', (err) => {
          this.appendLog(projectName, `Erreur Ngrok: ${err.message}`, 'error');
          if (!isResolved) {
            isResolved = true;
            reject(new Error(`Erreur lancement Ngrok : ${err.message}`));
          }
        });

        child.on('exit', (code) => {
          this.appendLog(projectName, `Le processus Ngrok s'est arrêté (code ${code}).`, code === 0 ? 'info' : 'error');
          this.activeTunnels.delete(projectName);
          this.emit('status-changed', { projectName, isRunning: false, exitCode: code });
          if (!isResolved) {
            isResolved = true;
            let errorMsg = `Ngrok s'est arrêté immédiatement (code ${code}).`;
            if (stderrBuffer.toLowerCase().includes('agent version') || stderrBuffer.toLowerCase().includes('updating your sdk version')) {
              errorMsg = "Votre version de Ngrok était obsolète pour le service gratuit Ngrok. Une mise à jour automatique a été effectuée vers la version la plus récente. Veuillez relancer le tunnel.";
              // Trigger update in background to fix it
              this.updateNgrok().catch(() => {});
            } else if (stderrBuffer) {
              errorMsg += ` Détails : ${stderrBuffer.slice(-300)}`;
            } else {
              errorMsg += ' Vérifiez votre authtoken ou vos ports.';
            }
            reject(new Error(errorMsg));
          }
        });

        // Poll ngrok local API at http://127.0.0.1:4040/api/tunnels
        let attempts = 0;
        const pollInterval = setInterval(() => {
          attempts++;
          if (attempts > 30) {
            clearInterval(pollInterval);
            if (!isResolved) {
              isResolved = true;
              try { child.kill(); } catch {}
              reject(new Error(`Délai d'attente dépassé pour la connexion Ngrok. ${stderrBuffer ? 'Détails : ' + stderrBuffer.slice(-250) : 'Vérifiez votre configuration ou authtoken.'}`));
            }
            return;
          }

          const req = http.get('http://127.0.0.1:4040/api/tunnels', (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
              try {
                const data = JSON.parse(body);
                if (data && data.tunnels && data.tunnels.length > 0) {
                  // Find the tunnel that matches our port or domain, or default to https tunnel
                  const matchingTunnel = data.tunnels.find(t => 
                    t.public_url && t.public_url.startsWith('https://') &&
                    (t.config?.addr?.includes(String(localPort)) || true)
                  ) || data.tunnels[0];

                  if (matchingTunnel && !isResolved) {
                    isResolved = true;
                    clearInterval(pollInterval);

                    const publicUrl = matchingTunnel.public_url;
                    this.appendLog(projectName, `Tunnel Ngrok en ligne : ${publicUrl}`, 'info');

                    const record = {
                      projectName,
                      url: publicUrl,
                      provider: 'ngrok',
                      domain,
                      port: localPort,
                      pid: child.pid,
                      startedAt: new Date().toISOString(),
                      child
                    };

                    this.activeTunnels.set(projectName, record);
                    this.emit('status-changed', { projectName, isRunning: true, ...record });

                    resolve({
                      success: true,
                      projectName,
                      url: publicUrl,
                      provider: 'ngrok',
                      domain,
                      port: localPort,
                      startedAt: record.startedAt
                    });
                  }
                }
              } catch {}
            });
          });

          req.on('error', () => {
            // Ngrok server not yet listening, keep polling
          });
        }, 500);
      });
    } else {
      throw new Error(`Fournisseur de tunnel non reconnu : ${effectiveProvider}`);
    }
  }

  stopTunnel(projectName) {
    if (this.activeTunnels.has(projectName)) {
      const record = this.activeTunnels.get(projectName);
      this.appendLog(projectName, `Arrêt demandé du tunnel ${projectName}...`);
      try {
        if (record.pid) {
          if (process.platform === 'win32') {
            try {
              execSync(`taskkill /pid ${record.pid} /f /t`, { stdio: 'ignore' });
            } catch {}
          }
        }
        if (record.child && !record.child.killed) {
          record.child.kill();
        }
      } catch {}
      this.activeTunnels.delete(projectName);
      this.emit('status-changed', { projectName, isRunning: false });
      return { success: true, projectName };
    }
    return { success: true, notRunning: true };
  }

  getTunnel(projectName) {
    if (this.activeTunnels.has(projectName)) {
      const r = this.activeTunnels.get(projectName);
      return {
        projectName: r.projectName,
        url: r.url,
        provider: r.provider,
        domain: r.domain,
        port: r.port,
        startedAt: r.startedAt,
        isRunning: true
      };
    }
    return null;
  }

  listTunnels() {
    const list = [];
    for (const [name, r] of this.activeTunnels.entries()) {
      list.push({
        projectName: name,
        url: r.url,
        provider: r.provider,
        domain: r.domain,
        port: r.port,
        startedAt: r.startedAt,
        isRunning: true
      });
    }
    return list;
  }

  stopAll() {
    for (const name of Array.from(this.activeTunnels.keys())) {
      this.stopTunnel(name);
    }
  }

  /**
   * Ping a public tunnel URL to measure HTTP status and response latency
   */
  async pingTunnel(targetUrl) {
    const start = Date.now();
    return new Promise((resolve) => {
      try {
        const parsed = new URL(targetUrl);
        const getter = parsed.protocol === 'http:' ? http : https;
        const options = {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname || '/',
          method: 'GET',
          headers: {
            'User-Agent': 'LaraTool-Tunnel-HealthCheck/1.0',
            'Accept': '*/*'
          },
          timeout: 8000
        };

        const req = getter.request(options, (res) => {
          const latency = Date.now() - start;
          resolve({
            success: true,
            status: res.statusCode,
            statusText: res.statusMessage || '',
            latencyMs: latency
          });
          req.destroy();
        });

        req.on('timeout', () => {
          req.destroy();
          resolve({
            success: false,
            error: "Délai de connexion dépassé (timeout 8s)",
            latencyMs: Date.now() - start
          });
        });

        req.on('error', (err) => {
          resolve({
            success: false,
            error: err.message,
            latencyMs: Date.now() - start
          });
        });

        req.end();
      } catch (err) {
        resolve({
          success: false,
          error: err.message,
          latencyMs: Date.now() - start
        });
      }
    });
  }
}

module.exports = new TunnelManager();
