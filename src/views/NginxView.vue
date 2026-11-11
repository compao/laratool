<template>
  <div class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Server Status Card -->
    <div class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl p-6 shadow-sm">
      <div class="flex items-start justify-between flex-wrap gap-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
            <Server class="w-6 h-6" />
          </div>
          <div>
            <div class="flex items-center gap-2.5">
              <span
                class="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                :class="isRunning ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="isRunning ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
                {{ isRunning ? (isSsl ? $t('nginx.online_ssl') : $t('nginx.online_http')) : $t('common.stopped') }}
              </span>
              <span class="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {{ isRunning ? $t('nginx.reverse_proxy_active') : $t('nginx.service_inactive') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <template v-if="isInstalled">
            <button
              v-if="!isRunning"
              @click="$emit('start-nginx')"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
            >
              <Play class="w-3.5 h-3.5 fill-current" />
              {{ $t('nginx.start_server') }}
            </button>
            <button
              v-else
              @click="$emit('stop-nginx')"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
            >
              <Square class="w-3.5 h-3.5 fill-current" />
              {{ $t('nginx.stop_server') }}
            </button>

            <button
              v-if="isRunning"
              @click="$emit('reload-nginx')"
              class="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
              :title="$t('nginx.reload_tooltip')"
            >
              <RotateCw class="w-3.5 h-3.5" />
              {{ $t('nginx.reload_server') }}
            </button>
          </template>

          <template v-else>
            <button
              @click="$emit('install-nginx')"
              class="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/20 transition"
            >
              <Download class="w-4 h-4" />
              {{ $t('nginx.install_server') }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- Nginx Virtual Hosts Card (Clean, informational) -->
    <div v-if="isInstalled" class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4 shadow-sm">
      <div class="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80 flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-500 dark:text-sky-400 flex items-center justify-center">
            <FileCode2 class="w-5 h-5" />
          </div>
          <div>
            <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('nginx.virtual_hosts') }}</h4>
            <p class="text-xs text-slate-500 dark:text-slate-400">{{ $t('nginx.virtual_hosts_desc') }}</p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <!-- Open nginx.conf in editor -->
          <button
            @click="openNginxConfig"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold shadow transition"
          >
            <FileCode2 class="w-3.5 h-3.5" />
            <span>{{ $t('nginx.open_main_conf') }}</span>
          </button>

          <!-- Open conf.d in Explorer -->
          <button
            @click="openConfD"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
          >
            <Folder class="w-3.5 h-3.5" />
            <span>{{ $t('nginx.open_conf_dir') }}</span>
          </button>

          <!-- Open Nginx directory in Explorer -->
          <button
            @click="openNginxFolder"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium border border-slate-300 dark:border-slate-700 transition"
            :title="$t('nginx.open_folder')"
          >
            <Folder class="w-3.5 h-3.5" />
            <span>{{ $t('nginx.open_folder') }}</span>
          </button>
        </div>
      </div>

      <!-- Virtual Hosts Grid -->
      <div>
        <div class="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2.5">
          <span>{{ $t('nginx.virtual_hosts') }} (<code>conf.d/*.conf</code>) :</span>
          <span class="font-mono text-slate-700 dark:text-slate-300">{{ siteConfigs.length }} {{ $t('common.actives') }}</span>
        </div>

        <div v-if="siteConfigs.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
          <div
            v-for="site in siteConfigs"
            :key="site.siteName"
            @click="openSiteConfig(site.siteName)"
            class="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 rounded-lg p-2.5 flex items-center justify-between shadow-sm cursor-pointer group transition"
            :title="$t('common.edit')"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="w-2 h-2 rounded-full bg-sky-500 dark:bg-sky-400 flex-shrink-0"></span>
              <span class="font-mono text-xs text-slate-800 dark:text-slate-200 group-hover:text-sky-500 dark:group-hover:text-sky-300 truncate font-medium">
                {{ site.siteName }}.conf
              </span>
            </div>
            <ExternalLink class="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-500 flex-shrink-0 transition ml-2" />
          </div>
        </div>

        <div v-else class="text-xs text-slate-500 italic py-2">
          {{ $t('projects.no_projects_found') }}
        </div>
      </div>
    </div>

    <!-- Nginx Logs Viewer -->
    <div class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div class="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/40">
        <div class="flex items-center gap-2">
          <Terminal class="w-4 h-4 text-slate-500 dark:text-slate-400" />
          <h4 class="text-xs font-semibold text-slate-800 dark:text-slate-200">{{ $t('nginx.logs') }}</h4>
          <span v-if="!clearedLogs && logs.length > 0" class="text-[10px] text-slate-400 dark:text-slate-500 font-mono">({{ logs.length }})</span>
        </div>
        <div class="flex items-center gap-2">
          <button
            v-if="!clearedLogs && logs.length > 0"
            @click="clearedLogs = true"
            class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition px-2 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-800"
            :title="$t('common.clear')"
          >
            {{ $t('common.clear') }}
          </button>
          <button
            @click="clearedLogs = false; $emit('fetch-logs')"
            class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition flex items-center gap-1"
          >
            <RotateCw class="w-3 h-3" />
            {{ $t('common.refresh') }}
          </button>
        </div>
      </div>

      <div class="p-4 bg-slate-900 dark:bg-slate-950 font-mono text-[11px] h-72 overflow-y-auto space-y-1 select-text">
        <div v-if="clearedLogs || logs.length === 0" class="text-slate-500 italic">
          {{ $t('service_detail.no_logs') }}
        </div>
        <div
          v-else
          v-for="(log, idx) in logs"
          :key="idx"
          class="whitespace-pre-wrap leading-relaxed"
          :class="getLogClass(log)"
        >
          {{ log }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { 
  Server, 
  Play, 
  Square, 
  RotateCw, 
  Download, 
  Terminal,
  FileCode2,
  Folder,
  ExternalLink
} from 'lucide-vue-next';

defineProps({
  isInstalled: Boolean,
  isRunning: Boolean,
  isSsl: { type: Boolean, default: false },
  logs: { type: Array, default: () => [] }
});

defineEmits([
  'install-nginx',
  'start-nginx',
  'stop-nginx',
  'reload-nginx',
  'fetch-logs'
]);

const clearedLogs = ref(false);

function getLogClass(line) {
  if (typeof line !== 'string') return 'text-slate-300';
  if (line.includes('[emerg]') || line.includes('[error]')) return 'text-rose-400 font-semibold';
  if (line.includes('[warn]')) return 'text-amber-300';
  if (line.includes('[notice]')) return 'text-slate-300';
  return 'text-slate-400';
}

const api = window.laratool;
const siteConfigs = ref([]);

async function loadSiteConfigs() {
  if (api?.nginx?.listSiteConfigs) {
    try {
      siteConfigs.value = await api.nginx.listSiteConfigs();
    } catch (e) {
      console.error(e);
    }
  }
}

function openNginxConfig() {
  if (api?.nginx?.openConfig) api.nginx.openConfig();
}

function openConfD() {
  if (api?.nginx?.openConfD) api.nginx.openConfD();
}

function openSiteConfig(name) {
  if (api?.nginx?.openSiteConfig) api.nginx.openSiteConfig(name);
}

function openNginxFolder() {
  if (api?.nginx?.openFolder) api.nginx.openFolder();
}

onMounted(() => {
  loadSiteConfigs();
});
</script>
