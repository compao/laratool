<template>
  <button
    :type="type"
    :disabled="disabled"
    class="inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:opacity-50 disabled:pointer-events-none active:scale-95"
    :class="[variantClasses, sizeClasses]"
  >
    <slot />
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'secondary',
    validator: (v) => ['primary', 'success', 'warning', 'secondary', 'ghost', 'danger'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'icon'].includes(v)
  },
  type: { type: String, default: 'button' },
  disabled: { type: Boolean, default: false }
});

const variantClasses = computed(() => {
  const map = {
    primary: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-lg shadow-rose-600/20',
    success: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-lg shadow-emerald-600/20',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white font-bold shadow-md shadow-amber-600/20',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-md shadow-rose-600/20',
    secondary: 'bg-slate-100/90 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/[0.08] shadow-sm',
    ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
  };
  return map[props.variant] || map.secondary;
});

const sizeClasses = computed(() => {
  const map = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-xs',
    icon: 'p-2 text-xs'
  };
  return map[props.size] || map.md;
});
</script>
