import { createHash, randomBytes } from 'node:crypto'
import type { Context, MiddlewareHandler } from 'hono'
import { createMiddleware } from 'hono/factory'
import { HTTPException } from 'hono/http-exception'

export interface OAuthProvider {
  name: string
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
  scope: string[]
  redirectUri: string
  pkce?: boolean
}

export interface OAuthConfig {
  providers: Record<string, OAuthProvider>
  sessionSecret: string
  cookieOptions?: {
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'strict' | 'lax' | 'none'
    domain?: string
    path?: string
  }
  onSuccess?: (user: OAuthUser, provider: string) => Promise<unknown>
  onError?: (error: Error, provider: string) => Promise<void>
}

export interface OAuthUser {
  id: string
  email?: string
  name?: string
  username?: string
  avatar?: string
  provider: string
  providerId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

/**
 * OAuth provider configurations
 */
export const OAUTH_PROVIDERS = {
  google: {
    name: 'Google',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
    scope: ['openid', 'email', 'profile'],
    pkce: true,
  },
  github: {
    name: 'GitHub',
    authUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userInfoUrl: 'https://api.github.com/user',
    scope: ['user:email'],
    pkce: false,
  },
  discord: {
    name: 'Discord',
    authUrl: 'https://discord.com/api/oauth2/authorize',
    tokenUrl: 'https://discord.com/api/oauth2/token',
    userInfoUrl: 'https://discord.com/api/users/@me',
    scope: ['identify', 'email'],
    pkce: true,
  },
  microsoft: {
    name: 'Microsoft',
    authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: ['openid', 'email', 'profile'],
    pkce: true,
  },
  twitter: {
    name: 'Twitter',
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    userInfoUrl: 'https://api.twitter.com/2/users/me',
    scope: ['tweet.read', 'users.read'],
    pkce: true,
  },
}

export class OAuthManager {
  private config: OAuthConfig
  private states = new Map<string, { provider: string; codeVerifier?: string; createdAt: number }>()

  constructor(config: OAuthConfig) {
    this.config = {
      cookieOptions: {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
      },
      ...config,
    }

    // Cleanup expired states every 10 minutes
    setInterval(() => this.cleanupExpiredStates(), 10 * 60 * 1000)
  }

  /**
   * Generate a secure random string
   */
  private generateRandomString(length = 32): string {
    return randomBytes(length).toString('base64url')
  }

  /**
   * Generate PKCE code verifier and challenge
   */
  private generatePKCE() {
    const codeVerifier = this.generateRandomString(32)
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url')

    return { codeVerifier, codeChallenge }
  }

  /**
   * Clean up expired OAuth states
   */
  private cleanupExpiredStates(): void {
    const now = Date.now()
    const expiry = 10 * 60 * 1000 // 10 minutes

    for (const [state, data] of this.states.entries()) {
      if (now - data.createdAt > expiry) {
        this.states.delete(state)
      }
    }
  }

  /**
   * Get configured providers
   */
  getProviders(): Record<string, OAuthProvider> {
    return this.config.providers
  }

  /**
   * Get authorization URL for a provider
   */
  getAuthorizationUrl(provider: string, redirectUri?: string): string {
    const providerConfig = this.config.providers[provider]
    if (!providerConfig) {
      throw new Error(`OAuth provider '${provider}' not configured`)
    }

    const state = this.generateRandomString()
    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      redirect_uri: redirectUri || providerConfig.redirectUri,
      scope: providerConfig.scope.join(' '),
      state,
      response_type: 'code',
    })

    let codeVerifier: string | undefined

    // Add PKCE parameters if supported
    if (providerConfig.pkce) {
      const pkce = this.generatePKCE()
      codeVerifier = pkce.codeVerifier
      params.append('code_challenge', pkce.codeChallenge)
      params.append('code_challenge_method', 'S256')
    }

    // Store state for verification
    this.states.set(state, {
      provider,
      codeVerifier,
      createdAt: Date.now(),
    })

