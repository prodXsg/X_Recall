import { SyncEvent } from './types';

type SyncListener = (event: SyncEvent) => void;

class CrossTabSyncService {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<SyncListener> = new Set();
  private useFallback = false;
  private tabId = Math.random().toString(36).substring(7);

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('xrecall-sync');
        this.channel.onmessage = (event) => {
          const message = event.data as SyncEvent;
          console.log(`[${this.tabId}] 📥 RECEIVED via BroadcastChannel from ${message.sourceTab}:`, message.type, message);
          if (message.sourceTab !== this.tabId) {
            console.log(`[${this.tabId}] ✓ Processing message from another tab`);
            this.emitEvent(message);
          } else {
            console.log(`[${this.tabId}] ⊘ Ignoring message from own tab`);
          }
        };
        console.log(`[${this.tabId}] ✓ BroadcastChannel initialized`);
      } else {
        this.useFallback = true;
        this.initializeFallback();
      }
    } catch (error) {
      console.warn('BroadcastChannel not available, using fallback:', error);
      this.useFallback = true;
      this.initializeFallback();
    }
  }

  private initializeFallback(): void {
    window.addEventListener('storage', (event) => {
      if (event.key === 'xrecall-sync-event' && event.newValue) {
        try {
          const message = JSON.parse(event.newValue) as SyncEvent;
          if (message.sourceTab !== this.tabId) {
            this.emitEvent(message);
          }
        } catch (error) {
          console.warn('Failed to parse cross-tab sync event:', error);
        }
      }
    });
    console.log('✓ Storage event fallback initialized');
  }

  broadcast(event: SyncEvent): void {
    const eventWithSource = { ...event, sourceTab: this.tabId };

    if (this.channel) {
      console.log(`[${this.tabId}] 📤 BROADCASTING via BroadcastChannel:`, event.type, event);
      this.channel.postMessage(eventWithSource);
    } else {
      // Fallback: use localStorage (other tabs listen for storage events)
      try {
        console.log(`[${this.tabId}] 📤 BROADCASTING via localStorage:`, event.type, event);
        localStorage.setItem('xrecall-sync-event', JSON.stringify(eventWithSource));
      } catch (error) {
        console.warn('Failed to broadcast via storage fallback:', error);
      }
    }

    // Emit locally as well
    this.emitEvent(eventWithSource);
  }

  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private emitEvent(event: SyncEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  getTabId(): string {
    return this.tabId;
  }

  isUsingFallback(): boolean {
    return this.useFallback;
  }

  cleanup(): void {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  }
}

export const crossTabSync = new CrossTabSyncService();
