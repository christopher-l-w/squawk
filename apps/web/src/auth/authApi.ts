import { getApiBaseUrl } from './config'

export type AuthUser = { id: string; email: string }

async function parseError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string }
    return body.error ?? `Request failed (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

export async function fetchMe(): Promise<AuthUser | null> {
  const base = getApiBaseUrl()
  if (!base) return null

  const res = await fetch(`${base}/auth/me`, { credentials: 'include' })
  if (res.status === 401) return null
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function registerRequest(
  email: string,
  password: string,
): Promise<AuthUser> {
  const base = getApiBaseUrl()
  if (!base) throw new Error('VITE_API_URL is not configured')

  const res = await fetch(`${base}/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function loginRequest(
  email: string,
  password: string,
): Promise<AuthUser> {
  const base = getApiBaseUrl()
  if (!base) throw new Error('VITE_API_URL is not configured')

  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    throw new Error(await parseError(res))
  }
  const data = (await res.json()) as { user: AuthUser }
  return data.user
}

export async function logoutRequest(): Promise<void> {
  const base = getApiBaseUrl()
  if (!base) return

  await fetch(`${base}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })
}
