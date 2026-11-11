import { createApp } from 'vue';
import App from './App.vue';
import './assets/main.css';
import i18nPlugin, { t } from './i18n';
import { notify, notifyError } from './composables/useNotifications';

const app = createApp(App);
app.use(i18nPlugin);

// Prevent any native browser alert() dialogs from popping up
window.alert = (message) => {
  notify({
    type: 'warning',
    title: t('errors.default_title'),
    message: String(message || '')
  });
};

app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Global Error:', err, info);
  notifyError(err, t('errors.unexpected_title'));
};

window.addEventListener('error', (e) => {
  console.error('Uncaught Window Error:', e.error || e.message);
  notifyError(e.error || e.message, t('errors.unexpected_title'));
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
  e.preventDefault();
  notifyError(e.reason, t('errors.unexpected_title'));
});

app.mount('#app');
