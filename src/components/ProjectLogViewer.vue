<template>
  <div class="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 shadow-sm">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
          <ScrollText class="w-5 h-5" />
        </div>
        <div>
          <div class="flex items-center gap-2.5 flex-wrap">
            <h3 class="text-base font-bold text-slate-900 dark:text-white">{{ $t('log_viewer.title') }}</h3>
            <span
              v-if="logsData?.exists && logsData?.selectedFile"
              class="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 flex items-center gap-1.5"
            >
              <FileText class="w-3 h-3 text-rose-500 dark:text-rose-400" />
              storage/logs/{{ logsData.selectedFile }}
            </span>
            <span
              v-if="logsData?.fileSizeFormatted"
              class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400"
            >
              {{ logsData.fileSizeFormatted }}
            </span>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {{ $t('log_viewer.subtitle') }}
          </p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Log File Selector (if multiple exist) -->
        <div v-if="logsData?.files && logsData.files.length > 1" class="relative">
          <select
            :value="selectedFileName"
            @change="onFileChange($event.target.value)"
            class="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-rose-500 font-mono cursor-pointer"
          >
            <option v-for="f in logsData.files" :key="f.name" :value="f.name">
              {{ f.name }} ({{ f.sizeFormatted }})
            </option>
          </select>
        </div>

        <!-- Auto-refresh Toggle -->
        <button
          @click="toggleAutoRefresh"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition"
          :class="autoRefresh
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-900 dark:hover:text-slate-200'"
          :title="$t('log_viewer.auto_refresh_tooltip')"
        >
          <span
            class="w-2 h-2 rounded-full"
            :class="autoRefresh ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"
          ></span>
          <span>{{ $t('log_viewer.auto_live') }}</span>
        </button>

        <!-- Refresh Button -->
        <button
          @click="fetchLogs(true)"
          :disabled="isLoading"
          class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
          :title="$t('log_viewer.refresh_tooltip')"
        >
          <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isLoading }" />
        </button>

        <!-- Open in Editor Button -->
        <button
          @click="openInEditor"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-xs font-medium transition"
          :title="$t('log_viewer.open_editor_tooltip')"
        >
          <Code class="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
          <span class="hidden sm:inline">{{ $t('log_viewer.editor_btn') }}</span>
        </button>

        <!-- Open Folder in Explorer -->
        <button
          @click="openFolder"
          class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition"
          :title="$t('log_viewer.open_folder_tooltip')"
        >
          <Folder class="w-3.5 h-3.5" />
        </button>

        <!-- Clear Logs Button -->
        <button
          @click="confirmClearLogs"
          :disabled="isClearing || !logsData?.entries || logsData.entries.length === 0"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          :class="pendingClearConfirm
            ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-600 shadow-sm'
            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20'"
          :title="$t('log_viewer.clear_tooltip')"
        >
          <Trash2 class="w-3.5 h-3.5" />
          <span>{{ pendingClearConfirm ? $t('notifications.confirm_clear_logs') : $t('log_viewer.clear_btn') }}</span>
        </button>
      </div>
    </div>

    <!-- Filter Bar & Search -->
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/80">
      <!-- Filter Chips -->
      <div class="flex items-center gap-1.5 flex-wrap">
        <button
          @click="currentLevelFilter = 'ALL'"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          :class="currentLevelFilter === 'ALL'
            ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-white border border-slate-900 dark:border-slate-700'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
        >
          <span>{{ $t('log_viewer.filter_all') }}</span>
          <span class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
            {{ logsData?.stats?.total || 0 }}
          </span>
        </button>

        <button
          @click="currentLevelFilter = 'ERROR'"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          :class="currentLevelFilter === 'ERROR'
            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/40'
            : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400"></span>
          <span>{{ $t('log_viewer.filter_errors') }}</span>
          <span
            v-if="logsData?.stats?.errors > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/20 text-rose-600 dark:text-rose-300 font-bold"
          >
            {{ logsData.stats.errors }}
          </span>
        </button>

        <button
          @click="currentLevelFilter = 'WARNING'"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          :class="currentLevelFilter === 'WARNING'
            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40'
            : 'text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
          <span>{{ $t('log_viewer.filter_warnings') }}</span>
          <span
            v-if="logsData?.stats?.warnings > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-300 font-bold"
          >
            {{ logsData.stats.warnings }}
          </span>
        </button>

        <button
          @click="currentLevelFilter = 'INFO'"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          :class="currentLevelFilter === 'INFO'
            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/40'
            : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400"></span>
          <span>{{ $t('log_viewer.filter_info') }}</span>
          <span
            v-if="logsData?.stats?.infos > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-500/20 text-sky-600 dark:text-sky-300 font-bold"
          >
            {{ logsData.stats.infos }}
          </span>
        </button>

        <button
          @click="currentLevelFilter = 'DEBUG'"
          class="px-2.5 py-1 rounded-lg text-xs font-medium transition flex items-center gap-1.5"
          :class="currentLevelFilter === 'DEBUG'
            ? 'bg-slate-200 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500"></span>
          <span>{{ $t('log_viewer.filter_debug') }}</span>
          <span
            v-if="logsData?.stats?.debugs > 0"
            class="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold"
          >
            {{ logsData.stats.debugs }}
          </span>
        </button>
      </div>

      <!-- Search Input & Expand All Toggle -->
      <div class="flex items-center gap-2">
        <div class="relative flex-1 sm:w-64">
          <Search class="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="$t('log_viewer.search_placeholder')"
            class="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-rose-500 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition font-mono"
          />
        </div>

        <button
          v-if="filteredEntries.some(e => e.hasStack)"
          @click="toggleAllStacks"
          class="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800 transition flex items-center gap-1 flex-shrink-0"
          :title="allStacksExpanded ? $t('log_viewer.collapse_all') : $t('log_viewer.expand_all')"
        >
          <ChevronUp v-if="allStacksExpanded" class="w-3 h-3 text-rose-500 dark:text-rose-400" />
          <ChevronDown v-else class="w-3 h-3" />
          <span>{{ allStacksExpanded ? $t('log_viewer.collapse_all') : $t('log_viewer.expand_all') }}</span>
        </button>
      </div>
    </div>

    <!-- Logs Container -->
    <div class="space-y-3">
      <!-- Loading Skeleton (First Load) -->
      <div v-if="isLoading && !logsData" class="space-y-3 py-4">
        <div v-for="i in 3" :key="i" class="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 animate-pulse space-y-2">
          <div class="flex items-center gap-3">
            <div class="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="w-32 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div class="w-20 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
          <div class="w-3/4 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
        </div>
      </div>

      <!-- Empty State: Directory or file does not exist -->
      <div
        v-else-if="!logsData?.exists"
        class="p-8 text-center bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3"
      >
        <div class="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
          <FileText class="w-5 h-5" />
        </div>
        <div>
          <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('log_viewer.no_file_title') }}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {{ $t('log_viewer.no_file_desc') }}
          </p>
        </div>
        <button
          @click="fetchLogs(true)"
          class="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white text-xs font-semibold transition"
        >
          {{ $t('log_viewer.check_again') }}
        </button>
      </div>

      <!-- Empty State: Log file is empty -->
      <div
        v-else-if="logsData?.entries && logsData.entries.length === 0"
        class="p-8 text-center bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-2.5"
      >
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
          <Check class="w-5 h-5" />
        </div>
        <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('log_viewer.clean_title') }}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          {{ $t('log_viewer.clean_desc', { file: logsData.selectedFile }) }}
        </p>
      </div>

      <!-- Empty State: Filter produced 0 matches -->
      <div
        v-else-if="filteredEntries.length === 0"
        class="p-8 text-center bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800/80 rounded-xl space-y-3"
      >
        <div class="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto">
          <Search class="w-5 h-5" />
        </div>
        <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('log_viewer.no_match_title') }}</h4>
        <p class="text-xs text-slate-500 dark:text-slate-400">
          {{ $t('log_viewer.no_match_desc') }}
        </p>
        <button
          @click="resetFilters"
          class="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
        >
          {{ $t('log_viewer.reset_filters') }}
        </button>
      </div>

      <!-- Log Entries List -->
      <div v-else class="space-y-3">
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 transition space-y-3 shadow-xs"
        >
          <!-- Entry Header Row -->
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Level Badge -->
              <span
                class="px-2 py-0.5 rounded text-[11px] font-mono font-bold border flex items-center gap-1.5"
                :class="getLevelBadgeClass(entry.level)"
              >
                <AlertCircle v-if="['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(entry.level)" class="w-3 h-3" />
                <AlertTriangle v-else-if="entry.level === 'WARNING'" class="w-3 h-3" />
                <Info v-else-if="['INFO', 'NOTICE'].includes(entry.level)" class="w-3 h-3" />
                <Bug v-else class="w-3 h-3" />
                {{ entry.level }}
              </span>

              <!-- Exception Class Badge (if detected) -->
              <span
                v-if="entry.exceptionClass"
                class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-mono font-semibold"
                :title="entry.exceptionClass"
              >
                {{ entry.exceptionClass }}
              </span>

              <!-- Environment Tag -->
              <span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                {{ entry.environment }}
              </span>

              <!-- Timestamp -->
              <span class="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                {{ entry.timestamp }}
              </span>
            </div>

            <!-- Quick Action Buttons -->
            <div class="flex items-center gap-1.5">
              <button
                @click="copyEntry(entry)"
                class="px-2 py-1 rounded bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition flex items-center gap-1"
                :title="copiedId === entry.id ? $t('common.copied') : $t('log_viewer.copy_full')"
              >
                <Check v-if="copiedId === entry.id" class="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                <Copy v-else class="w-3 h-3 text-slate-400" />
                <span>{{ copiedId === entry.id ? $t('common.copied') : $t('common.copy') }}</span>
              </button>
            </div>
          </div>

          <!-- Message Text -->
          <div class="text-xs font-mono text-slate-800 dark:text-slate-200 leading-relaxed break-words bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800/60 select-text">
            {{ entry.message }}
          </div>

          <!-- Collapsible Stack Trace -->
          <div v-if="entry.hasStack" class="space-y-2">
            <button
              @click="toggleStack(entry.id)"
              class="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
            >
              <ChevronDown v-if="isStackExpanded(entry.id)" class="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              <ChevronRight v-else class="w-3.5 h-3.5" />
              <span>{{ isStackExpanded(entry.id) ? $t('log_viewer.hide_stack') : $t('log_viewer.show_stack') }}</span>
            </button>

            <!-- Stack Trace Content -->
            <div
              v-if="isStackExpanded(entry.id)"
              class="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] leading-relaxed max-h-80 overflow-y-auto select-text text-slate-300"
            >
              <div
                v-for="(line, idx) in formatStackLines(entry.stackTrace)"
                :key="idx"
                class="py-0.5 hover:bg-slate-900/60 px-1 rounded transition"
                :class="line.isAppCode ? 'text-white font-semibold bg-rose-500/5' : 'text-slate-500'"
              >
                <span class="select-none text-slate-600 mr-2">{{ String(idx + 1).padStart(2, '0') }}</span>
                <span>{{ line.text }}</span>
              </div>
            </div>
          </div>

          <!-- Collapsible JSON Context (if present) -->
          <div v-if="entry.context" class="space-y-2">
            <button
              @click="toggleContext(entry.id)"
              class="flex items-center gap-1.5 text-[11px] font-mono font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
            >
              <ChevronDown v-if="isContextExpanded(entry.id)" class="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <ChevronRight v-else class="w-3.5 h-3.5" />
              <span>{{ isContextExpanded(entry.id) ? $t('log_viewer.hide_context') : $t('log_viewer.show_context') }}</span>
            </button>

            <pre
              v-if="isContextExpanded(entry.id)"
              class="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto select-text"
            >{{ formatJson(entry.context) }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  ScrollText,
  FileText,
  RefreshCw,
  Trash2,
  Search,
  Copy,
  Check,
  Code,
  Folder,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertCircle,
  AlertTriangle,
  Info,
  Bug
} from 'lucide-vue-next';

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['show-toast']);

