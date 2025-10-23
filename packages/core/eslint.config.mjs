// eslint.config.mjs
import antfu from '@antfu/eslint-config'

export default antfu({
  // Type of the project
  type: 'app',

  // TypeScript support (auto-detected, but explicitly enabled)
  typescript: true,

  // Enable stylistic formatting rules
  stylistic: {
    indent: 2,
    quotes: 'single',
  },

  // JSON support
  jsonc: true,
  yaml: true,

  // Formatters for additional file types
  formatters: {
    css: true,
    html: true,
    markdown: 'prettier',
  },

  // Files to ignore
  ignores: [
    'dist',
    'node_modules',
    '.wrangler',
    'worker-configuration.d.ts',
    'src/db/migrations/**',
    'src/db/auth.schema.ts', // Better Auth generated file
    'temp-package-utils/**', // Temporary utility files
  ],

  // Custom rules
  rules: {
    // Allow process usage in Node.js scripts
    'node/prefer-global/process': 'off',
    // Allow console in scripts
    'no-console': 'off',
  },
})
