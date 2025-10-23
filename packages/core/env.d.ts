/// <reference types="@cloudflare/workers-types" />

declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database
    TEST_MIGRATIONS: string
    NODE_ENV: string
  }

  interface CloudflareBindings {
    DB: D1Database
    TEST_MIGRATIONS: string
    KV_AUTH: KVNamespace
  }

  export const env: ProvidedEnv
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends CloudflareBindings {}
  }
}
