/**
 * Scryfall API Integration Utilities
 *
 * This module provides functions to interact with the Scryfall API
 * to fetch card data and calculate prices in EUR.
 */

import type { CardPrice } from '~/types'

interface ScryfallCard {
  name: string
  set: string
  set_name: string
  prices: {
    usd?: string | null
    usd_foil?: string | null
    eur?: string | null
    eur_foil?: string | null
    tix?: string | null
  }
  image_uris?: {
    small: string
    normal: string
    large: string
  }
}

interface ScryfallError {
  object: 'error'
  code: string
  status: number
  details: string
}

export interface DeckPriceData {
  deckName: string
  totalPrice: number
  currency: string
  cardCount: number
  cards: CardPrice[]
  decklistText: string
}

/**
 * Delay helper for rate limiting
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Fetch a single card from Scryfall by name
 * Returns the CHEAPEST paper printing with a valid price
 */
export async function fetchCardByName(
  cardName: string,
  preferFoil: boolean = false
): Promise<ScryfallCard | null> {
  try {
    const encodedName = encodeURIComponent(cardName.trim())
    // Use search API with game:paper filter to exclude digital-only printings
    const url = `https://api.scryfall.com/cards/search?q=!"${encodedName}"+game:paper&unique=prints`

    console.log(`[Scryfall] Fetching card: ${cardName}`)

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`[Scryfall] Card not found: ${cardName}`)
        return null
      }

      const errorData = await response.json() as ScryfallError
      console.error(`[Scryfall] Error fetching ${cardName}:`, errorData.details)
      return null
    }

    const data = await response.json()

    if (!data.data || data.data.length === 0) {
      console.warn(`[Scryfall] No results found for: ${cardName}`)
      return null
    }

    // Find the cheapest printing with a valid price
    let cheapestCard: ScryfallCard | null = null
    let cheapestPrice = Infinity
    let cheapestPriceSource = ''

    for (const cardData of data.data) {
      const card = cardData as ScryfallCard
      const prices = card.prices

      // Calculate effective price (prefer EUR, fallback to USD)
      let effectivePrice: number | null = null
      let priceSource = ''

      if (preferFoil) {
        if (prices.eur_foil) {
          effectivePrice = parseFloat(prices.eur_foil)
          priceSource = 'EUR_foil'
        } else if (prices.usd_foil) {
          effectivePrice = parseFloat(prices.usd_foil)
          priceSource = 'USD_foil'
        } else if (prices.eur) {
          effectivePrice = parseFloat(prices.eur)
          priceSource = 'EUR'
        } else if (prices.usd) {
          effectivePrice = parseFloat(prices.usd)
          priceSource = 'USD'
        }
      } else {
        if (prices.eur) {
          effectivePrice = parseFloat(prices.eur)
          priceSource = 'EUR'
        } else if (prices.usd) {
          effectivePrice = parseFloat(prices.usd)
          priceSource = 'USD'
        } else if (prices.eur_foil) {
          effectivePrice = parseFloat(prices.eur_foil)
          priceSource = 'EUR_foil'
        } else if (prices.usd_foil) {
          effectivePrice = parseFloat(prices.usd_foil)
          priceSource = 'USD_foil'
        }
      }

      // Skip cards without any price or with invalid price
      if (effectivePrice === null || effectivePrice === 0 || isNaN(effectivePrice)) continue

      // Update cheapest if this is cheaper
      if (effectivePrice < cheapestPrice) {
        cheapestPrice = effectivePrice
        cheapestCard = card
        cheapestPriceSource = priceSource
      }
    }

    if (cheapestCard) {
      console.log(`[Scryfall] Found ${cardName} in set ${cheapestCard.set} (${cheapestCard.set_name}) at €${cheapestPrice.toFixed(2)} [${cheapestPriceSource}]`)
      return cheapestCard
    }

    // If no card has a price, return the first one
    const fallbackCard = data.data[0] as ScryfallCard
    console.warn(`[Scryfall] No priced version found for ${cardName} (checked ${data.data.length} printings), using ${fallbackCard.set_name}`)
    return fallbackCard
  } catch (error: any) {
    console.error(`[Scryfall] Error fetching card ${cardName}:`, error.message)
    return null
  }
}

/**
 * Get EUR price for a card
 * Falls back to USD price converted to EUR if EUR price not available
 */
