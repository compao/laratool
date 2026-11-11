<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Top Header & Summary -->
    <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div class="space-y-1">
          <div class="flex items-center gap-2.5">
            <div class="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Radio class="w-5 h-5" :class="{ 'animate-pulse': activeTunnelsList.length > 0 }" />
            </div>
            <div>
              <h1 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                {{ $t('tunnels_view.title') }}
                <span
                  v-if="activeTunnelsList.length > 0"
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                >
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  {{ activeTunnelsList.length }} {{ $t('common.active') }}
                </span>
                <span
                  v-else
                  class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                >
                  {{ $t('tunnels_view.idle') }}
                </span>
              </h1>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {{ $t('tunnels_view.desc') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Quick Status Pills -->
        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <!-- Active Engine Pill -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <span class="text-slate-400 font-medium">{{ $t('tunnels_view.default_engine') }}</span>
            <span class="font-bold flex items-center gap-1.5" :class="preferredProvider === 'cloudflare' ? 'text-sky-600 dark:text-sky-400' : 'text-slate-900 dark:text-white'">
              <span class="w-2 h-2 rounded-full" :class="preferredProvider === 'cloudflare' ? 'bg-sky-500' : 'bg-emerald-500'"></span>
              {{ preferredProvider === 'cloudflare' ? 'Cloudflare Tunnel' : 'Ngrok Tunnel' }}
            </span>
          </div>

          <!-- Nginx Server Pill -->
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <span class="text-slate-400 font-medium">{{ $t('tunnels_view.local_nginx') }}</span>
            <span class="font-mono font-bold flex items-center gap-1.5" :class="nginxRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'">
              <span class="w-2 h-2 rounded-full" :class="nginxRunning ? 'bg-emerald-500' : 'bg-rose-500'"></span>
              :{{ localNginxPort }} ({{ nginxRunning ? $t('tunnels_view.online_short') : $t('tunnels_view.stopped_short') }})
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Alert if Nginx is stopped -->
    <div
      v-if="!nginxRunning"
      class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
    >
      <div class="flex items-center gap-3">
        <AlertCircle class="w-5 h-5 text-rose-500 flex-shrink-0" />
        <div>
          <div class="font-bold text-slate-900 dark:text-white">{{ $t('tunnels_view.nginx_stopped_title') }}</div>
          <div class="text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('tunnels_view.nginx_stopped_desc') }}</div>
        </div>
      </div>
      <button
        @click="$emit('start-nginx')"
        class="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-sm transition flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0 cursor-pointer"
      >
        <Zap class="w-3.5 h-3.5" />
        <span>{{ $t('tunnels_view.start_nginx') }}</span>
      </button>
    </div>

    <!-- SECTION 1: MOTEURS DE TUNNEL (Cartes interactives sans redondance) -->
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Sliders class="w-4 h-4 text-slate-500" />
          {{ $t('tunnels_view.engines_title') }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ $t('tunnels_view.engines_desc') }}
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- 1. Cloudflare Card (Interactive Radio Card) -->
        <div
          @click="setPreferredEngine('cloudflare')"
          class="bg-white dark:bg-slate-900/90 border rounded-2xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative"
          :class="preferredProvider === 'cloudflare'
            ? 'border-sky-500 dark:border-sky-500 ring-2 ring-sky-500/40 bg-sky-500/5 dark:bg-sky-500/5'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
        >
          <div class="space-y-4">
            <!-- Header with Radio Indicator -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition"
                  :class="preferredProvider === 'cloudflare'
                    ? 'bg-sky-500 text-white'
                    : 'bg-sky-500/10 text-sky-600 dark:text-sky-400 group-hover:bg-sky-500/20'"
                >
                  CF
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Cloudflare Tunnel</h3>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {{ $t('tunnels_view.cf_free_badge') }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('tunnels_view.cf_subtitle') }}</p>
                </div>
              </div>

              <!-- Selection Badge / Radio -->
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span
                  v-if="preferredProvider === 'cloudflare'"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-sky-500 text-white shadow-sm"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>{{ $t('tunnels_view.default_badge') }}</span>
                </span>
                <span
                  v-else
                  class="text-xs font-medium text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition"
                >
                  {{ $t('tunnels_view.set_default_link') }}
                </span>
              </div>
            </div>

            <!-- Description & Points forts humains -->
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {{ $t('tunnels_view.cf_desc') }}
            </p>
          </div>

          <!-- Footer: Binary Status or Action -->
          <div class="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80" @click.stop>
            <div v-if="isDownloadingCf" class="space-y-1.5">
              <div class="flex items-center justify-between text-xs font-semibold text-sky-600 dark:text-sky-400">
                <span class="flex items-center gap-1.5"><RefreshCw class="w-3.5 h-3.5 animate-spin" /> {{ $t('tunnels_view.cf_downloading') }}</span>
                <span class="font-mono">{{ cfDownloadPercent }}%</span>
              </div>
              <div class="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div class="bg-sky-500 h-1.5 rounded-full transition-all duration-200" :style="{ width: `${cfDownloadPercent}%` }"></div>
              </div>
            </div>

            <button
              v-else-if="!cfProvider?.installed"
              @click="downloadCloudflared"
              class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ $t('tunnels_view.cf_download_btn') }}</span>
            </button>

            <div v-else class="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <span class="flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4" /> {{ $t('tunnels_view.cf_ready') }}
              </span>
              <span class="text-slate-400 dark:text-slate-500 font-mono text-[11px] truncate max-w-[180px]" :title="cfProvider.path">
                {{ cfProvider.path }}
              </span>
            </div>
          </div>
        </div>

        <!-- 2. Ngrok Card (Interactive Radio Card) -->
        <div
          @click="setPreferredEngine('ngrok')"
          class="bg-white dark:bg-slate-900/90 border rounded-2xl p-5 shadow-sm transition-all cursor-pointer flex flex-col justify-between group relative"
          :class="preferredProvider === 'ngrok'
            ? 'border-slate-900 dark:border-white ring-2 ring-slate-900/20 dark:ring-white/30 bg-slate-500/5 dark:bg-slate-500/5'
            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'"
        >
          <div class="space-y-4">
            <!-- Header with Radio Indicator -->
            <div class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition"
                  :class="preferredProvider === 'ngrok'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'"
                >
                  NG
                </div>
                <div>
                  <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold text-slate-900 dark:text-white">Ngrok Tunnel</h3>
                    <span v-if="ngrokProvider?.version" class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      v{{ ngrokProvider.version }}
                    </span>
                  </div>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('tunnels_view.ngrok_subtitle') }}</p>
                </div>
              </div>

              <!-- Selection Badge / Radio -->
              <div class="flex items-center gap-2 flex-shrink-0">
                <!-- Check update button (compact icon) -->
                <button
                  v-if="ngrokProvider?.installed"
                  @click.stop="updateNgrok"
                  :disabled="isUpdatingNgrok"
                  class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  :title="$t('tunnels_view.ngrok_check_update')"
                >
                  <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin text-sky-500': isUpdatingNgrok }" />
                </button>

                <span
                  v-if="preferredProvider === 'ngrok'"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                >
                  <Check class="w-3.5 h-3.5" />
                  <span>{{ $t('tunnels_view.default_badge') }}</span>
                </span>
                <span
                  v-else
                  class="text-xs font-medium text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition"
                >
                  {{ $t('tunnels_view.set_default_link') }}
                </span>
              </div>
            </div>

            <!-- Description -->
            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              {{ $t('tunnels_view.ngrok_desc') }}
            </p>
          </div>

          <!-- Footer: AuthToken Management & Inspector -->
          <div class="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5" @click.stop>
            <!-- Token Status & Config -->
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key class="w-3.5 h-3.5 text-amber-500" />
                {{ $t('tunnels_view.ngrok_token_label') }}
              </span>

              <div class="flex items-center gap-2">
                <button
                  v-if="ngrokAuth.configured && !showNgrokEdit"
                  @click="showNgrokEdit = true"
                  class="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                >
                  {{ $t('tunnels_view.ngrok_edit') }}
                </button>
                <button
                  @click="openNgrokDashboard"
                  class="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                  :title="$t('tunnels_view.ngrok_account_tooltip')"
                >
                  <span>{{ $t('tunnels_view.ngrok_account') }}</span>
                  <ExternalLink class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Token configured badge OR input form -->
            <div v-if="ngrokAuth.configured && !showNgrokEdit" class="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
              <span class="text-emerald-700 dark:text-emerald-300 font-medium flex items-center gap-1.5">
                <CheckCircle2 class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {{ $t('tunnels_view.ngrok_token_ready') }}
              </span>
              <button
                v-if="hasActiveNgrokTunnel"
                @click="openNgrokInspector"
                class="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 transition text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Activity class="w-3 h-3" />
                <span>{{ $t('tunnels_view.ngrok_inspector') }}</span>
              </button>
            </div>

            <div v-else class="flex items-center gap-1.5">
              <input
                v-model="ngrokTokenInput"
                type="password"
                :placeholder="$t('tunnels_view.ngrok_token_placeholder')"
                class="bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-sky-500 font-mono flex-1 min-w-0"
              />
              <button
                @click="saveNgrokToken"
                :disabled="isSavingNgrokToken || !ngrokTokenInput.trim()"
                class="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1 flex-shrink-0 cursor-pointer"
              >
                <RefreshCw v-if="isSavingNgrokToken" class="w-3.5 h-3.5 animate-spin" />
                <Check v-else class="w-3.5 h-3.5" />
                <span>{{ $t('common.save') }}</span>
              </button>
              <button
                v-if="showNgrokEdit"
                @click="showNgrokEdit = false"
                class="px-2 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs cursor-pointer"
              >
                {{ $t('common.cancel') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: TUNNELS PUBLICS ACTIFS -->
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Radio class="w-4 h-4 text-emerald-500" :class="{ 'animate-pulse': activeTunnelsList.length > 0 }" />
          {{ $t('tunnels_view.active_tunnels_title') }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ $t('tunnels_view.active_tunnels_desc') }}
        </p>
      </div>

      <!-- Active Tunnels List -->
      <div v-if="activeTunnelsList.length > 0" class="space-y-3">
        <div
          v-for="t in activeTunnelsList"
          :key="t.projectName"
          class="bg-white dark:bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent"
        >
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div class="flex items-center gap-2.5 flex-wrap">
              <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <h3 class="text-sm font-bold text-slate-900 dark:text-white font-mono">
                {{ t.projectName }}
              </h3>
              <span
                class="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
                :class="t.provider === 'cloudflare' ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-white'"
              >
                {{ t.provider === 'cloudflare' ? 'Cloudflare' : 'Ngrok' }}
              </span>
              <span class="text-xs text-slate-400 font-mono">
                → http://{{ t.domain }}:{{ t.port || localNginxPort }}
              </span>
            </div>

            <!-- Ping & Stop buttons -->
            <div class="flex items-center gap-2">
              <button
                @click="pingTunnelUrl(t.projectName, t.url)"
                :disabled="pingLoadingMap[t.projectName]"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition cursor-pointer"
                :title="$t('tunnels_view.test_tooltip')"
              >
                <RefreshCw v-if="pingLoadingMap[t.projectName]" class="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <Wifi v-else class="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span v-if="pingResultMap[t.projectName]" class="font-mono text-[11px]">
                  {{ pingResultMap[t.projectName].success ? `${pingResultMap[t.projectName].status} (${pingResultMap[t.projectName].latencyMs}ms)` : $t('common.error') }}
                </span>
                <span v-else>{{ $t('tunnels_view.test_btn') }}</span>
              </button>

              <button
                @click="stopTunnel(t.projectName)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-semibold transition cursor-pointer"
              >
                <XCircle class="w-3.5 h-3.5" />
                <span>{{ $t('tunnels_view.close_tunnel') }}</span>
              </button>
            </div>
          </div>

          <!-- URL Bar -->
          <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-emerald-500/30 shadow-sm">
            <Lock class="w-4 h-4 text-emerald-500 flex-shrink-0 ml-2" />
            <input
              type="text"
              readonly
              :value="t.url"
              class="bg-transparent border-0 text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none flex-1 truncate select-all px-2"
            />
            <button
              @click="copyUrl(t.url)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-sm transition flex-shrink-0 cursor-pointer"
            >
              <Check v-if="copiedUrl === t.url" class="w-3.5 h-3.5" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span>{{ copiedUrl === t.url ? $t('common.copied') : $t('common.copy') }}</span>
            </button>
            <button
              @click="openUrl(t.url)"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition flex-shrink-0 cursor-pointer"
            >
              <ExternalLink class="w-3.5 h-3.5" />
              <span>{{ $t('common.open') }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Human Empty State -->
      <div v-else class="p-8 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
        <div class="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
          <Globe class="w-6 h-6" />
        </div>
        <div>
          <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ $t('tunnels_view.empty_title') }}</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {{ $t('tunnels_view.empty_desc') }}
          </p>
        </div>
      </div>
    </div>

    <!-- SECTION 3: LANCEUR RAPIDE -->
    <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div>
        <h2 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Zap class="w-4 h-4 text-amber-500" />
          {{ $t('tunnels_view.quick_launcher_title') }}
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          {{ $t('tunnels_view.quick_launcher_desc') }}
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
        <!-- Project Select -->
        <div class="sm:col-span-5 space-y-1">
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">{{ $t('tunnels_view.project_label') }}</label>
          <select
            v-model="quickSelectedProject"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold"
          >
            <option :value="null" disabled>{{ $t('tunnels_view.select_project_placeholder') }}</option>
            <option v-for="proj in projects" :key="proj.name" :value="proj">
              {{ proj.name }} ({{ proj.domain }})
            </option>
          </select>
        </div>

        <!-- Provider Select -->
        <div class="sm:col-span-4 space-y-1">
          <label class="block text-xs font-medium text-slate-700 dark:text-slate-300">{{ $t('tunnels_view.engine_label') }}</label>
          <select
            v-model="quickSelectedProvider"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
          >
            <option value="cloudflare">{{ $t('tunnels_view.cf_option') }}</option>
            <option value="ngrok">{{ $t('tunnels_view.ngrok_option') }}</option>
          </select>
        </div>

        <!-- Launch Button -->
        <div class="sm:col-span-3">
          <button
            @click="launchQuickTunnel"
            :disabled="!quickSelectedProject || isLaunchingQuick || !nginxRunning"
            class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <RefreshCw v-if="isLaunchingQuick" class="w-3.5 h-3.5 animate-spin" />
            <Zap v-else class="w-3.5 h-3.5" />
            <span>{{ isLaunchingQuick ? $t('tunnels_view.connecting') : $t('tunnels_view.expose_btn') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- SECTION 4: JOURNAL DES REQUÊTES EN DIRECT (STREAM) -->
    <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
      <div class="px-5 py-3.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
            <Activity class="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {{ $t('tunnels_view.live_logs_title') }}
              <span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {{ $t('tunnels_view.live_logs_badge') }}
              </span>
            </h3>
            <p class="text-[11px] text-slate-500 dark:text-slate-400">
              {{ $t('tunnels_view.live_logs_desc') }}
            </p>
          </div>
        </div>

        <button
          @click="clearLogs"
          :disabled="!liveLogs.length"
          class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition flex items-center gap-1 disabled:opacity-40 cursor-pointer"
        >
          <Trash2 class="w-3 h-3" />
          <span>{{ $t('common.clear') }}</span>
        </button>
      </div>

      <div
        ref="logsBoxRef"
        class="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed max-h-60 overflow-y-auto space-y-1 select-text scrollbar-thin scrollbar-thumb-slate-800"
      >
        <div v-if="!liveLogs.length" class="text-slate-500 italic py-6 text-center">
          {{ $t('tunnels_view.waiting_requests') }}
        </div>
        <div
          v-for="(log, idx) in liveLogs"
          :key="idx"
          class="flex items-start gap-2 break-all"
          :class="{
            'text-emerald-400': log.type === 'request' || log.line.includes('200') || log.line.includes('ready'),
            'text-rose-400': log.type === 'error' || log.line.includes('error') || log.line.includes('500'),
            'text-amber-400': log.line.includes('warn') || log.line.includes('404'),
            'text-slate-300': log.type === 'info'
          }"
        >
          <span class="text-slate-600 select-none flex-shrink-0">[{{ log.time }}]</span>
          <span v-if="log.projectName" class="text-sky-400 font-bold select-none flex-shrink-0">[{{ log.projectName }}]</span>
          <span class="flex-1">{{ log.line }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { 
  Radio, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Zap, 
  XCircle, 
  Download, 
  Key, 
  Activity, 
  Wifi, 
  Sliders, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t } = useI18n();

const props = defineProps({
  projects: { type: Array, default: () => [] },
  activeTunnels: { type: Object, default: () => ({}) },
  nginxRunning: { type: Boolean, default: false }
});

const emit = defineEmits([
  'start-nginx',
  'tunnel-changed',
  'show-toast'
]);

// Providers state
const providers = ref([]);
const ngrokAuth = ref({ installed: false, configured: false });
const ngrokTokenInput = ref('');
const isSavingNgrokToken = ref(false);
const isUpdatingNgrok = ref(false);
const showNgrokEdit = ref(false);

const isDownloadingCf = ref(false);
const cfDownloadPercent = ref(0);

// Ping results map: projectName -> { success, status, latencyMs }
const pingResultMap = ref({});
const pingLoadingMap = ref({});
const copiedUrl = ref('');

// Quick launcher state
const quickSelectedProject = ref(null);
const quickSelectedProvider = ref('cloudflare');
const isLaunchingQuick = ref(false);

// Live logs stream
const liveLogs = ref([]);
const logsBoxRef = ref(null);

const activeTunnelsList = computed(() => {
  return Object.values(props.activeTunnels || {});
});

const ngrokProvider = computed(() => {
  return providers.value.find(p => p.id === 'ngrok') || null;
});

const cfProvider = computed(() => {
  return providers.value.find(p => p.id === 'cloudflare') || null;
});

const hasActiveNgrokTunnel = computed(() => {
  return activeTunnelsList.value.some(t => t.provider === 'ngrok');
});

const localNginxPort = computed(() => 80);

const preferredProvider = ref('cloudflare');

let removeLogListener = null;
let removeProgressListener = null;

async function loadProviders() {
  try {
    if (window.laratool?.tunnels?.getProviders) {
      providers.value = await window.laratool.tunnels.getProviders();
    }
    if (window.laratool?.tunnels?.getNgrokAuthStatus) {
      ngrokAuth.value = await window.laratool.tunnels.getNgrokAuthStatus();
    }
    if (window.laratool?.config?.get) {
      const cfg = await window.laratool.config.get();
      if (cfg?.preferredTunnelProvider) {
        preferredProvider.value = cfg.preferredTunnelProvider;
        quickSelectedProvider.value = cfg.preferredTunnelProvider;
      }
    }
  } catch (err) {
    console.warn('loadProviders error:', err);
  }
}

async function setPreferredEngine(providerId) {
  if (preferredProvider.value === providerId) return;
  preferredProvider.value = providerId;
  quickSelectedProvider.value = providerId;
  try {
    if (window.laratool?.config?.save) {
      await window.laratool.config.save({ preferredTunnelProvider: providerId });
    }
    const name = providerId === 'cloudflare' ? 'Cloudflare Tunnel' : 'Ngrok';
    emit('show-toast', { message: t('tunnels_view.toast_default_saved', { name }), type: 'success' });
    await loadProviders();
  } catch (err) {
    emit('show-toast', { message: t('tunnels_view.toast_save_error', { error: err.message }), type: 'error' });
  }
}

async function updateNgrok() {
  if (isUpdatingNgrok.value) return;
  isUpdatingNgrok.value = true;
  try {
    emit('show-toast', { message: t('tunnels_view.toast_ngrok_checking'), type: 'info' });
    const res = await window.laratool.tunnels.updateNgrok();
    emit('show-toast', { message: res.message || t('tunnels_view.toast_ngrok_updated', { version: res.version }), type: 'success' });
    await loadProviders();
  } catch (err) {
    emit('show-toast', { message: t('tunnels_view.toast_update_error', { error: err.message }), type: 'error' });
  } finally {
    isUpdatingNgrok.value = false;
  }
}

async function saveNgrokToken() {
  const token = ngrokTokenInput.value.trim();
  if (!token) return;
  isSavingNgrokToken.value = true;
  try {
    const res = await window.laratool.tunnels.setNgrokAuthToken(token);
    if (res.success) {
      emit('show-toast', { message: t('tunnels_view.toast_token_saved'), type: 'success' });
      ngrokTokenInput.value = '';
      showNgrokEdit.value = false;
      await loadProviders();
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

function openNgrokInspector() {
  const url = 'http://127.0.0.1:4040';
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
    emit('show-toast', { message: t('tunnels_view.toast_cf_downloading'), type: 'info' });
    const res = await window.laratool.tunnels.downloadCloudflared();
    if (res.success) {
      emit('show-toast', { message: t('tunnels_view.toast_cf_ready'), type: 'success' });
      await loadProviders();
    }
  } catch (err) {
    emit('show-toast', { message: t('tunnels_view.toast_cf_error', { error: err.message }), type: 'error' });
  } finally {
    isDownloadingCf.value = false;
  }
}

async function pingTunnelUrl(projectName, url) {
  if (pingLoadingMap.value[projectName]) return;
  pingLoadingMap.value[projectName] = true;
  try {
    const res = await window.laratool.tunnels.ping(url);
    pingResultMap.value[projectName] = res;
    emit('show-toast', {
      message: res.success ? t('tunnels_view.toast_ping_ok', { status: res.status, ms: res.latencyMs }) : `${t('common.error')}: ${res.error}`,
      type: res.success && res.status < 400 ? 'success' : 'info'
    });
  } catch (err) {
    pingResultMap.value[projectName] = { success: false, error: err.message };
  } finally {
    pingLoadingMap.value[projectName] = false;
  }
}

async function stopTunnel(projectName) {
  try {
    await window.laratool.tunnels.stop(projectName);
    emit('show-toast', { message: t('tunnels_view.toast_tunnel_stopped', { name: projectName }), type: 'info' });
    emit('tunnel-changed');
  } catch (err) {
    emit('show-toast', { message: t('tunnels_view.toast_stop_error', { error: err.message }), type: 'error' });
  }
}

async function launchQuickTunnel() {
  if (!quickSelectedProject.value || isLaunchingQuick.value) return;
  isLaunchingQuick.value = true;
  try {
    const proj = quickSelectedProject.value;
    const provider = quickSelectedProvider.value;
    emit('show-toast', { message: t('tunnels_view.toast_tunnel_starting', { name: proj.name }), type: 'info' });
    const res = await window.laratool.tunnels.start(proj.name, proj.domain, provider);
    if (res.success) {
      emit('show-toast', { message: t('tunnels_view.toast_tunnel_started', { url: res.url }), type: 'success' });
      emit('tunnel-changed');
    }
  } catch (err) {
    emit('show-toast', { message: t('tunnels_view.toast_start_error', { error: err.message }), type: 'error' });
  } finally {
    isLaunchingQuick.value = false;
  }
}

function copyUrl(url) {
  if (!url) return;
  navigator.clipboard.writeText(url);
  copiedUrl.value = url;
  emit('show-toast', { message: t('tunnels_view.toast_url_copied'), type: 'success' });
  setTimeout(() => {
    copiedUrl.value = '';
  }, 2000);
}

function openUrl(url) {
  if (!url) return;
  if (window.laratool?.system?.openExternal) {
    window.laratool.system.openExternal(url);
  } else {
    window.open(url, '_blank');
  }
}

function clearLogs() {
  liveLogs.value = [];
}

onMounted(() => {
  loadProviders();

  if (window.laratool?.tunnels?.onLog) {
    removeLogListener = window.laratool.tunnels.onLog((data) => {
      if (data && data.entry) {
        liveLogs.value.push({
          projectName: data.projectName,
          time: data.entry.time,
          line: data.entry.line,
          type: data.entry.type
        });
        if (liveLogs.value.length > 300) liveLogs.value.shift();
        setTimeout(() => {
          if (logsBoxRef.value) {
            logsBoxRef.value.scrollTop = logsBoxRef.value.scrollHeight;
          }
        }, 30);
      }
    });
  }

  if (window.laratool?.onDownloadProgress) {
    removeProgressListener = window.laratool.onDownloadProgress((data) => {
      if (data?.item === 'cloudflared') {
        cfDownloadPercent.value = data.percent || 0;
      }
    });
  }
});

onUnmounted(() => {
  if (removeLogListener) removeLogListener();
  if (removeProgressListener) removeProgressListener();
});
</script>
