# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 application for tracking budget Magic: The Gathering Commander league games, decks, player standings, and statistics. The application uses Firebase for authentication and Firestore as the database, with Nuxt UI for the component library.

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

The application uses two main composables that abstract Firebase operations:

**`useAuth()`** (composables/useAuth.ts):
- Manages authentication state using Vue's `useState` for global state
- Accesses Firebase Auth via `useNuxtApp().$auth`
- Provides methods: `signInWithEmail`, `signUp`, `signInWithGoogle`, `signOut`
- Returns a readonly `user` ref that stays synchronized via `onAuthStateChanged`
- All auth operations are client-side only (guards with `process.client`)

**`useFirestore()`** (composables/useFirestore.ts):
- Provides generic CRUD operations for any Firestore collection
- Accesses Firestore via `useNuxtApp().$db`
- Methods: `getDocument`, `getDocuments`, `addDocument`, `updateDocument`, `deleteDocument`
- Automatically adds `createdAt` and `updatedAt` timestamps
- Exports Firestore query builders (`where`, `orderBy`, `limit`) for custom queries

### Data Model

Core TypeScript interfaces defined in `types/index.ts`:

- **Player**: User profile with stats (wins, games, points)
- **Deck**: Commander deck with budget, colors, owner reference, and record
- **Game**: Match record with players array, winner, placements, notes
- **GamePlayer**: Player-deck pairing within a game
- **Season**: Time period for league competition

### Firestore Collections

Four main collections (must be created in Firebase Console):

1. **users** - User accounts (userId, displayName, email)
2. **players** - Player profiles and statistics
3. **decks** - Deck registrations with budget and color identity
4. **games** - Game results with player placements and scoring

### Page Architecture

**File-based routing** via Nuxt pages directory:

- `pages/index.vue` - Dashboard with stats and recent games
- `pages/leaderboard.vue` - Player rankings table
- `pages/decks.vue` - Deck browser with color/search filters
- `pages/rules.vue` - Static league rules content
- `pages/submit-game.vue` - Form for submitting game results (requires auth)
- `pages/auth/login.vue` - Authentication page (email/Google)
- `pages/auth/register.vue` - User registration

All pages use the `default` layout which includes header navigation and footer.

### Layout System

**`layouts/default.vue`**:
- Responsive navigation with mobile menu toggle
- Uses `useAuth()` composable for user state
- Navigation links to all main pages
- Conditionally shows "Sign In" or "Sign Out" based on auth state
- Uses Nuxt UI components (UContainer, UButton, UCard)

### Component Pattern

Reusable components in `components/`:
- **PlayerCard.vue** - Display player stats with avatar, win rate
- **DeckCard.vue** - Display deck info with color identity, budget, record

Components use TypeScript props interfaces imported from `types/index.ts`.

## Nuxt UI Usage

This project uses **Nuxt UI v2** built on Tailwind CSS. Key components used:
- UCard, UButton, UInput, USelect, UTextarea, UModal, UContainer

Color scheme configured in `app.config.ts` (primary: blue, gray: slate).

## Firebase Security Rules

Recommended security rules (from README.md) implement:
- Public read access for all collections
- Authenticated-only writes
- Ownership validation for deck updates/deletes
- User documents writable only by the user themselves

## Development Patterns

### Working with Firestore

Example query pattern using `useFirestore()`:
```typescript
const { getDocuments, where, orderBy, limit } = useFirestore()

// Get top 10 players by points
const players = await getDocuments('players', [
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
}
```

### Adding New Pages

1. Create `.vue` file in `pages/` directory
2. Use `<UCard>` for consistent styling
3. Access composables as needed (`useAuth()`, `useFirestore()`)
4. Add navigation link in `layouts/default.vue`

### TypeScript

All data models are typed via interfaces in `types/index.ts`. Import and use these types in components and composables for type safety.

## Deployment

The application is designed for static hosting. Use `npm run generate` to create a static build in `.output/public/`.

Supported platforms (see DEPLOYMENT.md for details):
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
