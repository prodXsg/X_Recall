import { VersionedBookmark, SyncOperation } from './types';

export interface MockBackendConfig {
  latency?: number;
  failureRate?: number;
  isOffline?: boolean;
}

class MockBackendService {
  private storage: Map<number, VersionedBookmark> = new Map();
  private versionCounter: Map<number, number> = new Map();
  private config: MockBackendConfig = {
    latency: 300,
    failureRate: 0,
    isOffline: false,
  };
  private listeners: Set<(change: any) => void> = new Set();
  private tabId = Math.random().toString(36).substring(7);

  constructor() {
    this.initializeFromLocalStorage();
  }

  private initializeFromLocalStorage(): void {
    try {
      const saved = localStorage.getItem('mock_backend_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.storage = new Map(parsed.storage || []);
        this.versionCounter = new Map(parsed.versionCounter || []);
      }
    } catch (error) {
      console.warn('Failed to load mock backend state:', error);
    }
  }

  private persistState(): void {
    try {
      localStorage.setItem('mock_backend_state', JSON.stringify({
        storage: Array.from(this.storage.entries()),
        versionCounter: Array.from(this.versionCounter.entries()),
      }));
    } catch (error) {
      console.warn('Failed to persist mock backend state:', error);
    }
  }

  private async simulateLatency(): Promise<void> {
    if (this.config.latency) {
      await new Promise(resolve => setTimeout(resolve, this.config.latency));
    }
  }

  private shouldFail(): boolean {
    return Math.random() < (this.config.failureRate || 0);
  }

  async get(bookmarkId: number): Promise<VersionedBookmark | null> {
    await this.simulateLatency();
    if (this.config.isOffline) throw new Error('Offline');
    if (this.shouldFail()) throw new Error('Server error');
    return this.storage.get(bookmarkId) || null;
  }

  async create(
    bookmarkId: number,
    data: unknown,
    lastModified: number,
  ): Promise<VersionedBookmark> {
    await this.simulateLatency();
    if (this.config.isOffline) throw new Error('Offline');
    if (this.shouldFail()) throw new Error('Server error');

    const version = (this.versionCounter.get(bookmarkId) || 0) + 1;
    this.versionCounter.set(bookmarkId, version);

    const bookmark: VersionedBookmark = {
      id: bookmarkId,
      version,
      lastModified,
      lastModifiedBy: this.tabId,
      data,
    };

    this.storage.set(bookmarkId, bookmark);
    this.persistState();
    this.notifyOthers({ type: 'create', bookmark });
    return bookmark;
  }

  async update(
    bookmarkId: number,
    data: unknown,
    lastModified: number,
    expectedVersion: number,
  ): Promise<VersionedBookmark> {
    await this.simulateLatency();
    if (this.config.isOffline) throw new Error('Offline');
    if (this.shouldFail()) throw new Error('Server error');

    const existing = this.storage.get(bookmarkId);
    if (!existing) throw new Error('Not found');

    if (existing.version !== expectedVersion) {
      throw new Error('Version mismatch - conflict detected');
    }

    const version = expectedVersion + 1;
    this.versionCounter.set(bookmarkId, version);

    const bookmark: VersionedBookmark = {
      id: bookmarkId,
      version,
      lastModified,
      lastModifiedBy: this.tabId,
      data,
    };

    this.storage.set(bookmarkId, bookmark);
    this.persistState();
    this.notifyOthers({ type: 'update', bookmark });
    return bookmark;
  }

  async delete(bookmarkId: number, expectedVersion: number): Promise<void> {
    await this.simulateLatency();
    if (this.config.isOffline) throw new Error('Offline');
    if (this.shouldFail()) throw new Error('Server error');

    const existing = this.storage.get(bookmarkId);
    console.log(`[MockBackend] Delete ${bookmarkId}: exists=${!!existing}, serverVersion=${existing?.version}, expectedVersion=${expectedVersion}`);

    if (!existing) throw new Error('Not found');

    if (existing.version !== expectedVersion) {
      console.error(`[MockBackend] ✗ Version mismatch: server has v${existing.version}, expected v${expectedVersion}`);
      throw new Error('Version mismatch - conflict detected');
    }

    console.log(`[MockBackend] ✓ Versions match (v${existing.version}), deleting bookmark ${bookmarkId}`);
    this.storage.delete(bookmarkId);
    this.persistState();
    this.notifyOthers({ type: 'delete', bookmarkId });
  }

  async getAll(): Promise<VersionedBookmark[]> {
    await this.simulateLatency();
    if (this.config.isOffline) throw new Error('Offline');
    if (this.shouldFail()) throw new Error('Server error');
    return Array.from(this.storage.values());
  }

  setConfig(config: Partial<MockBackendConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): MockBackendConfig {
    return { ...this.config };
  }

  toggleOffline(isOffline?: boolean): void {
    this.config.isOffline = isOffline !== undefined ? isOffline : !this.config.isOffline;
  }

  isOnline(): boolean {
    return !this.config.isOffline;
  }

  onStateChange(listener: (change: any) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyOthers(change: any): void {
    this.listeners.forEach(listener => listener(change));
  }

  reset(): void {
    this.storage.clear();
    this.versionCounter.clear();
    this.persistState();
  }

  getTabId(): string {
    return this.tabId;
  }
}

export const mockBackend = new MockBackendService();
