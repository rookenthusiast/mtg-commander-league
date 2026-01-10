/**
 * GET /api/decks/[deckId]/versions
 *
 * Get all versions for a specific deck
 * Query params:
 *   - includeAll: boolean - include inactive versions (default: false)
 */

import { getDeckVersions } from '../../../utils/deckVersioning'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps } from 'firebase-admin/app'

export default defineEventHandler(async (event) => {
  try {
    const deckId = getRouterParam(event, 'deckId')

    if (!deckId) {
      throw createError({
        statusCode: 400,
        message: 'Deck ID is required'
      })
    }

    const query = getQuery(event)
    const includeAll = query.includeAll === 'true'

    console.log(`[API] Getting versions for deck ${deckId}, includeAll: ${includeAll}`)

    // Get versions from Firestore
    const versions = await getDeckVersions(deckId, includeAll)

    // Initialize Firebase Admin if needed (for game count queries)
    if (getApps().length === 0) {
      initializeApp()
    }
    const db = getFirestore()

    // Enrich versions with game counts
    const enrichedVersions = await Promise.all(
      versions.map(async (version) => {
        // Count games that use this version
        // Note: This is a simplified check - in production you might want to
        // structure the game data differently for better querying
        try {
          const gamesSnapshot = await db
            .collection('games')
            .where('players', 'array-contains', { deckVersionId: version.id })
            .get()

          return {
            ...version,
            gamesCount: gamesSnapshot.size
          }
        } catch (error) {
          // If query fails, return version without game count
          console.warn(`[API] Could not get game count for version ${version.id}:`, error)
          return {
            ...version,
            gamesCount: 0
          }
        }
      })
    )

    return {
      versions: enrichedVersions,
      count: enrichedVersions.length
    }
  } catch (error: any) {
    console.error('[API] Error getting deck versions:', error)

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to get deck versions'
    })
  }
})
