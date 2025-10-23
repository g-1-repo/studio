# G1 Core API

**The G1 API Core** - A high-performance, enterprise TypeScript API boilerplate built for maximum scale and security. Powered by Hono, Cloudflare Workers, D1, and Better Auth. The foundation for your next profitable venture.

## 🚀 Quick Start

```bash
# 1. Install dependencies
bun install

# 2. Start development server
bun run dev                # http://localhost:8787

# 3. Run tests
bun run test

# 4. Check types and linting
bun run typecheck && bun run lint
```

<p align="left">
  <a href="https://workers.cloudflare.com/" target="_blank"><img alt="Cloudflare Workers" src="https://img.shields.io/badge/Cloudflare-Workers-orange?logo=cloudflare&logoColor=white"></a>
  <a href="https://hono.dev/" target="_blank"><img alt="Hono" src="https://img.shields.io/badge/Hono-4.x-673ab7"></a>
  <a href="https://bun.sh/" target="_blank"><img alt="Bun" src="https://img.shields.io/badge/Bun-%F0%9F%8D%80-black?logo=bun&logoColor=white"></a>
  <a href="https://orm.drizzle.team/" target="_blank"><img alt="Drizzle ORM" src="https://img.shields.io/badge/Drizzle-ORM-00c16e"></a>
  <a href="https://github.com/better-auth/better-auth" target="_blank"><img alt="Better Auth" src="https://img.shields.io/badge/Better%20Auth-%F0%9F%94%92-3b82f6"></a>
  <a href="#tests" target="_self"><img alt="Tests" src="https://img.shields.io/badge/Tests-Vitest-6e56cf"></a>
</p>

## ⭐ Key Features

- 🚀 **Cloudflare Workers + Hono** - Lightning-fast edge API with optimized middleware stack
- 🔐 **Better Auth** - Enterprise auth with anonymous login, email/password, OTP, multi-org support
- 🗄️ **Drizzle ORM + D1** - Type-safe database layer with automated migrations
- 📚 **OpenAPI Documentation** - Auto-generated docs with Scalar UI and Zod validation
- 🧪 **Enterprise Testing** - Vitest with Workers test pool, isolated environments
- 🛡️ **Security First** - Rate limiting, CORS, security headers, input validation
- 📦 **Production Ready** - Battle-tested patterns and enterprise architecture

## Quickstart

```bash
bun install
bun run dev            # http://localhost:8787
# in another tab
bun run test           # runs vitest in workers pool
bun run typecheck      # tsc --noEmit
bun run lint           # eslint
```

## 🏗️ Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ 🚀 Cloudflare Workers API (Hono Framework)                      │
│                                                                  │
│  🛡️ Middleware Stack:                                             │
│  ├─ favicon → health → env → ctx → security →                   │
│  │  validation → CORS → rate-limit → logging → auth → session   │
│                                                                  │
│  📁 API Routes:                                                  │
│  ├─ /, /protected, /api/auth/*, /v1/*                           │
│  ├─ /v1/early-access-requests, /v1/auth-docs                   │
│  └─ Error handling & not-found                                  │
│                                                                  │
│ 🔐 Authentication: Better Auth (Cloudflare adapter)             │
│  ├─ DB: D1 via Drizzle (users, sessions, accounts, orgs)        │
│  └─ KV: High-performance session management                      │
│                                                                  │
│ 🗄️ Data Layer: Drizzle ORM → Cloudflare D1 (SQLite)             │
└──────────────────────────────────────────────────────────────────┘
```

## 📚 Documentation

### Core Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system architecture and design patterns
- **[TESTING.md](./TESTING.md)** - Testing helpers, patterns, and best practices
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and release notes

### Development Guides

- **[WARP.md](./WARP.md)** - WARP AI assistant guidance and commands
- **[src/db/README.md](./src/db/README.md)** - Database structure and migration guides
- **[scripts/README.md](./scripts/README.md)** - Development scripts and automation tools

### Quick Navigation

- **Getting Started**: You're reading it! (README.md)
- **API Documentation**: Visit `/doc` when running locally
- **Database Schema**: Check `src/db/tables/` for table definitions
- **Environment Setup**: See `.env.example` and `wrangler.jsonc`

## Tests

- Uses Vitest with `@cloudflare/vitest-pool-workers`
- Cookie-aware helpers live in `test/utils.ts` (see [TESTING.md](./TESTING.md))
- Migrations applied automatically during test setup

---

<p align="center">
  <strong>Built for modern API development</strong><br>
  <em>Powered by Cloudflare Workers and TypeScript</em>
</p>
