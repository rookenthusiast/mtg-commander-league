/**
 * Deck Version Management Utilities (Firestore)
 *
 * This module handles deck version creation, management, and cleanup
 * using Firebase Firestore.
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Timestamp, type Firestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { DeckVersion, CardPrice } from '~/types'
import type { DeckPriceData } from './scryfall'

// Initialize Firebase Admin if not already initialized
let adminDb: Firestore | null = null

function getAdminDb(): Firestore {
  if (adminDb) return adminDb

  if (getApps().length === 0) {
    try {
      // Try to load service account from local file
      const serviceAccountPath = join(process.cwd(), 'server', 'serviceAccountKey.json')
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))

      initializeApp({
        credential: cert(serviceAccount)
      })

      console.log('[Firebase Admin] Initialized with service account from file')
    } catch (error: any) {
      console.warn('[Firebase Admin] Could not load service account file, trying default credentials:', error.message)
      // Fallback to default credentials (GOOGLE_APPLICATION_CREDENTIALS env var)
      initializeApp()
    }
  }

  adminDb = getFirestore()
  return adminDb
}

interface CreateVersionOptions {
  deckId: string
  decklistData: DeckPriceData
  userId: string
  notes?: string
}

interface VersionCleanupResult {
  kept: number
  deleted: number
}

/**
 * Create a new deck version snapshot
 */
export async function createDeckVersion(
  options: CreateVersionOptions
): Promise<DeckVersion> {
  const db = getAdminDb()
  const { deckId, decklistData, userId, notes } = options

  try {
    // Get current version count for this deck
    const versionsSnapshot = await db
      .collection('deckVersions')
      .where('deckId', '==', deckId)
      .get()

    const versionNumber = versionsSnapshot.size + 1

    const now = new Date().toISOString()

    // Create new version document
    const versionData = {
      deckId,
      versionNumber,
      isActive: true,
      deckName: decklistData.deckName,
      totalPrice: decklistData.totalPrice,
      currency: decklistData.currency,
      cardCount: decklistData.cardCount,
      decklistText: decklistData.decklistText, // Store the raw decklist
      cards: decklistData.cards,
      lockedAt: now,
      lockedBy: userId,
      notes: notes || null,
      createdAt: now
    }

    // Add the version to Firestore
    const versionRef = await db.collection('deckVersions').add(versionData)

    console.log(`[Version] Created version ${versionNumber} for deck ${deckId}`)

    // Mark all other versions as inactive
    const batch = db.batch()
    versionsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isActive: false })
    })
    await batch.commit()

    // Update deck document with current version info
    await db.collection('decks').doc(deckId).update({
      currentVersionId: versionRef.id,
      currentPrice: decklistData.totalPrice,
      lastPriceUpdate: now,
      decklistText: decklistData.decklistText, // Store the raw decklist in deck doc too
      updatedAt: now
    })

    return {
      id: versionRef.id,
      ...versionData
    } as DeckVersion
  } catch (error: any) {
    console.error('[Version] Error creating version:', error)
    throw new Error(`Failed to create deck version: ${error.message}`)
  }
}

/**
 * Clean up old versions for a deck
 * Keeps: versions attached to games + last N recent versions
 */
