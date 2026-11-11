const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { execFileSync } = require('child_process');
const AdmZip = require('adm-zip');

const ROOT_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT_DIR, 'build', 'preinstalled');
const BIN_DIR = path.join(OUT_DIR, 'bin');
const NGINX_DIR = path.join(OUT_DIR, 'nginx');
const PHP_DIR = path.join(OUT_DIR, 'php');
const NODE_DIR = path.join(OUT_DIR, 'nodejs');
const TEMP_DIR = path.join(OUT_DIR, '.tmp');
const MANIFEST_PATH = path.join(OUT_DIR, 'manifest.json');

const FORCE = process.argv.includes('--force');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function compareVersions(a, b) {
  const parse = (v) =>
    String(v || '')
      .trim()
      .replace(/^v/i, '')
      .split('-')[0]
      .split('.')
      .map((n) => parseInt(n, 10) || 0)
      .concat([0, 0, 0])
      .slice(0, 3);

  const pa = parse(a);
  const pb = parse(b);
  for (let i = 0; i < 3; i++) {
    if (pa[i] > pb[i]) return 1;
    if (pa[i] < pb[i]) return -1;
  }
  return 0;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withRetry(fn, label, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) {
        console.warn(`[preinstall] ${label} attempt ${i}/${attempts} failed (${err.message}), retrying...`);
        await sleep(i * 1500);
      }
    }
  }
  throw lastErr;
}

function fetchTextOnce(url, maxRedirects = 6) {
  return new Promise((resolve, reject) => {
    const request = (targetUrl, redirectsLeft) => {
      const parsed = new URL(targetUrl);
      const getter = parsed.protocol === 'https:' ? https : http;
      const req = getter.get(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          timeout: 20000,
          headers: {
            'User-Agent': 'LaraTool-Builder/1.0 (+https://github.com/compao/LaraTool)',
            Accept: 'application/json, text/html, */*'
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) {
              return reject(new Error(`Too many redirects for ${url}`));
            }
            return request(new URL(res.headers.location, targetUrl).href, redirectsLeft - 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`HTTP ${res.statusCode} fetching ${targetUrl}`));
          }
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('error', reject);
          res.on('end', () => resolve(body));
        }
      );
      req.on('timeout', () => req.destroy(new Error(`Timeout fetching ${targetUrl}`)));
      req.on('error', reject);
    };
    request(url, maxRedirects);
  });
}

function fetchText(url, maxRedirects = 6) {
  return withRetry(() => fetchTextOnce(url, maxRedirects), `GET ${url}`);
}

async function fetchJson(url) {
  const raw = await fetchText(url);
  return JSON.parse(raw);
}

function downloadFileOnce(url, destPath, maxRedirects = 8) {
  return new Promise((resolve, reject) => {
    ensureDir(path.dirname(destPath));
    const tmpPath = `${destPath}.part`;
    let file = null;
    let settled = false;

    const cleanup = () => {
      try {
        if (file && !file.destroyed) file.destroy();
      } catch {}
      try {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
      } catch {}
    };

    const fail = (err) => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(err);
    };

    const request = (targetUrl, redirectsLeft) => {
      const parsed = new URL(targetUrl);
      const getter = parsed.protocol === 'https:' ? https : http;
      const req = getter.get(
        {
          protocol: parsed.protocol,
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname + parsed.search,
          timeout: 120000,
          headers: {
            'User-Agent': 'LaraTool-Builder/1.0 (+https://github.com/compao/LaraTool)'
          }
        },
        (res) => {
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            res.resume();
            if (redirectsLeft <= 0) {
              return fail(new Error(`Too many redirects for ${url}`));
            }
            return request(new URL(res.headers.location, targetUrl).href, redirectsLeft - 1);
          }
          if (res.statusCode !== 200) {
            res.resume();
            return fail(new Error(`HTTP ${res.statusCode} downloading ${targetUrl}`));
          }

          const totalBytes = parseInt(res.headers['content-length'] || '0', 10);
          let downloaded = 0;
          file = fs.createWriteStream(tmpPath);

          res.on('data', (chunk) => {
            downloaded += chunk.length;
          });

          res.on('error', fail);
          res.pipe(file);

          file.on('error', fail);

          file.on('finish', () => {
            file.close(() => {
              if (settled) return;
              if (totalBytes > 0 && downloaded < totalBytes) {
                return fail(new Error(`Incomplete download (${downloaded}/${totalBytes}) for ${url}`));
              }
              try {
                if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
                fs.renameSync(tmpPath, destPath);
                settled = true;
                resolve();
              } catch (err) {
                fail(err);
              }
            });
          });
        }
      );

      req.on('timeout', () => {
        req.destroy(new Error(`Timeout downloading ${targetUrl}`));
      });
      req.on('error', fail);
    };

    request(url, maxRedirects);
  });
}

