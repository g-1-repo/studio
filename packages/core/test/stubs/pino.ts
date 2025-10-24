// Pino stub for test environment
export default function pino() {
  return {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    trace: () => {},
    fatal: () => {},
    child: () => pino(),
  }
}

export const pino = pino
export { pino as default }