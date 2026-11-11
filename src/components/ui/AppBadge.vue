<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold border"
    :class="variantClasses"
  >
    <span v-if="dot" class="relative flex h-2 w-2 flex-shrink-0">
      <span
        v-if="pulse"
        class="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        :class="dotColorClass"
      ></span>
      <span class="relative inline-flex rounded-full h-2 w-2" :class="dotColorClass"></span>
    </span>
    <slot />
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'brand', 'success', 'warning', 'danger', 'info'].includes(v)
  },
  dot: { type: Boolean, default: false },
  pulse: { type: Boolean, default: false }
});

const variantClasses = computed(() => {
  const map = {
    neutral: 'bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300/70 dark:border-slate-700',
    brand: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/25'
  };
  return map[props.variant] || map.neutral;
});

const dotColorClass = computed(() => {
  const map = {
    neutral: 'bg-slate-400 dark:bg-slate-500',
    brand: 'bg-rose-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500'
  };
  return map[props.variant] || map.neutral;
});
</script>
