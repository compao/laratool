<template>
  <header class="h-16 border-b border-slate-200/80 dark:border-white/[0.07] bg-white/80 dark:bg-slate-900/75 backdrop-blur-xl pl-8 pr-40 flex items-center justify-between transition-colors duration-200 app-drag z-10">
    <div class="flex items-center gap-3">
      <div>
        <h2 class="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <span>{{ title }}</span>
        </h2>
        <p class="text-xs text-slate-500 dark:text-slate-400 font-normal">{{ subtitle }}</p>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-3 app-no-drag">
      <!-- Download / Install Progress Banner if active -->
      <div 
        v-if="downloading" 
        class="flex items-center gap-3 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 px-3.5 py-1.5 rounded-xl text-xs shadow-sm"
      >
        <span class="relative flex h-2 w-2">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
        </span>
        <span class="text-slate-800 dark:text-slate-200 font-medium">
          {{ $t('header.downloading', { item: downloading.item }) }}
        </span>
        <div class="w-16 h-1.5 bg-rose-200 dark:bg-rose-950 rounded-full overflow-hidden">
          <div 
            class="h-full bg-rose-500 rounded-full transition-all duration-300"
            :style="{ width: `${downloading.percent}%` }"
          ></div>
        </div>
        <span class="font-mono text-rose-600 dark:text-rose-400 font-bold text-[11px]">{{ downloading.percent }}%</span>
      </div>

      <!-- Dark / Light Mode Switcher -->
      <button
        @click="$emit('toggle-theme')"
        class="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] transition-all duration-150 shadow-sm active:scale-95"
        :title="isDarkMode ? $t('header.theme_light') : $t('header.theme_dark')"
      >
        <Sun v-if="isDarkMode" class="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
        <Moon v-else class="w-4 h-4 text-slate-700 transition-transform duration-300 rotate-0 hover:-rotate-12" />
      </button>

      <!-- Quick Scan / Refresh -->
      <button 
        @click="$emit('refresh')"
        class="p-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/[0.08] transition-all duration-150 shadow-sm active:scale-95"
        :title="$t('header.refresh_tooltip')"
      >
        <RotateCw class="w-4 h-4" :class="{ 'animate-spin': isRefreshing }" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { RotateCw, Sun, Moon } from 'lucide-vue-next';

defineProps({
  title: String,
  subtitle: String,
  isRefreshing: Boolean,
  downloading: Object,
  isDarkMode: { type: Boolean, default: true }
});

defineEmits(['refresh', 'toggle-theme']);
</script>
