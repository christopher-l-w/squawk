import * as arctic from 'arctic'
import type { Context } from 'hono'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SEC } from '../auth/constants.js'
import { createSessionForUser } from '../auth/createSession.js'
import { findOrCreateUserFromOAuth } from '../auth/oauthUser.js'

const GOOGLE_STATE = 'squawk_oauth_google_state'
const GOOGLE_VERIFIER = 'squawk_oauth_google_code_verifier'

const OAUTH_COOKIE_MAX_AGE = 600

function oauthCookieOpts() {
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: OAUTH_COOKIE_MAX_AGE,
  }
}

function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    path: '/',
    sameSite: 'Lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE_SEC,
  })
}

function webOrigin(): string {
  return process.env.WEB_ORIGIN ?? 'http://localhost:5173'
}

function redirectOAuthError(c: Context, code: string) {
  return c.redirect(`${webOrigin()}/login?error=${encodeURIComponent(code)}`)
}

function redirectOAuthSuccess(c: Context) {
  return c.redirect(`${webOrigin()}/`)
}

/** Logs OAuth failures for debugging (terminal / server logs). */
function logOAuth(route: string, err: unknown): void {
  if (err instanceof arctic.OAuth2RequestError) {
    console.error(`[oauth] ${route} OAuth2RequestError`, {
      code: err.code,
      message: err.message,
      description: err.description,
    })
    return
  }
  if (err instanceof Error) {
    console.error(`[oauth] ${route}`, err.name, err.message, err.stack)
    return
  }
  console.error(`[oauth] ${route}`, err)
}

function googleConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REDIRECT_URI,
  )
}

function getGoogle() {
  return new arctic.Google(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )
}

export function createOAuthRoutes() {
  const r = new Hono()

  r.get('/providers', (c) => c.json({ google: googleConfigured() }))

  r.get('/google', async (c) => {
    if (!googleConfigured()) {
      return c.json({ error: 'Google OAuth is not configured' }, 501)
    }
    const google = getGoogle()
    const state = arctic.generateState()
    const codeVerifier = arctic.generateCodeVerifier()
    const url = google.createAuthorizationURL(state, codeVerifier, [
      'openid',
      'email',
      'profile',
    ])
    const opts = oauthCookieOpts()
    setCookie(c, GOOGLE_STATE, state, opts)
    setCookie(c, GOOGLE_VERIFIER, codeVerifier, opts)
    return c.redirect(url.toString())
  })

  r.get('/google/callback', async (c) => {
    if (!googleConfigured()) {
      return redirectOAuthError(c, 'oauth_not_configured')
    }
    if (c.req.query('error')) {
      console.error('[oauth] google/callback provider error', {
        error: c.req.query('error'),
        error_description: c.req.query('error_description'),
      })
      return redirectOAuthError(c, 'oauth_failed')
    }
    const code = c.req.query('code')
    const state = c.req.query('state')
    const storedState = getCookie(c, GOOGLE_STATE)
    const codeVerifier = getCookie(c, GOOGLE_VERIFIER)
    deleteCookie(c, GOOGLE_STATE, { path: '/' })
    deleteCookie(c, GOOGLE_VERIFIER, { path: '/' })
    if (
      !code ||
      !codeVerifier ||
      !state ||
      !storedState ||
      state !== storedState
    ) {
      return redirectOAuthError(c, 'oauth_state')
    }
    const google = getGoogle()
    try {
      const tokens = await google.validateAuthorizationCode(code, codeVerifier)
      const accessToken = tokens.accessToken()
      const res = await fetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      )
      if (!res.ok) {
        return redirectOAuthError(c, 'oauth_profile')
      }
      const profile = (await res.json()) as {
        sub: string
        email?: string
        name?: string
      }
      if (!profile.sub || !profile.email) {
        return redirectOAuthError(c, 'oauth_email')
      }
      const user = await findOrCreateUserFromOAuth(
        'google',
        profile.sub,
        profile.email,
        profile.name ?? null,
      )
      const sessionToken = await createSessionForUser(user.id)
      setSessionCookie(c, sessionToken)
      return redirectOAuthSuccess(c)
    } catch (err) {
      logOAuth('google/callback', err)
      return redirectOAuthError(c, 'oauth_failed')
    }
  })

  return r
}
