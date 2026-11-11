<template>
  <div class="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 w-96 max-w-[calc(100vw-2.5rem)] pointer-events-none">
    <TransitionGroup
      enter-active-class="transform ease-out duration-250 transition"
      enter-from-class="translate-y-3 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-150"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div
        v-for="item in notifications"
        :key="item.id"
        @mouseenter="pauseNotification(item.id)"
        @mouseleave="resumeIfNotExpanded(item.id)"
        class="pointer-events-auto rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border shadow-2xl p-3.5 ring-1 ring-black/5 dark:ring-white/5 transition-all"
        :class="cardBorderClass(item.type)"
        role="alert"
      >
        <div class="flex items-start gap-3">
          <div
            class="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
            :class="iconWrapperClass(item.type)"
          >
            <AlertCircle v-if="item.type === 'error'" class="w-4 h-4" />
            <AlertTriangle v-else-if="item.type === 'warning'" class="w-4 h-4" />
            <Info v-else-if="item.type === 'info'" class="w-4 h-4" />
            <CheckCircle2 v-else class="w-4 h-4" />
          </div>

          <div class="flex-1 min-w-0 space-y-1">
            <div v-if="item.title" class="text-xs font-bold text-slate-900 dark:text-white leading-snug">
              {{ item.title }}
            </div>
            <p class="text-xs font-medium text-slate-700 dark:text-slate-200 leading-relaxed break-words">
              {{ item.message }}
            </p>

            <div v-if="item.detail" class="pt-0.5">
              <button
                @click="toggleDetail(item.id)"
                class="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 inline-flex items-center gap-1 transition"
              >
                <ChevronDown
                  class="w-3 h-3 transition-transform"
                  :class="{ 'rotate-180': expandedIds[item.id] }"
                />
                <span>{{ expandedIds[item.id] ? $t('notifications.hide_details') : $t('notifications.show_details') }}</span>
              </button>

              <div
                v-if="expandedIds[item.id]"
                class="mt-1.5 p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all max-h-28 overflow-y-auto select-text"
              >
                {{ item.detail }}
              </div>
            </div>
          </div>

          <button
            @click="dismiss(item.id)"
            class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition flex-shrink-0"
            :aria-label="$t('notifications.dismiss')"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  ChevronDown
} from 'lucide-vue-next';
import { useNotifications } from '../composables/useNotifications';

const {
  notifications,
  dismissNotification,
  pauseNotification,
  resumeNotification
} = useNotifications();

const expandedIds = reactive({});

function toggleDetail(id) {
  expandedIds[id] = !expandedIds[id];
  if (expandedIds[id]) {
    pauseNotification(id);
  } else {
    resumeNotification(id);
  }
}

function resumeIfNotExpanded(id) {
  if (!expandedIds[id]) {
    resumeNotification(id);
  }
}

function dismiss(id) {
  delete expandedIds[id];
  dismissNotification(id);
}

function cardBorderClass(type) {
  switch (type) {
    case 'error':
      return 'border-rose-300/80 dark:border-rose-500/30';
    case 'warning':
      return 'border-amber-300/80 dark:border-amber-500/30';
    case 'info':
      return 'border-sky-300/80 dark:border-sky-500/30';
    default:
      return 'border-slate-200/80 dark:border-white/[0.1]';
  }
}

function iconWrapperClass(type) {
  switch (type) {
    case 'error':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400';
    case 'warning':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400';
    case 'info':
      return 'bg-sky-500/15 text-sky-600 dark:text-sky-400';
    default:
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400';
  }
}
</script>
