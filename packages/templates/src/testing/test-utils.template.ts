/**
 * Comprehensive test utilities and helpers
 */

import { randomBytes, randomUUID } from 'crypto'

/**
 * Test data generators
 */
export class TestDataGenerator {
  static randomString(length: number = 10): string {
    return randomBytes(length).toString('hex').slice(0, length)
  }

  static randomEmail(): string {
    return `test-${this.randomString(8)}@example.com`
  }

  static randomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }

  static randomNumber(min: number = 0, max: number = 1000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  static randomBoolean(): boolean {
    return Math.random() < 0.5
  }

  static randomDate(start?: Date, end?: Date): Date {
    const startTime = start?.getTime() || new Date(2020, 0, 1).getTime()
    const endTime = end?.getTime() || new Date().getTime()
    return new Date(startTime + Math.random() * (endTime - startTime))
  }

  static randomUUID(): string {
    return randomUUID()
  }

  static randomPhoneNumber(): string {
    const areaCode = this.randomNumber(200, 999)
    const exchange = this.randomNumber(200, 999)
    const number = this.randomNumber(1000, 9999)
    return `+1${areaCode}${exchange}${number}`
  }

  static randomAddress() {
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Elm Dr', 'Cedar Ln']
    const cities = ['Springfield', 'Franklin', 'Georgetown', 'Madison', 'Clinton']
    const states = ['CA', 'NY', 'TX', 'FL', 'IL']
    
    return {
      street: `${this.randomNumber(1, 9999)} ${streets[Math.floor(Math.random() * streets.length)]}`,
      city: cities[Math.floor(Math.random() * cities.length)],
      state: states[Math.floor(Math.random() * states.length)],
      zipCode: this.randomNumber(10000, 99999).toString()
    }
  }

  static createUser(overrides: any = {}) {
    return {
      id: this.randomUUID(),
      email: this.randomEmail(),
      password: this.randomPassword(),
      firstName: 'Test',
      lastName: 'User',
      phone: this.randomPhoneNumber(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static createPost(overrides: any = {}) {
    return {
      id: this.randomUUID(),
      title: `Test Post ${this.randomString(5)}`,
      content: `This is test content for post ${this.randomString(10)}`,
      authorId: this.randomUUID(),
      published: this.randomBoolean(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    }
  }

  static createApiKey(overrides: any = {}) {
    return {
      id: this.randomUUID(),
      name: `Test API Key ${this.randomString(5)}`,
      key: `ak_test_${this.randomString(32)}`,
      userId: this.randomUUID(),
      scopes: ['read', 'write'],
      isActive: true,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      ...overrides
    }
  }
}

/**
 * Mock factories
 */
export class MockFactory {
  static createMockRequest(overrides: any = {}) {
    return {
      method: 'GET',
      url: '/',
      path: '/',
      query: {},
      params: {},
      headers: {
        'content-type': 'application/json',
        'user-agent': 'test-agent'
      },
      body: null,
      cookies: {},
      ip: '127.0.0.1',
      ...overrides
    }
  }

  static createMockResponse() {
    const response = {
      status: 200,
      headers: {} as Record<string, string>,
      body: null as any,
      cookies: {} as Record<string, any>,
      
      setStatus: function(status: number) {
        this.status = status
        return this
      },
      
      setHeader: function(name: string, value: string) {
        this.headers[name] = value
        return this
      },
      
      setCookie: function(name: string, value: any, options: any = {}) {
        this.cookies[name] = { value, ...options }
        return this
      },
      
      json: function(data: any) {
        this.body = data
        this.headers['content-type'] = 'application/json'
        return this
      },
      
      text: function(data: string) {
        this.body = data
        this.headers['content-type'] = 'text/plain'
        return this
      },
      
      html: function(data: string) {
        this.body = data
        this.headers['content-type'] = 'text/html'
        return this
      },
      
      redirect: function(url: string, status: number = 302) {
        this.status = status
        this.headers['location'] = url
        return this
      }
    }
    
    return response
  }

  static createMockDatabase() {
    const data = new Map()
    
    return {
      data,
      
      async find(table: string, query: any = {}) {
        const tableData = data.get(table) || []
        if (Object.keys(query).length === 0) {
          return tableData
        }
        
        return tableData.filter((item: any) => {
          return Object.entries(query).every(([key, value]) => item[key] === value)
        })
      },
      
      async findOne(table: string, query: any) {
        const results = await this.find(table, query)
        return results[0] || null
      },
      
      async create(table: string, item: any) {
        const tableData = data.get(table) || []
        const newItem = { id: TestDataGenerator.randomUUID(), ...item }
        tableData.push(newItem)
        data.set(table, tableData)
        return newItem
      },
      
      async update(table: string, id: string, updates: any) {
        const tableData = data.get(table) || []
        const index = tableData.findIndex((item: any) => item.id === id)
        if (index === -1) return null
        
        tableData[index] = { ...tableData[index], ...updates }
        data.set(table, tableData)
        return tableData[index]
      },
      
      async delete(table: string, id: string) {
        const tableData = data.get(table) || []
        const index = tableData.findIndex((item: any) => item.id === id)
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
      
      async seed(table: string, items: any[]) {
        data.set(table, [...items])
      }
    }
  }

  static createMockLogger() {
    const logs: any[] = []
    
    return {
      logs,
      
      debug: function(message: string, meta?: any) {
        logs.push({ level: 'debug', message, meta, timestamp: new Date() })
      },
      
      info: function(message: string, meta?: any) {
        logs.push({ level: 'info', message, meta, timestamp: new Date() })
      },
      
      warn: function(message: string, meta?: any) {
        logs.push({ level: 'warn', message, meta, timestamp: new Date() })
      },
      
      error: function(message: string, meta?: any) {
        logs.push({ level: 'error', message, meta, timestamp: new Date() })
      },
      
      clear: function() {
        logs.length = 0
      },
      
      getLogs: function(level?: string) {
        return level ? logs.filter(log => log.level === level) : logs
      }
    }
  }

  static createMockCache() {
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
      
      async set(key: string, value: any, ttl?: number) {
        const item = {
          value,
          expiresAt: ttl ? Date.now() + ttl * 1000 : null
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
      }
    }
  }
}

/**
 * Test assertions and matchers
 */
export class TestAssertions {
  static async expectToThrow(fn: () => any, expectedError?: string | RegExp) {
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
          throw new Error(`Expected error message to contain "${expectedError}", got "${error.message}"`)
        }
      } else if (expectedError instanceof RegExp) {
        if (!expectedError.test(error.message)) {
          throw new Error(`Expected error message to match ${expectedError}, got "${error.message}"`)
        }
      }
    }
    
    return error
  }

  static expectToBeCloseTo(actual: number, expected: number, precision: number = 2) {
    const diff = Math.abs(actual - expected)
    const tolerance = Math.pow(10, -precision)
    
    if (diff > tolerance) {
      throw new Error(`Expected ${actual} to be close to ${expected} (precision: ${precision})`)
    }
  }

  static expectArrayToContain(array: any[], item: any) {
    if (!array.includes(item)) {
      throw new Error(`Expected array to contain ${JSON.stringify(item)}`)
    }
  }

  static expectObjectToHaveProperty(obj: any, property: string, value?: any) {
    if (!(property in obj)) {
      throw new Error(`Expected object to have property "${property}"`)
    }
    
    if (value !== undefined && obj[property] !== value) {
      throw new Error(`Expected property "${property}" to be ${JSON.stringify(value)}, got ${JSON.stringify(obj[property])}`)
    }
  }

  static expectStringToMatch(str: string, pattern: RegExp) {
    if (!pattern.test(str)) {
      throw new Error(`Expected string "${str}" to match pattern ${pattern}`)
    }
  }

  static expectDateToBeRecent(date: Date, maxAgeMs: number = 5000) {
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
export class TestUtils {
  static async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100
  ): Promise<void> {
    const start = Date.now()
    
    while (Date.now() - start < timeout) {
      if (await condition()) {
        return
      }
      await this.sleep(interval)
    }
    
    throw new Error(`Condition not met within ${timeout}ms`)
  }

  static async retry<T>(
    fn: () => T | Promise<T>,
    maxAttempts: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxAttempts) {
          throw lastError
        }
        
        await this.sleep(delay)
      }
    }
    
    throw lastError!
  }

  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  static createTempFile(content: string = '', extension: string = '.tmp'): string {
    const fs = require('fs')
    const path = require('path')
    const os = require('os')
    
    const tempDir = os.tmpdir()
    const fileName = `test-${TestDataGenerator.randomString(8)}${extension}`
    const filePath = path.join(tempDir, fileName)
    
    fs.writeFileSync(filePath, content)
    return filePath
  }

  static cleanupTempFile(filePath: string): void {
    const fs = require('fs')
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }

  static measureExecutionTime<T>(fn: () => T | Promise<T>): Promise<{ result: T; duration: number }> {
    return new Promise(async (resolve, reject) => {
      const start = performance.now()
      
      try {
        const result = await fn()
        const end = performance.now()
        resolve({ result, duration: end - start })
      } catch (error) {
        reject(error)
      }
    })
  }

  static createTestEnvironment(overrides: Record<string, string> = {}) {
    const originalEnv = { ...process.env }
    
    // Set test environment variables
    Object.assign(process.env, {
      NODE_ENV: 'test',
      LOG_LEVEL: 'error',
      DATABASE_URL: 'sqlite://memory',
      JWT_SECRET: 'test-secret',
      ...overrides
    })
    
    // Return cleanup function
    return () => {
      process.env = originalEnv
    }
  }

  static suppressConsole() {
    const originalMethods = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
      debug: console.debug
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
export class DatabaseTestHelpers {
  static async createTestDatabase(config: any = {}) {
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
      }
    }
  }

  static async seedTestData(db: any, data: Record<string, any[]>) {
    for (const [table, records] of Object.entries(data)) {
      for (const record of records) {
        await db.create(table, record)
      }
    }
  }

  static async clearTestData(db: any, tables: string[] = []) {
    if (tables.length === 0) {
      await db.clear()
    } else {
      for (const table of tables) {
        await db.clear(table)
      }
    }
  }
}

