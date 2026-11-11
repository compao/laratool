<template>
  <div class="p-8 space-y-6 max-w-5xl mx-auto w-full">
    <!-- Settings Sub-Navigation Tabs -->
    <div class="flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-x-auto shadow-sm">
      <button
        v-for="tab in settingTabs"
        :key="tab.id"
        @click="activeSettingTab = tab.id"
        class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 active:scale-95"
        :class="activeSettingTab === tab.id
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm font-bold'
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 border border-transparent'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- 1. Projets & Chemins (Parked Paths, TLD, Scan) -->
    <div v-if="activeSettingTab === 'projects'" class="space-y-6">
      <!-- Parked Directories -->
      <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FolderPlus class="w-4 h-4 text-rose-500" />
              <span>{{ $t('settings.projects.title') }}</span>
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('settings.projects.desc') }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="$emit('rescan')"
              :disabled="isRefreshing"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
              :title="$t('settings.projects.rescan')"
            >
              <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isRefreshing }" />
              <span class="hidden sm:inline">{{ $t('settings.projects.rescan') }}</span>
            </button>

            <button
              @click="$emit('add-parked')"
              class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
            >
              <FolderPlus class="w-3.5 h-3.5" />
              <span>{{ $t('settings.projects.add_folder') }}</span>
            </button>
          </div>
        </div>

        <!-- Parked Paths List -->
        <div class="space-y-2.5">
          <div
            v-for="path in config.parkedPaths"
            :key="path"
            class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition gap-3"
          >
            <div class="flex items-center gap-3 overflow-hidden min-w-0">
              <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <Folder class="w-4 h-4" />
              </div>
              <div class="min-w-0">
                <div class="text-xs text-slate-800 dark:text-slate-200 font-mono truncate font-medium" :title="path">
                  {{ path }}
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400">
                  {{ $t('settings.projects.projects_detected', { count: getProjectsCountInPath(path) }) }}
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5 flex-shrink-0">
              <button
                @click="openPathInExplorer(path)"
                class="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition text-xs"
                :title="$t('projects.open_folder')"
              >
                <Folder class="w-3.5 h-3.5" />
              </button>

              <button
                @click="copyText(path)"
                class="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition text-xs"
                :title="$t('common.copy')"
              >
                <Check v-if="copiedText === path" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>

              <button
                @click="$emit('remove-parked', path)"
                class="p-2 rounded-lg bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-700 transition"
                :title="$t('settings.projects.remove_folder')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div v-if="!config.parkedPaths || config.parkedPaths.length === 0" class="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <Folder class="w-8 h-8 text-slate-400 mx-auto" />
            <p class="text-xs text-slate-500">{{ $t('settings.projects.no_folders') }}</p>
          </div>
        </div>
      </div>

      <!-- Domain TLD Configuration -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Globe class="w-4 h-4 text-rose-500" />
              <span>{{ $t('settings.projects.tld_title') }}</span>
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('settings.projects.tld_desc') }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <select
              :value="config.tld || 'test'"
              @change="updateTld($event.target.value)"
              class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold"
            >
              <option value="test">.test ({{ $t('common.default') }})</option>
              <option value="localhost">.localhost</option>
              <option value="local">.local</option>
              <option value="site">.site</option>
            </select>
          </div>
        </div>

        <div class="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
          💡 {{ $t('settings.projects.tld_hint') }}
        </div>
      </div>
    </div>

    <!-- 2. Éditeur & Terminal (Code Editors & Shells) -->
    <div v-else-if="activeSettingTab === 'tools'" class="space-y-6">
      <!-- Preferred Code Editor -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.tools.editor_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.tools.editor_desc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div
            v-for="editor in availableEditors"
            :key="editor.id"
            @click="$emit('update-config', { preferredEditor: editor.id })"
            class="p-4 rounded-xl border text-left transition-all cursor-pointer relative"
            :class="[
              (config.preferredEditor === editor.id || (!config.preferredEditor && editor.id === 'code'))
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
            ]"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-900 dark:text-white">{{ editor.name }}</span>
              <span
                v-if="editor.detected"
                class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
              >
                {{ $t('common.ready') }}
              </span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {{ editor.desc }}
            </div>
          </div>
        </div>
      </div>

      <!-- Preferred Terminal Emulator -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Terminal class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.tools.terminal_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.tools.terminal_desc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div
            v-for="term in availableTerminals"
            :key="term.id"
            @click="term.enabled && $emit('update-config', { preferredTerminal: term.id })"
            class="p-4 rounded-xl border text-left transition-all"
            :class="[
              config.preferredTerminal === term.id
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 shadow-sm'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700',
              !term.enabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            ]"
          >
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-bold text-slate-900 dark:text-white">{{ term.name }}</span>
              <span
                v-if="term.detected"
                class="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20"
              >
                {{ $t('common.ready') }}
              </span>
              <span v-else class="text-[10px] text-slate-400">{{ $t('common.not_installed') }}</span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {{ term.desc }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. Runtimes & $PATH (PHP, Node, Shims) -->
    <div v-else-if="activeSettingTab === 'runtimes'" class="space-y-6">
      <!-- Default CLI Runtimes -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Cpu class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.runtimes.title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.runtimes.desc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- PHP Selector -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{{ $t('settings.runtimes.global_php') }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.runtimes.global_php_desc') }}</div>
            </div>
            <select
              :value="config.defaultPhpVersion || '8.3'"
              @change="$emit('set-default-php', $event.target.value)"
              class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold shadow-sm"
            >
              <option v-for="ver in availablePhp" :key="ver.id" :value="ver.id">
                PHP {{ ver.id }} {{ ver.installed ? '(' + $t('common.installed') + ')' : '' }}
              </option>
            </select>
          </div>

          <!-- Node Selector -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{{ $t('settings.runtimes.global_node') }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.runtimes.global_node_desc') }}</div>
            </div>
            <select
              :value="config.defaultNodeVersion || '20'"
              @change="$emit('set-default-node', $event.target.value)"
              class="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono font-semibold shadow-sm"
            >
              <option v-for="ver in availableNode" :key="ver.id" :value="ver.id">
                Node {{ ver.id }} {{ ver.installed ? '(' + $t('common.installed') + ')' : '' }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Shims & PATH Directory -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.runtimes.shims_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.runtimes.shims_desc') }}
          </p>
        </div>

        <div class="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 gap-3">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="font-mono text-xs text-slate-800 dark:text-slate-200 truncate">
              {{ config.binDir || '%USERPROFILE%\\.config\\laratool\\bin' }}
            </span>
          </div>

          <div class="flex items-center gap-2 flex-shrink-0">
            <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              ✓ {{ $t('settings.runtimes.registered_in_path') }}
            </span>
            <button
              v-if="config.binDir"
              @click="openPathInExplorer(config.binDir)"
              class="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700 transition"
              :title="$t('settings.runtimes.open_shims')"
            >
              {{ $t('settings.runtimes.open_shims') }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap text-xs text-slate-600 dark:text-slate-400">
          <span class="font-medium text-slate-700 dark:text-slate-300">{{ $t('settings.runtimes.integrated_commands') }}</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">php</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">composer</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">node</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">npm</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">npx</span>
          <span class="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-[11px]">cmder</span>
        </div>
      </div>
    </div>

    <!-- 4. Réseau & SSL (Nginx ports, mkcert, HTTPS) -->
    <div v-else-if="activeSettingTab === 'network'" class="space-y-6">
      <!-- HTTPS / SSL Section -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="space-y-1">
            <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock class="w-4 h-4 text-emerald-500" />
              <span>{{ $t('settings.network.ssl_title') }}</span>
            </h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('settings.network.ssl_desc') }}
            </p>
          </div>

          <!-- Toggle Switch for SSL -->
          <label class="relative inline-flex items-center cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              :checked="sslStatus?.enabled"
              @change="$emit('toggle-ssl', $event.target.checked)"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            <span class="ml-3 text-xs font-semibold text-slate-700 dark:text-slate-200">
              {{ sslStatus?.enabled ? $t('settings.network.ssl_active') : $t('settings.network.ssl_disabled') }}
            </span>
          </label>
        </div>

        <!-- SSL Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <!-- Root CA -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="space-y-1">
              <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck class="w-4 h-4 text-emerald-500" />
                <span>{{ $t('settings.network.root_ca') }}</span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">
                {{ sslStatus?.caInstalled ? $t('settings.network.ca_installed') : $t('settings.network.ca_not_installed') }}
              </div>
            </div>
            <button
              v-if="!sslStatus?.caInstalled"
              @click="$emit('install-ca')"
              class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
            >
              {{ $t('settings.network.install_ca') }}
            </button>
            <span v-else class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {{ $t('settings.network.ca_trusted') }}
            </span>
          </div>

          <!-- Wildcard Cert -->
          <div class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="space-y-1">
              <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Key class="w-4 h-4 text-emerald-500" />
                <span>{{ $t('settings.network.wildcard_cert') }}</span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {{ sslStatus?.wildcardReady ? $t('settings.network.wildcard_ready') : $t('settings.network.wildcard_waiting') }}
              </div>
            </div>
            <span v-if="sslStatus?.wildcardReady" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              ✓ {{ $t('settings.network.wildcard_ready_port') }}
            </span>
            <span v-else class="text-xs text-slate-400">
              {{ $t('settings.network.wildcard_waiting') }}
            </span>
          </div>
        </div>

        <div v-if="config.sslDir" class="flex items-center justify-between pt-1 text-xs">
          <span class="text-slate-500 dark:text-slate-400">{{ $t('settings.network.cert_location') }}</span>
          <button
            @click="openPathInExplorer(config.sslDir)"
            class="text-rose-600 dark:text-rose-400 hover:underline font-mono text-[11px]"
          >
            {{ config.sslDir }}
          </button>
        </div>
      </div>

      <!-- Ports Configuration -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Server class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.network.ports_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.network.ports_desc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ $t('settings.network.http_port') }}</div>
              <div class="text-[11px] text-slate-500">{{ $t('settings.network.http_desc') }}</div>
            </div>
            <span class="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
              80
            </span>
          </div>

          <div class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <div class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ $t('settings.network.https_port') }}</div>
              <div class="text-[11px] text-slate-500">{{ $t('settings.network.https_desc') }}</div>
            </div>
            <span class="font-mono font-bold text-xs bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700">
              443
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 5. Système & Démarrage (Startup, Tray, Theme) -->
    <div v-else-if="activeSettingTab === 'system'" class="space-y-6">
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.system.title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.system.desc') }}
          </p>
        </div>

        <div class="space-y-3.5">
          <!-- Auto-start Environment -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{{ $t('settings.system.auto_start') }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.system.auto_start_desc') }}</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="config.autoStartEnvironment !== false"
                @change="$emit('update-config', { autoStartEnvironment: $event.target.checked })"
                class="sr-only peer"
              />
              <div class="w-10 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <!-- Minimize to Tray -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{{ $t('settings.system.tray') }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.system.tray_desc') }}</div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                :checked="config.minimizeToTray !== false"
                @change="$emit('update-config', { minimizeToTray: $event.target.checked })"
                class="sr-only peer"
              />
              <div class="w-10 h-5 bg-slate-300 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
            </label>
          </div>

          <!-- Theme Preference -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white">{{ $t('settings.system.theme') }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.system.theme_desc') }}</div>
            </div>
            <div class="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800">
              <button
                @click="!isDarkMode && $emit('toggle-theme')"
                class="px-3 py-1 rounded-md text-xs font-semibold transition"
                :class="isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'"
              >
                {{ $t('settings.system.theme_dark') }}
              </button>
              <button
                @click="isDarkMode && $emit('toggle-theme')"
                class="px-3 py-1 rounded-md text-xs font-semibold transition"
                :class="!isDarkMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'"
              >
                {{ $t('settings.system.theme_light') }}
              </button>
            </div>
          </div>

          <!-- Language Preference -->
          <div class="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Languages class="w-3.5 h-3.5 text-rose-500" />
                <span>{{ $t('settings.system.language') }}</span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('settings.system.language_desc') }}</div>
            </div>
            <div class="flex items-center gap-1.5 p-1 bg-slate-200/80 dark:bg-slate-900 rounded-lg border border-slate-300 dark:border-slate-800">
              <button
                v-for="l in availableLocales"
                :key="l.code"
                @click="setLocale(l.code)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition"
                :class="locale === l.code ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'"
              >
                <span>{{ l.flag }}</span>
                <span>{{ l.name }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 6. Maintenance & Stockage (Logs, Cache, Info) -->
    <div v-else-if="activeSettingTab === 'maintenance'" class="space-y-6">
      <!-- Directories and Storage -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HardDrive class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.maintenance.storage_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            {{ $t('settings.maintenance.storage_desc') }}
          </p>
        </div>

        <div class="space-y-2.5">
          <div
            v-for="dir in storageDirectories"
            :key="dir.label"
            class="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800"
          >
            <div>
              <div class="text-xs font-bold text-slate-800 dark:text-slate-200">{{ dir.label }}</div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{{ dir.path }}</div>
            </div>
            <button
              v-if="dir.path"
              @click="openPathInExplorer(dir.path)"
              class="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
            >
              {{ $t('settings.runtimes.open_shims') }}
            </button>
          </div>
        </div>
      </div>

      <!-- System Diagnostic Info -->
      <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Info class="w-4 h-4 text-rose-500" />
            <span>{{ $t('settings.maintenance.about_title') }}</span>
          </h4>
          <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('settings.maintenance.about_desc') }}</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ $t('settings.maintenance.version') }}</div>
            <div class="font-bold text-slate-900 dark:text-white mt-0.5">LaraTool v1.0.0</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ $t('settings.maintenance.platform') }}</div>
            <div class="font-bold text-slate-900 dark:text-white mt-0.5">Windows (x64)</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ $t('settings.maintenance.web_server') }}</div>
            <div class="font-bold text-slate-900 dark:text-white mt-0.5">Nginx Standalone</div>
          </div>
          <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <div class="text-slate-500 dark:text-slate-400 text-[11px]">{{ $t('settings.maintenance.php_engines') }}</div>
            <div class="font-bold text-slate-900 dark:text-white mt-0.5">{{ availablePhp.length }} version(s)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { 
  Folder, 
  FolderPlus, 
  Trash2, 
  Lock, 
  ShieldCheck, 
  Key,
  Cpu,
  Terminal,
  Code,
  Globe,
  Sliders,
  HardDrive,
  Info,
  RefreshCw,
  Layers,
  Server,
  Copy,
  Check,
  Languages
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t, locale, setLocale, availableLocales } = useI18n();

