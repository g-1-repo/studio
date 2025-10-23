import type { D1Database, IncomingRequestCfProperties } from '@cloudflare/workers-types'

import type { Environment } from '@/env'
import type { MailService } from '@/lib/services/mail'
import process from 'node:process'
import { betterAuth } from 'better-auth'
import { withCloudflare } from 'better-auth-cloudflare'

import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { admin, anonymous, emailOTP, openAPI, organization, username } from 'better-auth/plugins'
import { createDb } from '@/db'
import { createMailService, TEMPLATE_NAMES } from '@/lib/services/mail'

function getMailer(env?: Environment): MailService | null {
  if (!env?.RESEND_API_KEY)
    return null
  return createMailService({
    provider: { type: 'resend', apiKey: env.RESEND_API_KEY },
  })
}

// Single auth configuration that handles both CLI and runtime scenarios
function createAuth(env?: Environment, cf?: IncomingRequestCfProperties) {
  // Use actual DB for runtime, empty object for CLI
  const { db } = env ? createDb(env) : ({} as any)

  const isDev = process.env.NODE_ENV === 'development'
  return betterAuth({
    ...withCloudflare(
      {
        autoDetectIpAddress: true,
        geolocationTracking: true,
        cf: cf || {},
        d1: env
          ? {
              db,
              options: {
                usePlural: true,
                debugLogs: isDev,
              },
            }
          : undefined,
        kv: env?.MY_API_PROJECT_KV_AUTH as import('@cloudflare/workers-types').KVNamespace<string>,
      },
      {
        user: {
          changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail, url }) => {
              const mailer = getMailer(env)
              if (mailer) {
                await mailer.send({
                  to: user.email,
                  template: TEMPLATE_NAMES.EMAIL_CHANGE_REQUEST,
                  templateArgs: [url, (user as typeof user & { username?: string }).username ?? '', user.name, newEmail],
                })
              }
            },
          },
        },
        account: {
          accountLinking: {
            allowDifferentEmails: true,
          },
        },
        databaseHooks: {
          user: {
            create: {
              before: async (user, ctx) => {
                if (ctx) {
                  const userCount = await ctx.context.adapter.count({ model: 'user' })
                  if (userCount === 0) {
                    (user as typeof user & { role?: string }).role = 'admin'
                  }
                }
                return { data: user }
              },
            },
          },
        },
        emailAndPassword: {
          enabled: true,
          requireEmailVerification: true,
          sendResetPassword: async ({ user, url }) => {
            const mailer = getMailer(env)
            if (mailer) {
              await mailer.send({
                to: user.email,
                template: TEMPLATE_NAMES.RESET_PASSWORD,
                templateArgs: [url, (user as typeof user & { username?: string }).username ?? '', user.name],
              })
            }
          },
        },
        emailVerification: {
          sendOnSignUp: true,
          minPasswordLength: 8,
          autoSignInAfterVerification: true,
          sendVerificationEmail: async ({ user, url }) => {
            const mailer = getMailer(env)
            if (mailer) {
              await mailer.send({
                to: user.email,
                template: TEMPLATE_NAMES.LOGIN_LINK_VERIFICATION,
                templateArgs: [url],
              })
            }
          },
        },
        plugins: [
          admin(),
          anonymous(),
          openAPI({
            // Explicit configuration for OpenAPI plugin
            enabled: true,
            path: '/openapi',
            info: {
              title: 'Better Auth API',
              version: '1.0.0',
              description: 'Authentication API endpoints',
            },
          }),
          organization(),
          username({
            usernameValidator: (username) => {
              if (username === 'admin') {
                return false
              }
              return true
            },
          }),
          emailOTP({
            async sendVerificationOTP({ email, otp }) {
              // Only send emails when mailer service is properly configured
              const mailer = getMailer(env)
              if (mailer) {
                await mailer.send({
                  to: email,
                  template: TEMPLATE_NAMES.LOGIN_OTP_VERIFICATION,
                  templateArgs: [otp],
                })
              }
            },
          }),
        ],
        rateLimit: {
          enabled: false, // Using custom rate limiting middleware instead
        },
      },
    ),
    // Add database adapter for both runtime and CLI
    database: env
      ? drizzleAdapter(db, {
          provider: 'sqlite',
          usePlural: true,
          debugLogs: isDev,
        })
      : drizzleAdapter({} as D1Database, {
          provider: 'sqlite',
          usePlural: true,
          debugLogs: isDev,
        }),
  })
}

// Export for runtime usage
export { createAuth }

// Export lazy auth instance for CLI schema generation
let _authInstance: ReturnType<typeof createAuth> | undefined
export const auth = {
  get $Infer() {
    if (!_authInstance) {
      _authInstance = createAuth()
    }
    return _authInstance.$Infer
  },
  handler: (...args: Parameters<ReturnType<typeof createAuth>['handler']>) => {
    if (!_authInstance) {
      _authInstance = createAuth()
    }
    return _authInstance.handler(...args)
  },
  api: (...args: any[]) => {
    if (!_authInstance) {
      _authInstance = createAuth()
    }
    return (_authInstance.api as any)(...args)
  },
}

export type Session = typeof auth.$Infer.Session
