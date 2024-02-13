import type { H3Event } from 'h3'
import { cacheApi } from 'cf-bindings-proxy'

// @ts-expect-error
async function loadWasmModule (wasmPath: string, module): Promise<void> {
  let wasmModule

  // If in a development environment, load the module from remote
  // Ideally this should be handled by a vite loader but no such one exists
  if (process.env.NODE_ENV === 'development') {
    const wasm = await fetch(`https://unpkg.com/${wasmPath}`)
    if (!wasm.ok) {
      throw createError({ statusMessage: 'Could not load Wasm', statusCode: 500 })
    }
    const wasmBuffer = await wasm.arrayBuffer()
    wasmModule = await WebAssembly.compile(wasmBuffer) as WebAssembly.Module
  // If in production, the wasm files will be bundled
  } else {
    wasmModule = await import(wasmPath)
    wasmModule = wasmModule.default
  }

  // Initialise wasm
  // Hack for resize wasm which doesn't follow the same naming convention
  if (typeof module.initResize === 'function') {
    await module.initResize(wasmModule)
  } else {
    await module.init(wasmModule)
  }
}

const MIME_TYPE_JPEG = 'image/jpeg'
const MIME_TYPE_PNG = 'image/png'
const MIME_TYPE_WEBP = 'image/webp'

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS // 6 Months

async function decode (sourceType: string, fileBuffer: ArrayBuffer): Promise<ImageData> {
  switch (sourceType) {
    case MIME_TYPE_JPEG: {
      const module = await import('@jsquash/jpeg/decode.js')
      await loadWasmModule('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm', module)
      return module.default(fileBuffer)
    }
    case MIME_TYPE_PNG: {
      const module = await import('@jsquash/png/decode.js')
      await loadWasmModule('@jsquash/png/codec/pkg/squoosh_png_bg.wasm', module)
      return module.default(fileBuffer)
    }
    default:
      throw new Error(`Unknown source type: ${sourceType}`)
  }
}

async function convert (contentType: string, fileBuffer: ArrayBuffer, width: number | null, height: number | null, fitMethod: 'stretch' | 'contain'): Promise<ArrayBuffer> {
  let imageData = await decode(contentType, fileBuffer)

  if (width && height) {
    const module = await import('@jsquash/resize')
    await loadWasmModule('@jsquash/resize/lib/resize/squoosh_resize_bg.wasm', module)
    imageData = await module.default(imageData, { width, height, fitMethod })
  }

  const module = await import('@jsquash/webp/encode.js')
  await loadWasmModule('@jsquash/webp/codec/enc/webp_enc_simd.wasm', module)
  return module.default(imageData)
}

export default defineEventHandler(async (event: H3Event): Promise<ArrayBuffer> => {
  setHeader(event, 'Cache-Control', `s-maxage=${CDN_CACHE_AGE}`)

  const isWebpSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_WEBP) ?? false
  const bypassCache = getRequestHeader(event, 'Cache-Control') === 'no-cache'

  const cache = await cacheApi()
  // @ts-expect-error
  const cacheKey = new Request(new URL(event.node.req.url, `http://${event.node.req.headers.host}`), event.node.req)

  if (isWebpSupported && !bypassCache) {
    // @ts-expect-error
    const cachedImage = await cache.match(cacheKey)
    if (cachedImage) {
      setHeader(event, 'X-Image-Cache', 'Hit')
      setHeader(event, 'Content-Type', MIME_TYPE_WEBP)
      return cachedImage.arrayBuffer()
    }
    setHeader(event, 'X-Image-Cache', 'Miss')
  }
  setHeader(event, 'X-Image-Cache', 'Bypass')

  const query = getQuery(event)
  const imageUrl = query.u
  if (!imageUrl) {
    throw createError({ statusMessage: 'Bad request', statusCode: 404 })
  }

  const imageFetch = await fetch(new URL(imageUrl.toString()))
  if (!imageFetch.ok) {
    throw createError({ statusMessage: 'Not found', statusCode: 404 })
  }
  const imageBuffer = await imageFetch.arrayBuffer()

  const contentType = imageFetch.headers.get('content-type')
  if (!contentType) {
    throw createError({ statusMessage: 'Could not work out image content type', statusCode: 500 })
  }

  if (!isWebpSupported) {
    setHeader(event, 'Content-Type', contentType)
    return imageBuffer
  }

  let width = Array.isArray(query.w) ? query.w[0] : query.w
  width = (typeof width === 'string') ? parseInt(width) : null
  let height = Array.isArray(query.h) ? query.h[0] : query.h
  height = (typeof height === 'string') ? parseInt(height) : null
  const fit = query.fit === 'stretch' ? 'stretch' : 'contain'

  try {
    const image = await convert(contentType, imageBuffer, width, height, fit)

    setHeader(event, 'Content-Type', MIME_TYPE_WEBP)
    // @ts-expect-error
    event.waitUntil(await cache.put(cacheKey, new Response(image)))
    return image
  } catch (e) {
    setHeader(event, 'Content-Type', contentType)
    return imageBuffer
  }
})
