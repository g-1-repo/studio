import { serveStatic } from 'hono/serve-static'

function favIcon() {
  return serveStatic({
    path: './favicon.ico',
    getContent: async (path) => {
      const fs = await import('node:fs/promises')
      try {
        const data = await fs.readFile(path)
        return new Response(data, {
          headers: { 'Content-Type': 'image/x-icon' },
        })
      }
      catch {
        return null
      }
    },
  })
}

export default favIcon
