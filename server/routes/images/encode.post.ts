import type { H3Event } from 'h3'
import { loadWasmModule } from '../../lib/loadWasmModule'
import {
  // MIME_TYPE_JPEG,
  // MIME_TYPE_PNG,
  MIME_TYPE_WEBP,
  MIME_TYPE_AVIF
} from './transform'
import { imageDataFromBase64 } from '~/server/lib/imageData'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)

  if (!body) {
    throw createError({ statusMessage: 'You must pass a body', statusCode: 400 })
  }

  if (!body.fileType || !body.data || !body.width || !body.height) {
    throw createError({ statusMessage: 'You must pass a fileType and fileBuffer', statusCode: 400 })
  }

  const fileType: string = body.fileType
  const imageData: ImageData = imageDataFromBase64(body.data, body.width, body.height)

  let arrayBuffer: ArrayBuffer

  switch (fileType) {
    // case MIME_TYPE_JPEG: {
    //   const module = await import('@jsquash/jpeg/encode.js')
    //   await loadWasmModule('@jsquash/jpeg/codec/enc/mozjpeg_enc.wasm', module)
    //   arrayBuffer = await module.default(imageData)
    //   break
    // }
    // case MIME_TYPE_PNG: {
    //   const module = await import('@jsquash/png/encode.js')
    //   await loadWasmModule('@jsquash/png/codec/squoosh_png_enc.wasm', module)
    //   arrayBuffer = await module.default(imageData)
    //   break
    // }
    case MIME_TYPE_WEBP: {
      const module = await import('@jsquash/webp/encode.js')
      await loadWasmModule('@jsquash/webp/codec/enc/webp_enc_simd.wasm', module)
      arrayBuffer = await module.default(imageData)
      break
    }
    case MIME_TYPE_AVIF: {
      const module = await import('@jsquash/avif/encode.js')
      await loadWasmModule('@jsquash/avif/codec/enc/avif_enc.wasm', module)
      arrayBuffer = await module.default(imageData)
      break
    }
    default:
      throw new Error(`Unknown file type: ${fileType}`)
  }

  return {
    data: Buffer.from(arrayBuffer).toString('base64')
  }
})
