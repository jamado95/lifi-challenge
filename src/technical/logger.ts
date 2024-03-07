
export interface ILogger {
  debug(...args: unknown[]): unknown;
  warn(...args: unknown[]): unknown;
  error(...args: unknown[]): unknown;
  critical(...args: unknown[]): unknown;
}

const DEBUG = process.env.DEBUG;
const NO_LOGS = process.env.NO_LOGS;
export const MockLogger: ILogger = {
  debug(...args: unknown[]) { !NO_LOGS && DEBUG && console.log('[DEBUG]', ...args) },
  warn(...args: unknown[]) { !NO_LOGS && console.log('[WARN]', ...args) },
  error(...args: unknown[]) { !NO_LOGS && console.log('[ERROR]', ...args) },
  critical(...args: unknown[]) { !NO_LOGS && console.log('[CRITICAL]', ...args) },
}