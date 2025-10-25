import { defineConfig, devices, type PlaywrightTestConfig } from '@playwright/test'

/**
 * Playwright configuration templates for E2E testing
 */

export interface PlaywrightTemplateConfig {
  baseURL?: string
  testDir?: string
  outputDir?: string
  timeout?: number
  expect?: {
    timeout?: number
    toHaveScreenshot?: { threshold?: number; mode?: string }
    toMatchSnapshot?: { threshold?: number }
  }
  fullyParallel?: boolean
  forbidOnly?: boolean
  retries?: number
  workers?: number | string
  reporter?: Array<
    'list' | 'line' | 'dot' | 'json' | 'junit' | 'null' | 'github' | 'html' | [string, any]
  >
  use?: {
    baseURL?: string
    trace?: 'on' | 'off' | 'on-first-retry' | 'retain-on-failure'
    screenshot?: 'only-on-failure' | 'off' | 'on'
    video?: 'retain-on-failure' | 'on-first-retry' | 'off' | 'on'
    headless?: boolean
    viewport?: { width: number; height: number } | null
    ignoreHTTPSErrors?: boolean
    acceptDownloads?: boolean
    locale?: string
    timezoneId?: string
    extraHTTPHeaders?: Record<string, string>
  }
  projects?: Array<{
    name: string
    use?: any
    testDir?: string
    testMatch?: string | RegExp | Array<string | RegExp>
  }>
  webServer?: {
    command: string
    port: number
    timeout?: number
    reuseExistingServer?: boolean
  }
}

/**
 * Base Playwright configuration
 */
export function createBasePlaywrightConfig(
  options: PlaywrightTemplateConfig = {}
): PlaywrightTestConfig {
  return defineConfig({
    testDir: options.testDir || './e2e',
    outputDir: options.outputDir || './test-results',
    timeout: options.timeout || 30000,
    expect: {
      timeout: options.expect?.timeout || 5000,
    },
    fullyParallel: options.fullyParallel ?? true,
    forbidOnly: options.forbidOnly ?? !!process.env.CI,
    retries: options.retries ?? (process.env.CI ? 2 : 0),
    workers: options.workers ?? (process.env.CI ? 1 : undefined),
    reporter:
      options.reporter ||
      ([
        'html',
        ['json', { outputFile: 'test-results/results.json' }],
        ['junit', { outputFile: 'test-results/results.xml' }],
      ] as any),
    use: {
      baseURL: options.use?.baseURL || options.baseURL || 'http://localhost:3000',
      trace: options.use?.trace || 'on-first-retry',
      screenshot: options.use?.screenshot || 'only-on-failure',
      video: options.use?.video || 'retain-on-failure',
      headless: options.use?.headless ?? true,
      viewport: options.use?.viewport || { width: 1280, height: 720 },
      ignoreHTTPSErrors: options.use?.ignoreHTTPSErrors ?? true,
      acceptDownloads: options.use?.acceptDownloads ?? false,
      locale: options.use?.locale || 'en-US',
      timezoneId: options.use?.timezoneId || 'America/New_York',
      ...options.use,
    },
    projects: options.projects || [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ],
    webServer: options.webServer,
  })
}

/**
 * API testing configuration
 */
export function createAPITestConfig(options: PlaywrightTemplateConfig = {}): PlaywrightTestConfig {
  return createBasePlaywrightConfig({
    ...options,
    testDir: './tests/api',
    use: {
      ...options.use,
      baseURL: options.baseURL || 'http://localhost:3000/api',
      extraHTTPHeaders: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    },
    projects: [
      {
        name: 'api-tests',
        testMatch: '**/*.api.spec.ts',
      },
    ],
  })
}

/**
 * Mobile testing configuration
 */
export function createMobileTestConfig(
  options: PlaywrightTemplateConfig = {}
): PlaywrightTestConfig {
  return createBasePlaywrightConfig({
    ...options,
    testDir: './e2e/mobile',
    projects: [
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
      {
        name: 'Tablet',
        use: { ...devices['iPad Pro'] },
      },
    ],
  })
}

/**
 * Cross-browser testing configuration
 */
export function createCrossBrowserConfig(
  options: PlaywrightTemplateConfig = {}
): PlaywrightTestConfig {
  return createBasePlaywrightConfig({
    ...options,
    projects: [
      // Desktop browsers
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
      // Mobile browsers
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      {
        name: 'Mobile Safari',
        use: { ...devices['iPhone 12'] },
      },
      // Branded browsers
      {
        name: 'Microsoft Edge',
        use: { ...devices['Desktop Edge'], channel: 'msedge' },
      },
      {
        name: 'Google Chrome',
        use: { ...devices['Desktop Chrome'], channel: 'chrome' },
      },
    ],
  })
}

/**
 * Visual regression testing configuration
 */
