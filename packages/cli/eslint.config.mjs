// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  // Type of the project
  type: 'lib',

  // TypeScript support
  typescript: true,

  // Enable stylistic formatting rules
  stylistic: {
    indent: 2,
    quotes: 'single',
  },

  // JSON support
  jsonc: true,
  yaml: true,

  // Files to ignore
  ignores: [
    'dist',
    'node_modules',
    'templates/**',
    'test-project/**',
    'worker-configuration.d.ts',
    '**/worker-configuration.d.ts',
  ],

  // Custom rules
  rules: {
    // Allow process usage in Node.js scripts
    'node/prefer-global/process': 'off',
    // Allow console in CLI tools
    'no-console': 'off',
  },
})
