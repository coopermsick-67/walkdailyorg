# Walk Daily — Changelog

## 2026-06-09 — v1.0.0 "Complete Build"

### Features Built

#### Authentication & User Management
- **Email/Password Signup** — Full signup flow with profile creation
- **Email/Password Login** — Secure login with session management
- **Google OAuth** — Google sign-in via Supabase Auth with callback route
- **Password Reset** — Forgot password flow with email reset link
- **Auth Middleware** — Session refresh and route protection middleware
- **Auth Callback Route** — `/auth/callback` handler for OAuth and password reset

#### Onboarding
- **Multi-step Onboarding Flow** — Faith journey, connection methods, spiritual challenges
- **Reading Preferences** — Preferred translation, reading frequency, reminder setup
- **Profile Setup** — Display name, avatar, denomination selection
- **Database Migration** — `001_onboarding.sql` adds onboarding columns to profiles

#### Home Dashboard
- **Daily Dashboard** — Overview of activity, streak, and quick actions
- **Theme Toggle** — Dark/light mode with CSS custom properties
- **Quick Navigation** — Shortcuts to Bible, Chat, Journal, Prayer
- **Streak Display** — Current reading streak with visual indicator

#### Bible Reader
- **Full Bible Reader** — Book/chapter/verse navigation across all 66 books
- **Translation Selector** — Switch between NIV, ESV, KJV, NLT, and more
- **Verse Actions** — Highlight, copy, share, and take notes on verses
- **Offline Caching** — IndexedDB chapter cache with LRU eviction
- **Search** — Full-text verse search across translations
- **Reading Plans** — "Bible in a Year" and other structured reading plans
- **Progress Tracking** — Day-by-day completion tracking with streak calculation

#### AI Chat
- **AI Chat Interface** — Streaming chat with OpenRouter backend
- **SSE Streaming** — Server-Sent Events for real-time token streaming
- **Chat History** — Persistent chat sessions with Supabase storage
- **Message Retry** — Retry failed AI requests
- **Clear Chat** — Delete chat history with confirmation
- **Rate Limiting** — Per-user daily request limits with atomic increment RPC
- **Verse Detection** — Regex-based Bible verse reference linking in chat bubbles

#### Study Tools
- **Bible Study** — AI-powered topical Bible study generation
- **Devotional Generator** — Daily personalized devotional content
- **Prayer Assistant** — AI-guided prayer composition

#### Memorization
- **Spaced Repetition System (SRS)** — Algorithm for verse memorization
- **Card Management** — Add, edit, mark as mastered, delete cards
- **Progress Tracking** — Review intervals and strength indicators

#### Prayer Features
- **Prayer Wall** — Community prayer request board
- **Prayer Requests** — Create, view, and respond to prayer requests
- **"Pray" Button** — Debounced prayer counter with database-backed tracking
- **Comments** — Threaded comments on prayer requests
- **Subscriptions** — Subscribe to prayer request updates
- **Realtime Updates** — Supabase realtime subscriptions for live updates
- **Pull-to-Refresh** — Touch-based and button-based refresh
- **Categories** — Prayer request categorization and filtering

#### Journal
- **Rich Text Journal** — TipTap-based editor replacing deprecated execCommand
- **Entry Management** — Create, edit, delete, search journal entries
- **Search** — Parameterized `ilike` search across title and body
- **Timestamps** — Created/updated dates with proper formatting

#### Groups
- **Groups Page** — Community groups listing (placeholder for future features)
- **Waitlist** — Email waitlist signup for upcoming features

#### Profile & Settings
- **Profile Page** — Display name, avatar, denomination, preferences
- **API Key Management** — Encrypted OpenRouter API key storage
- **Translation Preference** — Default Bible translation setting
- **Account Settings** — Theme, notifications, reading reminders

#### PWA Setup
- **Service Worker** — Offline support with Workbox
- **Web App Manifest** — Installable PWA with proper metadata
- **Icons** — SVG icon set for all platform sizes
- **robots.txt** — Search engine crawling directives

#### Landing Page
- **Marketing Landing Page** — Feature showcase with warm design
- **Waitlist Signup** — Email capture for early access
- **Responsive Design** — Mobile-first with desktop navigation

---

### Bug Fixes

