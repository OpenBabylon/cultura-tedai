/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
	root: true,
	extends: [
		'plugin:vue/vue3-essential',
		'eslint:recommended',
		'@vue/eslint-config-typescript',
		'@vue/eslint-config-prettier/skip-formatting',
	],
	parserOptions: {
		ecmaVersion: 'latest',
	},
	rules: {
		'no-console': 'off',
		quotes: [
			2,
			'single',
			{
				avoidEscape: true,
			},
		],
		'vue/multi-word-component-names': 'off',
		semi: [
			'error',
			'always',
			{
				omitLastInOneLineBlock: true,
			},
		],
		'no-mixed-spaces-and-tabs': [2, 'smart-tabs'],
		'vue/html-comment-indent': ['error', 'tab'],
		'vue/max-attributes-per-line': 0,
		'vue/html-self-closing': [
			'error',
			{
				html: {
					component: 'always',
					void: 'always',
				},
			},
		],
	},
};
