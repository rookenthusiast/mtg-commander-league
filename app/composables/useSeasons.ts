import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  type DocumentData
} from 'firebase/firestore'
import type { Season, PlayerSeason } from '~/types'

export const useSeasons = () => {
  const { $db } = useNuxtApp()
  const { getDocuments, addDocument } = useFirestore()

  /**
   * Get the currently active season
   * @returns Active Season or null
   */
  const getActiveSeason = async (): Promise<Season | null> => {
    try {
      console.log('[useSeasons] Fetching active season...')
      const seasons = await getDocuments('seasons', [
        where('isActive', '==', true),
        firestoreLimit(1)
      ])
      console.log('[useSeasons] Active season query result:', seasons)

      if (seasons.length > 0) {
        return seasons[0] as Season
      }
      return null
    } catch (error) {
      console.error('[useSeasons] Error getting active season:', error)
      throw error
    }
  }

  /**
   * Get all seasons, ordered by start date (newest first)
   * @returns Array of seasons
   */
  const getAllSeasons = async (): Promise<Season[]> => {
    try {
      console.log('[useSeasons] Fetching all seasons...')
      const seasons = await getDocuments('seasons', [
        orderBy('startDate', 'desc')
      ])
      console.log('[useSeasons] All seasons query result:', seasons)
      return seasons as Season[]
    } catch (error) {
      console.error('[useSeasons] Error getting all seasons:', error)
      throw error
    }
  }

  /**
   * Get a specific season by ID
   * @param seasonId - The season ID
   * @returns Season or null
   */
  const getSeason = async (seasonId: string): Promise<Season | null> => {
    try {
      const docRef = doc($db, 'seasons', seasonId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Season
      }
      return null
    } catch (error) {
      console.error('Error getting season:', error)
      throw error
    }
  }

  /**
   * Get player stats for a specific season
   * @param playerId - The player ID
   * @param seasonId - The season ID
   * @returns PlayerSeason or null
   */
  const getPlayerSeason = async (
    playerId: string,
    seasonId: string
  ): Promise<PlayerSeason | null> => {
    try {
      const playerSeasons = await getDocuments('playerSeasons', [
        where('playerId', '==', playerId),
        where('seasonId', '==', seasonId),
        firestoreLimit(1)
      ])

      if (playerSeasons.length > 0) {
        return playerSeasons[0] as PlayerSeason
      }
      return null
    } catch (error) {
      console.error('Error getting player season:', error)
      throw error
    }
  }

  /**
   * Get all player stats for a specific season (leaderboard)
   * @param seasonId - The season ID
   * @param sortBy - Sort field (default: 'points')
   * @param limitCount - Max results to return (default: no limit)
   * @returns Array of PlayerSeasons
   */
  const getSeasonLeaderboard = async (
    seasonId: string,
    sortBy: 'points' | 'wins' | 'gamesPlayed' = 'points',
    limitCount?: number
  ): Promise<PlayerSeason[]> => {
    try {
      // Fetch all playerSeasons for the season
      // Note: We sort client-side to avoid requiring a Firestore index
      const playerSeasons = await getDocuments('playerSeasons', [
        where('seasonId', '==', seasonId)
      ]) as PlayerSeason[]

      // Sort client-side
      const sorted = playerSeasons.sort((a, b) => {
        const aValue = a[sortBy] || 0
        const bValue = b[sortBy] || 0
        return bValue - aValue // Descending order
      })

      // Apply limit if specified
      if (limitCount) {
        return sorted.slice(0, limitCount)
      }

      return sorted
    } catch (error) {
      console.error('Error getting season leaderboard:', error)
      throw error
    }
  }

  /**
   * Check if a player is registered for a specific season
   * @param playerId - The player ID
   * @param seasonId - The season ID
   * @returns true if registered, false otherwise
   */
  const isPlayerRegistered = async (
    playerId: string,
    seasonId: string
  ): Promise<boolean> => {
    try {
      const playerSeason = await getPlayerSeason(playerId, seasonId)
      return playerSeason !== null
    } catch (error) {
      console.error('Error checking player registration:', error)
      throw error
    }
  }

  /**
   * Register a player for the current active season with decks
   * @param playerId - The player ID
   * @param displayName - The player's display name
   * @param deckIds - Array of deck IDs to register (min 1, max 3)
   * @returns The created PlayerSeason document ID
   */
  const registerPlayerForSeason = async (
    playerId: string,
    displayName: string,
    deckIds: string[]
  ): Promise<string> => {
    try {
      // Validate deck count
      if (deckIds.length < 1 || deckIds.length > 3) {
        throw new Error('Must register between 1 and 3 decks')
      }

      // Get active season
      const activeSeason = await getActiveSeason()
      if (!activeSeason) {
        throw new Error('No active season found')
      }

      // Check if already registered
      const alreadyRegistered = await isPlayerRegistered(playerId, activeSeason.id)
      if (alreadyRegistered) {
        throw new Error('Player already registered for this season')
      }

      // Create playerSeason document
      const playerSeasonData: Omit<PlayerSeason, 'id'> = {
        playerId,
        seasonId: activeSeason.id,
        displayName,
        registeredDeckIds: deckIds,
        points: 0,
        wins: 0,
        losses: 0,
        gamesPlayed: 0,
        registeredAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const docId = await addDocument('playerSeasons', playerSeasonData)
      return docId
    } catch (error) {
      console.error('Error registering player for season:', error)
      throw error
    }
  }

  /**
   * Deregister a player from a season (admin only)
   * Removes the playerSeason document
   * @param playerId - The player ID
   * @param seasonId - The season ID
   */
  const deregisterPlayer = async (
    playerId: string,
    seasonId: string
  ): Promise<void> => {
    try {
      // Find the playerSeason document
      const playerSeasons = await getDocuments('playerSeasons', [
        where('playerId', '==', playerId),
        where('seasonId', '==', seasonId),
        firestoreLimit(1)
      ])

      if (playerSeasons.length === 0) {
        throw new Error('Player is not registered for this season')
      }

      const playerSeasonId = playerSeasons[0].id

      // Delete the playerSeason document
      const docRef = doc($db, 'playerSeasons', playerSeasonId)
      await deleteDoc(docRef)

      console.log(`[useSeasons] Deregistered player ${playerId} from season ${seasonId}`)
    } catch (error) {
      console.error('Error deregistering player:', error)
      throw error
    }
  }

  /**
   * Get all players registered for a specific season
   * @param seasonId - The season ID
   * @returns Array of PlayerSeasons
   */
  const getRegisteredPlayers = async (seasonId: string): Promise<PlayerSeason[]> => {
    try {
      const playerSeasons = await getDocuments('playerSeasons', [
        where('seasonId', '==', seasonId)
        // Note: orderBy removed to avoid requiring a Firestore index
        // Players will be returned in document creation order
      ])
      return playerSeasons as PlayerSeason[]
    } catch (error) {
      console.error('Error getting registered players:', error)
      throw error
    }
  }

  /**
   * Update player stats after a game
   * @param playerId - The player ID
   * @param seasonId - The season ID
   * @param updates - Stats to update (e.g., { wins: 1, points: 5 })
   */
  const updatePlayerStats = async (
    playerId: string,
    seasonId: string,
    updates: Partial<Pick<PlayerSeason, 'wins' | 'losses' | 'points' | 'gamesPlayed'>>
  ): Promise<void> => {
    try {
      // Find the playerSeason document
      const playerSeasons = await getDocuments('playerSeasons', [
        where('playerId', '==', playerId),
        where('seasonId', '==', seasonId),
        firestoreLimit(1)
      ])

      if (playerSeasons.length === 0) {
        throw new Error('Player not registered for this season')
      }

      const playerSeasonId = playerSeasons[0].id
      const { updateDocument } = useFirestore()

      await updateDocument('playerSeasons', playerSeasonId, updates)
    } catch (error) {
      console.error('Error updating player stats:', error)
      throw error
    }
  }

  /**
   * Get registered decks for a player's season
   * @param playerId - The player ID
   * @param seasonId - The season ID
   * @returns Array of deck IDs
   */
  const getRegisteredDecks = async (
    playerId: string,
    seasonId: string
  ): Promise<string[]> => {
    try {
      const playerSeason = await getPlayerSeason(playerId, seasonId)
      return playerSeason?.registeredDeckIds || []
    } catch (error) {
      console.error('Error getting registered decks:', error)
      throw error
    }
  }

  /**
   * Update registered decks for a player's season
   * @param playerId - The player ID
   * @param seasonId - The season ID
   * @param deckIds - New array of deck IDs (min 1, max 3)
   */
  const updateRegisteredDecks = async (
    playerId: string,
    seasonId: string,
    deckIds: string[]
  ): Promise<void> => {
    try {
      // Validate deck count
      if (deckIds.length < 1 || deckIds.length > 3) {
        throw new Error('Must have between 1 and 3 decks registered')
      }

      // Find the playerSeason document
      const playerSeasons = await getDocuments('playerSeasons', [
        where('playerId', '==', playerId),
        where('seasonId', '==', seasonId),
        firestoreLimit(1)
      ])

      if (playerSeasons.length === 0) {
        throw new Error('Player not registered for this season')
      }

      const playerSeasonId = playerSeasons[0]!.id
      const { updateDocument } = useFirestore()

      await updateDocument('playerSeasons', playerSeasonId, {
        registeredDeckIds: deckIds
      })
    } catch (error) {
      console.error('Error updating registered decks:', error)
      throw error
    }
  }

  return {
    getActiveSeason,
    getAllSeasons,
    getSeason,
    getPlayerSeason,
    getSeasonLeaderboard,
    isPlayerRegistered,
    registerPlayerForSeason,
    deregisterPlayer,
    getRegisteredPlayers,
    updatePlayerStats,
    getRegisteredDecks,
    updateRegisteredDecks
  }
}
