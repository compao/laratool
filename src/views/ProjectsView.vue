<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Top toolbar: Search, New Project & Actions -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="relative flex-1 min-w-[260px] max-w-md">
        <Search class="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          v-model="searchQuery"
          type="text"
          :placeholder="$t('projects.search_placeholder')"
          class="w-full bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500/50 transition-all shadow-sm"
        />
        <!-- Clear search button -->
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
          :title="$t('common.clear')"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <!-- Sync hosts button if needed (only visible during search when the main banner is hidden) -->
        <button
          v-if="unresolvedCount > 0 && searchQuery"
          @click="$emit('sync-all-hosts')"
          class="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-semibold transition active:scale-95 shadow-sm"
          :title="$t('dashboard.sync_hosts')"
        >
          <ShieldAlert class="w-3.5 h-3.5" />
          {{ $t('dashboard.sync_hosts_btn', { count: unresolvedCount }) }}
        </button>

        <!-- New Project Button -->
        <button
          @click="$emit('open-create-modal')"
          class="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/20 active:scale-95 flex-shrink-0"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ $t('projects.new_project') }}</span>
        </button>
      </div>
    </div>

    <!-- Secondary line: Stats on left, Grid/List Switcher at bottom-right -->
    <div class="flex items-center justify-between gap-4 flex-wrap pt-0.5">
      <div class="text-xs text-slate-500 dark:text-slate-400 font-medium">
        <span class="font-bold text-slate-900 dark:text-slate-200">{{ filteredProjects.length }}</span> {{ filteredProjects.length > 1 ? $t('sidebar.projects') : $t('projects.filter_laravel') }}
        <span v-if="searchQuery" class="text-slate-400 font-mono"> ({{ searchQuery }})</span>
      </div>

      <!-- View mode switcher: Grid vs List (bottom-right) -->
      <SegmentedToggle
        :model-value="layoutMode"
        :options="layoutOptions"
        class="ml-auto"
        @update:model-value="setLayout"
      />
    </div>

    <!-- Alert banner if any domains not resolved in hosts (only shown when no search active) -->
    <div
      v-if="unresolvedCount > 0 && !searchQuery"
      class="flex items-center justify-between p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 gap-4 shadow-sm"
    >
      <div class="flex items-center gap-3">
        <div class="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
          <ShieldAlert class="w-5 h-5" />
        </div>
        <div>
          <span class="font-bold">{{ $t('projects.dns_resolution_required') }}</span>
          <p class="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            {{ unresolvedCount }} {{ unresolvedCount > 1 ? $t('dashboard.unresolved_hosts', { count: unresolvedCount }) : $t('dashboard.unresolved_hosts', { count: unresolvedCount }) }}
          </p>
        </div>
      </div>
      <button
        @click="$emit('sync-all-hosts')"
        class="whitespace-nowrap px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition shadow-md shadow-amber-600/20 active:scale-95"
      >
        {{ $t('projects.sync_now') }}
      </button>
    </div>

    <!-- 1. GRID VIEW MODE -->
    <div v-if="filteredProjects.length > 0 && layoutMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="project in filteredProjects"
        :key="project.path"
        @click="$emit('select-project', project)"
        class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-rose-500/40 dark:hover:border-rose-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-lg shadow-sm cursor-pointer group select-none card-hover"
      >
        <div>
          <!-- Card Header -->
          <div class="flex items-start justify-between gap-3 mb-2">
            <div class="flex items-center gap-3 min-w-0">
              <div 
                class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm"
                :class="project.isLaravel 
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400' 
                  : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400'"
              >
                {{ project.isLaravel ? 'L' : 'P' }}
              </div>
              <div class="min-w-0">
                <h3 class="font-bold text-slate-900 dark:text-white text-base leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">
                  {{ project.name }}
                </h3>
                <span class="text-xs font-mono flex items-center gap-1.5 mt-0.5" :class="project.inHosts ? 'text-slate-500 dark:text-slate-400' : 'text-amber-600 dark:text-amber-400/90'">
                  <Lock v-if="project.isSsl" class="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                  <Globe v-else class="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span class="truncate">{{ project.isSsl ? 'https://' : 'http://' }}{{ project.domain }}</span>
                  <span v-if="!project.inHosts" class="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-sans font-bold whitespace-nowrap">{{ $t('projects.dns_not_configured') }}</span>
                </span>
              </div>
            </div>

            <!-- SSL Toggle, Framework Badge & Details Arrow -->
            <div class="flex items-center gap-2 flex-shrink-0">
              <button
                @click.stop="$emit('toggle-ssl', { projectPath: project.path, domain: project.domain, enabled: !project.isSsl })"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold border transition active:scale-95"
                :class="project.isSsl
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-slate-700'"
                :title="project.isSsl ? $t('projects.click_for_http') : $t('projects.click_for_https')"
              >
                <Lock v-if="project.isSsl" class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <Unlock v-else class="w-3 h-3 text-slate-400" />
                <span>{{ project.isSsl ? 'HTTPS' : 'HTTP' }}</span>
              </button>

              <span
                v-if="activeTunnels && activeTunnels[project.name]"
                class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap"
                title="Tunnel public HTTPS actif"
              >
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                {{ $t('common.online') }}
              </span>

              <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/[0.08]">
                {{ project.framework }} {{ project.frameworkVersion }}
              </span>
            </div>
          </div>

          <!-- Project Path -->
          <p class="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-2 font-mono" :title="project.path">
            {{ project.path }}
          </p>
        </div>

        <!-- Card Footer: PHP / Node Selectors & Actions -->
        <div @click.stop class="mt-5 pt-4 border-t border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between gap-2">
          <!-- PHP and Node Version Selectors -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <label class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">PHP:</label>
              <select
                :value="project.phpVersion"
                @change="onChangePhp(project, $event.target.value)"
                class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] text-xs rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              >
                <option v-for="ver in availablePhp" :key="ver.id" :value="ver.id">
                  {{ ver.id }} {{ ver.running ? '●' : '' }}
                </option>
              </select>
            </div>

            <div class="flex items-center gap-1.5">
              <label class="text-[11px] text-slate-500 dark:text-slate-400 font-bold">Node:</label>
              <select
                :value="project.nodeVersion || ''"
                @change="onChangeNode(project, $event.target.value)"
                class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] text-xs rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono"
              >
                <option value="">{{ $t('projects.system_version') }}</option>
                <option v-for="ver in availableNode" :key="ver.id" :value="ver.id">
                  {{ ver.id }}
                </option>
              </select>
            </div>
          </div>

          <!-- Action Buttons (Browser, Terminal, VS Code, Explorer) -->
          <div class="flex items-center gap-1">
            <!-- Add to hosts if needed -->
            <button
              v-if="!project.inHosts"
              @click="$emit('add-hosts', project.domain)"
              class="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600 dark:text-amber-400 transition"
              :title="$t('projects.add_to_hosts')"
            >
              <ShieldAlert class="w-4 h-4" />
            </button>

            <!-- Open in Browser -->
            <button
              @click="$emit('open-browser', project.domain, project.isSsl)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition active:scale-90"
              :title="$t('projects.open_browser')"
            >
              <ExternalLink class="w-4 h-4" />
            </button>

            <!-- Open in Terminal -->
            <button
              @click="$emit('open-terminal', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-90"
              :title="$t('projects.open_terminal')"
            >
              <Terminal class="w-3.5 h-3.5" />
            </button>

            <!-- Open in VS Code -->
            <button
              @click="$emit('open-editor', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition active:scale-90"
              :title="$t('projects.open_editor')"
            >
              <Code class="w-4 h-4" />
            </button>

            <!-- Open Folder -->
            <button
              @click="$emit('open-explorer', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
              :title="$t('projects.open_folder')"
            >
              <Folder class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. LIST VIEW MODE (High-density Table Rows) -->
    <div v-else-if="filteredProjects.length > 0 && layoutMode === 'list'" class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl overflow-hidden shadow-sm">
      <!-- Table Header -->
      <div class="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-slate-50/80 dark:bg-slate-950/40 border-b border-slate-200/80 dark:border-white/[0.06] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div class="col-span-4">{{ $t('sidebar.projects') }} & {{ $t('projects.domain') }}</div>
        <div class="col-span-2">Framework</div>
        <div class="col-span-1">SSL</div>
        <div class="col-span-3">{{ $t('projects.col_runtimes') }}</div>
        <div class="col-span-2 text-right pr-2">{{ $t('common.actions') }}</div>
      </div>

      <div class="divide-y divide-slate-200/60 dark:divide-white/[0.05]">
        <div
          v-for="project in filteredProjects"
          :key="project.path"
          @click="$emit('select-project', project)"
          class="px-5 py-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-3 items-center group select-none"
        >
          <!-- Identity (col-span-4) -->
          <div class="col-span-4 flex items-center gap-3 min-w-0">
            <div 
              class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-sm"
              :class="project.isLaravel 
                ? 'bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400' 
                : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400'"
            >
              {{ project.isLaravel ? 'L' : 'P' }}
            </div>
            <div class="min-w-0">
              <h3 class="font-bold text-slate-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">{{ project.name }}</h3>
              <div class="text-xs font-mono flex items-center gap-1.5 mt-0.5" :class="project.inHosts ? 'text-slate-500 dark:text-slate-400' : 'text-amber-600 dark:text-amber-400'">
                <Lock v-if="project.isSsl" class="w-3 h-3 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />
                <Globe v-else class="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span class="truncate">{{ project.isSsl ? 'https://' : 'http://' }}{{ project.domain }}</span>
                <span v-if="!project.inHosts" class="text-[9px] bg-amber-500/20 text-amber-700 dark:text-amber-300 px-1.5 py-0.2 rounded-full font-sans font-bold flex-shrink-0">{{ $t('projects.dns_not_configured') }}</span>
              </div>
            </div>
          </div>

          <!-- Framework (col-span-2) -->
          <div class="col-span-2 hidden md:flex items-center">
            <span class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-white/[0.08] truncate">
              {{ project.framework }} {{ project.frameworkVersion }}
            </span>
          </div>

          <!-- SSL Toggle & Tunnel Badge (col-span-1) -->
          <div @click.stop class="col-span-1 hidden md:flex items-center gap-1.5 flex-wrap">
            <span
              v-if="activeTunnels && activeTunnels[project.name]"
              class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              title="Tunnel public HTTPS actif"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              🌐
            </span>

            <button
              @click="$emit('toggle-ssl', { projectPath: project.path, domain: project.domain, enabled: !project.isSsl })"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold border transition active:scale-95"
              :class="project.isSsl
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/[0.08] hover:bg-slate-200 dark:hover:bg-slate-700'"
              :title="project.isSsl ? 'HTTPS' : 'HTTP'"
            >
              <Lock v-if="project.isSsl" class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
              <Unlock v-else class="w-3 h-3 text-slate-400" />
              <span>{{ project.isSsl ? 'HTTPS' : 'HTTP' }}</span>
            </button>
          </div>

          <!-- PHP & Node Selectors (col-span-3) -->
          <div @click.stop class="col-span-3 flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <label class="text-[10px] text-slate-400 uppercase font-bold w-7 flex-shrink-0">PHP:</label>
              <select
                :value="project.phpVersion"
                @change="onChangePhp(project, $event.target.value)"
                class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] text-xs rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-mono w-24"
              >
                <option v-for="ver in availablePhp" :key="ver.id" :value="ver.id">
                  {{ ver.id }} {{ ver.running ? '●' : '' }}
                </option>
              </select>
            </div>

            <div class="flex items-center gap-1.5">
              <label class="text-[10px] text-slate-400 uppercase font-bold w-8 flex-shrink-0">Node:</label>
              <select
                :value="project.nodeVersion || ''"
                @change="onChangeNode(project, $event.target.value)"
                class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/[0.1] text-xs rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 font-mono w-24"
              >
                <option value="">{{ $t('projects.system_version') }}</option>
                <option v-for="ver in availableNode" :key="ver.id" :value="ver.id">
                  {{ ver.id }}
                </option>
              </select>
            </div>
          </div>

          <!-- Actions (col-span-2) -->
          <div @click.stop class="col-span-2 flex items-center justify-end gap-1">
            <button
              v-if="!project.inHosts"
              @click="$emit('add-hosts', project.domain)"
              class="p-1 rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              :title="$t('projects.add_to_hosts')"
            >
              <ShieldAlert class="w-4 h-4" />
            </button>

            <button
              @click="$emit('open-browser', project.domain, project.isSsl)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition active:scale-90"
              :title="$t('projects.open_browser')"
            >
              <ExternalLink class="w-3.5 h-3.5" />
            </button>

            <button
              @click="$emit('open-terminal', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition active:scale-90"
              :title="$t('projects.open_terminal')"
            >
              <Terminal class="w-3.5 h-3.5" />
            </button>

            <button
              @click="$emit('open-editor', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition active:scale-90"
              :title="$t('projects.open_editor')"
            >
              <Code class="w-3.5 h-3.5" />
            </button>

            <button
              @click="$emit('open-explorer', project.path)"
              class="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-90"
              :title="$t('projects.open_folder')"
            >
              <Folder class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State: no projects configured -->
    <div v-else-if="!searchQuery" class="text-center py-16 bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto mb-3">
        <FolderGit2 class="w-7 h-7" />
      </div>
      <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('projects.no_projects_found') }}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
        {{ $t('projects.add_parked_hint') }}
      </p>
      <div class="flex items-center justify-center gap-3">
        <button
          @click="$emit('open-create-modal')"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition active:scale-95"
        >
          <Sparkles class="w-4 h-4" />
          {{ $t('projects.init_laravel_project') }}
        </button>
        <button
          @click="$emit('go-settings')"
          class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold border border-slate-200 dark:border-white/[0.08] transition active:scale-95"
        >
          <FolderPlus class="w-4 h-4" />
          {{ $t('projects.parked_folders') }}
        </button>
      </div>
    </div>

    <!-- Empty State: search has no results -->
    <div v-else class="text-center py-16 bg-white/90 dark:bg-slate-900/40 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-8 shadow-sm">
      <div class="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
        <Search class="w-7 h-7" />
      </div>
      <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('projects.no_results_for', { query: searchQuery }) }}</h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-5">
        {{ $t('projects.try_another_search') }}
      </p>
      <button
        @click="searchQuery = ''"
        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition active:scale-95"
      >
        <X class="w-4 h-4" />
        {{ $t('projects.clear_search') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Search, 
  Globe, 
  ExternalLink, 
  Terminal,
  Code,
  Folder, 
  FolderGit2, 
  FolderPlus,
  ShieldAlert,
  Lock,
  Unlock,
  X,
  LayoutGrid,
  List,
  Sparkles
} from 'lucide-vue-next';
import { SegmentedToggle } from '../components/ui';
import { useI18n } from '../i18n';

const { t } = useI18n();

const layoutOptions = computed(() => [
  { value: 'grid', label: t('projects.grid_view'), icon: LayoutGrid },
  { value: 'list', label: t('projects.list_view'), icon: List }
]);

const props = defineProps({
  projects: { type: Array, default: () => [] },
  availablePhp: { type: Array, default: () => [] },
  availableNode: { type: Array, default: () => [] },
  isSsl: { type: Boolean, default: false },
  activeTunnels: { type: Object, default: () => ({}) }
});

const emit = defineEmits([
  'select-project',
  'set-php',
  'set-node',
  'toggle-ssl',
  'open-browser',
  'open-terminal',
  'open-editor',
  'open-explorer',
  'add-hosts',
  'sync-all-hosts',
  'go-settings',
  'open-create-modal'
]);

const searchQuery = ref('');
const layoutMode = ref('grid');

function setLayout(mode) {
  layoutMode.value = mode;
  localStorage.setItem('laratool_projects_layout', mode);
}

onMounted(() => {
  const saved = localStorage.getItem('laratool_projects_layout');
  if (saved === 'list' || saved === 'grid') {
    layoutMode.value = saved;
  }
});

const filteredProjects = computed(() => {
  if (!searchQuery.value) return props.projects;
  const q = searchQuery.value.toLowerCase();
  return props.projects.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.domain.toLowerCase().includes(q)
  );
});

const unresolvedCount = computed(() => {
  return props.projects.filter(p => !p.inHosts).length;
});

function onChangePhp(project, version) {
  emit('set-php', { projectPath: project.path, version });
}

function onChangeNode(project, version) {
  emit('set-node', { projectPath: project.path, version: version || null });
}
</script>
