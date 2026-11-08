'use strict';

module.exports = [
  require('@drom/eslint-config/eslint9/node22'),
  {
    files: ['web/**/*.js'],
    languageOptions: {sourceType: 'module'}
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {describe: 'readonly', it: 'readonly', before: 'readonly', after: 'readonly'}
    }
  }
];
