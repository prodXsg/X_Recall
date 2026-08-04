import { AlertCircle, Loader } from 'lucide-react';
import { motion } from 'motion/react';

interface OfflineQueueStatusProps {
  pending: number;
  failed: number;
  isOnline: boolean;
  onRetry?: () => void;
}

export function OfflineQueueStatus({
  pending,
  failed,
  isOnline,
  onRetry,
}: OfflineQueueStatusProps) {
  const total = pending + failed;

  if (total === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-900/40 border border-orange-700 text-orange-300 text-sm"
    >
      {isOnline ? (
        <Loader className="w-4 h-4 animate-spin" />
      ) : (
        <AlertCircle className="w-4 h-4" />
      )}

      <span>
        {pending} operation{pending !== 1 ? 's' : ''} pending
        {failed > 0 && `, ${failed} failed`}
      </span>

      {failed > 0 && onRetry && (
        <button
          onClick={onRetry}
          className="ml-auto px-2 py-1 bg-orange-600 hover:bg-orange-700 rounded text-xs font-medium transition"
        >
          Retry
        </button>
      )}
    </motion.div>
  );
}
