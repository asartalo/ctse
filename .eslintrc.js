module.exports = {
  env: {
    browser: false,
    es6: true,
  },
  extends: ['airbnb-base', 'plugin:mocha/recommended'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2018,
  },
  rules: {
    'mocha/no-mocha-arrows': 'off',
    'no-underscore-dangle': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'no-plusplus': ['error', { allowForLoopAfterthoughts: true }],
    'no-restricted-syntax': 'off',
  },
  ignorePatterns: ['tmp/*'],
  overrides: [
    {
      files: ['**/*.test.js'],
      env: {
        mocha: true, // now **/*.test.js files' env has both es6 *and* jest
      },
      plugins: ['mocha'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
        'func-names': 'off',
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['e2e/support/**/*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
    {
      files: ['mocha*.js'],
      rules: {
        'import/no-extraneous-dependencies': 'off',
      },
    },
  ],
};
