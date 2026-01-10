// Type definitions for MTG Commander League

export interface User {
  id: string
  email: string
  displayName: string
  isAdmin: boolean
  createdAt: string
  updatedAt: string
}

export interface Player {
  id: string
  userId?: string
  displayName: string
  email?: string
  createdAt: string
  updatedAt?: string
}

export interface Deck {
  id: string
  seasonId?: string
  name: string
  commander: string
  colors: string[]
  decklistText?: string // Text-based decklist (primary method)
  moxfieldUrl?: string // Optional Moxfield URL (legacy/reference)
  moxfieldId?: string // Extracted ID from URL (legacy)
  ownerId: string
  owner: string
  wins: number
  games: number
  description?: string
  currentVersionId?: string // Points to active DeckVersion
  currentPrice?: number // Cached from current version
  lastPriceUpdate?: string // When price was last fetched
  createdAt: string
  updatedAt?: string
}

export interface DeckVersion {
  id: string
  deckId: string
  versionNumber: number // Sequential: 1, 2, 3...
  isActive: boolean // Only one version should be active at a time

  // Snapshot data (immutable once created)
  deckName: string
  totalPrice: number
  currency: string // "EUR"
  cardCount: number

  // Decklist data
  decklistText?: string // Text-based decklist used for this version
  moxfieldLastModified?: string // Legacy: ISO timestamp from Moxfield

  // Card breakdown (array of card price objects)
  cards: CardPrice[]

  // Metadata
  lockedAt: string // When this version was created
  lockedBy?: string // User ID who triggered update
  notes?: string // Optional notes about this version

  // Track if this version is used in any games
  gamesCount?: number // Computed field

  createdAt: string
}

export interface CardPrice {
  name: string
  quantity: number
  price: number // Individual card price
  total: number // price * quantity
  set?: string // Card set code
  isFoil?: boolean
}

export interface Game {
  id: string
  seasonId: string
  date: string
  players: GamePlayer[]
  winnerId: string
  placements: string[]
  notes?: string
  turnCount?: number
  createdAt: string
  updatedAt?: string
}

export interface GamePlayer {
  playerId: string
  playerName: string
  deckId: string
  deckName: string
  deckVersionId?: string // Reference to DeckVersion used in this game
  deckPriceAtGame?: number // Locked price at game time
  placement?: number
}

export interface LeaderboardEntry {
  id: string
  name: string
  wins: number
  games: number
  points: number
  winRate: number
}

export interface Season {
  id: string
  name: string
  slug: string
  startDate: string
  endDate: string | null
  isActive: boolean
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PlayerSeason {
  id: string
  playerId: string
  seasonId: string
  displayName: string
  registeredDeckIds: string[] // Array of deck IDs registered for this season (min 1, max 3)
  points: number
  wins: number
  losses: number
  gamesPlayed: number
  registeredAt: string
  createdAt: string
  updatedAt: string
}

export type MTGColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless'
