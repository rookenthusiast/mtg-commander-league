/**
 * Script to set a user as admin by user ID
 */

const admin = require('firebase-admin')

// User ID to set as admin
const USER_ID = 'QcwQTq1PMWSc5gMyAVWI59Wxhl32'

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
  console.log('\n🔧 Setting Admin User by ID...')
  console.log('=====================================\n')

  try {
    console.log(`Looking for user with ID: ${USER_ID}...`)
    const userDoc = await db.collection('users').doc(USER_ID).get()

    if (!userDoc.exists) {
      console.log(`\n❌ No user found with ID: ${USER_ID}`)
      process.exit(1)
    }

    const userData = userDoc.data()

    console.log(`\n✓ Found user:`)
    console.log(`  ID: ${userDoc.id}`)
    console.log(`  Display Name: ${userData.displayName}`)
    console.log(`  Email: ${userData.email}`)
    console.log(`  Current Admin Status: ${userData.isAdmin || false}`)

    // Update user to admin
    console.log('\nUpdating user to admin...')
    await db.collection('users').doc(USER_ID).update({
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
