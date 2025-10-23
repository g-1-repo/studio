#!/usr/bin/env bun
/**
 * Script to test Better Auth endpoints and find the correct OpenAPI path
 */

async function testEndpoints() {
  const baseUrl = 'http://localhost:8787'
  const authPaths = [
    // Current working Better Auth endpoint
    '/api/auth/openapi',
    // Custom auth docs (backup)
    '/auth-docs',
    // Main API docs
    '/doc',
    '/reference',
    // Health check
    '/health',
    // Legacy/alternative paths (for completeness)
    '/api/auth/openapi.json',
    '/api/auth/open-api/generate-schema',
  ]

  console.log('🔍 Testing Better Auth OpenAPI endpoints...\n')
  console.log('Make sure your dev server is running: bun run dev:unlimited\n')

  const results = []

  for (const path of authPaths) {
    try {
      console.log(`Testing: ${baseUrl}${path}`)
      const response = await fetch(`${baseUrl}${path}`)
      const status = response.status
      const contentType = response.headers.get('content-type') || 'unknown'

      if (status === 200) {
        console.log(`✅ Found: ${path} (${status}) - ${contentType}`)
        results.push({ path, status, contentType, success: true })

        // Try to get a preview of the content
        try {
          const text = await response.text()
          if (text.includes('openapi') || text.includes('swagger') || text.includes('paths')) {
            console.log(`   📄 Contains OpenAPI content (${text.length} chars)`)
          }
        }
        catch {
          console.log(`   📄 Binary or complex content`)
        }
      }
      else {
        console.log(`❌ ${path} - ${status}`)
        results.push({ path, status, contentType, success: false })
      }
    }
    catch (error) {
      console.log(`❌ ${path} - Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      results.push({ path, status: 'error', contentType: 'error', success: false })
    }
  }

  console.log('\n📊 Summary:')
  const successful = results.filter(r => r.success)
  const _failed = results.filter(r => !r.success)

  if (successful.length > 0) {
    console.log('\n✅ Working endpoints:')
    successful.forEach((r) => {
      console.log(`   ${r.path} (${r.status}) - ${r.contentType}`)
    })

    console.log('\n🔧 To fix your OpenAPI configuration:')
    console.log(`Update src/lib/configure-open-api.ts to use:`)
    successful.forEach((r) => {
      console.log(`   { url: '${r.path}', title: 'Auth' },`)
    })
  }
  else {
    console.log('\n❌ No working Better Auth OpenAPI endpoints found')
    console.log('\nPossible issues:')
    console.log('1. Dev server is not running')
    console.log('2. Better Auth openAPI plugin is not properly configured')
    console.log('3. The endpoint path has changed in this version')
    console.log('4. OpenAPI plugin is not enabled')

    console.log('\n🔧 Try these fixes:')
    console.log('1. Make sure dev server is running: bun run dev:unlimited')
    console.log('2. Check Better Auth version and documentation')
    console.log('3. Verify openAPI plugin configuration in src/auth/index.ts')
  }

  console.log(`\n📈 Tested ${authPaths.length} endpoints, found ${successful.length} working`)
}

// Run the test
testEndpoints().catch(console.error)
