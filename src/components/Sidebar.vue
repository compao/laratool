<template>
  <aside class="w-64 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200/80 dark:border-white/[0.08] flex flex-col select-none transition-colors duration-200">
    <!-- Brand / Logo -->
    <div class="h-16 flex items-center px-5 gap-3 border-b border-slate-200/80 dark:border-white/[0.06] app-drag">
      <div class="relative group cursor-pointer">
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-md shadow-rose-500/25 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105">
          <!-- Stylized Modern LaraTool Icon -->
          <svg class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4v16a1 1 0 0 0 1 1h14" />
            <path d="m11 9 5 5-5 5" />
          </svg>
        </div>
        <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <h1 class="font-bold text-base tracking-tight text-slate-900 dark:text-white truncate">
            LaraTool
          </h1>
          <span class="text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            PRO
          </span>
        </div>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 truncate">
          {{ $t('sidebar.brand_sub') }}
        </p>
      </div>
    </div>

    <!-- Navigation links -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      <button
        v-for="item in navItems"
        :key="item.id"
        @click="$emit('update:tab', item.id)"
        class="w-full relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all duration-150 group"
        :class="activeTab === item.id 
          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 shadow-sm font-bold' 
          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/80 dark:hover:bg-slate-800/60 border border-transparent'"
      >
        <!-- Active indicator pill -->
        <span
          v-if="activeTab === item.id"
          class="absolute left-1 top-2 bottom-2 w-1 rounded-full bg-rose-500"
        ></span>

        <component 
          :is="item.icon" 
          class="w-4 h-4 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
          :class="activeTab === item.id ? 'text-rose-500 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'"
        />
        <span class="truncate">{{ item.label }}</span>

        <span 
          v-if="item.badge" 
          class="ml-auto text-[11px] font-mono px-2 py-0.5 rounded-full font-bold transition-colors"
          :class="activeTab === item.id 
            ? 'bg-rose-500/20 text-rose-600 dark:text-rose-300' 
            : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'"
        >
          {{ item.badge }}
        </span>
      </button>
    </nav>

    <!-- Footer System Status & Environment Control Buttons -->
    <div class="p-3.5 border-t border-slate-200/80 dark:border-white/[0.06] bg-slate-50/80 dark:bg-slate-950/40 space-y-3">
      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
        <span>{{ $t('sidebar.local_services') }}</span>
        <span class="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-200/60 dark:bg-slate-800/60 text-slate-500">
          WIN x64
        </span>
      </div>

      <div class="space-y-1.5 text-xs bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.05]">
        <!-- Nginx -->
        <div class="flex items-center justify-between">
          <span class="text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span v-if="nginxRunning" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2" :class="nginxRunning ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'"></span>
            </span>
            <span class="font-medium">{{ $t('sidebar.nginx_label') }}</span>
            <span class="text-slate-400 text-[10px] font-mono">({{ isSsl ? '80/443' : '80' }})</span>
          </span>
          <span class="text-[11px] font-mono font-medium" :class="nginxRunning ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
            {{ nginxRunning ? $t('common.active') : $t('common.stopped') }}
          </span>
        </div>

        <!-- PHP FastCGI -->
        <div class="flex items-center justify-between">
          <span class="text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span v-if="activePhpCount > 0" class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2" :class="activePhpCount > 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'"></span>
            </span>
            <span class="font-medium">{{ $t('sidebar.php_fastcgi') }}</span>
          </span>
          <span class="text-[11px] font-mono font-medium" :class="activePhpCount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'">
            {{ activePhpCount > 0 ? `${activePhpCount} ${$t('common.actives')}` : $t('common.stopped') }}
          </span>
        </div>

        <!-- Active services -->
        <div v-if="activeServicesCount > 0" class="flex items-center justify-between">
          <span class="text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <span class="relative flex h-2 w-2">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span class="font-medium">{{ $t('sidebar.active_services') }}</span>
          </span>
          <span class="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
            {{ activeServicesCount }} {{ $t('common.actives') }}
          </span>
        </div>
      </div>

      <!-- Environment Start / Stop Button at Bottom of Sidebar -->
      <div class="pt-0.5">
        <button
          v-if="!allRunning"
          @click="$emit('start-all')"
          class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all duration-200"
        >
          <Play class="w-3.5 h-3.5 fill-current" />
          <span>{{ $t('sidebar.start_environment') }}</span>
        </button>

        <button
          v-else
          @click="$emit('stop-all')"
          class="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold shadow-lg shadow-rose-600/20 active:scale-[0.98] transition-all duration-200"
        >
          <Square class="w-3.5 h-3.5 fill-current" />
          <span>{{ $t('sidebar.stop_environment') }}</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { 
  LayoutDashboard, 
  FolderGit2, 
  Cpu, 
  Hexagon, 
  Server, 
  Layers, 
  Settings, 
  Play, 
  Square,
  Radio
} from 'lucide-vue-next';
import { useI18n } from '../i18n';

const { t } = useI18n();

const props = defineProps({
  activeTab: { type: String, required: true },
  projectsCount: { type: Number, default: 0 },
  nginxRunning: { type: Boolean, default: false },
  activePhpCount: { type: Number, default: 0 },
  activeServicesCount: { type: Number, default: 0 },
  isSsl: { type: Boolean, default: false },
  allRunning: { type: Boolean, default: false },
  activeTunnelsCount: { type: Number, default: 0 }
});

defineEmits(['update:tab', 'start-all', 'stop-all']);

const navItems = computed(() => [
  { id: 'dashboard', label: t('sidebar.dashboard'), icon: LayoutDashboard },
  { id: 'projects', label: t('sidebar.projects'), icon: FolderGit2, badge: props.projectsCount || null },
  { id: 'expose', label: t('sidebar.expose') || 'Exposition', icon: Radio, badge: props.activeTunnelsCount || null },
  { id: 'php', label: t('sidebar.php'), icon: Cpu },
  { id: 'node', label: t('sidebar.node'), icon: Hexagon },
  { id: 'services', label: t('sidebar.services'), icon: Layers },
  { id: 'nginx', label: t('sidebar.nginx'), icon: Server },
  { id: 'settings', label: t('sidebar.settings'), icon: Settings }
]);
</script>
