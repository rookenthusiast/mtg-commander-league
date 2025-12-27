# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 application for tracking budget Magic: The Gathering Commander league games, decks, player standings, and statistics **with multi-season support**. The application uses Firebase for authentication and Firestore as the database, with Nuxt UI for the component library. The app features a glassmorphic UI design with custom MTG-themed color schemes.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Generate static site for hosting
npm run generate

# Preview production build locally
npm run preview
```

## Environment Setup

The application requires Firebase configuration via environment variables. Copy `.env.example` to `.env` and populate with Firebase project credentials:

```
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
```

These values are accessed through Nuxt's `runtimeConfig` in `nuxt.config.ts` and exposed to the client under the `public` namespace.

## Architecture

### Firebase Integration Pattern

Firebase is initialized once via a **client-only plugin** at `plugins/firebase.client.ts`. This plugin:
- Initializes the Firebase app with config from `useRuntimeConfig()`
- Creates Firebase Auth and Firestore instances
- Provides these services via Nuxt's `provide` mechanism (`$auth`, `$db`, `$firebase`)

### Composables Architecture

The application uses three main composables that abstract Firebase operations:

**`useAuth()`** (app/composables/useAuth.ts):
- Manages authentication state using Vue's `useState` for global state
- Accesses Firebase Auth via `useNuxtApp().$auth`
- Provides methods: `signInWithEmail`, `signUp`, `signInWithGoogle`, `signOut`
- Returns a readonly `user` ref that stays synchronized via `onAuthStateChanged`
- Automatically creates user and player documents upon registration/first login
- All auth operations are client-side only

**`useFirestore()`** (app/composables/useFirestore.ts):
- Provides generic CRUD operations for any Firestore collection
- Accesses Firestore via `useNuxtApp().$db`
- Methods: `getDocument`, `getDocuments`, `addDocument`, `updateDocument`, `deleteDocument`
- Automatically adds `createdAt` and `updatedAt` timestamps
- Exports Firestore query builders (`where`, `orderBy`, `limit`) for custom queries

**`useSeasons()`** (app/composables/useSeasons.ts):
- Manages season-related operations and player season registrations
- Methods:
  - `getActiveSeason()` - Get the currently active season
  - `getAllSeasons()` - Get all seasons ordered by start date
  - `getSeason(seasonId)` - Get a specific season
  - `getPlayerSeason(playerId, seasonId)` - Get player stats for a season
  - `getSeasonLeaderboard(seasonId, sortBy, limit)` - Get season leaderboard
  - `isPlayerRegistered(playerId, seasonId)` - Check registration status
  - `registerPlayerForSeason(playerId, displayName)` - Register for active season
  - `getRegisteredPlayers(seasonId)` - Get all players in a season
  - `updatePlayerStats(playerId, seasonId, updates)` - Update season stats
- All season-based stats tracking flows through this composable

### Data Model

Core TypeScript interfaces defined in `types/index.ts`:

- **Player**: User profile (no longer contains stats - those are in PlayerSeason)
  - `id`, `userId`, `displayName`, `email`, `createdAt`, `updatedAt`
- **PlayerSeason**: Per-season player statistics
  - `id`, `playerId`, `seasonId`, `displayName`, `points`, `wins`, `losses`, `gamesPlayed`, `registeredAt`
- **Season**: Time period for league competition
  - `id`, `name`, `slug`, `startDate`, `endDate`, `isActive`, `description`
- **Deck**: Commander deck with budget, colors, owner reference, and record
  - Now includes `seasonId` to associate deck with a specific season
- **Game**: Match record with players array, winner, placements, notes
  - Now includes `seasonId` to track which season the game belongs to
- **GamePlayer**: Player-deck pairing within a game
- **LeaderboardEntry**: Computed leaderboard data
- **MTGColor**: Type union for Magic color identity

### Firestore Collections

Six main collections (must be created in Firebase Console):

1. **users** - User accounts (userId, displayName, email)
2. **players** - Player profiles (no stats - those moved to playerSeasons)
3. **playerSeasons** - Per-season player statistics (points, wins, losses, gamesPlayed)
4. **seasons** - Season definitions (name, dates, active status)
5. **decks** - Deck registrations with budget, color identity, and seasonId
6. **games** - Game results with player placements, scoring, and seasonId

### Season System Architecture

The application implements a **multi-season tracking system**:

**How Seasons Work:**
- Only one season can be "active" at a time (`isActive: true`)
- Players must register for each season to participate
- Player stats (wins, losses, points) are tracked per-season in the `playerSeasons` collection
- All games and decks are associated with a season via `seasonId`
- Historical seasons remain viewable but cannot accept new registrations

**Season Registration Flow:**
1. User signs in
2. User navigates to `/seasons` to view active season
3. User clicks "Register for Season" which goes to `/seasons/register`
4. Upon registration, a `PlayerSeason` document is created with initial stats (0 points, 0 wins, etc.)
5. Games submitted during that season update the player's `PlayerSeason` stats

**Leaderboard Display:**
- Leaderboard is now season-specific
- Users can select which season to view via dropdown
- By default, shows the active season's leaderboard
- Leaderboard data comes from `playerSeasons` collection filtered by `seasonId`

### Page Architecture

**File-based routing** via Nuxt pages directory:

- `pages/index.vue` - Dashboard with stats and recent games
- `pages/leaderboard.vue` - **Season-specific** player rankings with season selector
- `pages/seasons/index.vue` - View all seasons, active season info, registration status
- `pages/seasons/register.vue` - Register for the active season
- `pages/decks.vue` - Deck browser with color/search filters
- `pages/rules.vue` - Static league rules content
- `pages/submit-game.vue` - Form for submitting game results (requires auth)
- `pages/auth/login.vue` - Authentication page (email/Google)
- `pages/auth/register.vue` - User registration
- `pages/setup-profile.vue` - User profile setup/management

All pages use the `default` layout which includes header navigation and footer.

### Layout System

**`layouts/default.vue`**:
- Glassmorphic design with gradient backgrounds
- Responsive navigation with mobile menu toggle
- Uses `useAuth()` composable for user state
- Navigation links: Home, Leaderboard, **Seasons**, Decks, Rules, Submit Match
- Conditionally shows "Profile" and "Sign Out" or "Sign In" based on auth state
- Uses Nuxt UI components (UContainer, UButton, UCard)
- Custom MTG-themed color palette (Lorwyn Gold, Shadowmoor Purple, Twilight Blue)

### Component Pattern

Reusable components in `components/`:
- **PlayerCard.vue** - Display player stats with avatar, win rate
- **DeckCard.vue** - Display deck info with color identity, budget, record

Components use TypeScript props interfaces imported from `types/index.ts`.

## Styling & Design System

The application uses a **glassmorphism design** with custom MTG-themed colors:

**Color Palette** (defined in Tailwind config):
- **Lorwyn Gold**: `#FFD700` (primary accent)
- **Shadowmoor Purple**: `#6B21A8` (dark backgrounds)
- **Shadowmoor Magenta**: `#D946EF` (secondary accent)
- **Twilight Blue**: `#1E3A8A` (backgrounds and text)

