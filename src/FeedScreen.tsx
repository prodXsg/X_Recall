import { useState, useRef, useEffect, useMemo } from 'react';
import { Home, Search, Bell, Mail, CheckCircle, XCircle, VenetianMask, Flag, Volume2, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tweet, Category, BookmarkMeta } from './App';
import { TweetComponent } from './TweetComponent';
import { ProfileDrawer } from './components/ProfileDrawer';
import { feedTweets } from './FeedTweetsData';

interface FeedScreenProps {
  onNavigateToLibrary: (folderId?: string) => void;
  addBookmark: (tweet: Tweet) => { categoryId: string; categoryName: string; meta: BookmarkMeta };
  removeBookmark: (tweetId: number) => void;
  isBookmarked: (tweetId: number) => boolean;
  getTweetCategory: (tweetId: number) => string | null;
  categories: Category[];
  bookmarksById: Record<number, Tweet>;
  increaseUserTrustScore: () => void;
  bookmarkSyncStatus?: Record<number, 'synced' | 'syncing' | 'conflict' | 'offline' | 'none'>;
}

// ─── Ads ──────────────────────────────────────────────────────────────────────

const ADS: Tweet[] = [
  {
    id: 9001,
    author: 'Urban Company',
    handle: '@UrbanCompany',
    time: 'Promoted',
    content: "Book top-rated home services in minutes. From cleaning to salon at home, we've got you covered! 🏠✨",
    avatar: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&h=100&fit=crop',
    comments: 452, retweets: 120, likes: 3400,
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    category: 'Home', isAd: true,
  },
  {
    id: 9002,
    author: 'Coinbase',
    handle: '@Coinbase',
    time: 'Promoted',
    content: 'Buy, sell, and manage your crypto. The most trusted platform for cryptocurrency. Get started with $10 in BTC. 🪙',
    avatar: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=100&h=100&fit=crop',
    comments: 890, retweets: 450, likes: 12400,
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    category: 'Crypto', isAd: true,
  },
  {
    id: 9003,
    author: 'Tesla',
    handle: '@Tesla',
    time: 'Promoted',
    content: 'Sustainable energy is the future. Drive the change with the new Model 3. Long range, high performance. ⚡',
    avatar: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=100&h=100&fit=crop',
    comments: 1200, retweets: 3400, likes: 45000,
    image: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&q=80',
    category: 'Automobiles', isAd: true,
  },
];

// A curated subset shown in the Following tab
const FOLLOWING_TWEET_IDS = [1, 6, 5, 29, 24, 2, 4, 10, 8];

// ─── Component ────────────────────────────────────────────────────────────────

type TabType = 'for-you' | 'following';

interface ToastState {
  visible: boolean;
  message: string;
  folderName: string;
  folderId: string;
  isAI: boolean;
  confidence: number;
}