export async function cleanupOldVersions(
  deckId: string,
  keepRecentCount: number = 5
): Promise<VersionCleanupResult> {
  const db = getAdminDb()

  try {
    // Get all versions for this deck
    const versionsSnapshot = await db
      .collection('deckVersions')
      .where('deckId', '==', deckId)
      .orderBy('versionNumber', 'desc')
      .get()

    const versions = versionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log(`[Cleanup] Found ${versions.length} versions for deck ${deckId}`)

    if (versions.length <= keepRecentCount) {
      console.log(`[Cleanup] Keeping all versions (${versions.length} <= ${keepRecentCount})`)
      return { kept: versions.length, deleted: 0 }
    }

    // Separate recent versions from older ones
    const recentVersions = versions.slice(0, keepRecentCount)
    const olderVersions = versions.slice(keepRecentCount)

    console.log(`[Cleanup] Recent: ${recentVersions.length}, Older: ${olderVersions.length}`)

    // Check which older versions are used in games
    const versionsToDelete: string[] = []

    for (const version of olderVersions) {
      // Check if this version is used in any games
      const gamesSnapshot = await db
        .collection('games')
        .where('players', 'array-contains-any', [
          { deckVersionId: version.id }
        ])
        .limit(1)
        .get()

      // If not used in games, mark for deletion
      if (gamesSnapshot.empty) {
        versionsToDelete.push(version.id)
      } else {
        console.log(`[Cleanup] Keeping version ${version.versionNumber} (used in ${gamesSnapshot.size} games)`)
      }
    }

    // Delete unused old versions
    if (versionsToDelete.length > 0) {
      const batch = db.batch()
      versionsToDelete.forEach((versionId) => {
        batch.delete(db.collection('deckVersions').doc(versionId))
      })
      await batch.commit()

      console.log(`[Cleanup] Deleted ${versionsToDelete.length} unused old versions`)
    }

    return {
      kept: versions.length - versionsToDelete.length,
      deleted: versionsToDelete.length
    }
  } catch (error: any) {
    console.error('[Cleanup] Error during cleanup:', error)
    throw new Error(`Failed to cleanup versions: ${error.message}`)
  }
}

/**
 * Get or create a deck document from a Moxfield URL
 */
export async function getOrCreateDeck(
  userId: string,
  moxfieldUrl: string,
  moxfieldId: string,
  seasonId?: string
): Promise<string> {
  const db = getAdminDb()

  try {
    // Check if deck already exists by moxfieldId
    const existingDeckSnapshot = await db
      .collection('decks')
      .where('moxfieldId', '==', moxfieldId)
      .limit(1)
      .get()

    if (!existingDeckSnapshot.empty) {
      const deckId = existingDeckSnapshot.docs[0].id
      console.log(`[Deck] Found existing deck: ${deckId}`)
      return deckId
    }

    // Create new deck document
    const now = new Date().toISOString()
    const deckData = {
      moxfieldUrl,
      moxfieldId,
      ownerId: userId,
      owner: 'Loading...', // Will be updated when first version is created
      name: 'Loading...',
      commander: 'Unknown',
      colors: [],
      wins: 0,
      games: 0,
      seasonId: seasonId || null,
      createdAt: now,
      updatedAt: now
    }

    const deckRef = await db.collection('decks').add(deckData)
    console.log(`[Deck] Created new deck: ${deckRef.id}`)

    return deckRef.id
  } catch (error: any) {
    console.error('[Deck] Error getting/creating deck:', error)
    throw new Error(`Failed to get or create deck: ${error.message}`)
  }
}

/**
 * Get active version for a deck
 */
export async function getActiveVersion(deckId: string): Promise<DeckVersion | null> {
  const db = getAdminDb()

  try {
    const versionSnapshot = await db
      .collection('deckVersions')
      .where('deckId', '==', deckId)
      .where('isActive', '==', true)
      .limit(1)
      .get()

    if (versionSnapshot.empty) {
      return null
    }

    const versionDoc = versionSnapshot.docs[0]
    return {
      id: versionDoc.id,
      ...versionDoc.data()
    } as DeckVersion
  } catch (error: any) {
    console.error('[Version] Error getting active version:', error)
    return null
  }
}

/**
 * Get all versions for a deck
 */
export async function getDeckVersions(
  deckId: string,
  includeInactive: boolean = false
): Promise<DeckVersion[]> {
  const db = getAdminDb()

  try {
    let query = db
      .collection('deckVersions')
      .where('deckId', '==', deckId)

    if (!includeInactive) {
      query = query.where('isActive', '==', true)
    }

    const versionsSnapshot = await query.orderBy('versionNumber', 'desc').get()

    return versionsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
    })) as DeckVersion[]
  } catch (error: any) {
    console.error('[Version] Error getting versions:', error)
    return []
  }
}