const api = window.laratool;

const logsData = ref(null);
const isLoading = ref(false);
const isClearing = ref(false);
const pendingClearConfirm = ref(false);
let clearConfirmTimer = null;
const autoRefresh = ref(false);
const selectedFileName = ref(null);
const currentLevelFilter = ref('ALL');
const searchQuery = ref('');
const expandedStacks = ref(new Set());
const expandedContexts = ref(new Set());
const copiedId = ref(null);

let pollTimer = null;

// Filtered entries computed
const filteredEntries = computed(() => {
  if (!logsData.value?.entries) return [];

  return logsData.value.entries.filter(entry => {
    // Level filter
    if (currentLevelFilter.value === 'ERROR') {
      if (!['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(entry.level)) return false;
    } else if (currentLevelFilter.value === 'WARNING') {
      if (entry.level !== 'WARNING') return false;
    } else if (currentLevelFilter.value === 'INFO') {
      if (!['INFO', 'NOTICE'].includes(entry.level)) return false;
    } else if (currentLevelFilter.value === 'DEBUG') {
      if (entry.level !== 'DEBUG') return false;
    }

    // Search query filter
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const matchMessage = entry.message.toLowerCase().includes(q);
      const matchLevel = entry.level.toLowerCase().includes(q);
      const matchEnv = entry.environment.toLowerCase().includes(q);
      const matchClass = entry.exceptionClass?.toLowerCase().includes(q);
      const matchStack = entry.stackTrace?.toLowerCase().includes(q);
      const matchContext = entry.context?.toLowerCase().includes(q);

      return matchMessage || matchLevel || matchEnv || matchClass || matchStack || matchContext;
    }

    return true;
  });
});

const allStacksExpanded = computed(() => {
  const stackEntries = filteredEntries.value.filter(e => e.hasStack);
  if (stackEntries.length === 0) return false;
  return stackEntries.every(e => expandedStacks.value.has(e.id));
});

function getLevelBadgeClass(level) {
  if (['ERROR', 'CRITICAL', 'ALERT', 'EMERGENCY'].includes(level)) {
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30';
  }
  if (level === 'WARNING') {
    return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
  }
  if (['INFO', 'NOTICE'].includes(level)) {
    return 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30';
  }
  return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
}

async function fetchLogs(isManual = false) {
  if (!props.project?.path) return;
  if (isManual) isLoading.value = true;

  try {
    const res = await api.projects.getLogs(props.project.path, selectedFileName.value, 150);
    logsData.value = res;
    if (res.selectedFile) {
      selectedFileName.value = res.selectedFile;
    }
  } catch (err) {
    if (isManual) {
      emit('show-toast', `Erreur lors de la lecture des logs: ${err.message}`, 'error');
    }
  } finally {
    if (isManual) isLoading.value = false;
  }
}

function onFileChange(fileName) {
  selectedFileName.value = fileName;
  fetchLogs(true);
}

function toggleAutoRefresh() {
  autoRefresh.value = !autoRefresh.value;
  if (autoRefresh.value) {
    startPolling();
  } else {
    stopPolling();
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(() => {
    fetchLogs(false);
  }, 3000);
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function confirmClearLogs() {
  if (!pendingClearConfirm.value) {
    pendingClearConfirm.value = true;
    if (clearConfirmTimer) clearTimeout(clearConfirmTimer);
    clearConfirmTimer = setTimeout(() => {
      pendingClearConfirm.value = false;
    }, 3500);
    return;
  }

  pendingClearConfirm.value = false;
  if (clearConfirmTimer) {
    clearTimeout(clearConfirmTimer);
    clearConfirmTimer = null;
  }

  isClearing.value = true;
  try {
    const targetFile = logsData.value?.selectedFile || 'laravel.log';
    await api.projects.clearLog(props.project.path, targetFile);
    emit('show-toast', `Le fichier ${targetFile} a été vidé avec succès`, 'success');
    await fetchLogs(true);
  } catch (err) {
    emit('show-toast', `Erreur lors du vidage des logs: ${err.message}`, 'error');
  } finally {
    isClearing.value = false;
  }
}

async function openInEditor() {
  try {
    const targetFile = logsData.value?.selectedFile || 'laravel.log';
    await api.projects.openLogFile(props.project.path, targetFile);
  } catch (err) {
    emit('show-toast', `Erreur d'ouverture dans l'éditeur: ${err.message}`, 'error');
  }
}

async function openFolder() {
  try {
    await api.projects.openLogsFolder(props.project.path);
  } catch (err) {
    emit('show-toast', `Erreur d'ouverture du dossier: ${err.message}`, 'error');
  }
}

function isStackExpanded(id) {
  return expandedStacks.value.has(id);
}

function toggleStack(id) {
  if (expandedStacks.value.has(id)) {
    expandedStacks.value.delete(id);
  } else {
    expandedStacks.value.add(id);
  }
}

function toggleAllStacks() {
  const stackEntries = filteredEntries.value.filter(e => e.hasStack);
  if (allStacksExpanded.value) {
    stackEntries.forEach(e => expandedStacks.value.delete(e.id));
  } else {
    stackEntries.forEach(e => expandedStacks.value.add(e.id));
  }
}

function isContextExpanded(id) {
  return expandedContexts.value.has(id);
}

function toggleContext(id) {
  if (expandedContexts.value.has(id)) {
    expandedContexts.value.delete(id);
  } else {
    expandedContexts.value.add(id);
  }
}

function formatStackLines(stackTrace) {
  if (!stackTrace) return [];
  const lines = stackTrace.split(/\r?\n/);
  return lines.map(line => {
    // Detect application code vs vendor code
    const isVendor = line.includes('/vendor/') || line.includes('\\vendor\\');
    const isAppCode = !isVendor && (line.includes('/app/') || line.includes('\\app\\') || line.includes('/routes/') || line.includes('\\routes\\'));
    return {
      text: line,
      isVendor,
      isAppCode
    };
  });
}

function formatJson(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return jsonString;
  }
}

function resetFilters() {
  currentLevelFilter.value = 'ALL';
  searchQuery.value = '';
}

async function copyEntry(entry) {
  const content = `[${entry.timestamp}] ${entry.environment}.${entry.level}: ${entry.message}${entry.stackTrace ? '\n\n' + entry.stackTrace : ''}`;
  try {
    await navigator.clipboard.writeText(content);
    copiedId.value = entry.id;
    setTimeout(() => {
      if (copiedId.value === entry.id) {
        copiedId.value = null;
      }
    }, 2000);
  } catch {}
}

watch(() => props.project?.path, () => {
  selectedFileName.value = null;
  expandedStacks.value.clear();
  expandedContexts.value.clear();
  fetchLogs(true);
});

onMounted(() => {
  fetchLogs(true);
});

onUnmounted(() => {
  stopPolling();
});
</script>
