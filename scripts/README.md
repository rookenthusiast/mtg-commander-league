# Migration Scripts

## migrate-to-seasons.js

This script migrates your database to support the seasons feature.

### Prerequisites

1. **Install Firebase Admin SDK** (one-time):
   ```bash
   npm install firebase-admin --save-dev
   ```

2. **Get Firebase Service Account Key**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your project
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `serviceAccountKey.json` in this directory
   - **IMPORTANT**: Do NOT commit this file to git (it's in .gitignore)

### Running the Migration

1. **Set environment variable** (option 1):
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"
   node scripts/migrate-to-seasons.js
   ```

2. **Or use the service account directly** (option 2):
   Edit the script to uncomment the manual initialization section

### What This Script Does

1. ✅ Creates the first season: "Lorwyn Season" (season-1)
2. ✅ Migrates all player stats to new `playerSeasons` collection
3. ✅ Adds `seasonId` field to all existing games
4. ✅ Adds `seasonId` field to all existing decks
5. ✅ Removes old stats fields from `players` collection
6. ✅ Verifies migration completed successfully

### Before Running

- **Backup your database** (use Firebase Console > Firestore Database > Export)
- Test on a development/staging environment first
- Review the script code to understand what it does

### After Running

You should see output like:
```
🚀 Starting Seasons Migration...
=====================================
📅 Step 1: Creating first season...
✓ Created season: Lorwyn Season (season-1)

👥 Step 2: Migrating player stats to playerSeasons...
  ✓ Migrated stats for player: Alex
  ✓ Migrated stats for player: Jordan
✓ Migrated 2 player(s) to playerSeasons

🎮 Step 3: Adding seasonId to games...
✓ Added seasonId to 15 game(s)

🃏 Step 4: Adding seasonId to decks...
✓ Added seasonId to 8 deck(s)

🔍 Step 5: Verifying migration...
  Season exists: ✓
  PlayerSeasons created: 2
  Games with seasonId: 15
  Decks with seasonId: 8
  Players stats removed: ✓

=====================================
✅ Migration completed successfully!
=====================================
```

### Troubleshooting

**Error: "Failed to initialize Firebase Admin"**
- Make sure you've set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or download the service account key and place it in the correct location

**Error: "Already exists"**
- The script is idempotent - it skips items already migrated
- Safe to run multiple times

### Safety Features

- ✅ Idempotent: Safe to run multiple times
- ✅ Checks before creating duplicates
- ✅ Uses batched writes for efficiency
- ✅ Verification step confirms success
- ✅ Detailed logging of all operations

---

**Note**: This is a ONE-TIME migration. After running successfully, you don't need to run it again.

---

## set-admin.js

This script sets a user as an administrator. Run this to grant admin privileges to your initial admin user.

### Prerequisites

Same as above - you need Firebase Admin SDK and the service account key.

### Running the Script

1. **Set environment variable**:
   ```bash
   GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json" node scripts/set-admin.js
   ```

### What This Script Does

1. ✅ Finds the user with email `camyz15@hotmail.com`
2. ✅ Sets their `isAdmin` field to `true`
3. ✅ Verifies the update was successful

### Expected Output

```
🔧 Setting Admin User...
=====================================

Looking for user with email: camyz15@hotmail.com...

✓ Found user:
  ID: abc123xyz
  Display Name: rookenthusiast
  Email: camyz15@hotmail.com
  Current Admin Status: false

Updating user to admin...

✅ User successfully promoted to admin!

rookenthusiast (camyz15@hotmail.com) is now an administrator.

=====================================
✅ Complete
```

### To Set a Different Admin

Edit the `ADMIN_EMAIL` constant in `set-admin.js` to change which user becomes admin.

### Important Notes

- The user must have already created an account (signed up) before running this script
- This script can be run multiple times safely
- Only run this for trusted users - admins have full control over the application

---

## add-dummy-user.js

This script creates a test user with realistic data for testing admin management features.

### Prerequisites

Same as above - you need Firebase Admin SDK and the service account key.

### Running the Script

```bash
GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json" node scripts/add-dummy-user.js
```

### What This Script Creates

1. ✅ **User Account** - Non-admin user with unique email
2. ✅ **Player Profile** - Associated player document
3. ✅ **Season Registration** - PlayerSeason with realistic stats (3W-2L, 45 points)
4. ✅ **Decks** - Two commander decks with different budgets and colors
5. ✅ **Game Submissions** - Two game records (one win, one loss)

### Test Data Created

- **User**: Test User (dummy-[timestamp]@example.com)
- **Deck 1**: Atraxa, Praetors' Voice (WUBG, $75)
- **Deck 2**: Krenko, Mob Boss Budget Goblins (R, $35)
- **Season Stats**: 3 wins, 2 losses, 45 points, 5 games played
- **Games**: 2 submitted games with other fictional players

### What You Can Test

After running this script, you can test admin features:

1. **View User** - See the dummy user in the admin dashboard
2. **Promote to Admin** - Grant admin privileges
3. **Demote from Admin** - Remove admin privileges
4. **Delete User** - Test cascade deletion:
   - ✅ Deletes: User account, player profile, decks, playerSeasons
   - ✅ Preserves: Game submissions (historical data)
5. **User List** - Verify user appears in the admin user table

### Expected Output

```
🚀 Creating dummy user for admin testing...

📝 Creating user account...
✅ User created: Test User (dummy-1234567890@example.com)
   User ID: dummy-user-1234567890

👤 Creating player profile...
✅ Player profile created (ID: abc123)

📅 Finding active season...
✅ Found active season: Lorwyn Season

🎮 Registering player for season...
✅ Player registered for season with 3 wins, 2 losses, 45 points

🃏 Creating decks...
✅ Deck created: Atraxa, Praetors' Voice (WUBG) - $75
✅ Deck created: Krenko, Mob Boss Budget Goblins (R) - $35

🎲 Creating game submissions...
✅ Game 1 created (Winner: Test User)
✅ Game 2 created (Winner: Other Player 3)

═══════════════════════════════════════════════════════
✅ DUMMY USER CREATED SUCCESSFULLY!
═══════════════════════════════════════════════════════

📋 Summary:
   User ID:       dummy-user-1234567890
   Email:         dummy-1234567890@example.com
   Display Name:  Test User
   Admin:         No
   Player ID:     abc123
   Decks:         2
   Season Stats:  3W-2L, 45 points
   Games:         2 submitted

🧪 You can now test admin features:
   ✓ Promote user to admin
   ✓ Demote user from admin
   ✓ Delete user (will remove user, player, decks, playerSeasons but preserve games)
   ✓ View user in admin dashboard

🌐 Navigate to /admin to manage this user
```

### Important Notes

- Run this script multiple times to create multiple test users
- Each run creates a unique user with timestamp-based email
- Safe to run repeatedly without conflicts
- Requires an active season to exist (creates season registration and games)
- If no active season, still creates user, player profile, and decks

### Cleaning Up

After testing, you can delete the dummy user(s) from the admin dashboard to clean up test data.

---