export function createVisualTestConfig(
  options: PlaywrightTemplateConfig = {}
): PlaywrightTestConfig {
  return createBasePlaywrightConfig({
    ...options,
    testDir: './e2e/visual',
    expect: {
      ...options.expect,
      toHaveScreenshot: { threshold: 0.2, mode: 'pixel' },
      toMatchSnapshot: { threshold: 0.2 },
    },
    use: {
      ...options.use,
      screenshot: 'only-on-failure',
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
        testMatch: '**/*.visual.spec.ts',
      },
    ],
  })
}

/**
 * Test helper utilities
 */
export const PLAYWRIGHT_HELPERS = {
  pageObject: `// Base Page Object Model
import { Page, Locator, expect } from '@playwright/test'

export class BasePage {
  readonly page: Page
  readonly url: string

  constructor(page: Page, url: string = '') {
    this.page = page
    this.url = url
  }

  async goto() {
    await this.page.goto(this.url)
  }

  async waitForLoad() {
    await this.page.waitForLoadState('networkidle')
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: \`screenshots/\${name}.png\` })
  }

  async scrollToBottom() {
    await this.page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
  }

  async scrollToTop() {
    await this.page.evaluate(() => {
      window.scrollTo(0, 0)
    })
  }
}

// Example: Login Page Object
export class LoginPage extends BasePage {
  readonly emailInput: Locator
  readonly passwordInput: Locator
  readonly loginButton: Locator
  readonly errorMessage: Locator

  constructor(page: Page) {
    super(page, '/login')
    this.emailInput = page.locator('[data-testid="email-input"]')
    this.passwordInput = page.locator('[data-testid="password-input"]')
    this.loginButton = page.locator('[data-testid="login-button"]')
    this.errorMessage = page.locator('[data-testid="error-message"]')
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.loginButton.click()
  }

  async expectLoginError(message: string) {
    await expect(this.errorMessage).toContainText(message)
  }
}`,

  fixtures: `// Test fixtures for Playwright
import { test as base, expect } from '@playwright/test'
import { LoginPage } from './page-objects/LoginPage'
import { DashboardPage } from './page-objects/DashboardPage'

// Extend basic test with custom fixtures
type TestFixtures = {
  loginPage: LoginPage
  dashboardPage: DashboardPage
  authenticatedPage: any
}

export const test = base.extend<TestFixtures>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page)
    await use(loginPage)
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page)
    await use(dashboardPage)
  },

  authenticatedPage: async ({ page }, use) => {
    // Auto-login before each test that uses this fixture
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await page.waitForURL('/dashboard')
    await use(page)
  }
})

export { expect }`,

  apiHelpers: `// API testing helpers
import { APIRequestContext, expect } from '@playwright/test'

export class APIHelper {
  private request: APIRequestContext
  private baseURL: string
  private authToken?: string

  constructor(request: APIRequestContext, baseURL: string) {
    this.request = request
    this.baseURL = baseURL
  }

  async authenticate(email: string, password: string) {
    const response = await this.request.post(\`\${this.baseURL}/auth/login\`, {
      data: { email, password }
    })
    
    expect(response.ok()).toBeTruthy()
    const data = await response.json()
    this.authToken = data.token
    return data
  }

  async get(endpoint: string, options: any = {}) {
    return this.request.get(\`\${this.baseURL}\${endpoint}\`, {
      ...options,
      headers: {
        ...options.headers,
        ...(this.authToken && { 'Authorization': \`Bearer \${this.authToken}\` })
      }
    })
  }

  async post(endpoint: string, data: any, options: any = {}) {
    return this.request.post(\`\${this.baseURL}\${endpoint}\`, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(this.authToken && { 'Authorization': \`Bearer \${this.authToken}\` })
      }
    })
  }

  async put(endpoint: string, data: any, options: any = {}) {
    return this.request.put(\`\${this.baseURL}\${endpoint}\`, {
      data,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(this.authToken && { 'Authorization': \`Bearer \${this.authToken}\` })
      }
    })
  }

  async delete(endpoint: string, options: any = {}) {
    return this.request.delete(\`\${this.baseURL}\${endpoint}\`, {
      ...options,
      headers: {
        ...options.headers,
        ...(this.authToken && { 'Authorization': \`Bearer \${this.authToken}\` })
      }
    })
  }

  async expectStatus(response: any, status: number) {
    expect(response.status()).toBe(status)
  }

  async expectJSON(response: any, expectedData: any) {
    const data = await response.json()
    expect(data).toMatchObject(expectedData)
  }
}`,

  visualHelpers: `// Visual testing helpers
import { Page, expect } from '@playwright/test'

export class VisualHelper {
  private page: Page

  constructor(page: Page) {
    this.page = page
  }

  async compareFullPage(name: string, options: any = {}) {
    await expect(this.page).toHaveScreenshot(\`\${name}-full-page.png\`, {
      fullPage: true,
      ...options
    })
  }

  async compareElement(selector: string, name: string, options: any = {}) {
    const element = this.page.locator(selector)
    await expect(element).toHaveScreenshot(\`\${name}-element.png\`, options)
  }

  async compareViewport(name: string, options: any = {}) {
    await expect(this.page).toHaveScreenshot(\`\${name}-viewport.png\`, {
      fullPage: false,
      ...options
    })
  }

  async maskElements(selectors: string[]) {
    return {
      mask: selectors.map(selector => this.page.locator(selector))
    }
  }

  async waitForAnimations() {
    await this.page.waitForFunction(() => {
      return document.getAnimations().every(animation => 
        animation.playState === 'finished' || animation.playState === 'idle'
      )
    })
  }

  async disableAnimations() {
    await this.page.addStyleTag({
      content: \`
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      \`
    })
  }
}`,
}

