module.exports = {
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:prettier/recommended',
    'plugin:import/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',
    'plugin:unicorn/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    project: './tsconfig.json',
    sourceType: 'module',
  },
  plugins: [
    'react-refresh',
    '@typescript-eslint',
    'prettier',
    'simple-import-sort',
  ],
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
      node: true,
    },
  },
  rules: {
    'react-refresh/only-export-components': 1,
    'simple-import-sort/imports': 2,
    'simple-import-sort/exports': 2,
    'unicorn/filename-case': [
      2,
      {
        case: 'pascalCase',
        ignore: ['^(vite)*'],
      },
    ],
    'unicorn/no-null': 0,
    'unicorn/prevent-abbreviations': 0,
    'unicorn/prefer-query-selector': 0,
    'import/no-unresolved': [
      2,
      {
        commonjs: true,
        amd: true,
        ignore: ['^\\/.*'],
      },
    ],
    'import/named': 2,
    'import/namespace': 2,
    'import/default': 2,
    'import/export': 2,
  },
}
