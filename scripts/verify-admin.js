/**
 * Verification Script: Check Admin Status
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

async function verifyAdmin() {
  console.log('\n🔍 Verifying Admin Status...')
  console.log('=====================================\n')

  try {
    // Check all users
    const usersSnapshot = await db.collection('users').get()
    console.log(`👥 Users Collection: ${usersSnapshot.size} document(s)\n`)

    if (usersSnapshot.empty) {
      console.log('❌ No users found in Firestore!')
    } else {
      usersSnapshot.forEach(doc => {
        const data = doc.data()
        console.log(`User ID: ${doc.id}`)
        console.log(`  Display Name: ${data.displayName}`)
        console.log(`  Email: ${data.email}`)
        console.log(`  Is Admin: ${data.isAdmin === true ? '✅ YES' : '❌ NO'}`)
        console.log(`  Created At: ${data.createdAt}`)
        console.log('')
      })
    }

    console.log('=====================================')
    console.log('✅ Verification Complete\n')

  } catch (error) {
    console.error('\n❌ Error during verification:', error)
  }

  process.exit(0)
}

verifyAdmin()
