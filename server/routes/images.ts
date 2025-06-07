import type { H3Event } from 'h3'
import type { Cache, Response as CloudflareResponse } from '@cloudflare/workers-types'

interface WasmImageModule {
  init?: (module: WebAssembly.Module) => unknown
}

interface WasmResizeModule {
  initResize?: (module: WebAssembly.Module) => unknown
}

async function loadWasmModule (wasmPath: string, module: WasmImageModule|WasmResizeModule): Promise<void> {
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
  if ('initResize' in module && typeof module.initResize === 'function') {
    await module.initResize(wasmModule)
  } else if ('init' in module && typeof module.init === 'function') {
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

export default defineEventHandler(async (event: H3Event): Promise<Response|CloudflareResponse> => {
  setHeader(event, 'Cache-Control', `s-maxage=${CDN_CACHE_AGE}`)

  const isWebpSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_WEBP) ?? false
  const bypassCache = getRequestHeader(event, 'Cache-Control') === 'no-cache'

  const cache = (caches as unknown as { default: Cache }).default
  const cacheKey = new Request(new URL(event?.node?.req?.url ?? '', `http://${event.node.req.headers.host}`))

  if (isWebpSupported && !bypassCache) {
    const cachedImage = await cache.match(cacheKey as any)
    if (cachedImage) {
      setHeader(event, 'X-Image-Cache', 'Hit')
      setHeader(event, 'Content-Type', MIME_TYPE_WEBP)
      return cachedImage
    }
    setHeader(event, 'X-Image-Cache', 'Miss')
  }
  setHeader(event, 'X-Image-Cache', 'Bypass')

  const query = getQuery(event)
  const imageUrl = query.u
  if (!imageUrl) {
    throw createError({ statusMessage: 'Bad request', statusCode: 400 })
  }

  const url = new URL(imageUrl.toString())

  // Only allow processing of images on the static.episodate.com domain
  if (url.host !== 'static.episodate.com') {
    throw createError({ statusMessage: 'Bad request', statusCode: 400 })
  }

  const imageFetch = await fetch(url)
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
    return new Response(imageBuffer)
  }

  let width = Array.isArray(query.w) ? query.w[0] : query.w
  width = (typeof width === 'string') ? parseInt(width) : null
  let height = Array.isArray(query.h) ? query.h[0] : query.h
  height = (typeof height === 'string') ? parseInt(height) : null
  const fit = query.fit === 'stretch' ? 'stretch' : 'contain'

  try {
    const convertedImage = await convert(contentType, imageBuffer, width, height, fit)
    const response = new Response(convertedImage)
    setHeader(event, 'Content-Type', MIME_TYPE_WEBP)
    event.waitUntil(cache.put(cacheKey as any, response.clone() as any))
    return response
  } catch {
    setHeader(event, 'Content-Type', contentType)
    return new Response(imageBuffer)
  }
})
