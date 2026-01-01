<template>
  <div class="register-page">
    <!-- Hero Section -->
    <UCard variant="soft" class="hero-card">
      <div class="flex items-center gap-6">
        <div class="hidden md:block">
          <div class="register-icon">🎯</div>
        </div>
        <div>
          <h1 class="hero-title">Season Registration</h1>
          <p class="hero-subtitle">Join the current season and start competing</p>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <UCard variant="soft" class="loading-card">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">Loading season info...</p>
        </div>
      </UCard>
    </div>

    <!-- Not Logged In -->
    <UCard v-else-if="!user" variant="soft" class="auth-required-card">
      <div class="auth-required-content">
        <div class="lock-icon">🔒</div>
        <h2 class="auth-required-title">Authentication Required</h2>
        <p class="auth-required-text">
          You need to sign in to register for a season
        </p>
        <div class="auth-actions">
          <UButton to="/auth/login" size="lg">
            Sign In
          </UButton>
          <UButton to="/auth/register" variant="outline" size="lg">
            Create Account
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- No Active Season -->
    <UCard v-else-if="!activeSeason" variant="soft" class="no-season-card">
      <div class="no-season-content">
        <div class="calendar-icon">📅</div>
        <h2 class="no-season-title">No Active Season</h2>
        <p class="no-season-text">
          There's no active season right now. Check back later!
        </p>
        <UButton to="/seasons" variant="outline" size="lg">
          View All Seasons
        </UButton>
      </div>
    </UCard>

    <!-- Already Registered -->
    <UCard v-else-if="alreadyRegistered" variant="soft" class="already-registered-card">
      <div class="already-registered-content">
        <div class="check-icon">✅</div>
        <h2 class="already-registered-title">Already Registered!</h2>
        <p class="already-registered-text">
          You're already registered for {{ activeSeason.name }}
        </p>
        <div class="registered-actions">
          <UButton to="/seasons/manage-decks" size="lg" icon="i-heroicons-adjustments-horizontal">
            Manage Decks
          </UButton>
          <UButton to="/leaderboard" variant="outline" size="lg">
            View Leaderboard
          </UButton>
          <UButton to="/submit-game" variant="outline" size="lg">
            Submit a Game
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Registration Form -->
    <div v-else class="registration-section">
      <!-- Season Info Card -->
      <UCard variant="soft" class="season-info-card">
        <h2 class="season-info-title">Join {{ activeSeason.name }}</h2>
        <p class="season-info-description">{{ activeSeason.description }}</p>

        <div class="season-details">
          <div class="detail-item">
            <span class="detail-icon">📅</span>
            <div>
              <p class="detail-label">Season Started</p>
              <p class="detail-value">{{ formatDate(activeSeason.startDate) }}</p>
            </div>
          </div>

          <div class="detail-item">
            <span class="detail-icon">👥</span>
            <div>
              <p class="detail-label">Registered Players</p>
              <p class="detail-value">{{ registeredPlayerCount }}</p>
            </div>
          </div>

          <div class="detail-item">
            <span class="detail-icon">🏆</span>
            <div>
              <p class="detail-label">Status</p>
              <p class="detail-value">Active & Accepting Registrations</p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Deck Selection Card -->
      <UCard variant="soft" class="deck-selection-card">
        <h3 class="deck-selection-title">Select Your Decks</h3>
        <p class="deck-selection-text">
          Choose 1-3 decks to register for this season. You can switch decks later from your profile.
        </p>

        <!-- No Decks Warning -->
        <div v-if="availableDecks.length === 0" class="no-decks-warning">
          <span class="warning-icon">⚠️</span>
          <p class="warning-text">You don't have any decks yet. Create at least one deck to register.</p>
          <UButton to="/decks" variant="outline" size="lg" class="mt-4">
            Create a Deck
          </UButton>
        </div>

        <!-- Deck Selection -->
        <div v-else class="deck-list">
          <div
            v-for="deck in availableDecks"
            :key="deck.id"
            @click="toggleDeck(deck.id)"
            class="deck-item"
            :class="{ 'deck-selected': selectedDeckIds.includes(deck.id) }"
          >
            <div class="deck-checkbox">
              <input
                type="checkbox"
                :checked="selectedDeckIds.includes(deck.id)"
                :disabled="!selectedDeckIds.includes(deck.id) && selectedDeckIds.length >= 3"
                class="checkbox-input"
              />
            </div>
            <div class="deck-info">
              <h4 class="deck-name">{{ deck.name }}</h4>
              <p class="deck-commander">{{ deck.commander }}</p>
              <div class="deck-meta">
                <span class="deck-budget">${{ deck.budget }}</span>
                <span class="deck-colors">{{ formatColors(deck.colors) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="availableDecks.length > 0" class="deck-count-info">
          <p class="count-text">
            {{ selectedDeckIds.length }} / 3 decks selected
            <span v-if="selectedDeckIds.length === 0" class="text-red-400">(minimum 1 required)</span>
          </p>
        </div>
      </UCard>

      <!-- Confirmation Card -->
      <UCard variant="soft" class="confirmation-card">
        <h3 class="confirmation-title">Confirm Registration</h3>
        <p class="confirmation-text">
          By registering for this season, you'll start with 0 points and your games will be
          tracked separately for this season.
        </p>

        <div class="player-info-preview">
          <div class="preview-avatar">{{ user.displayName?.charAt(0) || 'U' }}</div>
          <div>
            <p class="preview-label">Registering as</p>
            <p class="preview-name">{{ user.displayName || user.email }}</p>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="error-message">
          <span class="error-icon">⚠️</span>
          <p>{{ error }}</p>
        </div>

        <!-- Success Message -->
        <div v-if="success" class="success-message">
          <span class="success-icon">✅</span>
          <p>Registration successful! Redirecting...</p>
        </div>

        <!-- Actions -->
        <div class="confirmation-actions">
          <UButton
            @click="handleRegister"
            :loading="registering"
            :disabled="success || selectedDeckIds.length === 0"
            size="lg"
            block
            class="register-button"
          >
            {{ registering ? 'Registering...' : 'Confirm Registration' }}
          </UButton>
          <UButton to="/seasons" variant="outline" size="lg" block :disabled="registering">
            Cancel
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Season, Deck } from '~/types'

const { user } = useAuth()
const {
  getActiveSeason,
  registerPlayerForSeason,
  isPlayerRegistered,
  getRegisteredPlayers
} = useSeasons()
const { getDocuments, where } = useFirestore()

const loading = ref(true)
const registering = ref(false)
const activeSeason = ref<Season | null>(null)
const alreadyRegistered = ref(false)
const registeredPlayerCount = ref(0)
const error = ref('')
const success = ref(false)
const availableDecks = ref<Deck[]>([])
const selectedDeckIds = ref<string[]>([])

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Format colors helper
const formatColors = (colors: string[]) => {
  if (!colors || colors.length === 0) return 'Colorless'
  return colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
}

// Toggle deck selection
const toggleDeck = (deckId: string) => {
  const index = selectedDeckIds.value.indexOf(deckId)
  if (index > -1) {
    // Remove if already selected
    selectedDeckIds.value.splice(index, 1)
  } else {
    // Add if not at max
    if (selectedDeckIds.value.length < 3) {
      selectedDeckIds.value.push(deckId)
    }
  }
}

// Load season data
const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    // Get active season
    const active = await getActiveSeason()
    activeSeason.value = active

    if (!active) {
      loading.value = false
      return
    }

    // Get registered player count
    const registeredPlayers = await getRegisteredPlayers(active.id)
    registeredPlayerCount.value = registeredPlayers.length

    // Check if current user is already registered and load their decks
    if (user.value) {
      const players = await getDocuments('players', [
        where('userId', '==', user.value.uid)
      ])

      if (players.length > 0) {
        const playerId = players[0].id
        alreadyRegistered.value = await isPlayerRegistered(playerId, active.id)

        // Load user's decks (no longer filtered by season)
        const decks = await getDocuments('decks', [
          where('ownerId', '==', playerId)
        ])
        availableDecks.value = decks as Deck[]
      }
    }
  } catch (err: any) {
    console.error('Error loading season data:', err)
    error.value = err.message || 'Failed to load season information'
  } finally {
    loading.value = false
  }
}

