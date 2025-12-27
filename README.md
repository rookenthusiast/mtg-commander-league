# MTG Commander League

A web application for tracking budget Commander league games, decks, and standings **with multi-season support**. Built with Nuxt 3, Nuxt UI, and Firebase. Features a beautiful glassmorphic design with Magic: The Gathering themed colors.

## Features

- **Season Management**: Track multiple league seasons with independent leaderboards
- **Player Registration**: Players register for each season to compete
- **Season Leaderboard**: View rankings and statistics for current and past seasons
- **Deck Management**: Register and view player decks with budget tracking
- **Game Submission**: Submit game results and track match history
- **Rules**: View league rules and scoring system
- **Authentication**: Secure user authentication with Firebase (Email/Password and Google Sign-In)
- **Real-time Updates**: Firebase Firestore for real-time data synchronization
- **Glassmorphic UI**: Modern glass-morphism design with MTG-themed color palette

## Tech Stack

- **Frontend**: Nuxt 3 + Vue 3
- **UI Framework**: Nuxt UI v4 (built on Tailwind CSS)
- **Backend/Database**: Firebase (Firestore + Authentication)
- **Admin Tools**: Firebase Admin SDK for database migrations
- **Deployment**: Vercel, Netlify, or Firebase Hosting (free tiers available)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v20 or higher recommended)
- npm or yarn
- Git

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd mtg-commander-league
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Firestore Database**:
   - Go to Firestore Database
   - Click "Create database"
   - Choose "Start in production mode" (you'll add security rules later)
   - Select your region
4. Enable **Authentication**:
   - Go to Authentication
   - Click "Get started"
   - Enable "Email/Password" provider
   - (Optional) Enable "Google" provider for Google Sign-In
5. Get your Firebase configuration:
   - Go to Project Settings (gear icon)
   - Scroll down to "Your apps"
   - Click the web icon `</>`
   - Copy your configuration values

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
FIREBASE_API_KEY=your_api_key_here
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

### 5. Set Up Firestore Security Rules

Deploy the security rules to your Firebase project:

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login and initialize:
   ```bash
   firebase login
   firebase init firestore
   ```
   - Select your Firebase project
   - Use `firestore.rules` as your rules file

3. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

Alternatively, copy the contents of `firestore.rules` and paste them in the Firebase Console under Firestore Database > Rules.

### 6. Set Up Initial Season

Create the first season manually in Firestore Console:

1. Go to Firestore Database
2. Create a collection called `seasons`
3. Add a document with ID `season-1`:
```javascript
{
  name: "Lorwyn Season",
  slug: "lorwyn-2025",
  startDate: [Current Timestamp],
  endDate: null,
  isActive: true,
  description: "The inaugural Budget Ducks Commander League season",
  createdAt: [Current Timestamp],
  updatedAt: [Current Timestamp]
}
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
mtg-commander-league/
├── app/
│   ├── assets/           # CSS and static assets
│   ├── components/       # Vue components
│   ├── composables/      # Composable functions
│   │   ├── useAuth.ts           # Authentication
│   │   ├── useFirestore.ts      # Firestore operations
│   │   └── useSeasons.ts        # Season management
│   ├── layouts/          # Layout components
│   │   └── default.vue          # Main layout with navigation
│   ├── pages/            # Route pages
│   │   ├── index.vue            # Home page
│   │   ├── leaderboard.vue      # Season leaderboards
│   │   ├── seasons/
│   │   │   ├── index.vue        # Seasons overview
│   │   │   └── register.vue     # Season registration
│   │   ├── decks.vue            # Deck listing
│   │   ├── rules.vue            # League rules
│   │   ├── submit-game.vue      # Game submission form
│   │   └── auth/
│   │       ├── login.vue        # Login page
│   │       └── register.vue     # Registration page
│   ├── plugins/          # Nuxt plugins (Firebase initialization)
│   └── public/           # Public static files
├── scripts/              # Database migration scripts
│   ├── migrate-to-seasons.js    # Season migration script
│   └── README.md                # Migration documentation
├── types/                # TypeScript type definitions
│   └── index.ts                 # All interfaces
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment variables template
├── firestore.rules       # Firestore security rules
├── nuxt.config.ts        # Nuxt configuration
├── package.json          # Dependencies
├── CLAUDE.md             # Claude Code instructions
└── README.md             # This file
```

## Season System

### How Seasons Work

The application uses a multi-season system where:
- **Only one season is active at a time** (marked with `isActive: true`)
- Players must **register for each season** to participate
- **Player statistics are tracked separately per season** in the `playerSeasons` collection
- All games and decks are associated with a specific season via `seasonId`
- Past seasons remain viewable but cannot accept new registrations

### Firestore Collections

The application uses six main Firestore collections:

1. **users** - User accounts
   ```
   - id: string (userId from Firebase Auth)
   - displayName: string
   - email: string
   - createdAt: timestamp
   ```

2. **players** - Player profiles (no stats stored here)
   ```
   - id: string (auto-generated)
   - userId: string (reference to users)
   - displayName: string
   - createdAt: timestamp
   ```

3. **playerSeasons** - Per-season player statistics
   ```
   - id: string (auto-generated)
   - playerId: string (reference to players)
   - seasonId: string (reference to seasons)
   - displayName: string
   - points: number
   - wins: number
   - losses: number
   - gamesPlayed: number
   - registeredAt: timestamp
   ```

4. **seasons** - Season definitions
   ```
   - id: string (e.g., "season-1")
   - name: string
   - slug: string
   - startDate: timestamp
   - endDate: timestamp | null
   - isActive: boolean
   - description: string
   ```

5. **decks** - Deck registrations
   ```
   - id: string (auto-generated)
   - seasonId: string (reference to seasons)
   - name: string
   - commander: string
   - colors: array of strings
   - budget: number
   - ownerId: string (reference to players)
   - owner: string (display name)
   - wins: number
   - games: number
   - createdAt: timestamp
   ```

6. **games** - Game results
   ```
   - id: string (auto-generated)
   - seasonId: string (reference to seasons)
   - date: string (ISO format)
   - players: array of GamePlayer objects
   - winnerId: string
   - placements: array
   - notes: string
   - turnCount: number
   - createdAt: timestamp
   ```

## Database Migration

If you have an existing database without seasons support, use the migration script:

```bash
# Install Firebase Admin SDK
npm install firebase-admin --save-dev

# Download service account key from Firebase Console
# Project Settings > Service Accounts > Generate New Private Key
# Save as scripts/serviceAccountKey.json

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"

# Run migration
node scripts/migrate-to-seasons.js
```

See `scripts/README.md` for detailed migration instructions.

## Deployment

### Free Hosting Options

#### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Add environment variables in Vercel dashboard

#### Option 2: Netlify

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Deploy:
   ```bash
   netlify deploy --prod
   ```

3. Add environment variables in Netlify dashboard

#### Option 3: Firebase Hosting

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login and initialize:
   ```bash
   firebase login
   firebase init hosting
   ```

3. Build and deploy:
   ```bash
   npm run generate
   firebase deploy --only hosting
   ```

## Customization

### Modifying League Rules

Edit the content in `pages/rules.vue` to match your league's specific rules.

### Changing Scoring System

Update the scoring logic in:
- `pages/submit-game.vue` (game submission)
- Backend logic for calculating points

### Styling

- **Global styles**: `assets/css/main.css`
- **Theme colors**: `tailwind.config.ts`
- **Component styles**: Use Tailwind CSS classes with the custom MTG color palette
  - Lorwyn Gold: `lorwyn-gold-*`
  - Shadowmoor Purple: `shadowmoor-purple-*`
  - Shadowmoor Magenta: `shadowmoor-magenta-*`
  - Twilight Blue: `twilight-blue-*`

## Cost Optimization

### Staying Within Free Tiers

**Firebase Free Tier (Spark Plan)**:
- Firestore: 50K reads, 20K writes, 20K deletes per day
- Authentication: Unlimited
- Hosting: 10GB storage, 360MB/day transfer

**Tips to Stay Free**:
1. Implement client-side caching
2. Use Firestore queries efficiently
3. Paginate large lists
4. Use client-side sorting for small datasets
5. Monitor usage in Firebase Console

**Vercel Free Tier**:
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains

## Firebase Security Rules

The `firestore.rules` file contains comprehensive security rules:

- **Seasons**: Public read, authenticated write (admin only)
- **PlayerSeasons**: Public read, owner-only write
- **Players**: Public read, authenticated write (owner validation)
- **Users**: Owner-only read/write
- **Games**: Public read, authenticated write
- **Decks**: Public read, owner-only write

Deploy rules with:
```bash
firebase deploy --only firestore:rules
```

## Development

### Creating a New Season

1. Access Firestore Console
2. Go to `seasons` collection
3. Set current active season's `isActive` to `false`
4. Add new season document with:
   - `name`: Season name
   - `slug`: URL-friendly slug
   - `startDate`: Start timestamp
   - `endDate`: null (or end timestamp if completed)
   - `isActive`: true
   - `description`: Season description

### Player Registration Flow

1. User signs in/registers
2. User navigates to `/seasons`
3. If not registered for active season, clicks "Register for Season"
4. System creates `PlayerSeason` document with initial stats
5. Player's games now count toward that season's stats

### Submitting Games

1. User must be authenticated
2. Navigate to `/submit-game`
3. Select players and decks
4. Specify placements and winner
5. Game is created with active `seasonId`
6. Player stats in `playerSeasons` are updated

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own league!

## Support

For issues or questions:
- Create an issue on GitHub
- Contact the league organizer
- Check the documentation in `CLAUDE.md`

## Roadmap

Future features to implement:
- [ ] Deck builder with card search integration
- [ ] Advanced statistics and analytics dashboards
- [ ] Automatic season rollover
- [ ] Player achievement badges
- [ ] Match scheduling system
- [ ] Tournament brackets
- [ ] Mobile app (React Native/Ionic)
- [ ] Export data to CSV/PDF
- [ ] Admin dashboard for season management
- [ ] Discord/Slack integration for notifications

---

Built with ❤️ for the Commander community by Budget Ducks

**Powered by Nuxt 3, Firebase, and Nuxt UI**
