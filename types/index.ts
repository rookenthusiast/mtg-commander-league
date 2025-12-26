// Type definitions for MTG Commander League

export interface Player {
  id: string
  userId?: string
  displayName: string
  email?: string
  wins: number
  games: number
  points: number
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
  startDate: string
  endDate: string
  isActive: boolean
  description?: string
}

export type MTGColor = 'white' | 'blue' | 'black' | 'red' | 'green' | 'colorless'
