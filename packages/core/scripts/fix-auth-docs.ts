#!/usr/bin/env bun
import { readFile, writeFile } from 'node:fs/promises'
import process from 'node:process'
// import { confirm, select } from '@g-1/util' // These don't exist in v2.0.0

/**
 * Comprehensive Better Auth OpenAPI Documentation Fixer
 *
 * This script addresses the recurring issue with Better Auth OpenAPI documentation
 * by providing multiple solutions and automatic fixes.
 */

async function main() {
  console.log('🔧 Better Auth OpenAPI Documentation Fixer')
  console.log('==========================================\n')

  // Default to testing endpoints since interactive select is not available
  console.log('Available actions:')
  console.log('- test: Test current Better Auth endpoints')
  console.log('- fix-config: Fix Better Auth openAPI plugin configuration')
  console.log('- info: Show information about the issue')
  console.log()
  const action = process.argv[2] || 'test'

  switch (action) {
    case 'test':
      await testAuthEndpoints()
      break
    case 'fix-config':
      await fixBetterAuthConfig()
      break
    case 'update-scalar':
      await updateScalarConfig()
      break
    case 'use-custom-only':
      await useCustomDocsOnly()
      break
    case 'diagnose':
      await fullDiagnosis()
      break
    case 'info':
      await showInformation()
      break
  }
}

