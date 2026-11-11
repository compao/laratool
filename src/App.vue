<template>
  <div class="flex h-screen w-screen overflow-hidden bg-slate-100 dark:bg-slate-950 font-sans transition-colors duration-200">
    <!-- Sidebar -->
    <Sidebar
      :active-tab="activeTab"
      :projects-count="projects.length"
      :nginx-running="nginxRunning"
      :active-php-count="activePhpCount"
      :active-services-count="activeServicesCount"
      :is-ssl="isSslActive"
      :all-running="allRunning"
      :active-tunnels-count="activeTunnelsCount"
      @update:tab="onTabChange"
      @start-all="startAllServices"
      @stop-all="stopAllServices"
    />

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col h-full overflow-hidden">
      <Header
        :title="currentTabTitle.title"
        :subtitle="currentTabTitle.subtitle"
        :is-refreshing="isRefreshing"
        :downloading="currentDownload"
        :is-dark-mode="isDarkMode"
        @refresh="refreshAll"
        @toggle-theme="toggleTheme"
      />

      <main class="flex-1 overflow-y-auto flex flex-col">
        <!-- Dashboard View -->
        <DashboardView
          v-if="activeTab === 'dashboard'"
          :projects="projects"
          :php-versions="phpVersions"
          :node-versions="nodeVersions"
          :services="servicesList"
          :nginx-installed="nginxInstalled"
          :nginx-running="nginxRunning"
          :is-ssl="isSslActive"
          :all-running="allRunning"
          :active-php-count="activePhpCount"
          :active-services-count="activeServicesCount"
          @go-tab="onTabChange"
          @select-project="onSelectProject"
          @start-all="startAllServices"
          @stop-all="stopAllServices"
          @refresh="refreshAll"
          @start-nginx="onStartNginx"
          @stop-nginx="onStopNginx"
          @reload-nginx="onReloadNginx"
          @start-php="onStartPhp"
          @stop-php="onStopPhp"
          @restart-php="onRestartPhp"
          @start-service="onStartService"
          @stop-service="onStopService"
          @open-web="onOpenServiceWeb"
          @open-browser="onOpenBrowser"
          @open-terminal="onOpenTerminal"
          @open-editor="onOpenEditor"
          @open-explorer="onOpenExplorer"
          @sync-all-hosts="onSyncAllHosts"
        />

        <!-- Projects View (List, Dedicated Project Page, or New Project Creator Page) -->
        <template v-else-if="activeTab === 'projects'">
          <!-- 1. Dedicated Project Detail View -->
          <ProjectDetailView
            v-if="activeProject"
            :project="activeProject"
            :available-php="phpVersions"
            :available-node="nodeVersions"
            :nginx-running="nginxRunning"
            :is-ssl="isSslActive"
            :active-tunnels="activeTunnels"
            @tunnel-changed="refreshTunnels"
            @back="activeProject = null"
            @set-php="onSetProjectPhp"
            @set-node="onSetProjectNode"
            @toggle-ssl="onToggleProjectSsl"
            @open-browser="onOpenBrowser"
            @open-terminal="onOpenTerminal"
            @open-editor="onOpenEditor"
            @open-explorer="onOpenExplorer"
            @add-hosts="onAddHosts"
            @start-nginx="onStartNginx"
            @show-toast="showToast"
          />

          <!-- 2. Full Page Project Creator View -->
          <CreateProjectView
            v-else-if="isCreatingProject"
            :parked-paths="config.parkedPaths || []"
            :available-php="phpVersions"
            :available-node="nodeVersions"
            :default-php="config.defaultPhpVersion || '8.3'"
            @back="isCreatingProject = false"
            @project-created="onProjectCreated"
            @select-project="onSelectProject"
            @open-browser="onOpenBrowser"
            @open-editor="onOpenEditor"
            @open-explorer="onOpenExplorer"
            @show-toast="showToast"
          />

          <!-- 3. Projects List / Grid View -->
          <ProjectsView
            v-else
            :projects="projects"
            :available-php="phpVersions"
            :available-node="nodeVersions"
            :is-ssl="isSslActive"
            :active-tunnels="activeTunnels"
            @select-project="onSelectProject"
            @set-php="onSetProjectPhp"
            @set-node="onSetProjectNode"
            @toggle-ssl="onToggleProjectSsl"
            @open-browser="onOpenBrowser"
            @open-terminal="onOpenTerminal"
            @open-editor="onOpenEditor"
            @open-explorer="onOpenExplorer"
            @add-hosts="onAddHosts"
            @sync-all-hosts="onSyncAllHosts"
            @go-settings="activeTab = 'settings'"
            @open-create-modal="isCreatingProject = true"
          />
        </template>

        <!-- PHP Engines View -->
        <PhpView
          v-else-if="activeTab === 'php'"
          :versions="phpVersions"
          :is-checking-updates="isCheckingPhpUpdates"
          :updating-version="updatingPhpVersion"
          @install-php="onInstallPhp"
          @update-php="onUpdatePhp"
          @check-updates="onCheckPhpUpdates(false)"
          @start-php="onStartPhp"
          @stop-php="onStopPhp"
          @restart-php="onRestartPhp"
          @set-default="onSetDefaultPhp"
        />

        <!-- Node.js Runtimes View -->
        <NodeView
          v-else-if="activeTab === 'node'"
          :versions="nodeVersions"
          :is-checking-updates="isCheckingNodeUpdates"
          :updating-version="updatingNodeVersion"
          @install-node="onInstallNode"
          @update-node="onUpdateNode"
          @check-updates="onCheckNodeUpdates(false)"
          @set-default="onSetDefaultNode"
          @open-terminal="onOpenNodeTerminal"
        />

        <!-- Services View -->
        <ServicesView
          v-else-if="activeTab === 'services'"
          :services="servicesList"
          @start-service="onStartService"
          @stop-service="onStopService"
          @restart-service="onRestartService"
          @install-service="onInstallService"
          @set-service-version="onSetServiceVersion"
          @open-web="onOpenServiceWeb"
        />

        <!-- Nginx View -->
        <NginxView
          v-else-if="activeTab === 'nginx'"
          :is-installed="nginxInstalled"
          :is-running="nginxRunning"
          :is-ssl="isSslActive"
          :logs="nginxLogs"
          @install-nginx="onInstallNginx"
          @start-nginx="onStartNginx"
          @stop-nginx="onStopNginx"
          @reload-nginx="onReloadNginx"
          @fetch-logs="fetchNginxLogs"
        />

        <!-- Expose & Tunnels View -->
        <TunnelsView
          v-else-if="activeTab === 'expose'"
          :projects="projects"
          :active-tunnels="activeTunnels"
          :nginx-running="nginxRunning"
          @start-nginx="onStartNginx"
          @tunnel-changed="refreshTunnels"
          @show-toast="showToast"
        />

        <!-- Settings View -->
        <SettingsView
          v-else-if="activeTab === 'settings'"
          :config="config"
          :ssl-status="sslStatus"
          :available-php="phpVersions"
          :available-node="nodeVersions"
          :projects="projects"
          :is-refreshing="isRefreshing"
          :is-dark-mode="isDarkMode"
          @add-parked="onAddParkedPath"
          @remove-parked="onRemoveParkedPath"
          @update-config="onUpdateConfig"
          @toggle-ssl="onToggleSsl"
          @install-ca="onInstallCa"
          @set-default-php="onSetDefaultPhp"
          @set-default-node="onSetDefaultNode"
          @open-explorer="onOpenExplorer"
          @toggle-theme="toggleTheme"
          @rescan="refreshAll"
          @show-toast="showToast"
        />
      </main>

      <!-- Admin Permission Modal -->
      <AppModal :open="showAdminModal" max-width="lg" @close="showAdminModal = false">
        <template #header="{ titleId }">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-500 dark:text-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldAlert class="w-6 h-6" />
            </div>
            <div>
              <h3 :id="titleId" class="text-base font-bold text-slate-900 dark:text-white">{{ $t('admin_modal.title') }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('admin_modal.subtitle') }}</p>
            </div>
          </div>
          <button
            @click="showAdminModal = false"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 text-sm font-bold transition rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
            :aria-label="$t('common.close')"
          >✕</button>
        </template>

        <div class="space-y-4 text-xs text-slate-700 dark:text-slate-300 my-5">
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-white/[0.06] space-y-2.5">
            <div class="font-bold text-rose-500 dark:text-rose-400 flex items-center gap-2">
              <span>{{ $t('admin_modal.solution_title') }}</span>
            </div>
            <p class="text-slate-600 dark:text-slate-400">
              {{ $t('admin_modal.solution_desc') }}
            </p>
            <div class="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700/80 p-2.5 rounded-xl font-mono text-[11px] text-amber-700 dark:text-amber-300 select-all shadow-inner">
              <span class="flex-1 truncate">icacls "C:\Windows\System32\drivers\etc\hosts" /grant "*S-1-5-32-545:M"</span>
              <button
                @click="copyHostCommand"
                class="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg font-sans text-xs font-semibold transition active:scale-95 shadow-sm"
              >
                {{ copied ? $t('common.copied') : $t('common.copy') }}
              </button>
            </div>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50/60 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] space-y-1">
            <span class="font-bold text-slate-800 dark:text-slate-300">{{ $t('admin_modal.alt_solution_title') }}</span>
            <p class="text-slate-600 dark:text-slate-400">
              {{ $t('admin_modal.alt_solution_desc') }}
            </p>
          </div>
        </div>

        <template #footer>
          <div class="flex items-center justify-end gap-3">
            <AppButton variant="ghost" @click="showAdminModal = false">
              {{ $t('common.close') }}
            </AppButton>
            <AppButton variant="primary" @click="onRetrySyncHosts">
              {{ $t('admin_modal.retry_sync') }}
            </AppButton>
          </div>
        </template>
      </AppModal>

      <!-- Notification Center -->
      <NotificationCenter />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ShieldAlert } from 'lucide-vue-next';
