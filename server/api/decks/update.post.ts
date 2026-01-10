/**
 * POST /api/decks/update
 *
 * Parse decklist text, fetch prices from Scryfall, and create a new version
 */

import {
  parseDecklist,
  validateDecklist,
  extractDeckName,
  getCommanderName
} from '../../utils/decklistParser'
import { calculateDeckPriceFromList } from '../../utils/scryfall'
import {
  createDeckVersion,
  cleanupOldVersions,
  getActiveVersion
} from '../../utils/deckVersioning'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { decklistText, deckId, deckName, forceUpdate, notes, seasonId } = body

    if (!decklistText || typeof decklistText !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'Decklist text is required'
      })
    }

    // TODO: Add authentication check
    // const userId = event.context.user?.id
    // if (!userId) {
    //   throw createError({
    //     statusCode: 401,
    //     message: 'Authentication required'
    //   })
    // }

    // For now, use a placeholder user ID
    // In production, this should come from your auth middleware
    const userId = 'system' // Replace with actual user ID from auth

    // Parse the decklist
    console.log('[API] Parsing decklist...')
    const parsed = parseDecklist(decklistText)

    // Validate the parsed decklist
    const validation = validateDecklist(parsed)
    if (!validation.valid) {
      throw createError({
        statusCode: 400,
        message: validation.error || 'Invalid decklist format'
      })
    }

    console.log(`[API] Parsed ${parsed.cards.length} unique cards (${parsed.totalCards} total)`)

    // Extract deck name if not provided
    const finalDeckName = deckName || extractDeckName(decklistText)
    const commanderName = getCommanderName(parsed) || 'Unknown Commander'

    // Prepare card entries for price fetching
    const cardEntries = parsed.cards.map(card => ({
      name: card.name,
      quantity: card.quantity,
      isFoil: card.isFoil || false
    }))

    // Fetch prices from Scryfall
    console.log(`[API] Fetching prices from Scryfall for ${cardEntries.length} cards...`)
    const priceData = await calculateDeckPriceFromList(
      finalDeckName,
      decklistText,
      cardEntries
    )

    // If no deckId provided, this is creating a new deck
    // The frontend should handle deck creation separately
    if (!deckId) {
      throw createError({
        statusCode: 400,
        message: 'deckId is required. Create the deck first, then update prices.'
      })
    }

    // Get current active version
    const currentVersion = await getActiveVersion(deckId)

    // Check if update is needed (unless forced)
    if (!forceUpdate && currentVersion) {
      // Compare decklist text (simple hash would be better in production)
      if (currentVersion.decklistText === decklistText) {
        return {
          updated: false,
          message: 'Decklist has not changed',
          currentVersion,
          deckId
        }
      }
    }

    // Create new version
    console.log(`[API] Creating new version for deck ${deckId}`)
    const newVersion = await createDeckVersion({
      deckId,
      decklistData: priceData,
      userId,
      notes
    })

    // Cleanup old versions (keep last 5 + versions used in games)
    // Run as non-blocking to avoid failing the entire update if index is missing
    try {
      await cleanupOldVersions(deckId, 5)
    } catch (cleanupError: any) {
      console.warn(`[API] Cleanup failed (non-critical):`, cleanupError.message)
      // Continue anyway - cleanup is nice-to-have but not critical
    }

    // Calculate price difference
    const priceDifference = currentVersion
      ? newVersion.totalPrice - currentVersion.totalPrice
      : null

    return {
      updated: true,
      version: newVersion,
      deckId,
      priceDifference,
      message: priceDifference
        ? `Price ${priceDifference > 0 ? 'increased' : 'decreased'} by €${Math.abs(priceDifference).toFixed(2)}`
        : 'New version created'
    }
  } catch (error: any) {
    console.error('[API] Error updating deck:', error)

    // Return specific error messages
    if (error.message?.includes('Decklist text is required')) {
      throw createError({
        statusCode: 400,
        message: 'Decklist text is required'
      })
    }

    if (error.message?.includes('Invalid decklist')) {
      throw createError({
        statusCode: 400,
        message: error.message
      })
    }

    if (error.message?.includes('Rate limit')) {
      throw createError({
        statusCode: 429,
        message: 'Rate limit exceeded. Please try again later.'
      })
    }

    throw createError({
      statusCode: 500,
      message: error.message || 'Failed to update deck'
    })
  }
})