export function FeedScreen({
  onNavigateToLibrary,
  addBookmark,
  removeBookmark,
  isBookmarked,
  getTweetCategory,
  categories,
  increaseUserTrustScore,
  bookmarkSyncStatus = {},
}: FeedScreenProps) {
  const [activeTab,       setActiveTab]       = useState<TabType>('for-you');
  const [toast,           setToast]           = useState<ToastState>({ visible: false, message: '', folderName: '', folderId: '', isAI: false, confidence: 1 });
  const [isDrawerOpen,    setIsDrawerOpen]    = useState(false);
  const [likedTweets,     setLikedTweets]     = useState<Set<number>>(new Set());
  const [retweetedTweets, setRetweetedTweets] = useState<Set<number>>(new Set());
  const [feedMenuTweetId, setFeedMenuTweetId] = useState<number | null>(null);

  // ── Computed feed lists (memoised — not rebuilt on every render) ────────────

  const forYouTweets = useMemo(() => {
    const result: Tweet[] = [];
    let adIndex = 0;
    feedTweets.forEach((tweet, i) => {
      result.push(tweet);
      if ((i + 1) % 5 === 0) {
        result.push({ ...ADS[adIndex % ADS.length], id: 90000 + i });
        adIndex++;
      }
    });
    return result;
  }, []);

  const followingTweets = useMemo(
    () => feedTweets.filter(t => FOLLOWING_TWEET_IDS.includes(t.id)),
    [],
  );

  const displayTweets = activeTab === 'for-you' ? forYouTweets : followingTweets;

  // ── Toast auto-dismiss ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!toast.visible) return;
    const timer = setTimeout(() => setToast(t => ({ ...t, visible: false })), 2800);
    return () => clearTimeout(timer);
  }, [toast.visible]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const showToast = (state: Omit<ToastState, 'visible'>) =>
    setToast({ ...state, visible: true });

  const handleBookmarkClick = (tweet: Tweet) => {
    if (isBookmarked(tweet.id)) {
      const categoryId = getTweetCategory(tweet.id);
      if (categoryId) {
        const cat = categories.find(c => c.id === categoryId);
        removeBookmark(tweet.id);
        showToast({ message: 'Removed from', folderName: cat?.name || 'Bookmarks', folderId: categoryId, isAI: false, confidence: 1 });
      }
    } else {
      // addBookmark now returns meta synchronously — no setTimeout needed
      const { categoryId, categoryName, meta } = addBookmark(tweet);
      increaseUserTrustScore();
      showToast({
        message:    'Saved to',
        folderName: categoryName,
        folderId:   categoryId,
        isAI:       meta.autoAssigned,
        confidence: meta.confidence,
      });
    }
  };

  const handleLike = (tweetId: number) => {
    setLikedTweets(prev => {
      const next = new Set(prev);
      next.has(tweetId) ? next.delete(tweetId) : next.add(tweetId);
      return next;
    });
  };

  const handleRetweet = (tweetId: number) => {
    setRetweetedTweets(prev => {
      const next = new Set(prev);
      next.has(tweetId) ? next.delete(tweetId) : next.add(tweetId);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">

      {/* iOS Status Bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-black shrink-0">
        <span className="text-white text-xs font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          {/* Cellular signal */}
          <div className="flex items-end gap-[2px] h-3">
            {[1, 1.5, 2, 3].map((h, i) => (
              <div key={i} className="w-[3px] bg-white rounded-[1px]" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
          {/* WiFi */}
          <svg viewBox="0 0 16 12" className="w-4 h-3 fill-white">
            <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM4.2 6.8a5.3 5.3 0 0 1 7.6 0l-1.3 1.3a3.5 3.5 0 0 0-5 0L4.2 6.8zM.8 3.4a10 10 0 0 1 14.4 0l-1.4 1.4a8 8 0 0 0-11.6 0L.8 3.4z" />
          </svg>
          {/* Battery */}
          <div className="flex items-center gap-0.5">
            <div className="relative w-6 h-[13px] border border-white rounded-[3px]">
              <div className="absolute inset-[2px] right-[3px] bg-white rounded-[1px]" />
            </div>
            <div className="w-[2px] h-[6px] bg-white rounded-r-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 relative border-b border-zinc-800/50 shrink-0">
        <button onClick={() => setIsDrawerOpen(true)} className="focus:outline-none">
          <img
            src="https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?w=100&h=100&fit=crop"
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover hover:opacity-80 transition-opacity"
          />
        </button>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </div>
        <div className="w-8 h-8" />
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-zinc-800 shrink-0">
        {(['for-you', 'following'] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-3.5 text-center relative font-bold transition-colors"
          >
            <span className={activeTab === tab ? 'text-white' : 'text-zinc-500'}>
              {tab === 'for-you' ? 'For You' : 'Following'}
            </span>
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-14 h-1 bg-[#1D9BF0] rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(113,113,122,0.4) transparent' }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {displayTweets.map(tweet => (
              <TweetComponent
                key={tweet.id}
                tweet={tweet}
                context="feed"
                isBookmarked={isBookmarked(tweet.id)}
                onBookmarkClick={() => handleBookmarkClick(tweet)}
                isLiked={likedTweets.has(tweet.id)}
                isRetweeted={retweetedTweets.has(tweet.id)}
                onLikeClick={() => handleLike(tweet.id)}
                onRetweetClick={() => handleRetweet(tweet.id)}
                onMenuClick={tweet.isAd ? undefined : () => setFeedMenuTweetId(tweet.id)}
                syncStatus={bookmarkSyncStatus[tweet.id] || 'none'}
              />
            ))}

            {activeTab === 'following' && followingTweets.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
                <p className="text-white font-bold text-xl mb-2">Follow more people</p>
                <p className="text-zinc-500 text-sm">When you follow accounts, their posts show up here.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-around py-3 pb-5 border-t border-zinc-800 bg-black shrink-0">
        <button className="p-2">
          <Home className="w-6 h-6 text-white" />
        </button>
        <button className="p-2">
          <Search className="w-6 h-6 text-zinc-500 hover:text-white transition-colors" />
        </button>
        {/* Grok sparkle icon */}
        <button className="p-2">
          <svg viewBox="0 0 24 24" className="w-6 h-6 text-zinc-500 hover:text-white transition-colors" fill="currentColor">
            <path d="M12 2L13.09 10.26L22 12L13.09 13.74L12 22L10.91 13.74L2 12L10.91 10.26L12 2Z" />
          </svg>
        </button>
        <button className="p-2">
          <Bell className="w-6 h-6 text-zinc-500 hover:text-white transition-colors" />
        </button>
        <button className="p-2">
          <Mail className="w-6 h-6 text-zinc-500 hover:text-white transition-colors" />
        </button>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            className="absolute bottom-20 left-4 right-4 bg-[#1D9BF0] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 cursor-pointer"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{  opacity: 0, y: 20,  scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={() => { setToast(t => ({ ...t, visible: false })); onNavigateToLibrary(toast.folderId); }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 fill-white text-[#1D9BF0]" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold">
                {toast.message}{' '}
                <span className="underline">{toast.folderName}</span>
              </span>
              {toast.message === 'Saved to' && toast.isAI && (
                <span className="text-xs text-white/75 mt-0.5">
                  {toast.confidence >= 0.75
                    ? `Grok is ${Math.round(toast.confidence * 100)}% confident`
                    : `AI suggested · Tap to change folder`}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed tweet context menu */}
      <AnimatePresence>
        {feedMenuTweetId !== null && (
          <>
            <motion.div
              className="absolute inset-0 bg-black/50 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFeedMenuTweetId(null)}
            />
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl z-50 pb-8"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            >
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mt-4 mb-5" />

              {[
                { icon: VenetianMask, label: 'Not interested in this post' },
                { icon: UserX,        label: `Mute @${feedTweets.find(t => t.id === feedMenuTweetId)?.handle?.replace('@', '') || ''}` },
                { icon: Volume2,      label: `Block @${feedTweets.find(t => t.id === feedMenuTweetId)?.handle?.replace('@', '') || ''}` },
                { icon: Flag,         label: 'Report post',                  danger: true },
              ].map(({ icon: Icon, label, danger }) => (
                <button
                  key={label}
                  onClick={() => setFeedMenuTweetId(null)}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-800 transition-colors text-left ${danger ? 'text-red-500' : 'text-white'}`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium text-sm">{label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Profile Drawer */}
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onNavigateToBookmarks={() => onNavigateToLibrary()}
      />
    </div>
  );
}