/**
 * Reconnect strategy foundation — for future WebSocket / SSE clients.
 */

export type ReconnectStrategyConfig = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterMs: number;
};

export const DEFAULT_RECONNECT_STRATEGY: ReconnectStrategyConfig = {
  maxAttempts: 8,
  baseDelayMs: 1_000,
  maxDelayMs: 30_000,
  jitterMs: 250,
};

export function reconnectDelay(
  attempt: number,
  config: ReconnectStrategyConfig = DEFAULT_RECONNECT_STRATEGY
): number | null {
  if (attempt >= config.maxAttempts) return null;
  const expo = Math.min(
    config.baseDelayMs * 2 ** attempt,
    config.maxDelayMs
  );
  const jitter = Math.floor(Math.random() * config.jitterMs);
  return expo + jitter;
}
