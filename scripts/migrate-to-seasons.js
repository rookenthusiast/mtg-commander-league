/**
 * Migration Script: Add Seasons Support to MTG Commander League
 *
 * This script migrates the database to support seasons by:
 * 1. Creating the first season document
 * 2. Migrating player stats to playerSeasons collection
 * 3. Adding seasonId to all games
 * 4. Adding seasonId to all decks
 * 5. Removing stats fields from players
 *
 * IMPORTANT: Run this only once! Review the code before executing.
 */

const admin = require('firebase-admin')

// Configuration
const SEASON_ID = 'season-1'
const SEASON_NAME = 'Lorwyn Season'
const SEASON_SLUG = 'lorwyn-2025'
const SEASON_START_DATE = new Date('2025-01-01T00:00:00Z')
const SEASON_DESCRIPTION = 'The inaugural Budget Ducks Commander League season'

// Initialize Firebase Admin
// You need to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or provide the service account key path
if (!admin.apps.length) {
  try {
    // Try to use GOOGLE_APPLICATION_CREDENTIALS env var
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
    console.log('✓ Firebase Admin initialized with default credentials')
  } catch (error) {
    console.error('Failed to initialize Firebase Admin.')
    console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable:')
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="/path/to/serviceAccountKey.json"')
    console.error('\nOr download the service account key from:')
    console.error('  Firebase Console > Project Settings > Service Accounts > Generate New Private Key')
    process.exit(1)
  }
}

const db = admin.firestore()

/**
 * Step 1: Create the first season
 */
async function createFirstSeason() {
  console.log('\n📅 Step 1: Creating first season...')

  const seasonRef = db.collection('seasons').doc(SEASON_ID)
  const seasonDoc = await seasonRef.get()

  if (seasonDoc.exists) {
    console.log('⚠️  Season already exists, skipping creation')
    return
  }

  const now = admin.firestore.Timestamp.now()
  const seasonData = {
    name: SEASON_NAME,
    slug: SEASON_SLUG,
    startDate: admin.firestore.Timestamp.fromDate(SEASON_START_DATE),
    endDate: null,
    isActive: true,
    description: SEASON_DESCRIPTION,
    createdAt: now,
    updatedAt: now,
  }

  await seasonRef.set(seasonData)
  console.log(`✓ Created season: ${SEASON_NAME} (${SEASON_ID})`)
}

/**
 * Step 2: Migrate player stats to playerSeasons collection
 */
async function migratePlayerStats() {
  console.log('\n👥 Step 2: Migrating player stats to playerSeasons...')

  const playersSnapshot = await db.collection('players').get()

  if (playersSnapshot.empty) {
    console.log('⚠️  No players found, skipping migration')
    return
  }

  let migratedCount = 0
  const batch = db.batch()
  const now = admin.firestore.Timestamp.now()

  for (const playerDoc of playersSnapshot.docs) {
    const player = playerDoc.data()
    const playerId = playerDoc.id

    // Create playerSeason document
    const playerSeasonRef = db.collection('playerSeasons').doc()
    const playerSeasonData = {
      playerId: playerId,
      seasonId: SEASON_ID,
      displayName: player.displayName || 'Unknown Player',
      points: player.points || 0,
      wins: player.wins || 0,
      losses: player.losses || 0,
      gamesPlayed: player.games || 0,
      registeredAt: player.createdAt || now,
      createdAt: now,
      updatedAt: now,
    }

    batch.set(playerSeasonRef, playerSeasonData)

    // Remove stats from player document
    batch.update(playerDoc.ref, {
      wins: admin.firestore.FieldValue.delete(),
      games: admin.firestore.FieldValue.delete(),
      points: admin.firestore.FieldValue.delete(),
      losses: admin.firestore.FieldValue.delete(),
    })

    migratedCount++
    console.log(`  ✓ Migrated stats for player: ${player.displayName}`)
  }

  await batch.commit()
  console.log(`✓ Migrated ${migratedCount} player(s) to playerSeasons`)
}

