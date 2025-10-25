/**
 * Comprehensive test utilities and helpers
 */

import { randomUUID as cryptoRandomUUID, randomBytes } from 'node:crypto'

/**
 * Test data generators
 */
export namespace TestDataGenerator {
  export function randomString(length: number = 10): string {
    return randomBytes(length).toString('hex').slice(0, length)
  }

  export function randomEmail(): string {
    return `test-${TestDataGenerator.randomString(8)}@example.com`
  }

  export function randomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  export function randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  export function randomBoolean(): boolean {
    return Math.random() < 0.5
  }

  export function randomDate(start?: Date, end?: Date): Date {
    const startTime = start?.getTime() || new Date(2020, 0, 1).getTime()
    const endTime = end?.getTime() || Date.now()
    return new Date(startTime + Math.random() * (endTime - startTime))
  }

  export function randomUUID(): string {
    return cryptoRandomUUID()
  }

  export function randomPhoneNumber(): string {
    const areaCode = TestDataGenerator.randomNumber(200, 999)
    const exchange = TestDataGenerator.randomNumber(200, 999)
    const number = TestDataGenerator.randomNumber(1000, 9999)
    return `+1${areaCode}${exchange}${number}`
  }

  export function randomAddress() {
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln']
    const cities = ['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Clinton']
    const states = ['CA', 'NY', 'TX', 'FL', 'IL']

    return {
      street: `${TestDataGenerator.randomNumber(1, 9999)} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: TestDataGenerator.randomNumber(10000, 99999).toString(),
    }
  }

  export function createUser(overrides: Record<string, unknown> = {}) {
    return {
      id: TestDataGenerator.randomUUID(),
      email: TestDataGenerator.randomEmail(),
      password: TestDataGenerator.randomPassword(),
      firstName: 'Test',
      lastName: 'User',
      phone: TestDataGenerator.randomPhoneNumber(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  export function createPost(overrides: Record<string, unknown> = {}) {
    return {
      id: TestDataGenerator.randomUUID(),
      title: `Test Post ${TestDataGenerator.randomString(5)}`,
      content: `This is test content for post ${TestDataGenerator.randomString(10)}`,
      authorId: TestDataGenerator.randomUUID(),
      published: TestDataGenerator.randomBoolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }
  }

  export function createApiKey(overrides: Record<string, unknown> = {}) {
    return {
      id: TestDataGenerator.randomUUID(),
      name: `Test API Key ${TestDataGenerator.randomString(5)}`,
      key: `ak_test_${TestDataGenerator.randomString(32)}`,
      userId: TestDataGenerator.randomUUID(),
      scopes: ['read', 'write'],
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      ...overrides,
    }
  }
}

/**
 * Mock factories
 */
export namespace MockFactory {
  export function createMockRequest(overrides: Record<string, unknown> = {}) {
    return {
      method: 'GET',
      url: '/',
      path: '/',
      query: {},
      params: {},
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent',
      },
      body: null,
      cookies: {},
      ip: '127.0.0.1',
      ...overrides,
    }
  }

  export function createMockResponse() {
    const response = {
      status: 200,
      headers: {} as Record<string, string>,
      body: null as unknown,
      cookies: {} as Record<string, unknown>,

      setStatus: function (status: number) {
        this.status = status
        return this
      },

      setHeader: function (name: string, value: string) {
        this.headers[name] = value
        return this
      },

      setCookie: function (name: string, value: unknown, options: Record<string, unknown> = {}) {
        this.cookies[name] = { value, ...options }
        return this
      },

      json: function (data: unknown) {
        this.body = data
        this.headers['content-type'] = 'application/json'
        return this
      },

      text: function (data: string) {
        this.body = data
        this.headers['content-type'] = 'text/plain'
        return this
      },

      html: function (data: string) {
        this.body = data
        this.headers['content-type'] = 'text/html'
        return this
      },

      redirect: function (url: string, status: number = 302) {
        this.status = status
        this.headers.location = url
        return this
      },
    }

    return response
  }

  export function createMockDatabase() {
    const data = new Map()

    return {
      data,

      async find(table: string, query: Record<string, unknown> = {}) {
        const tableData = data.get(table) || []
        if (Object.keys(query).length === 0) {
          return tableData
        }

        return tableData.filter((item: Record<string, unknown>) => {
          return Object.entries(query).every(([key, value]) => item[key] === value)
        })
      },

      async findOne(table: string, query: Record<string, unknown>) {
        const results = await this.find(table, query)
        return results[0] || null
      },

      async create(table: string, item: Record<string, unknown>) {
        const tableData = data.get(table) || []
        const newItem = { id: TestDataGenerator.randomUUID(), ...item }
        tableData.push(newItem)
        data.set(table, tableData)
        return newItem
      },

      async update(table: string, id: string, updates: Record<string, unknown>) {
        const tableData = data.get(table) || []
        const index = tableData.findIndex((item: Record<string, unknown>) => item.id === id)
        if (index === -1) return null

        tableData[index] = { ...tableData[index], ...updates }
        data.set(table, tableData)
        return tableData[index]
      },

      async delete(table: string, id: string) {
        const tableData = data.get(table) || []
        const index = tableData.findIndex((item: Record<string, unknown>) => item.id === id)
        if (index === -1) return false

        tableData.splice(index, 1)
        data.set(table, tableData)
        return true
      },

      async clear(table?: string) {
        if (table) {
          data.delete(table)
        } else {
          data.clear()
        }
      },

      async seed(table: string, items: Record<string, unknown>[]) {
        data.set(table, [...items])
      },
    }
  }

  export function createMockLogger() {
    const logs: Record<string, unknown>[] = []

    return {
      logs,

      debug: (message: string, meta?: unknown) => {
        logs.push({ level: 'debug', message, meta, timestamp: new Date() })
      },

      info: (message: string, meta?: unknown) => {
        logs.push({ level: 'info', message, meta, timestamp: new Date() })
      },

      warn: (message: string, meta?: unknown) => {
        logs.push({ level: 'warn', message, meta, timestamp: new Date() })
      },

      error: (message: string, meta?: unknown) => {
        logs.push({ level: 'error', message, meta, timestamp: new Date() })
      },

      clear: () => {
        logs.length = 0
      },

      getLogs: (level?: string) => (level ? logs.filter(log => log.level === level) : logs),
    }
  }

  export function createMockCache() {
    const cache = new Map()

    return {
      async get(key: string) {
        const item = cache.get(key)
        if (!item) return null

        if (item.expiresAt && item.expiresAt < Date.now()) {
          cache.delete(key)
          return null
        }

        return item.value
      },

      async set(key: string, value: unknown, ttl?: number) {
        const item = {
          value,
          expiresAt: ttl ? Date.now() + ttl * 1000 : null,
        }
        cache.set(key, item)
      },

      async delete(key: string) {
        return cache.delete(key)
      },

      async clear() {
        cache.clear()
      },

      async has(key: string) {
        return cache.has(key)
      },

      async keys() {
        return Array.from(cache.keys())
      },
    }
  }
}

/**
 * Test assertions and matchers
 */
export namespace TestAssertions {
  export async function expectToThrow(fn: () => unknown, expectedError?: string | RegExp) {
    let error: Error | null = null

    try {
      await fn()
    } catch (e) {
      error = e as Error
    }

    if (!error) {
      throw new Error('Expected function to throw an error')
    }

    if (expectedError) {
      if (typeof expectedError === 'string') {
        if (!error.message.includes(expectedError)) {
          throw new Error(
            `Expected error message to contain "${expectedError}", got "${error.message}"`
          )
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(error.message)) {
          throw new Error(
            `Expected error message to match ${expectedError}, got "${error.message}"`
          )
        }
      }
    }

    return error
  }

  export function expectToBeCloseTo(actual: number, expected: number, precision: number = 2) {
    const diff = Math.abs(actual - expected)
    const tolerance = 10 ** -precision

    if (diff > tolerance) {
      throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`)
    }
  }

  export function expectArrayToContain(array: unknown[], item: unknown) {
    if (!array.includes(item)) {
      throw new Error(`Expected array to contain ${JSON.stringify(item)}`)
    }
  }

  export function expectObjectToHaveProperty(
    obj: Record<string, unknown>,
    property: string,
    value?: unknown
  ) {
    if (!(property in obj)) {
      throw new Error(`Expected object to have property "${property}"`)
    }

    if (value !== undefined && obj[property] !== value) {
      throw new Error(
        `Expected property "${property}" to be ${JSON.stringify(value)}, got ${JSON.stringify(obj[property])}`
      )
    }
  }

  export function expectStringToMatch(str: string, pattern: RegExp) {
    if (!pattern.test(str)) {
      throw new Error(`Expected string "${str}" to match pattern ${pattern}`)
    }
  }

  export function expectDateToBeRecent(date: Date, maxAgeMs: number = 5000) {
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    if (diff > maxAgeMs) {
      throw new Error(`Expected date to be recent (within ${maxAgeMs}ms), but it was ${diff}ms ago`)
    }
  }
}