function downloadFile(url, destPath, maxRedirects = 8) {
  return withRetry(() => downloadFileOnce(url, destPath, maxRedirects), `Download ${path.basename(destPath)}`);
}

function extractZip(zipPath, targetDir) {
  ensureDir(targetDir);
  if (process.platform === 'win32') {
    try {
      execFileSync('tar.exe', ['-xf', zipPath, '-C', targetDir], { stdio: 'ignore', windowsHide: true });
      return;
    } catch {}
  }
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(targetDir, true);
}

function readManifest() {
  try {
    if (fs.existsSync(MANIFEST_PATH)) {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    }
  } catch {}
  return {};
}

function saveManifestPatch(patch) {
  const current = readManifest();
  const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

async function resolveLatestNginx() {
  const fallbackVersion = '1.26.2';
  try {
    const html = await fetchText('https://nginx.org/en/download.html');
    const matches = [...html.matchAll(/\/download\/nginx-(\d+\.\d+\.\d+)\.zip/g)].map((m) => m[1]);
    if (matches.length > 0) {
      matches.sort((a, b) => compareVersions(b, a));
      return {
        version: matches[0],
        url: `https://nginx.org/download/nginx-${matches[0]}.zip`
      };
    }
  } catch (err) {
    console.warn(`[preinstall] Warning resolving latest Nginx (${err.message}), falling back to ${fallbackVersion}`);
  }
  return {
    version: fallbackVersion,
    url: `https://nginx.org/download/nginx-${fallbackVersion}.zip`
  };
}

async function resolveLatestPhp() {
  const releases = await fetchJson('https://windows.php.net/downloads/releases/releases.json');
  const candidates = [];
  for (const [branch, entry] of Object.entries(releases || {})) {
    if (!entry || typeof entry !== 'object') continue;
    const ntsKey = Object.keys(entry).find((k) => /^nts-.*-x64$/i.test(k));
    const zipPath = ntsKey && entry[ntsKey]?.zip?.path;
    const rawVersion = entry.version;
    if (!zipPath || !rawVersion) continue;
    candidates.push({
      branch,
      numeric: parseFloat(branch) || 0,
      version: String(rawVersion).split('-')[0],
      release: String(rawVersion),
      url: `https://windows.php.net/downloads/releases/${zipPath}`,
      fallbackUrl: `https://windows.php.net/downloads/releases/archives/${zipPath}`
    });
  }
  if (candidates.length === 0) {
    throw new Error('Could not resolve any PHP x64 NTS release from windows.php.net');
  }
  candidates.sort((a, b) => b.numeric - a.numeric || compareVersions(b.version, a.version));
  return candidates[0];
}

async function resolveLatestNodeLts() {
  const index = await fetchJson('https://nodejs.org/dist/index.json');
  if (!Array.isArray(index)) {
    throw new Error('Unexpected response from nodejs.org/dist/index.json');
  }
  const ltsEntry = index.find(
    (entry) => entry && entry.lts && entry.version && Array.isArray(entry.files) && entry.files.includes('win-x64-zip')
  );
  if (!ltsEntry) {
    throw new Error('Could not resolve latest Node.js LTS win-x64 release');
  }
  const majorMatch = String(ltsEntry.version).match(/^v(\d+)\./);
  const major = majorMatch ? majorMatch[1] : '22';
  return {
    major,
    version: ltsEntry.version,
    npmVersion: ltsEntry.npm || null,
    archiveFolder: `node-${ltsEntry.version}-win-x64`,
    url: `https://nodejs.org/dist/${ltsEntry.version}/node-${ltsEntry.version}-win-x64.zip`
  };
}

async function resolveLatestMkcert() {
  const fallback = {
    version: 'v1.4.4',
    url: 'https://github.com/FiloSottile/mkcert/releases/download/v1.4.4/mkcert-v1.4.4-windows-amd64.exe'
  };
  try {
    const rel = await fetchJson('https://api.github.com/repos/FiloSottile/mkcert/releases/latest');
    const asset = (rel.assets || []).find((a) => /mkcert-.*-windows-amd64\.exe$/i.test(a.name || ''));
    if (asset && asset.browser_download_url) {
      return {
        version: rel.tag_name || fallback.version,
        url: asset.browser_download_url
      };
    }
  } catch (err) {
    console.warn(`[preinstall] Warning resolving latest mkcert (${err.message}), falling back to ${fallback.version}`);
  }
  return fallback;
}

async function prepareNginx(prevManifest) {
  const { version, url } = await resolveLatestNginx();
  const targetDir = path.join(NGINX_DIR, `nginx-${version}`);
  const nginxExe = path.join(targetDir, 'nginx.exe');

  if (!FORCE && fs.existsSync(nginxExe)) {
    console.log(`[preinstall] Nginx ${version} already prepared.`);
    return { nginxVersion: version };
  }

  console.log(`[preinstall] Downloading Nginx ${version}...`);
  fs.rmSync(NGINX_DIR, { recursive: true, force: true });
  ensureDir(NGINX_DIR);
  const zipPath = path.join(TEMP_DIR, `nginx-${version}.zip`);
  await downloadFile(url, zipPath);
  extractZip(zipPath, NGINX_DIR);
  if (!fs.existsSync(nginxExe)) {
    throw new Error(`Nginx extraction failed: missing ${nginxExe}`);
  }
  return { nginxVersion: version };
}

async function preparePhp(prevManifest) {
  const php = await resolveLatestPhp();
  const targetDir = path.join(PHP_DIR, `php-${php.branch}`);
  const phpExe = path.join(targetDir, 'php.exe');
  const phpCgiExe = path.join(targetDir, 'php-cgi.exe');

  if (
    !FORCE &&
    fs.existsSync(phpExe) &&
    fs.existsSync(phpCgiExe) &&
    prevManifest.phpBranch === php.branch &&
    prevManifest.phpRelease === php.release
  ) {
    console.log(`[preinstall] PHP ${php.branch} (${php.release}) already prepared.`);
    return {
      phpBranch: php.branch,
      phpVersion: php.version,
      phpRelease: php.release
    };
  }

  console.log(`[preinstall] Downloading PHP ${php.branch} (${php.release})...`);
  fs.rmSync(PHP_DIR, { recursive: true, force: true });
  ensureDir(targetDir);
  const zipPath = path.join(TEMP_DIR, `php-${php.branch}.zip`);
  try {
    await downloadFile(php.url, zipPath);
  } catch (err) {
    console.warn(`[preinstall] Primary PHP URL failed (${err.message}), trying archive URL...`);
    await downloadFile(php.fallbackUrl, zipPath);
  }
  extractZip(zipPath, targetDir);
  if (!fs.existsSync(phpExe) || !fs.existsSync(phpCgiExe)) {
    throw new Error(`PHP extraction failed: missing php.exe or php-cgi.exe in ${targetDir}`);
  }

  fs.writeFileSync(
    path.join(targetDir, '.laratool-release.json'),
    JSON.stringify({ release: php.release, updatedAt: new Date().toISOString() }, null, 2),
    'utf-8'
  );

  return {
    phpBranch: php.branch,
    phpVersion: php.version,
    phpRelease: php.release
  };
}

async function prepareNode(prevManifest) {
  const node = await resolveLatestNodeLts();
  const targetDir = path.join(NODE_DIR, `node-${node.major}`);
  const nodeExe = path.join(targetDir, 'node.exe');

  if (
    !FORCE &&
    fs.existsSync(nodeExe) &&
    prevManifest.nodeMajor === node.major &&
    prevManifest.nodeVersion === node.version
  ) {
    console.log(`[preinstall] Node.js ${node.major} LTS (${node.version}) already prepared.`);
    return {
      nodeMajor: node.major,
      nodeVersion: node.version,
      npmVersion: node.npmVersion
    };
  }

  console.log(`[preinstall] Downloading Node.js ${node.major} LTS (${node.version})...`);
  fs.rmSync(NODE_DIR, { recursive: true, force: true });
  ensureDir(NODE_DIR);
  const zipPath = path.join(TEMP_DIR, `node-${node.version}.zip`);
  const extractDir = path.join(TEMP_DIR, `node-extract-${node.version}`);
  fs.rmSync(extractDir, { recursive: true, force: true });
  await downloadFile(node.url, zipPath);
  extractZip(zipPath, extractDir);

  let sourceDir = path.join(extractDir, node.archiveFolder);
  if (!fs.existsSync(sourceDir)) {
    const entries = fs.readdirSync(extractDir).filter((e) => fs.statSync(path.join(extractDir, e)).isDirectory());
    if (entries.length > 0) {
      sourceDir = path.join(extractDir, entries[0]);
    }
  }
  fs.renameSync(sourceDir, targetDir);
  if (!fs.existsSync(nodeExe)) {
    throw new Error(`Node.js extraction failed: missing ${nodeExe}`);
  }

  return {
    nodeMajor: node.major,
    nodeVersion: node.version,
    npmVersion: node.npmVersion
  };
}

async function prepareBinaries(prevManifest) {
  ensureDir(BIN_DIR);

  // 1. Composer
  const composerDest = path.join(BIN_DIR, 'composer.phar');
  if (FORCE || !fs.existsSync(composerDest)) {
    console.log('[preinstall] Downloading Composer (stable)...');
    await downloadFile('https://getcomposer.org/composer-stable.phar', composerDest);
  } else {
    console.log('[preinstall] Composer already prepared.');
  }

  // 2. mkcert
  const mkcert = await resolveLatestMkcert();
  const mkcertDest = path.join(BIN_DIR, 'mkcert.exe');
  if (FORCE || !fs.existsSync(mkcertDest) || prevManifest.mkcertVersion !== mkcert.version) {
    console.log(`[preinstall] Downloading mkcert ${mkcert.version}...`);
    await downloadFile(mkcert.url, mkcertDest);
  } else {
    console.log(`[preinstall] mkcert ${mkcert.version} already prepared.`);
  }

  // 3. Ngrok
  const ngrokDest = path.join(BIN_DIR, 'ngrok.exe');
  if (FORCE || !fs.existsSync(ngrokDest)) {
    console.log('[preinstall] Downloading Ngrok (v3 stable)...');
    const ngrokZip = path.join(TEMP_DIR, 'ngrok.zip');
    await downloadFile('https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip', ngrokZip);
    extractZip(ngrokZip, BIN_DIR);
    if (!fs.existsSync(ngrokDest)) {
      throw new Error(`Ngrok extraction failed: missing ${ngrokDest}`);
    }
  } else {
    console.log('[preinstall] Ngrok already prepared.');
  }

  // 4. Cloudflared
  const cloudflaredDest = path.join(BIN_DIR, 'cloudflared.exe');
  if (FORCE || !fs.existsSync(cloudflaredDest)) {
    console.log('[preinstall] Downloading Cloudflared (latest)...');
    await downloadFile(
      'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe',
      cloudflaredDest
    );
  } else {
    console.log('[preinstall] Cloudflared already prepared.');
  }

  return {
    mkcertVersion: mkcert.version,
    binaries: ['composer.phar', 'mkcert.exe', 'ngrok.exe', 'cloudflared.exe']
  };
}

async function main() {
  console.log('[preinstall] Preparing latest minimal tools for LaraTool bundle...');
  ensureDir(OUT_DIR);
  ensureDir(TEMP_DIR);

  const prevManifest = readManifest();
  try {
    const nginxMeta = await prepareNginx(prevManifest);
    saveManifestPatch(nginxMeta);

    const phpMeta = await preparePhp(prevManifest);
    saveManifestPatch(phpMeta);

    const nodeMeta = await prepareNode(prevManifest);
    saveManifestPatch(nodeMeta);

    const binMeta = await prepareBinaries(prevManifest);
    const manifest = saveManifestPatch({
      ...binMeta,
      createdAt: prevManifest.createdAt || new Date().toISOString()
    });

    console.log('[preinstall] Bundle ready:', JSON.stringify(manifest, null, 2));
  } finally {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}

main().catch((err) => {
  console.error('[preinstall] Failed:', err);
  process.exit(1);
});
