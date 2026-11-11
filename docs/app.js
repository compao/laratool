(function () {
  const root = document.documentElement;
  const themeBtn = document.getElementById('theme-toggle');
  const langBtn = document.getElementById('lang-toggle');

  // Theme initialization
  const savedTheme = localStorage.getItem('laratool_site_theme');
  if (savedTheme === 'light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }

  function updateThemeButton() {
    if (!themeBtn) return;
    const isDark = root.classList.contains('dark');
    themeBtn.textContent = isDark ? '☀ Light' : '☾ Dark';
    themeBtn.setAttribute('aria-pressed', String(isDark));
  }

  themeBtn?.addEventListener('click', () => {
    root.classList.toggle('dark');
    localStorage.setItem('laratool_site_theme', root.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
  });
  updateThemeButton();

  // Bilingual EN / FR copy
  const i18n = {
    en: {
      'nav.features': 'Features',
      'nav.services': 'Services',
      'nav.architecture': 'Architecture',
      'nav.download': 'Download',
      'nav.cta': 'Download v1.0.0',
      'hero.badge': 'Windows 10 & 11 (x64) • Native Win32 • Zero Docker / Zero WSL2',
      'hero.title.pre': 'Native Laravel & PHP Local Environment for ',
      'hero.title.accent': 'Windows.',
      'hero.sub':
        'Run isolated PHP 8.0–8.5, Node.js LTS, Nginx, local *.test HTTPS via mkcert, 12 developer services, and public Cloudflare/Ngrok tunnels—with minimal tools pre-bundled out of the box.',
      'hero.dl.installer': 'Download Windows Installer (.exe)',
      'hero.dl.portable': 'Portable .exe',
      'hero.github': 'View on GitHub',
      'hero.bundled': 'Pre-bundled out of the box:',
      'features.eyebrow': 'Built for Speed',
      'features.title': 'Everything Laravel & PHP developers need on Windows',
      'features.desc': 'Portable official binaries, zero container overhead, and instant per-project configuration.',
      'f1.title': 'Multi-Version PHP & FastCGI',
      'f1.desc': 'Run PHP 8.0 through 8.5+ simultaneously on dedicated loopback FastCGI ports (9180–9185), edit php.ini, toggle extensions & Xdebug, and use php/composer PATH shims.',
      'f2.title': 'Node.js LTS & CLI Shims',
      'f2.desc': 'Install and switch Node.js 18, 20, 22, 24, and 26 LTS per project or globally, with automatic node, npm, and npx batch shims in your Windows PATH.',
      'f3.title': 'Nginx & Automatic *.test Domains',
      'f3.desc': 'Scans your parked project folders, generates Nginx virtual hosts automatically, syncs Windows hosts entries, and flushes DNS in one click.',
      'f4.title': 'Zero-Config Local HTTPS (mkcert)',
      'f4.desc': 'Installs a trusted Windows Root CA and generates wildcard *.test TLS certificates via mkcert so every local Laravel site runs smoothly over HTTPS.',
      'f5.title': 'Laravel Scaffolding & Inspector',
      'f5.desc': '5-step project creation wizard, artisan about diagnostics, maintenance mode toggle, cache clear/optimize, storage:link, Composer installer, and live laravel.log viewer.',
      'f6.title': 'Cloudflare & Ngrok Tunnels',
      'f6.desc': 'Expose any local site over a public HTTPS URL with one click using cloudflared or Ngrok v3, complete with real-time request logs and ping checks.',
      'services.eyebrow': '12 Integrated Services',
      'services.title': 'One-click databases, caches, search, mail & storage',
      'services.desc': 'Install, start/stop, edit configs, copy .env snippets, and create relational databases without leaving LaraTool.',
      'filter.all': 'All (12)',
      'filter.database': 'Databases',
      'filter.cache': 'Cache & Search',
      'filter.other': 'Realtime, Storage & Mail',
      'arch.eyebrow': 'Clean & Isolated',
      'arch.title': 'Zero system clutter. Everything stays in one directory.',
      'arch.desc': 'LaraTool stores binaries, configs, SSL certs, databases, and logs neatly under %USERPROFILE%\\.config\\laratool\\—leaving your Windows system clean.',
      'dl.eyebrow': 'Get Started',
      'dl.title': 'Download LaraTool for Windows',
      'dl.desc': 'Includes pre-bundled latest Nginx, PHP, Node.js LTS, Composer, mkcert, Ngrok, and Cloudflared.',
      'dl.installer.title': 'Windows Installer (NSIS)',
      'dl.installer.desc': 'Standard Windows setup wizard with Start Menu & Desktop shortcuts and uninstaller.',
      'dl.installer.btn': 'Download Setup.exe',
      'dl.portable.title': 'Portable Executable',
      'dl.portable.desc': 'Single standalone Windows executable—run directly without installation.',
      'dl.portable.btn': 'Download Portable.exe',
      'dl.source.title': 'Build from Source',
      'dl.source.desc': 'Requires Windows 10/11 x64 and Node.js 20+. Clone, install dependencies, and run locally.',
      'dl.source.btn': 'Browse Releases'
    },
    fr: {
      'nav.features': 'Fonctionnalités',
      'nav.services': 'Services',
      'nav.architecture': 'Architecture',
      'nav.download': 'Télécharger',
      'nav.cta': 'Télécharger v1.0.0',
      'hero.badge': 'Windows 10 & 11 (x64) • Win32 Natif • Zéro Docker / Zéro WSL2',
      'hero.title.pre': 'Environnement Laravel & PHP natif pour ',
      'hero.title.accent': 'Windows.',
      'hero.sub':
        'Exécutez PHP 8.0–8.5, Node.js LTS, Nginx, le HTTPS local *.test via mkcert, 12 services intégrés et des tunnels publics Cloudflare/Ngrok—avec les outils essentiels pré-inclus.',
      'hero.dl.installer': 'Télécharger l’installeur (.exe)',
      'hero.dl.portable': 'Version Portable (.exe)',
      'hero.github': 'Voir sur GitHub',
      'hero.bundled': 'Pré-inclus dès le premier lancement :',
      'features.eyebrow': 'Conçu pour la performance',
      'features.title': 'Tout ce dont les développeurs Laravel & PHP ont besoin sous Windows',
      'features.desc': 'Binaires officiels portables, zéro conteneur et configuration instantanée par projet.',
      'f1.title': 'PHP Multi-Versions & FastCGI',
      'f1.desc': 'Exécutez PHP 8.0 à 8.5+ en parallèle sur des ports FastCGI dédiés (9180–9185), éditez php.ini, activez extensions & Xdebug et profitez des shims php/composer.',
      'f2.title': 'Node.js LTS & Shims CLI',
      'f2.desc': 'Installez et basculez entre Node.js 18, 20, 22, 24 et 26 LTS par projet ou globalement, avec shims automatiques node, npm et npx dans le PATH Windows.',
      'f3.title': 'Nginx & Domaines *.test automatiques',
      'f3.desc': 'Détecte vos dossiers de projets, génère les virtual hosts Nginx, synchronise le fichier hosts Windows et vide le cache DNS en un clic.',
      'f4.title': 'HTTPS Local Zéro-Config (mkcert)',
      'f4.desc': 'Installe une autorité racine Windows approuvée et génère des certificats wildcard *.test via mkcert pour servir tous vos sites en HTTPS.',
      'f5.title': 'Création Laravel & Inspecteur',
      'f5.desc': 'Assistant de création en 5 étapes, diagnostic artisan about, mode maintenance, vidage/optimisation des caches, storage:link et journaux laravel.log en direct.',
      'f6.title': 'Tunnels Publics Cloudflare & Ngrok',
      'f6.desc': 'Partagez n’importe quel site local via une URL HTTPS publique en un clic avec cloudflared ou Ngrok v3 et journaux de requêtes en direct.',
      'services.eyebrow': '12 Services Intégrés',
      'services.title': 'Bases de données, cache, recherche, e-mails & stockage en 1 clic',
      'services.desc': 'Installez, démarrez/arrêtez, éditez la configuration, copiez les variables .env et créez des bases sans quitter LaraTool.',
      'filter.all': 'Tous (12)',
      'filter.database': 'Bases de données',
      'filter.cache': 'Cache & Recherche',
      'filter.other': 'Temps réel, Stockage & Mail',
      'arch.eyebrow': 'Propre & Isolé',
      'arch.title': 'Aucune pollution système. Tout reste dans un seul dossier.',
      'arch.desc': 'LaraTool isole tous les binaires, configurations, certificats SSL, bases et logs dans %USERPROFILE%\\.config\\laratool\\.',
      'dl.eyebrow': 'Démarrer',
      'dl.title': 'Télécharger LaraTool pour Windows',
      'dl.desc': 'Inclut les dernières versions de Nginx, PHP, Node.js LTS, Composer, mkcert, Ngrok et Cloudflared.',
      'dl.installer.title': 'Installeur Windows (NSIS)',
      'dl.installer.desc': 'Assistant d’installation Windows complet avec raccourcis Bureau/Menu Démarrer et désinstalleur.',
      'dl.installer.btn': 'Télécharger Setup.exe',
      'dl.portable.title': 'Exécutable Portable',
      'dl.portable.desc': 'Exécutable autonome sans installation — lancez LaraTool directement.',
      'dl.portable.btn': 'Télécharger Portable.exe',
      'dl.source.title': 'Compiler depuis les sources',
      'dl.source.desc': 'Requiert Windows 10/11 x64 et Node.js 20+. Clonez, installez les dépendances et lancez en local.',
      'dl.source.btn': 'Voir les Releases'
    }
  };

  let currentLang = localStorage.getItem('laratool_site_lang') || (navigator.language?.startsWith('fr') ? 'fr' : 'en');
  if (!i18n[currentLang]) currentLang = 'en';

  function applyLang(lang) {
    const dict = i18n[lang] || i18n.en;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.getAttribute('data-i18n');
      if (dict[key]) {
        el.textContent = dict[key];
      }
    });
    if (langBtn) {
      langBtn.textContent = lang === 'en' ? 'FR' : 'EN';
    }
  }

  langBtn?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    localStorage.setItem('laratool_site_lang', currentLang);
    applyLang(currentLang);
  });
  applyLang(currentLang);

  // Interactive App Mockup tabs
  document.querySelectorAll('.mock-tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      document.querySelectorAll('.mock-tab').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.mock-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`panel-${target}`)?.classList.add('active');
    });
  });

  // Services category filter
  document.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-filter');
      document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.service-card').forEach((card) => {
        const cardCat = card.getAttribute('data-category');
        const show = cat === 'all' || cardCat === cat || (cat === 'other' && ['realtime', 'storage', 'mail'].includes(cardCat));
        card.classList.toggle('hidden', !show);
      });
    });
  });

  // Fetch latest GitHub Release metadata to keep download links & version pill live
  fetch('https://api.github.com/repos/compao/laratool/releases/latest', {
    headers: { Accept: 'application/vnd.github+json' }
  })
    .then((res) => (res.ok ? res.json() : null))
    .then((rel) => {
      if (!rel || !Array.isArray(rel.assets)) return;
      const setupAsset = rel.assets.find((a) => /Setup.*\.exe$/i.test(a.name));
      const portableAsset = rel.assets.find((a) => /\.exe$/i.test(a.name) && !/Setup/i.test(a.name));

      if (rel.tag_name) {
        document.querySelectorAll('[data-release-tag]').forEach((el) => {
          el.textContent = rel.tag_name;
        });
      }
      if (setupAsset?.browser_download_url) {
        document.querySelectorAll('[data-dl-setup]').forEach((a) => {
          a.href = setupAsset.browser_download_url;
        });
        const setupSizeEl = document.getElementById('setup-size');
        if (setupSizeEl && setupAsset.size) {
          setupSizeEl.textContent = `${setupAsset.name} • ${(setupAsset.size / 1048576).toFixed(1)} MB`;
        }
      }
      if (portableAsset?.browser_download_url) {
        document.querySelectorAll('[data-dl-portable]').forEach((a) => {
          a.href = portableAsset.browser_download_url;
        });
        const portableSizeEl = document.getElementById('portable-size');
        if (portableSizeEl && portableAsset.size) {
          portableSizeEl.textContent = `${portableAsset.name} • ${(portableAsset.size / 1048576).toFixed(1)} MB`;
        }
      }
    })
    .catch(() => {});
})();