import Sidebar from './components/Sidebar.vue';
import Header from './components/Header.vue';
import NotificationCenter from './components/NotificationCenter.vue';
import DashboardView from './views/DashboardView.vue';
import ProjectsView from './views/ProjectsView.vue';
import ProjectDetailView from './views/ProjectDetailView.vue';
import PhpView from './views/PhpView.vue';
import NodeView from './views/NodeView.vue';
import ServicesView from './views/ServicesView.vue';
import NginxView from './views/NginxView.vue';
import TunnelsView from './views/TunnelsView.vue';
import SettingsView from './views/SettingsView.vue';
import CreateProjectView from './views/CreateProjectView.vue';
import { AppModal, AppButton } from './components/ui';
import { useI18n } from './i18n';
import { useNotifications } from './composables/useNotifications';

const { t } = useI18n();
const { notify, notifyError } = useNotifications();

// Safe wrapper for electron API
const api = window.laratool || {
  php: {
    list: async () => [],
    getCatalog: async () => [],
    getDetails: async () => null,
    openIni: () => {},
    openFolder: () => {},
    openTerminal: () => {},
    toggle: async () => true,
    setPort: async () => true,
    install: async () => true,
    start: async () => true,
    stop: async () => true,
    restart: async () => true,
    setDefault: async () => true,
    toggleExtension: async () => true,
    toggleXdebug: async () => true,
    updateIniDirective: async () => true
  },
  node: {
    list: async () => [],
    getCatalog: async () => [],
    toggle: async () => true,
    install: async () => true,
    setDefault: async () => true,
    openTerminal: async () => true
  },
  services: {
    list: async () => [
      { id: 'mysql', name: 'MySQL / MariaDB', port: 3306, installed: true, running: true, envSnippet: 'DB_CONNECTION=mysql\nDB_HOST=127.0.0.1\nDB_PORT=3306\nDB_USERNAME=root\nDB_PASSWORD=' },
      { id: 'postgres', name: 'PostgreSQL', port: 5432, installed: false, running: false, envSnippet: 'DB_CONNECTION=pgsql\nDB_HOST=127.0.0.1\nDB_PORT=5432\nDB_USERNAME=postgres\nDB_PASSWORD=' },
      { id: 'redis', name: 'Redis (Cache & Queues)', port: 6379, installed: true, running: true, envSnippet: 'CACHE_STORE=redis\nQUEUE_CONNECTION=redis\nREDIS_HOST=127.0.0.1\nREDIS_PORT=6379' },
      { id: 'mailpit', name: 'Mailpit (Email Catcher)', port: 1025, webPort: 8025, installed: true, running: true, envSnippet: 'MAIL_MAILER=smtp\nMAIL_HOST=127.0.0.1\nMAIL_PORT=1025' },
      { id: 'meilisearch', name: 'Meilisearch (Laravel Scout)', port: 7700, installed: false, running: false, envSnippet: 'SCOUT_DRIVER=meilisearch\nMEILISEARCH_HOST=http://127.0.0.1:7700' },
      { id: 'minio', name: 'SeaweedFS (S3 Object Storage)', port: 8333, webPort: 8888, installed: false, running: false, envSnippet: 'FILESYSTEM_DISK=s3\nAWS_ACCESS_KEY_ID=any\nAWS_SECRET_ACCESS_KEY=any\nAWS_DEFAULT_REGION=us-east-1\nAWS_BUCKET=local-bucket\nAWS_USE_PATH_STYLE_ENDPOINT=true\nAWS_ENDPOINT=http://127.0.0.1:8333' }
    ],
    install: async () => true,
    setVersion: async () => true,
    start: async () => true,
    stop: async () => true,
    restart: async () => true,
    createDb: async () => ({ success: true }),
    openWeb: () => {}
  },
  nginx: {
    isInstalled: async () => true,
    install: async () => true,
    isRunning: async () => true,
    start: async () => true,
    stop: async () => true,
    reload: async () => true,
    getLogs: async () => ['[2026-09-23] Nginx worker started successfully'],
    openConfig: () => {},
    openConfD: () => {},
    openSiteConfig: () => {},
    openFolder: () => {},
    listSiteConfigs: async () => []
  },
  system: {
    openInEditor: () => {},
    openInExplorer: () => {},
    openExternal: (url) => { window.open(url, '_blank'); }
  },
  projects: {
    scan: async () => [
      { name: 'laratool', domain: 'laratool.test', path: 'C:\\Users\\abdou\\Projects\\laratool', isLaravel: true, framework: 'Laravel', frameworkVersion: '^11.0', phpVersion: '8.3', nodeVersion: '20', inHosts: true, isSsl: false }
    ],
    setPhp: async () => [],
    setNode: async () => [],
    setSsl: async () => [],
    openExplorer: () => {},
    openEditor: () => {},
    openTerminal: () => {},
    openBrowser: () => {},
    runCommand: async () => ({ success: true, stdout: 'Command executed.' }),
    installPackage: async () => ({ success: true, stdout: 'Package installed.' }),
    getLogs: async () => ({ exists: true, files: [{ name: 'laravel.log', size: 1024, sizeFormatted: '1 Ko', updatedAt: new Date().toISOString() }], selectedFile: 'laravel.log', fileSize: 1024, fileSizeFormatted: '1 Ko', updatedAt: new Date().toISOString(), entries: [], stats: { total: 0, errors: 0, warnings: 0, infos: 0, debugs: 0 } }),
    clearLog: async () => ({ success: true }),
    openLogFile: () => {},
    openLogsFolder: () => {},
    openDatabase: async () => ({ success: true }),
    getDbInfo: async () => ({ connection: 'sqlite', database: 'database/database.sqlite', isSqlite: true, exists: true }),
    validateNew: async (name, parkedPath) => ({ valid: true, name, domain: `${name}.test`, projectPath: `C:\\Users\\abdou\\Projects\\${name}` }),
    create: async (options) => ({ success: true, project: { name: options.name, domain: `${options.name}.test`, path: `C:\\Users\\abdou\\Projects\\${options.name}`, isLaravel: true, framework: 'Laravel', frameworkVersion: '^11.0', phpVersion: options.phpVersion || '8.3', nodeVersion: '20', inHosts: true, isSsl: options.enableSsl } }),
    getAbout: async () => ({
      isLaravel: true,
      storageLinked: true,
      data: {
        environment: {
          application_name: 'AGREMENTS',
          laravel_version: '10.50.2',
          php_version: '8.3.26',
          composer_version: '2.10.3',
          environment: 'local',
          debug_mode: true,
          url: 'agrements-dev.test',
          maintenance_mode: false,
          timezone: 'UTC',
          locale: 'fr'
        },
        cache: {
          config: false,
          events: false,
          routes: false,
          views: true
        },
        drivers: {
          broadcasting: 'log',
          cache: 'file',
          database: 'pgsql',
          logs: ['single'],
          mail: 'smtp',
          queue: 'sync',
          session: 'file'
        },
        livewire: {
          livewire: 'v3.8.3'
        }
      }
    }),
    toggleMaintenance: async () => ({ success: true }),
    clearCaches: async () => ({ success: true }),
    optimizeCaches: async () => ({ success: true }),
    createStorageLink: async () => ({ success: true })
  },
  config: {
    get: async () => ({ parkedPaths: ['C:\\Users\\abdou\\OneDrive\\Documents\\Projects'], defaultPhpVersion: '8.3' }),
    save: async () => {},
    selectDirectory: async () => null,
    addParkedPath: async () => [],
    removeParkedPath: async () => []
  },
  hosts: {
    addDomain: async () => true
  },
  tunnels: {
    getProviders: async () => [
      { id: 'cloudflare', name: 'Cloudflare Tunnel', description: '100% Gratuit, sans compte ni token', installed: false, badge: 'Recommandé', hasAuthToken: true },
      { id: 'ngrok', name: 'Ngrok', description: 'Tunnel rapide avec authtoken', installed: true, badge: 'Détecté sur votre PC', hasAuthToken: false }
    ],
    downloadCloudflared: async () => ({ success: true }),
    start: async (name, domain, provider) => ({ success: true, url: `https://${name}-demo.trycloudflare.com`, provider, domain }),
    stop: async () => ({ success: true }),
    get: async () => null,
    list: async () => [],
    getNgrokAuthStatus: async () => ({ installed: true, configured: false }),
    setNgrokAuthToken: async () => ({ success: true }),
    getLogs: async () => [],
    clearLogs: async () => ({ success: true }),
    ping: async () => ({ success: true, status: 200, latencyMs: 85 }),
    onStatusChanged: () => () => {},
    onLog: () => () => {}
  },
  ssl: {
    getStatus: async () => ({ enabled: false, hasMkcert: false, caInstalled: false, wildcardReady: false }),
    toggle: async (enabled) => ({ enabled, hasMkcert: true, caInstalled: true, wildcardReady: true }),
    installCa: async () => ({ success: true })
  },
  window: {
    setTheme: () => {}
  },
  onDownloadProgress: () => {},
  onProjectCreateProgress: () => () => {},
  onAppError: () => () => {}
};