    return `${providerConfig.authUrl}?${params.toString()}`
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(
    provider: string,
    code: string,
    state: string,
    redirectUri?: string
  ): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType?: string
  }> {
    const providerConfig = this.config.providers[provider]
    if (!providerConfig) {
      throw new Error(`OAuth provider '${provider}' not configured`)
    }

    // Verify state
    const stateData = this.states.get(state)
    if (!stateData || stateData.provider !== provider) {
      throw new Error('Invalid OAuth state')
    }

    // Clean up used state
    this.states.delete(state)

    const tokenParams = new URLSearchParams({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri || providerConfig.redirectUri,
    })

    // Add PKCE code verifier if used
    if (stateData.codeVerifier) {
      tokenParams.append('code_verifier', stateData.codeVerifier)
    }

    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: tokenParams.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Token exchange failed: ${error}`)
    }

    const tokenData = await response.json() as any

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type || 'Bearer',
    }
  }

  /**
   * Get user information from provider
   */
  async getUserInfo(provider: string, accessToken: string): Promise<OAuthUser> {
    const providerConfig = this.config.providers[provider]
    if (!providerConfig) {
      throw new Error(`OAuth provider '${provider}' not configured`)
    }

    const response = await fetch(providerConfig.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }

    const userData = await response.json() as Record<string, unknown>

    // Normalize user data based on provider
    return this.normalizeUserData(provider, userData, accessToken)
  }

  /**
   * Normalize user data from different providers
   */
  private normalizeUserData(
    provider: string,
    userData: Record<string, unknown>,
    accessToken: string
  ): OAuthUser {
    const baseUser: OAuthUser = {
      id: '',
      provider,
      providerId: '',
      accessToken,
    }

    switch (provider) {
      case 'google':
        return {
          ...baseUser,
          id: (userData.sub as string),
          providerId: (userData.sub as string),
          email: (userData.email as string | undefined),
          name: (userData.name as string | undefined),
          username: (userData.email as string | undefined),
          avatar: (userData.picture as string | undefined),
        }

      case 'github':
        return {
          ...baseUser,
          id: (userData.id as number).toString(),
          providerId: (userData.id as number).toString(),
          email: (userData.email as string | undefined),
          name: (userData.name as string | undefined),
          username: (userData.login as string | undefined),
          avatar: (userData.avatar_url as string | undefined),
        }

      case 'discord':
        return {
          ...baseUser,
          id: (userData.id as string),
          providerId: (userData.id as string),
          email: (userData.email as string | undefined),
          name: (userData.global_name as string) || (userData.username as string),
          username: (userData.username as string),
          avatar: userData.avatar
            ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
            : undefined,
        }

      case 'microsoft':
        return {
          ...baseUser,
          id: (userData.id as string),
          providerId: (userData.id as string),
          email: (userData.mail as string) || (userData.userPrincipalName as string),
          name: (userData.displayName as string),
          username: (userData.userPrincipalName as string),
        }

      case 'twitter':
        return {
          ...baseUser,
          id: (userData.id as string),
          providerId: (userData.id as string),
          name: (userData.name as string),
          username: (userData.username as string),
          avatar: (userData.profile_image_url as string | undefined),
        }

      default:
        return {
          ...baseUser,
          id: (userData.id as any)?.toString() || (userData.sub as string),
          providerId: (userData.id as any)?.toString() || (userData.sub as string),
          email: (userData.email as string | undefined),
          name: (userData.name as string | undefined) || (userData.display_name as string | undefined),
          username: (userData.username as string | undefined) || (userData.login as string | undefined),
          avatar: (userData.avatar_url as string | undefined) || (userData.picture as string | undefined),
        }
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(
    provider: string,
    refreshToken: string
  ): Promise<{
    accessToken: string
    refreshToken?: string
    expiresIn?: number
    tokenType?: string
  }> {
    const providerConfig = this.config.providers[provider]
    if (!providerConfig) {
      throw new Error(`OAuth provider '${provider}' not configured`)
    }

    const params = new URLSearchParams({
      client_id: providerConfig.clientId,
      client_secret: providerConfig.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    })

    const response = await fetch(providerConfig.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`)
    }

    const tokenData = await response.json() as any

    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type || 'Bearer',
    }
  }
}

/**
 * OAuth authentication middleware
 */
export function createOAuthMiddleware(oauthManager: OAuthManager): MiddlewareHandler {
  return createMiddleware(async (c, next) => {
    // Add OAuth manager to context
    c.set('oauth', oauthManager)
    return await next()
  })
}

/**
 * Create OAuth authentication routes
 */
