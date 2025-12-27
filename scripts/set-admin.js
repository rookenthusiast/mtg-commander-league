/**
 * Script to set a user as admin
 * Usage: GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json" node scripts/set-admin.js
 */

const admin = require('firebase-admin')

// Admin user email to set
const ADMIN_EMAIL = 'camyz15@hotmail.com'

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

async function setAdmin() {
  console.log('\n🔧 Setting Admin User...')
  console.log('=====================================\n')

  try {
    // Find user by email
    console.log(`Looking for user with email: ${ADMIN_EMAIL}...`)
    const usersSnapshot = await db.collection('users')
      .where('email', '==', ADMIN_EMAIL)
      .get()

    if (usersSnapshot.empty) {
      console.log(`\n❌ No user found with email: ${ADMIN_EMAIL}`)
      console.log('\nPossible reasons:')
      console.log('  1. The user has not signed up yet')
      console.log('  2. The email is incorrect')
      console.log('\nPlease ensure the user has created an account first.')
      process.exit(1)
    }

    const userDoc = usersSnapshot.docs[0]
    const userId = userDoc.id
    const userData = userDoc.data()

    console.log(`\n✓ Found user:`)
    console.log(`  ID: ${userId}`)
    console.log(`  Display Name: ${userData.displayName}`)
    console.log(`  Email: ${userData.email}`)
    console.log(`  Current Admin Status: ${userData.isAdmin || false}`)

    // Update user to admin
    console.log('\nUpdating user to admin...')
    await db.collection('users').doc(userId).update({
      isAdmin: true,
      updatedAt: new Date().toISOString()
    })

    console.log('\n✅ User successfully promoted to admin!')
    console.log(`\n${userData.displayName} (${userData.email}) is now an administrator.`)
    console.log('\n=====================================')
    console.log('✅ Complete\n')

  } catch (error) {
    console.error('\n❌ Error setting admin:', error)
  }

  process.exit(0)
}

setAdmin()
