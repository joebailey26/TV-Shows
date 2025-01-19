function delay (ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function executeInBatches (promises: Array<() => Promise<any>>, batchSize: number, delayMs: number) {
  for (let i = 0; i < promises.length; i += batchSize) {
    const batch = promises.slice(i, i + batchSize).map(fn => fn())
    await Promise.all(batch) // Execute batch
    if (i + batchSize < promises.length) {
      await delay(delayMs) // Delay before next batch
    }
  }
}
