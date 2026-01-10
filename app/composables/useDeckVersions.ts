/**
 * Deck Versioning Composable
 *
 * Provides methods to interact with deck versioning API
 */

import type { DeckVersion } from '~/types'

interface UpdateDeckOptions {
  decklistText: string
  deckId?: string
  deckName?: string
  forceUpdate?: boolean
  notes?: string
  seasonId?: string
}

interface UpdateDeckResponse {
  updated: boolean
  version?: DeckVersion
  deckId: string
  priceDifference?: number | null
  message: string
  currentVersion?: DeckVersion
}

interface GetVersionsResponse {
  versions: DeckVersion[]
  count: number
}

interface GetVersionResponse extends DeckVersion {
  deck: {
    name: string
    decklistText: string
    format: string
  }
  gamesCount: number
}

export const useDeckVersions = () => {
  /**
   * Update deck price from decklist text
   * Creates a new version if the decklist has been modified
   */
  const updateDeckPrice = async (
    options: UpdateDeckOptions
  ): Promise<UpdateDeckResponse> => {
    try {
      const { data, error } = await useFetch('/api/decks/update', {
        method: 'POST',
        body: options
      })

      if (error.value) {
        throw new Error(error.value.message || 'Failed to update deck')
      }

      return data.value as UpdateDeckResponse
    } catch (error: any) {
      console.error('[useDeckVersions] Error updating deck:', error)
      throw error
    }
  }

  /**
   * Get all versions for a deck
   */
  const getDeckVersions = async (
    deckId: string,
    includeAll: boolean = false
  ): Promise<DeckVersion[]> => {
    try {
      const { data, error } = await useFetch(
        `/api/decks/${deckId}/versions`,
        {
          query: { includeAll }
        }
      )

      if (error.value) {
        throw new Error(error.value.message || 'Failed to get versions')
      }

      const response = data.value as GetVersionsResponse
      return response.versions
    } catch (error: any) {
      console.error('[useDeckVersions] Error getting versions:', error)
      throw error
    }
  }

  /**
   * Get a specific version by ID
   */
  const getVersion = async (
    deckId: string,
    versionId: string
  ): Promise<GetVersionResponse> => {
    try {
      const { data, error } = await useFetch(
        `/api/decks/${deckId}/versions/${versionId}`
      )

      if (error.value) {
        throw new Error(error.value.message || 'Failed to get version')
      }

      return data.value as GetVersionResponse
    } catch (error: any) {
      console.error('[useDeckVersions] Error getting version:', error)
      throw error
    }
  }

  /**
   * Get the active version for a deck
   */
  const getActiveVersion = async (deckId: string): Promise<DeckVersion | null> => {
    try {
      const versions = await getDeckVersions(deckId, false)
      return versions.find((v) => v.isActive) || null
    } catch (error: any) {
      console.error('[useDeckVersions] Error getting active version:', error)
      return null
    }
  }

  /**
   * Check if a deck needs updating based on decklist text
   */
  const checkForUpdates = async (
    decklistText: string,
    deckId?: string
  ): Promise<{ needsUpdate: boolean; message: string }> => {
    try {
      const result = await updateDeckPrice({
        decklistText,
        deckId,
        forceUpdate: false
      })

      return {
        needsUpdate: result.updated,
        message: result.message
      }
    } catch (error: any) {
      console.error('[useDeckVersions] Error checking for updates:', error)
      throw error
    }
  }

  return {
    updateDeckPrice,
    getDeckVersions,
    getVersion,
    getActiveVersion,
    checkForUpdates
  }
}