**Design Patterns:**
- Gradient backgrounds using `bg-linear-to-*` utilities
- Backdrop blur effects for glass-morphic cards
- Shadow and glow effects on interactive elements
- Consistent use of UCard variant="soft" for content containers
- Responsive grid layouts

## Nuxt UI Usage

This project uses **Nuxt UI v4** built on Tailwind CSS. Key components used:
- UCard, UButton, UInput, USelect, UTextarea, UModal, UContainer

Color scheme configured via Tailwind in `tailwind.config.ts` with custom MTG theme colors.

## Firebase Security Rules

Security rules are defined in `firestore.rules`:

**Seasons Collection:**
- Read: Public
- Write: Authenticated users only (intended for admins)

**PlayerSeasons Collection:**
- Read: Public
- Create: Authenticated users (must own the playerId)
- Update/Delete: Owner only (playerId matches auth uid)

**Players Collection:**
- Read: Public
- Create/Update: Authenticated users (must own the userId)
- Delete: Owner only

**Users Collection:**
- Read/Write: Owner only (userId matches auth uid)

**Games Collection:**
- Read: Public
- Create: Authenticated users
- Update/Delete: Authenticated users

**Decks Collection:**
- Read: Public
- Create: Authenticated users
- Update/Delete: Owner only (ownerId matches auth uid)

## Migration Scripts

The `scripts/` directory contains database migration utilities:

