import { useState, useReducer, useCallback, useEffect } from 'react';
import { FeedScreen } from './FeedScreen';
import { LibraryScreen } from './LibraryScreen';
import { motion, AnimatePresence } from 'motion/react';

export interface Tweet {
  id: number;
  author: string;
  handle: string;
  time: string;
  content: string;
  avatar: string;
  comments: number;
  retweets: number;
  likes: number;
  image: string | null;
  category: string;
  bookmarkedAt?: number;
  isVideo?: boolean;
  videoDuration?: string;
  isAd?: boolean;
  isVerified?: boolean;
  bookmarkMeta?: {
    category: string;
    confidence: number;
    autoAssigned: boolean;
    matchedKeywords?: string[];
  };
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface BookmarkMeta {
  category: string;
  categoryId: string;
  confidence: number;
  autoAssigned: boolean;
  matchedKeywords: string[];
}

interface CorrectionRecord {
  tweetId: number;
  oldCategory: string;
  newCategory: string;
  keywordPattern: string;
  timestamp: number;
}

interface BookmarkStore {
  byId: Record<number, Tweet>;
  tweetToFolder: Record<number, string>;
  folderToTweets: Record<string, number[]>;
}

type BookmarkAction =
  | { type: 'ADD'; tweet: Tweet; categoryId: string }
  | { type: 'REMOVE'; tweetId: number }
  | { type: 'MOVE'; tweetId: number; fromCategoryId: string; toCategoryId: string }
  | { type: 'DELETE_FOLDER'; categoryId: string };

function bookmarkReducer(state: BookmarkStore, action: BookmarkAction): BookmarkStore {
  switch (action.type) {
    case 'ADD':
      return {
        byId: { ...state.byId, [action.tweet.id]: action.tweet },
        tweetToFolder: { ...state.tweetToFolder, [action.tweet.id]: action.categoryId },
        folderToTweets: {
          ...state.folderToTweets,
          [action.categoryId]: [...(state.folderToTweets[action.categoryId] || []), action.tweet.id],
        },
      };
    case 'REMOVE': {
      const catId = state.tweetToFolder[action.tweetId];
      if (!catId) return state;
      const newById = { ...state.byId };
      delete newById[action.tweetId];
      const newTweetToFolder = { ...state.tweetToFolder };
      delete newTweetToFolder[action.tweetId];
      const newFolderToTweets = { ...state.folderToTweets };
      const remaining = (newFolderToTweets[catId] || []).filter(id => id !== action.tweetId);
      if (remaining.length === 0) delete newFolderToTweets[catId];
      else newFolderToTweets[catId] = remaining;
      return { byId: newById, tweetToFolder: newTweetToFolder, folderToTweets: newFolderToTweets };
    }
    case 'MOVE': {
      const tweet = state.byId[action.tweetId];
      if (!tweet) return state;
      const newFolderToTweets = { ...state.folderToTweets };
      const oldRemaining = (newFolderToTweets[action.fromCategoryId] || []).filter(id => id !== action.tweetId);
      if (oldRemaining.length === 0) delete newFolderToTweets[action.fromCategoryId];
      else newFolderToTweets[action.fromCategoryId] = oldRemaining;
      newFolderToTweets[action.toCategoryId] = [...(newFolderToTweets[action.toCategoryId] || []), action.tweetId];
      return {
        byId: {
          ...state.byId,
          [action.tweetId]: {
            ...tweet,
            bookmarkMeta: tweet.bookmarkMeta ? { ...tweet.bookmarkMeta, autoAssigned: false } : undefined,
          },
        },
        tweetToFolder: { ...state.tweetToFolder, [action.tweetId]: action.toCategoryId },
        folderToTweets: newFolderToTweets,
      };
    }
    case 'DELETE_FOLDER': {
      const tweetIds = state.folderToTweets[action.categoryId] || [];
      const newById = { ...state.byId };
      const newTweetToFolder = { ...state.tweetToFolder };
      tweetIds.forEach(id => { delete newById[id]; delete newTweetToFolder[id]; });
      const newFolderToTweets = { ...state.folderToTweets };
      delete newFolderToTweets[action.categoryId];
      return { byId: newById, tweetToFolder: newTweetToFolder, folderToTweets: newFolderToTweets };
    }
    default:
      return state;
  }
}

const CATEGORY_COLORS = [
  '#1D9BF0', 'rgb(168, 85, 247)', 'rgb(236, 72, 153)', 'rgb(239, 68, 68)',
  'rgb(34, 197, 94)', 'rgb(251, 146, 60)', 'rgb(14, 165, 233)', 'rgb(217, 70, 239)',
  'rgb(132, 204, 22)', 'rgb(244, 63, 94)',
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'dev-resources', name: 'Dev Resources', color: CATEGORY_COLORS[0], createdAt: Date.now() - 5000 },
  { id: 'crypto',        name: 'Crypto',        color: CATEGORY_COLORS[1], createdAt: Date.now() - 4000 },
  { id: 'design',        name: 'Design',        color: CATEGORY_COLORS[2], createdAt: Date.now() - 3000 },
  { id: 'automobiles',   name: 'Automobiles',   color: CATEGORY_COLORS[3], createdAt: Date.now() - 2000 },
  { id: 'sports',        name: 'Sports',        color: CATEGORY_COLORS[4], createdAt: Date.now() - 1000 },
];