const activeTab = ref('dashboard');
const activeProject = ref(null);
const isRefreshing = ref(false);
const currentDownload = ref(null);
const showAdminModal = ref(false);
const copied = ref(false);
const isDarkMode = ref(true);
const activeTunnels = ref({});
const isCreatingProject = ref(false);

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('laratool_theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('laratool_theme', 'light');
  }
  if (api.window && api.window.setTheme) {
    api.window.setTheme(isDarkMode.value);
  }
}

const projects = ref([]);
const phpVersions = ref([]);
const phpCatalog = ref([]);
const nodeVersions = ref([]);
const nodeCatalog = ref([]);
const isCheckingPhpUpdates = ref(false);
const isCheckingNodeUpdates = ref(false);
const updatingPhpVersion = ref(null);
const updatingNodeVersion = ref(null);
const servicesList = ref([]);
const catalogList = ref([]);
const nginxInstalled = ref(false);
const nginxRunning = ref(false);
const nginxLogs = ref([]);
const config = ref({});
const sslStatus = ref({ enabled: false, caInstalled: false, wildcardReady: false, httpsPort: 443 });

const isSslActive = computed(() => {
  return !!(sslStatus.value?.enabled && sslStatus.value?.wildcardReady);
});

const activeTunnelsCount = computed(() => {
  return Object.keys(activeTunnels.value || {}).length;
});

