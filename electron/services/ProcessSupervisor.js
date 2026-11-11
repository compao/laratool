const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const systemHelper = require('./SystemHelper');

class ProcessSupervisor {
  constructor() {
    this.processes = new Map(); // key -> { pid, child, logStream, status, stopping }
  }

  /**
   * Persist active PIDs to disk to detect/kill orphans on next startup
   */
  savePidRegistry() {
    const pids = {};
    for (const [name, rec] of this.processes.entries()) {
      if (rec.pid && rec.status === 'running') {
        pids[name] = rec.pid;
      }
    }
    const pidFile = path.join(systemHelper.rootDir, 'pids.json');
    try {
      fs.writeFileSync(pidFile, JSON.stringify(pids, null, 2), 'utf-8');
    } catch (e) {}
  }

  /**
   * Cleanup orphaned processes from a previous crash or abnormal exit
   */
  async cleanupOrphanedPids() {
    const pidFile = path.join(systemHelper.rootDir, 'pids.json');
    if (!fs.existsSync(pidFile)) return;
    try {
      const pids = JSON.parse(fs.readFileSync(pidFile, 'utf-8'));
      for (const [name, pid] of Object.entries(pids)) {
        try {
          process.kill(pid, 0); // verify if PID is still alive
          await new Promise((resolve) => {
            exec(`taskkill /pid ${pid} /f /t`, () => resolve());
          });
        } catch (e) {}
      }
      if (fs.existsSync(pidFile)) {
        fs.unlinkSync(pidFile);
      }
    } catch (e) {}
  }

  /**
   * Safely write a line to a process log stream without throwing if ended/destroyed
   */
  safeWrite(logStream, message) {
    if (!logStream || logStream.destroyed || logStream.writableEnded || !logStream.writable) {
      return;
    }
    try {
      logStream.write(message);
    } catch (_) {}
  }

  /**
   * Safely close a process log stream once
   */
  safeEnd(logStream) {
    if (!logStream || logStream.destroyed || logStream.writableEnded) {
      return;
    }
    try {
      logStream.end();
    } catch (_) {}
  }

  /**
   * Start a managed child process quietly
   */
  start(name, command, args = [], options = {}) {
    if (this.processes.has(name)) {
      const existing = this.processes.get(name);
      if (existing.status === 'running') {
        return existing;
      }
    }

    const logFile = path.join(systemHelper.logsDir, `${name}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });
    logStream.on('error', () => {});

    const spawnOptions = {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    };

    let child;
    try {
      child = spawn(command, args, spawnOptions);
    } catch (err) {
      this.safeWrite(logStream, `[${new Date().toISOString()}] Spawn Error: ${err.message}\n`);
      this.safeEnd(logStream);
      throw new Error(`Impossible de démarrer ${name} : ${err.message}`);
    }

    if (child.stdout) {
      child.stdout.pipe(logStream, { end: false });
    }
    if (child.stderr) {
      child.stderr.pipe(logStream, { end: false });
    }

    const record = {
      name,
      pid: child.pid,
      command,
      args,
      options,
      child,
      logStream,
      status: 'running',
      stopping: false,
      startedAt: new Date().toISOString()
    };

    child.on('error', (err) => {
      record.status = 'error';
      record.error = err.message;
      this.safeWrite(logStream, `[${new Date().toISOString()}] Process Error: ${err.message}\n`);
      this.savePidRegistry();
    });

    child.on('exit', (code, signal) => {
      record.status = 'stopped';
      record.exitCode = code;
      this.safeWrite(logStream, `[${new Date().toISOString()}] Process Exited with code ${code}, signal ${signal}\n`);

      if (options.autoRestart && !record.stopping) {
        this.safeWrite(logStream, `[${new Date().toISOString()}] Auto-restarting worker: ${name}\n`);
        this.safeEnd(logStream);
        setTimeout(() => {
          if (!record.stopping) {
            try {
              this.start(name, command, args, options);
            } catch (restartErr) {
              // New log stream will be created on next start
            }
          }
        }, 500);
      } else {
        this.safeEnd(logStream);
        this.processes.delete(name);
        this.savePidRegistry();
      }
    });

    this.processes.set(name, record);
    this.savePidRegistry();
    return record;
  }

  /**
   * Stop a managed child process using Windows taskkill
   */
  stop(name) {
    return new Promise((resolve) => {
      const record = this.processes.get(name);
      if (!record || !record.pid) {
        return resolve(true);
      }

      record.stopping = true;
      exec(`taskkill /pid ${record.pid} /f /t`, () => {
        this.safeEnd(record.logStream);
        this.processes.delete(name);
        this.savePidRegistry();
        resolve(true);
      });
    });
  }

  /**
   * Check if a service is actively running
   */
  isRunning(name) {
    const record = this.processes.get(name);
    return !!(record && record.status === 'running');
  }

  /**
   * Stop all active managed processes on shutdown
   */
  async stopAll() {
    const names = Array.from(this.processes.keys());
    for (const name of names) {
      await this.stop(name);
    }
  }

  /**
   * Read the latest log lines for a service
   */
  getLogs(name, maxLines = 50) {
    const logFile = path.join(systemHelper.logsDir, `${name}.log`);
    if (!fs.existsSync(logFile)) return [];
    try {
      const content = fs.readFileSync(logFile, 'utf-8');
      const lines = content.trim().split('\n');
      return lines.slice(-maxLines);
    } catch {
      return [];
    }
  }

  /**
   * Get runtime information of a managed process
   */
  getProcessInfo(name) {
    const record = this.processes.get(name);
    if (!record) return null;
    return {
      pid: record.pid,
      status: record.status,
      startedAt: record.startedAt,
      command: record.command,
      args: record.args
    };
  }
}

module.exports = new ProcessSupervisor();
