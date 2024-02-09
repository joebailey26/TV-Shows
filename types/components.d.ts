export { ShowCallback }

declare global {
  interface ShowCallback {
    (id: number): void;
  }
}