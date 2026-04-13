import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Search, Bookmark, CheckCircle, Edit2, Trash2, FolderInput, Info, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Tweet, Category } from './App';
import { TweetComponent } from './TweetComponent';

interface LibraryScreenProps {
  onBack: () => void;
  categories: Category[];
  getTweetsForCategory: (categoryId: string) => Tweet[];
  removeBookmark: (tweetId: number) => void;
  renameCategory: (categoryId: string, newName: string) => boolean;
  deleteCategory: (categoryId: string) => void;
  initialSelectedFolderId: string | null;
  isBookmarked: (tweetId: number) => boolean;
  moveBookmark: (tweetId: number, newCategoryId: string) => void;
  bookmarksById: Record<number, Tweet>;
  increaseUserTrustScore: () => void;
  userTrustScore: number;
}

// ─── Active sheet union — one state instead of three booleans ─────────────────

type ActiveSheet =
  | null
  | { type: 'folder-actions';  categoryId: string }
  | { type: 'folder-rename';   categoryId: string }
  | { type: 'folder-delete';   categoryId: string }
  | { type: 'tweet-menu';      tweetId: number }
  | { type: 'tweet-move';      tweetId: number }
  | { type: 'tweet-explain';   tweetId: number };

// ─── Component ────────────────────────────────────────────────────────────────

const ALL_TAB_ID = '__all__';

