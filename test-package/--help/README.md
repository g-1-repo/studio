# --help

A G1 API project built with [@g-1/core](https://www.npmjs.com/package/@g-1/core).

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Visit your API docs at: http://localhost:8787/docs

## Project Structure

- `src/app.ts` - Main application entry point
- `src/routes/` - API route definitions
- `src/lib/` - Utility functions and configurations
- `src/db/` - Database schemas and migrations

## Built with G1 Core

This project uses [@g-1/core](https://www.npmjs.com/package/@g-1/core) which provides:

- ✅ **BaseRepository & BaseService** - Standardized data and business logic patterns
- ✅ **Authentication** - Better-auth integration with Cloudflare
- ✅ **Middleware** - Security, logging, error handling
- ✅ **Database** - Drizzle ORM with D1 integration
- ✅ **Utilities** - Validation, crypto, HTTP status helpers

## Learn More

- [G1 Core Documentation](https://github.com/g-1-repo/core)
- [Hono Framework](https://hono.dev/)
- [Cloudflare Workers](https://workers.cloudflare.com/)
