<template>
  <PhpDetailView
    v-if="selectedVersion"
    :version-id="selectedVersion"
    :updating-version="updatingVersion"
    @back="selectedVersion = null"
    @start-php="$emit('start-php', $event)"
    @stop-php="$emit('stop-php', $event)"
    @restart-php="$emit('restart-php', $event)"
    @set-default="$emit('set-default', $event)"
    @update-php="$emit('update-php', $event)"
  />

  <div v-else class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Top Toolbar: Counters, Check Updates & Layout Switcher -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2 rounded-xl shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ activePhpCount }}</span>
        <span>{{ $t('php.active_count', { count: activePhpCount }) }}</span>
        <span class="text-slate-400">·</span>
        <span class="font-mono font-bold">{{ installedPhpCount }}</span>
        <span class="text-slate-400">/</span>
        <span class="font-mono">{{ versions.length }}</span>
        <span>{{ $t('common.installed') }}</span>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <button
          @click="$emit('check-updates')"
          :disabled="isCheckingUpdates"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/[0.08] shadow-sm transition disabled:opacity-60"
        >
          <RefreshCw class="w-3.5 h-3.5 text-rose-500" :class="{ 'animate-spin': isCheckingUpdates }" />
          <span>{{ isCheckingUpdates ? $t('common.checking_updates') : $t('common.check_updates') }}</span>
        </button>

        <!-- Grid/List Switcher -->
        <SegmentedToggle
          :model-value="layoutMode"
          :options="layoutOptions"
          @update:model-value="setLayout"
        />
      </div>
    </div>

    <!-- 1. PHP Cards Grid Mode -->
    <div v-if="versions.length > 0 && layoutMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="php in versions"
        :key="php.id"
        @click="php.installed ? selectedVersion = php.id : null"
        class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between group transition-all duration-200 select-none shadow-sm card-hover"
        :class="[
          php.installed ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' : '',
          php.isDefault ? 'border-rose-500/40 bg-rose-500/[0.03]' : ''
        ]"
      >
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 font-mono group-hover:border-purple-500/40 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition">
                {{ php.id }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-semibold text-slate-900 dark:text-white text-base group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">{{ php.name }}</h4>
                  <span
                    v-if="php.isDefault"
                    class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                  >
                    {{ $t('common.cli_default') }}
                  </span>
                  <span
                    v-if="php.hasUpdate"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono"
                  >
                    {{ $t('common.update_available', { version: php.latestVersion }) }}
                  </span>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
                  <span v-if="php.installed && php.fullVersion" class="font-mono text-slate-700 dark:text-slate-300 font-semibold">v{{ php.fullVersion }}</span>
                  <span v-else-if="php.latestVersion" class="font-mono text-slate-500 dark:text-slate-400">v{{ php.latestVersion }}</span>
                  <span v-if="(php.installed && php.fullVersion) || php.latestVersion" class="text-slate-300 dark:text-slate-700">·</span>
                  <span>{{ $t('php.fastcgi_port') }} : <code class="font-mono text-slate-700 dark:text-slate-300 font-semibold">127.0.0.1:{{ php.port }}</code></span>
                </div>
              </div>
            </div>

            <!-- Status pill & Detail arrow -->
            <div class="flex items-center gap-2">
              <span
                v-if="php.installed"
                class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
                :class="php.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="php.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
                {{ php.running ? $t('common.running') : $t('common.stopped') }}
              </span>
              <span v-else class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
                {{ $t('common.not_installed') }}
              </span>
              <ChevronRight v-if="php.installed" class="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:text-rose-500 transition" />
            </div>
          </div>

          <!-- Installation Details -->
          <p v-if="php.installed" class="text-xs text-slate-400 dark:text-slate-500 truncate mt-3 font-mono" :title="php.path">
            {{ php.path }}
          </p>
        </div>

        <!-- Actions -->
        <div @click.stop class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3 flex-wrap">
          <template v-if="php.installed">
            <div class="flex items-center gap-2">
              <!-- Start / Stop FastCGI -->
              <button
                v-if="!php.running"
                @click="$emit('start-php', php.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                {{ $t('php.start_fastcgi') }}
              </button>
              <button
                v-else
                @click="$emit('stop-php', php.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition"
              >
                <Square class="w-3.5 h-3.5 fill-current" />
                {{ $t('common.stop') }}
              </button>

              <!-- Restart -->
              <button
                v-if="php.running"
                @click="$emit('restart-php', php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
                :title="$t('common.restart')"
              >
                <RotateCw class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Configuration & Terminal Quick Actions -->
            <div class="flex items-center gap-1.5">
              <button
                v-if="php.hasUpdate"
                @click="$emit('update-php', php.id)"
                :disabled="updatingVersion === php.id"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
                :title="$t('common.update_available', { version: php.latestVersion })"
              >
                <ArrowUpCircle class="w-3.5 h-3.5" :class="{ 'animate-pulse': updatingVersion === php.id }" />
                <span>{{ updatingVersion === php.id ? $t('common.updating') : $t('common.update') }}</span>
              </button>

              <button
                @click="openIni(php.id)"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-300 dark:border-slate-700/80 transition"
                :title="$t('php.view_ini')"
              >
                <FileCode2 class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span>php.ini</span>
              </button>

              <button
                @click="openTerminal(php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-300 dark:border-slate-700/80 transition"
                :title="$t('common.terminal')"
              >
                <Terminal class="w-3.5 h-3.5" />
              </button>

              <button
                @click="openFolder(php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-300 dark:border-slate-700/80 transition"
                :title="$t('php.open_folder')"
              >
                <Folder class="w-3.5 h-3.5" />
              </button>

              <button
                v-if="!php.isDefault"
                @click="$emit('set-default', php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700/80 text-xs font-medium transition"
                :title="$t('php.set_as_default')"
              >
                $PATH
              </button>
            </div>
          </template>

          <template v-else>
            <button
              @click="$emit('install-php', { version: php.id, port: php.port })"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
            >
              <Download class="w-4 h-4" />
              {{ $t('common.download_and_install') }} PHP {{ php.id }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 2. PHP LIST VIEW MODE -->
    <div v-else-if="versions.length > 0 && layoutMode === 'list'" class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
      <!-- Table Header -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div class="col-span-5">Version & {{ $t('php.fastcgi_port') }}</div>
        <div class="col-span-2">{{ $t('common.status') }}</div>
        <div class="col-span-5 text-right pr-2">{{ $t('common.actions') }}</div>
      </div>

      <div class="divide-y divide-slate-200 dark:divide-slate-800/60">
        <div
          v-for="php in versions"
          :key="php.id"
          @click="php.installed ? selectedVersion = php.id : null"
          class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition grid grid-cols-1 md:grid-cols-12 gap-4 items-center group select-none"
          :class="[
            php.installed ? 'cursor-pointer' : '',
            php.isDefault ? 'bg-rose-500/[0.015]' : ''
          ]"
        >
          <!-- Identity (col-span-5) -->
          <div class="col-span-5 flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 font-mono group-hover:border-purple-500/40 group-hover:text-purple-600 dark:group-hover:text-purple-300 transition flex-shrink-0">
              {{ php.id }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-semibold text-slate-900 dark:text-white text-sm group-hover:text-rose-600 dark:group-hover:text-rose-400 transition truncate">{{ php.name }}</h4>
                <span
                  v-if="php.isDefault"
                  class="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 whitespace-nowrap"
                >
                  $PATH
                </span>
                <span
                  v-if="php.hasUpdate"
                  class="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono whitespace-nowrap"
                >
                  → v{{ php.latestVersion }}
                </span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex items-center gap-1.5">
                <span v-if="php.installed && php.fullVersion">v{{ php.fullVersion }}</span>
                <span v-else-if="php.latestVersion">v{{ php.latestVersion }}</span>
                <span v-if="(php.installed && php.fullVersion) || php.latestVersion">·</span>
                <span>{{ $t('php.fastcgi_port') }} : 127.0.0.1:{{ php.port }}</span>
              </div>
            </div>
          </div>

          <!-- Statut (col-span-2) -->
          <div class="col-span-2 flex items-center">
            <span
              v-if="php.installed"
              class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              :class="php.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-transparent'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="php.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
              {{ php.running ? $t('common.running') : $t('common.stopped') }}
            </span>
            <span v-else class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
              {{ $t('common.not_installed') }}
            </span>
          </div>

          <!-- Actions (col-span-5) -->
          <div @click.stop class="col-span-5 flex items-center justify-end gap-1.5 flex-wrap">
            <template v-if="php.installed">
              <!-- Start / Stop FastCGI -->
              <button
                v-if="!php.running"
                @click="$emit('start-php', php.id)"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
              >
                <Play class="w-3 h-3 fill-current" />
                <span>{{ $t('common.start') }}</span>
              </button>
              <button
                v-else
                @click="$emit('stop-php', php.id)"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition"
              >
                <Square class="w-3 h-3 fill-current" />
                <span>{{ $t('common.stop') }}</span>
              </button>

              <button
                v-if="php.running"
                @click="$emit('restart-php', php.id)"
                class="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
                :title="$t('common.restart')"
              >
                <RotateCw class="w-3.5 h-3.5" />
              </button>

              <button
                v-if="php.hasUpdate"
                @click="$emit('update-php', php.id)"
                :disabled="updatingVersion === php.id"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
                :title="$t('common.update_available', { version: php.latestVersion })"
              >
                <ArrowUpCircle class="w-3.5 h-3.5" :class="{ 'animate-pulse': updatingVersion === php.id }" />
                <span>{{ updatingVersion === php.id ? $t('common.updating') : $t('common.update') }}</span>
              </button>

              <button
                @click="openIni(php.id)"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
                :title="$t('php.view_ini')"
              >
                <FileCode2 class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span class="hidden sm:inline">php.ini</span>
              </button>

              <button
                @click="openTerminal(php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-300 dark:border-slate-700 transition"
                :title="$t('common.terminal')"
              >
                <Terminal class="w-3.5 h-3.5" />
              </button>

              <button
                @click="openFolder(php.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
                :title="$t('php.open_folder')"
              >
                <Folder class="w-3.5 h-3.5" />
              </button>

              <button
                v-if="!php.isDefault"
                @click="$emit('set-default', php.id)"
                class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 text-[11px] font-mono transition"
                :title="$t('php.set_as_default')"
              >
                $PATH
              </button>

            </template>

            <button
              v-else
              @click="$emit('install-php', { version: php.id, port: php.port })"
              class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ $t('common.install') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-base font-bold">
        PHP
      </div>
      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('php.no_active_title') }}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        {{ $t('php.no_active_desc') }}
      </p>

    </div>

    <!-- Explanatory note -->
    <div class="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
      <div class="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
        <Info class="w-4 h-4 text-rose-500 dark:text-rose-400" />
        {{ $t('php.how_it_works_title') }}
      </div>
      <p>
        {{ $t('php.how_it_works_p1') }}
      </p>
      <p>
        {{ $t('php.how_it_works_p2') }}
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Play, 
  Square, 
  RotateCw, 
  Download, 
  Info,
  FileCode2,
  Terminal,
  Folder,
  LayoutGrid,
  List,
  ChevronRight,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-vue-next';
