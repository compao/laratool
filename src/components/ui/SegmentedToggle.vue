<template>
  <div
    class="inline-flex items-center bg-slate-200/70 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-300/70 dark:border-white/[0.06] text-xs shadow-sm"
    role="group"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      @click="$emit('update:modelValue', option.value)"
      :aria-pressed="modelValue === option.value"
      :title="option.title || option.label"
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40"
      :class="modelValue === option.value
        ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'"
    >
      <component v-if="option.icon" :is="option.icon" class="w-3.5 h-3.5" />
      <span v-if="option.label" class="hidden sm:inline">{{ option.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: [String, Number], required: true },
  options: { type: Array, required: true }
});

defineEmits(['update:modelValue']);
</script>
