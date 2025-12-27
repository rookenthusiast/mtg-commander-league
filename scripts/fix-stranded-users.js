/**
 * Admin Utility Script: Fix Stranded Users
 *
 * This script identifies and fixes users who are authenticated in Firebase Auth
 * but are missing corresponding documents in Firestore (users and/or players collections).
 *
 * This can happen when:
 * - User registration partially fails (auth succeeds but Firestore writes fail)
 * - Database documents are accidentally deleted
 * - Migration issues occur
 *
 * Usage:
 *   export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"
 *   node scripts/fix-stranded-users.js
 *
 * Options:
 *   --dry-run    Preview what would be fixed without making changes
 *   --user-id    Fix only a specific user by UID
 *
 * Examples:
 *   node scripts/fix-stranded-users.js --dry-run
 *   node scripts/fix-stranded-users.js --user-id=abc123xyz
 */

const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
    console.log('✓ Firebase Admin initialized with default credentials')
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin.')
    console.error('Please set GOOGLE_APPLICATION_CREDENTIALS environment variable:')
    console.error('  export GOOGLE_APPLICATION_CREDENTIALS="./scripts/serviceAccountKey.json"')
    console.error('\nOr download the service account key from:')
    console.error('  Firebase Console > Project Settings > Service Accounts > Generate New Private Key')
    process.exit(1)
  }
}

const db = admin.firestore()
const auth = admin.auth()

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const userIdArg = args.find(arg => arg.startsWith('--user-id='))
const targetUserId = userIdArg ? userIdArg.split('=')[1] : null

/**
 * Check if a user document exists in Firestore
 */
async function userDocumentExists(userId) {
  const userDoc = await db.collection('users').doc(userId).get()
  return userDoc.exists
}

/**
 * Check if a player document exists for a user
 */
async function playerDocumentExists(userId) {
  const playersSnapshot = await db.collection('players')
    .where('userId', '==', userId)
    .limit(1)
    .get()
  return !playersSnapshot.empty
}

/**
 * Create missing user document
 */
async function createUserDocument(authUser) {
  const userData = {
    userId: authUser.uid,
    displayName: authUser.displayName || 'Anonymous',
    email: authUser.email || '',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(authUser.metadata.creationTime)),
  }

  if (isDryRun) {
    console.log(`  [DRY RUN] Would create user document:`, userData)
  } else {
    await db.collection('users').doc(authUser.uid).set(userData)
    console.log(`  ✓ Created user document for ${authUser.email}`)
  }
}

/**
 * Create missing player document
 */
async function createPlayerDocument(authUser) {
  const playerData = {
    userId: authUser.uid,
    displayName: authUser.displayName || 'Anonymous',
    email: authUser.email || '',
    createdAt: admin.firestore.Timestamp.fromDate(new Date(authUser.metadata.creationTime)),
    updatedAt: admin.firestore.Timestamp.now(),
  }

  if (isDryRun) {
    console.log(`  [DRY RUN] Would create player document:`, playerData)
  } else {
    await db.collection('players').add(playerData)
    console.log(`  ✓ Created player document for ${authUser.email}`)
  }
}

/**
 * Fix a single stranded user
 */
async function fixStrandedUser(authUser) {
  const userId = authUser.uid
  const email = authUser.email || 'No email'
  const displayName = authUser.displayName || 'No display name'

  console.log(`\n👤 Checking user: ${email} (${displayName})`)
  console.log(`   UID: ${userId}`)

  let isStranded = false
  const missingDocs = []

  // Check if user document exists
  const hasUserDoc = await userDocumentExists(userId)
  if (!hasUserDoc) {
    console.log(`   ⚠️  Missing user document`)
    missingDocs.push('user')
    isStranded = true
  } else {
    console.log(`   ✓ User document exists`)
  }

  // Check if player document exists
  const hasPlayerDoc = await playerDocumentExists(userId)
  if (!hasPlayerDoc) {
    console.log(`   ⚠️  Missing player document`)
    missingDocs.push('player')
    isStranded = true
  } else {
    console.log(`   ✓ Player document exists`)
  }

  // Fix missing documents
  if (isStranded) {
    console.log(`   🔧 Fixing ${missingDocs.join(' and ')} document(s)...`)

    if (missingDocs.includes('user')) {
      await createUserDocument(authUser)
    }

    if (missingDocs.includes('player')) {
      await createPlayerDocument(authUser)
    }

    return true
  } else {
    console.log(`   ✓ No issues found`)
    return false
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🔍 Fix Stranded Users Utility')
  console.log('================================\n')

  if (isDryRun) {
    console.log('🧪 DRY RUN MODE - No changes will be made\n')
  }

  if (targetUserId) {
    console.log(`🎯 Targeting specific user: ${targetUserId}\n`)
  }

  try {
    let usersToCheck = []

    // Get users to check
    if (targetUserId) {
      // Check specific user
      try {
        const authUser = await auth.getUser(targetUserId)
        usersToCheck.push(authUser)
      } catch (error) {
        console.error(`❌ User not found in Firebase Auth: ${targetUserId}`)
        process.exit(1)
      }
    } else {
      // Get all authenticated users
      console.log('📋 Fetching all authenticated users...\n')
      const listUsersResult = await auth.listUsers()
      usersToCheck = listUsersResult.users
      console.log(`Found ${usersToCheck.length} authenticated users\n`)
    }

    // Check and fix each user
    let fixedCount = 0
    let checkedCount = 0

    for (const authUser of usersToCheck) {
      const wasFixed = await fixStrandedUser(authUser)
      if (wasFixed) {
        fixedCount++
      }
      checkedCount++
    }

    // Summary
    console.log('\n================================')
    console.log('📊 Summary:')
    console.log(`   Checked: ${checkedCount} user(s)`)
    console.log(`   Fixed: ${fixedCount} stranded user(s)`)

    if (isDryRun && fixedCount > 0) {
      console.log('\n💡 Run without --dry-run to apply these fixes')
    } else if (fixedCount === 0) {
      console.log('\n✨ All users have complete database records!')
    } else {
      console.log('\n✅ Stranded users have been fixed!')
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run the script
main()
  .then(() => {
    console.log('\n✓ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error)
    process.exit(1)
  })
