import type { H3Event } from 'h3'
import { Auth } from '@auth/core'
import { getRequestHeaders, getRequestURL, readRawBody } from 'h3'
import { useAuthOptions } from '../../lib/auth'

export default defineEventHandler(async (event: H3Event) => {
  const runtimeConfig = useRuntimeConfig(event)

  const url = new URL(getRequestURL(event))
  const method = event.method
  const body = method === 'POST' ? await readRawBody(event) : undefined
  const request = new Request(url, { headers: getRequestHeaders(event), method, body })

  // CSRF Check
  if (request.method === 'POST') {
    const requestOrigin = request.headers.get('Origin')

    const serverOrigin = runtimeConfig.public.authJs.baseUrl

    if (serverOrigin !== requestOrigin) {
      // eslint-disable-next-line no-console
      console.error('CSRF protected', serverOrigin, requestOrigin)

      throw createError({ statusMessage: 'CSRF protected', statusCode: 500 })
    }
  }

  const options = await useAuthOptions(event)

  return Auth(request, options)
})
