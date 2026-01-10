<template>
  <div class="manage-decks-page">
    <!-- Hero Header -->
    <UCard variant="soft" class="hero-card">
      <div class="flex items-center gap-6">
        <div class="hidden md:block">
          <div class="hero-icon">🎴</div>
        </div>
        <div>
          <h1 class="hero-title">Manage Season Decks</h1>
          <p class="hero-subtitle">Update your registered decks for the active season</p>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <UCard variant="soft" class="loading-card">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">Loading...</p>
        </div>
      </UCard>
    </div>

    <!-- Not Logged In -->
    <UCard v-else-if="!user" variant="soft" class="auth-required-card">
      <div class="auth-required-content">
        <div class="lock-icon">🔒</div>
        <h2 class="auth-required-title">Authentication Required</h2>
        <p class="auth-required-text">Please sign in to manage your decks</p>
        <UButton to="/auth/login" size="lg">Sign In</UButton>
      </div>
    </UCard>

    <!-- No Active Season -->
    <UCard v-else-if="!activeSeason" variant="soft" class="no-season-card">
      <div class="no-season-content">
        <div class="calendar-icon">📅</div>
        <h2 class="no-season-title">No Active Season</h2>
        <p class="no-season-text">There's no active season right now.</p>
        <UButton to="/seasons" variant="outline" size="lg">View All Seasons</UButton>
      </div>
    </UCard>

    <!-- Not Registered -->
    <UCard v-else-if="!isRegistered" variant="soft" class="not-registered-card">
      <div class="not-registered-content">
        <div class="warning-icon">⚠️</div>
        <h2 class="not-registered-title">Not Registered</h2>
        <p class="not-registered-text">You're not registered for {{ activeSeason.name }}.</p>
        <UButton to="/seasons/register" size="lg">Register Now</UButton>
      </div>
    </UCard>

    <!-- Deck Management -->
    <div v-else class="management-section">
      <!-- Current Registration Card -->
      <UCard variant="soft" class="current-registration-card">
        <h2 class="section-title">Current Registration</h2>
        <p class="section-subtitle">{{ activeSeason.name }}</p>

        <div class="current-decks-list">
          <h3 class="list-title">Registered Decks ({{ currentDeckIds.length }}/3)</h3>
          <div v-if="currentDecks.length > 0" class="deck-items">
            <div v-for="deck in currentDecks" :key="deck.id" class="current-deck-item">
              <div class="deck-icon">🎴</div>
              <div class="deck-details">
                <h4 class="deck-name">{{ deck.name }}</h4>
                <p class="deck-commander">{{ deck.commander }}</p>
              </div>
            </div>
          </div>
          <p v-else class="no-decks-text">No decks registered</p>
        </div>
      </UCard>

      <!-- Update Decks Card -->
      <UCard variant="soft" class="update-decks-card">
        <h3 class="card-title">Update Your Decks</h3>
        <p class="card-text">
          Select 1-3 decks to register for this season. You must have at least one deck registered.
        </p>

        <!-- No Decks Available -->
        <div v-if="availableDecks.length === 0" class="no-available-decks">
          <span class="warning-icon">⚠️</span>
          <p class="warning-text">You don't have any decks. Create one first!</p>
          <UButton to="/profile" variant="outline" size="lg" class="mt-4">Go to Profile</UButton>
        </div>

        <!-- Deck Selection -->
        <div v-else>
          <div class="deck-selection-list">
            <div
              v-for="deck in availableDecks"
              :key="deck.id"
              @click="toggleDeck(deck.id)"
              class="selectable-deck-item"
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
                  <span v-if="deck.currentPrice" class="deck-price">€{{ deck.currentPrice.toFixed(2) }}</span>
                  <span v-else class="deck-price text-twilight-blue-400">Price pending...</span>
                  <span class="deck-colors">{{ formatColors(deck.colors) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="deck-count-info">
            <p class="count-text">
              {{ selectedDeckIds.length }} / 3 decks selected
              <span v-if="selectedDeckIds.length === 0" class="text-red-400">(minimum 1 required)</span>
            </p>
          </div>

          <!-- Error/Success Messages -->
          <div v-if="error" class="error-message">
            <span class="error-icon">⚠️</span>
            <p>{{ error }}</p>
          </div>

          <div v-if="success" class="success-message">
            <span class="success-icon">✅</span>
            <p>Decks updated successfully!</p>
          </div>

          <!-- Actions -->
          <div class="action-buttons">
            <UButton
              @click="handleUpdateDecks"
              :loading="saving"
              :disabled="selectedDeckIds.length === 0 || !hasChanges"
              size="lg"
              block
              class="update-button"
            >
              {{ saving ? 'Saving...' : 'Update Decks' }}
            </UButton>
            <UButton to="/seasons" variant="outline" size="lg" block :disabled="saving">
              Back to Seasons
            </UButton>
          </div>
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
  isPlayerRegistered,
  getRegisteredDecks,
  updateRegisteredDecks
} = useSeasons()
const { getDocuments, where } = useFirestore()

const loading = ref(true)
const saving = ref(false)
const activeSeason = ref<Season | null>(null)
const isRegistered = ref(false)
const playerId = ref('')
const currentDeckIds = ref<string[]>([])
const selectedDeckIds = ref<string[]>([])
const availableDecks = ref<Deck[]>([])
const error = ref('')
const success = ref(false)

// Computed
const currentDecks = computed(() => {
  return availableDecks.value.filter(d => currentDeckIds.value.includes(d.id))
})

const hasChanges = computed(() => {
  if (selectedDeckIds.value.length !== currentDeckIds.value.length) return true
  return !selectedDeckIds.value.every(id => currentDeckIds.value.includes(id))
})

// Helpers
const formatColors = (colors: string[]) => {
  if (!colors || colors.length === 0) return 'Colorless'
  return colors.map(c => c.charAt(0).toUpperCase() + c.slice(1)).join(', ')
}

const toggleDeck = (deckId: string) => {
  const index = selectedDeckIds.value.indexOf(deckId)
  if (index > -1) {
    selectedDeckIds.value.splice(index, 1)
  } else {
    if (selectedDeckIds.value.length < 3) {
      selectedDeckIds.value.push(deckId)
    }
  }
}

// Load data
const loadData = async () => {
  loading.value = true
  error.value = ''

  try {
    // Get active season
    const season = await getActiveSeason()
    activeSeason.value = season

    if (!season || !user.value) {
      loading.value = false
      return
    }

    // Get player
    const players = await getDocuments('players', [
      where('userId', '==', user.value.uid)
    ])

    if (players.length === 0) {
      loading.value = false
      return
    }

    playerId.value = players[0].id

    // Check registration
    isRegistered.value = await isPlayerRegistered(playerId.value, season.id)

    if (!isRegistered.value) {
      loading.value = false
      return
    }

    // Get registered decks
    const registeredDeckIds = await getRegisteredDecks(playerId.value, season.id)
    currentDeckIds.value = registeredDeckIds
    selectedDeckIds.value = [...registeredDeckIds]

    // Load all player's decks
    const decks = await getDocuments('decks', [
      where('ownerId', '==', playerId.value)
    ])
    availableDecks.value = decks as Deck[]

  } catch (err: any) {
    console.error('Error loading data:', err)
    error.value = err.message || 'Failed to load data'
  } finally {
    loading.value = false
  }
}

// Handle update
const handleUpdateDecks = async () => {
  if (!activeSeason.value || selectedDeckIds.value.length === 0) return

  saving.value = true
  error.value = ''
  success.value = false

  try {
    await updateRegisteredDecks(playerId.value, activeSeason.value.id, selectedDeckIds.value)

    currentDeckIds.value = [...selectedDeckIds.value]
    success.value = true

    setTimeout(() => {
      success.value = false
    }, 3000)

  } catch (err: any) {
    console.error('Error updating decks:', err)
    error.value = err.message || 'Failed to update decks'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.manage-decks-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-4xl mx-auto;
}

/* Hero */
.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.hero-icon {
  @apply text-6xl;
}

.hero-title {
  @apply text-4xl md:text-5xl font-black text-white mb-2;
}

.hero-subtitle {
  @apply text-lg md:text-xl text-twilight-blue-200 font-medium;
}

/* Loading */
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

/* Auth Required */
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

/* No Season / Not Registered */
.no-season-card,
.not-registered-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.no-season-content,
.not-registered-content {
  @apply text-center py-12 space-y-6;
}

.calendar-icon,
.warning-icon {
  @apply text-6xl;
}

.no-season-title,
.not-registered-title {
  @apply text-3xl font-black text-white;
}

.no-season-text,
.not-registered-text {
  @apply text-twilight-blue-200 text-lg;
}

/* Management Section */
.management-section {
  @apply space-y-6;
}

.current-registration-card,
.update-decks-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl space-y-6;
}

.section-title {
  @apply text-3xl font-black text-white;
}

.section-subtitle {
  @apply text-lg text-twilight-blue-200 mb-4;
}

.current-decks-list {
  @apply space-y-4;
}

.list-title {
  @apply text-xl font-bold text-white;
}

.deck-items {
  @apply space-y-3;
}

.current-deck-item {
  @apply flex items-center gap-4 p-4 bg-shadowmoor-purple-800/30 rounded-lg;
}

.deck-icon {
  @apply text-3xl;
}

.deck-details {
  @apply flex-1;
}

.no-decks-text {
  @apply text-twilight-blue-300 text-center py-4;
}

/* Update Card */
.card-title {
  @apply text-2xl font-black text-white;
}

.card-text {
  @apply text-twilight-blue-200;
}

.no-available-decks {
  @apply text-center py-8 space-y-4;
}

.warning-text {
  @apply text-twilight-blue-300;
}

.deck-selection-list {
  @apply space-y-3;
}

.selectable-deck-item {
  @apply flex items-start gap-4 p-4 bg-shadowmoor-purple-800/30 rounded-lg border-2 border-transparent cursor-pointer transition-all duration-200 hover:bg-shadowmoor-purple-800/50;
}

.selectable-deck-item.deck-selected {
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

.deck-price {
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
.action-buttons {
  @apply space-y-3;
}

.update-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}
</style>
