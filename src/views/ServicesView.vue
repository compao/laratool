<template>
  <ServiceDetailView
    v-if="selectedServiceId"
    :service-id="selectedServiceId"
    @back="selectedServiceId = null"
    @start-service="$emit('start-service', $event)"
    @stop-service="$emit('stop-service', $event)"
    @restart-service="$emit('restart-service', $event)"
    @show-toast="$emit('show-toast', $event)"
  />

  <div v-else class="p-8 space-y-6 max-w-7xl mx-auto w-full">
    <!-- Top Toolbar: Counters & Layout Switcher -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <div class="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] px-3.5 py-2 rounded-xl shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{{ activeServicesCount }}</span>
        <span>{{ $t('services.active_count', { count: activeServicesCount }).replace(/^\d+\s*/, '') }}</span>
        <span class="text-slate-400">·</span>
        <span class="font-mono font-bold">{{ installedServicesCount }}</span>
        <span class="text-slate-400">/</span>
        <span class="font-mono">{{ services.length }}</span>
        <span>{{ $t('common.installed') }}</span>
      </div>

      <!-- View mode switcher: Grid vs List -->
      <SegmentedToggle
        :model-value="layoutMode"
        :options="layoutOptions"
        @update:model-value="setLayout"
      />
    </div>

    <!-- Category Filter Tabs -->
    <div v-if="services.length > 0" class="flex items-center gap-1.5 flex-wrap pt-0.5">
      <button
        v-for="cat in mainFilterCategories"
        :key="cat.id"
        @click="activeMainCategory = cat.id"
        class="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150"
        :class="activeMainCategory === cat.id 
          ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-sm font-bold' 
          : 'bg-white/80 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.06]'"
      >
        {{ cat.label }}
      </button>
    </div>

    <!-- 1. Services Grid Mode -->
    <div v-if="filteredServices.length > 0 && layoutMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="service in filteredServices"
        :key="service.id"
        class="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-sm card-hover"
      >
        <div>
          <!-- Card Header (clickable to open details) -->
          <div
            @click="selectedServiceId = service.id"
            class="flex items-start justify-between cursor-pointer group"
            :title="$t('services.configure_service')"
          >
            <div class="flex items-center gap-3">
              <div
                class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border group-hover:border-rose-500/50 transition shadow-sm"
                :class="serviceColors[service.id] || 'bg-slate-800 border-slate-700 text-slate-200'"
              >
                <component :is="serviceIcons[service.id] || Database" class="w-5 h-5" />
              </div>
              <div>
                <div class="flex items-center gap-1.5">
                  <h4 class="font-semibold text-slate-900 dark:text-white text-sm leading-tight group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">{{ service.name }}</h4>
                  <ChevronRight class="w-3.5 h-3.5 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                </div>
                <div class="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                  <span>{{ $t('common.port') }} : <code class="font-mono text-slate-700 dark:text-slate-300 font-semibold">{{ service.port }}</code></span>
                  <span v-if="service.webPort">• Web UI : <code class="font-mono text-slate-700 dark:text-slate-300">{{ service.webPort }}</code></span>
                </div>

                <!-- Version Badge for multi-version services (Display Only - No selection in list) -->
                <div v-if="service.hasVersions" class="flex items-center gap-1.5 mt-2">
                  <span class="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{{ $t('common.version') }} :</span>
                  <span class="text-[10px] font-semibold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded font-mono">
                    {{ service.activeVersionName || service.activeVersion }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Status Pill -->
            <span
              v-if="service.installed"
              class="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
              :class="service.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="service.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
              {{ service.running ? $t('common.active') : $t('common.stopped') }}
            </span>
            <span v-else class="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-1.5 py-0.5 rounded">
              {{ $t('common.not_installed') }}
            </span>
          </div>

          <!-- Description / Env preview -->
          <div class="mt-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 font-mono text-[10px] text-slate-600 dark:text-slate-400 overflow-x-auto">
            <pre class="leading-relaxed">{{ service.envSnippet }}</pre>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2">
          <template v-if="service.installed">
            <div class="flex items-center gap-1.5">
              <!-- Start / Stop -->
              <button
                v-if="!service.running"
                @click="$emit('start-service', service.id)"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
              >
                <Play class="w-3 h-3 fill-current" />
                {{ $t('common.start') }}
              </button>
              <button
                v-else
                @click="$emit('stop-service', service.id)"
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition"
              >
                <Square class="w-3 h-3 fill-current" />
                {{ $t('common.stop') }}
              </button>

              <!-- Restart -->
              <button
                v-if="service.running"
                @click="$emit('restart-service', service.id)"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
                :title="$t('common.restart')"
              >
                <RotateCw class="w-3 h-3" />
              </button>

              <!-- Web UI (Mailpit / SeaweedFS / CouchDB / Meilisearch) -->
              <button
                v-if="service.webPort || service.id === 'meilisearch' || service.id === 'couchdb'"
                @click="service.running && $emit('open-web', service.id)"
                class="p-1.5 rounded-lg transition"
                :class="service.running ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'"
                :title="service.running ? $t('services.open_web_ui') : $t('services.open_web_ui')"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- Copy .env -->
            <div class="flex items-center gap-1.5">
              <button
                @click="copyEnv(service)"
                class="text-[11px] text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition font-medium flex items-center gap-1"
              >
                <Copy class="w-3 h-3" />
                {{ copiedId === service.id ? $t('common.copied') : $t('services.env_snippet') }}
              </button>
            </div>
          </template>

          <template v-else>
            <button
              @click="$emit('install-service', { id: service.id, version: service.activeVersion })"
              class="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition"
            >
              <Download class="w-3.5 h-3.5" />
              {{ $t('common.install') }} {{ service.hasVersions ? (service.activeVersionName || service.name) : service.name.split(' ')[0] }}
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 2. Services List View Mode -->
    <div v-else-if="filteredServices.length > 0 && layoutMode === 'list'" class="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden shadow-sm">
      <!-- Table Header -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
        <div class="col-span-5">{{ $t('services.col_service') }}</div>
        <div class="col-span-2">{{ $t('services.col_status') }}</div>
        <div class="col-span-5 text-right pr-2">{{ $t('services.col_controls') }}</div>
      </div>

      <div class="divide-y divide-slate-200 dark:divide-slate-800/60">
        <div
          v-for="service in filteredServices"
          :key="service.id"
          class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition grid grid-cols-1 md:grid-cols-12 gap-4 items-center group select-none"
        >
          <!-- Identity (col-span-5) -->
          <div
            @click="selectedServiceId = service.id"
            class="col-span-5 flex items-center gap-3 min-w-0 cursor-pointer group/item"
            :title="$t('services.configure_service')"
          >
            <div
              class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border flex-shrink-0 transition-transform group-hover/item:scale-105"
              :class="serviceColors[service.id] || 'bg-slate-800 border-slate-700 text-slate-200'"
            >
              <component :is="serviceIcons[service.id] || Database" class="w-4 h-4" />
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2">
                <h4 class="font-semibold text-slate-900 dark:text-white text-sm truncate group-hover/item:text-rose-500 transition-colors">{{ service.name }}</h4>
                <span
                  v-if="service.hasVersions"
                  class="text-[9px] font-semibold text-rose-600 dark:text-rose-300 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono whitespace-nowrap"
                >
                  {{ service.activeVersionName || service.activeVersion }}
                </span>
              </div>
              <div class="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                <span>{{ $t('common.port') }} : {{ service.port }}</span>
                <span v-if="service.webPort">• Web : {{ service.webPort }}</span>
              </div>
            </div>
          </div>

          <!-- Status Pill (col-span-2) -->
          <div class="col-span-2 flex items-center">
            <span
              v-if="service.installed"
              class="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full"
              :class="service.running ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
            >
              <span class="w-1.5 h-1.5 rounded-full" :class="service.running ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-slate-400 dark:bg-slate-600'"></span>
              {{ service.running ? $t('common.active') : $t('common.stopped') }}
            </span>
            <span v-else class="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded">
              {{ $t('common.not_installed') }}
            </span>
          </div>

          <!-- Actions (col-span-5) -->
          <div class="col-span-5 flex items-center justify-end gap-1.5 flex-wrap">
            <template v-if="service.installed">
              <!-- Start / Stop -->
              <button
                v-if="!service.running"
                @click="$emit('start-service', service.id)"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium border border-emerald-500/20 transition"
              >
                <Play class="w-3 h-3 fill-current" />
                <span>{{ $t('common.start') }}</span>
              </button>
              <button
                v-else
                @click="$emit('stop-service', service.id)"
                class="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium border border-rose-500/20 transition"
              >
                <Square class="w-3 h-3 fill-current" />
                <span>{{ $t('common.stop') }}</span>
              </button>

              <!-- Restart -->
              <button
                v-if="service.running"
                @click="$emit('restart-service', service.id)"
                class="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 transition"
                :title="$t('common.restart')"
              >
                <RotateCw class="w-3.5 h-3.5" />
              </button>

              <!-- Web UI (Mailpit / SeaweedFS / CouchDB / Meilisearch) -->
              <button
                v-if="service.webPort || service.id === 'meilisearch' || service.id === 'couchdb'"
                @click="service.running && $emit('open-web', service.id)"
                class="p-1.5 rounded-lg transition"
                :class="service.running ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-700 cursor-pointer' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-50'"
                :title="service.running ? $t('services.open_web_ui') : $t('services.open_web_ui')"
              >
                <ExternalLink class="w-3.5 h-3.5" />
              </button>

              <!-- Copy .env -->
              <button
                @click="copyEnv(service)"
                class="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 transition text-[11px] font-medium flex items-center gap-1"
                :title="$t('services.env_snippet')"
              >
                <Copy class="w-3 h-3" />
                <span>{{ copiedId === service.id ? $t('common.copied') : '.env' }}</span>
              </button>

              <!-- Settings / Detail -->
              <button
                @click="selectedServiceId = service.id"
                class="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-300 dark:border-slate-700 transition"
                :title="$t('services.configure_service')"
              >
                <Settings class="w-3.5 h-3.5" />
              </button>
            </template>

            <button
              v-else
              @click="$emit('install-service', { id: service.id, version: service.activeVersion })"
              class="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow transition flex items-center gap-1.5"
            >
              <Download class="w-3.5 h-3.5" />
              <span>{{ $t('common.install') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state when category filter has 0 items but services exist -->
    <div v-else-if="services.length > 0 && filteredServices.length === 0" class="text-center py-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <Boxes class="w-6 h-6" />
      </div>
      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('services.no_services') }}</h4>
      <p class="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
        {{ $t('services.no_services_desc') }}
      </p>
      <button
        @click="activeMainCategory = 'all'"
        class="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition"
      >
        {{ $t('services.show_all_services') }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3 shadow-sm">
      <div class="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <Database class="w-6 h-6" />
      </div>
      <h4 class="text-sm font-semibold text-slate-900 dark:text-white">{{ $t('services.no_services') }}</h4>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { 
  Database, 
  Server, 
  Layers, 
  Mail, 
  Search, 
  Cloud,
  Radio,
  Zap,
  Play, 
  Square, 
  Download, 
  ExternalLink, 
  Copy, 
  Boxes, 
  RotateCw,
  LayoutGrid,
  List,
  Settings,
  ChevronRight
} from 'lucide-vue-next';
import ServiceDetailView from './ServiceDetailView.vue';
import { SegmentedToggle } from '../components/ui';
import { useI18n } from '../i18n';

const { t } = useI18n();

const layoutOptions = computed(() => [
  { value: 'grid', label: t('services.grid_view'), icon: LayoutGrid },
  { value: 'list', label: t('services.list_view'), icon: List }
]);

const props = defineProps({
  services: { type: Array, default: () => [] }
});

const selectedServiceId = ref(null);
const layoutMode = ref('grid');

function setLayout(mode) {
  layoutMode.value = mode;
  localStorage.setItem('laratool_services_layout', mode);
}

onMounted(() => {
  const saved = localStorage.getItem('laratool_services_layout');
  if (saved === 'grid' || saved === 'list') {
    layoutMode.value = saved;
  }
});

defineEmits([
  'start-service',
  'stop-service',
  'restart-service',
  'install-service',
  'open-web'
]);

const copiedId = ref(null);
const activeMainCategory = ref('all');

function matchCategory(serviceCat, targetCat) {
  if (targetCat === 'all') return true;
  if (targetCat === 'database') {
    return serviceCat === 'database' || serviceCat === 'sql' || serviceCat === 'nosql';
  }
  if (targetCat === 'cache') {
    return serviceCat === 'cache';
  }
  if (targetCat === 'search') {
    return serviceCat === 'search';
  }
  if (targetCat === 'realtime') {
    return serviceCat === 'realtime';
  }
  if (targetCat === 'storage') {
    return serviceCat === 'storage';
  }
  if (targetCat === 'tools') {
    return serviceCat === 'tools' || serviceCat === 'email';
  }
  return serviceCat === targetCat;
}

const mainFilterCategories = computed(() => {
  const cats = [{ id: 'all', label: t('services.filter_all') }];
  if (props.services.some(s => matchCategory(s.category, 'database'))) {
    cats.push({ id: 'database', label: t('services.filter_database') });
  }
  if (props.services.some(s => matchCategory(s.category, 'cache'))) {
    cats.push({ id: 'cache', label: t('services.filter_cache') });
  }
  if (props.services.some(s => matchCategory(s.category, 'search'))) {
    cats.push({ id: 'search', label: t('services.filter_search') });
  }
  if (props.services.some(s => matchCategory(s.category, 'realtime'))) {
    cats.push({ id: 'realtime', label: t('services.filter_realtime') });
  }
  if (props.services.some(s => matchCategory(s.category, 'storage'))) {
    cats.push({ id: 'storage', label: t('services.filter_storage') });
  }
  if (props.services.some(s => matchCategory(s.category, 'tools'))) {
    cats.push({ id: 'tools', label: 'E-mail' });
  }
  return cats;
});

const filteredServices = computed(() => {
  if (activeMainCategory.value === 'all') return props.services;
  return props.services.filter(s => matchCategory(s.category, activeMainCategory.value));
});

const activeServicesCount = computed(() => {
  return props.services.filter(s => s.running).length;
});

const installedServicesCount = computed(() => {
  return props.services.filter(s => s.installed).length;
});

const serviceIcons = {
  mysql: Database,
  postgres: Server,
  mongodb: Database,
  couchdb: Boxes,
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

function copyEnv(service) {
  navigator.clipboard.writeText(service.envSnippet);
  copiedId.value = service.id;
  setTimeout(() => { copiedId.value = null; }, 2000);
}
</script>
