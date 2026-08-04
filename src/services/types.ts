export interface SyncOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  bookmarkId: number;
  categoryId: string;
  payload: Record<string, unknown>;
  timestamp: number;
  version: number;
  status: 'pending' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

export interface VersionedBookmark {
  id: number;
  version: number;
  lastModified: number;
  lastModifiedBy: string;
  data: unknown;
}

export interface SyncConflict {
  bookmarkId: number;
  local: VersionedBookmark;
  remote: VersionedBookmark;
  resolvedAt?: number;
  winner: 'local' | 'remote';
}

export type SyncStatus = 'connected' | 'pending' | 'offline' | 'synced';

export interface SyncEvent {
  type: 'bookmark:created' | 'bookmark:updated' | 'bookmark:deleted' | 'sync:status-changed' | 'conflict:detected';
  bookmarkId?: number;
  status?: SyncStatus;
  conflict?: SyncConflict;
  timestamp: number;
  sourceTab?: string;
}

export interface OfflineQueueItem {
  id: string;
  operation: SyncOperation;
  addedAt: number;
  attempts: number;
  lastAttempt?: number;
  error?: string;
}
