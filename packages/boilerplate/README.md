# @g-1/boilerplate

A clean, production-ready API boilerplate built with the @g-1/core framework.

## Features

- 🚀 Built on Cloudflare Workers for edge performance
- 🔐 Authentication with better-auth
- 📊 Database integration with Drizzle ORM
- 🛡️ Comprehensive security middleware
- 📝 OpenAPI documentation with Scalar
- ⚡ Rate limiting and request validation
- 🧪 Testing setup with Vitest
- 📦 Modular architecture with @g-1/templates

## Quick Start

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Generate authentication secret:**
   ```bash
   bun run auth:generate
   ```

4. **Set up database:**
   ```bash
   bun run db:generate
   bun run db:migrate
   ```

5. **Start development server:**
   ```bash
   bun run dev
   ```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BETTER_AUTH_SECRET` | Secret key for authentication (min 32 chars) | Yes |
| `BETTER_AUTH_URL` | Base URL for auth callbacks | Yes |
| `RESEND_API_KEY` | API key for email service | No |
| `FROM_EMAIL` | Email address for outgoing emails | No |

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run deploy` - Deploy to Cloudflare Workers
- `bun run test` - Run tests
- `bun run lint` - Lint code
- `bun run db:generate` - Generate database migrations
- `bun run db:migrate` - Apply database migrations

## Architecture

This boilerplate uses the @g-1/core framework which provides:

- **Core Framework** (`@g-1/core`): Router, middleware, utilities
- **Templates** (`@g-1/templates`): Pre-built auth, database, and API routes
- **Utilities** (`@g-1/util`): Shared utility functions

## Deployment

1. **Configure Cloudflare:**
   ```bash
   bun run cf:login
   ```

2. **Set up D1 database:**
   ```bash
   wrangler d1 create g1-api-db
   # Update wrangler.toml with database_id
   ```

3. **Set up KV namespace:**
   ```bash
   wrangler kv:namespace create "MY_API_PROJECT_KV_AUTH"
   # Update wrangler.toml with namespace id
   ```

4. **Deploy:**
   ```bash
   bun run deploy
   ```

## License

MIT