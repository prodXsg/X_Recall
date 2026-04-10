import { motion, AnimatePresence } from 'motion/react';
import {
  User, Bookmark, List, Zap, DollarSign, Settings,
  HelpCircle, Moon, ChevronRight, X, UserPlus,
} from 'lucide-react';

interface ProfileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToBookmarks: () => void;
}

const NAV_ITEMS = [
  { icon: User,       label: 'Profile' },
  { icon: List,       label: 'Lists' },
  { icon: Bookmark,   label: 'Bookmarks',  action: 'bookmarks' },
  { icon: Zap,        label: 'Spaces' },
  { icon: DollarSign, label: 'Monetization' },
];

const BOTTOM_ITEMS = [
  { icon: Settings,  label: 'Settings and Support' },
  { icon: HelpCircle, label: 'Help Center' },
];

export function ProfileDrawer({ isOpen, onClose, onNavigateToBookmarks }: ProfileDrawerProps) {
  const handleItemClick = (action?: string) => {
    if (action === 'bookmarks') {
      onClose();
      setTimeout(() => onNavigateToBookmarks(), 300);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            className="absolute top-0 left-0 bottom-0 w-[82%] bg-black z-50 flex flex-col overflow-hidden"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          >
            {/* Profile Header */}
            <div className="px-5 pt-10 pb-4">
              {/* Avatar */}
              <div className="flex items-start justify-between mb-4">
                <img
                  src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&h=100&fit=crop"
                  alt="Profile"
                  className="w-12 h-12 rounded-full object-cover border-2 border-zinc-800"
                />
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-zinc-900 transition-colors"
                >
                  <X className="w-5 h-5 text-zinc-500" />
                </button>
              </div>

              {/* Name + handle */}
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-bold text-lg leading-tight">Surya Gummalla</span>
                  {/* Verified badge */}
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#1D9BF0] flex-shrink-0">
                    <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                  </svg>
                </div>
                <span className="text-zinc-500 text-sm">@SuryaGummalla</span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-5 mt-4 text-sm">
                <button className="flex items-center gap-1 hover:underline">
                  <span className="text-white font-bold">482</span>
                  <span className="text-zinc-500">Following</span>
                </button>
                <button className="flex items-center gap-1 hover:underline">
                  <span className="text-white font-bold">1.2K</span>
                  <span className="text-zinc-500">Followers</span>
                </button>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-2 py-2">
              {NAV_ITEMS.map(({ icon: Icon, label, action }) => (
                <button
                  key={label}
                  onClick={() => handleItemClick(action)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-zinc-900 transition-colors text-left"
                >
                  <Icon className="w-6 h-6 text-white flex-shrink-0" />
                  <span className="text-white font-bold text-lg">{label}</span>
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="mx-5 border-t border-zinc-800" />

            {/* Bottom items */}
            <div className="px-2 py-3">
              {BOTTOM_ITEMS.map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  className="w-full flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-zinc-900 transition-colors text-left"
                >
                  <Icon className="w-5 h-5 text-zinc-400 flex-shrink-0" />
                  <span className="text-zinc-400 text-sm">{label}</span>
                </button>
              ))}
            </div>

            {/* Switch accounts */}
            <div className="px-5 pb-8 pt-3 border-t border-zinc-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&h=100&fit=crop"
                    alt="Account"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-white text-xs font-bold">Surya Gummalla</div>
                    <div className="text-zinc-500 text-xs">@SuryaGummalla</div>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}