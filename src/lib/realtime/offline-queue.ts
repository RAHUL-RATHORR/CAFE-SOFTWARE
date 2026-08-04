/**
 * Offline queue placeholder — stores events while disconnected.
 * No persistence beyond memory; no external sync.
 */

export type OfflineQueueItem = {
  id: string;
  event: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

class OfflineQueue {
  private items: OfflineQueueItem[] = [];
  private readonly maxSize = 100;

  enqueue(event: string, payload: Record<string, unknown>): OfflineQueueItem {
    const item: OfflineQueueItem = {
      id: `oq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.items.push(item);
    if (this.items.length > this.maxSize) {
      this.items = this.items.slice(-this.maxSize);
    }
    return item;
  }

  drain(): OfflineQueueItem[] {
    const drained = [...this.items];
    this.items = [];
    return drained;
  }

  peek(): OfflineQueueItem[] {
    return [...this.items];
  }

  size(): number {
    return this.items.length;
  }
}

export const offlineQueue = new OfflineQueue();
