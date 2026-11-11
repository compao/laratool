# LaraTool

> **Native Windows desktop development environment for PHP, Node.js, and Laravel** — a lightweight, zero-container alternative to Laravel Herd and Laragon.

[![Platform](https://img.shields.io/badge/Platform-Windows%2010%2F11%20x64-0078D6?logo=windows)](https://github.com/compao/LaraTool)
[![Electron](https://img.shields.io/badge/Electron-34-47848F?logo=electron)](https://www.electronjs.org/)
[![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vue.js)](https://vuejs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](package.json)

LaraTool runs portable native Windows binaries directly on your machine—**no Docker, no WSL2, and no heavy VMs required**. Manage multiple PHP and Node.js versions side by side, serve local `*.test` sites over HTTPS via Nginx and `mkcert`, spin up databases and developer services in one click, scaffold new Laravel applications, and share local projects publicly with Cloudflare or Ngrok tunnels.

---

## Features

### Multi-Version PHP & FastCGI
- **Side-by-side PHP runtimes**: Download and run **PHP 8.0, 8.1, 8.2, 8.3, 8.4, and 8.5** (NTS Win32 x64) simultaneously on dedicated FastCGI loopback ports (`127.0.0.1:9180`–`9185`).
- **Per-version configuration**: Visual `php.ini` directive editor, one-click PHP extension toggles, Xdebug toggle, update checks, and isolated CLI terminals.
- **Global & per-project switching**: Assign a different PHP version to each project via `.laratool.json` with automatic Nginx virtual host updates.
- **PATH CLI shims**: Exposes `php` and `composer` directly in your Windows PATH via `%USERPROFILE%\.config\laratool\bin\`.

### Node.js Version Management
- **Node.js LTS runtimes**: Install and switch between **Node.js 18, 20, 22, and 24** (`win-x64`).
- **CLI shims**: Automatically manages `node.bat`, `npm.bat`, and `npx.bat` shims plus per-project Node version selection.

### Nginx, Local Domains & HTTPS
- **Nginx 1.26.2 for Windows**: Automatic master config and per-site virtual host generation (`conf/conf.d/*.conf`), hot reload, config editor, and live log inspection.
- **Parked Directories & `*.test` Domains**: Scans configured project folders, detects Laravel/PHP apps, maps domains in `C:\Windows\System32\drivers\etc\hosts`, and flushes Windows DNS.
- **Zero-config Local TLS (`mkcert`)**: Installs a trusted Windows Root CA and generates wildcard `*.test` certificates via `mkcert` v1.4.4.

### 12 Integrated Auxiliary Services
One-click download, start/stop, port configuration, config file editing, and persistent data management for:

| Category | Services | Default Port(s) |
| :--- | :--- | :--- |
| **Databases** | MariaDB (`11.4` / `10.11`), PostgreSQL (`17` / `16` / `15`), MongoDB (`8.0` / `7.0`), Apache CouchDB (`3.3.3`) | `3306`, `5432`, `27017`, `5984` |
| **Caching** | Redis (`5.0.14.1`), Memcached (`1.6.29`) | `6379`, `11211` |
| **Search** | Meilisearch (`1.12.3`), Typesense (`27.1`) | `7700`, `8108` |
| **Realtime** | Laravel Reverb, Soketi | `8080`, `6001` |
| **Object Storage** | MinIO / SeaweedFS S3 (`4.47`) | `8333` (S3), `8888` (Web UI) |
| **Email Testing** | Mailpit (`1.22.3`) | `1025` (SMTP), `8025` (Webmail) |

Includes one-click database creation for relational engines and copy-ready `.env` snippets.

### Laravel Project Workspace & Scaffolding
- **New Project Wizard**: Multi-step Laravel scaffolding workflow via Composer with automatic vhost, SSL, and hosts provisioning.
- **Project Inspector**: View `artisan about` diagnostics, toggle maintenance mode, clear/optimize caches, create `storage:link`, inspect `.env` DB settings, and install Composer packages.
- **Real-Time Log Viewer**: Inspect and clear `storage/logs/laravel.log` directly inside the app.
- **Quick Launchers**: Open projects in your browser, code editor, Windows Explorer, or terminal (Windows Terminal / Cmder).

### Public Tunnels, Tray & Localization
- **Public HTTP Tunnels**: Expose any local site over HTTPS using **Cloudflare Tunnel (`cloudflared`)** or **Ngrok v3** with real-time request logs and reachability checks.
- **System Tray Integration**: Minimize to tray and start/stop all services directly from the Windows notification area.
- **Bilingual & Themed**: Built-in **English** and **French** localization with Dark and Light modes.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Desktop Shell** | [Electron](https://www.electronjs.org/) (`^34.2.0`), Node.js Win32 Process APIs |
| **Frontend** | [Vue 3](https://vuejs.org/) (`^3.5.13`, Composition API), [Vite](https://vite.dev/) (`^6.1.0`), [Tailwind CSS](https://tailwindcss.com/) (`^3.4.17`) |
| **Icons & Utilities** | `lucide-vue-next`, `adm-zip`, custom FR/EN i18n (`src/i18n/`) |
| **Packaging & CI** | `electron-builder` (`^26.18.0`, NSIS + Portable `.exe`), GitHub Actions |

---

## Architecture

```text
LaraTool/
├── .github/workflows/
│   └── release.yml                 # Windows CI build & GitHub Release workflow
├── build/                          # Application icons (.ico, .png)
├── electron/
│   ├── main.js                     # App lifecycle, tray, window & IPC handlers
│   ├── preload.js                  # Context bridge exposing `window.laratool`
│   └── services/
│       ├── CertificateManager.js   # mkcert Root CA & wildcard TLS certificates
│       ├── HostsManager.js         # Elevated Windows hosts file & DNS management
│       ├── NginxManager.js         # Nginx 1.26.2 lifecycle & vhost generation
│       ├── NodeManager.js          # Multi-version Node.js & batch shims
│       ├── PhpManager.js           # Multi-version PHP FastCGI, php.ini & extensions
│       ├── ProcessSupervisor.js    # Background process supervision & clean shutdown
│       ├── ProjectCreator.js       # Composer project scaffolding wizard backend
│       ├── ProjectScanner.js       # Parked path scanning & Laravel inspection
│       ├── ServiceManager.js       # 12 auxiliary services catalog & lifecycle
│       ├── SystemHelper.js         # Isolated paths, config persistence & downloads
│       └── TunnelManager.js        # Cloudflare Tunnel & Ngrok management
├── scripts/
│   └── build-win.js                # Staging build helper for Windows packaging
├── src/
│   ├── components/                 # Header, Sidebar, LogViewer, Inspector, UI kit
│   ├── composables/                # Notification state composable
│   ├── i18n/                       # French (fr.js) & English (en.js) dictionaries
│   ├── utils/                      # Error formatting helpers
│   └── views/                      # Dashboard, Projects, PHP, Node, Nginx, Services, Tunnels, Settings
├── PROJECT.md                      # Detailed architecture & port specification
└── AUDIT_REPORT.md                 # Code audit & remediation report
```

### Local Runtime Directory

LaraTool keeps all downloaded binaries, configurations, databases, certificates, and logs isolated inside `%USERPROFILE%\.config\laratool\`:

```text
%USERPROFILE%\.config\laratool\
├── config.json      # Global preferences, parked paths, ports & default runtimes
├── bin\             # Windows PATH shims (php.bat, composer.bat, node.bat, npm.bat, npx.bat)
├── php\             # PHP runtimes (php-8.0 ... php-8.5)
├── nodejs\          # Node.js runtimes (node-18, node-20, node-22, node-24)
├── nginx\           # Nginx installation & conf/conf.d/*.conf virtual hosts
├── servers\         # Auxiliary service binaries (MariaDB, Postgres, Redis, etc.)
├── data\            # Persistent database & service storage
├── ssl\             # mkcert wildcard certificates
├── logs\            # App, Nginx, PHP, and service logs
└── sites\           # Discovered project metadata (sites.json)
```

---

## Getting Started

### Prerequisites
- **OS**: Windows 10 or Windows 11 (x64)
- **Node.js**: v20 or higher + `npm`

### Installation & Development

```bash
# 1. Clone the repository
git clone https://github.com/compao/LaraTool.git
cd LaraTool

# 2. Install dependencies
npm install

# 3. Launch the desktop app in development mode (Vite + Electron)
npm run electron:dev
```

You can also run only the Vite frontend server during UI development:

```bash
npm run dev
```

### Building for Production (Windows)

```bash
# Build the Vue frontend
npm run build

# Package Windows NSIS installer & portable executable into release/
npm run electron:build
```

> **Tip (OneDrive / Cloud-Synced Folders):** If building inside a cloud-synced directory causes file-lock issues during NSIS packaging, use `node scripts/build-win.js`, which builds in `%TEMP%\laratool-release` and copies the final artifacts into `release/`.

### Automated Releases

The [`.github/workflows/release.yml`](.github/workflows/release.yml) workflow automatically builds the Windows NSIS installer and portable `.exe` on `windows-latest` whenever a `v*` tag is pushed or when triggered manually via `workflow_dispatch`.

---

## Additional Documentation

- [`PROJECT.md`](PROJECT.md) — Architecture specification, port map, and IPC topology
- [`AUDIT_REPORT.md`](AUDIT_REPORT.md) — Full technical audit and remediation reference

---

## License

This project is open-source and licensed under the [MIT License](package.json).
