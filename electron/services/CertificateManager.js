const path = require('path');
const fs = require('fs');
const os = require('os');
const { exec, execSync } = require('child_process');
const systemHelper = require('./SystemHelper');

class CertificateManager {
  constructor() {
    this.mkcertVersion = 'v1.4.4';
    this.mkcertUrl = `https://github.com/FiloSottile/mkcert/releases/download/${this.mkcertVersion}/mkcert-${this.mkcertVersion}-windows-amd64.exe`;
    this.mkcertExe = path.join(systemHelper.binDir, 'mkcert.exe');
    this.sslDir = systemHelper.sslDir;
    this.wildcardCert = path.join(this.sslDir, '_wildcard.test.pem');
    this.wildcardKey = path.join(this.sslDir, '_wildcard.test-key.pem');
    this.caRootDir = path.join(os.homedir(), 'AppData', 'Local', 'mkcert');

    // In-memory caches to prevent blocking event loop with execSync calls
    this._mkcertBin = null;
    this._caInstalled = null;
    this._cachedStatus = null;
  }

  invalidateCache() {
    this._cachedStatus = null;
    this._caInstalled = null;
  }

  getMkcertBin() {
    if (this._mkcertBin && fs.existsSync(this._mkcertBin)) {
      return this._mkcertBin;
    }
    if (fs.existsSync(this.mkcertExe)) {
      this._mkcertBin = this.mkcertExe;
      return this._mkcertBin;
    }
    try {
      const out = execSync('where.exe mkcert', { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (out && out.trim()) {
        const found = out.trim().split(/\r?\n/)[0];
        if (fs.existsSync(found)) {
          this._mkcertBin = found;
          return found;
        }
      }
    } catch {}
    return null;
  }

  hasMkcert() {
    return !!this.getMkcertBin();
  }

  async ensureMkcert(onProgress) {
    const existing = this.getMkcertBin();
    if (existing) return existing;

    if (!fs.existsSync(systemHelper.binDir)) {
      fs.mkdirSync(systemHelper.binDir, { recursive: true });
    }

    const tempExe = path.join(systemHelper.rootDir, 'temp-mkcert.exe');
    try {
      await systemHelper.downloadFile(this.mkcertUrl, tempExe, onProgress);
      fs.copyFileSync(tempExe, this.mkcertExe);
      this._mkcertBin = this.mkcertExe;
      this.invalidateCache();
      return this.mkcertExe;
    } finally {
      if (fs.existsSync(tempExe)) {
        fs.unlinkSync(tempExe);
      }
    }
  }

  getCaRootDir() {
    if (fs.existsSync(this.caRootDir)) {
      return this.caRootDir;
    }
    const bin = this.getMkcertBin();
    if (!bin) return null;
    try {
      const out = execSync(`"${bin}" -CAROOT`, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      if (out && out.trim()) {
        this.caRootDir = out.trim();
        return this.caRootDir;
      }
    } catch {}
    return null;
  }

  isCaInstalled(forceCheck = false) {
    if (!forceCheck && this._caInstalled !== null) {
      return this._caInstalled;
    }

    const caDir = this.getCaRootDir();
    if (!caDir) {
      this._caInstalled = false;
      return false;
    }
    const caFile = path.join(caDir, 'rootCA.pem');
    if (!fs.existsSync(caFile)) {
      this._caInstalled = false;
      return false;
    }

    // Fast check: presence of rootCA.pem means CA was generated
    this._caInstalled = true;
    return true;
  }

  async installCa(onProgress) {
    const bin = await this.ensureMkcert(onProgress);
    return new Promise((resolve, reject) => {
      // Limit TRUST_STORES to system and nss (Firefox) to avoid Java keytool permission issues
      const options = {
        env: { ...process.env, TRUST_STORES: 'system,nss' }
      };
      exec(`"${bin}" -install`, options, (err, stdout, stderr) => {
        const output = (stdout || '') + ' ' + (stderr || '');
        this.invalidateCache();
        if (this.isCaInstalled(true) || output.includes('installed in the system trust store') || output.includes('already installed')) {
          return resolve({ success: true, output });
        }
        if (err) {
          return reject(new Error(`Échec de l'installation de la CA racine : ${stderr || err.message}`));
        }
        resolve({ success: true, output });
      });
    });
  }

  isWildcardCertReady() {
    try {
      return (
        fs.existsSync(this.wildcardCert) &&
        fs.existsSync(this.wildcardKey) &&
        fs.statSync(this.wildcardCert).size > 0 &&
        fs.statSync(this.wildcardKey).size > 0
      );
    } catch {
      return false;
    }
  }

  async generateWildcardCert(onProgress) {
    if (!fs.existsSync(this.sslDir)) {
      fs.mkdirSync(this.sslDir, { recursive: true });
    }

    const bin = await this.ensureMkcert(onProgress);

    // If CA is not installed, install it first
    if (!this.isCaInstalled()) {
      await this.installCa(onProgress);
    }

    const tld = systemHelper.getConfig().tld || 'test';
    return new Promise((resolve, reject) => {
      const cmd = `"${bin}" -cert-file "${this.wildcardCert}" -key-file "${this.wildcardKey}" "*.${tld}" "*.test" "localhost" "127.0.0.1" "::1"`;
      exec(cmd, { cwd: this.sslDir, env: { ...process.env, TRUST_STORES: 'system,nss' } }, (err, stdout, stderr) => {
        this.invalidateCache();
        if (err && !this.isWildcardCertReady()) {
          return reject(new Error(`Impossible de générer le certificat wildcard : ${stderr || err.message}`));
        }
        resolve({
          success: true,
          cert: this.wildcardCert,
          key: this.wildcardKey,
          output: stdout
        });
      });
    });
  }

  getCertPaths() {
    return {
      cert: this.wildcardCert.replace(/\\/g, '/'),
      key: this.wildcardKey.replace(/\\/g, '/')
    };
  }

  getProjectCertPaths(domain) {
    const safeDomain = (domain || '').toLowerCase().replace(/[^a-z0-9-_.]/g, '-');
    const certFile = path.join(this.sslDir, `${safeDomain}.pem`);
    const keyFile = path.join(this.sslDir, `${safeDomain}-key.pem`);
    return {
      cert: certFile.replace(/\\/g, '/'),
      key: keyFile.replace(/\\/g, '/')
    };
  }

  isProjectCertReady(domain) {
    const paths = this.getProjectCertPaths(domain);
    try {
      return (
        fs.existsSync(paths.cert) &&
        fs.existsSync(paths.key) &&
        fs.statSync(paths.cert).size > 0 &&
        fs.statSync(paths.key).size > 0
      );
    } catch {
      return false;
    }
  }

  async generateProjectCert(domain, onProgress) {
    if (!fs.existsSync(this.sslDir)) {
      fs.mkdirSync(this.sslDir, { recursive: true });
    }

    const bin = await this.ensureMkcert(onProgress);

    if (!this.isCaInstalled()) {
      await this.installCa(onProgress);
    }

    const paths = this.getProjectCertPaths(domain);
    return new Promise((resolve, reject) => {
      const cmd = `"${bin}" -cert-file "${paths.cert}" -key-file "${paths.key}" "${domain}" "www.${domain}"`;
      exec(cmd, { cwd: this.sslDir, env: { ...process.env, TRUST_STORES: 'system,nss' } }, (err, stdout, stderr) => {
        if (err && !this.isProjectCertReady(domain)) {
          return reject(new Error(`Impossible de générer le certificat SSL pour ${domain} : ${stderr || err.message}`));
        }
        resolve({
          success: true,
          domain,
          cert: paths.cert,
          key: paths.key
        });
      });
    });
  }

  removeProjectCert(domain) {
    const paths = this.getProjectCertPaths(domain);
    try {
      if (fs.existsSync(paths.cert)) fs.unlinkSync(paths.cert);
      if (fs.existsSync(paths.key)) fs.unlinkSync(paths.key);
    } catch {}
  }

  getStatus(force = false) {
    if (!force && this._cachedStatus) {
      return this._cachedStatus;
    }

    const config = systemHelper.getConfig();
    const sslEnabled = !!config.sslEnabled;
    const hasMkcert = this.hasMkcert();
    const caInstalled = this.isCaInstalled(force);
    const wildcardReady = this.isWildcardCertReady();
    const certPaths = this.getCertPaths();

    this._cachedStatus = {
      enabled: sslEnabled,
      hasMkcert,
      caInstalled,
      wildcardReady,
      certPath: certPaths.cert,
      keyPath: certPaths.key,
      httpsPort: 443
    };

    return this._cachedStatus;
  }

  async toggleSsl(enable, onProgress) {
    if (enable) {
      await this.ensureMkcert(onProgress);
      if (!this.isCaInstalled()) {
        await this.installCa(onProgress);
      }
      if (!this.isWildcardCertReady()) {
        await this.generateWildcardCert(onProgress);
      }
    }

    systemHelper.saveConfig({ sslEnabled: !!enable });
    this.invalidateCache();
    return this.getStatus(true);
  }
}

module.exports = new CertificateManager();