// Handle registration
const handleRegister = async () => {
  if (!user.value || !activeSeason.value) return

  // Validate deck selection
  if (selectedDeckIds.value.length === 0) {
    error.value = 'Please select at least one deck'
    return
  }

  registering.value = true
  error.value = ''

  try {
    // Get player document
    const players = await getDocuments('players', [
      where('userId', '==', user.value.uid)
    ])

    if (players.length === 0) {
      throw new Error('Player profile not found. Please set up your profile first.')
    }

    const player = players[0]
    const playerId = player.id
    const displayName = player.displayName || user.value.displayName || 'Anonymous'

    // Register for season with selected decks
    await registerPlayerForSeason(playerId, displayName, selectedDeckIds.value)

    success.value = true

    // Redirect to leaderboard after 2 seconds
    setTimeout(() => {
      navigateTo('/leaderboard')
    }, 2000)
  } catch (err: any) {
    console.error('Registration error:', err)
    error.value = err.message || 'Failed to register for season'
  } finally {
    registering.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE ================= */

.register-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-4xl mx-auto;
}

/* ================= HERO CARD ================= */

.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.register-icon {
  @apply text-6xl;
}

.hero-title {
  @apply text-4xl md:text-5xl font-black text-white mb-2;
}

.hero-subtitle {
  @apply text-lg md:text-xl text-twilight-blue-200 font-medium;
}

/* ================= LOADING STATE ================= */

.loading-state {
  @apply flex justify-center items-center min-h-64;
}

.loading-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm;
}

.loading-content {
  @apply text-center py-12 space-y-4;
}

.spinner {
  @apply w-12 h-12 border-4 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin mx-auto;
}

.loading-text {
  @apply text-twilight-blue-200 font-medium;
}

