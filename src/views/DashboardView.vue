<template>
  <div class="p-8 space-y-8 max-w-7xl mx-auto w-full">
    <!-- Top Summary Banner -->
    <div class="relative overflow-hidden bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm group">
      <!-- Ambient decorative glow -->
      <div 
        class="absolute -right-20 -top-20 w-72 h-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-40 dark:opacity-20"
        :class="allRunning ? 'bg-emerald-500' : 'bg-rose-500'"
      ></div>

      <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-0">
        <div class="flex items-center gap-4">
          <div 
            class="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ring-4 transition-all duration-300"
            :class="allRunning 
              ? 'bg-emerald-500/15 text-emerald-500 ring-emerald-500/10 dark:ring-emerald-500/20' 
              : 'bg-slate-200/60 dark:bg-slate-800 text-slate-400 ring-slate-200/50 dark:ring-slate-800/50'"
          >
            <Server v-if="allRunning" class="w-6 h-6 animate-pulse" />
            <Square v-else class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {{ allRunning ? $t('dashboard.all_running_title') : $t('dashboard.all_stopped_title') }}
              </h3>
              <span 
                class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider"
                :class="allRunning ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-200/70 dark:bg-slate-800 text-slate-500'"
              >
                {{ allRunning ? $t('common.active') : $t('common.stopped') }}
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {{ allRunning ? $t('dashboard.all_running_desc') : $t('dashboard.all_stopped_desc') }}
            </p>
          </div>
        </div>

        <!-- Global Action Controls -->
        <div class="flex items-center gap-3">
          <button
            v-if="!allRunning"
            @click="$emit('start-all')"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-150"
          >
            <Play class="w-4 h-4 fill-current" />
            <span>{{ $t('dashboard.open_all') }}</span>
          </button>
          <button
            v-else
            @click="$emit('stop-all')"
            class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all duration-150"
          >
            <Square class="w-4 h-4 fill-current" />
            <span>{{ $t('dashboard.stop_all') }}</span>
          </button>
        </div>
      </div>

      <!-- Quick Metrics Counters -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-200/60 dark:border-white/[0.06]">
        <!-- Nginx Metric -->
        <div
          @click="$emit('go-tab', 'nginx')"
          class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span class="font-semibold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">{{ $t('sidebar.nginx_label') }}</span>
            <div class="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Server class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-base font-bold" :class="nginxRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'">
              {{ nginxRunning ? $t('common.active') : $t('common.stopped') }}
            </span>
            <span class="text-[10px] text-slate-400 font-mono">{{ isSsl ? '80/443 SSL' : 'Port 80' }}</span>
          </div>
        </div>

        <!-- PHP Metric -->
        <div
          @click="$emit('go-tab', 'php')"
          class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span class="font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{{ $t('sidebar.php_fastcgi') }}</span>
            <div class="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Cpu class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-base font-bold text-slate-900 dark:text-white">
              {{ activePhpCount }} <span class="text-xs font-normal text-slate-400">/ {{ phpVersions.length }}</span>
            </span>
            <span class="text-[10px] font-medium" :class="activePhpCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
              {{ activePhpCount > 0 ? $t('dashboard.online') : $t('common.inactive') }}
            </span>
          </div>
        </div>

        <!-- Services Metric -->
        <div
          @click="$emit('go-tab', 'services')"
          class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span class="font-semibold group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">{{ $t('sidebar.services') }}</span>
            <div class="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Layers class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-base font-bold text-slate-900 dark:text-white">
              {{ activeServicesCount }} <span class="text-xs font-normal text-slate-400">/ {{ services.length }}</span>
            </span>
            <span class="text-[10px] font-medium" :class="activeServicesCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
              {{ activeServicesCount > 0 ? $t('dashboard.online') : $t('common.stopped') }}
            </span>
          </div>
        </div>

        <!-- Projects Metric -->
        <div
          @click="$emit('go-tab', 'projects')"
          class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-white/[0.05] hover:border-rose-500/40 dark:hover:border-rose-500/40 transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <span class="font-semibold group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">{{ $t('sidebar.projects') }}</span>
            <div class="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <FolderGit2 class="w-3.5 h-3.5" />
            </div>
          </div>
          <div class="flex items-baseline justify-between">
            <span class="text-base font-bold text-slate-900 dark:text-white">
              {{ projects.length }}
            </span>
            <span class="text-[10px] text-slate-400">{{ $t('dashboard.detected') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert Hosts Warning Banner if unresolved hosts -->
    <div
      v-if="unresolvedHostsCount > 0"
      class="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-800 dark:text-amber-300 shadow-sm"
    >
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div>
          <div class="text-xs font-bold">{{ $t('dashboard.unresolved_hosts', { count: unresolvedHostsCount }) }}</div>
          <div class="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            {{ $t('dashboard.unresolved_hosts_desc') }}
          </div>
        </div>
      </div>
      <button
        @click="$emit('sync-all-hosts')"
        class="self-start sm:self-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition-all duration-150 flex items-center gap-1.5 active:scale-95"
      >
        <ShieldAlert class="w-3.5 h-3.5" />
        <span>{{ $t('dashboard.sync_hosts_btn', { count: unresolvedHostsCount }) }}</span>
      </button>
    </div>

    <!-- Main Grid: Core Services / Components Overview -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Nginx Web Server Card -->
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm card-hover">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Server class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Nginx</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('dashboard.nginx_desc') }}</p>
              </div>
            </div>
            <button
              @click="$emit('go-tab', 'nginx')"
              class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1 transition"
            >
              <span>{{ $t('common.manage') }}</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="space-y-2 text-xs">
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/[0.05]">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('dashboard.port_http') }}</span>
              <span class="font-mono font-bold text-slate-700 dark:text-slate-300">80</span>
            </div>
            <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/[0.05]">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('dashboard.port_https') }}</span>
              <span class="font-mono font-bold" :class="isSsl ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'">
                {{ isSsl ? $t('dashboard.https_active') : $t('dashboard.https_disabled') }}
              </span>
            </div>
          </div>
        </div>

        <div class="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <button
              v-if="!nginxRunning"
              @click="$emit('start-nginx')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition active:scale-95"
            >
              <Play class="w-3.5 h-3.5 fill-current" />
              <span>{{ $t('common.start') }}</span>
            </button>
            <button
              v-else
              @click="$emit('stop-nginx')"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold border border-rose-500/20 transition active:scale-95"
            >
              <Square class="w-3.5 h-3.5 fill-current" />
              <span>{{ $t('common.stop') }}</span>
            </button>
            <button
              v-if="nginxRunning"
              @click="$emit('reload-nginx')"
              class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition active:scale-95"
              :title="$t('dashboard.reload_nginx')"
            >
              <RotateCw class="w-3.5 h-3.5" />
            </button>
          </div>
          <span
            class="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full"
            :class="nginxRunning ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'"
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="nginxRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'"></span>
            {{ nginxRunning ? $t('dashboard.online') : $t('dashboard.offline') }}
          </span>
        </div>
      </div>

      <!-- PHP Runtimes Summary Card -->
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm card-hover">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                <Cpu class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('dashboard.php_card_title') }}</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('dashboard.installed_versions', { count: phpVersions.length }) }}</p>
              </div>
            </div>
            <button
              @click="$emit('go-tab', 'php')"
              class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1 transition"
            >
              <span>{{ $t('common.manage') }}</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <div
              v-for="php in phpVersions"
              :key="php.id"
              class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/[0.05] text-xs transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="php.running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
                <span class="font-semibold text-slate-900 dark:text-white">{{ php.name }}</span>
                <span v-if="php.isDefault" class="text-[9px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/20">{{ $t('common.default') }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[11px] text-slate-400">:{{ php.port }}</span>
                <button
                  v-if="!php.running"
                  @click="$emit('start-php', php.id)"
                  class="p-1 rounded-lg hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition"
                  :title="$t('common.start')"
                >
                  <Play class="w-3 h-3 fill-current" />
                </button>
                <button
                  v-else
                  @click="$emit('stop-php', php.id)"
                  class="p-1 rounded-lg hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 transition"
                  :title="$t('common.stop')"
                >
                  <Square class="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
            <div v-if="phpVersions.length === 0" class="text-center py-4 text-xs text-slate-400">
              {{ $t('dashboard.no_php_installed') }}
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{{ $t('dashboard.default_cli_label') }} <strong class="font-mono text-slate-800 dark:text-slate-200 font-bold">{{ defaultPhpLabel }}</strong></span>
          <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ activePhpCount }} {{ $t('common.actives') }}</span>
        </div>
      </div>

      <!-- Services & Data Summary Card -->
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm card-hover">
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Database class="w-5 h-5" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('dashboard.services_card_title') }}</h3>
                <p class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('dashboard.services_card_desc') }}</p>
              </div>
            </div>
            <button
              @click="$emit('go-tab', 'services')"
              class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold flex items-center gap-1 transition"
            >
              <span>{{ $t('common.manage') }}</span>
              <ChevronRight class="w-3.5 h-3.5" />
            </button>
          </div>

          <div class="space-y-1.5 max-h-44 overflow-y-auto pr-1">
            <div
              v-for="srv in services"
              :key="srv.id"
              class="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/60 dark:border-white/[0.05] text-xs transition hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="srv.running ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">{{ srv.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-[10px] text-slate-400">:{{ srv.port }}</span>
                <button
                  v-if="srv.webPort && srv.running"
                  @click="$emit('open-web', srv.id)"
                  class="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
                  :title="$t('services.open_web_ui')"
                >
                  <ExternalLink class="w-3 h-3" />
                </button>
                <button
                  v-if="srv.installed && !srv.running"
                  @click="$emit('start-service', srv.id)"
                  class="p-1 rounded-lg hover:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 transition"
                  :title="$t('common.start')"
                >
                  <Play class="w-3 h-3 fill-current" />
                </button>
                <button
                  v-else-if="srv.installed && srv.running"
                  @click="$emit('stop-service', srv.id)"
                  class="p-1 rounded-lg hover:bg-rose-500/15 text-rose-600 dark:text-rose-400 transition"
                  :title="$t('common.stop')"
                >
                  <Square class="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
            <div v-if="services.length === 0" class="text-center py-4 text-xs text-slate-400">
              {{ $t('dashboard.no_services_added') }}
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{{ $t('dashboard.services_configured', { count: services.length }) }}</span>
          <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ activeServicesCount }} {{ $t('common.actives') }}</span>
        </div>
      </div>
    </div>

    <!-- Projects Section -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="space-y-0.5">
          <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderGit2 class="w-4 h-4 text-rose-500" />
            <span>{{ $t('dashboard.recent_projects') }}</span>
          </h3>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('dashboard.recent_projects_desc') }}</p>
        </div>

        <button
          @click="$emit('go-tab', 'projects')"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition active:scale-95"
        >
          <span>{{ $t('dashboard.view_all_projects', { count: projects.length }) }}</span>
          <ChevronRight class="w-4 h-4" />
        </button>
      </div>

      <!-- Quick Projects Grid -->
      <div v-if="projects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="project in recentProjects"
          :key="project.path"
          class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm transition-all duration-200 hover:shadow-md card-hover"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3 min-w-0">
              <div 
                class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm"
                :class="project.isLaravel 
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400' 
                  : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400'"
              >
                {{ project.isLaravel ? 'L' : 'P' }}
              </div>
              <div class="min-w-0">
                <h4
                  @click="$emit('select-project', project); $emit('go-tab', 'projects')"
                  class="text-sm font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition"
                >
                  {{ project.name }}
                </h4>
                <div class="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1">
                  <Globe class="w-3 h-3 text-slate-400" />
                  <span>{{ project.domain }}</span>
                </div>
              </div>
            </div>

            <!-- SSL / Hosts Pills -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <span
                v-if="!project.inHosts"
                class="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap"
                :title="$t('dashboard.dns_unresolved')"
              >
                {{ $t('projects.dns_not_configured') }}
              </span>
              <span
                class="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                :class="project.isSsl ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'"
                :title="project.isSsl ? 'HTTPS' : 'HTTP'"
              >
                {{ project.isSsl ? 'SSL' : 'HTTP' }}
              </span>
            </div>
          </div>

          <!-- Project Metadata badges -->
          <div class="flex items-center gap-1.5 flex-wrap text-[11px]">
            <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium border border-slate-200/50 dark:border-white/[0.05]">
              PHP {{ project.phpVersion || $t('common.default') }}
            </span>
            <span v-if="project.nodeVersion" class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium border border-slate-200/50 dark:border-white/[0.05]">
              Node {{ project.nodeVersion }}
            </span>
            <span class="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-medium border border-slate-200/50 dark:border-white/[0.05]">
              {{ project.framework || 'PHP' }}
            </span>
          </div>

          <!-- Action buttons -->
          <div class="pt-2 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
            <button
              @click="$emit('open-browser', project.domain, project.isSsl)"
              class="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-500/20 transition active:scale-95"
              :title="$t('projects.open_browser')"
            >
              <Globe class="w-3.5 h-3.5" />
              <span>{{ $t('dashboard.open_site') }}</span>
            </button>

            <div class="flex items-center gap-1 text-slate-500 dark:text-slate-400">
              <button
                @click="$emit('open-terminal', project.path)"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
                :title="$t('common.terminal')"
              >
                <Terminal class="w-3.5 h-3.5" />
              </button>
              <button
                @click="$emit('open-editor', project.path)"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
                :title="$t('common.editor')"
              >
                <Code class="w-3.5 h-3.5" />
              </button>
              <button
                @click="$emit('open-explorer', project.path)"
                class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
                :title="$t('common.folder')"
              >
                <Folder class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty Projects State -->
      <div
        v-else
        class="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-10 text-center space-y-3"
      >
        <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
          <FolderGit2 class="w-7 h-7" />
        </div>
        <h4 class="text-sm font-bold text-slate-800 dark:text-white">{{ $t('dashboard.empty_projects_title') }}</h4>
        <p class="text-xs text-slate-500 max-w-sm mx-auto">
          {{ $t('dashboard.empty_projects_desc') }}
        </p>
        <button
          @click="$emit('go-tab', 'settings')"
          class="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition active:scale-95"
        >
          <span>{{ $t('dashboard.configure_folders') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { 
  Play, 
  Square, 
  RotateCw, 
  Server, 
  Cpu, 
  Layers, 
  FolderGit2, 
  Database,
  Globe, 
  Terminal, 
  Code, 
  Folder, 
  ChevronRight, 
  ExternalLink,
  ShieldAlert
} from 'lucide-vue-next';

const props = defineProps({
  projects: { type: Array, default: () => [] },
  phpVersions: { type: Array, default: () => [] },
  nodeVersions: { type: Array, default: () => [] },
  services: { type: Array, default: () => [] },
  nginxInstalled: { type: Boolean, default: false },
  nginxRunning: { type: Boolean, default: false },
  isSsl: { type: Boolean, default: false },
  allRunning: { type: Boolean, default: false },
  activePhpCount: { type: Number, default: 0 },
  activeServicesCount: { type: Number, default: 0 }
});

defineEmits([
  'go-tab',
  'select-project',
  'start-all',
  'stop-all',
  'refresh',
  'start-nginx',
  'stop-nginx',
  'reload-nginx',
  'start-php',
  'stop-php',
  'restart-php',
  'start-service',
  'stop-service',
  'open-web',
  'open-browser',
  'open-terminal',
  'open-editor',
  'open-explorer',
  'sync-all-hosts'
]);

const unresolvedHostsCount = computed(() => {
  return props.projects.filter(p => !p.inHosts).length;
});

const defaultPhpLabel = computed(() => {
  const def = props.phpVersions?.find(p => p.isDefault);
  return def ? `PHP ${def.id}` : (props.phpVersions?.[0] ? `PHP ${props.phpVersions[0].id}` : 'Non installé');
});

const recentProjects = computed(() => {
  return props.projects.slice(0, 6);
});
</script>