const props = defineProps({
  config: { type: Object, default: () => ({}) },
  sslStatus: { type: Object, default: () => ({ enabled: false, caInstalled: false, wildcardReady: false }) },
  availablePhp: { type: Array, default: () => [] },
  availableNode: { type: Array, default: () => [] },
  projects: { type: Array, default: () => [] },
  isRefreshing: { type: Boolean, default: false },
  isDarkMode: { type: Boolean, default: true }
});

const emit = defineEmits([
  'add-parked', 
  'remove-parked', 
  'update-config', 
  'toggle-ssl', 
  'install-ca',
  'set-default-php',
  'set-default-node',
  'open-explorer',
  'toggle-theme',
  'rescan',
  'show-toast'
]);

const activeSettingTab = ref('projects');
const copiedText = ref(null);

const settingTabs = computed(() => [
  { id: 'projects', label: t('settings.tabs.projects'), icon: FolderPlus },
  { id: 'tools', label: t('settings.tabs.tools'), icon: Code },
  { id: 'runtimes', label: t('settings.tabs.runtimes'), icon: Cpu },
  { id: 'network', label: t('settings.tabs.network'), icon: Lock },
  { id: 'system', label: t('settings.tabs.system'), icon: Sliders },
  { id: 'maintenance', label: t('settings.tabs.maintenance'), icon: HardDrive }
]);

