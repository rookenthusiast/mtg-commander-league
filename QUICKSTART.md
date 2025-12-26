# Quick Start Guide

Get your MTG Commander League website up and running in 10 minutes!

## Prerequisites

1. Install [Node.js](https://nodejs.org/) (v18 or higher)
2. Create a [Firebase account](https://firebase.google.com/) (free)

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Set Up Firebase (5 minutes)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "mtg-commander-league")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Firestore

1. In your Firebase project, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in production mode"
4. Choose your region (closest to your users)
5. Click "Enable"

### Enable Authentication

1. Click "Authentication" in the left sidebar
2. Click "Get started"
3. Click "Email/Password" and enable it
4. (Optional) Enable "Google" sign-in

### Get Configuration

1. Click the gear icon next to "Project Overview"
2. Click "Project settings"
3. Scroll down to "Your apps"
4. Click the web icon `</>`
5. Give your app a nickname
6. Click "Register app"
7. Copy the configuration values

## Step 3: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and paste your Firebase configuration:
   ```env
   FIREBASE_API_KEY=your_api_key_here
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

## Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!

## Step 5: Create Your First Account

1. Click "Sign In" in the top right
2. Click "Sign Up"
3. Create an account
4. Start adding decks and submitting games!

## What's Next?

### Customize the Rules

Edit `pages/rules.vue` to match your league's rules.

### Set Up Firestore Security Rules

1. Go to Firestore Database in Firebase Console
2. Click "Rules" tab
3. Copy the security rules from the README
4. Click "Publish"

### Invite Your League

Share your development URL or deploy to production (see README for deployment options).

## Free Deployment Options

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables
6. Click "Deploy"

Your site will be live at `your-project.vercel.app`!

## Need Help?

Check the full [README.md](./README.md) for detailed documentation.

## Common Issues

**Firebase errors?**
- Make sure you copied all the environment variables correctly
- Check that Firestore and Authentication are enabled

**Page not loading?**
- Make sure Node.js is installed
- Try deleting `node_modules` and running `npm install` again

**Can't sign in?**
- Make sure Email/Password authentication is enabled in Firebase Console

---

Happy gaming! 🎮🃏
