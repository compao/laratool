# LaraTool — Project Architecture & Specification

## 1. Project Overview

**LaraTool** is an open-source, desktop-native local development environment specifically engineered for Microsoft Windows (Windows 10 & 11, x64). Inspired by Laravel Herd and Laragon, LaraTool provides isolated, multi-version PHP and Node.js runtimes, Nginx web serving, auxiliary database/caching services, local TLS certificate provisioning (`mkcert`), automatic Windows `hosts` file DNS routing, public HTTP tunneling, and one-click Laravel project scaffolding.

### Core Objectives
- **Zero-Dependency Native Windows Execution**: No requirement for Docker, WSL2, or administrative user accounts during daily development.
- **Multi-Version Runtime Isolation**: Simultaneous execution of PHP 8.0, 8.1, 8.2, 8.3, 8.4, and 8.5 via FastCGI on discrete loopback ports (9180–9185).
- **Automated Virtual Hosting & TLS**: Dynamic Nginx virtual host configuration generation and valid local SSL certificates (`*.test`) via `mkcert`.
- **Ecosystem Integration**: Seamless toolchain integration for Laravel Artisan, Composer, Node/NPM, and Cloudflare/Ngrok tunnels.

---

## 2. Technology Stack

| Layer | Technologies |
|:---|:---|
| **Desktop Shell** | Electron 34.5.8, Node.js v20+ runtime, Win32 Process APIs (`child_process.spawn`, `child_process.exec`, `taskkill.exe`, `net.Socket`) |
| **Frontend Framework** | Vue 3 (Composition API), Vite 5, Tailwind CSS 3, Lucide Vue Next icons |
| **Internationalization** | Vue I18n 9 (Locales: `fr.js` and `en.js` with 850 synchronized keys) |
| **Web Server** | Nginx 1.26.2 for Windows (HTTP on port 80, HTTPS on port 443) |
| **FastCGI Engine** | Multi-version PHP FastCGI (`php-cgi.exe` on `127.0.0.1:9180` - `9185`) |
| **Auxiliary Services** | MariaDB 11.4 / 10.11, PostgreSQL 17 / 16 / 15, Redis 5.0.14, MongoDB 8 / 7, CouchDB 3.3, Memcached 1.6.29, Meilisearch 1.12, Typesense 27.1, SeaweedFS (MinIO S3 API), Mailpit 1.22, Soketi |
| **PKI & Hosts** | `mkcert` v1.4.4 for Windows Root CA and wildcard certs; elevated PowerShell for `C:\Windows\System32\drivers\etc\hosts` |
| **Tunnels** | Cloudflare Tunnel (`cloudflared.exe`), Ngrok |

---

## 3. Directory Layout & Architecture

```
LaraTool/
├── electron/                       # Electron Main Process & Native Services
│   ├── main.js                     # Application lifecycle, window creation, IPC routing
│   ├── preload.js                  # Context bridge exposing `window.laratool` namespace
│   └── services/                   # Modular backend service layer
│       ├── CertificateManager.js   # mkcert lifecycle, Root CA installation & wildcard certs
│       ├── HostsManager.js         # Windows System32 hosts file modification & DNS flush
│       ├── NginxManager.js         # Nginx 1.26.2 process, config generation & reload
│       ├── NodeManager.js          # Node.js runtimes (18, 20, 22, 24) & CLI batch shims
│       ├── PhpManager.js           # PHP versions (8.0 - 8.5), php.ini, extensions & FastCGI
│       ├── ProcessSupervisor.js    # Child process spawning, log streaming & taskkill termination
│       ├── ProjectCreator.js       # Composer create-project wizard & scaffolding automation
│       ├── ProjectScanner.js       # Parked directory discovery, vhost generation & Laravel inspection
│       ├── ServiceManager.js       # 12 auxiliary services (MariaDB, Postgres, Redis, etc.)
│       ├── SystemHelper.js         # Paths (%USERPROFILE%\.config\laratool\), config persistence, port check
│       └── TunnelManager.js        # Cloudflare and Ngrok public ingress tunnels
│
├── src/                            # Vue 3 Single Page Application (Renderer)
│   ├── assets/                     # Tailwind CSS entrypoint (`main.css`) & fonts
│   ├── components/                 # Reusable UI components
│   │   ├── Header.vue              # Top navigation bar, theme toggle, download progress banner
│   │   ├── Sidebar.vue             # Navigation tabs & global environment start/stop
│   │   ├── ProjectLogViewer.vue    # Real-time Laravel log viewer (`storage/logs/laravel.log`)
│   │   └── SiteInformationInspector.vue # Herd-like project inspection panel
│   ├── i18n/                       # Localization subsystem
│   │   ├── index.js                # Vue I18n plugin configuration
│   │   └── locales/                # Dictionaries (`fr.js`, `en.js`)
│   ├── views/                      # Tabbed Single-Page Views
│   │   ├── CreateProjectView.vue   # Project creation wizard (Laravel 10-13, starter kits)
│   │   ├── DashboardView.vue       # System overview, quick metrics, daemon status cards
│   │   ├── NginxView.vue           # Nginx status, global config, vhost files editor
│   │   ├── NodeView.vue            # Node.js version management & terminal shims
│   │   ├── PhpDetailView.vue       # PHP extensions, directives, php.ini & Xdebug editor
│   │   ├── PhpView.vue             # PHP versions overview, status toggles, defaults
│   │   ├── ProjectDetailView.vue   # Per-project PHP/Node selection, SSL, Artisan actions, tunnels
│   │   ├── ProjectsView.vue        # Scanned projects grid, search, browser & editor actions
│   │   ├── ServiceDetailView.vue   # Auxiliary service configuration, data directory, credentials
│   │   ├── ServicesView.vue        # Service catalog, install, start/stop, one-click DB creation
│   │   └── SettingsView.vue        # General preferences (parked paths, TLD, ports, editor, tray)
│   ├── App.vue                     # Root component, global state coordinator & toast notifications
│   └── main.js                     # Vue 3 application bootstrap
│
├── index.html                      # Main HTML template
├── package.json                    # Project dependencies & npm scripts
├── vite.config.js                  # Vite bundler configuration
└── AUDIT_REPORT.md                 # Authoritative Master Audit & Code Remediation Report
```