**`migrate-to-seasons.js`**:
- Migrates existing data to support the seasons feature
- Requires Firebase Admin SDK and service account key
- Creates the first season
- Migrates player stats to `playerSeasons` collection
- Adds `seasonId` to all existing games and decks
- Removes old stats fields from `players` collection
- See `scripts/README.md` for detailed usage

**Prerequisites:**
- Install: `npm install firebase-admin --save-dev`
- Download service account key from Firebase Console
- Run: `export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"`
- Execute: `node scripts/migrate-to-seasons.js`

**Note:** Migration is idempotent and can be run multiple times safely.

## Development Patterns

### Working with Seasons

Get active season and check registration:
```typescript
const { getActiveSeason, isPlayerRegistered } = useSeasons()

const activeSeason = await getActiveSeason()
if (activeSeason) {
  const registered = await isPlayerRegistered(playerId, activeSeason.id)
}
```

Register a player for the active season:
```typescript
const { registerPlayerForSeason } = useSeasons()

await registerPlayerForSeason(playerId, displayName)
```

Get season leaderboard:
```typescript
const { getSeasonLeaderboard } = useSeasons()

const leaderboard = await getSeasonLeaderboard(seasonId, 'points', 10)
```

### Working with Firestore

Example query pattern using `useFirestore()`:
```typescript
const { getDocuments, where, orderBy, limit } = useFirestore()

// Get all player seasons for a specific season
const playerSeasons = await getDocuments('playerSeasons', [
  where('seasonId', '==', 'season-1'),
  orderBy('points', 'desc'),
  limit(10)
])
```

### Working with Authentication

Access user state in any component:
```typescript
const { user, signOut } = useAuth()

// user is a readonly ref, automatically updated by Firebase
if (user.value) {
  // User is signed in
  console.log(user.value.displayName)
}
```

### Adding New Pages

1. Create `.vue` file in `pages/` directory
2. Use `<UCard variant="soft">` for consistent glassmorphic styling
3. Access composables as needed (`useAuth()`, `useFirestore()`, `useSeasons()`)
4. Add navigation link in `layouts/default.vue`
5. Apply custom color classes from the MTG theme palette

### TypeScript

All data models are typed via interfaces in `types/index.ts`. Import and use these types in components and composables for type safety.

## Common Workflows

### Creating a New Season (Admin)

1. Access Firestore Console directly
2. Add document to `seasons` collection:
```javascript
{
  name: "Season 2",
  slug: "season-2-2025",
  startDate: Timestamp,
  endDate: null,
  isActive: true,  // Set previous season to false first
  description: "Description here",
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

### Submitting a Game

1. User must be authenticated
2. Navigate to `/submit-game`
3. Select players and their decks
4. Specify placements and winner
5. On submit, game document is created with current active `seasonId`
6. Player stats in `playerSeasons` are updated automatically

### Viewing Season Leaderboard

1. Navigate to `/leaderboard`
2. Use season dropdown to select which season to view
3. Leaderboard automatically fetches `playerSeasons` data for selected season
4. Displays rankings, win rates, points

## Deployment

The application is designed for static hosting. Use `npm run generate` to create a static build in `.output/public/`.

Supported platforms:
- Vercel (recommended)
- Netlify
- Firebase Hosting
- Cloudflare Pages

All environment variables must be configured in the hosting platform's dashboard.

## Cost Optimization

The application is designed to stay within Firebase's free tier (Spark plan):
- Firestore: 50K reads, 20K writes per day
- Authentication: Unlimited
- Implement client-side caching to minimize reads
- Use pagination and limits on queries
- Client-side sorting for small datasets (like season leaderboards) to avoid index requirements

## Key Files Reference

- `app/composables/useAuth.ts` - Authentication logic
- `app/composables/useFirestore.ts` - Firestore CRUD operations
- `app/composables/useSeasons.ts` - Season management
- `app/layouts/default.vue` - Main layout with navigation
- `app/pages/seasons/index.vue` - Seasons overview
- `app/pages/seasons/register.vue` - Season registration
- `app/pages/leaderboard.vue` - Season leaderboards
- `types/index.ts` - All TypeScript interfaces
- `firestore.rules` - Firestore security rules
- `scripts/migrate-to-seasons.js` - Migration script
