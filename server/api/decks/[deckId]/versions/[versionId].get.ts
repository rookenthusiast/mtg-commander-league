/**
 * GET /api/decks/[deckId]/versions/[versionId]
 *
 * Get a specific version by ID
 */

import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'
import type { DeckVersion } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const deckId = getRouterParam(event, 'deckId')
    const versionId = getRouterParam(event, 'versionId')

    if (!deckId || !versionId) {
      throw createError({
        statusCode: 400,
        message: 'Deck ID and Version ID are required'
      })
    }

    console.log(`[API] Getting version ${versionId} for deck ${deckId}`)

    // Initialize Firebase Admin if needed
    if (getApps().length === 0) {
      initializeApp()
    }
    const db = getFirestore()

    // Get the version document
    const versionDoc = await db
      .collection('deckVersions')
      .doc(versionId)
      .get()

    if (!versionDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Version not found'
      })
    }

    const versionData = versionDoc.data() as DeckVersion

    // Verify this version belongs to the specified deck
    if (versionData.deckId !== deckId) {
      throw createError({
        statusCode: 400,
        message: 'Version does not belong to the specified deck'
      })
    }

    // Get the deck info
    const deckDoc = await db.collection('decks').doc(deckId).get()

    if (!deckDoc.exists) {
      throw createError({
        statusCode: 404,
        message: 'Deck not found'
      })
    }

    const deckData = deckDoc.data()

    // Count games using this version
    const gamesSnapshot = await db
      .collection('games')
      .where('players', 'array-contains', { deckVersionId: versionId })
      .get()

    return {
      id: versionDoc.id,
      ...versionData,
      deck: {
        name: deckData?.name,
        moxfieldUrl: deckData?.moxfieldUrl,
        format: 'commander' // Assuming commander format
      },
      gamesCount: gamesSnapshot.size
    }
  } catch (error: any) {
    console.error('[API] Error getting version:', error)

    // Pass through createError errors
    if (error.statusCode) {
      throw error
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get version'
    })
  }
})
