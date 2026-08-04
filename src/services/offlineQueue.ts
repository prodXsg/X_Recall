import { OfflineQueueItem, SyncOperation } from './types';

const LS_QUEUE_KEY = 'xrecall_offline_queue';
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 1000;

class OfflineQueueService {
  private queue: Map<string, OfflineQueueItem> = new Map();
  private isOnline = navigator.onLine;
  private listeners: Set<(queue: OfflineQueueItem[]) => void> = new Set();
  private retryTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.loadFromStorage();
    this.setupListeners();
  }

  private loadFromStorage(): void {
    try {
      const saved = localStorage.getItem(LS_QUEUE_KEY);
      if (saved) {
        const items = JSON.parse(saved) as [string, OfflineQueueItem][];
        this.queue = new Map(items);
      }
    } catch (error) {
      console.warn('Failed to load offline queue:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(LS_QUEUE_KEY, JSON.stringify(Array.from(this.queue.entries())));
    } catch (error) {
      console.warn('Failed to save offline queue:', error);
    }
  }

  private setupListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      this.scheduleRetry();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  add(operation: SyncOperation): string {
    const id = `${operation.bookmarkId}-${Date.now()}-${Math.random()}`;
    const item: OfflineQueueItem = {
      id,
      operation,
      addedAt: Date.now(),
      attempts: 0,
    };
    this.queue.set(id, item);
    this.saveToStorage();
    this.notifyListeners();
    return id;
  }

  remove(id: string): void {
    this.queue.delete(id);
    this.saveToStorage();
    this.notifyListeners();
  }

  get(id: string): OfflineQueueItem | undefined {
    return this.queue.get(id);
  }

  getAll(): OfflineQueueItem[] {
    return Array.from(this.queue.values());
  }

  updateStatus(
    id: string,
    status: 'pending' | 'completed' | 'failed',
    error?: string,
  ): void {
    const item = this.queue.get(id);
    if (item) {
      item.operation.status = status;
      item.lastAttempt = Date.now();
      item.attempts += 1;
      if (error) item.error = error;

      this.saveToStorage();
      this.notifyListeners();

      if (status === 'completed') {
        this.remove(id);
      }
    }
  }

  getPendingOperations(): SyncOperation[] {
    return Array.from(this.queue.values())
      .filter(item => item.operation.status === 'pending')
      .map(item => item.operation);
  }

  getFailedOperations(): SyncOperation[] {
    return Array.from(this.queue.values())
      .filter(item => item.operation.status === 'failed' && item.attempts < MAX_RETRIES)
      .map(item => item.operation);
  }

  canRetry(id: string): boolean {
    const item = this.queue.get(id);
    if (!item) return false;
    return item.attempts < MAX_RETRIES;
  }

  subscribe(listener: (queue: OfflineQueueItem[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const queue = this.getAll();
    this.listeners.forEach(listener => {
      try {
        listener(queue);
      } catch (error) {
        console.error('Error in queue listener:', error);
      }
    });
  }

  scheduleRetry(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.notifyListeners();
    }, RETRY_DELAY_MS);
  }

  isQueueEmpty(): boolean {
    return this.queue.size === 0;
  }

  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  clear(): void {
    this.queue.clear();
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const offlineQueue = new OfflineQueueService();
