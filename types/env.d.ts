export {}

declare global {
  const __env__: Record<string, string>
  var __env__: Record<string, string>
  interface GlobalThis {
    __env__: Record<string, string>
  }
}
