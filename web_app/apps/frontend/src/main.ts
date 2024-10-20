import { autoAnimatePlugin } from '@formkit/auto-animate/vue';
import { createPinia } from 'pinia';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import { DataLoaderPlugin } from 'unplugin-vue-router/data-loaders';
import { createApp } from 'vue';

import themePreset from '@cultura-ai/theme-preset';

import App from './App.vue';
import './assets/base.css';
import router from './router';

const app = createApp(App);

app.use(createPinia());
app.use(DataLoaderPlugin, { router });
app.use(PrimeVue, {
	unstyled: true,
	pt: themePreset,
});
app.use(router);
app.use(autoAnimatePlugin);

app.mount('#app');
