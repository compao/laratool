<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Top Toolbar: Counters, Check Updates & Layout Switcher -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2 rounded-xl shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ installedNodeCount }}</span>
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

    <!-- 1. Node Cards Grid Mode -->
    <div v-if="versions.length > 0 && layoutMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div
        v-for="node in versions"
        :key="node.id"
        class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-sm card-hover transition-all duration-200"
        :class="{ 'border-rose-500/40 bg-rose-500/[0.03]': node.isDefault }"
      >
        <div>
          <!-- Header -->
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 font-mono">
                {{ node.id }}
              </div>
              <div>
                <div class="flex items-center gap-2 flex-wrap">
                  <h4 class="font-semibold text-slate-900 dark:text-white text-base">{{ node.name }}</h4>
                  <span
                    v-if="node.isDefault"
                    class="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30"
                  >
                    {{ $t('common.cli_default') }}
                  </span>
                  <span
                    v-if="node.hasUpdate"
                    class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono"
                  >
                    {{ $t('common.update_available', { version: node.latestVersion }) }}
                  </span>
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                  <span v-if="node.fullVersion || node.version">Node: <code class="font-mono text-slate-700 dark:text-slate-300 font-semibold">{{ node.fullVersion || node.version }}</code></span>
                  <span v-if="node.npmVersion">NPM: <code class="font-mono text-slate-700 dark:text-slate-300 font-semibold">v{{ node.npmVersion }}</code></span>
                </div>
              </div>
            </div>

            <!-- Status pill -->
            <span
              v-if="node.installed"
              class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              {{ $t('common.ready') }}
            </span>
            <span v-else class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
              {{ $t('common.not_installed') }}
            </span>
          </div>

          <!-- Installation Details -->
          <p v-if="node.installed" class="text-xs text-slate-400 dark:text-slate-500 truncate mt-3 font-mono" :title="node.path">
            {{ node.path }}
          </p>
        </div>

        <!-- Actions -->
        <div class="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-3">
          <template v-if="node.installed">
            <div class="flex items-center gap-2 flex-wrap">
              <button
                v-if="node.hasUpdate"
                @click="$emit('update-node', node.id)"
                :disabled="updatingVersion === node.id"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
                :title="$t('common.update_available', { version: node.latestVersion })"
              >
                <ArrowUpCircle class="w-3.5 h-3.5" :class="{ 'animate-pulse': updatingVersion === node.id }" />
                <span>{{ updatingVersion === node.id ? $t('common.updating') : $t('common.update') }}</span>
              </button>

              <button
                @click="$emit('open-terminal', node.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
                :title="$t('node.open_terminal_tooltip')"
              >
                <Terminal class="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                {{ $t('node.open_terminal') }}
              </button>

              <button
                v-if="!node.isDefault"
                @click="$emit('set-default', node.id)"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-200 dark:border-rose-500/20 transition"
              >
                <Check class="w-3.5 h-3.5" />
                {{ $t('common.set_default') }}
              </button>
            </div>
          </template>

          <template v-else>
            <button
              @click="$emit('install-node', node.id)"
              class="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
            >
              <Download class="w-4 h-4" />
              {{ $t('common.download_and_install') }} Node.js {{ node.id }} LTS
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 2. Node LIST VIEW MODE -->
    <div v-else-if="versions.length > 0 && layoutMode === 'list'" class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
      <!-- Table Header -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div class="col-span-5">{{ $t('node.col_version') }}</div>
        <div class="col-span-2">{{ $t('common.status') }}</div>
        <div class="col-span-5 text-right pr-2">{{ $t('common.actions') }}</div>
      </div>

      <div class="divide-y divide-slate-200 dark:divide-slate-800/60">
        <div
          v-for="node in versions"
          :key="node.id"
          class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition grid grid-cols-1 md:grid-cols-12 gap-4 items-center group select-none"
          :class="{ 'bg-rose-500/[0.015]': node.isDefault }"
        >
          <!-- Identity (col-span-5) -->
          <div class="col-span-5 flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 font-mono flex-shrink-0">
              {{ node.id }}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h4 class="font-semibold text-slate-900 dark:text-white text-sm truncate">{{ node.name }}</h4>
                <span
                  v-if="node.isDefault"
                  class="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30 whitespace-nowrap"
                >
                  {{ $t('common.default') }}
                </span>
                <span
                  v-if="node.hasUpdate"
                  class="text-[9px] font-semibold px-1.5 py-0.2 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 font-mono whitespace-nowrap"
                >
                  → {{ node.latestVersion }}
                </span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                <span v-if="node.fullVersion || node.version">Node {{ node.fullVersion || node.version }}</span>
                <span v-if="node.npmVersion"> • npm v{{ node.npmVersion }}</span>
              </div>
            </div>
          </div>

          <!-- Status (col-span-2) -->
          <div class="col-span-2 flex items-center">
            <span
              v-if="node.installed"
              class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400"></span>
              {{ $t('common.ready') }}
            </span>
            <span v-else class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded border border-slate-200 dark:border-transparent">
              {{ $t('common.not_installed') }}
            </span>
          </div>

          <!-- Actions (col-span-5) -->
          <div class="col-span-5 flex items-center justify-end gap-1.5 flex-wrap">
            <template v-if="node.installed">
              <button
                v-if="node.hasUpdate"
                @click="$emit('update-node', node.id)"
                :disabled="updatingVersion === node.id"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-500/30 transition disabled:opacity-60"
                :title="$t('common.update_available', { version: node.latestVersion })"
              >
                <ArrowUpCircle class="w-3 h-3" :class="{ 'animate-pulse': updatingVersion === node.id }" />
                <span>{{ updatingVersion === node.id ? $t('common.updating') : $t('common.update') }}</span>
              </button>

              <button
                @click="$emit('open-terminal', node.id)"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
                :title="$t('node.open_terminal_tooltip')"
              >
                <Terminal class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <span>{{ $t('node.open_terminal') }}</span>
              </button>

              <button
                v-if="!node.isDefault"
                @click="$emit('set-default', node.id)"
                class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 text-[11px] font-medium transition"
                :title="$t('common.set_default')"
              >
                {{ $t('common.set_default') }}
              </button>
            </template>

            <button
              v-else
              @click="$emit('install-node', node.id)"
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
        JS
      </div>
      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('node.no_active_title') }}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        {{ $t('node.no_active_desc') }}
      </p>
    </div>

    <!-- Explanatory note -->
    <div class="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-400 space-y-1.5 shadow-sm">
      <div class="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-2">
        <Info class="w-4 h-4 text-rose-500 dark:text-rose-400" />
        {{ $t('node.how_it_works_title') }}
      </div>
      <p>
        {{ $t('node.how_it_works_p1') }}
      </p>
      <p>
        {{ $t('node.how_it_works_p2') }}
      </p>
      <p>
        {{ $t('node.how_it_works_p3') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Download, 
  Info,
  Check,
  Terminal,
  LayoutGrid,
  List,
  RefreshCw,
  ArrowUpCircle
} from 'lucide-vue-next';
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
  'install-node',
  'update-node',
  'check-updates',
  'set-default',
  'open-terminal'
]);

const layoutMode = ref('grid');

function setLayout(mode) {
  layoutMode.value = mode;
  localStorage.setItem('laratool_node_layout', mode);
}

onMounted(() => {
  const saved = localStorage.getItem('laratool_node_layout');
  if (saved === 'list' || saved === 'grid') {
    layoutMode.value = saved;
  }
});

const installedNodeCount = computed(() => {
  return props.versions.filter(n => n.installed).length;
});
</script>
