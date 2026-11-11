<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200 relative">
    <!-- Top Action Bar & Identity -->
    <div class="px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex items-center justify-between gap-4 flex-shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <!-- Back Button -->
        <button
          @click="$emit('back')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700/80 transition shadow-sm flex-shrink-0"
          :title="$t('php.all_engines')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ $t('php.all_engines') }}</span>
        </button>

        <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

        <!-- PHP Identity -->
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm font-mono flex-shrink-0">
            {{ details?.id || versionId }}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">{{ details?.name || `PHP ${versionId}` }}</h2>
              <span
                v-if="details?.isDefault"
                class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
              >
                {{ $t('common.cli_default') }}
              </span>
              <span
                class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full"
                :class="details?.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="details?.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-500'"></span>
                {{ details?.running ? $t('php.fastcgi_active') : $t('common.stopped') }}
              </span>
              <span
                v-if="details?.hasUpdate"
                class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono"
              >
                {{ details.fullVersion ? `v${details.fullVersion} → v${details.latestVersion}` : $t('common.update_available', { version: details.latestVersion }) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons (FastCGI Service Controls) -->
      <div class="flex items-center gap-2 flex-shrink-0">
        <button
          v-if="details?.hasUpdate"
          @click="$emit('update-php', versionId)"
          :disabled="updatingVersion === versionId"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
        >
          <ArrowUpCircle class="w-3.5 h-3.5" :class="{ 'animate-pulse': updatingVersion === versionId }" />
          <span>{{ updatingVersion === versionId ? $t('common.updating') : $t('common.update') }}</span>
        </button>

        <!-- Start / Stop / Restart FastCGI -->
        <button
          v-if="!details?.running"
          @click="$emit('start-php', versionId)"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span class="hidden md:inline">{{ $t('php.start_fastcgi') }}</span>
        </button>
        <template v-else>
          <button
            @click="$emit('stop-php', versionId)"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition"
          >
            <Square class="w-3.5 h-3.5 fill-current" />
            <span class="hidden md:inline">{{ $t('common.stop') }}</span>
          </button>
          <button
            @click="$emit('restart-php', versionId)"
            class="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
            :title="$t('common.restart')"
          >
            <RotateCw class="w-4 h-4" />
          </button>
        </template>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-y-auto p-8 space-y-6">
      <!-- Loading State -->
      <div v-if="isLoading" class="flex flex-col items-center justify-center py-24 text-slate-500 space-y-3">
        <RotateCw class="w-8 h-8 animate-spin text-rose-500" />
        <p class="text-xs">{{ $t('php_detail.loading', { version: versionId }) }}</p>
      </div>

      <template v-else-if="details">
        <!-- SECTION 1: TWO-COLUMN SYSTEM & CONFIG INFO -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <!-- Left Column: Build & Runtime Identity (5 cols) -->
          <div class="lg:col-span-5 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <h3 class="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu class="w-4 h-4 text-purple-500 dark:text-purple-400" />
                {{ $t('php_detail.engine_details') }}
              </h3>
              <button
                v-if="!details.isDefault"
                @click="$emit('set-default', versionId)"
                class="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium transition"
              >
                {{ $t('php.set_as_default_star') }}
              </button>
            </div>

            <div class="space-y-3 text-xs">
              <div>
                <span class="text-slate-500 dark:text-slate-400 block mb-0.5">{{ $t('php_detail.build_signature') }}</span>
                <p class="font-mono text-[11px] text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 break-all select-all">
                  {{ details.buildInfo || 'PHP CLI Windows NTS x64' }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span class="text-slate-500 text-[11px] block">{{ $t('php_detail.architecture') }}</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200 font-mono">{{ details.architecture || 'x64' }}</span>
                </div>
                <div class="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <span class="text-slate-500 text-[11px] block">{{ $t('php_detail.thread_safety') }}</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200 font-mono">{{ details.threadSafety || 'NTS (Non-Thread-Safe)' }}</span>
                </div>
              </div>

              <div class="bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80 space-y-1">
                <span class="text-slate-500 text-[11px] block">{{ $t('php_detail.executables_and_port') }}</span>
                <div class="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span>{{ $t('php_detail.cli_label') }}</span>
                  <span class="truncate ml-2 text-slate-500 dark:text-slate-400" :title="details.phpExe">{{ details.phpExe }}</span>
                </div>
                <div class="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300">
                  <span>{{ $t('php_detail.fastcgi_label') }}</span>
                  <span class="truncate ml-2 text-slate-500 dark:text-slate-400" :title="details.phpCgiExe">{{ details.phpCgiExe }}</span>
                </div>
                <div class="flex items-center justify-between font-mono text-[11px] text-slate-700 dark:text-slate-300 pt-1 border-t border-slate-200 dark:border-slate-800/80">
                  <span>{{ $t('php_detail.port_label') }}</span>
                  <span class="font-semibold text-slate-800 dark:text-slate-200">127.0.0.1:{{ details.port }}</span>
                </div>
              </div>

              <!-- Actions Locales -->
              <div class="flex items-center gap-2 pt-1">
                <button
                  @click="openTerminal"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                  :title="$t('common.terminal')"
                >
                  <Terminal class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                  <span>{{ $t('php_detail.terminal_btn') }}</span>
                </button>
                <button
                  @click="openFolder"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 transition"
                  :title="$t('php.open_folder')"
                >
                  <Folder class="w-3.5 h-3.5 text-slate-400" />
                  <span>{{ $t('php_detail.folder_btn') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Right Column: php.ini Interactive Directives (7 cols) -->
          <div class="lg:col-span-7 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div class="flex items-center gap-2">
                <Settings2 class="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('php_detail.ini_config') }}</h3>
              </div>
              <button
                @click="openIni"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 transition"
              >
                <FileCode2 class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>{{ $t('php_detail.open_ini') }}</span>
              </button>
            </div>

            <!-- Path Bar -->
            <div class="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-700 dark:text-slate-300">
              <span class="text-slate-500">{{ $t('php_detail.ini_location') }}</span>
              <span class="truncate flex-1 select-all" :title="details.iniPath">{{ details.iniPath }}</span>
              <button
                @click="copyIniPath"
                class="p-1 hover:text-slate-900 dark:hover:text-white text-slate-400 transition"
                :title="copied ? $t('php_detail.copied_path') : $t('php_detail.copy_path')"
              >
                <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Interactive Directives Grid -->
            <div class="space-y-3">
              <!-- Memory Limit & Execution Time -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <!-- memory_limit -->
                <div class="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">memory_limit</span>
                    <span class="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      {{ details.iniValues?.memory_limit || '512M' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button
                      v-for="val in ['256M', '512M', '1G', '2G', '-1']"
                      :key="val"
                      @click="updateDirective('memory_limit', val)"
                      class="px-2 py-0.5 rounded text-[11px] font-mono transition border"
                      :class="details.iniValues?.memory_limit === val 
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'"
                    >
                      {{ val }}
                    </button>
                  </div>
                </div>

                <!-- max_execution_time -->
                <div class="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">max_execution_time</span>
                    <span class="font-mono text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                      {{ details.iniValues?.max_execution_time || '300' }}s
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button
                      v-for="val in ['30', '60', '120', '300', '600', '0']"
                      :key="val"
                      @click="updateDirective('max_execution_time', val)"
                      class="px-2 py-0.5 rounded text-[11px] font-mono transition border"
                      :class="details.iniValues?.max_execution_time == val 
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm font-bold' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'"
                    >
                      {{ val === '0' ? $t('php_detail.unlimited') : `${val}s` }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Upload & Post Max Size -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <!-- upload_max_filesize -->
                <div class="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">upload_max_filesize</span>
                    <span class="font-mono text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-1.5 py-0.5 rounded">
                      {{ details.iniValues?.upload_max_filesize || '128M' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <button
                      v-for="val in ['32M', '64M', '128M', '256M', '512M']"
                      :key="val"
                      @click="setUploadPair(val)"
                      class="px-2 py-0.5 rounded text-[11px] font-mono transition border"
                      :class="details.iniValues?.upload_max_filesize === val 
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm font-bold' 
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-400'"
                    >
                      {{ val }}
                    </button>
                  </div>
                </div>

                <!-- date.timezone -->
                <div class="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800/80 flex flex-col justify-between gap-2">
                  <div class="flex items-center justify-between">
                    <span class="font-mono font-semibold text-slate-700 dark:text-slate-300">date.timezone</span>
                    <span class="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded">
                      {{ details.iniValues?.['date.timezone'] || 'UTC' }}
                    </span>
                  </div>
                  <select
                    :value="details.iniValues?.['date.timezone'] || 'UTC'"
                    @change="updateDirective('date.timezone', $event.target.value)"
                    class="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500/50"
                  >
                    <option value="UTC">UTC (Standard Laravel)</option>
                    <option value="Europe/Paris">Europe/Paris (UTC+1/+2)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="Europe/Berlin">Europe/Berlin</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="America/Chicago">America/Chicago (CST)</option>
                    <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                    <option value="America/Toronto">America/Toronto</option>
                    <option value="Africa/Casablanca">Africa/Casablanca</option>
                    <option value="Africa/Tunis">Africa/Tunis</option>
                    <option value="Africa/Algiers">Africa/Algiers</option>
                    <option value="Africa/Dakar">Africa/Dakar</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Asia/Dubai">Asia/Dubai</option>
                  </select>
                </div>
              </div>

              <!-- Switches Row: display_errors & opcache.enable -->
              <div class="grid grid-cols-2 gap-3 pt-1">
                <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <div class="min-w-0 pr-2">
                    <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block font-mono">display_errors</span>
                    <span class="text-[10px] text-slate-500">{{ $t('php_detail.display_errors_desc') }}</span>
                  </div>
                  <button
                    @click="toggleDisplayErrors"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="isDisplayErrorsOn ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'"
                    role="switch"
                    :aria-checked="isDisplayErrorsOn"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="isDisplayErrorsOn ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </div>

                <div class="flex items-center justify-between bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/80">
                  <div class="min-w-0 pr-2">
                    <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block font-mono">opcache.enable</span>
                    <span class="text-[10px] text-slate-500">{{ $t('php_detail.opcache_desc') }}</span>
                  </div>
                  <button
                    @click="toggleOpcacheDirective"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none"
                    :class="isOpcacheOn ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                    role="switch"
                    :aria-checked="isOpcacheOn"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                      :class="isOpcacheOn ? 'translate-x-4' : 'translate-x-0'"
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- SECTION 2: XDEBUG 3 PRO CARD -->
        <div class="bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-slate-900/40 border border-purple-500/30 rounded-xl p-5 shadow-sm space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-purple-500/20">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-600 dark:text-purple-300 flex items-center justify-center font-bold">
                <Bug class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{{ $t('php_detail.xdebug_title') }}</h3>
                  <span
                    class="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5"
                    :class="details.xdebug?.enabled 
                      ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/40' 
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700'"
                  >
                    <span class="w-1.5 h-1.5 rounded-full" :class="details.xdebug?.enabled ? 'bg-purple-500 animate-ping' : 'bg-slate-400'"></span>
                    {{ details.xdebug?.enabled ? $t('php_detail.xdebug_active', { version: details.xdebug.version ? '(' + details.xdebug.version + ')' : '' }) : $t('php_detail.xdebug_inactive') }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ $t('php_detail.xdebug_desc') }}
                </p>
              </div>
            </div>

            <!-- Xdebug Toggle Button -->
            <div class="flex items-center gap-3">
              <span class="text-xs font-medium text-slate-600 dark:text-slate-400">
                {{ details.xdebug?.enabled ? $t('php_detail.xdebug_enabled') : $t('php_detail.xdebug_disabled') }}
              </span>
              <button
                @click="toggleXdebug"
                :disabled="isTogglingXdebug"
                class="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50"
                :class="details.xdebug?.enabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'"
                role="switch"
                :aria-checked="details.xdebug?.enabled"
                :title="details.xdebug?.enabled ? $t('php_detail.xdebug_disabled') : $t('php_detail.xdebug_enabled')"
              >
                <span
                  class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center"
                  :class="details.xdebug?.enabled ? 'translate-x-5' : 'translate-x-0'"
                >
                  <RotateCw v-if="isTogglingXdebug" class="w-3 h-3 text-purple-600 animate-spin" />
                </span>
              </button>
            </div>
          </div>

          <!-- Xdebug Quick Config Bar -->
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs pt-1">
            <!-- Mode Selector -->
            <div class="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 space-y-1">
              <span class="text-[11px] text-slate-500 block">{{ $t('php_detail.xdebug_mode') }}</span>
              <select
                v-model="xdebugConfig.mode"
                @change="applyXdebugConfig"
                :disabled="!details.xdebug?.enabled"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="debug,develop">debug,develop ({{ $t('common.recommended') }})</option>
                <option value="debug">debug ({{ $t('php_detail.xdebug_mode_debug') }})</option>
                <option value="profile">profile ({{ $t('php_detail.xdebug_mode_profile') }})</option>
                <option value="coverage">coverage ({{ $t('php_detail.xdebug_mode_coverage') }})</option>
                <option value="trace">trace ({{ $t('php_detail.xdebug_mode_trace') }})</option>
              </select>
            </div>

            <!-- Client Port -->
            <div class="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 space-y-1">
              <span class="text-[11px] text-slate-500 block">{{ $t('php_detail.xdebug_client_port') }}</span>
              <input
                v-model="xdebugConfig.clientPort"
                @blur="applyXdebugConfig"
                :disabled="!details.xdebug?.enabled"
                type="number"
                placeholder="9003"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
              />
            </div>

            <!-- IDE Key -->
            <div class="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 space-y-1">
              <span class="text-[11px] text-slate-500 block">{{ $t('php_detail.xdebug_ide_key') }}</span>
              <select
                v-model="xdebugConfig.idekey"
                @change="applyXdebugConfig"
                :disabled="!details.xdebug?.enabled"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="PHPSTORM">PHPSTORM</option>
                <option value="VSCODE">VSCODE</option>
                <option value="laratool">laratool</option>
              </select>
            </div>

            <!-- Trigger / Autostart -->
            <div class="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-lg border border-purple-500/20 space-y-1">
              <span class="text-[11px] text-slate-500 block">{{ $t('php_detail.xdebug_trigger') }}</span>
              <select
                v-model="xdebugConfig.startWithRequest"
                @change="applyXdebugConfig"
                :disabled="!details.xdebug?.enabled"
                class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 font-mono text-xs text-slate-800 dark:text-slate-200 disabled:opacity-50"
              >
                <option value="yes">yes</option>
                <option value="trigger">trigger</option>
              </select>
            </div>
          </div>
        </div>

        <!-- SECTION 3: VISUAL EXTENSIONS MANAGER -->
        <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4 shadow-sm">
          <!-- Header Bar -->
          <div class="flex items-center justify-between flex-wrap gap-4 pb-3 border-b border-slate-200 dark:border-slate-800/80">
            <div class="flex items-center gap-3">
              <div class="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Puzzle class="w-4 h-4" />
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <h3 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('php_detail.extensions_title') }}</h3>
                  <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold font-mono">
                    {{ $t('php_detail.extensions_active_count', { count: activeExtensionsCount }) }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  {{ $t('php_detail.extensions_desc') }}
                </p>
              </div>
            </div>

            <!-- Search & Filters -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Search Input -->
              <div class="relative w-56">
                <Search class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="extensionSearch"
                  type="text"
                  :placeholder="$t('php_detail.search_placeholder')"
                  class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-rose-500/50"
                />
                <button
                  v-if="extensionSearch"
                  @click="extensionSearch = ''"
                  class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- Filter Tabs -->
              <div class="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                <button
                  v-for="filter in ['all', 'active', 'inactive', 'laravel']"
                  :key="filter"
                  @click="activeFilter = filter"
                  class="px-2.5 py-1 rounded-md text-[11px] font-medium transition"
                  :class="activeFilter === filter 
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-semibold' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
                >
                  {{ filterLabels[filter] }}
                </button>
              </div>
            </div>
          </div>

          <!-- Extensions Interactive Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pt-1">
            <div
              v-for="ext in displayedExtensions"
              :key="ext.name"
              class="bg-slate-50 dark:bg-slate-950/70 border rounded-xl p-3.5 flex flex-col justify-between gap-3 transition hover:shadow-sm"
              :class="ext.enabled 
                ? 'border-emerald-500/20 bg-emerald-500/[0.02]' 
                : 'border-slate-200 dark:border-slate-800 opacity-80 hover:opacity-100'"
            >
              <!-- Extension Top Info -->
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="font-mono text-xs font-bold text-slate-900 dark:text-white">
                      {{ ext.name }}
                    </span>
                    <span
                      class="text-[10px] font-semibold px-2 py-0.5 rounded-md"
                      :class="getCategoryBadgeClass(ext.category)"
                    >
                      {{ getExtensionCategory(ext.name, ext.category) }}
                    </span>
                    <span
                      v-if="ext.isBuiltin"
                      class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium"
                    >
                      {{ $t('php_detail.core_badge') }}
                    </span>
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed" :title="getExtensionDesc(ext.name, ext.description)">
                    {{ getExtensionDesc(ext.name, ext.description) }}
                  </p>
                </div>

                <!-- 1-Click Toggle Switch -->
                <div class="flex-shrink-0 pt-0.5">
                  <!-- Disabled built-in module lock -->
                  <div v-if="ext.isBuiltin" class="p-1 text-slate-400 dark:text-slate-600" title="Module compilé dans le noyau (toujours actif)">
                    <Lock class="w-4 h-4" />
                  </div>
                  <!-- Interactive Switch -->
                  <button
                    v-else
                    @click="toggleExtension(ext)"
                    :disabled="togglingExt[ext.name]"
                    class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50"
                    :class="ext.enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'"
                    role="switch"
                    :aria-checked="ext.enabled"
                    :title="ext.enabled ? `Désactiver ${ext.name}` : `Activer ${ext.name}`"
                  >
                    <span
                      class="pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center"
                      :class="ext.enabled ? 'translate-x-4' : 'translate-x-0'"
                    >
                      <RotateCw v-if="togglingExt[ext.name]" class="w-2.5 h-2.5 text-emerald-600 animate-spin" />
                    </span>
                  </button>
                </div>
              </div>

              <!-- Footer info / State pill -->
              <div class="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <span class="flex items-center gap-1.5" :class="ext.enabled ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400 dark:text-slate-500'">
                  <span class="w-1.5 h-1.5 rounded-full" :class="ext.enabled ? 'bg-emerald-500' : 'bg-slate-400'"></span>
                  {{ ext.enabled ? $t('php_detail.active_and_loaded') : $t('php_detail.disabled_in_ini') }}
                </span>
                <span v-if="ext.isZend" class="text-purple-600 dark:text-purple-400 font-mono">
                  Zend Engine
                </span>
              </div>
            </div>

            <!-- Empty search message -->
            <div v-if="displayedExtensions.length === 0" class="col-span-full py-12 text-center text-xs text-slate-500 space-y-2">
              <Puzzle class="w-6 h-6 mx-auto text-slate-400" />
              <p>{{ $t('php_detail.no_extensions_found') }}</p>
              <button
                @click="extensionSearch = ''; activeFilter = 'all'"
                class="text-rose-500 hover:underline font-medium"
              >
                {{ $t('php_detail.reset_filters') }}
              </button>
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
          <p class="text-xs text-slate-500 mt-1 max-w-sm">{{ $t('php_detail.failed_to_load') || 'Impossible de charger les détails PHP pour cette version.' }}</p>
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
import { ref, computed, reactive, onMounted, watch } from 'vue';
import {
  ArrowLeft,
  FileCode2,
  Terminal,
  Folder,
  Play,
  Square,
  RotateCw,
  Cpu,
  Settings2,
  Check,
  Copy,
  Puzzle,
  Search,
  CheckCircle2,
  Bug,
  Lock,
  AlertTriangle,
  X,
  ArrowUpCircle
} from 'lucide-vue-next';

const props = defineProps({
  versionId: { type: String, required: true },
  updatingVersion: { type: String, default: null }
});

const emit = defineEmits([
  'back',
  'start-php',
  'stop-php',
  'restart-php',
  'set-default',
  'update-php'
]);

const api = window.laratool;

const isLoading = ref(true);
const details = ref(null);
const extensionSearch = ref('');
const activeFilter = ref('all');
const copied = ref(false);

const togglingExt = reactive({});
const isTogglingXdebug = ref(false);

const xdebugConfig = reactive({
  mode: 'debug,develop',
  clientPort: 9003,
  idekey: 'PHPSTORM',
  startWithRequest: 'yes'
});

import { useI18n } from '../i18n';
import { useNotifications } from '../composables/useNotifications';

const { t } = useI18n();
const { notify } = useNotifications();

const filterLabels = computed(() => ({
  all: t('php_detail.filter_all'),
  active: t('php_detail.filter_active'),
  inactive: t('php_detail.filter_inactive'),
  laravel: t('php_detail.filter_laravel')
}));

const laravelKeyExtensions = [
  'curl', 'fileinfo', 'gd', 'intl', 'mbstring', 'mysqli',
  'openssl', 'pdo_mysql', 'pdo_pgsql', 'pdo_sqlite', 'redis', 'sodium',
  'sqlite3', 'zip', 'opcache', 'mongodb'
];

function showToast(msg, type = 'success') {
  notify(msg, type);
}

const activeExtensionsCount = computed(() => {
  return (details.value?.extensionCatalog || []).filter(e => e.enabled).length;
});

const isDisplayErrorsOn = computed(() => {
  const v = details.value?.iniValues?.display_errors;
  return v === '1' || v === 'On' || v === true;
});

const isOpcacheOn = computed(() => {
  const v = details.value?.iniValues?.['opcache.enable'];
  return v === '1' || v === 1 || v === true;
});

const displayedExtensions = computed(() => {
  const list = details.value?.extensionCatalog || [];
  let result = list;

  // Filter tab
  if (activeFilter.value === 'active') {
    result = result.filter(e => e.enabled);
  } else if (activeFilter.value === 'inactive') {
    result = result.filter(e => !e.enabled && !e.isBuiltin);
  } else if (activeFilter.value === 'laravel') {
    result = result.filter(e => laravelKeyExtensions.includes(e.name.toLowerCase()));
  }

  // Search filter
  if (extensionSearch.value.trim()) {
    const q = extensionSearch.value.trim().toLowerCase();
    result = result.filter(e => 
      e.name.toLowerCase().includes(q) || 
      (e.description && e.description.toLowerCase().includes(q)) ||
      (e.category && e.category.toLowerCase().includes(q))
    );
  }

  return result;
});

function getCategoryBadgeClass(category) {
  switch (category) {
    case 'Base de données':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20';
    case 'Web & API':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
    case 'Sécurité':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
    case 'Médias':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20';
    case 'Cache & Queue':
      return 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20';
    case 'Performance':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20';
    default:
      return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700';
  }
}

function getExtensionDesc(name, fallback) {
  const key = `php_extensions.items.${name}.desc`;
  const val = t(key);
  return val !== key ? val : (fallback || t('php_extensions.default_desc'));
}

function getExtensionCategory(name, fallback) {
  const key = `php_extensions.items.${name}.category`;
  const val = t(key);
  return val !== key ? val : (fallback || 'Extension');
}

async function loadDetails() {
  isLoading.value = true;
  try {
    if (api?.php?.getDetails) {
      const data = await api.php.getDetails(props.versionId);
      details.value = data;
      if (data?.xdebug) {
        xdebugConfig.mode = data.xdebug.mode || 'debug,develop';
        xdebugConfig.clientPort = data.xdebug.clientPort || 9003;
        xdebugConfig.idekey = data.xdebug.idekey || 'PHPSTORM';
        xdebugConfig.startWithRequest = data.xdebug.startWithRequest || 'yes';
      }
    }
  } catch (err) {
    console.error('Erreur chargement détails PHP:', err);
  } finally {
    isLoading.value = false;
  }
}

async function toggleExtension(ext) {
  if (ext.isBuiltin) return;
  const targetState = !ext.enabled;
  togglingExt[ext.name] = true;

  try {
    if (api?.php?.toggleExtension) {
      const updated = await api.php.toggleExtension(props.versionId, ext.name, targetState);
      details.value = updated;
      showToast(t('toasts.ext_toggled', { name: ext.name, state: targetState ? t('common.enabled').toLowerCase() : t('common.disabled').toLowerCase() }));
    } else {
      ext.enabled = targetState;
      showToast(t('toasts.ext_toggled', { name: ext.name, state: targetState ? t('common.enabled').toLowerCase() : t('common.disabled').toLowerCase() }));
    }
  } catch (err) {
    console.error('Erreur toggle extension:', err);
    showToast(t('toasts.ext_toggle_error', { error: err.message }), 'error');
  } finally {
    togglingExt[ext.name] = false;
  }
}

async function toggleXdebug() {
  isTogglingXdebug.value = true;
  const targetState = !details.value?.xdebug?.enabled;

  try {
    if (api?.php?.toggleXdebug) {
      const updated = await api.php.toggleXdebug(props.versionId, targetState, {
        mode: xdebugConfig.mode,
        clientPort: xdebugConfig.clientPort,
        idekey: xdebugConfig.idekey,
        startWithRequest: xdebugConfig.startWithRequest
      });
      details.value = updated;
      showToast(targetState ? t('toasts.xdebug_enabled') : t('toasts.xdebug_disabled'));
    } else if (details.value?.xdebug) {
      details.value.xdebug.enabled = targetState;
      showToast(targetState ? t('toasts.xdebug_enabled') : t('toasts.xdebug_disabled'));
    }
  } catch (err) {
    console.error('Erreur toggle Xdebug:', err);
    showToast(t('toasts.xdebug_error', { error: err.message }), 'error');
  } finally {
    isTogglingXdebug.value = false;
  }
}

async function applyXdebugConfig() {
  if (!details.value?.xdebug?.enabled) return;
  try {
    if (api?.php?.toggleXdebug) {
      const updated = await api.php.toggleXdebug(props.versionId, true, {
        mode: xdebugConfig.mode,
        clientPort: xdebugConfig.clientPort,
        idekey: xdebugConfig.idekey,
        startWithRequest: xdebugConfig.startWithRequest
      });
      details.value = updated;
      showToast(t('toasts.xdebug_applied'));
    }
  } catch (err) {
    console.error('Erreur mise à jour config Xdebug:', err);
    showToast(t('toasts.xdebug_error', { error: err.message }), 'error');
  }
}

async function updateDirective(key, value) {
  try {
    if (api?.php?.updateIniDirective) {
      const updated = await api.php.updateIniDirective(props.versionId, key, value);
      details.value = updated;
      showToast(t('toasts.directive_saved', { key, value }));
    } else if (details.value?.iniValues) {
      details.value.iniValues[key] = value;
      showToast(t('toasts.directive_saved', { key, value }));
    }
  } catch (err) {
    console.error(`Erreur mise à jour directive ${key}:`, err);
    showToast(t('toasts.ext_toggle_error', { error: err.message }), 'error');
  }
}

async function setUploadPair(val) {
  await updateDirective('upload_max_filesize', val);
  await updateDirective('post_max_size', val);
}

async function toggleDisplayErrors() {
  const current = isDisplayErrorsOn.value;
  await updateDirective('display_errors', current ? 'Off' : 'On');
}

async function toggleOpcacheDirective() {
  const current = isOpcacheOn.value;
  await updateDirective('opcache.enable', current ? '0' : '1');
}

function openIni() {
  if (api?.php?.openIni) {
    api.php.openIni(props.versionId);
  }
}

function openFolder() {
  if (api?.php?.openFolder) {
    api.php.openFolder(props.versionId);
  }
}

function openTerminal() {
  if (api?.php?.openTerminal) {
    api.php.openTerminal(props.versionId);
  }
}

function copyIniPath() {
  if (details.value?.iniPath) {
    navigator.clipboard.writeText(details.value.iniPath);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  }
}

onMounted(() => {
  loadDetails();
});

watch(() => props.versionId, () => {
  loadDetails();
});

watch(() => props.updatingVersion, (newVal, oldVal) => {
  if (oldVal === props.versionId && !newVal) {
    loadDetails();
  }
});
</script>
