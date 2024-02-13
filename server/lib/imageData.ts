export function imageDataToBase64 (imageData: ImageData): string {
  const buffer = Buffer.from(imageData.data)
  return buffer.toString('base64')
}

export function imageDataFromBase64 (data: string, width: number, height: number): ImageData {
  const imageDataBuffer = Buffer.from(data, 'base64')
  return new ImageData(new Uint8ClampedArray(imageDataBuffer), width, height)
}
