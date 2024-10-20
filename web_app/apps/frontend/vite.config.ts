import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import Components from 'unplugin-vue-components/vite';
import VueRouter from 'unplugin-vue-router/vite';
import { defineConfig } from 'vite';
import vueDevTools from 'vite-plugin-vue-devtools';
import VueLayouts from 'vite-plugin-vue-layouts';

import { URL, fileURLToPath } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		VueRouter({
			routesFolder: [
				{
					src: 'src/pages',
					path: '',
				},
			],
		}),
		// @ts-ignore
		VueLayouts({
			layoutsDirs: 'src/layouts',
			pagesDirs: 'src/pages',
			defaultLayout: 'LayoutDefault',
		}),
		Components({
			dts: true,
			globs: [
				'src/components/[A-Z]*([A-z]).{vue,ts,tsx}',
				'src/components/ui/*/[A-Z]*([A-z]).{vue,ts,tsx}',
				'src/components/*/index.ts',
			],
			resolvers: [PrimeVueResolver()],
			deep: true,
		}),
		vue(),
		vueJsx(),
		vueDevTools(),
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
});
