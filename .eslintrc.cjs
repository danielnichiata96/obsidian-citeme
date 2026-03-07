module.exports = {
	root: true,
	parser: "@typescript-eslint/parser",
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: "module",
	},
	plugins: ["@typescript-eslint"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"prettier",
	],
	rules: {
		"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
		"no-console": "warn",
	},
	env: {
		browser: true,
		node: true,
	},
};
