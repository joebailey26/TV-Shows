
import { Auth } from '@auth/core'
import type { RuntimeConfig } from 'nuxt/schema'

import { H3Event, getRequestHeaders, getRequestURL, readRawBody } from 'h3'
import { useAuthOptions } from '../../lib/auth'

function checkOrigin (request: Request, runtimeConfig: RuntimeConfig) {
  if (process.env.NODE_ENV === 'development') { return }
  if (request.method !== 'POST') { return }
  const requestOrigin = request.headers.get('Origin')
  const serverOrigin = runtimeConfig.public?.authJs?.baseUrl
  if (serverOrigin !== requestOrigin) { throw new Error('CSRF protected') }
}
async function getRequestFromEvent (event: H3Event) {
  const url = new URL(getRequestURL(event))
  const method = event.method
  const body = method === 'POST' ? await readRawBody(event) : undefined
  return new Request(url, { headers: getRequestHeaders(event) as HeadersInit, method, body })
}

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig()

  const authOptions = await useAuthOptions(event)

  const request = await getRequestFromEvent(event)

  if (request.url.includes('.js.map')) {
    return
  }

  checkOrigin(request, runtimeConfig)

  const response = await Auth(request, authOptions)

  return response
})