#### Critical Fixes (12 issues)
1. **C-1: Admin Route Security** — Moved admin check to server-side; no client-side email comparison
2. **C-2: Bible API Key** — Removed hardcoded fallback; key only from environment variable
3. **C-3: OpenRouter API Key Storage** — Added encryption at rest for stored API keys
4. **C-4: Rate Limiting Race Condition** — Replaced SELECT-then-UPDATE with atomic RPC increment
5. **C-5: Supabase Singleton Bug** — Removed module-level singleton; per-request client creation
6. **C-6: Prayer Count Trust** — Moved "I prayed" tracking to database with user-specific records
7. **C-7: Google OAuth Callback** — Created `/auth/callback/route.ts` for OAuth flow
8. **C-8: Password Reset Callback** — Same callback route handles password reset tokens
9. **C-9: window.confirm/alert** — Replaced all blocking dialogs with custom modal components
10. **C-10: Deprecated execCommand** — Replaced with TipTap rich text editor
11. **C-11: Missing Error Boundaries** — Added React Error Boundaries to all page sections
12. **C-12: `any` Types** — Replaced all `any` types with proper TypeScript interfaces

#### Major Fixes (21 of 28 issues fixed)
1. **M-1: Dead SSE Parser** — Removed unused `eventsource-parser` import; using manual SSE parsing
2. **M-2: Timeout Constant** — Aligned `API_TIMEOUT_MS` (60s) with actual usage
3. **M-3: Double Query** — Consolidated `hasOwnKey` check into single `getApiKey` call
4. **M-4: Chat Pagination** — Added cursor-based pagination with "Load More" button
5. **M-5: Pray Button Debounce** — Added 2-second debounce with loading state
6. **M-6: Desktop Refresh** — Added refresh button alongside pull-to-refresh
7. **M-7: SQL Injection Risk** — Parameterized all user input in search queries
8. **M-8: Reading Plans Loading** — Added async generation with loading skeleton
9. **M-9: Streak Calculation** — Fixed to count backward from today
10. **M-10: Search Empty State** — Added helpful suggestions and browse links
11. **M-11: Translation Dropdown** — Added search/filter and virtualization
12. **M-12: Devotional Theme** — Switched to CSS variables for reactive theme updates
13. **M-13: Admin Email Display** — Removed client-side `ADMIN_EMAIL` reference
14. **M-14: Theme Toggle Feedback** — Added active/loading state to theme buttons
15. **M-15: Chat Send Button** — Increased to 44x44px minimum touch target
16. **M-16: Bottom Nav Overlap** — Fixed Chat tab positioning and z-index
17. **M-17: Verse Actions A11y** — Added focus trap, Escape handler, and ARIA roles
18. **M-18: Journal XSS** — Added HTML sanitization for journal content rendering
19. **M-19: Comments Pagination** — Added pagination to prayer request comments
20. **M-20: Realtime Cleanup** — Fixed subscription cleanup with proper useEffect dependencies
21. **M-21: AI Offline State** — Added offline detection and cached response display

#### Minor Fixes (12 of 22 issues fixed)
1. **m-1: Button Consistency** — Standardized button styling with shared component
2. **m-3: Chat Character Limit** — Added 4000-character limit to chat input
3. **m-4: AI Message Retry** — Added retry button on failed messages
4. **m-6: Clear Chat Confirmation** — Added confirmation dialog before deleting history
5. **m-7: FAB Position** — Adjusted FAB to not overlap bottom nav
6. **m-11: Toast Limit** — Capped simultaneous toasts at 3
7. **m-13: Verse Regex** — Improved regex for single-chapter books
8. **m-15: Card Edit/Delete** — Added edit and delete functionality to memorize cards
9. **m-16: Empty State Consistency** — Unified empty state component usage
10. **m-17: Branding** — Fixed "GraceApp" reference to "Walk Daily"
11. **m-20: Unused Dependencies** — Removed unused tiptap packages (using TipTap properly now)
12. **m-22: Footer Links** — Added Privacy Policy and Terms of Service pages

---

### Known Remaining Issues (Not Fixed)

#### Major (7 issues)
- **M-22: PWA Icons** — 192px and 512px PNG icons still need generation
- **M-23: Service Worker Precache** — Some precached routes are placeholders
- **M-24: Sitemap** — No XML sitemap generated
- **M-25: Per-Page Meta** — Individual page metadata not fully implemented
- **M-26: userScalable** — Still set to `false` (accessibility concern)
- **M-27: Skip Navigation** — No skip-to-content link
- **M-28: Journal SSR** — `stripHtml` still uses `document.createElement`

#### Minor (10 issues)
- **m-2: Devotional Skeleton** — No loading skeleton for devotional content
- **m-5: Study Copy** — No "Copy All" for study results
- **m-8: Pray Animation** — No haptic/visual feedback on pray
- **m-9: Reset Reading Plan** — No way to reset reading plan progress
- **m-10: Back to Top** — No back-to-top button on long pages
- **m-12: Haptic Feedback** — No `navigator.vibrate()` on mobile
- **m-14: Translation Loading** — No spinner in translation dropdown
- **m-18: Dynamic Lang** — HTML lang attribute not dynamic
- **m-19: Print Styles** — No `@media print` styles
- **m-21: Analytics** — No analytics or error tracking integrated
