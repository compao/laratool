# LaraTool 🚀
> Gestionnaire d'environnement de développement local pour projets Laravel sous Windows (alternative native et légère à Laravel Herd).

## ✨ Fonctionnalités du MVP
- **Zéro conteneur, zéro WSL** : Exécute nativement les binaires portables Windows (PHP-CGI, Nginx).
- **Multi-versions PHP simultanées** : Téléchargement et exécution de PHP 8.1, 8.2, 8.3 et 8.4 via FastCGI sur ports dédiés (9081, 9082, 9083, 9084).
- **Serveur Web Nginx Win32** : Reverse proxy rapide et génération automatique des Virtual Hosts par projet.
- **Détection automatique des projets Laravel** : Scan automatique des dossiers surveillés (*parked paths*), détection du framework et assignation des domaines `*.test`.
- **Sélecteur de version PHP par projet** : Assignez une version PHP différente à chaque projet en un clic (génère un `.laratool.json` et configure Nginx à chaud).
- **CLI Shims & Composer** : `php` et `composer` configurés directement dans le PATH Windows (`%USERPROFILE%\.laratool\bin`).
- **Interface Vue 3 + Tailwind & System Tray** : Minimisation en barre des tâches et contrôle discret.

---

## 🛠️ Stack Technique
- **Desktop Shell** : Electron
- **Frontend** : Vue 3 (Composition API) + Tailwind CSS + Lucide Icons + Vite
- **Web Server** : Nginx (Windows x64)
- **FastCGI Engines** : PHP NTS Win32 x64 (officiel)
- **Process Supervisor** : Gestionnaire de processus en arrière-plan sans fenêtres d'invite de commande popups (`windowsHide: true`).

---

## 🚀 Démarrage

### Mode Développement
```bash
# Lancer l'interface Vite et la fenêtre Electron
npm run electron:dev

# Ou tester uniquement l'interface Web dans le navigateur :
npm run dev
```

### Build & Packaging
```bash
npm run electron:build
```

---

## 📁 Structure des Répertoires Locaux

LaraTool initialise automatiquement ses ressources dans votre répertoire utilisateur :
- `%USERPROFILE%\.config\laratool\bin\` : Shims pour le terminal (`php.bat`, `composer.bat`, `composer.phar`).
- `%USERPROFILE%\.config\laratool\php\` : Binaires PHP isolés (`php-8.1`, `php-8.2`, `php-8.3`, etc.).
- `%USERPROFILE%\.config\laratool\nginx\` : Serveur Nginx et configurations vhosts (`conf/conf.d/*.conf`).
- `%USERPROFILE%\.config\laratool\logs\` : Journaux d'exécution de Nginx et des services PHP FastCGI.
- `%USERPROFILE%\.config\laratool\config.json` : Préférences globales et dossiers surveillés.
