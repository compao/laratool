const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const systemHelper = require('./SystemHelper');

class HostsManager {
  constructor() {
    this.hostsPath = 'C:\\Windows\\System32\\drivers\\etc\\hosts';
    this.header = '# LaraTool generated Hosts. Do not change.';
    this.footer = '# End LaraTool generated Hosts';
  }

  escapeRegex(str) {
    return str.replace(/[\^$\\.*+?()[\]{}|]/g, '\\$&');
  }

  /**
   * Check if a domain is configured in the hosts file
   */
  isConfigured(domain) {
    if (!domain || typeof domain !== 'string') return false;
    const cleanDomain = domain.trim().toLowerCase();
    if (!cleanDomain) return false;

    try {
      if (!fs.existsSync(this.hostsPath)) return false;
      const content = fs.readFileSync(this.hostsPath, 'utf-8');
      const escaped = this.escapeRegex(cleanDomain);
      // Matches 127.0.0.1 or ::1 line having cleanDomain as an exact token
      const regex = new RegExp(`^\\s*(?:127\\.0\\.0\\.1|::1)\\s+(?:.*?\\s+)?${escaped}(?:\\s|$)`, 'im');
      return regex.test(content);
    } catch {
      return false;
    }
  }

  /**
   * Extract all domain names currently present in the LaraTool block
   */
  getDomainsFromBlock(content) {
    if (!content || !content.includes(this.header)) return [];

    const startIdx = content.indexOf(this.header);
    const endIdx = content.indexOf(this.footer, startIdx);
    if (startIdx === -1 || endIdx === -1) return [];

    const block = content.substring(startIdx + this.header.length, endIdx);
    const lines = block.split(/\r?\n/);
    const domains = new Set();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const parts = trimmed.split(/\s+/);
      if (parts.length > 1 && (parts[0] === '127.0.0.1' || parts[0] === '::1')) {
        for (let i = 1; i < parts.length; i++) {
          const d = parts[i].trim().toLowerCase();
          if (!d) continue;
          if (d.startsWith('www.')) {
            domains.add(d.slice(4));
          } else {
            domains.add(d);
          }
        }
      }
    }
    return Array.from(domains);
  }

  /**
   * Build updated content containing all target domains in the LaraTool block
   */
  buildUpdatedContent(originalContent, allDomains) {
    const uniqueDomains = Array.from(
      new Set(allDomains.map(d => (typeof d === 'string' ? d.trim().toLowerCase() : '')).filter(Boolean))
    ).sort();

    const regex = new RegExp(
      `(?:\\r?\\n)*${this.escapeRegex(this.header)}[\\s\\S]*?${this.escapeRegex(this.footer)}(?:\\r?\\n)*`,
      'm'
    );

    if (uniqueDomains.length === 0) {
      if (originalContent.includes(this.header)) {
        return originalContent.replace(regex, '\r\n\r\n').trimEnd() + '\r\n';
      }
      return originalContent;
    }

    const lines = uniqueDomains.map(d => `127.0.0.1 ${d} www.${d}`).join('\r\n');
    const newBlock = `${this.header}\r\n${lines}\r\n${this.footer}`;

    if (originalContent.includes(this.header)) {
      return originalContent.replace(regex, `\r\n\r\n${newBlock}\r\n`);
    } else {
      return `${originalContent.trimEnd()}\r\n\r\n${newBlock}\r\n`;
    }
  }

  /**
   * Write new content to hosts file (direct or elevated)
   */
  async writeHosts(newContent, testDomain = null) {
    // 1. First attempt: Direct write
    try {
      fs.writeFileSync(this.hostsPath, newContent, 'utf-8');
      exec('ipconfig /flushdns');
      return { success: true, method: 'direct' };
    } catch (err) {
      // Direct write failed, proceed to UAC elevation
    }

    // 2. Second attempt: Write via temporary file + elevated PowerShell Copy-Item
    const tempHosts = path.join(systemHelper.rootDir, 'hosts.tmp');

    try {
      fs.writeFileSync(tempHosts, newContent, 'utf-8');

      const escapedTemp = tempHosts.replace(/'/g, "''");
      const escapedDest = this.hostsPath.replace(/'/g, "''");

      // Use PowerShell Start-Process with -Verb RunAs and -Wait to synchronously hold until the elevated process exits
      const psCommand = `Start-Process powershell -Verb RunAs -Wait -ArgumentList '-NoProfile -ExecutionPolicy Bypass -Command "Copy-Item -Path ''${escapedTemp}'' -Destination ''${escapedDest}'' -Force; ipconfig /flushdns"'`;

      return new Promise((resolve) => {
        exec(`powershell.exe -NoProfile -Command "${psCommand}"`, () => {
          try {
            if (fs.existsSync(tempHosts)) fs.unlinkSync(tempHosts);
          } catch {}

          const isOk = testDomain ? this.isConfigured(testDomain) : true;
          if (isOk) {
            resolve({ success: true, method: 'uac' });
          } else {
            resolve({
              success: false,
              requiresAdmin: true,
              command: `icacls "${this.hostsPath}" /grant "*S-1-5-32-545:M"`,
              message: 'Privilèges administrateur requis pour modifier le fichier hosts.'
            });
          }
        });
      });
    } catch (err) {
      try {
        if (fs.existsSync(tempHosts)) fs.unlinkSync(tempHosts);
      } catch {}
      return { success: false, error: err.message };
    }
  }

  /**
   * Synchronize domains to hosts, preserving all existing LaraTool domains
   */
  async syncAll(domains) {
    if (!domains) domains = [];
    if (!Array.isArray(domains)) domains = [domains];

    const cleanInputDomains = domains
      .map(d => (typeof d === 'string' ? d.trim().toLowerCase() : ''))
      .filter(Boolean);

    let originalContent = '';
    try {
      if (fs.existsSync(this.hostsPath)) {
        originalContent = fs.readFileSync(this.hostsPath, 'utf-8');
      }
    } catch (e) {
      return { success: false, error: 'Impossible de lire le fichier hosts' };
    }

    // Get domains currently configured in the LaraTool block
    const existingInBlock = this.getDomainsFromBlock(originalContent);

    // Merge: PRESERVE all existing domains in LaraTool block + ADD all newly requested domains
    const allDomains = Array.from(new Set([...existingInBlock, ...cleanInputDomains]));

    if (allDomains.length === 0) {
      return { success: true, message: 'Aucun domaine à synchroniser' };
    }

    // Check if any requested domain is missing from the entire hosts file
    const missingDomains = cleanInputDomains.filter(d => !this.isConfigured(d));

    // If no requested domains are missing AND the LaraTool block already has all domains
    if (missingDomains.length === 0 && cleanInputDomains.every(d => existingInBlock.includes(d))) {
      return { success: true, message: 'Tous les domaines sont déjà configurés', synced: [] };
    }

    const newContent = this.buildUpdatedContent(originalContent, allDomains);
    const testDomain = missingDomains[0] || cleanInputDomains[0] || allDomains[0];
    const writeResult = await this.writeHosts(newContent, testDomain);

    if (writeResult.success) {
      return {
        success: true,
        method: writeResult.method,
        synced: cleanInputDomains
      };
    }
    return writeResult;
  }

  /**
   * Add a single domain, preserving all existing domains
   */
  async addDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return { success: false, error: 'Nom de domaine invalide' };
    }
    return this.syncAll([domain]);
  }

  /**
   * Remove a domain from the LaraTool block
   */
  async removeDomain(domain) {
    if (!domain || typeof domain !== 'string') {
      return { success: false, error: 'Nom de domaine invalide' };
    }
    const target = domain.trim().toLowerCase();
    let originalContent = '';
    try {
      if (fs.existsSync(this.hostsPath)) {
        originalContent = fs.readFileSync(this.hostsPath, 'utf-8');
      }
    } catch (e) {
      return { success: false, error: 'Impossible de lire le fichier hosts' };
    }

    const existingInBlock = this.getDomainsFromBlock(originalContent);
    const remainingDomains = existingInBlock.filter(d => d !== target);

    const newContent = this.buildUpdatedContent(originalContent, remainingDomains);
    return this.writeHosts(newContent);
  }
}

module.exports = new HostsManager();