async function testAuthEndpoints() {
  console.log('🔍 Testing Better Auth endpoints...\n')

  const baseUrl = 'http://localhost:8787'
  const endpoints = [
    '/api/auth/openapi',
    '/api/auth/openapi.json',
    '/auth-docs',
    '/doc',
  ]

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${baseUrl}${endpoint}`)
      const response = await fetch(`${baseUrl}${endpoint}`)
      if (response.ok) {
        console.log(`✅ Working: ${endpoint}`)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const data = await response.json() as any
          if (data.openapi || data.swagger) {
            console.log(`   📄 Contains valid OpenAPI schema`)
          }
        }
      }
      else {
        console.log(`❌ Failed: ${endpoint} (${response.status})`)
      }
    }
    catch (error) {
      console.log(`❌ Error: ${endpoint} - ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

async function fixBetterAuthConfig() {
  console.log('🛠️ Fixing Better Auth openAPI plugin configuration...\n')

  try {
    const authConfigPath = 'src/auth/index.ts'
    let content = await readFile(authConfigPath, 'utf-8')

    // Check if openAPI plugin is properly configured
    if (content.includes('openAPI()')) {
      console.log('Found basic openAPI() configuration')

      const shouldUpgrade = true // Default to yes

      if (shouldUpgrade) {
        // Replace basic openAPI() with explicit configuration
        content = content.replace(
          'openAPI()',
          `openAPI({
            enabled: true,
            path: '/openapi',
            info: {
              title: 'Better Auth API',
              version: '1.0.0',
              description: 'Authentication endpoints',
            },
          })`,
        )

        await writeFile(authConfigPath, content)
        console.log('✅ Updated Better Auth openAPI configuration')
      }
    }
    else if (content.includes('openAPI({')) {
      console.log('✅ Already has explicit openAPI configuration')
    }
    else {
      console.log('❌ openAPI plugin not found in configuration')
    }

    console.log('\n💡 Next steps:')
    console.log('1. Restart your dev server')
    console.log('2. Test the endpoints: bun run test-auth-endpoints')
  }
  catch (error) {
    console.error('❌ Failed to update auth configuration:', error)
  }
}

async function updateScalarConfig() {
  console.log('📝 Updating Scalar configuration...\n')

  const configs = [
    {
      name: 'Both Better Auth and Custom (Recommended)',
      sources: [
        '{ url: \'/doc\', title: \'API\' }',
        '{ url: \'/api/auth/openapi\', title: \'Auth (Better Auth)\' }',
        '{ url: \'/auth-docs\', title: \'Auth (Custom)\' }',
      ],
    },
    {
      name: 'Custom Auth Docs Only (Most Reliable)',
      sources: [
        '{ url: \'/doc\', title: \'API\' }',
        '{ url: \'/auth-docs\', title: \'Auth\' }',
      ],
    },
    {
      name: 'Better Auth Only',
      sources: [
        '{ url: \'/doc\', title: \'API\' }',
        '{ url: \'/api/auth/openapi\', title: \'Auth\' }',
      ],
    },
  ]

  const selectedConfig = 1 // Default to "Custom Auth Docs Only (Most Reliable)"

  const config = configs[selectedConfig]
  console.log(`\n📋 Selected: ${config.name}`)
  console.log('\nUpdate src/lib/configure-open-api.ts with:')
  console.log('sources: [')
  config.sources.forEach((source) => {
    console.log(`  ${source},`)
  })
  console.log(']')
}

async function useCustomDocsOnly() {
  console.log('🎨 Configuring to use custom auth docs only...\n')

  try {
    const configPath = 'src/lib/configure-open-api.ts'
    let content = await readFile(configPath, 'utf-8')

    // Update to use only custom docs
    const newSources = `    sources: [
      { url: '/doc', title: 'API' },
      { url: '/auth-docs', title: 'Auth' },
    ],`

    // Replace the sources section
    content = content.replace(
      /sources:\s*\[[\s\S]*?\],/,
      newSources,
    )

    await writeFile(configPath, content)
    console.log('✅ Updated to use custom auth docs only')
    console.log('\nThis configuration is most reliable because:')
    console.log('• Custom docs are always available')
    console.log('• No dependency on Better Auth openAPI plugin')
    console.log('• Covers all major auth endpoints')
    console.log('• Consistent documentation format')
  }
  catch (error) {
    console.error('❌ Failed to update configuration:', error)
  }
}

async function fullDiagnosis() {
  console.log('🩺 Running full Better Auth OpenAPI diagnosis...\n')

  // Step 1: Test endpoints
  console.log('Step 1: Testing endpoints...')
  await testAuthEndpoints()

  console.log('\nStep 2: Checking configuration...')
  try {
    const authConfig = await readFile('src/auth/index.ts', 'utf-8')
    if (authConfig.includes('openAPI')) {
      console.log('✅ openAPI plugin is configured')
    }
    else {
      console.log('❌ openAPI plugin not found')
    }
  }
  catch {
    console.log('❌ Could not read auth configuration')
  }

  console.log('\nStep 3: Automatic fix recommendation...')
  const shouldFix = true // Default to yes

  if (shouldFix) {
    await useCustomDocsOnly()
    console.log('\n🎉 Fix applied! Your auth documentation should now work reliably.')
    console.log('\n📋 What was done:')
    console.log('• Configured Scalar to use custom auth docs (/auth-docs)')
    console.log('• Custom docs include all major Better Auth endpoints')
    console.log('• No longer dependent on Better Auth openAPI plugin')

    console.log('\n🔄 Next steps:')
    console.log('1. Restart your dev server: bun run dev:unlimited')
    console.log('2. Visit /reference to see your API documentation')
    console.log('3. You should see both "API" and "Auth" sources available')
  }
}

async function showInformation() {
  console.log('ℹ️ Better Auth OpenAPI Documentation Issue\n')

  console.log('🚨 The Problem:')
  console.log('Better Auth openAPI plugin can be unreliable:')
  console.log('• Endpoint paths change between versions')
  console.log('• Plugin configuration can be complex')
  console.log('• Not always enabled by default')
  console.log('• Documentation may be incomplete\n')

  console.log('🛠️ Our Solutions:')
  console.log('1. Custom Auth Docs Route (/auth-docs)')
  console.log('   • Always available and reliable')
  console.log('   • Covers all major Better Auth endpoints')
  console.log('   • Proper OpenAPI 3.0 format')
  console.log('   • Includes request/response schemas\n')

  console.log('2. Dual Configuration')
  console.log('   • Try Better Auth plugin first')
  console.log('   • Fallback to custom docs')
  console.log('   • Best of both worlds\n')

  console.log('3. Better Auth Plugin Fixes')
  console.log('   • Explicit plugin configuration')
  console.log('   • Proper endpoint path setup')
  console.log('   • Version-specific adjustments\n')

  console.log('📍 Files Involved:')
  console.log('• src/auth/index.ts - Better Auth configuration')
  console.log('• src/lib/configure-open-api.ts - Scalar configuration')
  console.log('• src/routes/auth-docs.route.ts - Custom auth docs')
  console.log('• src/app.ts - Route registration\n')

  console.log('🎯 Recommended Solution:')
  console.log('Use custom docs only for maximum reliability')
  console.log('Run: bun run fix-auth-docs and choose "Use only custom auth docs"')
}

// Run the script
main().catch((error) => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})
