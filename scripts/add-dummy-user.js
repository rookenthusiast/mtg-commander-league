/**
 * Add Dummy User Script
 *
 * Creates a test user with associated data for testing admin management features.
 * This creates:
 * - User account (non-admin)
 * - Player profile
 * - Multiple decks
 * - Season registrations (playerSeasons)
 * - Game submissions
 *
 * Usage:
 * GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json" node scripts/add-dummy-user.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  });
}

const db = admin.firestore();

async function addDummyUser() {
  try {
    console.log('🚀 Creating dummy user for admin testing...\n');

    // Generate a unique ID for the dummy user
    const dummyUserId = 'dummy-user-' + Date.now();
    const dummyEmail = `dummy-${Date.now()}@example.com`;
    const dummyDisplayName = 'Test User';

    console.log('📝 Creating user account...');
    // 1. Create user document
    await db.collection('users').doc(dummyUserId).set({
      email: dummyEmail,
      displayName: dummyDisplayName,
      isAdmin: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`✅ User created: ${dummyDisplayName} (${dummyEmail})`);
    console.log(`   User ID: ${dummyUserId}\n`);

    console.log('👤 Creating player profile...');
    // 2. Create player profile
    const playerRef = await db.collection('players').add({
      userId: dummyUserId,
      displayName: dummyDisplayName,
      email: dummyEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    const playerId = playerRef.id;
    console.log(`✅ Player profile created (ID: ${playerId})\n`);

    // Get active season
    console.log('📅 Finding active season...');
    const seasonsSnapshot = await db.collection('seasons')
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (seasonsSnapshot.empty) {
      console.log('⚠️  No active season found. Skipping season registration.');
    } else {
      const activeSeason = seasonsSnapshot.docs[0];
      const seasonId = activeSeason.id;
      const seasonName = activeSeason.data().name;

      console.log(`✅ Found active season: ${seasonName}\n`);

      console.log('🎮 Registering player for season...');
      // 3. Create playerSeason (season registration with stats)
      await db.collection('playerSeasons').add({
        playerId: dummyUserId,
        seasonId: seasonId,
        displayName: dummyDisplayName,
        points: 45,
        wins: 3,
        losses: 2,
        gamesPlayed: 5,
        registeredAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Player registered for season with 3 wins, 2 losses, 45 points\n`);

      console.log('🃏 Creating decks...');
      // 4. Create some decks
      const decks = [
        {
          name: 'Atraxa, Praetors\' Voice',
          commander: 'Atraxa, Praetors\' Voice',
          colors: ['W', 'U', 'B', 'G'],
          budget: 75,
          ownerId: dummyUserId,
          ownerName: dummyDisplayName,
          seasonId: seasonId,
          wins: 2,
          losses: 1,
          gamesPlayed: 3,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        },
        {
          name: 'Krenko, Mob Boss Budget Goblins',
          commander: 'Krenko, Mob Boss',
          colors: ['R'],
          budget: 35,
          ownerId: dummyUserId,
          ownerName: dummyDisplayName,
          seasonId: seasonId,
          wins: 1,
          losses: 1,
          gamesPlayed: 2,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }
      ];

      const deckIds = [];
      for (const deck of decks) {
        const deckRef = await db.collection('decks').add(deck);
        deckIds.push(deckRef.id);
        console.log(`✅ Deck created: ${deck.name} (${deck.colors.join('')}) - $${deck.budget}`);
      }
      console.log('');

      console.log('🎲 Creating game submissions...');
      // 5. Create some game submissions (to test that games are preserved on user deletion)
      const game1 = await db.collection('games').add({
        seasonId: seasonId,
        players: [
          {
            playerId: dummyUserId,
            playerName: dummyDisplayName,
            deckId: deckIds[0],
            deckName: 'Atraxa, Praetors\' Voice',
            placement: 1
          },
          {
            playerId: 'other-player-1',
            playerName: 'Other Player 1',
            deckId: 'other-deck-1',
            deckName: 'Some Other Deck',
            placement: 2
          },
          {
            playerId: 'other-player-2',
            playerName: 'Other Player 2',
            deckId: 'other-deck-2',
            deckName: 'Another Deck',
            placement: 3
          }
        ],
        winnerId: dummyUserId,
        winnerName: dummyDisplayName,
        submittedBy: dummyUserId,
        submittedByName: dummyDisplayName,
        notes: 'Test game - Atraxa combo win',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Game 1 created (Winner: ${dummyDisplayName})`);

      const game2 = await db.collection('games').add({
        seasonId: seasonId,
        players: [
          {
            playerId: 'other-player-3',
            playerName: 'Other Player 3',
            deckId: 'other-deck-3',
            deckName: 'Winning Deck',
            placement: 1
          },
          {
            playerId: dummyUserId,
            playerName: dummyDisplayName,
            deckId: deckIds[1],
            deckName: 'Krenko, Mob Boss Budget Goblins',
            placement: 2
          },
          {
            playerId: 'other-player-4',
            playerName: 'Other Player 4',
            deckId: 'other-deck-4',
            deckName: 'Control Deck',
            placement: 3
          }
        ],
        winnerId: 'other-player-3',
        winnerName: 'Other Player 3',
        submittedBy: dummyUserId,
        submittedByName: dummyDisplayName,
        notes: 'Test game - Lost to combo',
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Game 2 created (Winner: Other Player 3)`);
      console.log('');
    }

    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ DUMMY USER CREATED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`
📋 Summary:
   User ID:       ${dummyUserId}
   Email:         ${dummyEmail}
   Display Name:  ${dummyDisplayName}
   Admin:         No
   Player ID:     ${playerId}
   Decks:         2
   Season Stats:  3W-2L, 45 points
   Games:         2 submitted

🧪 You can now test admin features:
   ✓ Promote user to admin
   ✓ Demote user from admin
   ✓ Delete user (will remove user, player, decks, playerSeasons but preserve games)
   ✓ View user in admin dashboard

🌐 Navigate to /admin to manage this user
    `);

  } catch (error) {
    console.error('❌ Error creating dummy user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the script
addDummyUser();