/* ================= AUTH REQUIRED ================= */

.auth-required-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.auth-required-content {
  @apply text-center py-12 space-y-6;
}

.lock-icon {
  @apply text-6xl;
}

.auth-required-title {
  @apply text-3xl font-black text-white;
}

.auth-required-text {
  @apply text-twilight-blue-200 text-lg;
}

.auth-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center;
}

/* ================= NO SEASON ================= */

.no-season-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.no-season-content {
  @apply text-center py-12 space-y-6;
}

.calendar-icon {
  @apply text-6xl;
}

.no-season-title {
  @apply text-3xl font-black text-white;
}

.no-season-text {
  @apply text-twilight-blue-200 text-lg;
}

/* ================= ALREADY REGISTERED ================= */

.already-registered-card {
  @apply bg-linear-to-br from-green-900/40 to-shadowmoor-purple-900/80 backdrop-blur-sm shadow-xl border border-green-500/30;
}

.already-registered-content {
  @apply text-center py-12 space-y-6;
}

.check-icon {
  @apply text-6xl;
}

.already-registered-title {
  @apply text-3xl font-black text-green-400;
}

.already-registered-text {
  @apply text-twilight-blue-200 text-lg;
}

.registered-actions {
  @apply flex flex-col sm:flex-row gap-4 justify-center;
}

/* ================= REGISTRATION SECTION ================= */

.registration-section {
  @apply space-y-6;
}

/* Season Info Card */
.season-info-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.season-info-title {
  @apply text-3xl font-black bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent mb-2;
}

.season-info-description {
  @apply text-twilight-blue-200 text-lg mb-6;
}

.season-details {
  @apply space-y-4;
}

.detail-item {
  @apply flex items-center gap-4 p-4 bg-shadowmoor-purple-800/30 rounded-lg;
}

.detail-icon {
  @apply text-3xl;
}

.detail-label {
  @apply text-sm font-semibold text-twilight-blue-300 uppercase tracking-wider;
}

.detail-value {
  @apply text-xl font-bold text-white;
}

/* Deck Selection Card */
.deck-selection-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl space-y-6;
}

.deck-selection-title {
  @apply text-2xl font-black text-white;
}

.deck-selection-text {
  @apply text-twilight-blue-200;
}

.no-decks-warning {
  @apply text-center py-8 space-y-4;
}

.warning-icon {
  @apply text-4xl;
}

.warning-text {
  @apply text-twilight-blue-300;
}

.deck-list {
  @apply space-y-3;
}

.deck-item {
  @apply flex items-start gap-4 p-4 bg-shadowmoor-purple-800/30 rounded-lg border-2 border-transparent cursor-pointer transition-all duration-200 hover:bg-shadowmoor-purple-800/50;
}

.deck-item.deck-selected {
  @apply border-lorwyn-gold-500 bg-shadowmoor-purple-800/50;
}

.deck-checkbox {
  @apply shrink-0 pt-1;
}

.checkbox-input {
  @apply w-5 h-5 rounded border-2 border-twilight-blue-500 bg-shadowmoor-purple-900 cursor-pointer;
}

.checkbox-input:checked {
  @apply bg-lorwyn-gold-500 border-lorwyn-gold-500;
}

.checkbox-input:disabled {
  @apply opacity-50 cursor-not-allowed;
}

.deck-info {
  @apply flex-1;
}

.deck-name {
  @apply text-lg font-bold text-white mb-1;
}

.deck-commander {
  @apply text-sm text-twilight-blue-300 mb-2;
}

.deck-meta {
  @apply flex gap-4 text-sm;
}

.deck-budget {
  @apply text-lorwyn-gold-400 font-semibold;
}

.deck-colors {
  @apply text-shadowmoor-magenta-400;
}

.deck-count-info {
  @apply text-center pt-2;
}

.count-text {
  @apply text-twilight-blue-200 font-semibold;
}

/* Confirmation Card */
.confirmation-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl space-y-6;
}

.confirmation-title {
  @apply text-2xl font-black text-white;
}

.confirmation-text {
  @apply text-twilight-blue-200;
}

.player-info-preview {
  @apply flex items-center gap-4 p-4 bg-shadowmoor-purple-800/30 rounded-lg;
}

.preview-avatar {
  @apply w-16 h-16 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg;
}

.preview-label {
  @apply text-sm text-twilight-blue-300;
}

.preview-name {
  @apply text-xl font-bold text-white;
}

/* Messages */
.error-message {
  @apply flex items-center gap-3 p-4 bg-red-900/30 border border-red-500/30 rounded-lg;
}

.error-icon {
  @apply text-2xl;
}

.error-message p {
  @apply text-red-400;
}

.success-message {
  @apply flex items-center gap-3 p-4 bg-green-900/30 border border-green-500/30 rounded-lg;
}

.success-icon {
  @apply text-2xl;
}

.success-message p {
  @apply text-green-400;
}

/* Actions */
.confirmation-actions {
  @apply space-y-3;
}

.register-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}
</style>
