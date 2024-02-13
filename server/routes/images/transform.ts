import type { H3Event } from 'h3'
import { cacheApi } from 'cf-bindings-proxy'
import { loadWasmModule } from '../../lib/loadWasmModule'
import { StringifiedImageData, base64ToArrayBuffer } from './decode.post'
import { imageDataFromBase64, imageDataToBase64 } from '~/server/lib/imageData'

export const MIME_TYPE_JPEG = 'image/jpeg'
export const MIME_TYPE_PNG = 'image/png'
export const MIME_TYPE_WEBP = 'image/webp'
export const MIME_TYPE_AVIF = 'image/avif'

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS // 6 Months

async function convert (contentType: String, outputType: String, fileBuffer: ArrayBuffer, width: number | null, height: number | null, fitMethod: 'stretch' | 'contain'): Promise<ArrayBuffer> {
  const decodeResponse = await fetch(`${process.env.NUXT_NEXTAUTH_URL}/images/decode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileType: contentType,
      fileBuffer: Buffer.from(fileBuffer).toString('base64')
    })
  })

  const { data, width: decodedWidth, height: decodedHeight } = await decodeResponse.json() as StringifiedImageData

  let imageData = imageDataFromBase64(data, decodedWidth, decodedHeight)

  if (width && height) {
    const module = await import('@jsquash/resize')
    await loadWasmModule('@jsquash/resize/lib/resize/squoosh_resize_bg.wasm', module)
    imageData = await module.default(imageData, { width, height, fitMethod })
  }

  const encodeResponse = await fetch(`${process.env.NUXT_NEXTAUTH_URL}/images/encode`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileType: outputType,
      width: imageData.width,
      height: imageData.height,
      data: imageDataToBase64(imageData)
    })
  })

  const { data: imageDataBuffer } = await encodeResponse.json()

  return base64ToArrayBuffer(imageDataBuffer)
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const imageUrl = query.u
  if (!imageUrl) {
    throw createError({ statusMessage: 'Bad request', statusCode: 404 })
  }

  const isWebpSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_WEBP) ?? false
  const isAvifSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_AVIF) ?? false

  let imageBuffer
  const imageFetch = await fetch(new URL(imageUrl.toString()))
  if (!imageFetch.ok) {
    throw createError({ statusMessage: 'Not found', statusCode: 404 })
  }
  imageBuffer = await imageFetch.arrayBuffer()

  const contentType = imageFetch.headers.get('content-type')
  if (!contentType) {
    throw createError({ statusMessage: 'Could not work out image content type', statusCode: 500 })
  }

  let width = Array.isArray(query.w) ? query.w[0] : query.w
  width = (typeof width === 'string') ? parseInt(width) : null
  let height = Array.isArray(query.h) ? query.h[0] : query.h
  height = (typeof height === 'string') ? parseInt(height) : null
  const fit = query.fit === 'stretch' ? 'stretch' : 'contain'

  let outputType
  if (isAvifSupported) {
    outputType = MIME_TYPE_AVIF
  } else if (isWebpSupported) {
    outputType = MIME_TYPE_WEBP
  } else {
    return imageBuffer
  }

  setHeader(event, 'Content-Type', outputType ?? contentType)
  setHeader(event, 'Cache-Control', `s-maxage=${CDN_CACHE_AGE}`)

  const cache = await cacheApi()
  // @ts-expect-error
  const cacheKey = new Request(new URL(`${event.node.req.url}?format=${outputType}`, `http://${event.node.req.headers.host}`), event.node.req)
  // @ts-expect-error
  const cachedImage = await cache.match(cacheKey)
  if (cachedImage) {
    setHeader(event, 'X-Image-Cache', 'Hit')
    return cachedImage
  }
  setHeader(event, 'X-Image-Cache', 'Miss')

  imageBuffer = await convert(contentType, outputType, imageBuffer, width, height, fit)
  const response = new Response(imageBuffer)
  // @ts-expect-error
  event.waitUntil(await cache.put(cacheKey, response.clone()))

  return response
})
