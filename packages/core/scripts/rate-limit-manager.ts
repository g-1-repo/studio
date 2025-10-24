#!/usr/bin/env bun
import process from 'node:process'

// import { confirm, select } from '@g-1/util' // These don't exist in v2.0.0

/**
 * Rate Limit Management Script
 *
 * This script helps manage rate limiting issues during development:
 * 1. Sets NODE_ENV=development for higher rate limits
 * 2. Provides information about current rate limits
 * 3. Offers quick fixes for common rate limiting issues
 */

async function main() {
  console.log('🚦 Rate Limit Manager')
  console.log('====================\n')

  // Default to checking settings since interactive select is not available
  console.log('Available actions:')
  console.log('- check: Check current rate limit settings')
  console.log('- dev: Set development environment (higher limits)')
  console.log('- info: Show rate limit information')
  console.log()
  const action = process.argv[2] || 'check'

  switch (action) {
    case 'check':
      await checkCurrentSettings()
      break
    case 'dev':
      await setDevelopmentMode()
      break
    case 'prod':
      await setProductionMode()
      break
    case 'restart':
      await restartWithDevLimits()
      break
    case 'info':
      await showRateLimitInfo()
      break
  }
}

async function checkCurrentSettings() {
  console.log('📊 Current Rate Limit Configuration:\n')

  const nodeEnv = process.env.NODE_ENV || 'not set'
  const isDev = nodeEnv === 'development'

  console.log(`NODE_ENV: ${nodeEnv}`)
  console.log(`Development Mode: ${isDev ? '✅ Enabled' : '❌ Disabled'}\n`)

  console.log('Current Limits:')
  console.log(`├─ API endpoints (/api/*): ${isDev ? '1000' : '100'} requests per 15 minutes`)
  console.log(`└─ Auth endpoints (/api/auth/*): ${isDev ? '200' : '20'} requests per 15 minutes\n`)

  if (!isDev) {
    console.log('💡 Tip: Run this script with "Set development environment" to increase limits')
  }
}

async function setDevelopmentMode() {
  console.log('🔧 Setting development environment...\n')

  // Set NODE_ENV for current session
  process.env.NODE_ENV = 'development'

  console.log('✅ NODE_ENV set to development for this session')
  console.log('📈 Rate limits are now:')
  console.log('├─ API endpoints: 1000 requests per 15 minutes')
  console.log('└─ Auth endpoints: 200 requests per 15 minutes\n')

  const shouldRestart = false // Default to no restart

  if (shouldRestart) {
    console.log('🔄 Restarting development server...')
    console.log('Run: NODE_ENV=development bun run dev\n')
  } else {
    console.log('💡 Remember to restart your dev server with: NODE_ENV=development bun run dev')
  }
}

async function setProductionMode() {
  console.log('🚀 Setting production environment...\n')

  process.env.NODE_ENV = 'production'

  console.log('✅ NODE_ENV set to production for this session')
  console.log('🔒 Rate limits are now:')
  console.log('├─ API endpoints: 100 requests per 15 minutes')
  console.log('└─ Auth endpoints: 20 requests per 15 minutes\n')

  console.log('⚠️  These are strict production limits for security')
}

async function restartWithDevLimits() {
  console.log('🔄 Instructions to restart with development limits:\n')

  console.log('1. Stop your current dev server (Ctrl+C)')
  console.log('2. Run one of these commands:\n')

  console.log('   # Option 1: Set for this session')
  console.log('   export NODE_ENV=development && bun run dev\n')

  console.log('   # Option 2: Set for single command')
  console.log('   NODE_ENV=development bun run dev\n')

  console.log('   # Option 3: Create a .env file')
  console.log('   echo "NODE_ENV=development" > .env')
  console.log('   bun run dev\n')

  const shouldCreateEnv = false // Default to no

  if (shouldCreateEnv) {
    const fs = await import('node:fs/promises')
    try {
      await fs.writeFile('.env', 'NODE_ENV=development\n', { flag: 'a' })
      console.log('✅ Added NODE_ENV=development to .env file')
      console.log('Now run: bun run dev')
    } catch (error) {
      console.error('❌ Failed to create .env file:', error)
    }
  }
}

async function showRateLimitInfo() {
  console.log('ℹ️  Rate Limit Information:\n')

  console.log('🔧 Development Mode (NODE_ENV=development):')
  console.log('├─ API endpoints (/api/*): 1000 requests per 15 minutes')
  console.log('├─ Auth endpoints (/api/auth/*): 200 requests per 15 minutes')
  console.log('└─ Recommended for: Development, testing, documentation browsing\n')

  console.log('🚀 Production Mode (NODE_ENV=production):')
  console.log('├─ API endpoints (/api/*): 100 requests per 15 minutes')
  console.log('├─ Auth endpoints (/api/auth/*): 20 requests per 15 minutes')
  console.log('└─ Recommended for: Production deployment, security\n')

  console.log('🚨 Common Issues:')
  console.log('├─ 429 "Too many requests" during development')
  console.log('├─ Rate limits hit when browsing OpenAPI docs')
  console.log('├─ Auth endpoint limits during testing')
  console.log('└─ Solution: Set NODE_ENV=development\n')

  console.log('📍 Rate Limit Configuration Location:')
  console.log('└─ src/lib/create-app.ts (lines 72-86)\n')

  console.log('🔧 Quick Fixes:')
  console.log('1. NODE_ENV=development bun run dev')
  console.log('2. Add NODE_ENV=development to your .env file')
  console.log('3. Run this script to set development mode')
}

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})