/**
 * Step 3: Add seasonId to all games
 */
async function addSeasonToGames() {
  console.log('\n🎮 Step 3: Adding seasonId to games...')

  const gamesSnapshot = await db.collection('games').get()

  if (gamesSnapshot.empty) {
    console.log('⚠️  No games found, skipping migration')
    return
  }

  let updatedCount = 0
  const batch = db.batch()

  for (const gameDoc of gamesSnapshot.docs) {
    const game = gameDoc.data()

    // Skip if already has seasonId
    if (game.seasonId) {
      console.log(`  ⊘ Game ${gameDoc.id} already has seasonId, skipping`)
      continue
    }

    batch.update(gameDoc.ref, {
      seasonId: SEASON_ID,
    })

    updatedCount++
  }

  if (updatedCount > 0) {
    await batch.commit()
    console.log(`✓ Added seasonId to ${updatedCount} game(s)`)
  } else {
    console.log('⚠️  All games already have seasonId')
  }
}

/**
 * Step 4: Add seasonId to all decks
 */
async function addSeasonToDecks() {
  console.log('\n🃏 Step 4: Adding seasonId to decks...')

  const decksSnapshot = await db.collection('decks').get()

  if (decksSnapshot.empty) {
    console.log('⚠️  No decks found, skipping migration')
    return
  }

  let updatedCount = 0
  const batch = db.batch()

  for (const deckDoc of decksSnapshot.docs) {
    const deck = deckDoc.data()

    // Skip if already has seasonId
    if (deck.seasonId) {
      console.log(`  ⊘ Deck ${deck.name} already has seasonId, skipping`)
      continue
    }

    batch.update(deckDoc.ref, {
      seasonId: SEASON_ID,
    })

    updatedCount++
  }

  if (updatedCount > 0) {
    await batch.commit()
    console.log(`✓ Added seasonId to ${updatedCount} deck(s)`)
  } else {
    console.log('⚠️  All decks already have seasonId')
  }
}

/**
 * Verify migration results
 */
async function verifyMigration() {
  console.log('\n🔍 Step 5: Verifying migration...')

  // Check season
  const seasonDoc = await db.collection('seasons').doc(SEASON_ID).get()
  console.log(`  Season exists: ${seasonDoc.exists ? '✓' : '✗'}`)

  // Count playerSeasons
  const playerSeasonsSnapshot = await db.collection('playerSeasons')
    .where('seasonId', '==', SEASON_ID)
    .get()
  console.log(`  PlayerSeasons created: ${playerSeasonsSnapshot.size}`)

  // Count games with seasonId
  const gamesWithSeasonSnapshot = await db.collection('games')
    .where('seasonId', '==', SEASON_ID)
    .get()
  console.log(`  Games with seasonId: ${gamesWithSeasonSnapshot.size}`)

  // Count decks with seasonId
  const decksWithSeasonSnapshot = await db.collection('decks')
    .where('seasonId', '==', SEASON_ID)
    .get()
  console.log(`  Decks with seasonId: ${decksWithSeasonSnapshot.size}`)

  // Check if any players still have stats
  const playersSnapshot = await db.collection('players').limit(1).get()
  if (!playersSnapshot.empty) {
    const samplePlayer = playersSnapshot.docs[0].data()
    const hasOldStats = 'wins' in samplePlayer || 'points' in samplePlayer
    console.log(`  Players stats removed: ${hasOldStats ? '✗' : '✓'}`)
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Seasons Migration...')
  console.log('=====================================')

  try {
    await createFirstSeason()
    await migratePlayerStats()
    await addSeasonToGames()
    await addSeasonToDecks()
    await verifyMigration()

    console.log('\n=====================================')
    console.log('✅ Migration completed successfully!')
    console.log('=====================================\n')

    process.exit(0)
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run the migration
runMigration()