const tabTitles = computed(() => ({
  dashboard: { title: t('tabs.dashboard.title'), subtitle: t('tabs.dashboard.subtitle') },
  projects: { title: t('tabs.projects.title'), subtitle: t('tabs.projects.subtitle') },
  expose: { title: t('tabs.expose.title'), subtitle: t('tabs.expose.subtitle') },
  php: { title: t('tabs.php.title'), subtitle: t('tabs.php.subtitle') },
  node: { title: t('tabs.node.title'), subtitle: t('tabs.node.subtitle') },
  services: { title: t('tabs.services.title'), subtitle: t('tabs.services.subtitle') },
  nginx: { title: t('tabs.nginx.title'), subtitle: t('tabs.nginx.subtitle') },
  settings: { title: t('tabs.settings.title'), subtitle: t('tabs.settings.subtitle') }
}));

function onTabChange(tab) {
  if (tab !== 'projects') {
    isCreatingProject.value = false;
  }
  if (tab === 'projects' && activeTab.value === 'projects') {
    activeProject.value = null;
    isCreatingProject.value = false;
  }
  activeTab.value = tab;
}

function onSelectProject(proj) {
  activeProject.value = proj;
  isCreatingProject.value = false;
}

async function onProjectCreated(newProj) {
  isCreatingProject.value = false;
  await refreshAll();
  if (newProj) {
    activeTab.value = 'projects';
    const found = projects.value.find(p => p.path === newProj.path || p.name === newProj.name);
    activeProject.value = found || newProj;
  }
}

