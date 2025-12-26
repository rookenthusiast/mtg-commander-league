# Seasons Implementation Plan

## Overview

Implementing a seasons system for the Budget Ducks Commander League to allow:
- Multiple league seasons with isolated stats
- Season-specific player registration
- Historical season tracking
- Clean slate for each new season

---

## Database Schema Design

### 1. Collections Structure

#### NEW: `seasons` Collection

```typescript
seasons/{seasonId}
  - name: string              // "Lorwyn Season", "Shadowmoor Season"
  - slug: string              // "lorwyn-2025", "shadowmoor-2025"
  - startDate: timestamp
  - endDate: timestamp        // null if ongoing
  - isActive: boolean         // Only one season should be active
  - description: string       // Optional season description
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Example Document:**
```json
{
  "name": "Lorwyn Season",
  "slug": "lorwyn-2025",
  "startDate": "2025-01-01T00:00:00Z",
  "endDate": null,
  "isActive": true,
  "description": "The inaugural Budget Ducks Commander League season",
  "createdAt": "2025-12-26T...",
  "updatedAt": "2025-12-26T..."
}
```

---

#### NEW: `playerSeasons` Collection

**Purpose:** Track player stats per season (replaces stats in players collection)

```typescript
playerSeasons/{playerSeasonId}
  - playerId: string          // Reference to players/{id}
  - seasonId: string          // Reference to seasons/{id}
  - displayName: string       // Denormalized for quick access
  - points: number            // Season-specific points
  - wins: number              // Season-specific wins
  - losses: number            // Season-specific losses
  - gamesPlayed: number       // Season-specific games
  - registeredAt: timestamp   // When player joined this season
  - createdAt: timestamp
  - updatedAt: timestamp
```

**Example Document:**
```json
{
  "playerId": "player123",
  "seasonId": "season-1",
  "displayName": "Alex",
  "points": 15,
  "wins": 4,
  "losses": 8,
  "gamesPlayed": 12,
  "registeredAt": "2025-01-15T...",
  "createdAt": "2025-01-15T...",
  "updatedAt": "2025-12-26T..."
}
```

---

#### UPDATED: `players` Collection

**Changes:** Remove stats (moved to playerSeasons), keep only profile info

```typescript
players/{playerId}
  - userId: string            // Firebase Auth UID
  - displayName: string
  - email: string
  - createdAt: timestamp
  - updatedAt: timestamp
  // REMOVED: gamesPlayed, wins, losses, points
```

---

#### UPDATED: `games` Collection

**Changes:** Add seasonId field

```typescript
games/{gameId}
  - seasonId: string          // NEW: Link to current season
  - date: string
  - players: array[{playerId, deckId}]
  - winnerId: string
  - placements: array[string]
  - notes: string
  - turnCount: number
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

#### UPDATED: `decks` Collection

**Changes:** Add seasonId field (decks are season-specific)

```typescript
decks/{deckId}
  - seasonId: string          // NEW: Decks registered per season
  - name: string
  - commander: string
  - colors: array[string]
  - budget: number
  - description: string
  - decklistUrl: string
  - ownerId: string           // playerId
  - owner: string             // displayName
  - wins: number              // Season-specific
  - games: number             // Season-specific
  - createdAt: timestamp
  - updatedAt: timestamp
```

---

## Migration Strategy

### Phase 1: Create First Season

1. Manually create the first season document in Firestore Console:

```
Collection: seasons
Document ID: season-1

Data:
{
  "name": "Lorwyn Season",
  "slug": "lorwyn-2025",
  "startDate": Timestamp(2025-01-01 00:00:00),
  "endDate": null,
  "isActive": true,
  "description": "The inaugural Budget Ducks Commander League season",
  "createdAt": Timestamp(now),
  "updatedAt": Timestamp(now)
}
```

### Phase 2: Migrate Existing Players

For each document in `players` collection:
1. Create a new document in `playerSeasons` collection
2. Copy stats (wins, losses, points, gamesPlayed)
3. Link to season-1
4. Remove stats fields from original player document

**Migration Script Pattern:**
```javascript
// For each player in players collection:
const playerSeasonData = {
  playerId: player.id,
  seasonId: "season-1",
  displayName: player.displayName,
  points: player.points || 0,
  wins: player.wins || 0,
  losses: player.losses || 0,
  gamesPlayed: player.gamesPlayed || 0,
  registeredAt: player.createdAt,
  createdAt: now,
  updatedAt: now
}
// Add to playerSeasons collection
// Remove points, wins, losses, gamesPlayed from player document
```

### Phase 3: Migrate Existing Games

For each document in `games` collection:
- Add field: `seasonId: "season-1"`

### Phase 4: Migrate Existing Decks

For each document in `decks` collection:
- Add field: `seasonId: "season-1"`

---

## Implementation Tasks

### Task 1: Create Database Migration Script

**Files to create:**
- `scripts/migrate-to-seasons.js` - Migration script
- `types/index.ts` - Add Season, PlayerSeason types

**Steps:**
1. Create Season interface
2. Create PlayerSeason interface
3. Write migration script to:
   - Create first season
   - Migrate player stats to playerSeasons
   - Add seasonId to games
   - Add seasonId to decks

---

### Task 2: Build Season Registration Flow

