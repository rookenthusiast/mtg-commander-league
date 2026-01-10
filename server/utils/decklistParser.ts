/**
 * Decklist Parser Utilities
 *
 * This module provides functions to parse text-based decklists from various
 * sources (Moxfield, MTGGoldfish, Archidekt, Arena export, etc.)
 */

export interface ParsedCard {
  name: string
  quantity: number
  isFoil?: boolean
  section?: 'commander' | 'mainboard' | 'sideboard'
}

export interface ParsedDecklist {
  cards: ParsedCard[]
  totalCards: number
  commanders: ParsedCard[]
  mainboard: ParsedCard[]
  sideboard: ParsedCard[]
  deckName?: string
}

/**
 * Parse a decklist from text input
 * Supports multiple formats:
 * - MTG Arena export format
 * - Moxfield/MTGGoldfish export (quantity + card name)
 * - Simple format: "Card Name" or "1 Card Name" or "1x Card Name"
 */
export function parseDecklist(decklistText: string): ParsedDecklist {
  // Use our own parser which works reliably on server-side
  return parseDecklistSimple(decklistText)
}

/**
 * Simple fallback parser for basic formats
 * Handles:
 * - "1 Card Name"
 * - "1x Card Name"
 * - "Card Name" (assumes quantity 1)
 * - Lines starting with "//" are treated as comments (section headers)
 */
function parseDecklistSimple(decklistText: string): ParsedDecklist {
  const cards: ParsedCard[] = []
  const commanders: ParsedCard[] = []
  const mainboard: ParsedCard[] = []
  let currentSection: 'commander' | 'mainboard' | 'sideboard' = 'mainboard'

  const lines = decklistText.split('\n')

  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) continue

    // Check for section headers (commonly used in exports)
    const lowerLine = trimmed.toLowerCase()
    if (lowerLine.includes('commander') && (lowerLine.startsWith('//') || lowerLine.startsWith('#'))) {
      currentSection = 'commander'
      continue
    }
    if (lowerLine.includes('deck') || lowerLine.includes('main')) {
      currentSection = 'mainboard'
      continue
    }
    if (lowerLine.includes('sideboard')) {
      currentSection = 'sideboard'
      continue
    }

    // Skip other comment lines
    if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
      continue
    }

    // Parse card line
    // Format: "quantity card name" or "quantityx card name" or "card name"
    const match = trimmed.match(/^(\d+)x?\s+(.+)$/)

    let quantity = 1
    let cardName = trimmed

    if (match) {
      quantity = parseInt(match[1], 10)
      cardName = match[2].trim()
    }

    // Skip invalid entries
    if (!cardName || cardName.length < 2) continue

    const parsedCard: ParsedCard = {
      name: cardName,
      quantity,
      section: currentSection
    }

    cards.push(parsedCard)

    if (currentSection === 'commander') {
      commanders.push(parsedCard)
    } else if (currentSection === 'mainboard') {
      mainboard.push(parsedCard)
    }
  }

  const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0)

  console.log(`[Parser] Simple parser extracted ${cards.length} unique cards (${totalCards} total)`)

  return {
    cards,
    totalCards,
    commanders,
    mainboard,
    sideboard: []
  }
}

/**
 * Validate that a decklist has at least one card
 */
export function validateDecklist(parsed: ParsedDecklist): { valid: boolean; error?: string } {
  if (parsed.cards.length === 0) {
    return {
      valid: false,
      error: 'No cards found in decklist. Please check the format.'
    }
  }

  if (parsed.totalCards === 0) {
    return {
      valid: false,
      error: 'No cards found in decklist.'
    }
  }

  return { valid: true }
}

/**
 * Extract deck name from text (looks for common patterns)
 * Falls back to "Imported Deck" if not found
 */
export function extractDeckName(decklistText: string): string {
  const lines = decklistText.split('\n')

  // Look for lines that might be deck names
  // Common patterns: "Deck: Name", "// Name", first non-empty line if short
  for (const line of lines) {
    const trimmed = line.trim()

    if (!trimmed) continue

    // Check for "Deck:" prefix
    const deckMatch = trimmed.match(/^(?:deck|name):\s*(.+)$/i)
    if (deckMatch) {
      return deckMatch[1].trim()
    }

    // Check for comment with deck name
    const commentMatch = trimmed.match(/^\/\/\s*(.+)$/)
    if (commentMatch && commentMatch[1].length < 50 && !commentMatch[1].toLowerCase().includes('commander')) {
      return commentMatch[1].trim()
    }

    // If first line is short and doesn't look like a card, use it
    if (trimmed.length < 50 && !trimmed.match(/^\d+x?\s/)) {
      return trimmed
    }

    // Stop after first few lines to avoid false positives
    if (lines.indexOf(line) > 5) break
  }

  return 'Imported Deck'
}

/**
 * Get commander name from parsed decklist
 * Returns first commander or null
 */
export function getCommanderName(parsed: ParsedDecklist): string | null {
  if (parsed.commanders.length > 0) {
    return parsed.commanders[0].name
  }

  // If no explicit commanders section, assume first card might be commander
  if (parsed.mainboard.length > 0) {
    return parsed.mainboard[0].name
  }

  return null
}

/**
 * Detect color identity from card names (basic implementation)
 * This is a simple heuristic - for accurate colors, would need to query Scryfall
 */
export function detectColors(cardNames: string[]): string[] {
  const colors = new Set<string>()

  // Basic land detection
  cardNames.forEach(name => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('plains') || lowerName.includes('white')) colors.add('white')
    if (lowerName.includes('island') || lowerName.includes('blue')) colors.add('blue')
    if (lowerName.includes('swamp') || lowerName.includes('black')) colors.add('black')
    if (lowerName.includes('mountain') || lowerName.includes('red')) colors.add('red')
    if (lowerName.includes('forest') || lowerName.includes('green')) colors.add('green')
  })

  return Array.from(colors)
}
