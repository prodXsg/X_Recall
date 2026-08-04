import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { syncManager } from '../../services/syncManager';
import { mockBackend } from '../../services/mockBackend';
import { offlineQueue } from '../../services/offlineQueue';
import { conflictResolver } from '../../services/conflictResolver';

export function SyncDebugPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [latency, setLatency] = useState(300);
  const [failureRate, setFailureRate] = useState(0);

  const handleToggleOffline = () => {
    mockBackend.toggleOffline();
  };

  const handleSync = () => {
    syncManager.syncNow();
  };

  const config = mockBackend.getConfig();
  const queueStatus = syncManager.getQueueStatus();
  const conflicts = conflictResolver.getAllConflicts();

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition mb-2"
      >
        <span className="text-sm">🔧 Sync Debug</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute bottom-16 right-0 w-80 bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-4 shadow-2xl"
          >
            {/* Offline Toggle */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase">Network Status</label>
              <button
                onClick={handleToggleOffline}
                className={`w-full px-3 py-2 rounded font-medium text-sm transition ${
                  config.isOffline
                    ? 'bg-red-600/30 text-red-200 border border-red-600 hover:bg-red-600/40'
                    : 'bg-green-600/30 text-green-200 border border-green-600 hover:bg-green-600/40'
                }`}
              >
                {config.isOffline ? '🔴 Offline' : '🟢 Online'} (Click to toggle)
              </button>
            </div>

            {/* Latency Control */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Latency: {latency}ms
              </label>
              <input
                type="range"
                min="0"
                max="2000"
                step="100"
                value={latency}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setLatency(val);
                  mockBackend.setConfig({ latency: val });
                }}
                className="w-full"
              />
            </div>

            {/* Failure Rate */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase">
                Failure Rate: {Math.round(failureRate * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={failureRate}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setFailureRate(val);
                  mockBackend.setConfig({ failureRate: val });
                }}
                className="w-full"
              />
            </div>

            {/* Manual Sync */}
            <button
              onClick={handleSync}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium text-sm transition"
            >
              ⚡ Sync Now
            </button>

            {/* Queue Status */}
            <div className="space-y-1 p-2 bg-zinc-900 rounded border border-zinc-700">
              <p className="text-xs font-semibold text-zinc-300">Queue Status</p>
              <p className="text-xs text-zinc-400">Total: {queueStatus.total}</p>
              <p className="text-xs text-zinc-400">Pending: {queueStatus.pending}</p>
              <p className="text-xs text-zinc-400">Failed: {queueStatus.failed}</p>
            </div>

            {/* Conflicts */}
            {conflicts.length > 0 && (
              <div className="space-y-1 p-2 bg-red-900/30 rounded border border-red-700">
                <p className="text-xs font-semibold text-red-200">Conflicts Detected</p>
                <p className="text-xs text-red-300">{conflicts.length} conflict(s)</p>
              </div>
            )}

            {/* Backend State */}
            <div className="text-xs text-zinc-500 text-center">
              Tab ID: {mockBackend.getTabId().slice(0, 8)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
