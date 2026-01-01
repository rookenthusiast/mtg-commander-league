/**
 * Migration Script: Deck-Season Registration Model
 *
 * This script migrates the database from the old model (decks have seasonId)
 * to the new model (playerSeasons have registeredDeckIds array).
 *
 * Changes:
 * 1. Remove seasonId field from all decks
 * 2. Add registeredDeckIds array to all playerSeasons
 * 3. For each playerSeason, find all decks owned by that player for that season
 *    and add them to registeredDeckIds (up to 3 decks)
 *
 * Prerequisites:
 * - Firebase Admin SDK installed (npm install firebase-admin --save-dev)
 * - Service account key downloaded from Firebase Console
 * - Set GOOGLE_APPLICATION_CREDENTIALS environment variable
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"
 *   node scripts/migrate-deck-season-registration.js
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault()
  })
  console.log('✅ Firebase Admin initialized successfully')
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message)
  console.error('   Make sure GOOGLE_APPLICATION_CREDENTIALS is set correctly')
  process.exit(1)
}

const db = admin.firestore()

async function migrateData() {
  console.log('\n🚀 Starting migration...\n')

  try {
    // Step 1: Get all playerSeasons
    console.log('📊 Step 1: Fetching all playerSeasons...')
    const playerSeasonsSnapshot = await db.collection('playerSeasons').get()
    console.log(`   Found ${playerSeasonsSnapshot.size} playerSeason documents`)

    // Step 2: Get all decks
    console.log('\n📊 Step 2: Fetching all decks...')
    const decksSnapshot = await db.collection('decks').get()
    console.log(`   Found ${decksSnapshot.size} deck documents`)

    // Build a map of seasonId -> playerId -> deckIds
    const seasonPlayerDecks = new Map()

    decksSnapshot.forEach(doc => {
      const deck = doc.data()
      const deckId = doc.id
      const seasonId = deck.seasonId
      const ownerId = deck.ownerId

      if (seasonId && ownerId) {
        if (!seasonPlayerDecks.has(seasonId)) {
          seasonPlayerDecks.set(seasonId, new Map())
        }
        if (!seasonPlayerDecks.get(seasonId).has(ownerId)) {
          seasonPlayerDecks.get(seasonId).set(ownerId, [])
        }
        seasonPlayerDecks.get(seasonId).get(ownerId).push(deckId)
      }
    })

    console.log(`\n📊 Step 3: Updating playerSeasons with registeredDeckIds...`)
    const batch = db.batch()
    let updatedPlayerSeasons = 0
    let skippedPlayerSeasons = 0

    for (const doc of playerSeasonsSnapshot.docs) {
      const playerSeason = doc.data()
      const playerId = playerSeason.playerId
      const seasonId = playerSeason.seasonId

      // Check if already has registeredDeckIds
      if (playerSeason.registeredDeckIds && Array.isArray(playerSeason.registeredDeckIds)) {
        console.log(`   ⏭️  Skipping ${doc.id} - already has registeredDeckIds`)
        skippedPlayerSeasons++
        continue
      }

      // Find decks for this player and season
      let deckIds = []
      if (seasonPlayerDecks.has(seasonId) && seasonPlayerDecks.get(seasonId).has(playerId)) {
        deckIds = seasonPlayerDecks.get(seasonId).get(playerId).slice(0, 3) // Max 3 decks
      }

      // If no decks found, we need to ensure at least an empty array
      // NOTE: This will fail Firestore rules validation (min 1 deck required)
      // Admin will need to manually fix these or players will need to register decks
      const registeredDeckIds = deckIds.length > 0 ? deckIds : []

      batch.update(doc.ref, { registeredDeckIds })
      updatedPlayerSeasons++

      if (registeredDeckIds.length === 0) {
        console.log(`   ⚠️  Warning: PlayerSeason ${doc.id} has no decks registered`)
      } else {
        console.log(`   ✅ Updated ${doc.id} with ${registeredDeckIds.length} deck(s)`)
      }
    }

    console.log(`\n📊 Step 4: Removing seasonId from decks...`)
    let updatedDecks = 0
    let skippedDecks = 0

    for (const doc of decksSnapshot.docs) {
      const deck = doc.data()

      // Check if seasonId exists
      if (!deck.hasOwnProperty('seasonId')) {
        skippedDecks++
        continue
      }

      // Remove seasonId using FieldValue.delete()
      batch.update(doc.ref, {
        seasonId: admin.firestore.FieldValue.delete()
      })
      updatedDecks++
    }

    // Commit all changes
    console.log(`\n📊 Step 5: Committing changes to Firestore...`)
    await batch.commit()

    // Summary
    console.log('\n✅ Migration completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`   PlayerSeasons:`)
    console.log(`     - Updated: ${updatedPlayerSeasons}`)
    console.log(`     - Skipped: ${skippedPlayerSeasons}`)
    console.log(`   Decks:`)
    console.log(`     - Updated: ${updatedDecks}`)
    console.log(`     - Skipped: ${skippedDecks}`)

    // Check for warnings
    if (updatedPlayerSeasons === 0 && skippedPlayerSeasons === 0) {
      console.log('\n⚠️  Warning: No playerSeasons were found or updated')
    }

    console.log('\n⚠️  Important Notes:')
    console.log('   1. Players with no decks registered will need to register at least 1 deck')
    console.log('   2. You may need to deploy the updated Firestore rules')
    console.log('   3. Test the application thoroughly before going live')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateData()
  .then(() => {
    console.log('\n✨ Migration script finished')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })
