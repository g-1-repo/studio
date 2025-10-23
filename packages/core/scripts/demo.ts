#!/usr/bin/env bun
import { readFileSync } from 'node:fs'
// import { Spinner, getCurrentVersion, readPackageJson } from '@g-1/util'
import process from 'node:process'

/**
 * Demo script for showcasing G1 Core API capabilities
 * Demonstrates authentication, database operations, and API endpoints
 */
async function main() {
  try {
    // const spinner = new Spinner('Loading project demo...')
    // spinner.start()

    // Simulate loading
    await new Promise(resolve => setTimeout(resolve, 1500))

    // spinner.succeed('Demo loaded!')
    console.log('✅ Demo loaded!')

    // Get version from package.json
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    const version = pkg.version

    console.log('\n🚀 G1 Core API Demo')
    console.log('================================')
    console.log(`Version: ${version}`)
    console.log(`Description: G1 Core API - High-performance TypeScript API for Cloudflare Workers with Better Auth and D1\n`)

    console.log('🎆 Key Features:')
    const features = [
      'Better Auth with anonymous login, email/password, OTP',
      'Cloudflare D1 database with Drizzle ORM',
      'OpenAPI/Swagger documentation with Scalar',
      'Rate limiting and security middleware',
      'Email integration with Resend',
      'Multi-tenant organization support',
      'Comprehensive testing with Vitest',
    ]
    features.forEach(feature => console.log(`  • ${feature}`))

    console.log('\n🔗 API Endpoints:')
    const endpoints = {
      'Health Check': '/health',
      'API Documentation': '/doc',
      'Authentication': '/api/auth/*',
      'Early Access Requests': '/v1/early-access-requests',
      'Auth Documentation': '/v1/auth-docs',
    }
    Object.entries(endpoints).forEach(([name, path]) => {
      console.log(`  ${name}: ${path}`)
    })

    console.log('\n🛠️ Development Commands:')
    const commands = [
      'bun run dev         - Start development server',
      'bun run test        - Run tests',
      'bun run lint        - Lint code',
      'bun run typecheck   - Check TypeScript',
      'bun run workflow    - Development workflow utilities',
      'bun run finish-branch - Finish current branch',
    ]
    commands.forEach(cmd => console.log(`  ${cmd}`))

    console.log('\n🎨 Try it out:')
    console.log('  1. Run "bun run dev" to start the development server')
    console.log('  2. Visit http://localhost:8787 for the interactive demo')
    console.log('  3. Check /doc for API documentation')
    console.log('  4. Test authentication with anonymous login')

    console.log('\n✨ Happy coding!')
  }
  catch (error) {
    console.error('\n❌ Demo error:', error)
    process.exit(1)
  }
}

main()
