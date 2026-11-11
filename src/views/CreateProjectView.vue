<template>
  <div class="h-full flex flex-col overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
    <!-- Top Action Bar & Navigation -->
    <div class="px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 flex items-center justify-between gap-4 flex-shrink-0">
      <div class="flex items-center gap-4 min-w-0">
        <button
          v-if="creationState !== 'running'"
          @click="$emit('back')"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-semibold border border-slate-300 dark:border-slate-700/80 transition shadow-sm flex-shrink-0"
          :title="$t('project_create.back_to_projects')"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>{{ $t('project_create.all_projects') }}</span>
        </button>

        <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>

        <!-- Identity Breadcrumb -->
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
            <Sparkles class="w-4 h-4" />
          </div>
          <div class="min-w-0">
            <h2 class="text-sm font-bold text-slate-900 dark:text-white truncate">
              {{ $t('project_create.title') }}
            </h2>
            <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {{ $t('project_create.subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Right Meta Status Pills -->
      <div class="flex items-center gap-2 flex-shrink-0 text-xs font-mono">
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          PHP {{ selectedPhp }}
        </span>
        <span class="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          Node {{ selectedNode }}
        </span>
      </div>
    </div>

    <!-- Main Scrollable Content (Grid Layout: Form 8 cols + Sticky Summary 4 cols) -->
    <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
      <div class="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- ========================================== -->
        <!-- LEFT COLUMN: FULL CONFIGURATION FORM (8 COLS) -->
        <!-- ========================================== -->
        <div class="lg:col-span-8 space-y-6">

          <!-- 1. IDENTITÉ DU PROJET & EMPLACEMENT -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FolderPlus class="w-4 h-4 text-rose-500" />
                {{ $t('project_create.step1_title') }}
              </h3>
              <span class="text-[11px] font-mono text-slate-500">{{ $t('project_create.step_indicator', { step: 1, total: 5 }) }}</span>
            </div>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {{ $t('project_create.app_name') }} <span class="text-rose-500">*</span>
                </label>
                <input
                  ref="nameInputRef"
                  type="text"
                  v-model="projectName"
                  @input="onNameInput"
                  :disabled="creationState === 'running'"
                  :placeholder="$t('project_create.app_name_placeholder')"
                  class="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition"
                  :class="{ 'border-rose-500': validationError }"
                />
              </div>

              <!-- Live Preview Strip -->
              <div
                v-if="projectName.trim()"
                class="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-xs font-mono"
              >
                <div class="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span class="flex items-center gap-1.5">
                    <Globe class="w-3.5 h-3.5 text-sky-500" />
                    {{ $t('project_create.local_domain') }}
                  </span>
                  <span class="font-bold text-sky-600 dark:text-sky-400">{{ previewDomain }}</span>
                </div>
                <div class="flex items-center justify-between text-slate-600 dark:text-slate-400 truncate">
                  <span class="flex items-center gap-1.5 flex-shrink-0">
                    <Folder class="w-3.5 h-3.5 text-amber-500" />
                    {{ $t('project_create.directory') }}
                  </span>
                  <span class="truncate ml-2 text-slate-800 dark:text-slate-300 font-medium" :title="previewPath">{{ previewPath }}</span>
                </div>
              </div>

              <p v-if="validationError" class="text-xs text-rose-500 flex items-center gap-1 font-medium">
                <AlertTriangle class="w-3.5 h-3.5 flex-shrink-0" />
                {{ validationError }}
              </p>

              <!-- Parked Path Selector (if multiple) -->
              <div v-if="parkedPaths.length > 1" class="pt-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  {{ $t('project_create.parent_folder') }}
                </label>
                <select
                  v-model="selectedParkedPath"
                  :disabled="creationState === 'running'"
                  class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option v-for="p in parkedPaths" :key="p" :value="p">{{ p }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 2. VERSION DE LARAVEL & MOTEURS D'EXÉCUTION -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu class="w-4 h-4 text-sky-500" />
                {{ $t('project_create.step2_title') }}
              </h3>
              <span class="text-[11px] font-mono text-slate-500">{{ $t('project_create.step_indicator', { step: 2, total: 5 }) }}</span>
            </div>

            <!-- Laravel Version Cards -->
            <div class="space-y-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                {{ $t('project_create.framework_version') }}
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <!-- Laravel 13.x (Latest) -->
                <label
                  class="p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between"
                  :class="laravelVersion === '13' ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Laravel 13.x
                      <span class="text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-400 px-1.5 py-0.2 rounded font-sans font-semibold">{{ $t('project_create.latest_version') }}</span>
                    </span>
                    <input type="radio" value="13" v-model="laravelVersion" :disabled="creationState === 'running'" class="text-rose-600 focus:ring-0" />
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {{ $t('project_create.stable_desc') }}
                  </p>
                </label>

                <!-- Laravel 12.x -->
                <label
                  class="p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between"
                  :class="laravelVersion === '12' ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">Laravel 12.x</span>
                    <input type="radio" value="12" v-model="laravelVersion" :disabled="creationState === 'running'" class="text-rose-600 focus:ring-0" />
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {{ $t('project_create.v12_desc') }}
                  </p>
                </label>

                <!-- Laravel 11.x (LTS) -->
                <label
                  class="p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between"
                  :class="laravelVersion === '11' ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      Laravel 11.x
                      <span class="text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.2 rounded font-sans font-semibold">LTS</span>
                    </span>
                    <input type="radio" value="11" v-model="laravelVersion" :disabled="creationState === 'running'" class="text-rose-600 focus:ring-0" />
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {{ $t('project_create.lts_desc') }}
                  </p>
                </label>

                <!-- Laravel 10.x -->
                <label
                  class="p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between"
                  :class="laravelVersion === '10' ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">Laravel 10.x</span>
                    <input type="radio" value="10" v-model="laravelVersion" :disabled="creationState === 'running'" class="text-rose-600 focus:ring-0" />
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {{ $t('project_create.legacy_desc') }}
                  </p>
                </label>

                <!-- Laravel Dev (Master) -->
                <label
                  class="p-3.5 rounded-xl border cursor-pointer transition select-none flex flex-col justify-between sm:col-span-2 lg:col-span-2"
                  :class="laravelVersion === 'master' ? 'bg-rose-500/10 border-rose-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
                >
                  <div class="flex items-center justify-between mb-1">
                    <span class="text-xs font-bold text-slate-900 dark:text-white">Laravel Dev (Master)</span>
                    <input type="radio" value="master" v-model="laravelVersion" :disabled="creationState === 'running'" class="text-rose-600 focus:ring-0" />
                  </div>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                    {{ $t('project_create.master_desc') }}
                  </p>
                </label>
              </div>
            </div>

            <!-- PHP and Node Runtimes -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {{ $t('project_create.php_version') }}
                </label>
                <select
                  v-model="selectedPhp"
                  :disabled="creationState === 'running'"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option v-for="ver in availablePhp" :key="ver.id" :value="ver.id">
                    PHP {{ ver.id }} {{ ver.isDefault ? '(' + $t('common.default') + ')' : '' }} {{ ver.running ? '● ' + $t('common.running') : '' }}
                  </option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {{ $t('project_create.node_version') }}
                </label>
                <select
                  v-model="selectedNode"
                  :disabled="creationState === 'running'"
                  class="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-semibold"
                >
                  <option v-for="ver in availableNode" :key="ver.id" :value="ver.id">
                    Node.js {{ ver.id }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- 3. BASE DE DONNÉES & STOCKAGE -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database class="w-4 h-4 text-indigo-500" />
                {{ $t('project_create.step3_title') }}
              </h3>
              <span class="text-[11px] font-mono text-slate-500">{{ $t('project_create.step_indicator', { step: 3, total: 5 }) }}</span>
            </div>

            <!-- Database Engines -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label
                class="flex flex-col p-3.5 rounded-xl border cursor-pointer transition select-none"
                :class="databaseType === 'sqlite' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">SQLite</span>
                  <input type="radio" value="sqlite" v-model="databaseType" :disabled="creationState === 'running'" class="text-indigo-600 focus:ring-0" />
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {{ $t('project_create.sqlite_desc') }}
                </p>
              </label>

              <label
                class="flex flex-col p-3.5 rounded-xl border cursor-pointer transition select-none"
                :class="databaseType === 'mysql' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">MySQL / MariaDB</span>
                  <input type="radio" value="mysql" v-model="databaseType" :disabled="creationState === 'running'" class="text-indigo-600 focus:ring-0" />
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {{ $t('project_create.mysql_desc') }}
                </p>
              </label>

              <label
                class="flex flex-col p-3.5 rounded-xl border cursor-pointer transition select-none"
                :class="databaseType === 'pgsql' ? 'bg-indigo-500/10 border-indigo-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div class="flex items-center justify-between mb-1">
                  <span class="text-xs font-bold text-slate-900 dark:text-white">PostgreSQL</span>
                  <input type="radio" value="pgsql" v-model="databaseType" :disabled="creationState === 'running'" class="text-indigo-600 focus:ring-0" />
                </div>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {{ $t('project_create.pgsql_desc') }}
                </p>
              </label>
            </div>

            <!-- Database Name if MySQL/PG -->
            <div v-if="databaseType !== 'sqlite'" class="pt-2">
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                {{ $t('project_create.db_name') }}
              </label>
              <input
                type="text"
                v-model="customDatabaseName"
                :disabled="creationState === 'running'"
                class="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500"
                :placeholder="defaultDatabaseName"
              />
            </div>

            <!-- Migration & Seed checkboxes -->
            <div class="flex items-center gap-4 pt-1 flex-wrap text-xs">
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="runMigrations" :disabled="creationState === 'running'" class="rounded text-indigo-600 focus:ring-0" />
                <span class="text-slate-700 dark:text-slate-300 font-medium">{{ $t('project_create.run_migrations') }}</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" v-model="runSeeders" :disabled="creationState === 'running' || !runMigrations" class="rounded text-indigo-600 focus:ring-0" />
                <span class="text-slate-700 dark:text-slate-300 font-medium">{{ $t('project_create.run_seeders') }}</span>
              </label>
            </div>
          </div>

          <!-- 4. STARTER KIT & STACK FRONTEND -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers class="w-4 h-4 text-emerald-500" />
                {{ $t('project_create.step4_title') }}
              </h3>
              <span class="text-[11px] font-mono text-slate-500">{{ $t('project_create.step_indicator', { step: 4, total: 5 }) }}</span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'none' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_blade') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_blade_desc') }}</div>
                </div>
                <input type="radio" value="none" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>

              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'breeze-blade' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_breeze_blade') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_breeze_blade_desc') }}</div>
                </div>
                <input type="radio" value="breeze-blade" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>

              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'breeze-vue' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_breeze_vue') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_breeze_vue_desc') }}</div>
                </div>
                <input type="radio" value="breeze-vue" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>

              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'breeze-react' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_breeze_react') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_breeze_react_desc') }}</div>
                </div>
                <input type="radio" value="breeze-react" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>

              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'filament' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_filament') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_filament_desc') }}</div>
                </div>
                <input type="radio" value="filament" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>

              <label
                class="p-3.5 rounded-xl border cursor-pointer transition select-none flex items-start justify-between"
                :class="starterKit === 'breeze-api' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div>
                  <div class="font-bold text-slate-900 dark:text-white">{{ $t('project_create.starter_breeze_api') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{{ $t('project_create.starter_breeze_api_desc') }}</div>
                </div>
                <input type="radio" value="breeze-api" v-model="starterKit" :disabled="creationState === 'running'" class="text-emerald-600 focus:ring-0 ml-2 mt-0.5" />
              </label>
            </div>
          </div>

          <!-- 5. PACKAGES COMPOSER POPULAIRES (SÉLECTION EN 1 CLIC) -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Package class="w-4 h-4 text-violet-500" />
                  {{ $t('project_create.step5_title') }}
                </h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {{ $t('project_create.step5_desc') }}
                </p>
              </div>
              <span class="text-[11px] font-mono text-slate-500">{{ $t('project_create.step_indicator', { step: 5, total: 5 }) }}</span>
            </div>

            <!-- Package Cards Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs max-h-96 overflow-y-auto pr-1">
              <label
                v-for="pkg in availablePackagesCatalog"
                :key="pkg.name"
                class="p-3 rounded-xl border cursor-pointer transition select-none flex items-start justify-between gap-3"
                :class="isPackageSelected(pkg.name) ? 'bg-violet-500/10 border-violet-500/50 shadow-xs' : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 hover:border-slate-300'"
              >
                <div class="min-w-0">
                  <div class="font-mono font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                    <span>{{ pkg.name }}</span>
                    <span v-if="pkg.isDev" class="text-[10px] font-sans px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold">dev</span>
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
                    {{ getPackageDesc(pkg.name, pkg.description) }}
                  </div>
                </div>
                <input
                  type="checkbox"
                  :checked="isPackageSelected(pkg.name)"
                  @change="togglePackage(pkg)"
                  :disabled="creationState === 'running'"
                  class="rounded text-violet-600 focus:ring-0 mt-0.5 flex-shrink-0"
                />
              </label>
            </div>
          </div>

          <!-- 6. AUTOMATISATION LOCALE (NGINX, SSL, HOSTS, GIT) -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck class="w-4 h-4 text-emerald-500" />
              {{ $t('project_create.automations_title') }}
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                <input type="checkbox" v-model="enableSsl" :disabled="creationState === 'running'" class="rounded text-rose-600 focus:ring-0" />
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Lock class="w-3.5 h-3.5 text-emerald-500" />
                    {{ $t('project_create.enable_ssl') }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('project_create.enable_ssl_desc') }}</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                <input type="checkbox" v-model="addToHosts" :disabled="creationState === 'running'" class="rounded text-rose-600 focus:ring-0" />
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Globe class="w-3.5 h-3.5 text-sky-500" />
                    {{ $t('project_create.add_to_hosts') }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('project_create.add_to_hosts_desc', { domain: previewDomain }) }}</div>
                </div>
              </label>

              <label class="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 cursor-pointer select-none">
                <input type="checkbox" v-model="initGit" :disabled="creationState === 'running'" class="rounded text-rose-600 focus:ring-0" />
                <div>
                  <div class="font-bold text-slate-800 dark:text-slate-200">
                    {{ $t('project_create.init_git') }}
                  </div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('project_create.init_git_desc') }}</div>
                </div>
              </label>

              <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5">
                <Check class="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <div class="text-xs">
                  <div class="font-bold text-slate-800 dark:text-slate-200">{{ $t('project_create.vhost_nginx') }}</div>
                  <div class="text-[11px] text-slate-500 dark:text-slate-400">{{ $t('project_create.vhost_nginx_desc') }}</div>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- ========================================== -->
        <!-- RIGHT COLUMN: STICKY SUMMARY & TERMINAL (4 COLS) -->
        <!-- ========================================== -->
        <div class="lg:col-span-4 sticky top-6 space-y-5">

          <!-- 1. SUMMARY CARD (WHEN FORM ACTIVE) -->
          <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-sm">
            <h3 class="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles class="w-4 h-4 text-rose-500" />
              {{ $t('project_create.summary_title') }}
            </h3>

            <!-- Details List -->
            <div class="space-y-2.5 text-xs font-mono">
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_name') }}</span>
                <span class="font-bold text-slate-900 dark:text-white">{{ cleanSlug || '...' }}</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_laravel') }}</span>
                <span class="font-bold text-rose-600 dark:text-rose-400">v{{ laravelVersion }}</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_runtimes') }}</span>
                <span class="text-slate-800 dark:text-slate-200">PHP {{ selectedPhp }} · Node {{ selectedNode }}</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_db') }}</span>
                <span class="text-indigo-600 dark:text-indigo-400 font-bold uppercase">{{ databaseType }}</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_starter') }}</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ starterKitLabel }}</span>
              </div>
              <div class="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <span class="text-slate-500">{{ $t('project_create.summary_packages') }}</span>
                <span class="text-violet-600 dark:text-violet-400 font-bold">{{ selectedPackages.length }}</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-slate-500">{{ $t('project_create.summary_protocol') }}</span>
                <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{{ enableSsl ? 'HTTPS' : 'HTTP' }}</span>
              </div>
            </div>

            <!-- Launch Button -->
            <button
              v-if="creationState === 'form'"
              @click="startCreation"
              :disabled="!isFormValid"
              class="w-full py-3.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm transition shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles class="w-4 h-4" />
              <span>{{ $t('project_create.init_project_btn') }}</span>
            </button>
          </div>

          <!-- 2. REALTIME RUNNING / PROGRESS CARD -->
          <div
            v-if="creationState === 'running'"
            class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in"
          >
            <!-- Header with step & spinner -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                <span class="flex items-center gap-2 truncate">
                  <RefreshCw class="w-4 h-4 text-rose-500 animate-spin flex-shrink-0" />
                  <span class="truncate">{{ currentStepTitle || $t('project_create.in_progress') }}</span>
                </span>
                <span class="font-mono text-slate-500 flex-shrink-0">{{ currentStepNumber }} / {{ totalStepsCount }}</span>
              </div>
              <div class="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  class="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-300"
                  :style="{ width: `${progressPercent}%` }"
                ></div>
              </div>
            </div>

            <!-- Terminal Realtime Log -->
            <div class="space-y-1.5">
              <div class="text-[11px] font-mono text-slate-500 flex items-center justify-between">
                <span>{{ $t('project_create.live_execution_log') }}</span>
                <span class="text-rose-500 animate-pulse">● {{ $t('project_create.in_progress') }}</span>
              </div>
              <div
                ref="consoleLogRef"
                class="w-full h-80 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-300 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner"
              >
                {{ consoleOutput || $t('project_create.composer_starting') }}
              </div>
            </div>
          </div>

          <!-- 3. SUCCESS CARD -->
          <div
            v-else-if="creationState === 'success'"
            class="bg-white dark:bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-6 text-center space-y-5 shadow-lg animate-fade-in"
          >
            <div class="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 class="w-8 h-8" />
            </div>

            <div class="space-y-1">
              <h4 class="text-base font-bold text-slate-900 dark:text-white">
                {{ $t('project_create.project_ready_title') }}
              </h4>
              <p class="text-xs text-slate-500 dark:text-slate-400">
                {{ $t('project_create.project_ready_desc', { name: projectName }) }}
              </p>
            </div>

            <div class="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-left font-mono text-xs space-y-1">
              <div class="text-slate-700 dark:text-slate-300 font-semibold truncate">
                🌐 URL : <span class="text-emerald-500">{{ createdResult?.url || `https://${previewDomain}` }}</span>
              </div>
              <div class="text-slate-500 text-[11px] truncate">
                📁 {{ $t('project_create.folder') }} : {{ createdResult?.projectPath || previewPath }}
              </div>
            </div>

            <div class="space-y-2 pt-1">
              <button
                @click="onViewProject"
                class="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md"
              >
                <Sparkles class="w-4 h-4" />
                <span>{{ $t('project_create.open_in_laratool') }}</span>
              </button>

              <button
                @click="onOpenInBrowser"
                class="w-full py-2.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
              >
                <ExternalLink class="w-4 h-4" />
                <span>{{ $t('project_create.open_in_browser') }}</span>
              </button>

              <div class="grid grid-cols-2 gap-2 pt-1">
                <button
                  @click="onOpenInEditor"
                  class="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
                >
                  <Code class="w-3.5 h-3.5 text-blue-500" />
                  <span>VS Code</span>
                </button>

                <button
                  @click="onOpenInExplorer"
                  class="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700"
                >
                  <Folder class="w-3.5 h-3.5 text-amber-500" />
                  <span>{{ $t('project_create.folder') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 4. ERROR CARD -->
          <div
            v-else-if="creationState === 'error'"
            class="bg-white dark:bg-slate-900/90 border border-rose-500/40 rounded-2xl p-6 text-center space-y-4 shadow-sm animate-fade-in"
          >
            <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mx-auto">
              <AlertTriangle class="w-6 h-6" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-slate-900 dark:text-white">
                {{ $t('project_create.init_failed') }}
              </h4>
              <p class="text-xs text-rose-500 mt-1">
                {{ errorMessage }}
              </p>
            </div>

            <button
              @click="creationState = 'form'"
              class="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition"
            >
              {{ $t('project_create.fix_and_retry') }}
            </button>
          </div>

        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import {
  ArrowLeft,
  Sparkles,
  FolderPlus,
  Folder,
  Globe,
  Lock,
  Cpu,
  Database,
  Layers,
  Package,
  ShieldCheck,
  Check,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Code
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t } = useI18n();

function getPackageDesc(name, fallback) {
  const key = `composer_packages_catalog.packages.${name}`;
  const val = t(key);
  return val !== key ? val : fallback;
}

const props = defineProps({
  parkedPaths: { type: Array, default: () => [] },
  availablePhp: { type: Array, default: () => [] },
  availableNode: { type: Array, default: () => [] },
  defaultPhp: { type: String, default: '8.4' }
});

const emit = defineEmits([
  'back',
  'project-created',
  'select-project',
  'open-browser',
  'open-editor',
  'open-explorer',
  'show-toast'
]);

// Form values
const projectName = ref('');
const selectedParkedPath = ref(props.parkedPaths[0] || '');
const laravelVersion = ref('13');
const selectedPhp = ref(props.defaultPhp || '8.4');
const selectedNode = ref(props.availableNode?.[0]?.id || '24');
const databaseType = ref('sqlite');
const customDatabaseName = ref('');
const starterKit = ref('none');
const selectedPackages = ref([
  'barryvdh/laravel-debugbar',
  'laravel/sanctum'
]);
const runMigrations = ref(true);
const runSeeders = ref(false);
const enableSsl = ref(true);
const addToHosts = ref(true);
const initGit = ref(true);

const validationError = ref('');
const nameInputRef = ref(null);
const consoleLogRef = ref(null);

// Lifecycle states: 'form' | 'running' | 'success' | 'error'
const creationState = ref('form');
const currentStepTitle = ref('');
const currentStepNumber = ref(1);
const totalStepsCount = ref(7);
const consoleOutput = ref('');
const errorMessage = ref('');
const createdResult = ref(null);

// Catalog of Popular Composer Packages
const availablePackagesCatalog = [
  {
    name: 'barryvdh/laravel-debugbar',
    description: 'Barre de profilage en bas de page (requêtes SQL, temps, logs, mémoire).',
    isDev: true
  },
  {
    name: 'barryvdh/laravel-ide-helper',
    description: 'Autocomplétion des modèles, façades et scopes pour éditeurs (PhpStorm, VS Code).',
    isDev: true
  },
  {
    name: 'laravel/pint',
    description: 'Formateur de code officiel ultra-rapide basé sur PHP-CS-Fixer.',
    isDev: true
  },
  {
    name: 'pestphp/pest',
    description: 'Framework de test moderne, expressif et élégant basé sur PHPUnit.',
    isDev: true
  },
  {
    name: 'larastan/larastan',
    description: 'Analyse statique avancée (PHPStan) spécialisée pour Laravel.',
    isDev: true
  },
  {
    name: 'laravel/telescope',
    description: 'Tableau de bord d\'inspection des requêtes, exceptions et jobs.',
    isDev: true
  },
  {
    name: 'spatie/laravel-ray',
    description: 'Envoi direct des variables et logs dans l\'application Ray.',
    isDev: true
  },
  {
    name: 'laravel/sanctum',
    description: 'Système d\'authentification par jetons API légers et cookies SPA.',
    isDev: false
  },
  {
    name: 'spatie/laravel-permission',
    description: 'Gestion des rôles, permissions et autorisations Eloquent.',
    isDev: false
  },
  {
    name: 'laravel/socialite',
    description: 'Authentification OAuth multi-fournisseurs (Google, GitHub, etc.).',
    isDev: false
  },
  {
    name: 'dedoc/scramble',
    description: 'Génération automatique de documentation OpenAPI / Swagger sans annotations.',
    isDev: false
  },
  {
    name: 'laravel/reverb',
    description: 'Serveur WebSocket officiel ultra-rapide pour le broadcasting en direct.',
    isDev: false
  },
  {
    name: 'spatie/laravel-medialibrary',
    description: 'Association fluide de fichiers et images aux modèles Eloquent.',
    isDev: false
  },
  {
    name: 'maatwebsite/excel',
    description: 'Importation et exportation de fichiers Excel (.xlsx) et CSV.',
    isDev: false
  },
  {
    name: 'filament/filament',
    description: 'Suite d\'administration moderne et élégante pour la stack TALL.',
    isDev: false
  },
  {
    name: 'laravel/cashier',
    description: 'Gestion des abonnements, paiements et factures avec Stripe.',
    isDev: false
  },
  {
    name: 'spatie/laravel-backup',
    description: 'Sauvegardes automatisées de la base de données et des fichiers.',
    isDev: false
  },
  {
    name: 'spatie/laravel-activitylog',
    description: 'Journalisation automatique des activités et modifications des modèles.',
    isDev: false
  }
];

const cleanSlug = computed(() => {
  return projectName.value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
});

const previewDomain = computed(() => {
  const slug = cleanSlug.value;
  return slug ? `${slug}.test` : '...test';
});

const previewPath = computed(() => {
  const base = selectedParkedPath.value || (props.parkedPaths[0] || 'C:\\Projects');
  const slug = cleanSlug.value;
  return slug ? `${base}\\${slug}` : base;
});

const defaultDatabaseName = computed(() => {
  return cleanSlug.value ? cleanSlug.value.replace(/[^a-zA-Z0-9_]/g, '_') : 'laravel';
});

const isFormValid = computed(() => {
  return cleanSlug.value.length >= 2 && !validationError.value;
});

const progressPercent = computed(() => {
  if (totalStepsCount.value === 0) return 0;
  return Math.min(100, Math.round((currentStepNumber.value / totalStepsCount.value) * 100));
});

const starterKitLabel = computed(() => {
  switch (starterKit.value) {
    case 'breeze-blade': return 'Breeze (Blade)';
    case 'breeze-vue': return 'Breeze (Vue 3)';
    case 'breeze-react': return 'Breeze (React)';
    case 'breeze-api': return 'Breeze API';
    case 'filament': return 'Filament v3';
    default: return 'Standard (Blade)';
  }
});

function onNameInput() {
  const val = projectName.value;
  if (!val.trim()) {
    validationError.value = '';
    return;
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(val.trim())) {
    validationError.value = 'Utilisez uniquement des lettres, chiffres et tirets.';
  } else {
    validationError.value = '';
  }
}

function isPackageSelected(pkgName) {
  return selectedPackages.value.includes(pkgName);
}

function togglePackage(pkg) {
  const idx = selectedPackages.value.indexOf(pkg.name);
  if (idx >= 0) {
    selectedPackages.value.splice(idx, 1);
  } else {
    selectedPackages.value.push(pkg.name);
  }
}

// Subscribe to progress stream
let unsubscribeProgress = null;
onMounted(() => {
  if (props.parkedPaths.length > 0) {
    selectedParkedPath.value = props.parkedPaths[0];
  }
  if (props.defaultPhp) {
    selectedPhp.value = props.defaultPhp;
  }
  if (props.availableNode.length > 0) {
    selectedNode.value = props.availableNode[0].id || '20';
  }

  nextTick(() => {
    nameInputRef.value?.focus();
  });

  if (window.laratool?.onProjectCreateProgress) {
    unsubscribeProgress = window.laratool.onProjectCreateProgress((data) => {
      if (data.step) currentStepNumber.value = data.step;
      if (data.totalSteps) totalStepsCount.value = data.totalSteps;
      if (data.title) currentStepTitle.value = data.title;
      if (data.output) {
        consoleOutput.value += data.output;
        nextTick(() => {
          if (consoleLogRef.value) {
            consoleLogRef.value.scrollTop = consoleLogRef.value.scrollHeight;
          }
        });
      }
    });
  }
});

onUnmounted(() => {
  if (typeof unsubscribeProgress === 'function') {
    unsubscribeProgress();
    unsubscribeProgress = null;
  }
});

async function startCreation() {
  if (!isFormValid.value) return;

  creationState.value = 'running';
  consoleOutput.value = `> Démarrage du scaffolding pour « ${cleanSlug.value} » (Laravel ${laravelVersion.value})...\n`;
  currentStepNumber.value = 1;
  totalStepsCount.value = 7;
  currentStepTitle.value = 'Préparation du projet...';

  // Separate regular vs dev packages
  const regularPkgs = [];
  const devPkgs = [];
  for (const pkgName of selectedPackages.value) {
    const meta = availablePackagesCatalog.find(p => p.name === pkgName);
    if (meta?.isDev) {
      devPkgs.push(pkgName);
    } else {
      regularPkgs.push(pkgName);
    }
  }

  try {
    const options = {
      name: cleanSlug.value,
      parkedPath: selectedParkedPath.value || props.parkedPaths[0],
      laravelVersion: laravelVersion.value,
      phpVersion: selectedPhp.value,
      nodeVersion: selectedNode.value,
      databaseType: databaseType.value,
      databaseName: customDatabaseName.value.trim() || defaultDatabaseName.value,
      starterKit: starterKit.value,
      packages: regularPkgs,
      devPackages: devPkgs,
      initGit: initGit.value,
      enableSsl: enableSsl.value,
      addToHosts: addToHosts.value,
      runMigrations: runMigrations.value,
      runSeeders: runSeeders.value
    };

    let result;
    if (window.laratool?.projects?.create) {
      result = await window.laratool.projects.create(options);
    } else {
      // Browser simulation
      await new Promise(r => setTimeout(r, 2000));
      result = {
        success: true,
        project: {
          name: options.name,
          domain: `${options.name}.test`,
          path: `${options.parkedPath}\\${options.name}`,
          isLaravel: true,
          framework: 'Laravel',
          frameworkVersion: options.laravelVersion === '10' ? '^10.0' : (options.laravelVersion === '11' ? '^11.0' : (options.laravelVersion === '12' ? '^12.0' : (options.laravelVersion === '13' ? '^13.0' : 'dev-master'))),
          phpVersion: options.phpVersion,
          nodeVersion: options.nodeVersion,
          inHosts: options.addToHosts,
          isSsl: options.enableSsl
        },
        domain: `${options.name}.test`,
        projectPath: `${options.parkedPath}\\${options.name}`,
        url: `${options.enableSsl ? 'https' : 'http'}://${options.name}.test`
      };
    }

    if (result && result.success) {
      createdResult.value = result;
      creationState.value = 'success';
      emit('project-created', result.project);
      emit('show-toast', { message: `Projet « ${cleanSlug.value} » initialisé avec succès !`, type: 'success' });
    } else {
      throw new Error(result?.error || "L'initialisation a échoué.");
    }
  } catch (err) {
    errorMessage.value = err.message || "Une erreur est survenue lors de la création du projet.";
    creationState.value = 'error';
    emit('show-toast', { message: err.message, type: 'error' });
  }
}

function onViewProject() {
  if (createdResult.value?.project) {
    emit('select-project', createdResult.value.project);
  }
}

function onOpenInBrowser() {
  if (createdResult.value) {
    emit('open-browser', createdResult.value.domain, enableSsl.value);
  }
}

function onOpenInEditor() {
  if (createdResult.value?.projectPath) {
    emit('open-editor', createdResult.value.projectPath);
  }
}

function onOpenInExplorer() {
  if (createdResult.value?.projectPath) {
    emit('open-explorer', createdResult.value.projectPath);
  }
}
</script>
