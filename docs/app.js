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
      'nav.download': 'Download',
      'nav.cta': 'Download v1.0.0',
      'hero.badge': 'For Windows 10 & 11 (x64) · No Docker or WSL required',
      'hero.title.pre': 'Your Laravel & PHP dev setup on Windows, ',
      'hero.title.accent': 'without the headache.',
      'hero.sub':
        'Install once and start coding. LaraTool gives you PHP, Node.js, Nginx, trusted local HTTPS, databases, and live sharing tunnels in one native Windows app.',
      'hero.dl.installer': 'Download for Windows (.exe)',
      'hero.dl.portable': 'Portable version',
      'hero.github': 'View on GitHub',
      'hero.bundled': 'Included right after install:',
      'features.eyebrow': 'Why LaraTool',
      'features.title': 'Built for everyday Laravel work on Windows',
      'features.desc': 'Everything runs natively on your PC, so sites load quickly and your laptop stays quiet.',
      'f1.title': 'Switch PHP versions in a click',
      'f1.desc':
        'Keep PHP 8.0 through 8.5+ installed side by side. Pick a different version per project, tweak php.ini inside the app, and toggle Xdebug or extensions whenever you need them.',
      'f2.title': 'Node.js ready in your terminal',
      'f2.desc':
        'Install and switch Node.js LTS releases globally or per project. php, composer, node, npm, and npx all work straight from your regular terminal.',
      'f3.title': 'Automatic .test domains',
      'f3.desc':
        'Point LaraTool to your projects folder once. Every Laravel or PHP site gets its own clean .test address automatically, with Nginx and your hosts file handled for you.',
      'f4.title': 'Local HTTPS without browser warnings',
      'f4.desc':
        'Turn on SSL once and forget about certificate errors. LaraTool installs a trusted local certificate authority so your .test sites open cleanly over HTTPS.',
      'f5.title': 'Handy Laravel tools built in',
      'f5.desc':
        'Create new Laravel apps, inspect artisan details, toggle maintenance mode, clear caches, link storage, install Composer packages, and watch laravel.log in real time.',
      'f6.title': 'Share your local site with anyone',
      'f6.desc':
        'Need to show a client progress or test a webhook? Open a public HTTPS link in one click using Cloudflare Tunnel or Ngrok.',
      'services.eyebrow': 'Built-in Services',
      'services.title': 'Databases, caches, search, and local email in one place',
      'services.desc':
        'Install only what your project uses, start or stop services anytime, copy .env settings, and create new databases in one click.',
      'filter.all': 'All (12)',
      'filter.database': 'Databases',
      'filter.cache': 'Cache & Search',
      'filter.other': 'Realtime, Storage & Mail',
      'srv.mariadb': 'MySQL-compatible database with one-click database creation.',
      'srv.postgres': 'Reliable relational database ready for modern Laravel apps.',
      'srv.mongodb': 'Document database ready for NoSQL projects.',
      'srv.couchdb': 'JSON document store with its built-in Fauxton dashboard.',
      'srv.redis': 'Fast in-memory store for cache, sessions, queues, and Horizon.',
      'srv.memcached': 'Lightweight object caching for PHP applications.',
      'srv.meilisearch': 'Instant full-text search for Laravel Scout.',
      'srv.typesense': 'Fast, typo-tolerant search engine for Scout apps.',
      'srv.reverb': 'Laravel’s official WebSocket server for real-time broadcasting.',
      'srv.soketi': 'Open-source Pusher-compatible WebSocket server.',
      'srv.s3': 'Test S3 file uploads locally with a built-in web browser.',
      'srv.mailpit': 'Catch outgoing test emails locally and inspect them in your browser.',
      'dl.eyebrow': 'Get LaraTool',
      'dl.title': 'Ready in a couple of minutes',
      'dl.desc':
        'Pick the standard Windows installer or the portable app. Both already include Nginx, PHP, Node.js LTS, Composer, mkcert, Ngrok, and Cloudflared.',
      'dl.installer.title': 'Windows Installer',
      'dl.installer.desc': 'Standard Windows setup with Start Menu and Desktop shortcuts.',
      'dl.installer.btn': 'Download Installer',
      'dl.portable.title': 'Portable App',
      'dl.portable.desc': 'A single file you can run straight away with no installation needed.',
      'dl.portable.btn': 'Download Portable',
      'dl.source.title': 'Open Source on GitHub',
      'dl.source.desc': 'Check out the repository, follow updates, or browse all releases.',
      'dl.source.meta': 'Windows 10 & 11 (x64) · MIT License',
      'dl.source.btn': 'View Releases',
      'footer.copy': 'LaraTool — Free and open source under the MIT License.',
      'footer.releases': 'Releases',
      'footer.issues': 'Report an issue'
    },
    fr: {
      'nav.features': 'Fonctionnalités',
      'nav.services': 'Services',
      'nav.download': 'Télécharger',
      'nav.cta': 'Télécharger v1.0.0',
      'hero.badge': 'Pour Windows 10 & 11 (x64) · Sans Docker ni WSL',
      'hero.title.pre': 'Votre environnement Laravel & PHP sous Windows, ',
      'hero.title.accent': 'sans prise de tête.',
      'hero.sub':
        'Installez une fois et commencez à coder. LaraTool réunit PHP, Node.js, Nginx, le HTTPS local, vos bases de données et des tunnels de partage dans une seule application Windows.',
      'hero.dl.installer': 'Télécharger pour Windows (.exe)',
      'hero.dl.portable': 'Version portable',
      'hero.github': 'Voir sur GitHub',
      'hero.bundled': 'Inclus dès l’installation :',
      'features.eyebrow': 'Pourquoi LaraTool',
      'features.title': 'Pensé pour travailler sur Laravel au quotidien sous Windows',
      'features.desc': 'Tout tourne nativement sur votre PC : vos sites répondent vite et votre machine reste silencieuse.',
      'f1.title': 'Changez de version PHP en un clic',
      'f1.desc':
        'Gardez PHP 8.0 à 8.5+ installés côte à côte. Choisissez une version par projet, modifiez php.ini depuis l’interface et activez Xdebug ou vos extensions quand vous en avez besoin.',
      'f2.title': 'Node.js prêt dans votre terminal',
      'f2.desc':
        'Installez et changez de version Node.js LTS globalement ou par projet. php, composer, node, npm et npx fonctionnent directement dans votre terminal habituel.',
      'f3.title': 'Domaines .test automatiques',
      'f3.desc':
        'Indiquez simplement votre dossier de projets. Chaque site Laravel ou PHP reçoit automatiquement son adresse .test, avec Nginx et le fichier hosts gérés pour vous.',
      'f4.title': 'HTTPS local sans alertes de navigateur',
      'f4.desc':
        'Activez le SSL une bonne fois pour toutes. LaraTool installe une autorité locale approuvée pour que tous vos sites .test s’ouvrent proprement en HTTPS.',
      'f5.title': 'Outils Laravel pratiques intégrés',
      'f5.desc':
        'Créez un nouveau projet Laravel, consultez artisan, passez en mode maintenance, videz les caches, liez le storage, ajoutez des paquets Composer et suivez laravel.log en direct.',
      'f6.title': 'Partagez votre site local en un clic',
      'f6.desc':
        'Besoin de montrer une avancée à un client ou de tester un webhook ? Générez un lien HTTPS public instantanément avec Cloudflare Tunnel ou Ngrok.',
      'services.eyebrow': 'Services intégrés',
      'services.title': 'Bases de données, cache, recherche et e-mails au même endroit',
      'services.desc':
        'Installez uniquement ce dont votre projet a besoin, démarrez ou arrêtez chaque service, copiez vos variables .env et créez vos bases en un clic.',
      'filter.all': 'Tous (12)',
      'filter.database': 'Bases de données',
      'filter.cache': 'Cache & Recherche',
      'filter.other': 'Temps réel, Stockage & Mail',
      'srv.mariadb': 'Base compatible MySQL avec création de bases en un clic.',
      'srv.postgres': 'Base de données relationnelle fiable pour vos projets Laravel.',
      'srv.mongodb': 'Base orientée documents pour vos projets NoSQL.',
      'srv.couchdb': 'Base JSON avec son interface web Fauxton intégrée.',
      'srv.redis': 'Stockage en mémoire rapide pour le cache, les sessions, les files et Horizon.',
      'srv.memcached': 'Cache d’objets léger pour les applications PHP.',
      'srv.meilisearch': 'Recherche plein texte instantanée pour Laravel Scout.',
      'srv.typesense': 'Moteur de recherche rapide et tolérant aux fautes pour Scout.',
      'srv.reverb': 'Le serveur WebSocket officiel de Laravel pour le temps réel.',
      'srv.soketi': 'Serveur WebSocket open source compatible Pusher.',
      'srv.s3': 'Testez vos uploads S3 en local avec un explorateur web intégré.',
      'srv.mailpit': 'Capturez vos e-mails de test en local et lisez-les dans le navigateur.',
      'dl.eyebrow': 'Télécharger',
      'dl.title': 'Prêt en quelques minutes',
      'dl.desc':
        'Choisissez l’installeur Windows classique ou la version portable. Les deux incluent déjà Nginx, PHP, Node.js LTS, Composer, mkcert, Ngrok et Cloudflared.',
      'dl.installer.title': 'Installeur Windows',
      'dl.installer.desc': 'Installation classique avec raccourcis Bureau et Menu Démarrer.',
      'dl.installer.btn': 'Télécharger l’installeur',
      'dl.portable.title': 'Version Portable',
      'dl.portable.desc': 'Un seul fichier prêt à lancer directement, sans installation.',
      'dl.portable.btn': 'Télécharger la version portable',
      'dl.source.title': 'Open Source sur GitHub',
      'dl.source.desc': 'Explorez le dépôt, suivez les mises à jour ou consultez toutes les versions.',
      'dl.source.meta': 'Windows 10 & 11 (x64) · Licence MIT',
      'dl.source.btn': 'Voir les versions',
      'footer.copy': 'LaraTool — Gratuit et open source sous licence MIT.',
      'footer.releases': 'Versions',
      'footer.issues': 'Signaler un bug'
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
          setupSizeEl.textContent = `${setupAsset.name} · ${(setupAsset.size / 1048576).toFixed(1)} MB`;
        }
      }
      if (portableAsset?.browser_download_url) {
        document.querySelectorAll('[data-dl-portable]').forEach((a) => {
          a.href = portableAsset.browser_download_url;
        });
        const portableSizeEl = document.getElementById('portable-size');
        if (portableSizeEl && portableAsset.size) {
          portableSizeEl.textContent = `${portableAsset.name} · ${(portableAsset.size / 1048576).toFixed(1)} MB`;
        }
      }
    })
    .catch(() => {});
})();
