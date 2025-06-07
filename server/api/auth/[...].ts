import type { H3Event } from 'h3'
import { Auth } from '@auth/core'
import { getRequestHeaders, getRequestURL, readRawBody } from 'h3'
import type { ResponseInternal } from '@auth/core/types'
import { useAuthOptions } from '../../lib/auth'

export default defineEventHandler(async (event: H3Event): Promise<ResponseInternal> => {
  const url = new URL(getRequestURL(event))
  const method = event.method
  const body = method === 'POST' ? await readRawBody(event) : undefined
  const request = new Request(url, { headers: getRequestHeaders(event), method, body })

  // CSRF Check
  if (request.method === 'POST') {
    const requestOrigin = request.headers.get('Origin')

    // Prefer explicit config and fall back to Cloudflare's preview URL
    const serverOrigin =
      globalThis.__env__.NUXT_PUBLIC_AUTH_JS_BASE_URL ??
      globalThis.__env__.CF_PAGES_URL

    if (serverOrigin !== requestOrigin) {
      // eslint-disable-next-line no-console
      console.error('CSRF protected', serverOrigin, requestOrigin)

      throw createError({ statusMessage: 'CSRF protected', statusCode: 500 })
    }
  }

  const options = await useAuthOptions(event)

  const response = await Auth(request, options)

  return response
})
