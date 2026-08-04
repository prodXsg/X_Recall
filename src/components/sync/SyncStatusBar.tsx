import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, Loader } from 'lucide-react';
import { motion } from 'motion/react';
import { SyncStatus } from '../../services/types';

interface SyncStatusBarProps {
  status: SyncStatus;
  secondsSinceSync: number;
}

export function SyncStatusBar({ status, secondsSinceSync }: SyncStatusBarProps) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    switch (status) {
      case 'connected':
        setDisplayText('Connected');
        break;
      case 'pending':
        setDisplayText('Syncing...');
        break;
      case 'offline':
        setDisplayText('Offline');
        break;
      case 'synced':
        if (secondsSinceSync < 0) {
          setDisplayText('Synced');
        } else if (secondsSinceSync === 0) {
          setDisplayText('Just now');
        } else if (secondsSinceSync < 60) {
          setDisplayText(`Synced ${secondsSinceSync}s ago`);
        } else {
          const mins = Math.floor(secondsSinceSync / 60);
          setDisplayText(`Synced ${mins}m ago`);
        }
        break;
    }
  }, [status, secondsSinceSync]);

  const getIcon = () => {
    switch (status) {
      case 'offline':
        return <WifiOff className="w-4 h-4" />;
      case 'pending':
        return <Loader className="w-4 h-4 animate-spin" />;
      case 'connected':
        return <Wifi className="w-4 h-4" />;
      case 'synced':
        return <Clock className="w-4 h-4" />;
    }
  };

  const getColors = () => {
    switch (status) {
      case 'offline':
        return 'bg-red-900/40 text-red-300 border-red-700';
      case 'pending':
        return 'bg-amber-900/40 text-amber-300 border-amber-700';
      case 'connected':
        return 'bg-blue-900/40 text-blue-300 border-blue-700';
      case 'synced':
        return 'bg-green-900/40 text-green-300 border-green-700';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium ${getColors()}`}
    >
      <motion.div
        animate={status === 'pending' ? {} : { scale: [1, 1.1, 1] }}
        transition={{ duration: 2, repeat: status === 'synced' ? 1 : 0 }}
      >
        {getIcon()}
      </motion.div>
      <span>{displayText}</span>
    </motion.div>
  );
}
