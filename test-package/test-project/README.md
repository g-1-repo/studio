# test-project

A G1 API Framework project

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) >= 1.0.0
- Node.js >= 18.0.0

### Installation

1. Install dependencies:
   ```bash
   bun install
   ```

2. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

The server will start on http://localhost:3000

## Available Scripts

- `bun run dev` - Start development server with hot reload
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run tests
- `bun run lint` - Lint code
- `bun run format` - Format code

## Project Structure

```
src/
├── index.ts          # Main application entry point
└── ...               # Add your modules here
```

## Built with G1 Framework

This project is built using the [G1 API Framework](https://github.com/g1-studio/api-framework), providing:

- 🚀 Fast development with Bun and Hono
- 🔌 Plugin system for extensibility
- 🛡️ Built-in security and middleware
- 📊 Database integration with Drizzle ORM
- 🧪 Testing setup with Vitest
- 📝 TypeScript support

## License

MIT
