module.exports = {
	root: true,
	env: {
		node: true,
		es2021: true,
	},
	extends: ['plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'prettier', 'node'],
	rules: {
		'@typescript-eslint/no-explicit-any': 'off',
		'prettier/prettier': 'warn',
		'no-fallthrough': ['error', { commentPattern: 'break[\\s\\w]*omitted' }],
		'no-console': ['error', { allow: ['warn', 'error', 'info'] }],
		'key-spacing': ['error', { mode: 'minimum' }],
		'no-multi-spaces': ['error', { exceptions: { VariableDeclarator: true } }],
		semi: ['error', 'always', { omitLastInOneLineBlock: true }],
		'func-call-spacing': ['error', 'never'],
	},
};
