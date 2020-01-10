module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: [
    'airbnb-base',
    'plugin:mocha/recommended',
  ],
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
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
      ],
      env: {
        mocha: true, // now **/*.test.js files' env has both es6 *and* jest
      },
      plugins: ['mocha'],
      rules: {
        'mocha/no-hooks-for-single-case': 'off',
        'func-names': 'off',
      },
    },
  ],
};
