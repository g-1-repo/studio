# Testing Helpers and Cookie Persistence

This project includes a small test helper that automatically persists cookies across requests during tests. This makes it easy to test authentication flows (e.g., anonymous sign-in) without manually extracting/forwarding `Set-Cookie` headers.

## Helpers

- requestWithCookies(app, path, init?, jarKey?)
  - Wraps Hono's app.request and automatically:
    - Sends previously stored cookies for a given jarKey
    - Captures `Set-Cookie` from the response and stores it for future requests
  - jarKey lets you isolate multiple logical sessions within a single test file.

- resetCookies(jarKey?)
  - Clears the cookie jar for the given key (default: "default").

- requestJSON(app, path, init, expected = 200, jarKey?)
  - Same as requestWithCookies, but asserts the expected status and returns parsed JSON.

- postJSON(app, path, body, expected = 200, jarKey?)
  - POST convenience wrapper around requestJSON.

- getOutbox(app, jarKey?) and clearOutbox(app, jarKey?)
  - Utility endpoints for the in-memory test mailbox.

These helpers live in `test/utils.ts`.

## Usage

```ts
import app from '@/app'
import { postJSON, requestJSON, requestWithCookies, resetCookies } from './utils'

// Start clean
const jar = 'example'
resetCookies(jar)

// Anonymous sign-in
await requestWithCookies(app, '/api/auth/sign-in/anonymous', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({}),
}, jar)

// Authenticated request reuses the session cookie automatically
const res = await requestWithCookies(app, '/protected', { method: 'GET' }, jar)
expect(res.status).toBe(200)

// JSON helpers
const { json } = await requestJSON(app, '/v1/early-access-requests', { method: 'GET' }, 200, jar)
```

## Guidance

- Prefer requestWithCookies/requestJSON/postJSON for any flow that may set or require cookies.
- Use distinct jarKey values to simulate multiple concurrent sessions in the same test.
- For non-auth routes, it’s fine to use the helpers for consistency (they are no-ops if no cookies are present).
- Avoid using `app.request` directly in tests unless you explicitly do not want cookie persistence.
