// @ts-expect-error
export async function loadWasmModule (wasmPath: string, module): Promise<void> {
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
