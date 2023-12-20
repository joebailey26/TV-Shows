import type { H3Event } from 'h3'

const MIME_TYPE_JPEG = 'image/jpeg'
const MIME_TYPE_PNG = 'image/png'
const MIME_TYPE_WEBP = 'image/webp'
const MIME_TYPE_AVIF = 'image/avif'

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS // 6 Months

// @ts-expect-error
async function loadWasmModule (wasmUrl: string, module): Promise<void> {
  const wasm = await fetch(wasmUrl)
  if (!wasm.ok) {
    throw createError({ statusMessage: 'Could not load Wasm', statusCode: 500 })
  }
  const wasmBuffer = await wasm.arrayBuffer()
  const wasmModule = await WebAssembly.compile(wasmBuffer) as WebAssembly.Module
  await module.init(wasmModule)
}

async function decode (sourceType: String, fileBuffer: ArrayBuffer): Promise<ImageData> {
  switch (sourceType) {
    case MIME_TYPE_JPEG: {
      const module = await import('@jsquash/jpeg/decode')
      await loadWasmModule('https://unpkg.com/@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm', module)
      return await module.default(fileBuffer)
    }
    case MIME_TYPE_PNG: {
      const module = await import('@jsquash/png/decode')
      await loadWasmModule('https://unpkg.com/@jsquash/png/codec/squoosh_png_bg.wasm', module)
      return await module.default(fileBuffer)
    }
    case MIME_TYPE_WEBP: {
      const module = await import('@jsquash/webp/decode')
      await loadWasmModule('https://unpkg.com/@jsquash/webp/codec/dec/webp_dec.wasm', module)
      return await module.default(fileBuffer)
    }
    case MIME_TYPE_AVIF: {
      const module = await import('@jsquash/avif/decode')
      await loadWasmModule('https://unpkg.com/@jsquash/avif/codec/dec/avif_dec.wasm', module)
      return await module.default(fileBuffer)
    }
    default:
      throw new Error(`Unknown source type: ${sourceType}`)
  }
}

async function encode (outputType: String, imageData: ImageData): Promise<ArrayBuffer> {
  switch (outputType) {
    case MIME_TYPE_JPEG: {
      const module = await import('@jsquash/jpeg/encode')
      await loadWasmModule('https://unpkg.com/@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm', module)
      return await module.default(imageData)
    }
    case MIME_TYPE_PNG: {
      const module = await import('@jsquash/png/encode')
      await loadWasmModule('https://unpkg.com/@jsquash/png/codec/squoosh_png_enc.wasm', module)
      return await module.default(imageData)
    }
    case MIME_TYPE_WEBP: {
      const module = await import('@jsquash/webp/encode')
      await loadWasmModule('https://unpkg.com/@jsquash/webp/codec/enc/webp_enc_simd.wasm', module)
      return await module.default(imageData)
    }
    case MIME_TYPE_AVIF: {
      const module = await import('@jsquash/avif/encode')
      await loadWasmModule('https://unpkg.com/@jsquash/avif/codec/enc/avif_enc.wasm', module)
      return await module.default(imageData)
    }
    default:
      throw new Error(`Unknown output type: ${outputType}`)
  }
}

async function convert (contentType: String, outputType: String, fileBuffer: ArrayBuffer) {
  // ToDo
  //  Handle resizing
  const imageData = await decode(contentType, fileBuffer)
  return await encode(outputType, imageData)
}

export default defineEventHandler(async (event: H3Event) => {
  const query = getQuery(event)
  const isWebpSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_WEBP) ?? false
  const isAvifSupported = getRequestHeader(event, 'accept')?.includes(MIME_TYPE_AVIF) ?? false
  const imageUrl = query.u
  if (!imageUrl) {
    throw createError({ statusMessage: 'Bad request', statusCode: 404 })
  }
  // const width = query.w
  // const length = query.l
  // const fit = query.fit
  let imageBuffer

  // const cachedImage = await cache.match(imageUrl)
  // if (cachedImage) {
  //   // Return cached image if available
  //   imageData = await cachedImage.arrayBuffer()
  // } else {
  const imageFetch = await fetch(new URL(imageUrl.toString()))
  if (!imageFetch.ok) {
    throw createError({ statusMessage: 'Not found', statusCode: 404 })
  }

  // const cacheResponse = new Response(imageData)
  // event.context.waitUntil(cache.put(imageUrl, cacheResponse.clone()))

  imageBuffer = await imageFetch.arrayBuffer()
  // }
  const contentType = imageFetch.headers.get('content-type')

  if (!contentType) {
    throw createError({ statusMessage: 'Could not work out image content type', statusCode: 500 })
  }

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

  if (outputType) {
    // ToDo
    //  Check if image can be fetched from cache
    //  or
    imageBuffer = await convert(contentType, outputType, imageBuffer)
    // Store image in cache
    // Use waitUntil so you can return the response without blocking on
    // event.context.cloudflare.context.waitUntil(cache.put(cacheKey, response.clone()))
  }

  setHeader(event, 'Content-Type', outputType ?? contentType)
  setHeader(event, 'Cache-Control', `s-maxage=${CDN_CACHE_AGE}`)

  return new Response(imageBuffer)
})