function generateCategoryId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}

function getCategoryColor(index: number): string {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Dev Resources': ['python', 'javascript', 'react', 'typescript', 'code', 'programming', 'dev', 'api', 'github', 'kubernetes', 'docker', 'database', 'sql', 'debugging', 'deno', 'node', 'graphql', 'jwt', 'lambda', 'serverless', 'cypress', 'mongodb', 'owasp', 'microservice'],
  'Crypto':        ['bitcoin', 'ethereum', 'crypto', 'blockchain', 'defi', 'nft', 'web3', 'solana', 'token', 'dao', 'coinbase', 'staking', 'ath', 'bull run', 'layer 2', 'rollup', 'smart contract'],
  'Design':        ['design', 'ui', 'ux', 'figma', 'color', 'typography', 'animation', 'branding', 'icon', 'micro-interaction', 'prototype', 'wireframe', 'conversion', 'user testing', 'neumorphism', 'dark mode'],
  'Automobiles':   ['car', 'auto', 'vehicle', 'electric', 'ev', 'tesla', 'bmw', 'mercedes', 'porsche', 'engine', 'mustang', 'model s', 'plaid', 'gt3', 'aero', 'adas', 'hybrid', 'lucid', 'mclaren', 'le mans'],
  'Sports':        ['game', 'sport', 'basketball', 'football', 'soccer', 'championship', 'nfl', 'nba', 'player', 'team', 'espn', 'catch', 'overtime', 'season', 'marathon', 'training'],
  'Cooking':       ['recipe', 'chef', 'cook', 'food', 'pasta', 'dinner', 'ingredient', 'kitchen', 'meal', 'ramsay', 'scrambled eggs', 'shrimp', 'flavor'],
  'News':          ['breaking', 'summit', 'bbc', 'reuters', 'climate', 'global', 'announce', 'agreement'],
  'Fitness':       ['workout', 'exercise', 'fitness', 'core strength', 'yoga', 'training', 'gym', 'morning workout'],
  'Health':        ['sleep', 'wellness', 'health', 'mediterranean diet', 'doctor', 'nutrition', 'diet'],
  'Entertainment': ['movie', 'netflix', 'film', 'series', 'trailer', 'dune', 'watched', 'binge'],
  'Technology':    ['tech', 'apple', 'chip', 'neural', 'ai', 'vr', 'headset', 'meta', 'verge', 'quantum', 'm4', 'processor'],
  'Real Estate':   ['home', 'house', 'zillow', 'property', 'real estate', 'listing'],
};

// ─── localStorage helpers ─────────────────────────────────────────────────────

