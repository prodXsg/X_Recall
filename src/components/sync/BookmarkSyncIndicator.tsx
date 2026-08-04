import { CheckCircle, Loader, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export type SyncIndicatorStatus = 'synced' | 'syncing' | 'conflict' | 'offline' | 'none';

interface BookmarkSyncIndicatorProps {
  status: SyncIndicatorStatus;
  bookmarkId?: number;
  version?: number;
  lastModified?: number;
  showLabel?: boolean;
}

export function BookmarkSyncIndicator({
  status,
  bookmarkId,
  version,
  lastModified,
  showLabel = false,
}: BookmarkSyncIndicatorProps) {
  const getIcon = () => {
    switch (status) {
      case 'synced':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
          >
            <CheckCircle className="w-5 h-5 text-green-500" strokeWidth={2.5} />
          </motion.div>
        );
      case 'syncing':
        return (
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
            <Loader className="w-5 h-5 text-blue-500" strokeWidth={2} />
          </motion.div>
        );
      case 'conflict':
        return (
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <AlertCircle className="w-5 h-5 text-red-500" strokeWidth={2} />
          </motion.div>
        );
      case 'offline':
        return <AlertCircle className="w-5 h-5 text-orange-500" strokeWidth={2} />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'synced':
        return 'Synced';
      case 'syncing':
        return 'Syncing...';
      case 'conflict':
        return 'Conflict detected';
      case 'offline':
        return 'Offline queue';
      default:
        return '';
    }
  };

  const getTooltip = () => {
    const parts = [getLabel()];
    if (version !== undefined) parts.push(`v${version}`);
    if (lastModified !== undefined) {
      const date = new Date(lastModified);
      parts.push(date.toLocaleTimeString());
    }
    return parts.join(' • ');
  };

  if (status === 'none') return null;

  return (
    <div className="flex items-center gap-2" title={getTooltip()}>
      {getIcon()}
      {showLabel && <span className="text-xs text-zinc-400">{getLabel()}</span>}
    </div>
  );
}
