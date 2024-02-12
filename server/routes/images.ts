/*
  We've removed some Wasm files due the 1mb limit on Cloudflare Workers
  The paid plan has a 10mb limit if we need it
  If we were paying, we'd just use Cloudflare Images anyway
  Or maybe we could have a function per content type?
*/

import type { H3Event } from 'h3'
import { cacheApi } from 'cf-bindings-proxy'

import decodeJpeg, { init as initJpegDecWasm } from '@jsquash/jpeg/decode'
// import decodePng, { init as initPngDecWasm } from '@jsquash/png/decode'
// import decodeWebp, { init as initWebpDecWasm } from '@jsquash/webp/decode'
// import decodeAvif, { init as initAvifDecWasm } from '@jsquash/avif/decode'

// import encodeJpeg, { init as initJpegEncWasm } from '@jsquash/jpeg/encode'
// import encodePng, { init as initPngEncWasm } from '@jsquash/png/encode'
import encodeWebp, { init as initWebpEncWasm } from '@jsquash/webp/encode'
// import encodeAvif, { init as initAvifEncWasm } from '@jsquash/avif/encode'

import resize, { initResize } from '@jsquash/resize'

// @ts-expect-error
import JPEG_DEC_WASM from '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'
// import PNG_DEC_WASM from '@jsquash/png/codec/squoosh_png_bg.wasm'
// import WEBP_DEC_WASM from '@jsquash/webp/codec/dec/webp_dec.wasm'
// import AVIF_DEC_WASM from '@jsquash/avif/codec/dec/avif_dec.wasm'

// import JPEG_ENC_WASM from '@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm'
// This does not exist
// import PNG_ENC_WASM from '@jsquash/png/codec/squoosh_png_enc.wasm'
// @ts-expect-error
import WEBP_ENC_WASM from '@jsquash/webp/codec/enc/webp_enc_simd.wasm'
// import AVIF_ENC_WASM from '@jsquash/avif/codec/enc/avif_enc.wasm'

import RESIZE_WASM from '@jsquash/resize/lib/resize/squoosh_resize_bg.wasm'

const MIME_TYPE_JPEG = 'image/jpeg'
const MIME_TYPE_PNG = 'image/png'
const MIME_TYPE_WEBP = 'image/webp'
const MIME_TYPE_AVIF = 'image/avif'

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60
const CDN_CACHE_AGE = 6 * MONTH_IN_SECONDS // 6 Months

async function decode (sourceType: String, fileBuffer: ArrayBuffer): Promise<ImageData> {
  switch (sourceType) {
    case MIME_TYPE_JPEG: {
      await initJpegDecWasm(JPEG_DEC_WASM)
      return decodeJpeg(fileBuffer)
    }
    // case MIME_TYPE_PNG: {
    //   await initPngDecWasm(PNG_DEC_WASM)
    //   return decodePng(fileBuffer)
    // }
    // case MIME_TYPE_WEBP: {
    //   await initWebpDecWasm(WEBP_DEC_WASM)
    //   return decodeWebp(fileBuffer)
    // }
    // case MIME_TYPE_AVIF: {
    //   await initAvifDecWasm(AVIF_DEC_WASM)
    //   return decodeAvif(fileBuffer)
    // }
    default:
      throw new Error(`Unknown source type: ${sourceType}`)
  }
}

async function encode (outputType: String, imageData: ImageData): Promise<ArrayBuffer> {
  switch (outputType) {
    // case MIME_TYPE_JPEG: {
    //   await initJpegEncWasm(JPEG_ENC_WASM)
    //   return encodeJpeg(imageData)
    // }
    // case MIME_TYPE_PNG: {
    //   await initPngEncWasm(PNG_ENC_WASM)
    //   return encodePng(imageData)
    // }
    case MIME_TYPE_WEBP: {
      await initWebpEncWasm(WEBP_ENC_WASM)
      return encodeWebp(imageData)
    }
    // case MIME_TYPE_AVIF: {
    //   await initAvifEncWasm(AVIF_ENC_WASM)
    //   return encodeAvif(imageData)
    // }
    default:
      throw new Error(`Unknown output type: ${outputType}`)
  }
}

async function convert (contentType: String, outputType: String, fileBuffer: ArrayBuffer, width: number | null, height: number | null, fitMethod: 'stretch' | 'contain') {
  let imageData = await decode(contentType, fileBuffer)

  if (width && height) {
    await initResize(RESIZE_WASM)
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
  const fit = query.fit === 'contain' ? 'contain' : 'stretch'

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
