# MTG Commander League

A web application for tracking budget Commander league games, decks, and standings. Built with Nuxt 3, Nuxt UI, and Firebase.

## Features

- **Leaderboard**: Track player rankings and statistics
- **Deck Management**: Register and view player decks with budget tracking
- **Game Submission**: Submit game results and track match history
- **Rules**: View league rules and scoring system
- **Authentication**: Secure user authentication with Firebase (Email/Password and Google Sign-In)
- **Real-time Updates**: Firebase Firestore for real-time data synchronization

## Tech Stack

- **Frontend**: Nuxt 3 + Vue 3
- **UI Framework**: Nuxt UI (built on Tailwind CSS)
- **Backend/Database**: Firebase (Firestore + Authentication)
- **Deployment**: Vercel, Netlify, or Firebase Hosting (free tiers available)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18 or higher recommended)
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
   - Choose "Start in production mode" (you can adjust security rules later)
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

### 5. Set Up Firestore Database Structure

Create the following collections in Firestore:

#### Collections:

1. **users**
   ```
   - id: string (auto-generated)
   - displayName: string
   - email: string
   - createdAt: timestamp
   ```

2. **players**
   ```
   - id: string (auto-generated)
   - userId: string (reference to users)
   - displayName: string
   - wins: number
   - games: number
   - points: number
   - createdAt: timestamp
   ```

3. **decks**
   ```
   - id: string (auto-generated)
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

4. **games**
   ```
   - id: string (auto-generated)
   - date: string (ISO format)
   - players: array of objects
   - winnerId: string
   - placements: array
   - notes: string
   - turnCount: number
   - createdAt: timestamp
   ```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

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

## Project Structure

```
mtg-commander-league/
├── assets/           # CSS and static assets
├── components/       # Vue components
├── composables/      # Composable functions (useAuth, useFirestore)
├── layouts/          # Layout components
├── pages/            # Route pages
│   ├── index.vue            # Home page
│   ├── leaderboard.vue      # Leaderboard
│   ├── decks.vue            # Deck listing
│   ├── rules.vue            # League rules
│   ├── submit-game.vue      # Game submission form
│   └── auth/
│       ├── login.vue        # Login page
│       └── register.vue     # Registration page
├── plugins/          # Nuxt plugins (Firebase initialization)
├── public/           # Public static files
├── server/           # Server API routes (optional)
├── .env              # Environment variables (not in git)
├── .env.example      # Environment variables template
├── app.vue           # Root component
├── nuxt.config.ts    # Nuxt configuration
├── package.json      # Dependencies
└── README.md         # This file
```

## Customization

### Modifying League Rules

Edit the content in `pages/rules.vue` to match your league's specific rules.

### Changing Scoring System

Update the scoring logic in:
- `pages/submit-game.vue` (game submission)
- Backend logic for calculating points

### Styling

- Global styles: `assets/css/main.css`
- Nuxt UI theme: Configure in `nuxt.config.ts`
- Component styles: Use Tailwind CSS classes

## Firebase Security Rules

Here are recommended Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read all documents but only write their own
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Anyone can read players and decks
    match /players/{playerId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    match /decks/{deckId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null &&
        resource.data.ownerId == request.auth.uid;
    }

    // Anyone can read games, authenticated users can submit
    match /games/{gameId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null;
    }
  }
}
```

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
4. Monitor usage in Firebase Console

**Vercel Free Tier**:
- 100GB bandwidth/month
- Unlimited deployments
- Custom domains

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

## Roadmap

Future features to implement:
- [ ] Deck builder with card search
- [ ] Advanced statistics and analytics
- [ ] Season management
- [ ] Player profiles
- [ ] Match scheduling
- [ ] Tournament brackets
- [ ] Mobile app (React Native/Ionic)
- [ ] Export data to CSV/PDF

---

Built with ❤️ for the Commander community
