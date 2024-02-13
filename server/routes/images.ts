/*
  We've removed some Wasm files due the 1mb limit on Cloudflare Workers
  The paid plan has a 10mb limit if we need it
  If we were paying, we'd just use Cloudflare Images anyway
  Or maybe we could have a function per content type?
*/

import type { H3Event } from 'h3'
import { cacheApi } from 'cf-bindings-proxy'

async function loadWasmModule (wasmPath: string, modulePath: string): Promise<Function> {
  // Import the JSquash Javascript module
  const module = await import(modulePath)
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
  if (modulePath.includes('resize')) {
    await module.initResize(wasmModule)
  } else {
    await module.init(wasmModule)
  }

  // Return the resize, decode, or encode function
  return module.default
}

const MIME_TYPE_JPEG = 'image/jpeg'
const MIME_TYPE_PNG = 'image/png'
const MIME_TYPE_WEBP = 'image/webp'
const MIME_TYPE_AVIF = 'image/avif'

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS // 6 Months

async function decode (sourceType: String, fileBuffer: ArrayBuffer): Promise<ImageData> {
  switch (sourceType) {
    case MIME_TYPE_JPEG: {
      const decode = await loadWasmModule('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm', '@jsquash/jpeg/decode.js')
      return decode(fileBuffer)
    }
    case MIME_TYPE_PNG: {
      const decode = await loadWasmModule('@jsquash/png/codec/squoosh_png_bg.wasm', '@jsquash/png/decode.js')
      return decode(fileBuffer)
    }
    // case MIME_TYPE_WEBP: {
    // const decode = await loadWasmModule('@jsquash/webp/codec/dec/webp_dec.wasm', '@jsquash/webp/decode.js')
    // return decode(fileBuffer)
    // }
    // case MIME_TYPE_AVIF: {
    // const decode = await loadWasmModule('@jsquash/avif/codec/dec/avif_dec.wasm', '@jsquash/avif/decode.js')
    // return decode(fileBuffer)
    // }
    default:
      throw new Error(`Unknown source type: ${sourceType}`)
  }
}

async function encode (outputType: String, imageData: ImageData): Promise<ArrayBuffer> {
  switch (outputType) {
    // case MIME_TYPE_JPEG: {
    // const encode = await loadWasmModule('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm', '@jsquash/jpeg/encode.js')
    // return encode(imageData)
    // }
    // case MIME_TYPE_PNG: {
    // const encode = await loadWasmModule('@jsquash/png/codec/squoosh_png_enc.wasm', '@jsquash/png/encode.js')
    // return encode(imageData)
    // }
    case MIME_TYPE_WEBP: {
      const encode = await loadWasmModule('@jsquash/webp/codec/enc/webp_enc_simd.wasm', '@jsquash/webp/encode.js')
      return encode(imageData)
    }
    // case MIME_TYPE_AVIF: {
    // const encode = await loadWasmModule('@jsquash/avif/codec/enc/avif_enc.wasm', '@jsquash/avif/encode.js')
    // return encode(imageData)
    // }
    default:
      throw new Error(`Unknown output type: ${outputType}`)
  }
}

async function convert (contentType: String, outputType: String, fileBuffer: ArrayBuffer, width: number | null, height: number | null, fitMethod: 'stretch' | 'contain') {
  let imageData = await decode(contentType, fileBuffer)

  if (width && height) {
    const resize = await loadWasmModule('@jsquash/resize/lib/resize/squoosh_resize_bg.wasm', '@jsquash/resize')
    imageData = await resize(imageData, { width, height, fitMethod })
  }

  return await encode(outputType, imageData)
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const imageUrl = query.u
  if (!imageUrl) {
    throw createError({ statusMessage: 'Bad request', statusCode: 404 })
  }

  const isWebpSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_WEBP) ?? false
  // const isAvifSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_AVIF) ?? false
  const isAvifSupported = false

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
  } else if (contentType === MIME_TYPE_PNG) {
    outputType = MIME_TYPE_PNG
  } else if (contentType === MIME_TYPE_JPEG) {
    outputType = MIME_TYPE_JPEG
  }
  if (!outputType) {
    throw createError({ statusMessage: 'Could not work out image output type', statusCode: 500 })
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
