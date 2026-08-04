/**
 * In-memory event bus foundation.
 * No WebSocket / SSE / external pub-sub — local process only.
 */

type EventHandler<T = unknown> = (payload: T) => void | Promise<void>;

class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler as EventHandler);
    this.handlers.set(event, set);
    return () => {
      set.delete(handler as EventHandler);
      if (set.size === 0) this.handlers.delete(event);
    };
  }

  async emit<T = unknown>(event: string, payload: T): Promise<void> {
    const set = this.handlers.get(event);
    if (!set?.size) return;
    await Promise.all(
      [...set].map(async (handler) => {
        try {
          await handler(payload);
        } catch {
          /* swallow — foundation only */
        }
      })
    );
  }

  clear(): void {
    this.handlers.clear();
  }
}

/** Singleton process-local bus — ready for future realtime adapters. */
export const eventBus = new EventBus();
