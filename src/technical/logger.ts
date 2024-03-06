
export interface ILogger {
  debug(...args: unknown[]): unknown;
  warn(...args: unknown[]): unknown;
  error(...args: unknown[]): unknown;
  critical(...args: unknown[]): unknown;
}

const DEBUG = process.env.DEBUG;
export const MockLogger: ILogger = {
  debug(...args: unknown[]) { DEBUG && console.log('[DEBUG]', ...args) },
  warn(...args: unknown[]) { console.log('[WARN]', ...args) },
  error(...args: unknown[]) { console.log('[ERROR]', ...args) },
  critical(...args: unknown[]) { console.log('[CRITICAL]', ...args) },
}