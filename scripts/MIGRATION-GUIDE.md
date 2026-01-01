# Deck-Season Registration Migration Guide

This guide explains how to migrate your existing MTG Commander League database from the old model (where decks have `seasonId`) to the new model (where `playerSeasons` have `registeredDeckIds`).

## What Changed

### Old Model
- **Decks** had a `seasonId` field linking them to a season
- Players could only use decks created for that specific season
- Decks were season-specific

### New Model
- **Decks** no longer have `seasonId` (decks are now season-agnostic)
- **PlayerSeasons** now have `registeredDeckIds` array (1-3 deck IDs)
- Players can register any of their decks to any season
- Players can switch decks mid-season via `/seasons/manage-decks`

## Prerequisites

1. **Install Firebase Admin SDK** (if not already installed):
   ```bash
   npm install firebase-admin --save-dev
   ```

2. **Download Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select your project
   - Go to Project Settings → Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `scripts/serviceAccountKey.json`

3. **Set Environment Variable**:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"
   ```

## Running the Migration

1. **Backup your database** (important!):
   - Go to Firestore in Firebase Console
   - Click "Import/Export"
   - Export your current database to Cloud Storage

2. **Run the migration script**:
   ```bash
   node scripts/migrate-deck-season-registration.js
   ```

3. **Review the output**:
   - The script will show you what it's doing step-by-step
   - Pay attention to warnings about playerSeasons with no decks
   - Check the summary at the end

## What the Script Does

1. **Fetches all playerSeasons and decks** from your database

2. **Maps decks to players and seasons**:
   - Groups decks by seasonId and ownerId
   - Limits to 3 decks per player per season (new requirement)

3. **Updates playerSeasons**:
   - Adds `registeredDeckIds` array to each playerSeason
   - Populates it with up to 3 deck IDs owned by that player for that season
   - Skips playerSeasons that already have `registeredDeckIds`

4. **Updates decks**:
   - Removes the `seasonId` field from all decks
   - Decks become season-agnostic

5. **Commits all changes in a single batch** (atomic operation)

## Post-Migration Steps

### 1. Deploy Updated Firestore Rules

The Firestore rules have been updated to enforce the 1-3 deck requirement. Deploy them:

**Option A: Firebase Console (Manual)**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database → Rules
4. Copy contents from `firestore.rules` and paste
5. Click "Publish"

**Option B: Firebase CLI**
```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login to Firebase
firebase login

# Deploy rules only
firebase deploy --only firestore:rules
```

### 2. Handle Players with No Decks

If the migration warns about playerSeasons with no decks registered, you have two options:

**Option A: Let Players Register Decks**
- Players will see a message when trying to submit games
- They can go to `/seasons/manage-decks` to register decks
- This is the recommended approach

**Option B: Manually Fix in Firebase Console**
- Go to Firestore
- Find playerSeasons with empty `registeredDeckIds`
- Either:
  - Remove the playerSeason (player can re-register)
  - Add deck IDs manually

### 3. Test the Application

Test these key workflows:

1. **Season Registration** (`/seasons/register`):
   - New players should be able to register with 1-3 decks
   - Registration should fail if no decks selected

2. **Deck Management** (`/seasons/manage-decks`):
   - Existing players should see their current registered decks
   - They should be able to add/remove decks (1-3 total)

3. **Game Submission** (`/submit-game`):
   - Only registered decks for the season should appear in dropdown
   - Should be filtered per player

4. **Profile/Decks Page** (`/profile`):
   - Creating new decks should NOT auto-assign to season
   - Decks should be season-independent

## Rollback Plan

If something goes wrong, you can restore from your backup:

1. Go to Firestore in Firebase Console
2. Click "Import/Export"
3. Import from your Cloud Storage backup
4. Revert code changes
5. Redeploy previous Firestore rules

## Common Issues

### Issue: Migration script hangs or times out
**Solution**: Your database might be large. The script processes in batches, but for very large databases, you may need to run it in chunks.

### Issue: "PERMISSION_DENIED" errors
**Solution**: Make sure:
- Service account key is correct
- `GOOGLE_APPLICATION_CREDENTIALS` is set
- Your service account has the correct permissions

### Issue: Players can't submit games after migration
**Solution**:
- Check if they have decks registered for the season
- Have them visit `/seasons/manage-decks` to register decks
- Check Firestore rules are deployed correctly

### Issue: Some decks don't show up
**Solution**:
- Verify the deck exists in Firestore (not deleted)
- Check if the deck is registered in the player's `playerSeason.registeredDeckIds`
- Look at browser console for errors

## Need Help?

If you encounter issues:
1. Check the script output for specific error messages
2. Look at your Firestore data directly in the console
3. Check browser console for frontend errors
4. Verify Firestore rules are deployed correctly

## Script Output Example

```
✅ Firebase Admin initialized successfully

🚀 Starting migration...

📊 Step 1: Fetching all playerSeasons...
   Found 15 playerSeason documents

📊 Step 2: Fetching all decks...
   Found 42 deck documents

📊 Step 3: Updating playerSeasons with registeredDeckIds...
   ✅ Updated ps_player1_season1 with 3 deck(s)
   ✅ Updated ps_player2_season1 with 2 deck(s)
   ⚠️  Warning: PlayerSeason ps_player3_season1 has no decks registered
   ...

📊 Step 4: Removing seasonId from decks...

📊 Step 5: Committing changes to Firestore...

✅ Migration completed successfully!

📊 Summary:
   PlayerSeasons:
     - Updated: 15
     - Skipped: 0
   Decks:
     - Updated: 42
     - Skipped: 0

⚠️  Important Notes:
   1. Players with no decks registered will need to register at least 1 deck
   2. You may need to deploy the updated Firestore rules
   3. Test the application thoroughly before going live

✨ Migration script finished
```