export function createOAuthRoutes(
  oauthManager: OAuthManager,
  options: {
    onSuccess?: (user: OAuthUser) => Promise<unknown>
    onError?: (error: Error, provider: string) => Promise<void>
    successRedirect?: string
    errorRedirect?: string
  } = {}
) {
  return {
    // Start OAuth flow
    authorize: async (c: Context) => {
      const provider = c.req.param('provider')
      const redirectUri = c.req.query('redirect_uri')

      if (!provider) {
        throw new HTTPException(400, { message: 'Provider parameter required' })
      }

      try {
        const authUrl = oauthManager.getAuthorizationUrl(provider, redirectUri)
        return c.redirect(authUrl)
      } catch (error) {
        throw new HTTPException(400, { message: (error as Error).message })
      }
    },

    // Handle OAuth callback
    callback: async (c: Context) => {
      const provider = c.req.param('provider')
      const code = c.req.query('code')
      const state = c.req.query('state')
      const error = c.req.query('error')
      const redirectUri = c.req.query('redirect_uri')

      if (!provider) {
        throw new HTTPException(400, { message: 'Provider parameter required' })
      }

      if (error) {
        const errorMsg = c.req.query('error_description') || error
        if (options.onError) {
          await options.onError(new Error(errorMsg), provider)
        }

        if (options.errorRedirect) {
          return c.redirect(`${options.errorRedirect}?error=${encodeURIComponent(errorMsg)}`)
        }

        throw new HTTPException(400, { message: `OAuth error: ${errorMsg}` })
      }

      if (!code || !state) {
        throw new HTTPException(400, { message: 'Authorization code and state required' })
      }

      try {
        // Exchange code for token
        const tokenData = await oauthManager.exchangeCodeForToken(
          provider,
          code,
          state,
          redirectUri
        )

        // Get user info
        const user = await oauthManager.getUserInfo(provider, tokenData.accessToken)

        // Add token info to user
        user.refreshToken = tokenData.refreshToken
        user.expiresAt = tokenData.expiresIn ? Date.now() + tokenData.expiresIn * 1000 : undefined

        // Call success handler
        let result: unknown = user
        if (options.onSuccess) {
          result = await options.onSuccess(user)
        }

        // Redirect on success
        if (options.successRedirect) {
          const params = new URLSearchParams({
            provider,
            user_id: user.id,
            email: user.email || '',
            name: user.name || '',
          })
          return c.redirect(`${options.successRedirect}?${params.toString()}`)
        }

        return c.json({
          success: true,
          user: result,
          provider,
        })
      } catch (error) {
        if (options.onError) {
          await options.onError(error as Error, provider)
        }

        if (options.errorRedirect) {
          return c.redirect(
            `${options.errorRedirect}?error=${encodeURIComponent((error as Error).message)}`
          )
        }

        throw new HTTPException(500, {
          message: `OAuth callback failed: ${(error as Error).message}`,
        })
      }
    },

    // Get available providers
    providers: async (c: Context) => {
      const providers = Object.keys(oauthManager.getProviders()).map(key => ({
        name: key,
        displayName: OAUTH_PROVIDERS[key as keyof typeof OAUTH_PROVIDERS]?.name || key,
      }))

      return c.json({ providers })
    },

    // Refresh token endpoint
    refresh: async (c: Context) => {
      const { provider, refresh_token } = await c.req.json()

      if (!provider || !refresh_token) {
        throw new HTTPException(400, { message: 'Provider and refresh token required' })
      }

      try {
        const tokenData = await oauthManager.refreshToken(provider, refresh_token)
        return c.json({
          success: true,
          access_token: tokenData.accessToken,
          refresh_token: tokenData.refreshToken,
          expires_in: tokenData.expiresIn,
        })
      } catch (error) {
        throw new HTTPException(400, {
          message: `Token refresh failed: ${(error as Error).message}`,
        })
      }
    },
  }
}

/**
 * Helper function to create OAuth provider configuration
 */
export function createOAuthProvider(
  name: keyof typeof OAUTH_PROVIDERS,
  config: {
    clientId: string
    clientSecret: string
    redirectUri: string
    scope?: string[]
  }
): OAuthProvider {
  const baseConfig = OAUTH_PROVIDERS[name]
  if (!baseConfig) {
    throw new Error(`Unknown OAuth provider: ${name}`)
  }

  return {
    ...baseConfig,
    ...config,
    scope: config.scope || baseConfig.scope,
  }
}

export default OAuthManager
