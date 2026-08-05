# Cross-Device Sync Architecture

## Overview

The X Recall sync system demonstrates production-level distributed state management patterns, including optimistic updates, offline support, conflict resolution, and cross-device synchronization. Everything runs client-side with no external backend.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       React Components                       │
│  (FeedScreen, LibraryScreen, TweetComponent)                │
└────────────┬────────────────────────────────────────────────┘
             │ dispatch actions
             ▼
┌─────────────────────────────────────────────────────────────┐
│                      Sync Manager                            │
│  ├─ Route all operations through sync layer                 │
│  ├─ Track operation status (pending/synced/offline)         │
│  ├─ Emit sync events (created/updated/deleted)             │
│  └─ Auto-retry on network recovery                         │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
  ┌──────┐ ┌──────┐ ┌──────────────┐
  │Mock  │ │Cross │ │Offline Queue │
  │Back  │ │Tab   │ │(localStorage)│
  │end   │ │Sync  │ └──────────────┘
  └──────┘ └──────┘
    │        │
    ▼        ▼
Versioning  Broadcasts to
& LWW       other tabs
```

## Components

### 1. **Mock Backend** (`src/services/mockBackend.ts`)

Simulates an API server with:
- **Versioning**: Each bookmark has a version number that increments on updates
- **Latency Simulation**: Configurable delay to test network conditions
- **Failure Rate**: Random failures to test retry logic
- **Offline Mode**: Toggle to simulate network outages
- **State Persistence**: Stores backend state in localStorage under `mock_backend_state`

**Key Methods:**
```typescript
async create(bookmarkId, data, lastModified) → VersionedBookmark
async update(bookmarkId, data, lastModified, expectedVersion) → VersionedBookmark
async delete(bookmarkId, expectedVersion) → void
```

**Why This Approach:**
- Completely client-side, no external dependencies
- Realistic versioning simulates production backend behavior
- Testable: can simulate network conditions on demand

---

### 2. **Sync Manager** (`src/services/syncManager.ts`)

Central orchestrator that:
- Routes bookmark operations (create/update/delete) through the sync layer
- Returns operations immediately (optimistic updates)
- Tracks sync status (connected/pending/offline/synced)
- Emits events for UI updates
- Auto-retries failed operations every 5 seconds
- Integrates with offline queue and cross-tab sync

**Key Methods:**
```typescript
createBookmark(bookmarkId, categoryId, data) → SyncOperation
updateBookmark(bookmarkId, categoryId, data) → SyncOperation
deleteBookmark(bookmarkId) → SyncOperation
syncNow() → Promise<void>
getStatus() → SyncStatus
getQueueStatus() → { total, pending, failed }
```

**Workflow:**
1. Operation requested → Return immediately (optimistic update)
2. Send to mock backend in background
3. If succeeds → Mark synced, emit event
4. If fails → Add to offline queue, set status to "offline"
5. On network recovery → Retry automatically
6. Broadcast changes to other tabs via cross-tab sync

---

### 3. **Conflict Resolver** (`src/services/conflictResolver.ts`)

Implements **Last-Write-Wins (LWW)** conflict resolution:
- Compares `lastModified` timestamps
- Picks version with later timestamp as winner
- Uses version number as tiebreaker if timestamps are equal
- Tracks all conflicts for visualization

**Why LWW?**
- Simple, deterministic resolution without user intervention
- Timestamp-based is natural for users
- Works well for most real-world scenarios
- Can be visualized in conflict dialog

**Example:**
```
Local:  v1, lastModified: 2026-08-04T10:00:00Z
Remote: v2, lastModified: 2026-08-04T10:05:00Z
→ Remote wins (later timestamp)
```

---

### 4. **Cross-Tab Sync** (`src/services/crossTabSync.ts`)

Enables real-time synchronization across browser tabs:

**Primary: BroadcastChannel API**
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Instant, bidirectional communication
- No server required

**Fallback: Storage Events**
- Older browsers
- Works via `localStorage` mutations
- Slight delay (~100-500ms)

**Broadcast Events:**
- `bookmark:created` - New bookmark added
- `bookmark:updated` - Bookmark modified
- `bookmark:deleted` - Bookmark removed
- `sync:status-changed` - Sync state change
- `conflict:detected` - Version conflict

**Testing:** Open app in 2 tabs → Changes sync within ~2 seconds

---

### 5. **Offline Queue** (`src/services/offlineQueue.ts`)

Persists failed operations locally:
- Stores in `localStorage` under `xrecall_offline_queue`
- Tracks retry count (max 5 attempts)
- Auto-processes when going back online
- Retries every 5 seconds if online

**Storage Format:**
```json
[
  [
    "1234-1725432000000-0.5",
    {
      "id": "1234-1725432000000-0.5",
      "operation": {
        "type": "create",
        "bookmarkId": 1234,
        "status": "failed"
      },
      "addedAt": 1725432000000,
      "attempts": 2,
      "error": "Offline"
    }
  ]
]
```

---

### 6. **React Components**

#### `SyncStatusBar.tsx`
Shows real-time sync status:
- 🟢 **Connected** - Online and synced
- ⟳ **Pending** - Syncing operations
- 🔴 **Offline** - No connection, queuing operations
- ⏱️ **Synced X secs ago** - Last successful sync time

**Features:**
- Updates every second
- Animated icons
- Color-coded for quick recognition

#### `BookmarkSyncIndicator.tsx`
Per-bookmark sync icon (only shows when bookmarked):
- ✅ Green checkmark = Synced
- ⟳ Blue spinner = Syncing
- ⚠️ Red alert = Conflict
- 🟠 Orange alert = Queued offline

**Tooltip shows:**
- Version number
- Last modified timestamp
- Status label

#### `ConflictDialog.tsx`
Modal showing conflict details:
- Local version (v#, timestamp, modified by)
- Remote version (v#, timestamp, modified by)
- Winner highlighted (via LWW)
- Action buttons to accept winner

#### `OfflineQueueStatus.tsx`
Compact status showing:
- Number of pending operations
- Number of failed operations
- Manual retry button
- Only shown when queue has items

#### `SyncDebugPanel.tsx` ⚡
**Crucial for interviews!** Allows testing:
- 🔘 **Toggle Offline** - Simulate network outage
- 📊 **Latency Control** - Adjust network delay (0-2000ms)
- 💥 **Failure Rate** - Random failures (0-100%)
- ⚡ **Sync Now** - Manually retry queue
- 📈 **Queue Status** - Real-time queue metrics
- 🔴 **Conflict Display** - Shows detected conflicts

---

## Data Flow

### Adding a Bookmark

```
User clicks bookmark
    ↓