const availableEditors = computed(() => [
  { id: 'code', name: 'VS Code', desc: t('settings.tools.editor_vscode_desc'), detected: props.config.hasVsCode },
  { id: 'cursor', name: 'Cursor', desc: t('settings.tools.editor_cursor_desc'), detected: props.config.hasCursor },
  { id: 'phpstorm', name: 'PhpStorm', desc: t('settings.tools.editor_phpstorm_desc'), detected: props.config.hasPhpStorm },
  { id: 'subl', name: 'Sublime Text', desc: t('settings.tools.editor_subl_desc'), detected: props.config.hasSublime },
  { id: 'notepad++', name: 'Notepad++', desc: t('settings.tools.editor_notepadpp_desc'), detected: props.config.hasNotepadPlusPlus },
  { id: 'notepad', name: 'Bloc-notes', desc: t('settings.tools.editor_notepad_desc'), detected: true }
]);

const availableTerminals = computed(() => [
  { id: 'wt', name: 'Windows Terminal', desc: t('settings.tools.term_wt_desc'), enabled: props.config.hasWindowsTerminal, detected: props.config.hasWindowsTerminal },
  { id: 'cmder', name: 'Cmder', desc: t('settings.tools.term_cmder_desc'), enabled: props.config.hasCmder, detected: props.config.hasCmder },
  { id: 'powershell', name: 'PowerShell', desc: t('settings.tools.term_powershell_desc'), enabled: true, detected: true },
  { id: 'bash', name: 'Git Bash', desc: t('settings.tools.term_bash_desc'), enabled: props.config.hasGitBash, detected: props.config.hasGitBash }
]);