export function getCardPrice(
  card: ScryfallCard | null,
  quantity: number,
  preferFoil: boolean = false
): CardPrice {
  const name = card?.name || 'Unknown Card'

  if (!card) {
    return {
      name,
      quantity,
      price: 0,
      total: 0,
      set: 'unknown',
      isFoil: preferFoil
    }
  }

  const prices = card.prices
  let price = 0
  let usedUsdFallback = false
  let usedFoilFallback = false

  // Try to get price in order of preference
  // Priority: EUR non-foil > USD non-foil > EUR foil > USD foil
  if (prices.eur) {
    price = parseFloat(prices.eur)
  } else if (prices.usd) {
    price = parseFloat(prices.usd)
    usedUsdFallback = true
  } else if (prices.eur_foil) {
    price = parseFloat(prices.eur_foil)
    usedFoilFallback = true
  } else if (prices.usd_foil) {
    price = parseFloat(prices.usd_foil)
    usedUsdFallback = true
    usedFoilFallback = true
  }

  // Override if user specifically wants foil
  if (preferFoil) {
    if (prices.eur_foil) {
      price = parseFloat(prices.eur_foil)
      usedFoilFallback = false
      usedUsdFallback = false
    } else if (prices.usd_foil) {
      price = parseFloat(prices.usd_foil)
      usedUsdFallback = true
      usedFoilFallback = false
    }
  }

  // Round to 2 decimal places
  price = Math.round(price * 100) / 100
  const total = Math.round(price * quantity * 100) / 100

  if (price === 0) {
    // Debug: Show what prices were available
    console.warn(`[Scryfall] No price available for ${name} (EUR: ${prices.eur}, USD: ${prices.usd}, EUR_foil: ${prices.eur_foil}, USD_foil: ${prices.usd_foil})`)
  } else if (usedFoilFallback && usedUsdFallback) {
    console.log(`[Scryfall] Using USD foil→EUR fallback for ${name}: €${price.toFixed(2)}`)
  } else if (usedFoilFallback) {
    console.log(`[Scryfall] Using EUR foil price for ${name}: €${price.toFixed(2)}`)
  } else if (usedUsdFallback) {
    console.log(`[Scryfall] Using USD→EUR fallback for ${name}: €${price.toFixed(2)}`)
  }

  return {
    name: card.name,
    quantity,
    price,
    total,
    set: card.set,
    isFoil: preferFoil
  }
}

/**
 * Fetch multiple cards in batch with rate limiting
 * Scryfall recommends 50-100ms delay between requests
 */
export async function fetchCardsBatch(
  cardEntries: Array<{ name: string; quantity: number; isFoil?: boolean }>
): Promise<CardPrice[]> {
  const cardPrices: CardPrice[] = []
  const RATE_LIMIT_DELAY = 100 // 100ms between requests

  console.log(`[Scryfall] Fetching ${cardEntries.length} cards...`)

  for (let i = 0; i < cardEntries.length; i++) {
    const entry = cardEntries[i]
    if (!entry) continue

    // Fetch card data
    const card = await fetchCardByName(entry.name, entry.isFoil || false)

    // Calculate price
    const cardPrice = getCardPrice(card, entry.quantity, entry.isFoil || false)
    cardPrices.push(cardPrice)

    // Rate limiting: delay between requests (except for last card)
    if (i < cardEntries.length - 1) {
      await delay(RATE_LIMIT_DELAY)
    }
  }

  console.log(`[Scryfall] Fetched ${cardPrices.length} cards successfully`)

  return cardPrices
}

/**
 * Calculate total deck price from card list
 */
export async function calculateDeckPriceFromList(
  deckName: string,
  decklistText: string,
  cardEntries: Array<{ name: string; quantity: number; isFoil?: boolean }>
): Promise<DeckPriceData> {
  console.log(`[Scryfall] Calculating price for deck: ${deckName}`)

  // Fetch all card prices
  const cards = await fetchCardsBatch(cardEntries)

  // Calculate total price
  const totalPrice = cards.reduce((sum, card) => sum + card.total, 0)
  const cardCount = cardEntries.reduce((sum, entry) => sum + entry.quantity, 0)

  console.log(`[Scryfall] Total price: €${totalPrice.toFixed(2)} (${cardCount} cards)`)

  return {
    deckName,
    totalPrice: Math.round(totalPrice * 100) / 100, // Round to 2 decimals
    currency: 'EUR',
    cardCount,
    cards,
    decklistText
  }
}

/**
 * Alternative: Use Scryfall's collection endpoint for batch requests
 * This is more efficient but requires a different request format
 */
export async function fetchCardsCollection(
  cardIdentifiers: Array<{ name: string }>
): Promise<ScryfallCard[]> {
  try {
    const url = 'https://api.scryfall.com/cards/collection'

    console.log(`[Scryfall] Fetching collection of ${cardIdentifiers.length} cards`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifiers: cardIdentifiers
      })
    })

    if (!response.ok) {
      const errorData = await response.json() as ScryfallError
      console.error('[Scryfall] Collection fetch error:', errorData.details)
      return []
    }

    const data = await response.json()
    return data.data as ScryfallCard[]
  } catch (error: any) {
    console.error('[Scryfall] Error fetching collection:', error.message)
    return []
  }
}
