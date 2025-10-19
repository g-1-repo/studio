import { defineConfig } from 'tsup'
import { createLibraryConfig, createCLIConfig } from '../shared/tsup.config.base.js'

export default defineConfig([
  // Library build
  createLibraryConfig({
    entry: ['src/index.ts'],
    platform: 'node',
    target: 'node18',
    external: [
      'listr2', 
      'commander', 
      'chalk', 
      'ora', 
      'enquirer', 
      'execa', 
      'simple-git',
      'semver',
      'conventional-commits-parser',
      'cosmiconfig',
      'zod'
    ]
  }),
  
  // CLI build  
  createCLIConfig({
    entry: ['src/cli.ts'],
    platform: 'node',
    target: 'node18',
    external: [
      'listr2',
      'commander', 
      'chalk',
      'ora',
      'enquirer',
      'execa',
      'simple-git',
      'semver',
      'conventional-commits-parser',
      'cosmiconfig',
      'zod'
    ]
  })
])