import PhpDetailView from './PhpDetailView.vue';
import { SegmentedToggle } from '../components/ui';
import { useI18n } from '../i18n';

const { t } = useI18n();

const layoutOptions = computed(() => [
  { value: 'grid', label: t('php.grid_view'), icon: LayoutGrid },
  { value: 'list', label: t('php.list_view'), icon: List }
]);

const props = defineProps({
  versions: { type: Array, default: () => [] },
  isCheckingUpdates: { type: Boolean, default: false },
  updatingVersion: { type: String, default: null }
});

defineEmits([
  'install-php',
  'update-php',
  'check-updates',
  'start-php',
  'stop-php',
  'restart-php',
  'set-default'
]);

const api = window.laratool;
const selectedVersion = ref(null);
const layoutMode = ref('grid');

function setLayout(mode) {
  layoutMode.value = mode;
  localStorage.setItem('laratool_php_layout', mode);
}

onMounted(() => {
  const saved = localStorage.getItem('laratool_php_layout');
  if (saved === 'list' || saved === 'grid') {
    layoutMode.value = saved;
  }
});

function openIni(version) {
  if (api?.php?.openIni) {
    api.php.openIni(version);
  }
}

function openTerminal(version) {
  if (api?.php?.openTerminal) {
    api.php.openTerminal(version);
  }
}

function openFolder(version) {
  if (api?.php?.openFolder) {
    api.php.openFolder(version);
  }
}

const activePhpCount = computed(() => {
  return props.versions.filter(p => p.running).length;
});

const installedPhpCount = computed(() => {
  return props.versions.filter(p => p.installed).length;
});
</script>
