import { SyncStatus, SyncEvent, SyncOperation } from './types';
import { mockBackend } from './mockBackend';
import { conflictResolver } from './conflictResolver';
import { crossTabSync } from './crossTabSync';
import { offlineQueue } from './offlineQueue';

type SyncListener = (event: SyncEvent) => void;

class SyncManager {
  private status: SyncStatus = 'synced';
  private listeners: Set<SyncListener> = new Set();
  private operationVersions: Map<number, number> = new Map();
  private lastSyncTime: number = 0;
  private autoRetryTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
    this.syncVersionsFromBackend();
  }

  private async syncVersionsFromBackend(): Promise<void> {
    try {
      const allBookmarks = await mockBackend.getAll();
      allBookmarks.forEach(bookmark => {
        this.operationVersions.set(bookmark.id, bookmark.version);
        console.log(`[SyncManager] 🔄 Synced version for bookmark ${bookmark.id}: v${bookmark.version}`);
      });
    } catch (error) {
      console.warn('[SyncManager] Failed to sync versions from backend:', error);
    }
  }

  private initialize(): void {
    // Listen to cross-tab sync events
    crossTabSync.subscribe((event: SyncEvent) => {
      console.log('[SyncManager] 📥 Cross-tab sync event received:', event.type, event);
      if (event.type === 'bookmark:created' || event.type === 'bookmark:updated') {
        // Track versions from OTHER tabs only (not from own broadcasts)
        if (event.bookmarkId && event.sourceTab && event.sourceTab !== crossTabSync.getTabId()) {
          console.log(`[SyncManager] 🔄 Syncing version for ${event.bookmarkId} from ${event.sourceTab}`);
          const version = (this.operationVersions.get(event.bookmarkId) || 0) + 1;
          this.operationVersions.set(event.bookmarkId, version);
        } else if (event.bookmarkId && event.sourceTab === crossTabSync.getTabId()) {
          console.log(`[SyncManager] ⊘ Ignoring version update for own bookmark:${event.type} broadcast`);
        }
      }
      console.log('[SyncManager] ✓ Emitting to local subscribers');
      this.emitEvent(event);
    });

    // Listen to offline queue changes
    offlineQueue.subscribe(() => {
      this.processPendingQueue();
    });

    // Retry failed operations periodically
    this.startAutoRetry();
  }

  /**
   * Create a new bookmark with sync
   */
  async createBookmark(
    bookmarkId: number,
    categoryId: string,
    data: unknown,
  ): Promise<SyncOperation> {
    const timestamp = Date.now();
    const version = (this.operationVersions.get(bookmarkId) || 0) + 1;
    this.operationVersions.set(bookmarkId, version);

    const operation: SyncOperation = {
      id: `${bookmarkId}-${timestamp}`,
      type: 'create',
      bookmarkId,
      categoryId,
      payload: { data },
      timestamp,
      version,
      status: 'pending',
      retryCount: 0,
    };

    this.setStatus('pending');

    try {
      const result = await mockBackend.create(bookmarkId, data, timestamp);
      operation.status = 'completed';
      this.setStatus('synced');
      this.lastSyncTime = Date.now();

      this.emitEvent({
        type: 'bookmark:created',
        bookmarkId,
        timestamp,
      });

      crossTabSync.broadcast({
        type: 'bookmark:created',
        bookmarkId,
        timestamp,
      });

      return operation;
    } catch (error) {
      operation.status = 'failed';
      operation.error = String(error);
      offlineQueue.add(operation);
      this.setStatus('offline');
      return operation;
    }
  }

  /**
   * Update an existing bookmark with sync
   */
  async updateBookmark(
    bookmarkId: number,
    categoryId: string,
    data: unknown,
  ): Promise<SyncOperation> {
    const timestamp = Date.now();
    const expectedVersion = this.operationVersions.get(bookmarkId) || 0;
    const version = expectedVersion + 1;
    this.operationVersions.set(bookmarkId, version);

    const operation: SyncOperation = {
      id: `${bookmarkId}-${timestamp}`,
      type: 'update',
      bookmarkId,
      categoryId,
      payload: { data },
      timestamp,
      version,
      status: 'pending',
      retryCount: 0,
    };

    this.setStatus('pending');

    try {
      const result = await mockBackend.update(
        bookmarkId,
        data,
        timestamp,
        expectedVersion,
      );
      operation.status = 'completed';
      this.setStatus('synced');
      this.lastSyncTime = Date.now();

      this.emitEvent({
        type: 'bookmark:updated',
        bookmarkId,
        timestamp,
      });

      crossTabSync.broadcast({
        type: 'bookmark:updated',
        bookmarkId,
        timestamp,
      });

      return operation;
    } catch (error) {
      operation.status = 'failed';
      operation.error = String(error);

      if (String(error).includes('Version mismatch')) {
        this.emitEvent({
          type: 'conflict:detected',
          bookmarkId,
          timestamp,
        });
      }

      offlineQueue.add(operation);
      this.setStatus('offline');
      return operation;
    }
  }

  /**
   * Delete a bookmark with sync
   */
  async deleteBookmark(bookmarkId: number): Promise<SyncOperation> {
    const timestamp = Date.now();
    const expectedVersion = this.operationVersions.get(bookmarkId) || 0;

    console.log(`[SyncManager] 🗑️ Deleting bookmark ${bookmarkId} with expectedVersion=${expectedVersion}`);

    const operation: SyncOperation = {
      id: `${bookmarkId}-${timestamp}`,
      type: 'delete',
      bookmarkId,
      categoryId: '',
      payload: {},
      timestamp,
      version: expectedVersion,
      status: 'pending',
      retryCount: 0,
    };

    this.setStatus('pending');

    try {
      await mockBackend.delete(bookmarkId, expectedVersion);
      console.log(`[SyncManager] ✓ Delete succeeded for bookmark ${bookmarkId}`);
      operation.status = 'completed';
      this.setStatus('synced');
      this.lastSyncTime = Date.now();

      this.emitEvent({
        type: 'bookmark:deleted',
        bookmarkId,
        timestamp,
      });

      crossTabSync.broadcast({
        type: 'bookmark:deleted',
        bookmarkId,
        timestamp,
      });

      return operation;
    } catch (error) {
      console.error(`[SyncManager] ✗ Delete FAILED for bookmark ${bookmarkId}: ${String(error)}`);
      operation.status = 'failed';
      operation.error = String(error);
      offlineQueue.add(operation);
      this.setStatus('offline');
      return operation;
    }
  }

  /**
   * Process pending operations from offline queue
   */
  private async processPendingQueue(): Promise<void> {
    if (!offlineQueue.getOnlineStatus()) return;

    const pending = offlineQueue.getPendingOperations();
    for (const op of pending) {
      try {
        let result;
        switch (op.type) {
          case 'create':
            result = await mockBackend.create(op.bookmarkId, op.payload.data, op.timestamp);
            break;
          case 'update':
            result = await mockBackend.update(
              op.bookmarkId,
              op.payload.data,
              op.timestamp,
              op.version - 1,
            );
            break;
          case 'delete':
            result = await mockBackend.delete(op.bookmarkId, op.version);
            break;
        }

        offlineQueue.updateStatus(op.id, 'completed');
        this.emitEvent({
          type: `bookmark:${op.type === 'delete' ? 'deleted' : 'updated'}` as any,
          bookmarkId: op.bookmarkId,
          timestamp: Date.now(),
        });
      } catch (error) {
        offlineQueue.updateStatus(op.id, 'failed', String(error));
      }
    }

    if (offlineQueue.isQueueEmpty()) {
      this.setStatus('synced');
      this.lastSyncTime = Date.now();
    }
  }

  private startAutoRetry(): void {
    // Retry every 5 seconds if there are pending operations
    setInterval(() => {
      if (!offlineQueue.isQueueEmpty() && offlineQueue.getOnlineStatus()) {
        this.processPendingQueue();
      }
    }, 5000);
  }

  private setStatus(status: SyncStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.emitEvent({
        type: 'sync:status-changed',
        status,
        timestamp: Date.now(),
      });
    }
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  getLastSyncTime(): number {
    return this.lastSyncTime;
  }

  getSecondsSinceSync(): number {
    if (this.lastSyncTime === 0) return -1;
    return Math.floor((Date.now() - this.lastSyncTime) / 1000);
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: SyncEvent): void {
    console.log(`[SyncManager] 📣 Emitting event to ${this.listeners.size} listeners:`, event.type, event);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Manually trigger sync of all pending operations
   */
  async syncNow(): Promise<void> {
    await this.processPendingQueue();
  }

  /**
   * Get queue status for UI
   */
  getQueueStatus() {
    const all = offlineQueue.getAll();
    return {
      total: all.length,
      pending: all.filter(i => i.operation.status === 'pending').length,
      failed: all.filter(i => i.operation.status === 'failed').length,
    };
  }

  cleanup(): void {
    if (this.autoRetryTimer) clearTimeout(this.autoRetryTimer);
    crossTabSync.cleanup();
  }
}

export const syncManager = new SyncManager();