const currentTabTitle = computed(() => {
  if (activeTab.value === 'projects') {
    if (activeProject.value) {
      return {
        title: activeProject.value.name,
        subtitle: `${activeProject.value.isSsl ? 'https' : 'http'}://${activeProject.value.domain} • ${activeProject.value.framework} ${activeProject.value.frameworkVersion || ''}`
      };
    }
    if (isCreatingProject.value) {
      return {
        title: t('projects.new_project'),
        subtitle: t('tabs.projects.subtitle')
      };
    }
  }
  return tabTitles.value[activeTab.value] || tabTitles.value.dashboard;
});

const activePhpCount = computed(() => {
  return phpVersions.value.filter(p => p.running).length;
});

const activeServicesCount = computed(() => {
  return servicesList.value.filter(s => s.running).length;
});

const allRunning = computed(() => {
  return nginxRunning.value && activePhpCount.value > 0;
});

function showToast(messageOrObj, type = 'success') {
  return notify(messageOrObj, type);
}

async function refreshTunnels() {
  try {
    if (api.tunnels && api.tunnels.list) {
      const list = await api.tunnels.list();
      const map = {};
      if (Array.isArray(list)) {
        list.forEach(t => {
          map[t.projectName] = t;
        });
      }
      activeTunnels.value = map;
    }
  } catch (err) {
    console.warn('Erreur refreshTunnels:', err);
  }
}

async function refreshAll() {
  isRefreshing.value = true;
  try {
    const [cfg, phps, phpCat, nodes, nodeCat, srvs, ctl, sites, nInstalled, nRunning, ssl] = await Promise.all([
      api.config.get(),
      api.php.list(),
      api.php.getCatalog ? api.php.getCatalog() : Promise.resolve([]),
      api.node && api.node.list ? api.node.list() : Promise.resolve([]),
      api.node && api.node.getCatalog ? api.node.getCatalog() : Promise.resolve([]),
      api.services.list(),
      api.services.getCatalog ? api.services.getCatalog() : Promise.resolve([]),
      api.projects.scan(),
      api.nginx.isInstalled(),
      api.nginx.isRunning(),
      api.ssl && api.ssl.getStatus ? api.ssl.getStatus() : Promise.resolve({ enabled: false })
    ]);
    config.value = cfg;
    phpVersions.value = phps;
    phpCatalog.value = phpCat || [];
    nodeVersions.value = nodes || [];
    nodeCatalog.value = nodeCat || [];
    servicesList.value = srvs;
    catalogList.value = ctl || [];
    projects.value = sites;
    sslStatus.value = ssl || { enabled: false };
    if (activeProject.value && Array.isArray(sites)) {
      const found = sites.find(p => p.path === activeProject.value.path);
      if (found) activeProject.value = found;
    }
    nginxInstalled.value = nInstalled;
    nginxRunning.value = nRunning;
    await refreshTunnels();
  } catch (err) {
    showToast(t('toasts.refresh_error', { error: err.message }), 'error');
  } finally {
    isRefreshing.value = false;
  }
}