/**
 * HTTP test helpers
 */
export class HTTPTestHelpers {
  static createTestClient(baseURL: string) {
    return {
      async get(path: string, options: any = {}) {
        return this.request('GET', path, options)
      },
      
      async post(path: string, data?: any, options: any = {}) {
        return this.request('POST', path, { ...options, body: data })
      },
      
      async put(path: string, data?: any, options: any = {}) {
        return this.request('PUT', path, { ...options, body: data })
      },
      
      async delete(path: string, options: any = {}) {
        return this.request('DELETE', path, options)
      },
      
      async request(method: string, path: string, options: any = {}) {
        const url = `${baseURL}${path}`
        const config = {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers
          },
          body: options.body ? JSON.stringify(options.body) : undefined
        }
        
        const response = await fetch(url, config)
        
        return {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          json: () => response.json(),
          text: () => response.text(),
          ok: response.ok
        }
      }
    }
  }

  static async startTestServer(app: any, port: number = 0) {
    return new Promise((resolve, reject) => {
      const server = app.listen(port, (err: any) => {
        if (err) {
          reject(err)
        } else {
          const address = server.address()
          const actualPort = typeof address === 'object' ? address?.port : port
          resolve({
            server,
            port: actualPort,
            url: `http://localhost:${actualPort}`,
            close: () => new Promise(resolve => server.close(resolve))
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
  HTTPTestHelpers
}