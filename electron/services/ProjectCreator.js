const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const systemHelper = require('./SystemHelper');
const nginxManager = require('./NginxManager');
const certificateManager = require('./CertificateManager');
const hostsManager = require('./HostsManager');
const serviceManager = require('./ServiceManager');
const projectScanner = require('./ProjectScanner');
const phpManager = require('./PhpManager');

class ProjectCreator {
  /**
   * Validate project name and target path
   */
  validate(name, targetParkedPath = null) {
    if (!name || typeof name !== 'string') {
      return { valid: false, error: 'Le nom du projet est requis' };
    }

    const cleanName = name.trim().toLowerCase();
    if (!/^[a-z0-9-_]+$/.test(cleanName)) {
      return { valid: false, error: 'Le nom ne doit contenir que des lettres, chiffres, tirets et underscores' };
    }

    const config = systemHelper.getConfig();
    const parkedPaths = config.parkedPaths || [];
    const parkedPath = targetParkedPath || parkedPaths[0];

    if (!parkedPath || !fs.existsSync(parkedPath)) {
      return { valid: false, error: 'Dossier de destination (parked path) introuvable' };
    }

    const projectPath = path.join(parkedPath, cleanName);
    if (fs.existsSync(projectPath)) {
      return { valid: false, error: `Le dossier "${cleanName}" existe déjà dans ${parkedPath}` };
    }

    const tld = config.tld || 'test';
    const domain = `${cleanName}.${tld}`;
    return {
      valid: true,
      name: cleanName,
      domain,
      projectPath,
      parkedPath
    };
  }