async function startAllServices() {
  try {
    const def = config.value.defaultPhpVersion || '8.3';
    const needed = new Set([def]);
    projects.value.forEach(p => {
      if (p.phpVersion) needed.add(p.phpVersion);
    });

    for (const ver of needed) {
      const isInst = phpVersions.value.find(pv => pv.id === ver)?.installed;
      if (isInst) {
        await api.php.start(ver);
      }
    }

    if (nginxInstalled.value) {
      await api.nginx.start();
    }
    showToast(t('toasts.env_started'));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function stopAllServices() {
  try {
    await Promise.all([
      api.nginx.stop(),
      ...phpVersions.value.map(p => api.php.stop(p.id))
    ]);
    showToast(t('toasts.env_stopped'));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// PHP Actions
async function onInstallPhp(payload) {
  const version = typeof payload === 'object' ? payload.version : payload;
  const port = typeof payload === 'object' ? payload.port : null;
  try {
    showToast(t('toasts.php_downloading', { version }));
    await api.php.install(version, { port });
    currentDownload.value = null;
    showToast(t('toasts.php_installed', { version }));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.php_install_error', { version, error: err.message }), 'error');
  }
}

async function onTogglePhp(payload) {
  const { version, enabled, port } = payload;
  try {
    await api.php.toggle(version, enabled, { port });
    showToast(enabled ? t('toasts.php_toggled_on', { version, port }) : t('toasts.php_toggled_off', { version }));
    await refreshAll();
  } catch (err) {
    showToast(t('toasts.php_toggle_error', { version, error: err.message }), 'error');
  }
}

async function onStartPhp(version) {
  try {
    await api.php.start(version);
    showToast(t('toasts.php_started', { version }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onStopPhp(version) {
  try {
    await api.php.stop(version);
    showToast(t('toasts.php_stopped', { version }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onRestartPhp(version) {
  try {
    await api.php.restart(version);
    showToast(t('toasts.php_restarted', { version }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onSetDefaultPhp(version) {
  try {
    await api.php.setDefault(version);
    showToast(t('toasts.php_default_set', { version }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onCheckPhpUpdates(silent = false) {
  if (!api.php?.checkUpdates || isCheckingPhpUpdates.value) return;
  isCheckingPhpUpdates.value = true;
  try {
    const res = await api.php.checkUpdates();
    await refreshAll();
    if (!silent) {
      const count = res?.updatesAvailableCount || 0;
      showToast(count > 0 ? t('toasts.php_updates_found', { count }) : t('toasts.php_up_to_date'));
    }
  } catch (err) {
    if (!silent) {
      showToast(t('toasts.php_check_updates_error', { error: err.message }), 'error');
    }
  } finally {
    isCheckingPhpUpdates.value = false;
  }
}

async function onUpdatePhp(version) {
  if (!api.php?.update || updatingPhpVersion.value) return;
  updatingPhpVersion.value = version;
  try {
    showToast(t('toasts.php_updating', { version }));
    await api.php.update(version);
    currentDownload.value = null;
    showToast(t('toasts.php_updated', { version }));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.php_update_error', { version, error: err.message }), 'error');
  } finally {
    updatingPhpVersion.value = null;
  }
}

// Node.js Actions
async function onInstallNode(version) {
  try {
    showToast(t('toasts.node_downloading', { version }));
    await api.node.install(version);
    currentDownload.value = null;
    showToast(t('toasts.node_installed', { version }));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.node_install_error', { version, error: err.message }), 'error');
  }
}

async function onCheckNodeUpdates(silent = false) {
  if (!api.node?.checkUpdates || isCheckingNodeUpdates.value) return;
  isCheckingNodeUpdates.value = true;
  try {
    const res = await api.node.checkUpdates();
    await refreshAll();
    if (!silent) {
      const count = res?.updatesAvailableCount || 0;
      showToast(count > 0 ? t('toasts.node_updates_found', { count }) : t('toasts.node_up_to_date'));
    }
  } catch (err) {
    if (!silent) {
      showToast(t('toasts.node_check_updates_error', { error: err.message }), 'error');
    }
  } finally {
    isCheckingNodeUpdates.value = false;
  }
}

async function onUpdateNode(version) {
  if (!api.node?.update || updatingNodeVersion.value) return;
  updatingNodeVersion.value = version;
  try {
    showToast(t('toasts.node_updating', { version }));
    await api.node.update(version);
    currentDownload.value = null;
    showToast(t('toasts.node_updated', { version }));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.node_update_error', { version, error: err.message }), 'error');
  } finally {
    updatingNodeVersion.value = null;
  }
}

async function onToggleNode({ version, enabled }) {
  try {
    await api.node.toggle(version, enabled);
    showToast(enabled ? t('toasts.node_toggled_on', { version }) : t('toasts.node_toggled_off', { version }));
    await refreshAll();
  } catch (err) {
    showToast(t('toasts.node_toggle_error', { version, error: err.message }), 'error');
  }
}

async function onSetDefaultNode(version) {
  try {
    await api.node.setDefault(version);
    showToast(t('toasts.node_default_set', { version }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function onOpenNodeTerminal(version) {
  api.node.openTerminal(version);
}

// Services Actions (MySQL, Postgres, Redis, Mailpit, Meilisearch, SeaweedFS)
async function onInstallService(payload) {
  const id = typeof payload === 'object' ? payload.id : payload;
  const version = typeof payload === 'object' ? payload.version : null;
  const label = version ? `${id} (${version})` : id;
  try {
    showToast(t('toasts.service_downloading', { label }));
    await api.services.install(id, version);
    currentDownload.value = null;
    showToast(t('toasts.service_installed', { label }));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.service_install_error', { label, error: err.message }), 'error');
  }
}

async function onSetServiceVersion({ id, version }) {
  try {
    showToast(t('toasts.service_switching', { id, version }));
    await api.services.setVersion(id, version);
    showToast(t('toasts.service_switched', { id, version }));
    await refreshAll();
  } catch (err) {
    showToast(t('toasts.service_switch_error', { error: err.message }), 'error');
  }
}

async function onStartService(id) {
  try {
    await api.services.start(id);
    showToast(t('toasts.service_started', { id }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onStopService(id) {
  try {
    await api.services.stop(id);
    showToast(t('toasts.service_stopped', { id }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onRestartService(id) {
  try {
    await api.services.restart(id);
    showToast(t('toasts.service_restarted', { id }));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function onOpenServiceWeb(id) {
  api.services.openWeb(id);
}

async function onToggleService(payload) {
  const { id, enabled, version, port } = payload;
  try {
    await api.services.toggle(id, enabled, { version, port });
    showToast(enabled ? t('toasts.service_pinned') : t('toasts.service_unpinned'));
    await refreshAll();
  } catch (err) {
    showToast(t('toasts.service_toggle_error', { error: err.message }), 'error');
  }
}

async function onCreateDatabase(payload) {
  const type = typeof payload === 'object' ? (payload.type || 'mysql') : 'mysql';
  const dbName = typeof payload === 'object' ? payload.name : payload;
  const labels = {
    mysql: 'MySQL / MariaDB',
    postgres: 'PostgreSQL',
    mongodb: 'MongoDB',
    couchdb: 'CouchDB'
  };
  try {
    const res = await api.services.createDb(type, dbName);
    const targetLabel = labels[type] || type;
    showToast(res?.note ? `${dbName}: ${res.note}` : t('toasts.db_created', { name: dbName, target: targetLabel }));
  } catch (err) {
    showToast(t('toasts.db_create_error', { target: labels[type] || type, error: err.message }), 'error');
  }
}

// Nginx Actions
async function onInstallNginx() {
  try {
    showToast(t('toasts.nginx_downloading'));
    await api.nginx.install();
    currentDownload.value = null;
    showToast(t('toasts.nginx_installed'));
    await refreshAll();
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.nginx_install_error', { error: err.message }), 'error');
  }
}

async function onStartNginx() {
  try {
    await api.nginx.start();
    showToast(t('toasts.nginx_started'));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onStopNginx() {
  try {
    await api.nginx.stop();
    showToast(t('toasts.nginx_stopped'));
    await refreshAll();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onReloadNginx() {
  try {
    await api.nginx.reload();
    showToast(t('toasts.nginx_reloaded'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function fetchNginxLogs() {
  try {
    nginxLogs.value = await api.nginx.getLogs();
  } catch (err) {
    console.error(err);
  }
}

// Project Actions
async function onSetProjectPhp({ projectPath, version }) {
  try {
    projects.value = await api.projects.setPhp(projectPath, version);
    if (activeProject.value && activeProject.value.path === projectPath) {
      const updated = projects.value.find(p => p.path === projectPath);
      if (updated) activeProject.value = updated;
    }
    showToast(t('toasts.project_php_updated', { version }));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onSetProjectNode({ projectPath, version }) {
  try {
    projects.value = await api.projects.setNode(projectPath, version);
    if (activeProject.value && activeProject.value.path === projectPath) {
      const updated = projects.value.find(p => p.path === projectPath);
      if (updated) activeProject.value = updated;
    }
    showToast(version ? t('toasts.project_node_updated', { version }) : t('toasts.project_node_system'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onToggleProjectSsl({ projectPath, domain, enabled }) {
  try {
    showToast(enabled ? t('toasts.project_ssl_enabling', { domain }) : t('toasts.project_ssl_disabling', { domain }));
    projects.value = await api.projects.setSsl(projectPath, enabled);
    if (activeProject.value && activeProject.value.path === projectPath) {
      const updated = projects.value.find(p => p.path === projectPath);
      if (updated) activeProject.value = updated;
    }
    showToast(enabled ? t('toasts.project_ssl_enabled', { domain }) : t('toasts.project_ssl_disabled', { domain }));
  } catch (err) {
    showToast(t('toasts.project_ssl_error', { error: err.message }), 'error');
  }
}

function onOpenBrowser(domain, ssl = null) {
  if (typeof domain === 'object' && domain !== null) {
    const targetDomain = domain.domain;
    const shouldUseSsl = domain.isSsl !== undefined ? !!domain.isSsl : isSslActive.value;
    api.projects.openBrowser(targetDomain, shouldUseSsl);
    return;
  }
  const shouldUseSsl = ssl !== null ? !!ssl : isSslActive.value;
  api.projects.openBrowser(domain, shouldUseSsl);
}

// SSL Actions
async function onToggleSsl(enabled) {
  try {
    showToast(enabled ? t('toasts.ssl_enabling') : t('toasts.ssl_disabling'));
    const res = await api.ssl.toggle(enabled);
    sslStatus.value = res;
    currentDownload.value = null;
    await refreshAll();
    showToast(enabled ? t('toasts.ssl_enabled') : t('toasts.ssl_disabled'));
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.ssl_error', { error: err.message }), 'error');
  }
}

async function onInstallCa() {
  try {
    showToast(t('toasts.ca_installing'));
    await api.ssl.installCa();
    currentDownload.value = null;
    await refreshAll();
    showToast(t('toasts.ca_installed'));
  } catch (err) {
    currentDownload.value = null;
    showToast(t('toasts.ca_error', { error: err.message }), 'error');
  }
}

function onOpenTerminal(projectPath) {
  api.projects.openTerminal(projectPath);
}

function onOpenEditor(projectPath) {
  api.projects.openEditor(projectPath);
}

function onOpenExplorer(projectPath) {
  api.projects.openExplorer(projectPath);
}

async function onAddHosts(domain) {
  try {
    const res = await api.hosts.addDomain(domain);
    if (res.success) {
      showToast(t('toasts.host_added', { domain }));
      await refreshAll();
    } else {
      showAdminModal.value = true;
    }
  } catch (err) {
    showAdminModal.value = true;
  }
}

function copyHostCommand() {
  navigator.clipboard.writeText('icacls "C:\\Windows\\System32\\drivers\\etc\\hosts" /grant "*S-1-5-32-545:M"');
  copied.value = true;
  setTimeout(() => { copied.value = false; }, 2500);
}

async function onRetrySyncHosts() {
  showAdminModal.value = false;
  await onSyncAllHosts();
}

async function onSyncAllHosts() {
  try {
    const domains = projects.value.map(p => p.domain);
    showToast(t('toasts.hosts_syncing'));
    const res = await api.hosts.syncAll(domains);
    if (res.success) {
      showToast(t('toasts.hosts_synced'));
      await refreshAll();
    } else {
      showAdminModal.value = true;
    }
  } catch (err) {
    showToast(err.message, 'error');
    showAdminModal.value = true;
  }
}

// Settings Actions
async function onAddParkedPath() {
  try {
    const selected = await api.config.selectDirectory();
    if (selected) {
      projects.value = await api.config.addParkedPath(selected);
      config.value = await api.config.get();
      showToast(t('toasts.folder_added', { path: selected }));
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onRemoveParkedPath(targetPath) {
  try {
    projects.value = await api.config.removeParkedPath(targetPath);
    config.value = await api.config.get();
    showToast(t('toasts.folder_removed', { path: targetPath }));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function onUpdateConfig(newCfg) {
  try {
    await api.config.save(newCfg);
    config.value = await api.config.get();
    showToast(t('toasts.settings_saved'));
  } catch (err) {
    showToast(err.message, 'error');
  }
}

onMounted(() => {
  const savedTheme = localStorage.getItem('laratool_theme');
  if (savedTheme === 'light') {
    isDarkMode.value = false;
    document.documentElement.classList.remove('dark');
  } else {
    isDarkMode.value = true;
    document.documentElement.classList.add('dark');
  }

  if (api.window && api.window.setTheme) {
    api.window.setTheme(isDarkMode.value);
  }

  refreshAll().then(() => {
    onCheckPhpUpdates(true);
    onCheckNodeUpdates(true);
  });
  fetchNginxLogs();

  api.onDownloadProgress((data) => {
    currentDownload.value = data;
    if (data && data.percent >= 100) {
      setTimeout(() => {
        if (currentDownload.value?.percent >= 100) {
          currentDownload.value = null;
        }
      }, 1500);
    }
  });

  if (api.tunnels && api.tunnels.onStatusChanged) {
    api.tunnels.onStatusChanged((data) => {
      refreshTunnels();
      if (data && !data.isRunning && data.exitCode && data.exitCode !== 0) {
        showToast(t('toasts.tunnel_crashed', { name: data.projectName, code: data.exitCode }), 'error');
      }
    });
  }

  if (api.onAppError) {
    api.onAppError((errData) => {
      notifyError(errData, t('errors.unexpected_title'));
    });
  }
});
</script>