const storageDirectories = computed(() => [
  { label: t('settings.maintenance.root_dir'), path: props.config.rootDir },
  { label: t('settings.maintenance.shims_dir'), path: props.config.binDir },
  { label: t('settings.maintenance.ssl_dir'), path: props.config.sslDir },
  { label: t('settings.maintenance.logs_dir'), path: props.config.logsDir },
  { label: t('settings.maintenance.sites_dir'), path: props.config.sitesDir }
]);

function getProjectsCountInPath(parkedPath) {
  if (!Array.isArray(props.projects)) return 0;
  const normalized = parkedPath.toLowerCase().replace(/\\/g, '/');
  return props.projects.filter(p => {
    const pPath = (p.path || '').toLowerCase().replace(/\\/g, '/');
    return pPath.startsWith(normalized);
  }).length;
}

function updateTld(val) {
  emit('update-config', { tld: val });
  emit('show-toast', `Extension locale définie sur .${val}`);
}

function openPathInExplorer(p) {
  if (!p) return;
  emit('open-explorer', p);
}

function copyText(str) {
  navigator.clipboard.writeText(str);
  copiedText.value = str;
  setTimeout(() => {
    copiedText.value = null;
  }, 2000);
}

watch(activeSettingTab, (newTab) => {
  if (newTab) {
    try {
      localStorage.setItem('laratool_settings_tab', newTab);
    } catch {}
  }
});

onMounted(() => {
  const savedTab = localStorage.getItem('laratool_settings_tab');
  if (savedTab && settingTabs.some(t => t.id === savedTab)) {
    activeSettingTab.value = savedTab;
  }
});
</script>