**Files to create/update:**
- `pages/seasons/index.vue` - List all seasons
- `pages/seasons/register.vue` - Register for current season
- `composables/useSeasons.ts` - Season operations composable

**Features:**
- Display current active season
- Show registration status (registered/not registered)
- Allow player to register for current season
- Create playerSeason document on registration
- Prevent duplicate registrations

**UI Components:**
- Season card showing name, dates, description
- Registration button (only for active season)
- "Already Registered" badge
- List of registered players

---

### Task 3: Update Leaderboard with Season Filtering

**Files to update:**
- `pages/leaderboard.vue`
- `composables/useSeasons.ts`

**Changes:**
1. Add season selector dropdown at top
2. Fetch playerSeasons filtered by selected seasonId
3. Show season name in header
4. Display only players registered for selected season
5. Default to current active season

**UI Updates:**
- Season dropdown (shows all seasons, active highlighted)
- Season info banner (name, dates)
- Stats are season-specific
- "Register for Season" CTA if not registered

---

### Task 4: Update Submit Game to Track Season

**Files to update:**
- `pages/submit-game.vue`
- Game submission logic

**Changes:**
1. Automatically detect current active season
2. Add seasonId to game document
3. Only show players registered for current season
4. Only show decks registered for current season
5. Update playerSeason stats (not player stats)
6. Display current season in UI

**Validation:**
- Ensure active season exists
- Verify all selected players are registered
- Verify all selected decks belong to current season

---

## UI Changes Summary

### New Pages

1. **Seasons List (`/seasons`)**
   - Card grid of all seasons
   - Active season highlighted
   - Historical seasons grayed out
   - Registration status per season

2. **Season Registration (`/seasons/register`)**
   - Current season details
   - Registration form
   - Success/error handling

### Updated Pages

1. **Leaderboard (`/leaderboard`)**
   - Season selector dropdown
   - Season-filtered stats
   - Season info banner

2. **Submit Game (`/submit-game`)**
   - Auto-detect current season
   - Season-filtered players/decks
   - Display season name

3. **Decks (`/decks`)**
   - Optional: Season filter (or show all seasons)
   - Display season badge on each deck

### New Components

1. **SeasonSelector** - Reusable dropdown
2. **SeasonBadge** - Shows season name/status
3. **SeasonCard** - Display season info

---

## Key Features

### Season Lifecycle

1. **Active Season**
   - Only one season can be active at a time
   - `isActive: true`
   - Players can register
   - Games are recorded
   - Decks can be added

2. **Ended Season**
   - `isActive: false`
   - `endDate` is set
   - Read-only (view stats/history)
   - No new registrations
   - No new games

3. **Future Season**
   - Can be created in advance
   - Not yet active
   - No registrations/games

### Player Registration

- Players must register for each season
- Registration creates playerSeason document
- Initial stats: all zeros
- Can view but not register for past seasons

### Stats Isolation

- Each season has independent stats
- No carry-over between seasons
- Historical seasons remain viewable
- Clean slate for new seasons

### Deck Management

- Decks are season-specific
- Can use same commander in different seasons
- Budget can change between seasons
- Deck stats reset each season

---

## Firestore Security Rules Updates

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Seasons - read all, write only for authenticated users (admins)
    match /seasons/{seasonId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // PlayerSeasons - read all, write only for authenticated users
    match /playerSeasons/{playerSeasonId} {
      allow read: if true;
      allow create: if request.auth != null
        && request.resource.data.playerId == request.auth.uid;
      allow update, delete: if request.auth != null
        && resource.data.playerId == request.auth.uid;
    }

    // Players - existing rules (no stats)
    match /players/{playerId} {
      allow read: if true;
      allow create, update: if request.auth != null
        && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }

    // Games - add seasonId check
    match /games/{gameId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }

    // Decks - add seasonId check
    match /decks/{deckId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
    }
  }
}
```

---

## Future Enhancements

### Admin Features

- Season management page
- Create/edit/end seasons
- View season statistics
- Export season results

### Player Features

- Season history view
- Personal stats across all seasons
- Deck history across seasons
- Achievement badges per season

### Analytics

- Season comparison charts
- Player growth over seasons
- Meta analysis per season
- Budget trends

---

## Implementation Order

**Day 1:**
1. ✅ Create types/interfaces
2. ✅ Write migration script
3. ✅ Test migration on local Firestore emulator
4. Run migration on production

**Day 2:**
5. Create useSeasons composable
6. Build seasons list page
7. Build season registration flow
8. Test registration

**Day 3:**
9. Update leaderboard with season selector
10. Update submit-game with season tracking
11. Test game submission

**Day 4:**
12. Update decks page (optional season filter)
13. Create SeasonBadge/SeasonSelector components
14. Polish UI/UX
15. Final testing

---

## Current Status

**Completed:**
- ✅ Database schema design
- ✅ Migration strategy outlined
- ✅ Task breakdown created

**Next Steps:**
1. Create database migration script
2. Build season registration flow
3. Update leaderboard with season selector
4. Update submit-game to track season

---

## Notes

- Keep the existing data intact during migration
- Test thoroughly in development before production
- Consider adding a "pre-season" period for deck registration
- May want to add email notifications for season start/end
- Consider season playoffs or special events

---

*Last Updated: December 26, 2025*
