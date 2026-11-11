<template>
  <div class="space-y-4">
    <!-- Section Header with Realtime Controls -->
    <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center shadow-sm flex-shrink-0">
          <Sliders class="w-4 h-4" />
        </div>
        <div class="flex items-center gap-2.5 min-w-0">
          <h3 class="text-sm font-bold text-slate-900 dark:text-white truncate">
            {{ $t('site_inspector.title') }}
          </h3>
          <span
            v-if="isMaintenanceActive"
            class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            <span>{{ $t('site_inspector.maintenance_active') }}</span>
          </span>
        </div>
      </div>

      <!-- Quick Action Controls -->
      <div class="flex items-center gap-2 flex-wrap flex-shrink-0">
        <button
          type="button"
          @click="$emit('refresh')"
          :disabled="isLoading"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition disabled:opacity-50"
          :title="$t('site_inspector.refresh_tooltip')"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
          <span>{{ isLoading ? $t('site_inspector.refreshing') : $t('site_inspector.refresh') }}</span>
        </button>

        <button
          v-if="project.isLaravel"
          type="button"
          @click="$emit('toggle-maintenance')"
          :disabled="isTogglingMaintenance"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shadow-2xs disabled:opacity-50"
          :class="isMaintenanceActive
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'"
          :title="isMaintenanceActive ? 'php artisan up' : 'php artisan down'"
        >
          <RefreshCw v-if="isTogglingMaintenance" class="w-3.5 h-3.5 animate-spin" />
          <Activity v-else class="w-3.5 h-3.5" />
          <span>{{ isMaintenanceActive ? $t('site_inspector.exit_maintenance') : $t('site_inspector.enter_maintenance') }}</span>
        </button>

        <button
          v-if="project.isLaravel"
          type="button"
          @click="$emit('clear-caches')"
          :disabled="isPurgingCaches"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 text-rose-700 dark:text-rose-300 text-xs font-semibold border border-rose-200 dark:border-rose-800 transition disabled:opacity-50"
          :title="$t('site_inspector.clear_app_caches')"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>{{ isPurgingCaches ? $t('site_inspector.purging') : $t('site_inspector.clear_caches') }}</span>
        </button>

        <button
          v-if="project.isLaravel"
          type="button"
          @click="$emit('create-storage-link')"
          :disabled="isCreatingStorageLink"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-300 dark:border-slate-700 transition disabled:opacity-50"
          title="php artisan storage:link"
        >
          <RefreshCw v-if="isCreatingStorageLink" class="w-3.5 h-3.5 animate-spin" />
          <Link2 v-else class="w-3.5 h-3.5" />
          <span>{{ isCreatingStorageLink ? $t('site_inspector.linking') : $t('site_inspector.storage_link') }}</span>
        </button>

        <button
          v-if="project.isLaravel"
          type="button"
          @click="$emit('optimize-caches')"
          :disabled="isOptimizing"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-50"
          title="php artisan optimize"
        >
          <Zap class="w-3.5 h-3.5" />
          <span>{{ isOptimizing ? $t('site_inspector.optimizing') : $t('site_inspector.optimize') }}</span>
        </button>
      </div>
    </div>

    <!-- If loading with no data yet -->
    <div v-if="isLoading && !aboutData" class="p-8 text-center bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl">
      <RefreshCw class="w-6 h-6 text-rose-500 animate-spin mx-auto mb-2" />
      <p class="text-xs font-semibold text-slate-700 dark:text-slate-300">{{ $t('site_inspector.analyzing') }}</p>
    </div>

    <!-- Non-Laravel Info -->
    <div v-else-if="!project.isLaravel" class="p-4 bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
      <AlertCircle class="w-4 h-4 text-amber-500 flex-shrink-0" />
      <span>{{ $t('site_inspector.not_laravel') }}</span>
    </div>

    <!-- 3 Structured Tables Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
      <!-- 1. Environment Section -->
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
        <div>
          <div class="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Cpu class="w-3.5 h-3.5 text-rose-500" />
              <span>{{ $t('site_inspector.environment') }}</span>
            </div>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            <!-- Application Name -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.app_name') }}</span>
              <span class="font-bold text-slate-900 dark:text-white font-mono truncate max-w-[130px]" :title="aboutEnvironment?.application_name || project.name">
                {{ aboutEnvironment?.application_name || project.name }}
              </span>
            </div>
            <!-- Laravel Version -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.laravel_version') }}</span>
              <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {{ aboutEnvironment?.laravel_version || project.frameworkVersion || $t('site_inspector.unknown') }}
              </span>
            </div>
            <!-- PHP Version -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.php_version') }}</span>
              <span class="px-1.5 py-0.5 rounded font-mono font-bold text-[11px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {{ aboutEnvironment?.php_version || project.phpVersion }}
              </span>
            </div>
            <!-- Composer Version -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.composer_version') }}</span>
              <span class="font-mono text-slate-700 dark:text-slate-300 text-[11px]">
                {{ aboutEnvironment?.composer_version || '2.x' }}
              </span>
            </div>
            <!-- Environment -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.environment') }}</span>
              <span class="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {{ aboutEnvironment?.environment || 'local' }}
              </span>
            </div>
            <!-- Debug Mode -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.debug_mode') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="aboutEnvironment?.debug_mode ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
                <CheckCircle2 v-if="aboutEnvironment?.debug_mode" class="w-3.5 h-3.5 text-emerald-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ aboutEnvironment?.debug_mode ? $t('site_inspector.enabled') : $t('site_inspector.disabled') }}</span>
              </span>
            </div>
            <!-- Url -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.url') }}</span>
              <button
                type="button"
                @click="$emit('open-browser')"
                class="font-mono text-[11px] text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 truncate max-w-[130px]"
                :title="aboutEnvironment?.url || project.domain"
              >
                <span class="truncate">{{ aboutEnvironment?.url || project.domain }}</span>
                <ExternalLink class="w-3 h-3 flex-shrink-0" />
              </button>
            </div>
            <!-- Maintenance Mode -->
            <div class="px-4 py-2.5 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.maintenance_mode') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="isMaintenanceActive ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'">
                <CheckCircle2 v-if="isMaintenanceActive" class="w-3.5 h-3.5 text-amber-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-emerald-500" />
                <span>{{ isMaintenanceActive ? $t('site_inspector.active') : $t('site_inspector.inactive') }}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Cache Section -->
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
        <div>
          <div class="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Zap class="w-3.5 h-3.5 text-amber-500" />
              <span>{{ $t('site_inspector.cache') }}</span>
            </div>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            <!-- Config -->
            <div class="px-4 py-2.5 flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.config') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="aboutCache?.config ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
                <CheckCircle2 v-if="aboutCache?.config" class="w-3.5 h-3.5 text-emerald-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ aboutCache?.config ? $t('site_inspector.cached') : $t('site_inspector.not_cached') }}</span>
              </span>
            </div>
            <!-- Events -->
            <div class="px-4 py-2.5 flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.events') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="aboutCache?.events ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
                <CheckCircle2 v-if="aboutCache?.events" class="w-3.5 h-3.5 text-emerald-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ aboutCache?.events ? $t('site_inspector.cached') : $t('site_inspector.not_cached') }}</span>
              </span>
            </div>
            <!-- Routes -->
            <div class="px-4 py-2.5 flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.routes') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="aboutCache?.routes ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
                <CheckCircle2 v-if="aboutCache?.routes" class="w-3.5 h-3.5 text-emerald-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ aboutCache?.routes ? $t('site_inspector.cached') : $t('site_inspector.not_cached') }}</span>
              </span>
            </div>
            <!-- Views -->
            <div class="px-4 py-2.5 flex items-center justify-between">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.views') }}</span>
              <span class="flex items-center gap-1 font-semibold text-[11px]" :class="aboutCache?.views ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
                <CheckCircle2 v-if="aboutCache?.views" class="w-3.5 h-3.5 text-emerald-500" />
                <XCircle v-else class="w-3.5 h-3.5 text-slate-400" />
                <span>{{ aboutCache?.views ? $t('site_inspector.compiled') : $t('site_inspector.not_compiled') }}</span>
              </span>
            </div>
          </div>
        </div>

        <!-- Quick 1-click Cache clear button at bottom of card -->
        <div class="p-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            @click="$emit('clear-caches')"
            :disabled="isPurgingCaches"
            class="w-full py-1.5 px-2 text-center rounded-lg bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            :title="$t('site_inspector.clear_app_caches')"
          >
            <Trash2 class="w-3 h-3 text-rose-500" />
            <span>{{ isPurgingCaches ? $t('site_inspector.purging') : $t('site_inspector.clear_all_btn') }}</span>
          </button>
        </div>
      </div>

      <!-- 3. Drivers Section -->
      <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between">
        <div>
          <div class="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
              <Layers class="w-3.5 h-3.5 text-sky-500" />
              <span>{{ $t('site_inspector.drivers') }}</span>
            </div>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
            <!-- Broadcasting -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.broadcasting') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ aboutDrivers?.broadcasting || 'log' }}
              </span>
            </div>
            <!-- Cache -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.cache') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ aboutDrivers?.cache || 'file' }}
              </span>
            </div>
            <!-- Database -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.database') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {{ aboutDrivers?.database || 'mysql' }}
              </span>
            </div>
            <!-- Logs -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.logs') }}</span>
              <div class="flex items-center gap-1.5">
                <span class="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate max-w-[70px]">
                  {{ Array.isArray(aboutDrivers?.logs) ? JSON.stringify(aboutDrivers.logs) : (aboutDrivers?.logs || '["single"]') }}
                </span>
                <button
                  type="button"
                  @click="$emit('go-to-logs')"
                  class="text-[10px] text-rose-600 dark:text-rose-400 hover:underline font-bold"
                >
                  {{ $t('site_inspector.view_logs') }}
                </button>
              </div>
            </div>
            <!-- Mail -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.mail') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ aboutDrivers?.mail || 'smtp' }}
              </span>
            </div>
            <!-- Queue -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.queue') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ aboutDrivers?.queue || 'sync' }}
              </span>
            </div>
            <!-- Session -->
            <div class="px-4 py-2 flex items-center justify-between gap-2">
              <span class="text-slate-500 dark:text-slate-400 font-medium">{{ $t('site_inspector.session') }}</span>
              <span class="font-mono font-semibold text-[11px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {{ aboutDrivers?.session || 'file' }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import {
  Cpu,
  Zap,
  Layers,
  Sliders,
  RefreshCw,
  Activity,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Link2
} from 'lucide-vue-next';

const props = defineProps({
  project: { type: Object, required: true },
  projectAbout: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
  isTogglingMaintenance: { type: Boolean, default: false },
  isPurgingCaches: { type: Boolean, default: false },
  isOptimizing: { type: Boolean, default: false },
  isCreatingStorageLink: { type: Boolean, default: false }
});

defineEmits([
  'refresh',
  'toggle-maintenance',
  'clear-caches',
  'optimize-caches',
  'create-storage-link',
  'open-browser',
  'go-to-logs'
]);

const aboutData = computed(() => props.projectAbout?.data || null);
const aboutEnvironment = computed(() => aboutData.value?.environment || null);
const aboutCache = computed(() => aboutData.value?.cache || null);
const aboutDrivers = computed(() => aboutData.value?.drivers || null);

const isMaintenanceActive = computed(() => {
  return !!aboutEnvironment.value?.maintenance_mode;
});
</script>
