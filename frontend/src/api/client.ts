const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

interface ApiEnvelope<T> {
  success: boolean
  data: T
  error?: { code: string; message: string }
}

let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as ApiEnvelope<T>
  if (!response.ok || !body.success) {
    throw new Error(body.error?.message ?? 'No se pudo completar la operación.')
  }
  return body.data
}

export async function refreshAccessToken() {
  const response = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', credentials: 'include' })
  const data = await parseResponse<{ accessToken: string }>(response)
  setAccessToken(data.accessToken)
  return data.accessToken
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('content-type', 'application/json')
  if (accessToken) headers.set('authorization', `Bearer ${accessToken}`)

  const response = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: 'include' })
  if (response.status === 401 && retry && !path.startsWith('/auth/')) {
    await refreshAccessToken()
    return apiRequest<T>(path, init, false)
  }
  return parseResponse<T>(response)
}
