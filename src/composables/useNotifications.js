import { ref } from 'vue';
import { formatAppError } from '../utils/errorFormatter';

const notifications = ref([]);
let nextId = 1;
const timers = new Map();

const MAX_VISIBLE = 4;

function scheduleDismiss(id, duration) {
  clearTimer(id);
  if (duration && duration > 0) {
    const timer = setTimeout(() => {
      dismissNotification(id);
    }, duration);
    timers.set(id, timer);
  }
}

function clearTimer(id) {
  const existing = timers.get(id);
  if (existing) {
    clearTimeout(existing);
    timers.delete(id);
  }
}

export function dismissNotification(id) {
  clearTimer(id);
  notifications.value = notifications.value.filter(n => n.id !== id);
}

export function pauseNotification(id) {
  clearTimer(id);
}

export function resumeNotification(id) {
  const item = notifications.value.find(n => n.id === id);
  if (item && item.duration > 0) {
    scheduleDismiss(id, item.duration);
  }
}

export function notify(messageOrOptions, type = 'success') {
  let opts;
  if (messageOrOptions && typeof messageOrOptions === 'object' && !Array.isArray(messageOrOptions)) {
    opts = { ...messageOrOptions };
  } else {
    opts = { message: String(messageOrOptions || ''), type };
  }

  const finalType = opts.type || 'success';

  if (finalType === 'error') {
    return notifyError(opts.error || opts.message, opts.title, opts.duration);
  }

  const msg = String(opts.message || '').trim();
  if (!msg) return null;

  // Deduplicate identical active notifications
  const duplicate = notifications.value.find(n => n.type === finalType && n.message === msg);
  if (duplicate) {
    scheduleDismiss(duplicate.id, duplicate.duration);
    return duplicate.id;
  }

  const id = nextId++;
  const duration = opts.duration !== undefined ? opts.duration : 4000;

  const entry = {
    id,
    type: finalType,
    title: opts.title || '',
    message: msg,
    detail: opts.detail || null,
    duration
  };

  notifications.value = [...notifications.value.slice(-(MAX_VISIBLE - 1)), entry];
  scheduleDismiss(id, duration);
  return id;
}

export function notifyError(err, contextTitle = '', customDuration) {
  const formatted = formatAppError(err, contextTitle);
  const duration = customDuration !== undefined ? customDuration : 8000;

  const duplicate = notifications.value.find(
    n => n.type === 'error' && n.message === formatted.message
  );
  if (duplicate) {
    scheduleDismiss(duplicate.id, duration);
    return duplicate.id;
  }

  const id = nextId++;
  const entry = {
    id,
    type: 'error',
    title: formatted.title,
    message: formatted.message,
    detail: formatted.detail,
    duration
  };

  notifications.value = [...notifications.value.slice(-(MAX_VISIBLE - 1)), entry];
  scheduleDismiss(id, duration);
  return id;
}

export function clearNotifications() {
  for (const id of timers.keys()) {
    clearTimer(id);
  }
  notifications.value = [];
}

export function useNotifications() {
  return {
    notifications,
    notify,
    notifyError,
    dismissNotification,
    pauseNotification,
    resumeNotification,
    clearNotifications
  };
}