/**
 * Example test files
 */
export const PLAYWRIGHT_EXAMPLES = {
  basicE2E: `// Basic E2E test example
import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load and display main content', async ({ page }) => {
    await page.goto('/')
    
    // Check page title
    await expect(page).toHaveTitle(/My App/)
    
    // Check main heading
    const heading = page.locator('h1')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText('Welcome')
    
    // Check navigation
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Take screenshot
    await page.screenshot({ path: 'homepage.png' })
  })

  test('should navigate to about page', async ({ page }) => {
    await page.goto('/')
    
    // Click about link
    await page.click('text=About')
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*about/)
    
    // Verify about content
    await expect(page.locator('h1')).toContainText('About')
  })
})`,

  apiTest: `// API testing example
import { test, expect } from '@playwright/test'

test.describe('API Tests', () => {
  test('should create and retrieve user', async ({ request }) => {
    // Create user
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com'
    }
    
    const createResponse = await request.post('/api/users', {
      data: newUser
    })
    
    expect(createResponse.ok()).toBeTruthy()
    const createdUser = await createResponse.json()
    expect(createdUser).toMatchObject(newUser)
    expect(createdUser.id).toBeDefined()
    
    // Retrieve user
    const getResponse = await request.get(\`/api/users/\${createdUser.id}\`)
    expect(getResponse.ok()).toBeTruthy()
    
    const retrievedUser = await getResponse.json()
    expect(retrievedUser).toMatchObject(createdUser)
  })

  test('should handle authentication', async ({ request }) => {
    // Login
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'password123'
      }
    })
    
    expect(loginResponse.ok()).toBeTruthy()
    const { token } = await loginResponse.json()
    expect(token).toBeDefined()
    
    // Use token for authenticated request
    const profileResponse = await request.get('/api/auth/profile', {
      headers: {
        'Authorization': \`Bearer \${token}\`
      }
    })
    
    expect(profileResponse.ok()).toBeTruthy()
    const profile = await profileResponse.json()
    expect(profile.email).toBe('test@example.com')
  })
})`,
}

/**
 * Package.json scripts for Playwright
 */
export const PLAYWRIGHT_SCRIPTS = {
  basic: {
    'test:e2e': 'playwright test',
    'test:e2e:headed': 'playwright test --headed',
    'test:e2e:debug': 'playwright test --debug',
    'test:e2e:report': 'playwright show-report',
  },

  comprehensive: {
    'test:e2e': 'playwright test',
    'test:e2e:headed': 'playwright test --headed',
    'test:e2e:debug': 'playwright test --debug',
    'test:e2e:ui': 'playwright test --ui',
    'test:e2e:report': 'playwright show-report',
    'test:e2e:chromium': 'playwright test --project=chromium',
    'test:e2e:firefox': 'playwright test --project=firefox',
    'test:e2e:webkit': 'playwright test --project=webkit',
    'test:e2e:mobile': 'playwright test --project="Mobile Chrome"',
    'test:e2e:api': 'playwright test tests/api',
    'test:e2e:visual': 'playwright test e2e/visual',
    'test:e2e:update-snapshots': 'playwright test --update-snapshots',
  },
}

/**
 * Dependencies for Playwright
 */
export const PLAYWRIGHT_DEPENDENCIES = {
  basic: {
    devDependencies: {
      '@playwright/test': '^1.40.0',
    },
  },

  comprehensive: {
    devDependencies: {
      '@playwright/test': '^1.40.0',
      '@axe-core/playwright': '^4.8.0',
    },
  },
}

export default {
  createBasePlaywrightConfig,
  createAPITestConfig,
  createMobileTestConfig,
  createCrossBrowserConfig,
  createVisualTestConfig,
  PLAYWRIGHT_HELPERS,
  PLAYWRIGHT_EXAMPLES,
  PLAYWRIGHT_SCRIPTS,
  PLAYWRIGHT_DEPENDENCIES,
}
