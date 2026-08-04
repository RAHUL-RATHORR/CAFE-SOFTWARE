/**
 * Polling strategy foundation for the Notification Center.
 * No background workers — client may invoke these helpers.
 */

export type PollingStrategyConfig = {
  intervalMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  backoffMultiplier: number;
  enabled: boolean;
};

export const DEFAULT_POLLING_STRATEGY: PollingStrategyConfig = {
  intervalMs: 30_000,
  minIntervalMs: 10_000,
  maxIntervalMs: 120_000,
  backoffMultiplier: 1.5,
  enabled: true,
};

export function nextPollingInterval(
  currentMs: number,
  config: PollingStrategyConfig = DEFAULT_POLLING_STRATEGY,
  hadError = false
): number {
  if (!config.enabled) return config.maxIntervalMs;
  if (!hadError) return config.intervalMs;
  return Math.min(
    Math.round(currentMs * config.backoffMultiplier),
    config.maxIntervalMs
  );
}
