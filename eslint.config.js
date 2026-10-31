const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
  },
  {
    files: ['public/js/**/*.js'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    ignores: ['node_modules/', 'sessions/'],
  },
];
