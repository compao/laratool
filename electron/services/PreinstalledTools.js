const fs = require('fs');
const path = require('path');
const systemHelper = require('./SystemHelper');
const phpManager = require('./PhpManager');
const nodeManager = require('./NodeManager');
const nginxManager = require('./NginxManager');
const certificateManager = require('./CertificateManager');

class PreinstalledTools {
  getBundleDir() {
    const candidates = [];
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'preinstalled'));
    }
    candidates.push(path.resolve(__dirname, '../../build/preinstalled'));

    for (const dir of candidates) {
      if (fs.existsSync(path.join(dir, 'manifest.json'))) {
        return dir;
      }
    }
    return null;
  }

  copyDirSync(source, target) {
    if (!fs.existsSync(target)) {
      fs.mkdirSync(target, { recursive: true });
    }
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(source, target, { recursive: true, force: true });
      return;
    }
    for (const entry of fs.readdirSync(source)) {
      const srcPath = path.join(source, entry);
      const destPath = path.join(target, entry);
      if (fs.lstatSync(srcPath).isDirectory()) {
        this.copyDirSync(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async seedIfNeeded() {
    const bundleDir = this.getBundleDir();
    if (!bundleDir) {
      return { seeded: false };
    }

    let manifest = {};
    try {
      manifest = JSON.parse(fs.readFileSync(path.join(bundleDir, 'manifest.json'), 'utf-8'));
    } catch {
      return { seeded: false };
    }

    let seededAny = false;

    // 1. Seed standalone CLI binaries (composer.phar, mkcert.exe, ngrok.exe, cloudflared.exe)
    const bundleBinDir = path.join(bundleDir, 'bin');
    if (fs.existsSync(bundleBinDir)) {
      for (const file of fs.readdirSync(bundleBinDir)) {
        const src = path.join(bundleBinDir, file);
        const dest = path.join(systemHelper.binDir, file);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
          fs.copyFileSync(src, dest);
          seededAny = true;
          if (file.toLowerCase() === 'mkcert.exe') {
            certificateManager.invalidateCache();
          }
        }
      }
    }

    // 2. Seed Nginx if no Nginx installation is present yet
    const bundleNginxRoot = path.join(bundleDir, 'nginx');
    if (!nginxManager.isInstalled() && fs.existsSync(bundleNginxRoot)) {
      const nginxSubdirs = fs.readdirSync(bundleNginxRoot).filter((d) =>
        /^nginx-\d+\.\d+\.\d+$/i.test(d) && fs.existsSync(path.join(bundleNginxRoot, d, 'nginx.exe'))
      );
      if (nginxSubdirs.length > 0) {
        const chosenDir = nginxSubdirs[0];
        const version = chosenDir.replace(/^nginx-/i, '');
        const destNginxDir = path.join(systemHelper.nginxDir, chosenDir);
        this.copyDirSync(path.join(bundleNginxRoot, chosenDir), destNginxDir);
        systemHelper.saveConfig({ nginxVersion: version });
        nginxManager.refreshPaths();
        if (!fs.existsSync(nginxManager.confDDir)) {
          fs.mkdirSync(nginxManager.confDDir, { recursive: true });
        }
        await nginxManager.writeMainConfig();
        seededAny = true;
      }
    }

    // 3. Seed PHP (latest bundled branch)
    const bundlePhpRoot = path.join(bundleDir, 'php');
    if (fs.existsSync(bundlePhpRoot)) {
      const phpSubdirs = fs.readdirSync(bundlePhpRoot).filter((d) => /^php-(\d+\.\d+)$/i.test(d));
      for (const dirName of phpSubdirs) {
        const branch = dirName.replace(/^php-/i, '');
        const srcDir = path.join(bundlePhpRoot, dirName);
        if (!fs.existsSync(path.join(srcDir, 'php.exe')) || !fs.existsSync(path.join(srcDir, 'php-cgi.exe'))) {
          continue;
        }
        if (!phpManager.isInstalled(branch)) {
          this.copyDirSync(srcDir, phpManager.getPhpDir(branch));
          phpManager.registerBranchMeta(branch, manifest.phpVersion);
          phpManager.configurePhpIni(branch);

          const cfg = systemHelper.getConfig();
          const enabledPhp = new Set(phpManager.getEnabledVersions());
          enabledPhp.add(branch);
          const patch = { enabledPhpVersions: Array.from(enabledPhp) };
          if (!cfg.defaultPhpVersion || !phpManager.isInstalled(cfg.defaultPhpVersion) || cfg.defaultPhpVersion === branch) {
            patch.defaultPhpVersion = branch;
          }
          systemHelper.saveConfig(patch);
          seededAny = true;
        }
      }
    }

    // 4. Seed Node.js (latest bundled LTS)
    const bundleNodeRoot = path.join(bundleDir, 'nodejs');
    if (fs.existsSync(bundleNodeRoot)) {
      const nodeSubdirs = fs.readdirSync(bundleNodeRoot).filter((d) => /^node-(\d+)$/i.test(d));
      for (const dirName of nodeSubdirs) {
        const major = dirName.replace(/^node-/i, '');
        const srcDir = path.join(bundleNodeRoot, dirName);
        if (!fs.existsSync(path.join(srcDir, 'node.exe'))) {
          continue;
        }
        if (!nodeManager.isInstalled(major)) {
          this.copyDirSync(srcDir, nodeManager.getNodeDir(major));
          nodeManager.registerMajorMeta(major, manifest.nodeVersion, manifest.npmVersion);

          const cfg = systemHelper.getConfig();
          const enabledNode = new Set(nodeManager.getEnabledVersions());
          enabledNode.add(major);
          const patch = { enabledNodeVersions: Array.from(enabledNode) };
          if (!cfg.defaultNodeVersion || !nodeManager.isInstalled(cfg.defaultNodeVersion) || cfg.defaultNodeVersion === major) {
            patch.defaultNodeVersion = major;
          }
          systemHelper.saveConfig(patch);
          seededAny = true;
        }
      }
    }

    // 5. Ensure CLI shims & PATH if we seeded anything
    if (seededAny) {
      await phpManager.ensureShims().catch(() => {});
      await nodeManager.ensureShims().catch(() => {});
    }

    return { seeded: seededAny, manifest };
  }
}

module.exports = new PreinstalledTools();
