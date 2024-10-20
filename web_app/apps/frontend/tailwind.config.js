/* eslint-env node */

/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ['selector', '[class*="p-dark"]'],
	safelist: ['dark', 'bg-black'],
	prefix: '',
	content: [
		'./node_modules/@cultura-ai/theme-preset/lib/**/*.js',
		'./pages/**/*.{ts,tsx,vue}',
		'./components/**/*.{ts,tsx,vue}',
		'./src/**/*.{ts,tsx,vue}',
	],
	plugins: [require('tailwindcss-primeui'), require('tailwindcss-animate')],
};
