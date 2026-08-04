import { Bookmark, Heart, MessageCircle, Repeat2, Share, BarChart2, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import type { Tweet } from './App';
import { BookmarkSyncIndicator, type SyncIndicatorStatus } from './components/sync';

interface TweetComponentProps {
  tweet: Tweet;
  isBookmarked: boolean;
  onBookmarkClick: () => void;
  onMenuClick?: () => void;
  /** Controls which interactions are active. Feed shows like/retweet. Library shows move/explain. */
  context?: 'feed' | 'library';
  isLiked?: boolean;
  isRetweeted?: boolean;
  onLikeClick?: () => void;
  onRetweetClick?: () => void;
  syncStatus?: SyncIndicatorStatus;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    const f = (num / 1_000_000).toFixed(1);
    return f.endsWith('.0') ? f.slice(0, -2) + 'M' : f + 'M';
  }
  if (num >= 1_000) {
    const f = (num / 1_000).toFixed(1);
    return f.endsWith('.0') ? f.slice(0, -2) + 'K' : f + 'K';
  }
  return num.toString();
}

/** Deterministic-but-not-obvious view count multiplier based on tweet id */
function viewMultiplier(id: number): number {
  return 7 + (id % 19);
}

export function TweetComponent({
  tweet,
  isBookmarked,
  onBookmarkClick,
  onMenuClick,
  context = 'feed',
  isLiked     = false,
  isRetweeted = false,
  onLikeClick,
  onRetweetClick,
  syncStatus = 'none',
}: TweetComponentProps) {
  const likeCount     = tweet.likes     + (isLiked     ? 1 : 0);
  const retweetCount  = tweet.retweets  + (isRetweeted ? 1 : 0);
  const viewCount     = tweet.likes * viewMultiplier(tweet.id);

  return (
    <div className="border-b border-zinc-800 p-4 hover:bg-zinc-900/30 transition-colors cursor-pointer">
      <div className="flex gap-3">
        <img
          src={tweet.avatar}
          alt={tweet.author}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">

          {/* Header row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0 flex-wrap">
              <span className="text-white font-bold truncate">{tweet.author}</span>
              {tweet.isVerified && (
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-[#1D9BF0] flex-shrink-0">
                  <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z" />
                </svg>
              )}
              <span className="text-zinc-500 truncate text-sm">{tweet.handle}</span>
              <span className="text-zinc-500 mx-0.5 flex-shrink-0">·</span>
              <span className="text-zinc-500 text-sm flex-shrink-0">{tweet.time}</span>
              {tweet.isAd && (
                <span className="ml-1 px-1.5 py-0.5 border border-zinc-700 rounded text-[10px] text-zinc-500 font-bold leading-none uppercase flex-shrink-0">
                  Ad
                </span>
              )}
            </div>
            {onMenuClick && (
              <MoreHorizontal
                className="w-5 h-5 text-zinc-500 flex-shrink-0 hover:text-[#1D9BF0] transition-colors cursor-pointer"
                onClick={e => { e.stopPropagation(); onMenuClick(); }}
              />
            )}
          </div>

          {/* Content */}
          <div className="text-white mt-1 break-words text-[15px] leading-relaxed">
            {tweet.content}
          </div>

          {/* Media */}
          {tweet.image && (
            <div className="mt-3 rounded-2xl overflow-hidden relative border border-zinc-800">
              {tweet.isVideo ? (
                <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden">
                  <img
                    src={tweet.image}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                  {/* Duration badge */}
                  <div className="absolute bottom-2 left-2 bg-black/80 px-1.5 py-0.5 rounded text-white text-[10px] font-bold tracking-wide">
                    {tweet.videoDuration || '0:45'}
                  </div>
                </div>
              ) : (
                <img
                  src={tweet.image}
                  alt="Tweet media"
                  className="w-full max-h-[280px] object-cover"
                />
              )}
            </div>
          )}

          {/* Ad CTA */}
          {tweet.isAd && (
            <button className="mt-3 w-full py-2 bg-white text-black font-bold rounded-full text-sm hover:bg-zinc-200 transition-colors">
              Learn More
            </button>
          )}

          {/* Action row — all buttons use the same structure: p-[6px] icon div + leading-none count */}
          <div className="flex justify-between items-center mt-3 text-zinc-500 -ml-1.5 flex-nowrap overflow-hidden">

            {/* Reply */}
            <button className="group flex items-center hover:text-[#1D9BF0] transition-colors">
              <div className="p-[6px] group-hover:bg-[#1D9BF0]/10 rounded-full transition-colors flex items-center justify-center">
                <MessageCircle className="w-[17px] h-[17px] block" />
              </div>
              <span className="text-[13px] leading-none tabular-nums ml-0.5">{formatNumber(tweet.comments)}</span>
            </button>

            {/* Retweet */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={e => { e.stopPropagation(); onRetweetClick?.(); }}
              className={`group flex items-center transition-colors ${isRetweeted ? 'text-green-500' : 'hover:text-green-500'}`}
            >
              <div className={`p-[6px] rounded-full transition-colors flex items-center justify-center ${isRetweeted ? 'bg-green-500/10' : 'group-hover:bg-green-500/10'}`}>
                <Repeat2 className="w-[17px] h-[17px] block" />
              </div>
              <span className="text-[13px] leading-none tabular-nums ml-0.5">{formatNumber(retweetCount)}</span>
            </motion.button>

            {/* Like */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={e => { e.stopPropagation(); onLikeClick?.(); }}
              className={`group flex items-center transition-colors ${isLiked ? 'text-pink-500' : 'hover:text-pink-500'}`}
            >
              <div className={`p-[6px] rounded-full transition-colors flex items-center justify-center ${isLiked ? 'bg-pink-500/10' : 'group-hover:bg-pink-500/10'}`}>
                <Heart className={`w-[17px] h-[17px] block ${isLiked ? 'fill-pink-500' : ''}`} />
              </div>
              <span className="text-[13px] leading-none tabular-nums ml-0.5">{formatNumber(likeCount)}</span>
            </motion.button>

            {/* Views */}
            <button className="group flex items-center hover:text-[#1D9BF0] transition-colors">
              <div className="p-[6px] group-hover:bg-[#1D9BF0]/10 rounded-full transition-colors flex items-center justify-center">
                <BarChart2 className="w-[17px] h-[17px] block" />
              </div>
              <span className="text-[13px] leading-none tabular-nums ml-0.5">{formatNumber(viewCount)}</span>
            </button>

            {/* Bookmark + Share + Sync Status */}
            <div className="flex items-center gap-1">
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={e => { e.stopPropagation(); onBookmarkClick(); }}
                className={`group p-[6px] rounded-full transition-colors flex items-center justify-center relative ${
                  isBookmarked ? 'text-[#1D9BF0]' : 'hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10'
                }`}
              >
                <Bookmark className={`w-[17px] h-[17px] block transition-all ${isBookmarked ? 'fill-[#1D9BF0]' : ''}`} />
              </motion.button>
              {isBookmarked && <BookmarkSyncIndicator status={syncStatus} bookmarkId={tweet.id} version={tweet.version} lastModified={tweet.lastModified} />}
              <button className="group p-[6px] hover:text-[#1D9BF0] hover:bg-[#1D9BF0]/10 rounded-full transition-colors flex items-center justify-center">
                <Share className="w-[17px] h-[17px] block" />
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}