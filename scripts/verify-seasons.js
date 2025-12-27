/**
 * Verification Script: Check Seasons in Firestore
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
    console.log('✓ Firebase Admin initialized')
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error.message)
    process.exit(1)
  }
}

const db = admin.firestore()

async function verifySeasons() {
  console.log('\n🔍 Verifying Seasons Data...')
  console.log('=====================================\n')

  try {
    // Check seasons collection
    const seasonsSnapshot = await db.collection('seasons').get()
    console.log(`📅 Seasons Collection: ${seasonsSnapshot.size} document(s)`)

    if (seasonsSnapshot.empty) {
      console.log('❌ No seasons found in Firestore!')
      console.log('\nYou need to run the migration script:')
      console.log('  GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json" node scripts/migrate-to-seasons.js')
    } else {
      seasonsSnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`\n  Season ID: ${doc.id}`)
        console.log(`  Name: ${data.name}`)
        console.log(`  Slug: ${data.slug}`)
        console.log(`  Active: ${data.isActive}`)
        console.log(`  Start Date: ${data.startDate?.toDate?.() || data.startDate}`)
        console.log(`  End Date: ${data.endDate ? (data.endDate?.toDate?.() || data.endDate) : 'null (ongoing)'}`)
      })
    }

    // Check playerSeasons collection
    const playerSeasonsSnapshot = await db.collection('playerSeasons').get()
    console.log(`\n👥 PlayerSeasons Collection: ${playerSeasonsSnapshot.size} document(s)`)

    if (playerSeasonsSnapshot.size > 0) {
      console.log('\n  Sample playerSeason documents:')
      playerSeasonsSnapshot.docs.slice(0, 3).forEach(doc => {
        const data = doc.data()
        console.log(`    - ${data.displayName} (Season: ${data.seasonId}, Points: ${data.points})`)
      })
    }

    // Check games with seasonId
    const gamesSnapshot = await db.collection('games')
      .where('seasonId', '==', 'season-1')
      .get()
    console.log(`\n🎮 Games with seasonId='season-1': ${gamesSnapshot.size} document(s)`)

    // Check decks with seasonId
    const decksSnapshot = await db.collection('decks')
      .where('seasonId', '==', 'season-1')
      .get()
    console.log(`🃏 Decks with seasonId='season-1': ${decksSnapshot.size} document(s)`)

    console.log('\n=====================================')
    console.log('✅ Verification Complete\n')

  } catch (error) {
    console.error('\n❌ Error during verification:', error)
  }

  process.exit(0)
}

verifySeasons()