/**
 * Test utilities
 */
export namespace TestUtils {
  export async function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  export async function waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now()

    while (Date.now() - start < timeout) {
      if (await condition()) {
        return
      }
      await TestUtils.sleep(interval)
    }

    throw new Error(`Condition not met within ${timeout}ms`)
  }

  export async function retry<T>(
    fn: () => T | Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error

        if (attempt === maxAttempts) {
          throw lastError
        }

        await TestUtils.sleep(delay)
      }
    }

    if (lastError) {
      throw lastError
    }

    throw new Error('Retry function completed without success or error')
  }

  export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  export function createTempFile(content: string = '', extension: string = '.tmp'): string {
    const fs = require('node:fs')
    const path = require('node:path')
    const os = require('node:os')

    const tempDir = os.tmpdir()
    const fileName = `test-${TestDataGenerator.randomString(8)}${extension}`
    const filePath = path.join(tempDir, fileName)

    fs.writeFileSync(filePath, content)
    return filePath
  }

  export function cleanupTempFile(filePath: string): void {
    const fs = require('node:fs')

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  }

  export async function measureExecutionTime<T>(
    fn: () => T | Promise<T>
  ): Promise<{ result: T; duration: number }> {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    return { result, duration: end - start }
  }

  export function createTestEnvironment(overrides: Record<string, string> = {}) {
    const originalEnv = { ...process.env }

    // Set test environment variables
    Object.assign(process.env, {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      DATABASE_URL: 'sqlite://memory',
      JWT_SECRET: 'test-secret',
      ...overrides,
    })

    // Return cleanup function
    return () => {
      process.env = originalEnv
    }
  }

  export function suppressConsole() {
    const originalMethods = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug,
    }

    // Suppress console output
    console.log = () => {}
    console.warn = () => {}
    console.error = () => {}
    console.info = () => {}
    console.debug = () => {}

    // Return restore function
    return () => {
      Object.assign(console, originalMethods)
    }
  }
}

/**
 * Database test helpers
 */
export namespace DatabaseTestHelpers {
  export async function createTestDatabase(_config: Record<string, unknown> = {}) {
    // This would be implemented based on your database choice
    // Example for SQLite in-memory database
    return {
      connectionString: 'sqlite://memory',
      migrate: async () => {
        // Run migrations
      },
      seed: async () => {
        // Seed test data
      },
      cleanup: async () => {
        // Clean up database
      },
    }
  }

  export async function seedTestData(
    db: Record<string, any>,
    data: Record<string, Record<string, unknown>[]>
  ) {
    for (const [table, records] of Object.entries(data)) {
      for (const record of records) {
        await (db as any).create(table, record)
      }
    }
  }

  export async function clearTestData(db: Record<string, any>, tables: string[] = []) {
    if (tables.length === 0) {
      await (db as any).clear()
    } else {
      for (const table of tables) {
        await (db as any).clear(table)
      }
    }
  }
}

/**
 * HTTP test helpers
 */
export namespace HTTPTestHelpers {
  export function createTestClient(baseURL: string) {
    return {
      async get(path: string, options: Record<string, unknown> = {}) {
        return this.request('GET', path, options)
      },

      async post(path: string, data?: unknown, options: Record<string, unknown> = {}) {
        return this.request('POST', path, { ...options, body: data })
      },

      async put(path: string, data?: unknown, options: Record<string, unknown> = {}) {
        return this.request('PUT', path, { ...options, body: data })
      },

      async delete(path: string, options: Record<string, unknown> = {}) {
        return this.request('DELETE', path, options)
      },

      async request(method: string, path: string, options: Record<string, unknown> = {}) {
        const url = `${baseURL}${path}`
        const config = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string> || {}),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        }

        const response = await fetch(url, config)

        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          json: () => response.json(),
          text: () => response.text(),
          ok: response.ok,
        }
      },
    }
  }

  export async function startTestServer(app: Record<string, unknown>, port: number = 0) {
    return new Promise((resolve, reject) => {
      const server = (app as any).listen(port, (err: unknown) => {
        if (err) {
          reject(err)
        } else {
          const address = (server as any).address()
          const actualPort = typeof address === 'object' ? address?.port : port
          resolve({
            server,
            port: actualPort,
            url: `http://localhost:${actualPort}`,
            close: () => new Promise(resolve => (server as any).close(resolve)),
          })
        }
      })
    })
  }
}

export default {
  TestDataGenerator,
  MockFactory,
  TestAssertions,
  TestUtils,
  DatabaseTestHelpers,
  HTTPTestHelpers,
}
