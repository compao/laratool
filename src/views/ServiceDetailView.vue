<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200 relative">
    <!-- Top Action Bar & Identity -->
    <div class="px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex items-center justify-between gap-4 flex-shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Back Button -->
        <button
          @click="$emit('back')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700/80 transition shadow-sm flex-shrink-0"
          :title="$t('service_detail.back_to_services')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ $t('service_detail.back_to_services') }}</span>
        </button>

        <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

        <!-- Service Identity -->
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border flex-shrink-0 shadow-sm"
            :class="serviceColors[serviceId] || 'bg-slate-800 border-slate-700 text-slate-200'"
          >
            <component :is="serviceIcons[serviceId] || Database" class="w-5 h-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">{{ details?.name || serviceId }}</h2>
              <span class="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wider" :class="categoryBadge(details?.category)">
                {{ categoryLabel(details?.category) }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full"
                :class="details?.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="details?.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'"></span>
                {{ details?.running ? $t('common.active') : $t('common.stopped') }}
              </span>
            </div>
            <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{{ $t('common.port') }} : <code class="font-mono text-slate-700 dark:text-slate-300 font-semibold">{{ details?.port }}</code></span>
              <span v-if="details?.webPort">• Web : <code class="font-mono text-slate-700 dark:text-slate-300">{{ details?.webPort }}</code></span>
              <span v-if="details?.hasVersions">• {{ $t('common.version') }} : <span class="font-mono text-rose-500 font-semibold">{{ details?.activeVersionName || details?.activeVersion }}</span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Header Actions (Service Controls) -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <!-- Start / Stop / Restart -->
        <template v-if="details?.installed">
          <button
            v-if="!details?.running"
            @click="startService"
            :disabled="isOperating"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition disabled:opacity-50"
          >
            <Play class="w-3.5 h-3.5 fill-current" />
            <span>{{ $t('common.start') }}</span>
          </button>
          <template v-else>
            <button
              @click="stopService"
              :disabled="isOperating"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition disabled:opacity-50"
            >
              <Square class="w-3.5 h-3.5 fill-current" />
              <span>{{ $t('common.stop') }}</span>
            </button>
            <button
              @click="restartService"
              :disabled="isOperating"
              class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
              :title="$t('common.restart')"
            >
              <RotateCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isOperating }" />
            </button>
          </template>
        </template>
        <button
          v-else
          @click="installService"
          :disabled="isOperating"
          class="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
        >
          <Download class="w-3.5 h-3.5" />
          <span>{{ $t('common.install') }}</span>
        </button>

        <!-- Web UI Button -->
        <button
          v-if="details?.webPort || details?.id === 'mysql' || details?.id === 'postgres' || details?.id === 'couchdb'"
          @click="openWebUi"
          class="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
          :title="$t('services.open_web_ui')"
        >
          <ExternalLink class="w-3.5 h-3.5" />
          <span class="hidden md:inline">{{ $t('services.open_web_ui') }}</span>
        </button>
      </div>
    </div>

    <!-- Sub Navigation Tabs -->
    <div class="px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 flex-shrink-0">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="activeTab = tab.id"
        class="py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-2"
        :class="activeTab === tab.id ? 'border-rose-600 text-rose-600 dark:text-rose-400' : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'"
      >
        <component :is="tab.icon" class="w-4 h-4" />
        <span>{{ tab.label }}</span>
        <span v-if="tab.badge" class="px-1.5 py-0.2 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500">
          {{ tab.badge }}
        </span>
      </button>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-8 space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <RotateCw class="w-8 h-8 animate-spin text-rose-500" />
        <p class="text-xs">Chargement des détails de {{ serviceId }}...</p>
      </div>

      <template v-else-if="details">
        <!-- ========================================== -->
        <!-- TAB 1: CONFIGURATION & RESEAU -->
        <!-- ========================================== -->
        <div v-if="activeTab === 'config'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            <!-- Left Column: Network & Version Settings (7 cols) -->
            <div class="lg:col-span-7 space-y-6">
              <!-- Network Port Card -->
              <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Server class="w-4 h-4 text-rose-500" />
                    {{ $t('service_detail.tcp_port') }}
                  </h3>
                  <span class="text-xs text-slate-500 font-mono">127.0.0.1</span>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-slate-600 dark:text-slate-400 block leading-relaxed">
                    {{ $t('service_detail.tcp_port_desc') }}
                  </label>

                  <div class="flex items-center gap-3">
                    <div class="relative w-40">
                      <input
                        v-model.number="formPort"
                        type="number"
                        min="1"
                        max="65535"
                        class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono text-center focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    <button
                      v-if="Number(formPort) !== Number(details.defaultPort)"
                      @click="formPort = details.defaultPort"
                      type="button"
                      class="px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition border border-rose-200 dark:border-rose-900/50"
                    >
                      {{ $t('services.default_port', { port: details.defaultPort }) }}
                    </button>

                    <button
                      @click="saveNetworkConfig"
                      :disabled="isSavingConfig || !isPortChanged"
                      class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <Check class="w-3.5 h-3.5" />
                      <span>{{ $t('common.save') }}</span>
                    </button>
                  </div>

                  <p v-if="isPortChanged" class="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                    <span>{{ $t('service_detail.port_restart_hint', { port: formPort }) }}</span>
                  </p>
                </div>
              </div>

              <!-- Multi-Version Selection Card (if applicable) -->
              <div v-if="details.hasVersions" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Layers class="w-4 h-4 text-indigo-500" />
                    {{ $t('service_detail.engine_version_title') }}
                  </h3>
                  <span class="text-xs text-indigo-500 font-mono font-semibold">{{ details.activeVersionName || details.activeVersion }}</span>
                </div>

                <div class="space-y-3">
                  <label class="text-xs text-slate-600 dark:text-slate-400 block leading-relaxed">
                    {{ $t('service_detail.engine_version_desc') }}
                  </label>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      v-for="ver in details.versions"
                      :key="ver.key"
                      @click="selectVersion(ver.key)"
                      class="p-3 rounded-xl border cursor-pointer transition select-none flex items-center justify-between gap-3"
                      :class="ver.key === formVersion ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                    >
                      <div>
                        <div class="font-bold text-xs text-slate-900 dark:text-white">{{ ver.name }}</div>
                        <div class="text-[11px] text-slate-500 mt-0.5">
                          {{ ver.installed ? $t('service_detail.installed_ready') : $t('service_detail.not_downloaded') }}
                        </div>
                      </div>
                      <span
                        v-if="ver.key === details.activeVersion"
                        class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                      >
                        {{ $t('common.active') }}
                      </span>
                    </div>
                  </div>

                  <div v-if="formVersion !== details.activeVersion" class="pt-2 flex items-center justify-between gap-3">
                    <span class="text-xs text-amber-600 dark:text-amber-400">{{ $t('service_detail.selected_version', { version: formVersion }) }}</span>
                    <button
                      @click="saveVersionConfig"
                      :disabled="isSavingConfig"
                      class="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
                    >
                      {{ $t('service_detail.apply_version') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Process Supervisor Runtime Info -->
              <div v-if="details.processInfo" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <Activity class="w-4 h-4 text-emerald-500" />
                  {{ $t('service_detail.supervisor_process_title') }}
                </h3>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span class="text-slate-400 text-[10px] block">{{ $t('service_detail.pid') }}</span>
                    <span class="font-mono font-bold text-slate-800 dark:text-slate-200">{{ details.processInfo.pid }}</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span class="text-slate-400 text-[10px] block">{{ $t('common.status') }}</span>
                    <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ details.processInfo.status }}</span>
                  </div>
                  <div class="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 col-span-2">
                    <span class="text-slate-400 text-[10px] block">{{ $t('service_detail.started_at') }}</span>
                    <span class="font-mono text-slate-700 dark:text-slate-300">{{ formatTimestamp(details.processInfo.startedAt) }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Right Column: Storage & Directory Paths (5 cols) -->
            <div class="lg:col-span-5 space-y-6">
              <!-- Directories Card -->
              <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <Folder class="w-4 h-4 text-amber-500" />
                  {{ $t('service_detail.disk_locations_title') }}
                </h3>

                <div class="space-y-4 text-xs">
                  <!-- Server dir -->
                  <div v-if="details.serverDir" class="space-y-1">
                    <div class="flex items-center justify-between text-slate-500">
                      <span>{{ $t('service_detail.server_folder') }}</span>
                      <button
                        @click="openExplorer(details.serverDir)"
                        class="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink class="w-3 h-3" />
                        {{ $t('service_detail.explorer_btn') }}
                      </button>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] truncate text-slate-700 dark:text-slate-300 select-all">
                      {{ details.serverDir }}
                    </div>
                  </div>

                  <!-- Data dir -->
                  <div v-if="details.dataDir" class="space-y-1">
                    <div class="flex items-center justify-between text-slate-500">
                      <span>{{ $t('service_detail.data_folder') }}</span>
                      <button
                        @click="openExplorer(details.dataDir)"
                        class="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink class="w-3 h-3" />
                        {{ $t('service_detail.explorer_btn') }}
                      </button>
                    </div>
                    <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] truncate text-slate-700 dark:text-slate-300 select-all">
                      {{ details.dataDir }}
                    </div>
                  </div>

                  <!-- Binary Exe -->
                  <div v-if="details.binaryPath" class="space-y-1">
                    <span class="text-slate-500 block">{{ $t('service_detail.binary_exe') }}</span>
                    <div class="p-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] truncate text-slate-700 dark:text-slate-300 select-all">
                      {{ details.binaryPath }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick .env Card -->
              <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Copy class="w-4 h-4 text-emerald-500" />
                    {{ $t('service_detail.laravel_env_snippet') }}
                  </h3>
                  <button
                    @click="copySnippet"
                    class="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  >
                    {{ copied ? $t('common.copied') : $t('common.copy') }}
                  </button>
                </div>
                <div class="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto">
                  <pre class="leading-relaxed">{{ details.envSnippet }}</pre>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 2: OUTILS & ACTIONS RAPIDES -->
        <!-- ========================================== -->
        <div v-else-if="activeTab === 'tools'" class="space-y-6">
          <!-- Database Creator Card (for MySQL / Postgres) -->
          <div v-if="details.id === 'mysql' || details.id === 'postgres'" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Database class="w-4 h-4 text-blue-500" />
              {{ $t('service_detail.db_creator_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('service_detail.db_creator_desc', { name: details.name }) }}
            </p>

            <div class="flex items-center gap-3">
              <input
                v-model="newDatabaseName"
                type="text"
                :placeholder="$t('service_detail.db_name_placeholder')"
                @keyup.enter="createDatabase"
                class="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-rose-500"
              />
              <button
                @click="createDatabase"
                :disabled="isCreatingDb || !newDatabaseName.trim()"
                class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ $t('service_detail.create_db_btn') }}</span>
              </button>
            </div>
          </div>

          <!-- Mailpit Tools Card -->
          <div v-else-if="details.id === 'mailpit'" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Mail class="w-4 h-4 text-orange-500" />
              {{ $t('service_detail.mailpit_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('service_detail.mailpit_desc') }}
            </p>
            <button
              @click="openWebUi"
              class="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow transition inline-flex items-center gap-2"
            >
              <ExternalLink class="w-4 h-4" />
              {{ $t('service_detail.open_mailpit_btn', { port: details.webPort }) }}
            </button>
          </div>

          <!-- MinIO / SeaweedFS Tools Card -->
          <div v-else-if="details.id === 'minio'" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Cloud class="w-4 h-4 text-rose-500" />
              {{ $t('service_detail.s3_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('service_detail.s3_desc') }}
            </p>
            <button
              @click="openWebUi"
              class="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition inline-flex items-center gap-2"
            >
              <ExternalLink class="w-4 h-4" />
              {{ $t('service_detail.open_s3_btn', { port: details.webPort }) }}
            </button>
          </div>

          <!-- Reverb / Soketi Tools Card -->
          <div v-else-if="details.id === 'reverb' || details.id === 'soketi'" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Radio class="w-4 h-4 text-violet-500" />
              {{ $t('service_detail.websocket_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('service_detail.websocket_desc') }}
            </p>
            <div class="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
              <div>npm install --save-dev laravel-echo pusher-js</div>
            </div>
          </div>

          <!-- Search Engines Tools Card -->
          <div v-else-if="details.id === 'meilisearch' || details.id === 'typesense'" class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm max-w-2xl">
            <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Search class="w-4 h-4 text-purple-500" />
              {{ $t('service_detail.search_title') }}
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">
              {{ $t('service_detail.search_desc') }}
            </p>
            <div class="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto space-y-1">
              <div>php artisan scout:import "App\Models\User"</div>
              <div>php artisan scout:flush "App\Models\User"</div>
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 3: FICHIER DE CONFIGURATION -->
        <!-- ========================================== -->
        <div v-else-if="activeTab === 'file'" class="space-y-4">
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText class="w-4 h-4 text-rose-500" />
                  {{ $t('service_detail.config_editor_title') }}
                </h3>
                <p class="text-xs text-slate-500 mt-0.5">
                  {{ details.configFile ? $t('service_detail.file_label', { path: details.configFile }) : $t('service_detail.no_dedicated_config') }}
                </p>
              </div>

              <button
                v-if="details.configFile"
                @click="saveConfigFile"
                :disabled="isSavingFile"
                class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition disabled:opacity-50 flex items-center gap-1.5"
              >
                <Save class="w-3.5 h-3.5" />
                <span>{{ $t('service_detail.save_and_restart') }}</span>
              </button>
            </div>

            <div v-if="details.configFile">
              <textarea
                v-model="editorContent"
                rows="18"
                class="w-full bg-slate-950 text-slate-200 font-mono text-xs p-4 rounded-xl border border-slate-800 focus:outline-none focus:border-rose-500 leading-relaxed resize-y"
              ></textarea>
            </div>
            <div v-else class="text-center py-12 text-slate-500 text-xs">
              {{ $t('service_detail.supervisor_cli_notice') }}
            </div>
          </div>
        </div>

        <!-- ========================================== -->
        <!-- TAB 4: LOGS & SORTIE CONSOLE -->
        <!-- ========================================== -->
        <div v-else-if="activeTab === 'logs'" class="space-y-4">
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3 shadow-sm">
            <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Terminal class="w-4 h-4 text-slate-400" />
                {{ $t('service_detail.realtime_logs_title') }} ({{ serviceId }}.log)
              </h3>
              <div class="flex items-center gap-2">
                <button
                  @click="loadDetails"
                  class="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1"
                >
                  <RotateCw class="w-3 h-3" />
                  {{ $t('common.refresh') }}
                </button>
              </div>
            </div>

            <div class="bg-slate-950 text-slate-300 font-mono text-xs p-4 rounded-xl border border-slate-800 min-h-[300px] max-h-[500px] overflow-y-auto leading-relaxed">
              <div v-if="!details.logs || details.logs.length === 0" class="text-slate-600 italic">
                {{ $t('service_detail.waiting_logs') }}
              </div>
              <div v-for="(line, idx) in details.logs" :key="idx" class="whitespace-pre-wrap">
                {{ line }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- Error Fallback State -->
      <div v-else class="flex flex-col items-center justify-center py-24 text-slate-500 space-y-4">
        <div class="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
          <AlertTriangle class="w-6 h-6" />
        </div>
        <div class="text-center">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white">{{ $t('common.error') || 'Erreur' }}</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm">{{ $t('service_detail.failed_to_load') || 'Impossible de charger les détails pour ce service.' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <button @click="loadDetails" class="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition">
            {{ $t('common.retry') || 'Réessayer' }}
          </button>
          <button @click="$emit('back')" class="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition">
            {{ $t('common.back') || 'Retour' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import {
  ArrowLeft,
  Server,
  Play,
  Square,
  RotateCw,
  ExternalLink,
  Download,
  Check,
  Folder,
  Copy,
  Plus,
  Activity,
  FileText,
  Save,
  Terminal,
  Database,
  Layers,
  Mail,
  Search,
  Cloud,
  Radio,
  AlertTriangle,
  Zap
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t } = useI18n();

const props = defineProps({
  serviceId: { type: String, required: true }
});

const emit = defineEmits([
  'back',
  'start-service',
  'stop-service',
  'restart-service',
  'show-toast'
]);

const details = ref(null);
const isLoading = ref(true);
const isOperating = ref(false);
const isSavingConfig = ref(false);
const isSavingFile = ref(false);
const isCreatingDb = ref(false);
const copied = ref(false);

const activeTab = ref('config');
const formPort = ref(null);
const formVersion = ref(null);
const editorContent = ref('');
const newDatabaseName = ref('');

const tabs = computed(() => [
  { id: 'config', label: t('service_detail.tabs.config'), icon: Server },
  { id: 'tools', label: t('service_detail.tabs.tools'), icon: Zap },
  { id: 'file', label: t('service_detail.tabs.file'), icon: FileText },
  { id: 'logs', label: t('service_detail.tabs.logs'), icon: Terminal }
]);

const serviceIcons = {
  mysql: Database,
  postgres: Server,
  mongodb: Database,
  couchdb: Database,
  redis: Layers,
  memcached: Layers,
  mailpit: Mail,
  meilisearch: Search,
  typesense: Search,
  reverb: Radio,
  soketi: Zap,
  minio: Cloud
};

const serviceColors = {
  mysql: 'bg-blue-500/10 border-blue-500/20 text-blue-500 dark:text-blue-400',
  postgres: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 dark:text-indigo-400',
  mongodb: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 dark:text-emerald-400',
  couchdb: 'bg-amber-500/10 border-amber-500/20 text-amber-500 dark:text-amber-400',
  redis: 'bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400',
  memcached: 'bg-rose-500/10 border-rose-500/20 text-rose-500 dark:text-rose-400',
  mailpit: 'bg-orange-500/10 border-orange-500/20 text-orange-500 dark:text-orange-400',
  meilisearch: 'bg-purple-500/10 border-purple-500/20 text-purple-500 dark:text-purple-400',
  typesense: 'bg-sky-500/10 border-sky-500/20 text-sky-500 dark:text-sky-400',
  reverb: 'bg-violet-500/10 border-violet-500/20 text-violet-500 dark:text-violet-400',
  soketi: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 dark:text-cyan-400',
  minio: 'bg-rose-600/10 border-rose-600/20 text-rose-500'
};

const isPortChanged = computed(() => {
  return details.value && Number(formPort.value) !== Number(details.value.port);
});

async function loadDetails() {
  isLoading.value = true;
  try {
    if (window.laratool?.services?.getDetails) {
      const res = await window.laratool.services.getDetails(props.serviceId);
      details.value = res;
      formPort.value = res?.port;
      formVersion.value = res?.activeVersion || (res?.versions && res?.versions[0]?.key);
      editorContent.value = res?.configContent || '';
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur détails service: ${err.message}`, type: 'error' });
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  loadDetails();
});

watch(() => props.serviceId, () => {
  loadDetails();
});

async function startService() {
  isOperating.value = true;
  try {
    if (window.laratool?.services?.start) {
      await window.laratool.services.start(props.serviceId);
      emit('show-toast', { message: `${details.value?.name || props.serviceId} démarré avec succès.`, type: 'success' });
      await loadDetails();
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur démarrage : ${err.message}`, type: 'error' });
  } finally {
    isOperating.value = false;
  }
}

async function stopService() {
  isOperating.value = true;
  try {
    if (window.laratool?.services?.stop) {
      await window.laratool.services.stop(props.serviceId);
      emit('show-toast', { message: `${details.value?.name || props.serviceId} arrêté.`, type: 'info' });
      await loadDetails();
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur arrêt : ${err.message}`, type: 'error' });
  } finally {
    isOperating.value = false;
  }
}

async function restartService() {
  isOperating.value = true;
  try {
    if (window.laratool?.services?.restart) {
      await window.laratool.services.restart(props.serviceId);
      emit('show-toast', { message: `${details.value?.name || props.serviceId} redémarré.`, type: 'success' });
      await loadDetails();
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur redémarrage : ${err.message}`, type: 'error' });
  } finally {
    isOperating.value = false;
  }
}

async function installService() {
  isOperating.value = true;
  try {
    emit('show-toast', { message: `Téléchargement de ${details.value?.name} en cours...`, type: 'info' });
    if (window.laratool?.services?.install) {
      await window.laratool.services.install(props.serviceId, formVersion.value);
      emit('show-toast', { message: `${details.value?.name} installé avec succès !`, type: 'success' });
      await loadDetails();
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur installation : ${err.message}`, type: 'error' });
  } finally {
    isOperating.value = false;
  }
}

async function saveNetworkConfig() {
  if (!formPort.value) return;
  isSavingConfig.value = true;
  try {
    if (window.laratool?.services?.saveConfig) {
      const res = await window.laratool.services.saveConfig(props.serviceId, {
        port: formPort.value,
        version: formVersion.value
      });
      details.value = res;
      emit('show-toast', { message: `Configuration réseau enregistrée (Port : ${formPort.value})`, type: 'success' });
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur enregistrement port : ${err.message}`, type: 'error' });
  } finally {
    isSavingConfig.value = false;
  }
}

function selectVersion(vKey) {
  formVersion.value = vKey;
}

async function saveVersionConfig() {
  isSavingConfig.value = true;
  try {
    if (window.laratool?.services?.saveConfig) {
      const res = await window.laratool.services.saveConfig(props.serviceId, {
        port: formPort.value,
        version: formVersion.value
      });
      details.value = res;
      emit('show-toast', { message: `Version appliquée : ${formVersion.value}`, type: 'success' });
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur changement version : ${err.message}`, type: 'error' });
  } finally {
    isSavingConfig.value = false;
  }
}

async function saveConfigFile() {
  isSavingFile.value = true;
  try {
    if (window.laratool?.services?.saveConfigFile) {
      await window.laratool.services.saveConfigFile(props.serviceId, editorContent.value);
      emit('show-toast', { message: `Fichier de configuration enregistré et service redémarré.`, type: 'success' });
      await loadDetails();
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur sauvegarde fichier : ${err.message}`, type: 'error' });
  } finally {
    isSavingFile.value = false;
  }
}

async function createDatabase() {
  const db = newDatabaseName.value.trim();
  if (!db) return;
  isCreatingDb.value = true;
  try {
    if (window.laratool?.services?.createDb) {
      await window.laratool.services.createDb(props.serviceId, db);
      emit('show-toast', { message: `Base de données « ${db} » créée avec succès !`, type: 'success' });
      newDatabaseName.value = '';
    }
  } catch (err) {
    emit('show-toast', { message: `Erreur création base : ${err.message}`, type: 'error' });
  } finally {
    isCreatingDb.value = false;
  }
}

function openWebUi() {
  if (window.laratool?.services?.openWeb) {
    window.laratool.services.openWeb(props.serviceId);
  }
}

function openExplorer(p) {
  if (p && window.laratool?.services?.openPath) {
    window.laratool.services.openPath(p);
  }
}

function copySnippet() {
  if (details.value?.envSnippet) {
    navigator.clipboard.writeText(details.value.envSnippet);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 2000);
  }
}

function formatTimestamp(isoStr) {
  if (!isoStr) return '-';
  try {
    return new Date(isoStr).toLocaleTimeString();
  } catch {
    return isoStr;
  }
}

function categoryBadge(cat) {
  switch (cat) {
    case 'database':
    case 'sql':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'nosql':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'cache':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    case 'realtime':
      return 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20';
    case 'search':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    case 'storage':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    case 'tools':
    case 'email':
      return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20';
    default:
      return 'bg-slate-800 text-slate-300';
  }
}

function categoryLabel(cat) {
  switch (cat) {
    case 'database':
    case 'sql':
      return t('services.filter_database');
    case 'nosql':
      return 'NoSQL';
    case 'cache':
      return t('services.filter_cache');
    case 'realtime':
      return t('services.filter_realtime');
    case 'search':
      return t('services.filter_search');
    case 'storage':
      return t('services.filter_storage');
    case 'tools':
    case 'email':
      return 'Mail & Tools';
    default:
      return cat || 'Service';
  }
}
</script>
