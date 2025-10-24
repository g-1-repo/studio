import type { AppBindings } from '@g-1/core'
import { createRoute, OpenAPIHono } from '@hono/zod-openapi'

import { z } from 'zod'

const app = new OpenAPIHono<AppBindings>()

// Create a custom auth documentation endpoint as fallback
const authDocsSchema = {
  openapi: '3.0.0',
  info: {
    title: 'Better Auth API',
    version: '1.0.0',
    description: 'Authentication endpoints provided by Better Auth',
  },
  paths: {
    '/api/auth/sign-in/email': {
      post: {
        summary: 'Sign in with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Successfully signed in',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    session: { type: 'object' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/sign-up/email': {
      post: {
        summary: 'Sign up with email and password',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Successfully registered',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    session: { type: 'object' },
                  },
                },
              },
            },
          },
          400: { description: 'Registration failed' },
        },
      },
    },
    '/api/auth/sign-in/anonymous': {
      post: {
        summary: 'Sign in anonymously',
        tags: ['Authentication'],
        responses: {
          200: {
            description: 'Successfully signed in anonymously',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    session: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/sign-out': {
      post: {
        summary: 'Sign out current user',
        tags: ['Authentication'],
        responses: {
          200: { description: 'Successfully signed out' },
        },
      },
    },
    '/api/auth/get-session': {
      get: {
        summary: 'Get current session',
        tags: ['Session'],
        responses: {
          200: {
            description: 'Current session information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    user: { type: 'object' },
                    session: { type: 'object' },
                  },
                },
              },
            },
          },
          401: { description: 'Not authenticated' },
        },
      },
    },
    '/api/auth/send-verification-otp': {
      post: {
        summary: 'Send OTP for verification',
        tags: ['OTP'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email'],
                properties: {
                  email: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP sent successfully' },
          400: { description: 'Invalid email' },
        },
      },
    },
    '/api/auth/verify-otp': {
      post: {
        summary: 'Verify OTP code',
        tags: ['OTP'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'otp'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  otp: { type: 'string', length: 6 },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'OTP verified successfully' },
          400: { description: 'Invalid OTP' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      SessionAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
      },
    },
  },
  security: [{ SessionAuth: [] }],
}

// Custom auth docs route
const authDocsRoute = createRoute({
  method: 'get',
  path: '/auth-docs',
  responses: {
    200: {
      description: 'Better Auth OpenAPI schema',
      content: {
        'application/json': {
          schema: z.any(),
        },
      },
    },
  },
})

app.openapi(authDocsRoute, (c) => {
  return c.json(authDocsSchema)
})

export default app
