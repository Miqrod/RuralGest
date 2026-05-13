import nextConfig from 'eslint-config-next'
import prettier from 'eslint-config-prettier'
import unusedImports from 'eslint-plugin-unused-imports'

/** @type {import('eslint').Linter.Config[]} */
const config = [
  {
    ignores: [
      'node_modules',
      '.next',
      'out',
      'build',
      'coverage',
      '.agents',
      '.claude',
      '.taskmaster',
      'graphify-out',
      'scripts',
    ],
  },
  ...nextConfig,
  {
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      'unused-imports/no-unused-imports': 'error',
      'no-unused-vars': 'off',
      'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    rules: prettier.rules,
  },
]

export default config
