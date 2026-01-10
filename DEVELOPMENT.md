# Development Guide

This document contains development notes, recent implementations, known issues, and future roadmap for the MTG Commander League application.

## Table of Contents

- [Recent Implementations](#recent-implementations)
- [Architecture Overview](#architecture-overview)
- [Known Issues](#known-issues)
- [Future Development](#future-development)
- [Technical Debt](#technical-debt)
- [Contributing](#contributing)

---

## Recent Implementations

### Deck Price Tracking System (Completed)

The application now features a comprehensive deck price tracking system using the Scryfall API.

#### Features Implemented

**1. Automatic Price Fetching**
- Parses text-based decklists (Moxfield, MTGGoldfish, Archidekt formats)
- Fetches real-time prices from Scryfall API
- Finds **cheapest paper printings** for each card
- Supports EUR prices with USD fallback
- Handles foil-only promo cards correctly

**2. Deck Versioning**
- Creates immutable snapshots when deck prices change
- Tracks price history over time
- Associates versions with games played
- Automatic cleanup (keeps 5 recent + versions used in games)

**3. Manual Price Refresh**
- Users can refresh deck prices with a button click
- Shows price differences (increased/decreased by €X.XX)
- Updates deck versions automatically
- Available on profile and deck management pages

**4. Smart Card Matching**
- Filters out digital-only MTGO/Arena printings
- Skips expensive special editions (Masterpieces, Secret Lairs without prices)
- Finds cheapest available printing across all sets
- Falls back to foil prices for promo-only cards

#### Implementation Details

**Key Files:**
- `server/api/decks/update.post.ts` - Price update endpoint
- `server/utils/scryfall.ts` - Scryfall API integration
- `server/utils/decklistParser.ts` - Decklist text parsing
- `server/utils/deckVersioning.ts` - Version management
- `app/composables/useDeckVersions.ts` - Frontend composable
- `app/pages/profile.vue` - Refresh button UI

**API Rate Limiting:**
- 100ms delay between card fetches
- Complies with Scryfall's rate limit guidelines
- Typical deck (100 cards) takes ~1-2 minutes to price

**Price Selection Logic:**
```
Priority Order:
1. EUR non-foil (preferred)
2. USD non-foil (fallback)
3. EUR foil (promo cards)
4. USD foil (last resort)
```

#### Known Limitations

1. **Basic lands** often show as €0.00 or very low prices (expected)
2. **Brand new cards** may not have market prices yet
3. **Reserved List cards** may have inaccurate pricing
4. **Non-English cards** are not currently supported
5. **Rate limits**: Can't price more than a few decks per minute

---

## Architecture Overview

### Frontend Architecture

**Composables (app/composables/):**
- `useAuth()` - Authentication state management
- `useFirestore()` - Generic Firestore CRUD operations
- `useSeasons()` - Season-specific operations
- `useDeckVersions()` - Deck pricing and versioning
- `useScryfall()` - Scryfall card search

**Key Pages:**
- `/` - Dashboard with stats
- `/leaderboard` - Season-specific rankings
- `/seasons` - Season management and registration
- `/decks` - Browse all decks
- `/profile` - User profile and deck management
- `/submit-game` - Submit game results

**Components:**
- `DeckFormModal.vue` - Add/Edit deck form
- `DeckVersionHistory.vue` - Show price history
- `DeckUpdater.vue` - Background price updater

### Backend Architecture

**API Routes (server/api/):**
- `decks/update.post.ts` - Update deck prices
- `decks/[deckId]/versions.get.ts` - Get version history
- `decks/[deckId]/versions/[versionId].get.ts` - Get specific version

**Utils (server/utils/):**
- `scryfall.ts` - Scryfall API client
- `decklistParser.ts` - Parse decklist text
- `deckVersioning.ts` - Firestore version management

### Data Model

**Collections:**

```typescript
// Main collections
users        - User accounts
players      - Player profiles (no stats)
playerSeasons - Per-season player statistics
seasons      - Season definitions
decks        - Deck registrations
games        - Game results
deckVersions - Immutable price snapshots

// Key relationships
Deck.currentVersionId -> DeckVersion.id
Game.players[].deckVersionId -> DeckVersion.id
PlayerSeason.seasonId -> Season.id
Deck.seasonId -> Season.id
```

**Version Management:**
- Deck has `currentVersionId` pointing to active version
- DeckVersion stores immutable snapshot of prices
- Games reference specific DeckVersion
- Old versions are cleaned up automatically

---

## Known Issues

### High Priority

1. **Firestore Index Missing**
   - Version cleanup requires composite index
   - See: `FIRESTORE-INDEXES.md` for setup
   - Non-blocking: Cleanup logs warnings but doesn't fail
   - **Action**: Create index using link from error logs

2. **Price Fetching Performance**
   - Takes 1-2 minutes for 100-card decks
   - No progress indicator during fetch
   - **Action**: Add progress bar or card-by-card updates

### Medium Priority

3. **Commander Auto-Detection**
   - Parser may not always identify commander correctly
   - User can manually edit afterwards
   - **Action**: Improve section header detection

4. **No Price History UI**
   - `DeckVersionHistory.vue` component exists but not used
   - Users can't see price changes over time
   - **Action**: Add version history view to deck pages

5. **External URL Display**
   - External decklist URLs recently re-added
   - Need testing across all deck views
   - **Action**: Verify URL display on decks page

### Low Priority

6. **Birds of Paradise Issue**
   - Still selecting Summer Magic printing (€3.00)
   - Should select cheaper printing (€0.10-0.20)
   - **Action**: Review card selection algorithm

7. **No Bulk Price Updates**
   - Can't refresh all decks at once
   - Must do one by one
   - **Action**: Add "Refresh All Prices" feature

---

## Future Development

### Planned Features

#### Phase 1: Polish & UX (Next)

**1. Price History Viewer**
- Show deck price chart over time
- Display version history in table
- Highlight significant price changes
- Show which cards changed price

**2. Bulk Deck Operations**
- "Refresh All Decks" button on profile
- Queue system for rate limiting
- Progress indicator with deck names
- Email notification when complete

**3. Price Alerts**
- Notify when deck exceeds budget threshold
- Weekly price summary emails
- Configurable alert thresholds per season

**4. Better Mobile UX**
- Improved deck card layout on mobile
- Swipe gestures for deck actions
- Mobile-optimized forms
- Faster navigation

#### Phase 2: Enhanced Deck Management

**1. Deck Comparison**
- Compare two decks side-by-side
- Show card differences
- Compare prices and strategies
- Export comparison as PDF

**2. Deck Tags & Categories**
- Tag decks by strategy (aggro, control, combo)
- Search/filter by tags
- Popular tag cloud
- Auto-suggest tags based on cards

**3. Deck Import from URL**
- Direct import from Moxfield/Archidekt
- Auto-parse and fetch prices
- Preserve deck description and notes
- Support for multiple deck builders

**4. Card Database**
- Browse all cards used in league
- See which decks run each card
- Price trends for individual cards
- Card popularity statistics

#### Phase 3: Social & Analytics

**1. Player Profiles Enhanced**
- Win rate by deck
- Favorite commanders
- Most played cards
- Head-to-head records

**2. Meta Analysis**
- Most popular commanders
- Color combination statistics
- Average deck prices by placement
- Budget vs performance analysis

**3. Tournament Mode**
- Bracket generation
- Swiss pairing algorithm
- Tournament standings
- Prize tracking

**4. Achievements & Badges**
- Win streaks
- Budget mastery (win with cheapest deck)
- First blood (first game winner)
- Collector (most decks)

#### Phase 4: Advanced Features

**1. Deck Building Tools**
- Built-in deck builder
- Card suggestions based on commander
- Budget optimizer
- Mana curve analyzer

**2. Proxy Management**
- Mark cards as proxies
- Track proxy count per deck
- Separate proxy price from real price
- Proxy-allowed leagues

**3. Card Condition Tracking**
- Track condition (NM, LP, MP, HP, DMG)
- Adjust prices based on condition
- Collection value tracking
- Trade list generation

**4. Multi-League Support**
- User can join multiple leagues
- Different rules per league
- Cross-league statistics
- League discovery

---

## Technical Debt

### Code Quality

1. **TypeScript Strictness**
   - Some `any` types in error handlers
   - Missing type guards in places
   - **Action**: Enable strict mode gradually

2. **Error Handling**
   - Inconsistent error messages
   - Some errors not user-friendly
   - **Action**: Standardize error responses

3. **Test Coverage**
   - No automated tests yet
   - Manual testing only
   - **Action**: Add Vitest for unit tests

### Performance

4. **Firestore Query Optimization**
   - Some queries could use better indexes
   - Leaderboard queries could be cached
   - **Action**: Analyze query patterns

5. **Image Loading**
   - Commander images load one at a time
   - No lazy loading on deck grids
   - **Action**: Implement progressive loading

### Security

6. **Admin Functions**
   - Admin operations done in console
   - Need admin UI with proper auth
   - **Action**: Build admin dashboard

7. **Rate Limiting**
   - No API rate limiting on endpoints
   - Could be abused
   - **Action**: Add Nuxt rate limiting middleware

---

## Contributing

### Development Workflow

1. **Branch Naming**
   - `feature/` - New features
   - `fix/` - Bug fixes
   - `refactor/` - Code improvements
   - `docs/` - Documentation updates

2. **Commit Messages**
   - Use conventional commits format
   - Examples:
     - `feat: add price history chart`
     - `fix: correct foil price fallback`
     - `refactor: simplify deck parser`
     - `docs: update DEVELOPMENT.md`

3. **Testing Changes**
   - Test on multiple screen sizes
   - Check Firebase console for errors
   - Verify Firestore rules
   - Test with real deck data

### Code Style

**Vue Components:**
- Use Composition API (`<script setup>`)
- TypeScript for all new code
- Props interfaces defined
- Emits explicitly typed

**Backend:**
- Use `defineEventHandler`
- Proper error handling with `createError`
- Console logging for debugging
- Rate limiting for external APIs

**Styling:**
- Use Tailwind classes
- Follow glassmorphic design patterns
- Maintain MTG color palette
- Responsive by default

### Environment Setup

**Required:**
- Node.js v18+
- Firebase project with Firestore
- Service account key for admin operations

**Optional:**
- VS Code with Vue/Volar extension
- Firebase CLI for deployments
- Postman for API testing

---

## Useful Commands

### Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Generate static site
npm run generate

# Type check
npm run typecheck
```

### Firebase

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

### Maintenance

```bash
# Run migration scripts
node scripts/migrate-to-seasons.js

# Clean up old versions (manual)
node scripts/cleanup-versions.js
```

---

## Getting Help

**Documentation:**
- Main Guide: `CLAUDE.md`
- Setup: `QUICKSTART.md`
- Deployment: `DEPLOYMENT.md`
- Indexes: `FIRESTORE-INDEXES.md`

**Resources:**
- [Nuxt 3 Docs](https://nuxt.com)
- [Nuxt UI Docs](https://ui.nuxt.com)
- [Firebase Docs](https://firebase.google.com/docs)
- [Scryfall API](https://scryfall.com/docs/api)

**Community:**
- Create an issue on GitHub
- Discord server (if available)
- MTG Commander subreddit

---

## License

MIT License - See LICENSE file for details

---

**Last Updated**: January 2026
**Version**: 1.2.0
**Status**: Active Development
