<template>
  <div
    class="glass-panel rounded-2xl shadow-sm transition-all duration-200"
    :class="[paddingClass, interactive ? 'card-hover cursor-pointer' : '']"
  >
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  interactive: { type: Boolean, default: false },
  padding: {
    type: String,
    default: 'md',
    validator: (v) => ['none', 'sm', 'md', 'lg'].includes(v)
  }
});

const paddingClass = computed(() => {
  const map = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6'
  };
  return map[props.padding] || map.md;
});
</script>