  /**
   * Execute a command with real-time streaming output
   */
  runCommand(cmd, args, cwd, env, onOutput) {
    return new Promise((resolve, reject) => {
      onOutput(`\n> [${cwd}] ${cmd} ${args.join(' ')}\n`);

      const child = spawn(cmd, args, {
        cwd,
        env,
        shell: true,
        windowsHide: true
      });

      child.stdout.on('data', (data) => {
        const str = data.toString();
        onOutput(str);
      });

      child.stderr.on('data', (data) => {
        const str = data.toString();
        onOutput(str);
      });

      child.on('error', (err) => {
        onOutput(`\n[ERREUR] ${err.message}\n`);
        reject(err);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`La commande s'est terminée avec le code de sortie ${code}`));
        }
      });
    });
  }

  /**
   * Helper to update key=value pairs in a .env file
   */
  updateEnvFile(envPath, updates) {
    if (!fs.existsSync(envPath)) return;
    let content = fs.readFileSync(envPath, 'utf-8');

    for (const [key, val] of Object.entries(updates)) {
      const regex = new RegExp(`^#?\\s*${key}=.*$`, 'm');
      const formattedVal = (typeof val === 'string' && (val.includes(' ') || val.includes('#'))) ? `"${val}"` : val;
      if (regex.test(content)) {
        content = content.replace(regex, `${key}=${formattedVal}`);
      } else {
        content += `\n${key}=${formattedVal}`;
      }
    }

    fs.writeFileSync(envPath, content, 'utf-8');
  }

  /**
   * Main project scaffolding workflow
   */
  async createProject(options, onProgress = () => {}) {
    const {
      name,
      parkedPath,
      laravelVersion = '13',
      phpVersion = '8.4',
      nodeVersion = '22',
      databaseType = 'sqlite',
      databaseName = null,
      starterKit = 'none',
      packages = [],
      devPackages = [],
      initGit = true,
      enableSsl = true,
      addToHosts = true,
      runMigrations = true,
      runSeeders = false
    } = options;

    const validation = this.validate(name, parkedPath);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const { projectPath, domain } = validation;
    const cleanDbName = (databaseName || name).replace(/[^a-zA-Z0-9_]/g, '_');

    // Build PATH including chosen PHP version, Node, and LaraTool bin
    const targetPhpDir = path.join(systemHelper.phpDir, `php-${phpVersion}`);
    const targetNodeDir = path.join(systemHelper.nodeDir, `node-${nodeVersion}`);
    const pathDirs = [];
    if (fs.existsSync(targetPhpDir)) pathDirs.push(targetPhpDir);
    if (fs.existsSync(targetNodeDir)) pathDirs.push(targetNodeDir);
    pathDirs.push(systemHelper.binDir);

    const execEnv = {
      ...process.env,
      PATH: pathDirs.join(';') + ';' + (process.env.PATH || ''),
      COMPOSER_NO_INTERACTION: '1'
    };

    let totalSteps = 6;
    if (starterKit !== 'none') totalSteps++;
    if (packages.length > 0 || devPackages.length > 0) totalSteps++;
    if (runSeeders) totalSteps++;

    let currentStep = 1;

    const reportStep = (title, output = '') => {
      onProgress({
        step: currentStep++,
        totalSteps,
        title,
        output
      });
    };

    try {
      // -------------------------------------------------------------
      // Étape 1 : Création du squelette Laravel via Composer
      // -------------------------------------------------------------
      let pkgSpec = 'laravel/laravel';
      if (laravelVersion === '13') {
        pkgSpec = 'laravel/laravel:^13.0';
      } else if (laravelVersion === '12') {
        pkgSpec = 'laravel/laravel:^12.0';
      } else if (laravelVersion === '11') {
        pkgSpec = 'laravel/laravel:^11.0';
      } else if (laravelVersion === '10') {
        pkgSpec = 'laravel/laravel:^10.0';
      } else if (laravelVersion === 'master') {
        pkgSpec = 'laravel/laravel:dev-master';
      }

      reportStep(`Installation de Laravel ${laravelVersion} dans ${name}...`, `> Création du projet via Composer (${pkgSpec})...\n`);
      await this.runCommand(
        'composer',
        ['create-project', pkgSpec, `"${name}"`, '--prefer-dist', '--no-interaction'],
        validation.parkedPath,
        execEnv,
        (out) => onProgress({ output: out })
      );

      // Verify created project directory
      if (!fs.existsSync(projectPath)) {
        throw new Error("Le dossier du projet n'a pas été créé par Composer.");
      }

      // -------------------------------------------------------------
      // Étape 2 : Configuration de la Base de données et du fichier .env
      // -------------------------------------------------------------
      reportStep(`Configuration de l'environnement (.env & ${databaseType.toUpperCase()})...`);
      const envPath = path.join(projectPath, '.env');
      const envUpdates = {
        APP_NAME: `"${name}"`,
        APP_URL: `${enableSsl ? 'https' : 'http'}://${domain}`
      };

      if (databaseType === 'sqlite') {
        const sqliteDir = path.join(projectPath, 'database');
        if (!fs.existsSync(sqliteDir)) {
          fs.mkdirSync(sqliteDir, { recursive: true });
        }
        const sqliteFile = path.join(sqliteDir, 'database.sqlite');
        if (!fs.existsSync(sqliteFile)) {
          fs.writeFileSync(sqliteFile, '', 'utf-8');
        }

        envUpdates.DB_CONNECTION = 'sqlite';
        envUpdates.DB_DATABASE = 'database/database.sqlite';
        envUpdates.DB_HOST = '127.0.0.1';
        envUpdates.DB_PORT = '3306';
        envUpdates.DB_USERNAME = 'root';
        envUpdates.DB_PASSWORD = '';
      } else if (databaseType === 'mysql' || databaseType === 'mariadb') {
        const mysqlPort = serviceManager.getPort('mysql') || 3306;
        envUpdates.DB_CONNECTION = databaseType;
        envUpdates.DB_HOST = '127.0.0.1';
        envUpdates.DB_PORT = String(mysqlPort);
        envUpdates.DB_DATABASE = cleanDbName;
        envUpdates.DB_USERNAME = 'root';
        envUpdates.DB_PASSWORD = '';

        // Auto-create database if MySQL service is installed
        try {
          onProgress({ output: `> Création de la base de données MySQL « ${cleanDbName} »...\n` });
          await serviceManager.createDatabase('mysql', cleanDbName);
          onProgress({ output: `✓ Base de données MySQL « ${cleanDbName} » prête.\n` });
        } catch (dbErr) {
          onProgress({ output: `[Alerte Base de Données] ${dbErr.message}\n` });
        }
      } else if (databaseType === 'pgsql') {
        const pgPort = serviceManager.getPort('postgres') || 5432;
        envUpdates.DB_CONNECTION = 'pgsql';
        envUpdates.DB_HOST = '127.0.0.1';
        envUpdates.DB_PORT = String(pgPort);
        envUpdates.DB_DATABASE = cleanDbName;
        envUpdates.DB_USERNAME = 'postgres';
        envUpdates.DB_PASSWORD = '';

        try {
          onProgress({ output: `> Création de la base de données PostgreSQL « ${cleanDbName} »...\n` });
          await serviceManager.createDatabase('postgres', cleanDbName);
          onProgress({ output: `✓ Base de données PostgreSQL « ${cleanDbName} » prête.\n` });
        } catch (dbErr) {
          onProgress({ output: `[Alerte Base de Données] ${dbErr.message}\n` });
        }
      }

      this.updateEnvFile(envPath, envUpdates);

      // Save .laratool.json
      const laratoolConfig = {
        laravelVersion,
        phpVersion,
        nodeVersion,
        ssl: enableSsl,
        createdAt: new Date().toISOString()
      };
      fs.writeFileSync(path.join(projectPath, '.laratool.json'), JSON.stringify(laratoolConfig, null, 2), 'utf-8');

      // -------------------------------------------------------------
      // Étape 3 (Optionnelle) : Installation du Starter Kit
      // -------------------------------------------------------------
      if (starterKit.startsWith('breeze-')) {
        reportStep(`Installation de Laravel Breeze (${starterKit})...`);
        onProgress({ output: `> Installation du package laravel/breeze...\n` });

        await this.runCommand(
          'composer',
          ['require', 'laravel/breeze', '--dev', '--no-interaction'],
          projectPath,
          execEnv,
          (out) => onProgress({ output: out })
        );

        let breezeStack = 'blade';
        if (starterKit === 'breeze-vue') breezeStack = 'vue';
        else if (starterKit === 'breeze-react') breezeStack = 'react';
        else if (starterKit === 'breeze-api') breezeStack = 'api';

        onProgress({ output: `> Configuration du kit Breeze (${breezeStack})...\n` });
        await this.runCommand(
          'php',
          ['artisan', 'breeze:install', breezeStack, '--no-interaction'],
          projectPath,
          execEnv,
          (out) => onProgress({ output: out })
        );

        if (breezeStack !== 'api') {
          onProgress({ output: `> Compilation des assets front-end (npm install & build)...\n` });
          try {
            await this.runCommand(
              'npm',
              ['install'],
              projectPath,
              execEnv,
              (out) => onProgress({ output: out })
            );
            await this.runCommand(
              'npm',
              ['run', 'build'],
              projectPath,
              execEnv,
              (out) => onProgress({ output: out })
            );
          } catch (npmErr) {
            onProgress({ output: `[Alerte NPM] ${npmErr.message}\n(Vous pourrez relancer npm install plus tard)\n` });
          }
        }
      } else if (starterKit === 'filament') {
        reportStep('Installation du panneau d\'administration Filament v3...');
        onProgress({ output: `> Installation de filament/filament...\n` });
        await this.runCommand(
          'composer',
          ['require', 'filament/filament:"^3.2"', '-W', '--no-interaction'],
          projectPath,
          execEnv,
          (out) => onProgress({ output: out })
        );
        onProgress({ output: `> Configuration du panneau Filament...\n` });
        await this.runCommand(
          'php',
          ['artisan', 'filament:install', '--panels', '--no-interaction'],
          projectPath,
          execEnv,
          (out) => onProgress({ output: out })
        );
      }

      // -------------------------------------------------------------
      // Étape 4 (Optionnelle) : Installation des Packages Composer
      // -------------------------------------------------------------
      if (packages.length > 0 || devPackages.length > 0) {
        reportStep('Installation des packages Composer sélectionnés...');
        if (packages.length > 0) {
          onProgress({ output: `> Installation des packages : ${packages.join(', ')}...\n` });
          try {
            await this.runCommand(
              'composer',
              ['require', ...packages, '--no-interaction'],
              projectPath,
              execEnv,
              (out) => onProgress({ output: out })
            );
          } catch (pkgErr) {
            onProgress({ output: `[Alerte Packages] ${pkgErr.message}\n` });
          }
        }

        if (devPackages.length > 0) {
          onProgress({ output: `> Installation des packages de développement : ${devPackages.join(', ')}...\n` });
          try {
            await this.runCommand(
              'composer',
              ['require', ...devPackages, '--dev', '--no-interaction'],
              projectPath,
              execEnv,
              (out) => onProgress({ output: out })
            );
          } catch (devPkgErr) {
            onProgress({ output: `[Alerte Packages Dev] ${devPkgErr.message}\n` });
          }
        }
      }

      // -------------------------------------------------------------
      // Étape 5 : Migrations & Seeders
      // -------------------------------------------------------------
      if (runMigrations) {
        reportStep('Exécution des migrations initiales...');
        try {
          await this.runCommand(
            'php',
            ['artisan', 'migrate', '--force', '--no-interaction'],
            projectPath,
            execEnv,
            (out) => onProgress({ output: out })
          );

          if (runSeeders) {
            reportStep('Exécution des seeders de base de données...');
            await this.runCommand(
              'php',
              ['artisan', 'db:seed', '--force', '--no-interaction'],
              projectPath,
              execEnv,
              (out) => onProgress({ output: out })
            );
          }
        } catch (migErr) {
          onProgress({ output: `[Alerte Migration/Seed] ${migErr.message}\n` });
        }
      }

      // -------------------------------------------------------------
      // Étape 6 : Nginx, Certificat SSL & Windows Hosts
      // -------------------------------------------------------------
      reportStep(`Configuration du serveur Web Nginx & DNS (${domain})...`);

      // Generate dedicated SSL certificate if requested
      if (enableSsl) {
        try {
          onProgress({ output: `> Génération du certificat SSL individuel pour ${domain}...\n` });
          await certificateManager.generateProjectCert(domain);
          onProgress({ output: `✓ Certificat SSL généré pour ${domain}.\n` });
        } catch (sslErr) {
          onProgress({ output: `[Alerte SSL] ${sslErr.message}\n` });
        }
      }

      // Generate VirtualHost in Nginx
      const phpPort = (phpManager.getPort ? phpManager.getPort(phpVersion) : null) || 9183;
      await nginxManager.generateSiteConfig({
        name,
        domain,
        publicPath: path.join(projectPath, 'public'),
        phpPort,
        isSsl: enableSsl
      });

      // Reload Nginx
      if (nginxManager.isInstalled()) {
        onProgress({ output: `> Rechargement de Nginx...\n` });
        await nginxManager.reload();
      }

      // Add to hosts
      if (addToHosts) {
        onProgress({ output: `> Enregistrement de ${domain} dans Windows Hosts...\n` });
        await hostsManager.addDomain(domain);
      }

      // -------------------------------------------------------------
      // Étape 7 : Initialisation Git (si demandée)
      // -------------------------------------------------------------
      if (initGit) {
        reportStep('Initialisation du dépôt Git local...');
        try {
          await this.runCommand('git', ['init'], projectPath, execEnv, (out) => onProgress({ output: out }));
          await this.runCommand('git', ['add', '.'], projectPath, execEnv, (out) => onProgress({ output: out }));
          await this.runCommand('git', ['commit', '-m', '"🎉 Initialisation du projet via LaraTool"'], projectPath, execEnv, (out) => onProgress({ output: out }));
          onProgress({ output: `✓ Dépôt Git initialisé avec le commit initial.\n` });
        } catch (gitErr) {
          onProgress({ output: `[Alerte Git] ${gitErr.message}\n` });
        }
      }

      // Final rescan
      reportStep('Finalisation et indexation du projet...');
      const allProjects = await projectScanner.scanAll();
      const createdProject = allProjects.find(p => p.name === name || p.path === projectPath) || {
        name,
        domain,
        path: projectPath,
        publicPath: path.join(projectPath, 'public'),
        isLaravel: true,
        framework: 'Laravel',
        phpVersion,
        nodeVersion,
        isSsl: enableSsl,
        inHosts: hostsManager.isConfigured(domain)
      };

      onProgress({ output: `\n✨ Le projet Laravel « ${name} » a été initialisé avec succès !\n` });

      return {
        success: true,
        project: createdProject,
        domain,
        projectPath,
        url: `${enableSsl ? 'https' : 'http'}://${domain}`
      };
    } catch (err) {
      onProgress({ output: `\n❌ Erreur lors de l'initialisation : ${err.message}\n` });
      throw err;
    }
  }
}

module.exports = new ProjectCreator();
