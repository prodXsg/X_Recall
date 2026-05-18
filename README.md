 # X Recall — AI-Powered Bookmark Organization for X

A working React prototype that solves one of X's most overlooked
product failures: users save content with intent but almost never
retrieve it. X bookmarks are a flat, chronological list with no
structure. A junk drawer that makes retrieval nearly impossible.

X Recall fixes this by automatically classifying every bookmarked
tweet into a smart folder at the moment of save, using a three-signal
AI inference engine. Zero clicks required from the user. Zero
interruption to the scroll flow.

**[View Live Prototype](https://x-recall-prototype.vercel.app/)**

---

## The Problem

Fewer than 25% of saved content across read-later platforms is ever
reopened. On X, where saves are impulsive and context-dependent, this
rate is estimated lower. The failure is not in saving. It is in
retrieval. Users already show intent by bookmarking. The product just
throws that signal away.

## The AI Enhancement

A three-signal inference engine classifies every tweet the moment it
is bookmarked:

- **Signal 1: Correction Learning.** Checks the user's correction
  history first. If a similar tweet was previously moved to a
  different folder, the learned category is returned at 0.88 to 0.98
  confidence. Persisted across sessions via localStorage.

- **Signal 2: Semantic Analysis.** Keyword dictionary across 12
  categories and 100+ domain-specific terms. Matches on tweet content
  and author name simultaneously.

- **Signal 3: Author Authority.** Bayesian prior from account name.
  ESPN maps to Sports. BBCNews maps to News. Contributes alongside
  semantic matching.

Low-confidence classifications (below 75%) route to an Unsorted inbox
rather than auto-filing incorrectly. Every manual correction trains
the model and adjusts a live trust score.

## Key Features

- Zero-click save: AI classifies and files on bookmark tap
- Confidence scoring with Unsorted inbox for low-confidence saves
- Correction loop: manual moves train the model, persisted across sessions
- Semantic search across all folders simultaneously
- Folder management: create, rename, delete, reorder
- AI explanation sheet: shows matched keywords and confidence
- Trust score system: rises with accepted saves, falls with corrections
- localStorage persistence: bookmarks survive page refresh
- iOS-accurate UI: status bar, Grok nav icon, Following tab, profile drawer
- Demo reset button: wipes localStorage and reloads to seed state

## How It Works

1. User bookmarks a tweet in the feed
2. AI classifies it in under 500ms using three signals
3. Toast confirms: "Saved to Dev Resources, Grok is 84% confident"
4. Tweet lands in the correct folder in Library, zero user input
5. If wrong, user moves it manually and AI learns and corrects itself
6. On next similar tweet, learned category is applied at 0.88 to 0.98 confidence

## Documentation

[User Flow](https://prodxsg.github.io/X_Recall/x-recall-user-flow.html)
[AI Architecture](https://prodxsg.github.io/X_Recall/x-recall-ai-architecture.html)
[Technical Architecture](https://prodxsg.github.io/X_Recall/x-recall-technical-architecture.html)

## Architecture Highlights

- useReducer with lazy initializer for normalized bookmark state
  across three maps: byId, tweetToFolder, folderToTweets
- addBookmark returns category meta synchronously, no setTimeout
  race condition
- Single ActiveSheet discriminated union type replaces three boolean
  flags, invalid sheet states impossible at the type level
- localStorage persistence via useEffect with try-catch wrapped
  lsGet and lsSet helpers
- useMemo on feed list, useCallback on all handlers

## Tech Stack

React, TypeScript, Vite, Tailwind CSS, Framer Motion

## Run Locally

```bash
npm install
npm run dev
```

## Author

Surya Gummalla

Built to validate a product hypothesis: that AI classification at
the moment of save eliminates the retrieval failure loop in social
bookmarking. This work bridges PM thinking and functional
prototyping, from identifying the AI opportunity to a working
coded implementation.