export function LibraryScreen({
  onBack,
  categories,
  getTweetsForCategory,
  removeBookmark,
  renameCategory,
  deleteCategory,
  initialSelectedFolderId,
  isBookmarked,
  moveBookmark,
  bookmarksById,
  increaseUserTrustScore,
  userTrustScore,
}: LibraryScreenProps) {

  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialSelectedFolderId && categories.some(c => c.id === initialSelectedFolderId)
      ? initialSelectedFolderId
      : (categories.length > 0 ? categories[0].id : ALL_TAB_ID),
  );

  const [activeSheet,  setActiveSheet]  = useState<ActiveSheet>(null);
  const [renameValue,  setRenameValue]  = useState('');
  const [renameError,  setRenameError]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast,    setShowToast]    = useState(false);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInit        = useRef(false);

  // Sync initial folder id (only once)
  useEffect(() => {
    if (hasInit.current) return;
    hasInit.current = true;
    if (initialSelectedFolderId && categories.some(c => c.id === initialSelectedFolderId)) {
      setActiveCategoryId(initialSelectedFolderId);
    }
  }, []); // eslint-disable-line

  // Auto-dismiss toast
  useEffect(() => {
    if (!showToast) return;
    const t = setTimeout(() => { setShowToast(false); setToastMessage(''); }, 2500);
    return () => clearTimeout(t);
  }, [showToast]);

  // ── Derived data ────────────────────────────────────────────────────────────

  /** Total bookmarks across all folders */
  const totalCount = Object.values(bookmarksById).length;

  /** Tweets shown in the current view */
  const visibleTweets = (() => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const all = Object.values(bookmarksById);
      return all
        .filter(t =>
          t.content.toLowerCase().includes(q) ||
          t.author.toLowerCase().includes(q)   ||
          t.handle.toLowerCase().includes(q),
        )
        .sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
    }
    if (activeCategoryId === ALL_TAB_ID) {
      return Object.values(bookmarksById).sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
    }
    return getTweetsForCategory(activeCategoryId);
  })();

  // ── Long press on folder chip ────────────────────────────────────────────────

  const startLongPress = (categoryId: string) => {
    longPressTimer.current = setTimeout(() => {
      setActiveSheet({ type: 'folder-actions', categoryId });
    }, 650);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // ── Rename handlers ─────────────────────────────────────────────────────────

  const handleRenameSubmit = () => {
    if (activeSheet?.type !== 'folder-rename') return;
    const ok = renameCategory(activeSheet.categoryId, renameValue);
    if (ok) {
      setActiveSheet(null);
      setRenameValue('');
      setRenameError('');
    } else {
      setRenameError(!renameValue.trim() ? 'Name cannot be empty' : 'A folder with this name already exists');
    }
  };

  // ── Delete handler ──────────────────────────────────────────────────────────

  const handleDeleteConfirm = () => {
    if (activeSheet?.type !== 'folder-delete') return;
    const id = activeSheet.categoryId;
    deleteCategory(id);
    setActiveSheet(null);
    if (activeCategoryId === id) {
      setActiveCategoryId(categories.length > 1 ? categories.find(c => c.id !== id)?.id || ALL_TAB_ID : ALL_TAB_ID);
    }
  };

  // ── Move bookmark handler ───────────────────────────────────────────────────

  const handleMoveToFolder = (newCategoryId: string) => {
    if (activeSheet?.type !== 'tweet-move') return;
    const newCat = categories.find(c => c.id === newCategoryId);
    moveBookmark(activeSheet.tweetId, newCategoryId);
    setActiveSheet(null);
    if (newCat) {
      setToastMessage(`Moved to ${newCat.name}`);
      setShowToast(true);
    }
  };

  // ── Remove bookmark ─────────────────────────────────────────────────────────

  const handleRemoveBookmark = (tweetId: number) => {
    const catId  = categories.find(c =>
      getTweetsForCategory(c.id).some(t => t.id === tweetId),
    )?.name;
    removeBookmark(tweetId);
    increaseUserTrustScore();
    setToastMessage(`Removed from ${catId || 'Bookmarks'}`);
    setShowToast(true);
  };

  // ── Helper: get active category name ────────────────────────────────────────

  const activeCategoryName =
    activeCategoryId === ALL_TAB_ID
      ? 'All'
      : categories.find(c => c.id === activeCategoryId)?.name || '';

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="w-full h-full bg-black flex flex-col relative overflow-hidden">

      {/* iOS Status Bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-black shrink-0">
        <span className="text-white text-xs font-semibold tracking-tight">9:41</span>
        <div className="flex items-center gap-1.5">
          <div className="flex items-end gap-[2px] h-3">
            {[1, 1.5, 2, 3].map((h, i) => (
              <div key={i} className="w-[3px] bg-white rounded-[1px]" style={{ height: `${h * 4}px` }} />
            ))}
          </div>
          <svg viewBox="0 0 16 12" className="w-4 h-3 fill-white">
            <path d="M8 9.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2zM4.2 6.8a5.3 5.3 0 0 1 7.6 0l-1.3 1.3a3.5 3.5 0 0 0-5 0L4.2 6.8zM.8 3.4a10 10 0 0 1 14.4 0l-1.4 1.4a8 8 0 0 0-11.6 0L.8 3.4z" />
          </svg>
          <div className="flex items-center gap-0.5">
            <div className="relative w-6 h-[13px] border border-white rounded-[3px]">
              <div className="absolute inset-[2px] right-[3px] bg-white rounded-[1px]" />
            </div>
            <div className="w-[2px] h-[6px] bg-white rounded-r-[1px]" />
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-center px-4 py-3 border-b border-zinc-800 relative shrink-0">
        <button onClick={onBack} className="absolute left-4 p-1">
          <ArrowLeft className="w-6 h-6 text-white hover:text-[#1D9BF0] transition-colors" />
        </button>
        <span className="text-white text-xl font-bold">Bookmarks</span>
<button
  onClick={() => { localStorage.clear(); window.location.reload(); }}
  className="absolute right-4 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors font-medium"
>
  Reset
</button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-zinc-800 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search bookmarks"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 text-white text-sm pl-9 pr-4 py-2 rounded-full border border-zinc-800 focus:border-[#1D9BF0] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Category chips — NOT filtered by search query; search is content-only */}
      <div
        className="flex gap-2 px-4 py-3 border-b border-zinc-800 overflow-x-auto overflow-y-hidden shrink-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
      >
        {/* All tab */}
        <motion.button
          layout
          onClick={() => setActiveCategoryId(ALL_TAB_ID)}
          className={`h-8 px-3 rounded-full whitespace-nowrap font-bold text-sm transition-all inline-flex items-center gap-1.5 ${
            activeCategoryId === ALL_TAB_ID
              ? 'bg-white text-black'
              : 'bg-black border border-zinc-700 text-zinc-400 hover:border-zinc-500'
          }`}
        >
          <span className="leading-none">All</span>
          <span className={`inline-flex items-center leading-none text-xs px-1.5 py-0.5 rounded-full ${activeCategoryId === ALL_TAB_ID ? 'bg-black/10 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
            {totalCount}
          </span>
        </motion.button>

        <AnimatePresence mode="popLayout">
          {categories.map(category => {
            const count = getTweetsForCategory(category.id).length;
            const isActive = activeCategoryId === category.id;
            return (
              <motion.div
                key={category.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                onMouseDown={() => startLongPress(category.id)}
                onMouseUp={cancelLongPress}
                onMouseLeave={cancelLongPress}
                onTouchStart={() => startLongPress(category.id)}
                onTouchEnd={cancelLongPress}
                onPointerCancel={cancelLongPress}
                className={`h-8 inline-flex items-center rounded-full whitespace-nowrap font-bold text-sm transition-all cursor-pointer select-none ${
                  isActive ? 'text-white' : 'bg-black border border-zinc-700 text-zinc-400 hover:border-zinc-500'
                }`}
                style={isActive ? { backgroundColor: category.color } : undefined}
              >
                {/* Tap to select */}
                <button
                  onClick={() => setActiveCategoryId(category.id)}
                  className="inline-flex items-center gap-1.5 pl-3 h-full"
                >
                  <span className="leading-none">{category.name}</span>
                  {count > 0 && (
                    <span className={`inline-flex items-center leading-none text-xs px-1.5 py-0.5 rounded-full ${isActive ? 'bg-black/20 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                      {count}
                    </span>
                  )}
                </button>

                {/* Inline edit — only visible on active chip */}
                {isActive && (
                  <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    onClick={e => {
                      e.stopPropagation();
                      setRenameValue(category.name);
                      setRenameError('');
                      setActiveSheet({ type: 'folder-rename', categoryId: category.id });
                    }}
                    className="pr-2.5 pl-1 h-full inline-flex items-center rounded-r-full hover:bg-black/20 transition-colors"
                    title="Rename folder"
                  >
                    <Pencil className="w-3 h-3 text-white/70" />
                  </motion.button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Tweet list */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(113,113,122,0.4) transparent' }}
      >
        {visibleTweets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center h-full px-8 text-center"
          >
            <Bookmark className="w-16 h-16 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-400 text-lg font-bold mb-1">
              {searchQuery ? 'No results' : 'Nothing here yet'}
            </p>
            <p className="text-zinc-600 text-sm">
              {searchQuery ? 'Try different keywords' : 'Tap the bookmark icon on any post to save it here'}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleTweets.map(tweet => (
              <motion.div
                key={tweet.id}
                layout
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97, height: 0 }}
                transition={{ duration: 0.18 }}
              >
                <TweetComponent
                  tweet={tweet}
                  context="library"
                  isBookmarked={isBookmarked(tweet.id)}
                  onBookmarkClick={() => handleRemoveBookmark(tweet.id)}
                  onMenuClick={() => setActiveSheet({ type: 'tweet-menu', tweetId: tweet.id })}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            className="absolute bottom-20 left-4 right-4 bg-[#1D9BF0] text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50"
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0,  y: 20,  scale: 0.92 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
          >
            <CheckCircle className="w-5 h-5 flex-shrink-0 fill-white text-[#1D9BF0]" />
            <span className="text-sm font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom Sheets ─────────────────────────────────────────────────── */}

      {/* Shared backdrop */}
      <AnimatePresence>
        {activeSheet !== null && (
          <motion.div
            className="absolute inset-0 bg-black/60 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setActiveSheet(null);
              setRenameValue('');
              setRenameError('');
            }}
          />
        )}
      </AnimatePresence>

      {/* Folder actions sheet */}
      <AnimatePresence>
        {activeSheet?.type === 'folder-actions' && (
          <BottomSheet onClose={() => setActiveSheet(null)}>
            <button
              className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-zinc-800 rounded-lg transition-colors"
              onClick={() => {
                const cat = categories.find(c => c.id === (activeSheet as { categoryId: string }).categoryId);
                setRenameValue(cat?.name || '');
                setActiveSheet({ type: 'folder-rename', categoryId: (activeSheet as { categoryId: string }).categoryId });
              }}
            >
              <Edit2 className="w-5 h-5" />
              <span>Rename Folder</span>
            </button>
            <button
              className="w-full flex items-center gap-4 px-4 py-4 text-red-500 hover:bg-zinc-800 rounded-lg transition-colors"
              onClick={() => setActiveSheet({ type: 'folder-delete', categoryId: (activeSheet as { categoryId: string }).categoryId })}
            >
              <Trash2 className="w-5 h-5" />
              <span>Delete Folder</span>
            </button>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Folder rename sheet */}
      <AnimatePresence>
        {activeSheet?.type === 'folder-rename' && (
          <BottomSheet onClose={() => { setActiveSheet(null); setRenameValue(''); setRenameError(''); }}>
            <h3 className="text-white text-lg font-bold mb-4">Rename Folder</h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => { setRenameValue(e.target.value); setRenameError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleRenameSubmit()}
              placeholder="Folder name"
              autoFocus
              className="w-full bg-zinc-800 text-white px-4 py-3 rounded-xl border border-zinc-700 focus:border-[#1D9BF0] focus:outline-none mb-2"
            />
            {renameError && <p className="text-red-500 text-sm mb-3">{renameError}</p>}
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setActiveSheet(null); setRenameValue(''); setRenameError(''); }}
                className="flex-1 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >Cancel</button>
              <button
                onClick={handleRenameSubmit}
                className="flex-1 py-3 bg-[#1D9BF0] text-white rounded-xl hover:bg-[#1a8cd8] transition-colors font-semibold"
              >Save</button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Folder delete sheet */}
      <AnimatePresence>
        {activeSheet?.type === 'folder-delete' && (
          <BottomSheet onClose={() => setActiveSheet(null)}>
            <h3 className="text-white text-lg font-bold mb-2">Delete Folder?</h3>
            <p className="text-zinc-400 text-sm mb-5">
              This permanently deletes the folder and all bookmarks inside it. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setActiveSheet(null)}
                className="flex-1 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors"
              >Cancel</button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-semibold"
              >Delete</button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Tweet action menu */}
      <AnimatePresence>
        {activeSheet?.type === 'tweet-menu' && (
          <BottomSheet onClose={() => setActiveSheet(null)}>
            <button
              className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-zinc-800 rounded-lg transition-colors"
              onClick={() => setActiveSheet({ type: 'tweet-move', tweetId: (activeSheet as { tweetId: number }).tweetId })}
            >
              <FolderInput className="w-5 h-5" />
              <span>Move to another folder</span>
            </button>
            <button
              className="w-full flex items-center gap-4 px-4 py-4 text-white hover:bg-zinc-800 rounded-lg transition-colors"
              onClick={() => setActiveSheet({ type: 'tweet-explain', tweetId: (activeSheet as { tweetId: number }).tweetId })}
            >
              <Info className="w-5 h-5" />
              <span>Why was this saved here?</span>
            </button>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* Move to folder sheet */}
      <AnimatePresence>
        {activeSheet?.type === 'tweet-move' && (
          <BottomSheet onClose={() => setActiveSheet(null)} className="max-h-[60vh] overflow-y-auto">
            <h3 className="text-white text-lg font-bold mb-4">Move to folder</h3>
            <div className="space-y-1">
              {categories
                .filter(c => c.id !== activeCategoryId)
                .map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleMoveToFolder(category.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-white hover:bg-zinc-800 rounded-xl transition-colors text-left"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: category.color }} />
                    <span>{category.name}</span>
                    <span className="ml-auto text-zinc-500 text-xs">
                      {getTweetsForCategory(category.id).length}
                    </span>
                  </button>
                ))}
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>

      {/* AI explanation sheet */}
      <AnimatePresence>
        {activeSheet?.type === 'tweet-explain' && (() => {
          const tweetId = (activeSheet as { tweetId: number }).tweetId;
          const tweet   = bookmarksById[tweetId];
          const catName = activeCategoryId === ALL_TAB_ID
            ? categories.find(c => getTweetsForCategory(c.id).some(t => t.id === tweetId))?.name
            : categories.find(c => c.id === activeCategoryId)?.name;
          const keywords   = tweet?.bookmarkMeta?.matchedKeywords || [];
          const confidence = tweet?.bookmarkMeta?.confidence || 0.75;

          return (
            <BottomSheet onClose={() => setActiveSheet(null)}>
              <h3 className="text-white text-lg font-bold mb-4">Why this folder?</h3>
              <div className="space-y-3">
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Saved under{' '}
                  <span className="font-bold text-white">{catName}</span>{' '}
                  because {keywords.length > 0 ? 'it mentions' : 'the content is related to'}{' '}
                  <span className="text-[#1D9BF0] font-semibold">
                    {keywords.length > 0
                      ? keywords.slice(0, 3).join(', ')
                      : catName?.toLowerCase()}
                  </span>
                  {keywords.length > 3 && ` and ${keywords.length - 3} more`}.
                </p>

                {tweet?.bookmarkMeta && (
                  <>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="h-full bg-[#1D9BF0] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${confidence * 100}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="text-xs text-zinc-400 w-16 text-right">
                        {Math.round(confidence * 100)}% match
                      </span>
                    </div>
                    <p className="text-zinc-600 text-xs pt-1">
                      Move this post to a different folder and Grok learns from your correction.
                    </p>
                    <p className="text-zinc-600 text-xs">
                      Current AI accuracy score: <span className="text-zinc-400">{userTrustScore}%</span>
                    </p>
                  </>
                )}
              </div>

              <button
                onClick={() => setActiveSheet(null)}
                className="w-full mt-5 py-3 bg-[#1D9BF0] text-white rounded-xl hover:bg-[#1a8cd8] transition-colors font-semibold"
              >
                Got it
              </button>
            </BottomSheet>
          );
        })()}
      </AnimatePresence>

    </div>
  );
}

// ─── Shared BottomSheet wrapper ───────────────────────────────────────────────

function BottomSheet({ children, onClose, className = '' }: { children: React.ReactNode; onClose: () => void; className?: string }) {
  return (
    <motion.div
      className={`absolute bottom-0 left-0 right-0 bg-zinc-900 rounded-t-3xl px-6 pt-4 pb-8 border-t border-zinc-800 z-50 ${className}`}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      <div className="w-10 h-1 bg-zinc-700 rounded-full mx-auto mb-5" />
      {children}
    </motion.div>
  );
}