import type { H3Event } from 'h3'
import { loadWasmModule } from '../../lib/loadWasmModule'
import {
  MIME_TYPE_JPEG,
  MIME_TYPE_PNG
  // MIME_TYPE_WEBP
  // MIME_TYPE_AVIF
} from './transform'
import { imageDataToBase64 } from '~/server/lib/imageData'

export function base64ToArrayBuffer (base64: string) {
  const buffer = Buffer.from(base64, 'base64')
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
}

export interface StringifiedImageData {
  width: number
  height: number
  data: string
}

export default defineEventHandler(async (event: H3Event): Promise<StringifiedImageData> => {
  const body = await readBody(event)

  if (!body) {
    throw createError({ statusMessage: 'You must pass a body', statusCode: 400 })
  }

  if (!body.fileType || !body.fileBuffer) {
    throw createError({ statusMessage: 'You must pass a fileType and fileBuffer', statusCode: 400 })
  }

  const fileType: string = body.fileType
  const fileBuffer: ArrayBuffer = base64ToArrayBuffer(body.fileBuffer)

  let imageData: ImageData

  switch (fileType) {
    case MIME_TYPE_JPEG: {
      const module = await import('@jsquash/jpeg/decode.js')
      await loadWasmModule('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm', module)
      imageData = await module.default(fileBuffer)
      break
    }
    case MIME_TYPE_PNG: {
      const module = await import('@jsquash/png/decode.js')
      await loadWasmModule('@jsquash/png/codec/squoosh_png_bg.wasm', module)
      imageData = await module.default(fileBuffer)
      break
    }
    // case MIME_TYPE_WEBP: {
    //   const module = await import('@jsquash/webp/decode.js')
    //   await loadWasmModule('@jsquash/webp/codec/dec/webp_dec.wasm', module)
    //   imageData = await module.default(fileBuffer)
    //   break
    // }
    // case MIME_TYPE_AVIF: {
    //   const module = await import('@jsquash/avif/decode.js')
    //   await loadWasmModule('@jsquash/avif/codec/dec/avif_dec.wasm', module)
    //   imageData = await module.default(fileBuffer)
    //   break
    // }
    default:
      throw new Error(`Unknown file type: ${fileType}`)
  }

  return {
    width: imageData.width,
    height: imageData.height,
    data: imageDataToBase64(imageData)
  }
})
