import crypto from 'node:crypto'
import { Base64 } from 'js-base64'

export const getAuthToken = async (): Promise<string> => {
  const serviceAccount = JSON.parse(__env__.GOOGLE_CREDENTIALS as string)

  const pem: string = serviceAccount.private_key.replaceAll('\n', '')

  const pemHeader = '-----BEGIN PRIVATE KEY-----'
  const pemFooter = '-----END PRIVATE KEY-----'

  if (!pem.startsWith(pemHeader) || !pem.endsWith(pemFooter)) {
    throw new Error('Invalid service account private key')
  }

  const pemContents: string = pem.substring(
    pemHeader.length,
    pem.length - pemFooter.length
  )

  const buffer = Base64.toUint8Array(pemContents)

  const algorithm = {
    name: 'RSASSA-PKCS1-v1_5',
    hash: {
      name: 'SHA-256'
    }
  }

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    buffer,
    algorithm,
    false,
    ['sign']
  )

  const header = Base64.encodeURI(
    JSON.stringify({
      alg: 'RS256',
      typ: 'JWT',
      kid: serviceAccount.private_key_id
    })
  )

  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600

  const payload = Base64.encodeURI(
    JSON.stringify({
      scope: 'https://www.googleapis.com/auth/calendar',
      iss: serviceAccount.client_email,
      sub: serviceAccount.client_email,
      aud: 'https://oauth2.googleapis.com/token',
      exp,
      iat
    })
  )

  const textEncoder = new TextEncoder()
  const inputArrayBuffer = textEncoder.encode(`${header}.${payload}`)

  const outputArrayBuffer = await crypto.subtle.sign(
    { name: 'RSASSA-PKCS1-v1_5' },
    privateKey,
    inputArrayBuffer
  )

  const signature = Base64.fromUint8Array(
    new Uint8Array(outputArrayBuffer),
    true
  )

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${header}.${payload}.${signature}`
  })

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}`)
  }

  const text = await response.text()

  return JSON.parse(text).access_token
}

export const callGoogleCalendarApi = async (token: string, endpoint: string, method: string, payload: object|null = null, calendarId = __env__.CALENDAR_ID): Promise<any> => {
  const requestUrl = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}${endpoint}`

  const response = await fetch(requestUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: payload ? JSON.stringify(payload) : null
  })

  if (!response.ok) {
    throw new Error(`Google API error: ${response.statusText}. Request URL: ${requestUrl}`)
  }

  const text = await response.text()

  return text ? JSON.parse(text) : {}
}