const LS_KEYS = {
  store:       'xrecall_store',
  categories:  'xrecall_categories',
  corrections: 'xrecall_corrections',
};

function lsGet<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

// ─── AI Inference ─────────────────────────────────────────────────────────────

function inferTopicFromTweet(
  tweet: Tweet,
  existingCategories: Category[],
  correctionHistory: CorrectionRecord[],
  trustScore: number,
): { category: string; confidence: number; matchedKeywords: string[] } {
  const content = tweet.content.toLowerCase();
  const author  = tweet.author.toLowerCase();
  const existingNames = existingCategories.map(c => c.name);

  for (const correction of correctionHistory) {
    if (content.includes(correction.keywordPattern.toLowerCase())) {
      const learnedConfidence = Math.min(0.88 + (trustScore / 100) * 0.10, 0.98);
      return { category: correction.newCategory, confidence: learnedConfidence, matchedKeywords: [correction.keywordPattern] };
    }
  }

  let best: { category: string; matchedKeywords: string[]; count: number } | null = null;

  for (const pass of [true, false]) {
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (pass !== existingNames.includes(category)) continue;
      const matched = keywords.filter(kw => content.includes(kw) || author.includes(kw));
      if (matched.length > 0 && (!best || matched.length > best.count)) {
        best = { category, matchedKeywords: matched, count: matched.length };
      }
    }
    if (best) break;
  }

  if (best) {
    const base       = 0.52;
    const boost      = Math.min(best.count * 0.12, 0.35);
    const trustBonus = (trustScore / 100) * 0.06;
    const confidence = Math.min(base + boost + trustBonus, 0.96);
    return { category: best.category, confidence, matchedKeywords: best.matchedKeywords };
  }

  return { category: tweet.category, confidence: 0.38, matchedKeywords: [] };
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

type SeedEntry = { categoryId: string; tweets: Omit<Tweet, 'bookmarkedAt'>[] };