---

## 4. User Configuration & Filesystem Architecture

All user data, binaries, configurations, and logs are isolated within `%USERPROFILE%\.config\laratool\`:

```
%USERPROFILE%\.config\laratool\
├── config.json                     # Main configuration file
├── bin\                            # User PATH shims (php.bat, composer.bat, node.bat, npm.bat, npx.bat)
├── logs\                           # Daemon log files (nginx.log, php-8.3.log, mysql.log, etc.)
├── nginx\                          # Nginx installation root
│   ├── conf\nginx.conf             # Master Nginx configuration
│   └── conf.d\*.conf               # Per-project virtual host configurations
├── php\                            # Isolated PHP runtimes (php-8.0, php-8.1, ..., php-8.5)
├── nodejs\                         # Isolated Node.js runtimes (node-18, node-20, node-22, node-24)
├── servers\                        # Auxiliary service binaries (mariadb, postgresql, redis, etc.)
├── data\                           # Database persistent storage directories (mysql, postgres, etc.)
├── ssl\                            # Root CA and wildcard certificates generated by mkcert
└── tools\                          # External CLI binaries (mkcert.exe, cloudflared.exe, ngrok.exe)
```

### Default Port Map

| Component | Default Port | Configuration Key |
|:---|:---:|:---|
| **Nginx HTTP** | `80` | `config.nginxPort` |
| **Nginx HTTPS** | `443` | `config.httpsPort` |
| **PHP 8.0 FastCGI** | `9180` | `config.phpPorts['8.0']` |
| **PHP 8.1 FastCGI** | `9181` | `config.phpPorts['8.1']` |
| **PHP 8.2 FastCGI** | `9182` | `config.phpPorts['8.2']` |
| **PHP 8.3 FastCGI** | `9183` | `config.phpPorts['8.3']` |
| **PHP 8.4 FastCGI** | `9184` | `config.phpPorts['8.4']` |
| **PHP 8.5 FastCGI** | `9185` | `config.phpPorts['8.5']` |
| **MySQL / MariaDB** | `3306` | `config.servicePorts['mysql']` |
| **PostgreSQL** | `5432` | `config.servicePorts['postgres']` |
| **MongoDB** | `27017` | `config.servicePorts['mongodb']` |
| **CouchDB** | `5984` | `config.servicePorts['couchdb']` |
| **Redis** | `6379` | `config.servicePorts['redis']` |
| **Memcached** | `11211` | `config.servicePorts['memcached']` |
| **Meilisearch** | `7700` | `config.servicePorts['meilisearch']` |
| **Typesense** | `8108` | `config.servicePorts['typesense']` |
| **Mailpit SMTP** | `1025` | `config.servicePorts['mailpit']` |
| **Mailpit Web UI** | `8025` | `catalog.mailpit.webPort` |
| **SeaweedFS S3** | `8333` | `config.servicePorts['minio']` |
| **SeaweedFS Web** | `8888` | `catalog.minio.webPort` |

---

## 5. Build, Run & Development Commands

```bash
# Install NPM dependencies
npm install

# Run Vite frontend dev server (port 5173)
npm run dev

# Compile Vue 3 frontend for production
npm run build

# Launch full desktop application in development mode (Electron + Vite)
npm run electron:dev

# Package desktop installer for Windows (NSIS executable)
npm run electron:build
```

---

## 6. IPC Interface Contract & Topology

Communication between the Vue 3 renderer and the Electron Main process is strictly mediated by the Preload script (`electron/preload.js`) via `window.laratool`:

- **Request / Response Handlers**: 103 channels registered using `ipcMain.handle(channel, handler)` and invoked via `ipcRenderer.invoke(channel, ...args)`.
- **Push Event Streams**:
  - `download:progress`: Emitted during binary downloads (`{ item, percent }`).
  - `project-create:progress`: Emitted during project creation (`{ step, totalSteps, title, output }`).
- **Contract Integrity**: 100% of frontend IPC calls map to registered handlers. Exactly 20 orphaned channels exist as documented in `AUDIT_REPORT.md`.

---

## 7. Comprehensive Audit & Remediation Reference

A complete, exhaustive technical architecture and code audit was conducted on LaraTool, identifying 25 verified findings across 5 core functional areas:
1. **Process Supervision & Windows Service Lifecycle (R1)**: Unawaited `before-quit`, FastCGI 1000-request death, global `taskkill`, in-memory PIDs, and Soketi no-op.
2. **Electron IPC & State Synchronization (R2)**: Orphaned channels, event listener memory leaks, and progress banner state freeze.
3. **Windows Filesystem & UAC Permissions (R3)**: 1.5s UAC race condition, recursive CLI batch shims, and hardcoded `.test` domains.
4. **Project Scaffolding & Ecosystem Integration (R4)**: Hardcoded `.env` database ports breaking initial migrations and missing hosts sync on scan.
5. **UI / UX & Frontend Coherence (R5)**: Hardcoded French strings in log viewer and toasts, blank screen error black holes, dead settings toggles, and remote QR code privacy leaks.

For complete root cause analyses, exact file/line references, and copy-paste ready code remediations, refer to:  
👉 **`c:\Users\abdou\OneDrive\Documents\Projects\LaraTool\AUDIT_REPORT.md`**