FeedScreen.addBookmark()
    ├─ Create tweet with version=1, lastModified=now
    ├─ Dispatch to reducer (optimistic update)
    ├─ Set bookmarkSyncStatus='syncing'
    ↓
App.addBookmark() calls syncManager.createBookmark()
    ├─ Mock backend receives create request
    ├─ Checks latency, failure rate, offline status
    ├─ If success → return VersionedBookmark
    ├─ If fail → throw error
    ↓
syncManager catches response
    ├─ If success → setBookmarkSyncStatus='synced', emit event
    ├─ If fail → add to offlineQueue, setBookmarkSyncStatus='offline'
    ├─ Cross-tab sync broadcasts bookmark:created
    ↓
UI updates
    ├─ SyncStatusBar reflects status change
    ├─ BookmarkSyncIndicator shows sync icon
    ├─ Other tabs receive broadcast and update
```

### Network Recovery

```
Browser goes offline
    ↓
mockBackend.setConfig({ isOffline: true })
    ├─ All requests throw "Offline" error
    ├─ Operations added to queue
    ├─ setBookmarkSyncStatus='offline'
    ↓
syncManager.getStatus() returns 'offline'
    └─ SyncStatusBar shows 🔴 Offline
    └─ OfflineQueueStatus shows pending operations
    ↓
User toggles online in SyncDebugPanel
    ↓
mockBackend.setConfig({ isOffline: false })
    ├─ Network listeners fire 'online' event
    ├─ offlineQueue.scheduleRetry()
    ↓
syncManager processes pending operations
    ├─ For each operation in queue:
    │  ├─ Retry backend call
    │  ├─ If success → remove from queue
    │  ├─ If fail → increment retry count
    ↓
Final state: All operations synced or max retries reached
    └─ SyncStatusBar shows ✓ Synced X secs ago
```

### Cross-Tab Sync (2 tabs open)

```
Tab A: User bookmarks tweet #1234
    ├─ syncManager.createBookmark(1234, ...)
    ├─ Operations succeeds
    ├─ crossTabSync.broadcast({ type: 'bookmark:created', bookmarkId: 1234 })
    ↓
BroadcastChannel transmits to Tab B
    ↓
Tab B receives event
    ├─ syncManager listener fires
    ├─ Emits sync event internally
    ├─ App state updates (no action needed, just tracking)
    ├─ UI re-renders with updated sync info
    ↓
User sees bookmark appear in Tab B within ~100ms
    └─ With version number and sync indicator
```

### Conflict Detection

```
Tab A: Updates bookmark v1 → v2
    ├─ lastModified: 2026-08-04T10:00:00Z
    ├─ syncManager.updateBookmark(..., v1)
    ├─ Broadcast to Tab B and backend
    ↓
Tab B: Also updates same bookmark v1 → v2
    ├─ lastModified: 2026-08-04T10:05:00Z (later!)
    ├─ syncManager.updateBookmark(..., v1)
    ├─ Broadcast to Tab A and backend
    ↓
Backend receives conflicting updates:
    ├─ First update (v1 → v2)
    ├─ Second update tries (v2 → v3) but gets v1 → v2 conflict
    ├─ Throws "Version mismatch"
    ↓
syncManager catches error
    ├─ Adds to queue for retry
    ├─ Emits: { type: 'conflict:detected', bookmarkId: 1234 }
    ↓
App state updates
    ├─ setBookmarkSyncStatus='conflict'
    ├─ setConflict({ bookmarkId, local, remote, winner: 'remote' })
    ↓
ConflictDialog shows:
    ├─ Local v2 (10:00:00) ← This one
    ├─ Remote v2 (10:05:00) → Winner (LWW)
    ├─ User clicks "Accept Remote"
    ├─ Bookmark gets remote state
    └─ BookmarkSyncIndicator changes to ✓ Synced
```

---

## Key Design Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|-----------|
| **Optimistic Updates** | UI feels responsive, improves UX | May rollback if offline → queue handles it |
| **Last-Write-Wins** | Simple, deterministic, no user interaction | May lose local changes if remote is newer |
| **BroadcastChannel + Fallback** | Works in all browsers | Fallback slower (storage events) |
| **localStorage Persistence** | Survives page reload, no backend | Limited by quota (~5-10MB) |
| **5-second Retry** | Balances responsiveness vs server load | May be too frequent for real backend |
| **Max 5 Retries** | Prevents infinite loops | May give up prematurely on flaky networks |