const SEED_DATA: SeedEntry[] = [
  {
    categoryId: 'dev-resources',
    tweets: [
      { id: 1001, author: 'CodeMaster',      handle: '@CodeMaster',      time: '4h',  content: 'Building scalable microservices with Node.js: A comprehensive guide to architecture patterns and best practices 🚀',          avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 45,  retweets: 123, likes: 456,  image: null, category: 'Dev Resources' },
      { id: 1002, author: 'DevOpsGuru',      handle: '@DevOpsGuru',      time: '6h',  content: 'Docker container optimization techniques that reduced our deploy time by 75% 🐳',                                               avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 67,  retweets: 189, likes: 678,  image: null, category: 'Dev Resources' },
      { id: 1003, author: 'FullStackDev',    handle: '@FullStackDev',    time: '8h',  content: 'GraphQL vs REST: When to use which? Complete comparison with real-world examples',                                               avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 89,  retweets: 234, likes: 789,  image: null, category: 'Dev Resources' },
      { id: 1004, author: 'BackendExpert',   handle: '@BackendExpert',   time: '12h', content: 'Implementing JWT authentication with refresh tokens: Security best practices 🔐',                                               avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 123, retweets: 345, likes: 890,  image: null, category: 'Dev Resources' },
      { id: 1005, author: 'CloudNative',     handle: '@CloudNative',     time: '15h', content: 'AWS Lambda cold start optimization: Practical strategies to improve serverless performance ⚡',                                  avatar: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 56,  retweets: 167, likes: 543,  image: null, category: 'Dev Resources' },
      { id: 1006, author: 'ReactMaster',     handle: '@ReactMaster',     time: '18h', content: 'Advanced React patterns every senior dev should know: Compound Components, Render Props, Custom Hooks 🧵',                      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 78,  retweets: 198, likes: 654,  image: null, category: 'Dev Resources' },
      { id: 1007, author: 'SecurityFirst',   handle: '@SecurityFirst',   time: '1d',  content: 'OWASP Top 10 2026: New vulnerabilities and how to protect your applications 🛡️',                                               avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 134, retweets: 389, likes: 876,  image: null, category: 'Dev Resources' },
      { id: 1008, author: 'PerformanceGuru', handle: '@PerformanceGuru', time: '2d',  content: 'Web Vitals optimization: Achieving 100/100 Lighthouse scores in production 🎯',                                                avatar: 'https://images.unsplash.com/photo-1586297135537-94bc9ba060aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 67,  retweets: 178, likes: 598,  image: null, category: 'Dev Resources' },
    ],
  },
  {
    categoryId: 'crypto',
    tweets: [
      { id: 2001, author: 'BlockchainDev',  handle: '@BlockchainDev',  time: '3h',  content: 'Smart contract gas optimization: Reduce transaction costs by 60% with these techniques 💰',           avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 87,  retweets: 245, likes: 789,  image: null, category: 'Crypto' },
      { id: 2002, author: 'DeFiResearch',   handle: '@DeFiResearch',   time: '5h',  content: 'Liquidity mining strategies for 2026: Maximizing yields while minimizing risks 📈',                  avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 123, retweets: 456, likes: 1234, image: null, category: 'Crypto' },
      { id: 2003, author: 'Web3Builder',    handle: '@Web3Builder',    time: '7h',  content: 'Integrating Web3 wallets: MetaMask, WalletConnect, and Coinbase Wallet comparison 🔗',                avatar: 'https://images.unsplash.com/photo-1574701148212-8518049769bb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 67,  retweets: 178, likes: 654,  image: null, category: 'Crypto' },
      { id: 2004, author: 'TokenEconomics', handle: '@TokenEconomics', time: '10h', content: 'Tokenomics design patterns: Creating sustainable crypto economic models 💎',                          avatar: 'https://images.unsplash.com/photo-1601455763557-db1bea8a9a5a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 145, retweets: 389, likes: 967,  image: null, category: 'Crypto' },
      { id: 2005, author: 'StakingExpert',  handle: '@StakingExpert',  time: '13h', content: 'Proof of Stake vs Proof of Work: Environmental and economic implications 🌱',                         avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 156, retweets: 423, likes: 1089, image: null, category: 'Crypto' },
      { id: 2006, author: 'LayerTwoLabs',   handle: '@LayerTwoLabs',   time: '16h', content: 'Layer 2 scaling solutions compared: Optimistic vs ZK Rollups performance metrics ⚡',                 avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 89,  retweets: 256, likes: 812,  image: null, category: 'Crypto' },
      { id: 2007, author: 'CryptoSecurity', handle: '@CryptoSecurity', time: '1d',  content: 'Hardware wallet security: Protecting your crypto assets from sophisticated attacks 🔒',               avatar: 'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 134, retweets: 378, likes: 923,  image: null, category: 'Crypto' },
      { id: 2008, author: 'ChainAnalyst',   handle: '@ChainAnalyst',   time: '2d',  content: 'On-chain analytics: Reading blockchain data for better trading decisions 📊',                         avatar: 'https://images.unsplash.com/photo-1611432579699-484f7990b127?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 98,  retweets: 267, likes: 834,  image: null, category: 'Crypto' },
    ],
  },
  {
    categoryId: 'design',
    tweets: [
      { id: 3001, author: 'UIWizard',          handle: '@UIWizard',          time: '3h',  content: 'Neumorphism in 2026: Modern approaches to soft UI design with accessibility in mind 🎨',  avatar: 'https://images.unsplash.com/photo-1614436163996-25cee5f54290?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 78,  retweets: 234, likes: 678,  image: null, category: 'Design' },
      { id: 3002, author: 'PrototypeQueen',    handle: '@PrototypeQueen',    time: '5h',  content: 'Rapid prototyping workflow: From sketch to high-fidelity in 24 hours ⚡',                   avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 92,  retweets: 267, likes: 789,  image: null, category: 'Design' },
      { id: 3003, author: 'InteractionDesign', handle: '@InteractionDesign', time: '8h',  content: 'Micro-interactions that delight: 20 examples from top apps with implementation tips 💫',   avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 134, retweets: 389, likes: 1023, image: null, category: 'Design' },
      { id: 3004, author: 'DesignTokens',      handle: '@DesignTokens',      time: '11h', content: 'Design system tokens: Building scalable and maintainable design infrastructure 🏗️',          avatar: 'https://images.unsplash.com/photo-1624298357597-fd92dfbec561?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 67,  retweets: 198, likes: 654,  image: null, category: 'Design' },
      { id: 3005, author: 'A11yChampion',      handle: '@A11yChampion',      time: '14h', content: 'Inclusive design patterns: Making your products accessible to everyone ♿',                   avatar: 'https://images.unsplash.com/photo-1628890920690-9e29d0019b9b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 156, retweets: 445, likes: 1189, image: null, category: 'Design' },
      { id: 3006, author: 'DarkModeExpert',    handle: '@DarkModeExpert',    time: '17h', content: 'Perfecting dark mode: Color systems that work across light and dark themes 🌓',               avatar: 'https://images.unsplash.com/photo-1636622433525-127afee35f35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 112, retweets: 323, likes: 867,  image: null, category: 'Design' },
      { id: 3007, author: 'AnimationStudio',   handle: '@AnimationStudio',   time: '20h', content: 'Easing functions explained: Creating natural motion in digital interfaces 🎬',                avatar: 'https://images.unsplash.com/photo-1640951613773-54706e06851d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 145, retweets: 389, likes: 978,  image: null, category: 'Design' },
      { id: 3008, author: 'UXResearch',        handle: '@UXResearch',        time: '1d',  content: 'Case study: How we improved conversion by 300% with better UX research and user testing 📊', avatar: 'https://images.unsplash.com/photo-1555952517-2e8e729e0b44?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 87,  retweets: 178, likes: 623,  image: null, category: 'Design' },
    ],
  },
  {
    categoryId: 'automobiles',
    tweets: [
      { id: 4001, author: 'EVTechnology',     handle: '@EVTechnology',     time: '4h',  content: 'Solid-state batteries: The future of electric vehicle range and charging speed 🔋',               avatar: 'https://images.unsplash.com/photo-1561406636-b80293969660?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 156, retweets: 445, likes: 1234, image: null, category: 'Automobiles' },
      { id: 4002, author: 'RacingLegends',    handle: '@RacingLegends',    time: '6h',  content: 'Le Mans 2026 preview: Hypercar regulations and the return of legendary manufacturers 🏁',        avatar: 'https://images.unsplash.com/photo-1571482742249-eba720c81b25?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 234, retweets: 567, likes: 1567, image: null, category: 'Automobiles' },
      { id: 4003, author: 'CarTechReview',    handle: '@CarTechReview',    time: '9h',  content: 'Autonomous driving levels explained: Understanding SAE J3016 standards in real-world scenarios 🤖', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 189, retweets: 423, likes: 1089, image: null, category: 'Automobiles' },
      { id: 4004, author: 'SupercarSpotting', handle: '@SupercarSpotting', time: '12h', content: 'McLaren P1 successor teaser: Hybrid hypercar performance reaches new heights 🚀',               avatar: 'https://images.unsplash.com/photo-1548504769-900b70ed122e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 245, retweets: 678, likes: 1890, image: null, category: 'Automobiles' },
      { id: 4005, author: 'HybridTech',       handle: '@HybridTech',       time: '15h', content: 'Plug-in hybrid vs full EV: Real-world range comparisons and charging infrastructure 🔌',          avatar: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 167, retweets: 389, likes: 1012, image: null, category: 'Automobiles' },
      { id: 4006, author: 'AeroDesign',       handle: '@AeroDesign',       time: '18h', content: 'Automotive aerodynamics: How drag coefficient affects efficiency and performance 💨',              avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 134, retweets: 334, likes: 867,  image: null, category: 'Automobiles' },
      { id: 4007, author: 'LuxuryCarReview',  handle: '@LuxuryCarReview',  time: '1d',  content: 'Ultra-luxury segment 2026: Rolls-Royce, Bentley, and Maybach compared 👑',                      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 223, retweets: 556, likes: 1456, image: null, category: 'Automobiles' },
      { id: 4008, author: 'VintageCarCare',   handle: '@VintageCarCare',   time: '2d',  content: 'Classic car restoration: Preserving automotive history with modern techniques 🔩',               avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 112, retweets: 289, likes: 756,  image: null, category: 'Automobiles' },
    ],
  },
  {
    categoryId: 'sports',
    tweets: [
      { id: 5001, author: 'TrainingScience',   handle: '@TrainingScience',   time: '3h',  content: 'Sports performance analytics: How data science is revolutionizing athlete training 📊',      avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 145, retweets: 389, likes: 978,  image: null, category: 'Sports' },
      { id: 5002, author: 'TacticalFootball',  handle: '@TacticalFootball',  time: '6h',  content: 'Modern football tactics: Breaking down the 3-2-4-1 formation taking Europe by storm ⚽',      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 234, retweets: 567, likes: 1456, image: null, category: 'Sports' },
      { id: 5003, author: 'MentalGameCoach',   handle: '@MentalGameCoach',   time: '9h',  content: 'Sports psychology: Building mental resilience for peak performance under pressure 🧠',          avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 178, retweets: 445, likes: 1089, image: null, category: 'Sports' },
      { id: 5004, author: 'TeamDynamics',      handle: '@TeamDynamics',      time: '12h', content: 'Leadership in team sports: Building championship culture from the ground up 🏆',               avatar: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 203, retweets: 512, likes: 1345, image: null, category: 'Sports' },
      { id: 5005, author: 'NutritionCoach',    handle: '@NutritionCoach',    time: '15h', content: 'Athletic nutrition periodization: Fueling performance throughout the competitive season 🥗',    avatar: 'https://images.unsplash.com/photo-1583394293214-28ded15ee548?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 112, retweets: 298, likes: 823,  image: null, category: 'Sports' },
      { id: 5006, author: 'EnduranceAthletes', handle: '@EnduranceAthletes', time: '18h', content: 'Marathon training strategies: Building endurance while preventing overtraining 🏃',              avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 167, retweets: 412, likes: 1023, image: null, category: 'Sports' },
      { id: 5007, author: 'BiomechanicsLab',   handle: '@BiomechanicsLab',   time: '1d',  content: 'Motion capture technology: Analyzing athlete movement for injury prevention 🎯',               avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb4c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 156, retweets: 378, likes: 934,  image: null, category: 'Sports' },
      { id: 5008, author: 'StrengthCoaching',  handle: '@StrengthCoaching',  time: '2d',  content: 'Periodization principles: Structuring training cycles for optimal athletic performance 💪',    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=100', comments: 145, retweets: 367, likes: 945,  image: null, category: 'Sports' },
    ],
  },
];

function buildInitialStore(): BookmarkStore {
  const saved = lsGet<BookmarkStore>(LS_KEYS.store);
  if (saved && Object.keys(saved.byId).length > 0) return saved;

  const byId: Record<number, Tweet> = {};
  const tweetToFolder: Record<number, string> = {};
  const folderToTweets: Record<string, number[]> = {};

  SEED_DATA.forEach(({ categoryId, tweets }, catIndex) => {
    folderToTweets[categoryId] = [];
    tweets.forEach((tweet, tweetIndex) => {
      const bookmarkedAt = Date.now() - 3600000 * (3 + tweetIndex + catIndex * 3);
      const full: Tweet = { ...tweet, bookmarkedAt };
      byId[tweet.id] = full;
      tweetToFolder[tweet.id] = categoryId;
      folderToTweets[categoryId].push(tweet.id);
    });
  });

  return { byId, tweetToFolder, folderToTweets };
}

type Screen = 'feed' | 'library';

export default function App() {
  const [activeScreen,     setActiveScreen]     = useState<Screen>('feed');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>(
    () => lsGet<Category[]>(LS_KEYS.categories) ?? INITIAL_CATEGORIES
  );

  const [store, dispatch] = useReducer(bookmarkReducer, undefined, buildInitialStore);

  const [correctionHistory, setCorrectionHistory] = useState<CorrectionRecord[]>(
    () => lsGet<CorrectionRecord[]>(LS_KEYS.corrections) ?? []
  );

  const [userTrustScore, setUserTrustScore] = useState(75);

  useEffect(() => {
    lsSet(LS_KEYS.store,       store);
    lsSet(LS_KEYS.categories,  categories);
    lsSet(LS_KEYS.corrections, correctionHistory);
  }, [store, categories, correctionHistory]);

  const handleBackToFeed = useCallback(() => {
    setActiveScreen('feed');
    setSelectedFolderId(null);
  }, []);

  const handleNavigateToLibrary = useCallback((folderId?: string) => {
    setActiveScreen('library');
    if (folderId) setSelectedFolderId(folderId);
  }, []);

  const addBookmark = useCallback((tweet: Tweet): { categoryId: string; categoryName: string; meta: BookmarkMeta } => {
    const inference = inferTopicFromTweet(tweet, categories, correctionHistory, userTrustScore);
    let target = categories.find(c => c.name === inference.category);

    if (!target) {
      const newId    = generateCategoryId(inference.category);
      const newColor = getCategoryColor(categories.length);
      target = { id: newId, name: inference.category, color: newColor, createdAt: Date.now() };
      setCategories(prev => [target!, ...prev]);
    } else {
      setCategories(prev => [target!, ...prev.filter(c => c.id !== target!.id)]);
    }

    const meta: BookmarkMeta = {
      category:        inference.category,
      categoryId:      target.id,
      confidence:      inference.confidence,
      autoAssigned:    true,
      matchedKeywords: inference.matchedKeywords,
    };

    const tweetWithMeta: Tweet = {
      ...tweet,
      bookmarkedAt: Date.now(),
      bookmarkMeta: {
        category:        meta.category,
        confidence:      meta.confidence,
        autoAssigned:    meta.autoAssigned,
        matchedKeywords: meta.matchedKeywords,
      },
    };

    dispatch({ type: 'ADD', tweet: tweetWithMeta, categoryId: target.id });
    return { categoryId: target.id, categoryName: target.name, meta };
  }, [categories, correctionHistory, userTrustScore]);

  const removeBookmark = useCallback((tweetId: number) => {
    const categoryId = store.tweetToFolder[tweetId];
    dispatch({ type: 'REMOVE', tweetId });
    if (categoryId) {
      const remaining = (store.folderToTweets[categoryId] || []).filter(id => id !== tweetId);
      if (remaining.length === 0) {
        setCategories(prev => {
          const next = prev.filter(c => c.id !== categoryId);
          if (selectedFolderId === categoryId) setSelectedFolderId(next.length > 0 ? next[0].id : null);
          return next;
        });
      }
    }
  }, [store, selectedFolderId]);

  const isBookmarked = useCallback((tweetId: number): boolean => tweetId in store.byId, [store]);

  const getTweetCategory = useCallback((tweetId: number): string | null =>
    store.tweetToFolder[tweetId] || null, [store]);

  const renameCategory = useCallback((categoryId: string, newName: string): boolean => {
    const trimmed = newName.trim();
    if (!trimmed) return false;
    const duplicate = categories.some(c => c.id !== categoryId && c.name.toLowerCase() === trimmed.toLowerCase());
    if (duplicate) return false;
    setCategories(prev => prev.map(c => c.id === categoryId ? { ...c, name: trimmed } : c));
    return true;
  }, [categories]);

  const deleteCategory = useCallback((categoryId: string) => {
    dispatch({ type: 'DELETE_FOLDER', categoryId });
    setCategories(prev => {
      const next = prev.filter(c => c.id !== categoryId);
      if (selectedFolderId === categoryId) setSelectedFolderId(next.length > 0 ? next[0].id : null);
      return next;
    });
  }, [selectedFolderId]);

  const moveBookmark = useCallback((tweetId: number, newCategoryId: string) => {
    const fromCategoryId = store.tweetToFolder[tweetId];
    if (!fromCategoryId || fromCategoryId === newCategoryId) return;

    const tweet       = store.byId[tweetId];
    const oldCategory = categories.find(c => c.id === fromCategoryId);
    const newCategory = categories.find(c => c.id === newCategoryId);
    if (!oldCategory || !newCategory || !tweet) return;

    const keywordPattern =
      tweet.bookmarkMeta?.matchedKeywords?.[0] ||
      tweet.content.split(' ').slice(0, 3).join(' ');

    setCorrectionHistory(prev => [
      ...prev,
      { tweetId, oldCategory: oldCategory.name, newCategory: newCategory.name, keywordPattern, timestamp: Date.now() },
    ]);

    setUserTrustScore(prev => Math.max(0, prev - 4));
    dispatch({ type: 'MOVE', tweetId, fromCategoryId, toCategoryId: newCategoryId });

    const remaining = (store.folderToTweets[fromCategoryId] || []).filter(id => id !== tweetId);
    if (remaining.length === 0) {
      setCategories(prev => {
        const next = prev.filter(c => c.id !== fromCategoryId);
        if (selectedFolderId === fromCategoryId) setSelectedFolderId(next.length > 0 ? next[0].id : null);
        return next;
      });
    }
  }, [store, categories, selectedFolderId]);

  const increaseUserTrustScore = useCallback(() => {
    setUserTrustScore(prev => Math.min(100, prev + 2));
  }, []);

  const getTweetsForCategory = useCallback((categoryId: string): Tweet[] => {
    const ids = store.folderToTweets[categoryId] || [];
    return ids
      .map(id => store.byId[id])
      .filter(Boolean)
      .sort((a, b) => (b.bookmarkedAt || 0) - (a.bookmarkedAt || 0));
  }, [store]);

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-8 overflow-x-hidden">
      <div className="relative">
        <div className="absolute inset-0 bg-black/20 blur-2xl scale-95" />
        <div className="relative w-[393px] h-[852px] bg-black rounded-[3rem] overflow-hidden shadow-2xl">
          <AnimatePresence mode="wait">
            {activeScreen === 'feed' && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full h-full"
              >
                <FeedScreen
                  onNavigateToLibrary={handleNavigateToLibrary}
                  addBookmark={addBookmark}
                  removeBookmark={removeBookmark}
                  isBookmarked={isBookmarked}
                  getTweetCategory={getTweetCategory}
                  categories={categories}
                  bookmarksById={store.byId}
                  increaseUserTrustScore={increaseUserTrustScore}
                />
              </motion.div>
            )}
            {activeScreen === 'library' && (
              <motion.div
                key="library"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full h-full"
              >
                <LibraryScreen
                  onBack={handleBackToFeed}
                  categories={categories}
                  getTweetsForCategory={getTweetsForCategory}
                  removeBookmark={removeBookmark}
                  renameCategory={renameCategory}
                  deleteCategory={deleteCategory}
                  initialSelectedFolderId={selectedFolderId}
                  isBookmarked={isBookmarked}
                  moveBookmark={moveBookmark}
                  bookmarksById={store.byId}
                  increaseUserTrustScore={increaseUserTrustScore}
                  userTrustScore={userTrustScore}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
          <div className={`h-2 rounded-full transition-all ${activeScreen === 'feed'    ? 'bg-blue-500 w-6' : 'bg-zinc-600 w-2'}`} />
          <div className={`h-2 rounded-full transition-all ${activeScreen === 'library' ? 'bg-blue-500 w-6' : 'bg-zinc-600 w-2'}`} />
        </div>
      </div>
    </div>
  );
}
