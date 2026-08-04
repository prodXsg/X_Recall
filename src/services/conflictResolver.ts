import { VersionedBookmark, SyncConflict } from './types';

export class ConflictResolver {
  private conflicts: Map<number, SyncConflict> = new Map();

  /**
   * Last-Write-Wins: Compare timestamps, winner is the one with later timestamp.
   * If timestamps are equal, use version number as tiebreaker.
   */
  resolveConflict(
    local: VersionedBookmark,
    remote: VersionedBookmark,
  ): VersionedBookmark {
    let conflict: SyncConflict;

    if (remote.lastModified > local.lastModified) {
      conflict = {
        bookmarkId: local.id,
        local,
        remote,
        winner: 'remote',
        resolvedAt: Date.now(),
      };
    } else if (remote.lastModified < local.lastModified) {
      conflict = {
        bookmarkId: local.id,
        local,
        remote,
        winner: 'local',
        resolvedAt: Date.now(),
      };
    } else {
      // Same timestamp, use version as tiebreaker
      if (remote.version > local.version) {
        conflict = {
          bookmarkId: local.id,
          local,
          remote,
          winner: 'remote',
          resolvedAt: Date.now(),
        };
      } else {
        conflict = {
          bookmarkId: local.id,
          local,
          remote,
          winner: 'local',
          resolvedAt: Date.now(),
        };
      }
    }

    this.conflicts.set(local.id, conflict);
    return conflict.winner === 'remote' ? remote : local;
  }

  getConflict(bookmarkId: number): SyncConflict | undefined {
    return this.conflicts.get(bookmarkId);
  }

  getAllConflicts(): SyncConflict[] {
    return Array.from(this.conflicts.values());
  }

  clearConflict(bookmarkId: number): void {
    this.conflicts.delete(bookmarkId);
  }

  clearAllConflicts(): void {
    this.conflicts.clear();
  }

  mergeStates(
    local: Map<number, VersionedBookmark>,
    remote: VersionedBookmark[],
  ): Map<number, VersionedBookmark> {
    const merged = new Map(local);

    for (const remoteBookmark of remote) {
      const localBookmark = merged.get(remoteBookmark.id);

      if (!localBookmark) {
        // Remote exists, local doesn't - take remote
        merged.set(remoteBookmark.id, remoteBookmark);
      } else {
        // Both exist - resolve conflict
        const winner = this.resolveConflict(localBookmark, remoteBookmark);
        merged.set(remoteBookmark.id, winner);
      }
    }

    return merged;
  }
}

export const conflictResolver = new ConflictResolver();
