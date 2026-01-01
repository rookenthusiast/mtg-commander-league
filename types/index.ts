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
  name: string
  commander: string
  colors: string[]
  budget: number
  ownerId: string
  owner: string
  wins: number
  games: number
  description?: string
  decklistUrl?: string
  createdAt: string
  updatedAt?: string
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
