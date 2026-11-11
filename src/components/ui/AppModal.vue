<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 transition-all duration-200"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      @click.self="onBackdropClick"
    >
      <div
        class="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-white/[0.08] rounded-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]"
        :class="maxWidthClass"
      >
        <div v-if="$slots.header" class="flex items-start justify-between gap-3">
          <slot name="header" :title-id="titleId" />
        </div>

        <slot />

        <div v-if="$slots.footer" class="pt-3 border-t border-slate-200/80 dark:border-white/[0.06]">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
  open: { type: Boolean, default: false },
  maxWidth: {
    type: String,
    default: 'lg',
    validator: (v) => ['md', 'lg', 'xl', '3xl'].includes(v)
  },
  closeOnBackdrop: { type: Boolean, default: true },
  closeOnEscape: { type: Boolean, default: true }
});

const emit = defineEmits(['close']);

const titleId = `modal-title-${Math.random().toString(36).slice(2, 9)}`;

const maxWidthClass = computed(() => {
  const map = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '3xl': 'max-w-3xl'
  };
  return map[props.maxWidth] || map.lg;
});

function onBackdropClick() {
  if (props.closeOnBackdrop) {
    emit('close');
  }
}

function handleKeydown(e) {
  if (props.open && props.closeOnEscape && e.key === 'Escape') {
    emit('close');
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeydown);
    } else {
      window.removeEventListener('keydown', handleKeydown);
    }
  },
  { immediate: true }
);

onMounted(() => {
  if (props.open) {
    window.addEventListener('keydown', handleKeydown);
  }
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>
