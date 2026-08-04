import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, Clock } from 'lucide-react';
import { SyncConflict } from '../../services/types';

interface ConflictDialogProps {
  conflict: SyncConflict | null;
  onResolve: (winner: 'local' | 'remote') => void;
  onClose: () => void;
}

export function ConflictDialog({ conflict, onResolve, onClose }: ConflictDialogProps) {
  if (!conflict) return null;

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const winner = conflict.winner;
  const loser = conflict.winner === 'local' ? 'remote' : 'local';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-zinc-800 border border-zinc-700 rounded-lg p-6 max-w-md w-full shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-lg font-bold text-white">Conflict Detected</h2>
          </div>

          <p className="text-zinc-300 mb-4">
            Bookmark #{conflict.bookmarkId} was modified in two places. The system detected a version
            conflict:
          </p>

          <div className="space-y-3 mb-6">
            {/* Local Version */}
            <div
              className={`p-3 rounded border ${
                winner === 'local'
                  ? 'bg-green-900/20 border-green-600'
                  : 'bg-zinc-700/50 border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">Local Version</span>
                {winner === 'local' && (
                  <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                    Winner (LWW)
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>v{conflict.local.version}</span>
                <span>•</span>
                <span>{formatTime(conflict.local.lastModified)}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Modified by: {conflict.local.lastModifiedBy}
              </div>
            </div>

            {/* Remote Version */}
            <div
              className={`p-3 rounded border ${
                winner === 'remote'
                  ? 'bg-green-900/20 border-green-600'
                  : 'bg-zinc-700/50 border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-white">Remote Version</span>
                {winner === 'remote' && (
                  <span className="text-xs px-2 py-1 bg-green-600 text-white rounded">
                    Winner (LWW)
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-300 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>v{conflict.remote.version}</span>
                <span>•</span>
                <span>{formatTime(conflict.remote.lastModified)}</span>
              </div>
              <div className="text-xs text-zinc-400 mt-1">
                Modified by: {conflict.remote.lastModifiedBy}
              </div>
            </div>
          </div>

          <p className="text-xs text-zinc-400 mb-4">
            ℹ️ This conflict was automatically resolved using Last-Write-Wins (LWW) strategy. The version
            with the later timestamp wins.
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onResolve(winner);
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded transition"
            >
              Accept {winner === 'local' ? 'Local' : 'Remote'}
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
