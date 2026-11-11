<template>
  <div v-if="project" class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
    <!-- Top Action Bar & Identity -->
    <div class="px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex items-center justify-between gap-4 flex-shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Back Button -->
        <button
          @click="$emit('back')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700/80 transition shadow-sm flex-shrink-0"
          :title="$t('projects.all_projects')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ $t('projects.all_projects') }}</span>
        </button>

        <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

        <!-- Project Identity -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            {{ project.isLaravel ? 'L' : 'P' }}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
              <span class="flex items-center gap-1.5 font-bold text-sm" :class="project.isSsl ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-200'">
                <Lock v-if="project.isSsl" class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <Globe v-else class="w-3.5 h-3.5 text-slate-400" />
                {{ project.isSsl ? 'https://' : 'http://' }}{{ project.domain }}
              </span>
              <span class="text-slate-400 dark:text-slate-600">•</span>
              <span class="text-slate-400 dark:text-slate-500 truncate text-xs" :title="project.path">{{ project.path }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          @click="$emit('open-terminal', project.path)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
          :title="$t('projects.open_terminal')"
        >
          <Terminal class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
          <span class="hidden sm:inline">{{ $t('common.terminal') }}</span>
        </button>

        <button
          @click="$emit('open-editor', project.path)"
          class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-300 dark:border-slate-700 transition"
          :title="$t('projects.open_editor')"
        >
          <Code class="w-4 h-4" />
        </button>

        <button
          @click="$emit('open-explorer', project.path)"
          class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
          :title="$t('projects.open_folder')"
        >
          <Folder class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Project Tab Navigation Bar -->
    <div class="px-8 bg-white dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0 select-none">
      <div class="flex items-center gap-1">
        <button
          @click="activeDetailTab = 'overview'"
          class="flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition relative"
          :class="activeDetailTab === 'overview'
            ? 'border-rose-500 text-rose-600 dark:text-white bg-rose-50/50 dark:bg-slate-800/40'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/20'"
        >
          <LayoutDashboard class="w-4 h-4" :class="activeDetailTab === 'overview' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'" />
          <span>{{ $t('projects.overview') }}</span>
        </button>

        <button
          @click="activeDetailTab = 'packages'"
          class="flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition relative"
          :class="activeDetailTab === 'packages'
            ? 'border-rose-500 text-rose-600 dark:text-white bg-rose-50/50 dark:bg-slate-800/40'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/20'"
        >
          <Package class="w-4 h-4" :class="activeDetailTab === 'packages' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'" />
          <span>{{ $t('projects.composer_packages') }}</span>
          <span
            v-if="totalPackagesCount > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono border border-slate-200 dark:border-slate-700/60"
          >
            {{ totalPackagesCount }}
          </span>
        </button>

        <button
          @click="activeDetailTab = 'logs'"
          class="flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition relative"
          :class="activeDetailTab === 'logs'
            ? 'border-rose-500 text-rose-600 dark:text-white bg-rose-50/50 dark:bg-slate-800/40'
            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/20'"
        >
          <ScrollText class="w-4 h-4" :class="activeDetailTab === 'logs' ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'" />
          <span>{{ $t('projects.logs_errors') }}</span>
        </button>
      </div>

      <!-- Right Action Controls in Tab Bar: Expose Toggle, PHP & HTTPS -->
      <div class="flex items-center gap-3 text-xs font-mono">
        <!-- Expose Tunnel Toggle Button -->
        <button
          type="button"
          @click="toggleProjectTunnel"
          :disabled="isStartingTunnel || isStoppingTunnel || !nginxRunning"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer shadow-2xs disabled:opacity-50"
          :class="currentTunnel
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'"
          :title="currentTunnel ? 'Tunnel public actif. Cliquer pour fermer' : 'Exposer ce projet sur Internet (HTTPS)'"
        >
          <RefreshCw v-if="isStartingTunnel || isStoppingTunnel" class="w-3.5 h-3.5 animate-spin" />
          <Radio v-else-if="currentTunnel" class="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
          <Globe v-else class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
          
          <span class="font-medium font-sans">{{ currentTunnel ? 'En ligne' : 'Exposer' }}</span>
          <span v-if="currentTunnel" class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
        </button>

        <span class="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>

        <span class="hidden sm:flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
          <Cpu class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
          <span>PHP {{ project.phpVersion || '8.3' }}</span>
        </span>
        <span class="hidden sm:inline text-slate-300 dark:text-slate-700">•</span>
        <button
          type="button"
          @click="$emit('toggle-ssl', { projectPath: project.path, domain: project.domain, enabled: !project.isSsl })"
          class="p-1.5 rounded-lg border transition cursor-pointer flex items-center justify-center shadow-sm"
          :class="project.isSsl
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'"
          :title="project.isSsl ? 'HTTPS actif (sécurisé via mkcert). Cliquer pour repasser en HTTP' : 'HTTP actif (non sécurisé). Cliquer pour passer en HTTPS avec certificat mkcert'"
          aria-label="Basculer HTTPS"
        >
          <Lock v-if="project.isSsl" class="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <Unlock v-else class="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </button>
      </div>
    </div>

    <!-- Main Scrollable Dashboard Content (Tabbed) -->
    <div class="flex-1 overflow-y-auto p-8 space-y-8">
      <!-- TAB 1: OVERVIEW & RUNTIMES -->
      <template v-if="activeDetailTab === 'overview'">
        <!-- SECTION 1: TWO-COLUMN ROW (COMPACT 1/4 PREVIEW + ENVIRONMENT & RUNTIMES) -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <!-- Left Column: Compact 1/4 Preview Card & Public Tunnel (approx 5 cols) -->
        <div class="lg:col-span-5 space-y-4">
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
          <!-- Mini Browser Header -->
          <div class="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 select-none">
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1.5">
                <span class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
              </div>
            </div>

            <!-- Mini Address bar & Tools -->
            <div class="flex items-center gap-1.5">
              <button
                @click="copyUrl"
                class="px-2 py-1 rounded bg-white dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 flex items-center gap-1.5"
                :title="copied ? $t('common.copied') : $t('project_detail.copy_url')"
              >
                <Lock v-if="project.isSsl" class="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <span class="truncate max-w-[130px]">{{ project.isSsl ? 'https://' : 'http://' }}{{ project.domain }}</span>
                <Check v-if="copied" class="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <Copy v-else class="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0" />
              </button>

              <button
                @click="reloadPreview"
                class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                :title="$t('project_detail.reload_preview')"
              >
                <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isReloading }" />
              </button>

              <button
                @click="isExpanded = !isExpanded"
                class="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
                :title="$t('project_detail.toggle_expand')"
              >
                <Minimize2 v-if="isExpanded" class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <Maximize2 v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Scaled Preview Viewport (1/4 Scale Ratio) -->
          <div
            class="relative bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden transition-all duration-300"
            :style="{ height: isExpanded ? '460px' : '280px' }"
          >
            <!-- Overlay if Nginx is stopped or domain not in hosts -->
            <div
              v-if="!nginxRunning || !project.inHosts"
              class="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-white/95 dark:bg-slate-900/95 text-center space-y-3 backdrop-blur-sm"
            >
              <div class="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-400 flex items-center justify-center">
                <ShieldAlert class="w-5 h-5" />
              </div>
              <div>
                <h4 class="text-xs font-bold text-slate-900 dark:text-white mb-0.5">
                  {{ !nginxRunning ? $t('project_detail.nginx_stopped_title') : $t('project_detail.dns_hosts_title') }}
                </h4>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  {{ !nginxRunning ? $t('project_detail.nginx_stopped_desc') : $t('project_detail.dns_hosts_desc') }}
                </p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  v-if="!nginxRunning"
                  @click="$emit('start-nginx')"
                  class="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-semibold transition shadow"
                >
                  {{ $t('nginx.start_server') }}
                </button>
                <button
                  v-if="!project.inHosts"
                  @click="$emit('add-hosts', project.domain)"
                  class="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold transition shadow"
                >
                  {{ $t('project_detail.add_to_hosts') }}
                </button>
              </div>
            </div>

            <!-- Iframe Container with Scale 0.5 (1/4 area) or 1.0 when expanded -->
            <div
              v-if="previewKey && nginxRunning && project.inHosts"
              class="w-full h-full relative overflow-hidden bg-white"
            >
              <iframe
                :key="previewKey"
                :src="(project.isSsl ? 'https://' : 'http://') + project.domain"
                class="border-0 absolute top-0 left-0"
                :style="isExpanded ? {
                  width: '100%',
                  height: '100%',
                  transform: 'none'
                } : {
                  width: '200%',
                  height: '200%',
                  transform: 'scale(0.5)',
                  transformOrigin: '0 0'
                }"
              ></iframe>
            </div>

            <div v-else class="text-slate-400 dark:text-slate-500 text-xs font-mono">
              {{ $t('project_detail.waiting_services') }}
            </div>
          </div>

          <div class="px-4 py-2 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span class="text-slate-500 dark:text-slate-400 font-medium">
              {{ $t('project_detail.live_preview') }}
            </span>
            <button
              @click="$emit('open-browser', project.domain, project.isSsl)"
              class="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-semibold transition flex items-center gap-1"
            >
              <span>{{ $t('projects.open_browser') }}</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Active Public Tunnel Spotlight (Shown when exposed) -->
        <div v-if="currentTunnel" class="p-3.5 bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/30 rounded-xl space-y-2.5 shadow-sm">
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              Exposition publique active
              <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 uppercase font-semibold">
                {{ currentTunnel.provider === 'cloudflare' ? 'Cloudflare' : 'Ngrok' }}
              </span>
            </span>
            <button
              @click="stopTunnel"
              class="text-[11px] text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              <XCircle class="w-3 h-3" />
              Arrêter
            </button>
          </div>

          <div class="flex items-center gap-1.5 bg-white dark:bg-slate-950 p-2 rounded-lg border border-emerald-500/30">
            <Lock class="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 ml-1" />
            <input
              type="text"
              readonly
              :value="currentTunnel.url"
              class="bg-transparent border-0 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none flex-1 truncate select-all px-1"
            />
            <button
              @click="copyTunnelUrl"
              class="p-1.5 rounded bg-emerald-500 hover:bg-emerald-600 text-white text-xs transition flex-shrink-0 cursor-pointer"
              :title="$t('common.copy')"
            >
              <Check v-if="tunnelCopied" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
            </button>
            <button
              @click="openTunnelInBrowser"
              class="p-1.5 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition flex-shrink-0 cursor-pointer"
              :title="$t('common.open')"
            >
              <ExternalLink class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

        <!-- Right Column: Runtimes, Health & Environment (approx 7 cols) -->
        <div class="lg:col-span-7 space-y-4">
          <!-- Runtimes & Dependencies Card -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu class="w-4 h-4 text-rose-500 dark:text-rose-400" />
                {{ $t('project_detail.runtimes_env') }}
              </h3>
              <span class="text-xs font-mono text-slate-500 dark:text-slate-400">
                FastCGI : 127.0.0.1:{{ project.phpPort || 9183 }}
              </span>
            </div>

            <!-- Version & Runtime Selectors -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <!-- Version Laravel -->
              <div class="flex flex-col justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">{{ $t('project_detail.laravel_version') }}</span>
                <div>
                  <span class="inline-flex items-center text-xs font-mono font-bold px-2.5 py-1 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {{ project.isLaravel ? (project.frameworkVersion ? `Laravel ${project.frameworkVersion}` : 'Laravel') : `${project.framework} ${project.frameworkVersion || ''}` }}
                  </span>
                </div>
              </div>

              <!-- Version PHP -->
              <div class="flex flex-col justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">{{ $t('project_detail.php_version') }}</span>
                <div>
                  <select
                    :value="project.phpVersion"
                    @change="$emit('set-php', { projectPath: project.path, version: $event.target.value })"
                    class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                  >
                    <option v-for="ver in availablePhp" :key="ver.id" :value="ver.id">
                      PHP {{ ver.id }} {{ ver.running ? '●' : '' }}
                    </option>
                  </select>
                </div>
              </div>

              <!-- Version Node -->
              <div class="flex flex-col justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <span class="text-xs font-semibold text-slate-600 dark:text-slate-400">{{ $t('project_detail.node_version') }}</span>
                <div>
                  <select
                    :value="project.nodeVersion || ''"
                    @change="$emit('set-node', { projectPath: project.path, version: $event.target.value || null })"
                    class="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold"
                  >
                    <option value="">{{ $t('common.system') }}</option>
                    <option v-for="ver in availableNode" :key="ver.id" :value="ver.id">
                      Node {{ ver.id }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Health Status Badges -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">.env</span>
                <span v-if="project.details?.hasEnv" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Check class="w-3 h-3" /> {{ $t('project_detail.present') }}
                </span>
                <span v-else class="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">{{ $t('project_detail.missing') }}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">vendor/</span>
                <span v-if="project.details?.hasVendor" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Check class="w-3 h-3" /> {{ $t('project_detail.installed') }}
                </span>
                <span v-else class="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">{{ $t('project_detail.composer_install_required') }}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">node_modules/</span>
                <span v-if="project.details?.hasNodeModules" class="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                  <Check class="w-3 h-3" /> {{ $t('project_detail.installed') }}
                </span>
                <span v-else class="text-slate-400 dark:text-slate-500 font-semibold text-[11px]">{{ $t('project_detail.not_installed') }}</span>
              </div>

              <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span class="text-slate-500 dark:text-slate-400 font-mono text-[11px]">Git</span>
                <span v-if="project.details?.hasGit" class="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1 text-[11px] truncate">
                  <GitBranch class="w-3 h-3" /> {{ project.details?.gitBranch || $t('project_detail.git_initialized') }}
                </span>
                <span v-else class="text-slate-400 dark:text-slate-500 text-[11px]">{{ $t('project_detail.git_not_initialized') }}</span>
              </div>
            </div>

            <!-- Quick Config Files Row -->
            <div class="pt-2.5 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <span class="text-[11px] text-slate-500 dark:text-slate-400 font-medium">{{ $t('project_detail.config_files') }}</span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  @click="openProjectIni"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-mono"
                  title="php.ini"
                >
                  <FileCode2 class="w-3 h-3 text-rose-500 dark:text-rose-400" />
                  <span>php.ini ({{ project.phpVersion }})</span>
                </button>

                <button
                  @click="openProjectNginxVhost"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-mono"
                  title="Nginx vhost"
                >
                  <FileCode2 class="w-3 h-3 text-sky-500 dark:text-sky-400" />
                  <span>{{ project.name }}.conf</span>
                </button>

                <button
                  v-if="project.details?.hasEnv"
                  @click="openProjectEnv"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition font-mono"
                  title=".env"
                >
                  <FileCode2 class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                  <span>.env</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <!-- SECTION 2: INFORMATION DE SITE & DIAGNOSTIC DIRECTEMENT DANS VUE D'ENSEMBLE -->
      <SiteInformationInspector
        :project="project"
        :project-about="projectAbout"
        :is-loading="isLoadingAbout"
        :is-toggling-maintenance="isTogglingMaintenance"
        :is-purging-caches="isPurgingCaches"
        :is-optimizing="isOptimizing"
        :is-creating-storage-link="isCreatingStorageLink"
        @refresh="loadProjectAbout"
        @toggle-maintenance="toggleMaintenanceMode"
        @clear-caches="clearAllCaches"
        @optimize-caches="optimizeProjectCaches"
        @create-storage-link="createStorageSymlink"
        @open-browser="$emit('open-browser', project.domain, project.isSsl)"
        @go-to-logs="activeDetailTab = 'logs'"
      />

      <!-- SECTION 3: ARTISAN QUICK COMMANDS & REALTIME CONSOLE -->
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Play class="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-current" />
              {{ $t('project_detail.artisan_commands_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('project_detail.artisan_commands_desc') }}</p>
          </div>
          <span class="text-xs text-slate-400 font-mono hidden sm:inline">
            php artisan
          </span>
        </div>

        <!-- Quick Command Buttons (Laravel only) -->
        <div v-if="project.isLaravel" class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          <button
            v-for="cmd in quickCommands"
            :key="cmd.command"
            @click="runArtisanCommand(cmd.command)"
            :disabled="isRunningCommand || isInstallingPackage"
            class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800/60 text-left transition flex flex-col justify-between group disabled:opacity-50"
          >
            <span class="text-[11px] font-semibold text-slate-800 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">{{ cmd.label }}</span>
            <code class="text-[9px] font-mono text-slate-400 dark:text-slate-500 mt-1 truncate">{{ cmd.command }}</code>
          </button>
        </div>
        <div v-else class="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
          <span class="text-amber-500">ℹ</span>
          {{ $t('project_detail.non_laravel_hint') }}
        </div>

        <!-- Realtime Console Output Box -->
        <div class="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2.5 shadow-inner">
          <div class="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800/80">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="(isRunningCommand || isInstallingPackage) ? 'bg-amber-400 animate-ping' : 'bg-slate-600'"></span>
              {{ $t('project_detail.console_output') }} : <strong class="text-slate-200">{{ activeActionName || $t('project_detail.console_ready') }}</strong>
            </span>
            <button
              v-if="commandOutput"
              @click="commandOutput = ''"
              class="text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              {{ $t('project_detail.clear_console') }}
            </button>
          </div>
          <pre class="overflow-x-auto text-slate-300 max-h-56 whitespace-pre-wrap leading-relaxed font-mono select-text">{{ commandOutput || $t('project_detail.console_placeholder') }}</pre>
        </div>
      </div>
      </template>

      <!-- TAB 2: PACKAGES COMPOSER DEDICATED TAB -->
      <template v-else-if="activeDetailTab === 'packages'">
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                <Package class="w-5 h-5 text-rose-500" />
                {{ $t('project_detail.packages_catalog_title') }}
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ $t('project_detail.packages_catalog_desc') }}
              </p>
            </div>

            <!-- Custom package manual install form -->
            <form @submit.prevent="installCustomPackage" class="flex items-center gap-2">
              <input
                v-model="customPackageName"
                type="text"
                :placeholder="$t('project_detail.custom_package_placeholder')"
                class="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono w-60"
              />
              <label class="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                <input v-model="customPackageIsDev" type="checkbox" class="rounded bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-rose-500" />
                <span>--dev</span>
              </label>
              <button
                type="submit"
                :disabled="!customPackageName.trim() || isInstallingPackage"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition disabled:opacity-50"
              >
                <Download class="w-3.5 h-3.5" />
                <span>{{ $t('common.install') }}</span>
              </button>
            </form>
          </div>

          <!-- Filter tabs for packages -->
          <div class="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800/80 pb-3 flex-wrap">
            <button
              v-for="cat in packageCategories"
              :key="cat.id"
              @click="activePackageCategory = cat.id"
              class="px-3 py-1 rounded-lg text-xs font-medium transition"
              :class="activePackageCategory === cat.id
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'"
            >
              {{ cat.label }}
            </button>
          </div>

          <!-- Grid of Popular Packages -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            <div
              v-for="pkg in filteredPackages"
              :key="pkg.name"
              class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-3 group"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-900 dark:text-white font-mono group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">{{ pkg.name }}</span>
                      <span
                        v-if="pkg.isDev"
                        class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 font-medium"
                      >
                        dev
                      </span>
                    </div>
                    <div class="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      {{ getPackageDesc(pkg.name, pkg.description) }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800/60 text-xs">
                <!-- Installed badge -->
                <span
                  v-if="isPackageInstalled(pkg.name)"
                  class="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"
                >
                  <Check class="w-3.5 h-3.5" />
                  {{ $t('common.installed') }} {{ getInstalledVersion(pkg.name) ? `(${getInstalledVersion(pkg.name)})` : '' }}
                </span>

                <!-- Install button -->
                <button
                  v-else
                  @click="installPackage(pkg.name, pkg.isDev)"
                  :disabled="isInstallingPackage"
                  class="flex items-center gap-1 px-3 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-600 dark:hover:bg-rose-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700 transition group-hover:border-rose-500/40 disabled:opacity-50"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ $t('common.install') }}</span>
                </button>

                <span class="text-[10px] font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded">
                  {{ categoryBadgeLabels[pkg.category] || pkg.category }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Realtime Console Output for Composer (visible if output present or installing) -->
        <div v-if="commandOutput || isInstallingPackage" class="bg-slate-900 dark:bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-3">
          <div class="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
            <span class="flex items-center gap-2">
              <span class="w-2 h-2 rounded-full" :class="isInstallingPackage ? 'bg-amber-400 animate-ping' : 'bg-slate-600'"></span>
              {{ $t('project_detail.composer_console_title') }} : <strong class="text-slate-200">{{ activeActionName || $t('project_detail.console_ready') }}</strong>
            </span>
            <button
              v-if="commandOutput"
              @click="commandOutput = ''"
              class="text-[11px] text-slate-400 hover:text-slate-200 transition"
            >
              {{ $t('project_detail.clear_console') }}
            </button>
          </div>
          <pre class="overflow-x-auto text-slate-300 max-h-60 whitespace-pre-wrap leading-relaxed font-mono text-xs select-text">{{ commandOutput }}</pre>
        </div>
      </template>

      <!-- TAB 3: LOGS LARAVEL DEDICATED TAB -->
      <template v-else-if="activeDetailTab === 'logs'">
        <ProjectLogViewer
          :project="project"
          @show-toast="$emit('show-toast', $event)"
        />
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { 
  Globe, 
  ExternalLink, 
  Terminal, 
  Code, 
  Folder, 
  ArrowLeft,
  ShieldAlert, 
  RefreshCw, 
  Check, 
  Copy,
  Cpu,
  Database,
  Play,
  GitBranch,
  Package,
  Download,
  Plus,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  FileCode2,
  ScrollText,
  LayoutDashboard,
  Radio,
  Zap,
  Share2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Sliders,
  Sparkles,
  Trash2,
  HardDrive,
  Layers,
  ArrowRight,
  Activity,
  Smartphone,
  QrCode,
  Webhook,
  ShieldCheck,
  Wifi,
  Clock,
  Key,
  Send
} from 'lucide-vue-next';
import ProjectLogViewer from '../components/ProjectLogViewer.vue';
import SiteInformationInspector from '../components/SiteInformationInspector.vue';
import { useI18n } from '../i18n';

const { t } = useI18n();

function getPackageDesc(name, fallback) {
  const key = `composer_packages_catalog.packages.${name}`;
  const val = t(key);
  return val !== key ? val : fallback;
}

const props = defineProps({
  project: { type: Object, required: true },
  availablePhp: { type: Array, default: () => [] },
  availableNode: { type: Array, default: () => [] },
  nginxRunning: { type: Boolean, default: false },
  isSsl: { type: Boolean, default: false },
  activeTunnels: { type: Object, default: () => ({}) }
});

const emit = defineEmits([
  'back',
  'set-php',
  'set-node',
  'toggle-ssl',
  'open-browser',
  'open-terminal',
  'open-editor',
  'open-explorer',
  'add-hosts',
  'start-nginx',
  'show-toast',
  'tunnel-changed'
]);

// Tab state: 'overview' | 'expose' | 'packages' | 'logs'
const activeDetailTab = ref('overview');

// ==========================================
// SITE INFORMATION & DIAGNOSTIC INSPECTOR
// ==========================================
const projectAbout = ref(null);
const isLoadingAbout = ref(false);
const isTogglingMaintenance = ref(false);
const isPurgingCaches = ref(false);
const isOptimizing = ref(false);
const isCreatingStorageLink = ref(false);

const aboutData = computed(() => projectAbout.value?.data || null);
const aboutEnvironment = computed(() => aboutData.value?.environment || null);
const aboutCache = computed(() => aboutData.value?.cache || null);
const aboutDrivers = computed(() => aboutData.value?.drivers || null);

const isMaintenanceActive = computed(() => {
  return !!aboutEnvironment.value?.maintenance_mode;
});

const dynamicEcosystemSections = computed(() => {
  if (!aboutData.value) return {};
  const reserved = ['environment', 'cache', 'drivers', 'storage'];
  const res = {};
  for (const [key, val] of Object.entries(aboutData.value)) {
    if (!reserved.includes(key.toLowerCase()) && typeof val === 'object' && val !== null) {
      res[key] = val;
    }
  }
  return res;
});

const detectedEcosystemList = computed(() => {
  const pkgs = props.project?.details?.composerPackages || {};
  const list = [];
  const known = [
    { key: 'livewire/livewire', label: 'Livewire' },
    { key: 'inertiajs/inertia-laravel', label: 'Inertia.js' },
    { key: 'filament/filament', label: 'Filament' },
    { key: 'laravel/sanctum', label: 'Laravel Sanctum' },
    { key: 'laravel/telescope', label: 'Laravel Telescope' },
    { key: 'laravel/horizon', label: 'Laravel Horizon' },
    { key: 'laravel/pulse', label: 'Laravel Pulse' },
    { key: 'laravel/octane', label: 'Laravel Octane' },
    { key: 'laravel/breeze', label: 'Laravel Breeze' },
    { key: 'laravel/reverb', label: 'Laravel Reverb' },
    { key: 'laravel/socialite', label: 'Laravel Socialite' },
    { key: 'laravel/cashier', label: 'Laravel Cashier' },
    { key: 'dedoc/scramble', label: 'Scramble (OpenAPI)' },
    { key: 'barryvdh/laravel-debugbar', label: 'Laravel Debugbar' },
    { key: 'barryvdh/laravel-ide-helper', label: 'IDE Helper' },
    { key: 'pestphp/pest', label: 'Pest PHP' },
    { key: 'spatie/laravel-permission', label: 'Spatie Permission' }
  ];
  for (const item of known) {
    if (pkgs[item.key]) {
      list.push({ label: item.label, version: pkgs[item.key] });
    }
  }
  return list;
});

async function loadProjectAbout() {
  if (!props.project?.path) return;
  isLoadingAbout.value = true;
  try {
    if (window.laratool?.projects?.getAbout) {
      const res = await window.laratool.projects.getAbout(props.project.path);
      projectAbout.value = res;
    }
  } catch (err) {
    console.error('Error loading project about:', err);
  } finally {
    isLoadingAbout.value = false;
  }
}

async function toggleMaintenanceMode() {
  if (isTogglingMaintenance.value || !props.project?.path) return;
  isTogglingMaintenance.value = true;
  const currentDown = isMaintenanceActive.value;
  const targetDown = !currentDown;
  try {
    emit('show-toast', { 
      message: targetDown ? 'Passage en mode maintenance (php artisan down)...' : 'Sortie du mode maintenance (php artisan up)...', 
      type: 'info' 
    });
    const res = await window.laratool.projects.toggleMaintenance(props.project.path, targetDown);
    if (res?.about) {
      projectAbout.value = res.about;
    } else {
      await loadProjectAbout();
    }
    emit('show-toast', { 
      message: targetDown ? 'Application mise en mode maintenance avec succès !' : 'Application remise en ligne !', 
      type: 'success' 
    });
  } catch (err) {
    emit('show-toast', { message: `Erreur mode maintenance : ${err.message}`, type: 'error' });
  } finally {
    isTogglingMaintenance.value = false;
  }
}

async function clearAllCaches() {
  if (isPurgingCaches.value || !props.project?.path) return;
  isPurgingCaches.value = true;
  try {
    emit('show-toast', { message: 'Vidage de tous les caches Laravel (optimize:clear)...', type: 'info' });
    const res = await window.laratool.projects.clearCaches(props.project.path);
    if (res?.about) {
      projectAbout.value = res.about;
    } else {
      await loadProjectAbout();
    }
    emit('show-toast', { message: 'Tous les caches Laravel ont été vidés avec succès !', type: 'success' });
  } catch (err) {
    emit('show-toast', { message: `Erreur vidage cache : ${err.message}`, type: 'error' });
  } finally {
    isPurgingCaches.value = false;
  }
}

async function optimizeProjectCaches() {
  if (isOptimizing.value || !props.project?.path) return;
  isOptimizing.value = true;
  try {
    emit('show-toast', { message: 'Mise en cache et optimisation (optimize)...', type: 'info' });
    const res = await window.laratool.projects.optimizeCaches(props.project.path);
    if (res?.about) {
      projectAbout.value = res.about;
    } else {
      await loadProjectAbout();
    }
    emit('show-toast', { message: 'Caches de configuration, routes et vues générés !', type: 'success' });
  } catch (err) {
    emit('show-toast', { message: `Erreur optimisation : ${err.message}`, type: 'error' });
  } finally {
    isOptimizing.value = false;
  }
}

async function createStorageSymlink() {
  if (isCreatingStorageLink.value || !props.project?.path) return;
  isCreatingStorageLink.value = true;
  try {
    emit('show-toast', { message: 'Création du lien symbolique public/storage (storage:link)...', type: 'info' });
    const res = await window.laratool.projects.createStorageLink(props.project.path);
    if (res?.about) {
      projectAbout.value = res.about;
    } else {
      await loadProjectAbout();
    }
    emit('show-toast', { message: 'Lien symbolique public/storage créé avec succès !', type: 'success' });
  } catch (err) {
    emit('show-toast', { message: `Erreur storage:link : ${err.message}`, type: 'error' });
  } finally {
    isCreatingStorageLink.value = false;
  }
}

const totalPackagesCount = computed(() => {
  return Object.keys(props.project?.details?.composerPackages || {}).length;
});

const previewKey = ref(1);
const isReloading = ref(false);
const isExpanded = ref(false);
const copied = ref(false);

const envValues = computed(() => props.project?.details?.env || {});

const highlightedEnv = computed(() => {
  const e = envValues.value;
  return {
    'DB_CONNECTION': e.DB_CONNECTION || 'mysql',
    'DB_HOST': e.DB_HOST || '127.0.0.1',
    'DB_PORT': e.DB_PORT || '3306',
    'DB_DATABASE': e.DB_DATABASE || props.project?.name || '',
    'CACHE_STORE': e.CACHE_STORE || e.CACHE_DRIVER || 'file',
    'QUEUE_CONNECTION': e.QUEUE_CONNECTION || 'sync'
  };
});

// Database connection info from .env
const dbConnection = computed(() => {
  const conn = envValues.value.DB_CONNECTION;
  if (!conn) return null;
  if (['mysql', 'mariadb', 'pgsql', 'sqlite'].includes(conn)) return conn;
  return null;
});

const dbName = computed(() => envValues.value.DB_DATABASE || props.project?.name || '');
const dbHost = computed(() => envValues.value.DB_HOST || '127.0.0.1');
const dbPort = computed(() => {
  if (envValues.value.DB_PORT) return envValues.value.DB_PORT;
  if (dbConnection.value === 'pgsql') return '5432';
  return '3306';
});

function reloadPreview() {
  isReloading.value = true;
  previewKey.value++;
  setTimeout(() => {
    isReloading.value = false;
  }, 400);
}

function copyUrl() {
  const protocol = props.project?.isSsl ? 'https' : 'http';
  navigator.clipboard.writeText(`${protocol}://${props.project?.domain || ''}`);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
}

// Console & Execution State
const isRunningCommand = ref(false);
const isInstallingPackage = ref(false);
const activeActionName = ref('');
const commandOutput = ref('');

const quickCommands = [
  { label: 'migrate', command: 'php artisan migrate' },
  { label: 'migrate:status', command: 'php artisan migrate:status' },
  { label: 'db:seed', command: 'php artisan db:seed' },
  { label: 'route:list', command: 'php artisan route:list' },
  { label: 'queue:work', command: 'php artisan queue:work --once' },
  { label: 'test', command: 'php artisan test' },
  { label: 'about', command: 'php artisan about' },
  { label: 'npm build', command: 'npm run build' }
];

const categoryBadgeLabels = computed(() => ({
  auth: t('composer_packages_catalog.categories.auth'),
  dev: t('composer_packages_catalog.categories.dev'),
  api: t('composer_packages_catalog.categories.api'),
  realtime: t('composer_packages_catalog.categories.realtime'),
  admin: t('composer_packages_catalog.categories.admin'),
  files: t('composer_packages_catalog.categories.files'),
  utils: t('composer_packages_catalog.categories.utils')
}));

async function runArtisanCommand(cmd) {
  if (isRunningCommand.value || isInstallingPackage.value) return;
  isRunningCommand.value = true;
  activeActionName.value = cmd;
  commandOutput.value = `> Exécution : ${cmd}...\n`;

  try {
    if (window.laratool && window.laratool.projects && window.laratool.projects.runCommand) {
      const res = await window.laratool.projects.runCommand(props.project.path, cmd);
      if (res.stdout) commandOutput.value += res.stdout;
      if (res.stderr) commandOutput.value += `\n[STDERR]\n${res.stderr}`;
    } else {
      commandOutput.value += `Simulé : ${cmd} exécuté avec succès.`;
    }
  } catch (err) {
    commandOutput.value += `\nErreur : ${err.message}`;
  } finally {
    isRunningCommand.value = false;
  }
}

// Popular Composer Packages Catalog
const activePackageCategory = ref('all');
const customPackageName = ref('');
const customPackageIsDev = ref(false);

const packageCategories = computed(() => [
  { id: 'all', label: t('composer_packages_catalog.categories.all') },
  { id: 'auth', label: t('composer_packages_catalog.categories.auth') },
  { id: 'dev', label: t('composer_packages_catalog.categories.dev') },
  { id: 'api', label: t('composer_packages_catalog.categories.api') },
  { id: 'realtime', label: t('composer_packages_catalog.categories.realtime') },
  { id: 'admin', label: t('composer_packages_catalog.categories.admin') },
  { id: 'files', label: t('composer_packages_catalog.categories.files') },
  { id: 'utils', label: t('composer_packages_catalog.categories.utils') }
]);

const popularPackages = [
  // Auth & Sécurité
  {
    name: 'laravel/breeze',
    description: 'Starter kit d\'authentification minimaliste avec Blade, Vue ou React.',
    category: 'auth',
    isDev: true
  },
  {
    name: 'laravel/sanctum',
    description: 'Système d\'authentification par jetons API et cookies SPA légers.',
    category: 'auth',
    isDev: false
  },
  {
    name: 'spatie/laravel-permission',
    description: 'Gestion avancée des rôles, permissions et garde-fous Eloquent.',
    category: 'auth',
    isDev: false
  },
  {
    name: 'laravel/socialite',
    description: 'Authentification OAuth fluide (Google, GitHub, Facebook, Apple, etc.).',
    category: 'auth',
    isDev: false
  },
  {
    name: 'laravel/passport',
    description: 'Serveur OAuth2 complet pour API REST avancées et multi-clients.',
    category: 'auth',
    isDev: false
  },

  // Débogage & Qualité
  {
    name: 'barryvdh/laravel-debugbar',
    description: 'Barre de profilage en bas de page (requêtes SQL, temps, logs, mémoire).',
    category: 'dev',
    isDev: true
  },
  {
    name: 'barryvdh/laravel-ide-helper',
    description: 'Autocomplétion intelligente des modèles, façades et scopes pour éditeurs.',
    category: 'dev',
    isDev: true
  },
  {
    name: 'pestphp/pest',
    description: 'Framework de test moderne, expressif et élégant basé sur PHPUnit.',
    category: 'dev',
    isDev: true
  },
  {
    name: 'larastan/larastan',
    description: 'Analyse statique PHPStan spécialisée Laravel pour traquer les bugs en amont.',
    category: 'dev',
    isDev: true
  },
  {
    name: 'laravel/pint',
    description: 'Formateur de code officiel basé sur PHP-CS-Fixer sans configuration requise.',
    category: 'dev',
    isDev: true
  },
  {
    name: 'laravel/telescope',
    description: 'Tableau de bord officiel pour inspecter requêtes, exceptions et jobs.',
    category: 'dev',
    isDev: true
  },
  {
    name: 'spatie/laravel-ray',
    description: 'Client de débogage pour envoyer des variables vers l\'application Ray.',
    category: 'dev',
    isDev: true
  },

  // API & Swagger
  {
    name: 'dedoc/scramble',
    description: 'Génération 100% automatique de documentation OpenAPI / Swagger sans annotations.',
    category: 'api',
    isDev: false
  },
  {
    name: 'spatie/laravel-query-builder',
    description: 'Filtrage, tri et inclusion de relations Eloquent directement depuis l\'URL.',
    category: 'api',
    isDev: false
  },

  // Temps Réel & Queues
  {
    name: 'laravel/reverb',
    description: 'Serveur WebSocket officiel ultra-rapide pour le broadcasting temps réel.',
    category: 'realtime',
    isDev: false
  },
  {
    name: 'laravel/horizon',
    description: 'Tableau de bord et gestionnaire de workers Redis pour files d\'attente.',
    category: 'realtime',
    isDev: false
  },
  {
    name: 'laravel/pulse',
    description: 'Surveillance temps réel des performances applicatives, requêtes lentes et jobs.',
    category: 'realtime',
    isDev: false
  },

  // Admin & Frontend
  {
    name: 'filament/filament',
    description: 'Suite d\'administration moderne et élégante pour la stack TALL (Livewire).',
    category: 'admin',
    isDev: false
  },
  {
    name: 'livewire/livewire',
    description: 'Composants d\'interface dynamiques et réactifs en PHP pur avec Blade.',
    category: 'admin',
    isDev: false
  },
  {
    name: 'inertiajs/inertia-laravel',
    description: 'Adaptateur serveur pour construire des SPA monolithiques modernes avec Vue/React.',
    category: 'admin',
    isDev: false
  },

  // Médias & Excel
  {
    name: 'maatwebsite/excel',
    description: 'Exportation et importation de fichiers Excel (.xlsx) et CSV facilitées.',
    category: 'files',
    isDev: false
  },
  {
    name: 'spatie/laravel-medialibrary',
    description: 'Association fluide de fichiers et images aux modèles Eloquent.',
    category: 'files',
    isDev: false
  },

  // Utilitaires & SEO
  {
    name: 'laravel/cashier',
    description: 'Gestion complète des abonnements, paiements et factures avec Stripe.',
    category: 'utils',
    isDev: false
  },
  {
    name: 'spatie/laravel-backup',
    description: 'Automatisation des sauvegardes complètes de base de données et fichiers.',
    category: 'utils',
    isDev: false
  },
  {
    name: 'spatie/laravel-activitylog',
    description: 'Enregistrement automatique des activités et modifications des modèles.',
    category: 'utils',
    isDev: false
  },
  {
    name: 'spatie/laravel-sitemap',
    description: 'Génération automatique et performante de sitemap XML pour le référencement.',
    category: 'utils',
    isDev: false
  },
  {
    name: 'spatie/laravel-sluggable',
    description: 'Création automatique de slugs d\'URL propres et uniques pour vos modèles.',
    category: 'utils',
    isDev: false
  },
  {
    name: 'guzzlehttp/guzzle',
    description: 'Client HTTP standard pour consommer des API externes et webhooks.',
    category: 'utils',
    isDev: false
  }
];

const filteredPackages = computed(() => {
  if (activePackageCategory.value === 'all') return popularPackages;
  return popularPackages.filter(p => p.category === activePackageCategory.value);
});

function isPackageInstalled(name) {
  const pkgs = props.project?.details?.composerPackages || {};
  return !!pkgs[name];
}

function getInstalledVersion(name) {
  const pkgs = props.project?.details?.composerPackages || {};
  return pkgs[name] || '';
}

async function installPackage(packageName, isDev = false) {
  if (isInstallingPackage.value || isRunningCommand.value) return;
  isInstallingPackage.value = true;
  activeActionName.value = `composer require ${packageName}${isDev ? ' --dev' : ''}`;
  commandOutput.value = `> Démarrage : composer require ${packageName}${isDev ? ' --dev' : ''}...\n(Veuillez patienter pendant la résolution des dépendances Composer)\n\n`;

  try {
    if (window.laratool && window.laratool.projects && window.laratool.projects.installPackage) {
      const res = await window.laratool.projects.installPackage(props.project.path, packageName, isDev);
      if (res.stdout) commandOutput.value += res.stdout;
      if (res.stderr) commandOutput.value += `\n${res.stderr}`;
      
      // Update details reactively if returned
      if (res.details && props.project.details) {
        props.project.details.composerPackages = res.details.composerPackages;
        props.project.details.hasVendor = res.details.hasVendor;
      }
      
      if (res.success) {
        commandOutput.value += `\n\n✓ Le package ${packageName} a été installé avec succès !`;
      } else {
        commandOutput.value += `\n\n✗ L'installation s'est terminée avec une alerte (voir ci-dessus).`;
      }
    } else {
      commandOutput.value += `Simulé : ${packageName} installé.`;
    }
  } catch (err) {
    commandOutput.value += `\nErreur fatale : ${err.message}`;
  } finally {
    isInstallingPackage.value = false;
  }
}

async function installCustomPackage() {
  const pkg = customPackageName.value.trim();
  if (!pkg) return;
  await installPackage(pkg, customPackageIsDev.value);
  customPackageName.value = '';
}

// ==========================================
// TUNNEL & PARTAGE PUBLIC EN 1 CLIC
// ==========================================
const tunnelProviders = ref([]);
const selectedTunnelProvider = ref('cloudflare');
const isStartingTunnel = ref(false);
const isStoppingTunnel = ref(false);
const isDownloadingCf = ref(false);
const cfDownloadPercent = ref(0);
const tunnelCopied = ref(false);

// Ngrok token handling
const ngrokAuth = ref({ installed: false, configured: false });
const ngrokTokenInput = ref('');
const isSavingNgrokToken = ref(false);
const showNgrokTokenInput = ref(false);

// Tunnel Ping & Health
const tunnelPingResult = ref(null);
const isPingingTunnel = ref(false);

// Traffic & Webhook Live Logs
const tunnelLogs = ref([]);
const tunnelLogsAutoScroll = ref(true);
const tunnelLogsBoxRef = ref(null);

let removeTunnelLogListener = null;
let removeDownloadListener = null;

const currentTunnel = computed(() => {
  return props.activeTunnels?.[props.project?.name] || null;
});

const isCloudflareInstalled = computed(() => {
  return !!tunnelProviders.value.find(p => p.id === 'cloudflare')?.installed;
});

const isNgrokInstalled = computed(() => {
  return !!tunnelProviders.value.find(p => p.id === 'ngrok')?.installed;
});

const isNgrokConfigured = computed(() => {
  return !!ngrokAuth.value.configured;
});

const currentProviderObj = computed(() => {
  return tunnelProviders.value.find(p => p.id === selectedTunnelProvider.value) || null;
});

async function loadTunnelProviders() {
  try {
    if (window.laratool?.tunnels?.getProviders) {
      const providers = await window.laratool.tunnels.getProviders();
      tunnelProviders.value = providers;
      const preferred = providers.find(p => p.isPreferred);
      if (preferred && preferred.installed) {
        selectedTunnelProvider.value = preferred.id;
      } else {
        const cf = providers.find(p => p.id === 'cloudflare');
        const ng = providers.find(p => p.id === 'ngrok');
        if (cf?.installed) {
          selectedTunnelProvider.value = 'cloudflare';
        } else if (ng?.installed && ng?.hasAuthToken) {
          selectedTunnelProvider.value = 'ngrok';
        }
      }
    }

    if (window.laratool?.tunnels?.getNgrokAuthStatus) {
      ngrokAuth.value = await window.laratool.tunnels.getNgrokAuthStatus();
    }

    if (props.project?.name && window.laratool?.tunnels?.getLogs) {
      tunnelLogs.value = await window.laratool.tunnels.getLogs(props.project.name);
    }
  } catch (err) {
    console.warn('loadTunnelProviders error:', err);
  }
}

async function saveNgrokToken() {
  const token = ngrokTokenInput.value.trim();
  if (!token) return;
  isSavingNgrokToken.value = true;
  try {
    const res = await window.laratool.tunnels.setNgrokAuthToken(token);
    if (res.success) {
      emit('show-toast', { message: t('project_detail.token_saved'), type: 'success' });
      ngrokTokenInput.value = '';
      showNgrokTokenInput.value = false;
      await loadTunnelProviders();
    }
  } catch (err) {
    emit('show-toast', { message: err.message, type: 'error' });
  } finally {
    isSavingNgrokToken.value = false;
  }
}

function openNgrokDashboard() {
  const url = 'https://dashboard.ngrok.com/get-started/your-authtoken';
  if (window.laratool?.system?.openExternal) {
    window.laratool.system.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

async function downloadCloudflared() {
  if (isDownloadingCf.value) return;
  isDownloadingCf.value = true;
  cfDownloadPercent.value = 0;
  try {
    emit('show-toast', { message: t('project_detail.downloading_cf'), type: 'info' });
    const res = await window.laratool.tunnels.downloadCloudflared();
    if (res.success) {
      emit('show-toast', { message: t('project_detail.cf_binary_ready'), type: 'success' });
      await loadTunnelProviders();
      selectedTunnelProvider.value = 'cloudflare';
    } else {
      emit('show-toast', { message: res.error || 'Erreur lors du téléchargement', type: 'error' });
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur téléchargement: ${err.message}`, type: 'error' });
  } finally {
    isDownloadingCf.value = false;
  }
}

async function pingCurrentTunnel() {
  if (!currentTunnel.value?.url || isPingingTunnel.value) return;
  isPingingTunnel.value = true;
  tunnelPingResult.value = null;
  try {
    const res = await window.laratool.tunnels.ping(currentTunnel.value.url);
    tunnelPingResult.value = res;
    if (res.success) {
      emit('show-toast', { 
        message: `Réponse HTTP ${res.status} ${res.statusText} (${res.latencyMs} ms)`, 
        type: res.status < 400 ? 'success' : 'info' 
      });
    } else {
      emit('show-toast', { message: `Erreur Ping: ${res.error}`, type: 'error' });
    }
  } catch (err) {
    tunnelPingResult.value = { success: false, error: err.message };
  } finally {
    isPingingTunnel.value = false;
  }
}

const isUpdatingNgrok = ref(false);

async function updateNgrok() {
  if (isUpdatingNgrok.value) return;
  isUpdatingNgrok.value = true;
  try {
    emit('show-toast', { message: 'Mise à jour de Ngrok vers la dernière version...', type: 'info' });
    const res = await window.laratool.tunnels.updateNgrok();
    emit('show-toast', { message: res.message || 'Ngrok mis à jour avec succès !', type: 'success' });
    await loadTunnelProviders();
  } catch (err) {
    emit('show-toast', { message: `Erreur mise à jour: ${err.message}`, type: 'error' });
  } finally {
    isUpdatingNgrok.value = false;
  }
}

function clearTunnelLogs() {
  tunnelLogs.value = [];
  if (props.project?.name && window.laratool?.tunnels?.clearLogs) {
    window.laratool.tunnels.clearLogs(props.project.name);
  }
}

function copyTunnelLogs() {
  if (!tunnelLogs.value.length) return;
  const text = tunnelLogs.value.map(l => `[${l.time}] ${l.line}`).join('\n');
  navigator.clipboard.writeText(text);
  emit('show-toast', { message: 'Logs copiés dans le presse-papier !', type: 'success' });
}

async function toggleProjectTunnel() {
  if (currentTunnel.value) {
    await stopTunnel();
  } else {
    await startTunnel();
  }
}

async function startTunnel() {
  if (isStartingTunnel.value) return;
  isStartingTunnel.value = true;
  tunnelPingResult.value = null;
  try {
    const providerObj = tunnelProviders.value.find(p => p.id === selectedTunnelProvider.value);
    const providerName = providerObj ? providerObj.name : 'Tunnel HTTPS';
    emit('show-toast', { message: `Démarrage de l'exposition publique (${providerName})...`, type: 'info' });
    const res = await window.laratool.tunnels.start(props.project.name, props.project.domain, selectedTunnelProvider.value);
    if (res.success) {
      emit('show-toast', { message: `Tunnel en ligne : ${res.url}`, type: 'success' });
      emit('tunnel-changed');
    } else {
      emit('show-toast', { message: res.error || 'Impossible d\'activer le tunnel public', type: 'error' });
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur tunnel: ${err.message}`, type: 'error' });
  } finally {
    isStartingTunnel.value = false;
  }
}

async function stopTunnel() {
  if (isStoppingTunnel.value) return;
  isStoppingTunnel.value = true;
  try {
    const res = await window.laratool.tunnels.stop(props.project.name);
    if (res.success) {
      emit('show-toast', { message: 'Tunnel fermé avec succès.', type: 'info' });
      emit('tunnel-changed');
      tunnelPingResult.value = null;
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur fermeture: ${err.message}`, type: 'error' });
  } finally {
    isStoppingTunnel.value = false;
  }
}

function copyTunnelUrl() {
  if (!currentTunnel.value?.url) return;
  navigator.clipboard.writeText(currentTunnel.value.url);
  tunnelCopied.value = true;
  emit('show-toast', { message: 'URL publique copiée dans le presse-papier !', type: 'success' });
  setTimeout(() => {
    tunnelCopied.value = false;
  }, 2000);
}

function openTunnelInBrowser() {
  if (!currentTunnel.value?.url) return;
  if (window.laratool?.system?.openExternal) {
    window.laratool.system.openExternal(currentTunnel.value.url);
  } else {
    window.open(currentTunnel.value.url, '_blank');
  }
}

const customWebhookPath = ref('/api/webhooks');
const webhookCopiedItem = ref('');

const webhookRecipes = computed(() => [
  { id: 'stripe', name: 'Stripe Webhooks', method: 'POST', path: '/api/stripe/webhook' },
  { id: 'github', name: 'GitHub Webhooks', method: 'POST', path: '/api/github/webhook' },
  { id: 'cashier', name: 'Laravel Cashier', method: 'POST', path: '/stripe/webhook' },
  { id: 'generic', name: t('project_detail.generic_api'), method: 'POST', path: '/api/webhooks' }
]);

function copyWebhookUrl(endpoint) {
  if (!currentTunnel.value?.url) return;
  const cleanEndpoint = endpoint?.trim() || '';
  const fullUrl = `${currentTunnel.value.url.replace(/\/$/, '')}${cleanEndpoint.startsWith('/') ? cleanEndpoint : '/' + cleanEndpoint}`;
  navigator.clipboard.writeText(fullUrl);
  webhookCopiedItem.value = endpoint;
  emit('show-toast', { message: `URL copiée : ${fullUrl}`, type: 'success' });
  setTimeout(() => {
    webhookCopiedItem.value = '';
  }, 2000);
}

function openNgrokInspector() {
  if (window.laratool?.system?.openExternal) {
    window.laratool.system.openExternal('http://127.0.0.1:4040');
  } else {
    window.open('http://127.0.0.1:4040', '_blank');
  }
}

onMounted(() => {
  loadTunnelProviders();
  loadProjectAbout();

  if (window.laratool?.tunnels?.onLog) {
    removeTunnelLogListener = window.laratool.tunnels.onLog((data) => {
      if (data && data.projectName === props.project?.name && data.entry) {
        tunnelLogs.value.push(data.entry);
        if (tunnelLogs.value.length > 200) tunnelLogs.value.shift();
        if (tunnelLogsAutoScroll.value && tunnelLogsBoxRef.value) {
          setTimeout(() => {
            if (tunnelLogsBoxRef.value) {
              tunnelLogsBoxRef.value.scrollTop = tunnelLogsBoxRef.value.scrollHeight;
            }
          }, 30);
        }
      }
    });
  }

  if (window.laratool?.onDownloadProgress) {
    removeDownloadListener = window.laratool.onDownloadProgress((data) => {
      if (data && data.item === 'cloudflared') {
        cfDownloadPercent.value = data.percent || 0;
      }
    });
  }
});

onUnmounted(() => {
  if (removeTunnelLogListener) removeTunnelLogListener();
  if (removeDownloadListener) removeDownloadListener();
});

watch(() => props.project?.path, () => {
  loadProjectAbout();
  loadTunnelProviders();
});

watch(() => props.project?.name, () => {
  loadTunnelProviders();
});
</script>
