<template>
  <div class="seasons-page">
    <!-- Hero Section -->
    <UCard variant="soft" class="hero-card">
      <div class="flex items-center gap-6">
        <div class="hidden md:block">
          <div class="season-icon">📅</div>
        </div>
        <div>
          <h1 class="hero-title">League Seasons</h1>
          <p class="hero-subtitle">Track your progress across multiple seasons of Commander League</p>
        </div>
      </div>
    </UCard>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <UCard variant="soft" class="loading-card">
        <div class="loading-content">
          <div class="spinner"></div>
          <p class="loading-text">Loading seasons...</p>
        </div>
      </UCard>
    </div>

    <!-- Active Season Section -->
    <div v-else-if="activeSeason" class="active-season-section">
      <h2 class="section-title">🏆 Current Season 🏆</h2>

      <UCard variant="soft" class="active-season-card">
        <div class="active-badge">Active Now</div>

        <div class="season-header">
          <h3 class="season-name">{{ activeSeason.name }}</h3>
          <p class="season-description">{{ activeSeason.description }}</p>
        </div>

        <div class="season-meta">
          <div class="meta-item">
            <span class="meta-label">Started</span>
            <span class="meta-value">{{ formatDate(activeSeason.startDate) }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Players</span>
            <span class="meta-value">{{ activeSeasonPlayerCount }}</span>
          </div>
          <div class="meta-item">
            <span class="meta-label">Status</span>
            <span class="status-badge active">Ongoing</span>
          </div>
        </div>

        <!-- Registration Status -->
        <div v-if="user" class="registration-section">
          <div v-if="isRegisteredForActive" class="registered-status">
            <div class="flex items-center gap-3 mb-4">
              <span class="check-icon">✓</span>
              <div>
                <p class="registered-title">You're registered!</p>
                <p class="registered-subtitle">Your stats are being tracked this season</p>
              </div>
            </div>
            <div class="flex flex-col sm:flex-row gap-3">
              <UButton to="/seasons/manage-decks" size="lg" icon="i-heroicons-adjustments-horizontal">
                Manage Decks
              </UButton>
              <UButton to="/leaderboard" variant="outline" size="lg">
                View Leaderboard
              </UButton>
            </div>
          </div>

          <div v-else class="not-registered-status">
            <div class="flex items-center gap-3 mb-4">
              <span class="info-icon">ℹ️</span>
              <div>
                <p class="not-registered-title">Not registered yet</p>
                <p class="not-registered-subtitle">Join the season to start tracking your games</p>
              </div>
            </div>
            <UButton to="/seasons/register" size="lg" class="register-button">
              Register for Season
            </UButton>
          </div>
        </div>

        <div v-else class="auth-prompt">
          <p class="auth-text">Sign in to register for the current season</p>
          <UButton to="/auth/login" variant="outline" size="lg">
            Sign In
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- All Seasons Section -->
    <div v-if="!loading && allSeasons.length > 0" class="all-seasons-section">
      <h2 class="section-title">All Seasons</h2>

      <div class="seasons-grid">
        <UCard
          v-for="season in allSeasons"
          :key="season.id"
          variant="soft"
          :class="['season-card', { 'active-card': season.isActive }]"
        >
          <div v-if="season.isActive" class="small-active-badge">Active</div>
          <div v-else-if="!season.endDate" class="small-active-badge upcoming">Upcoming</div>
          <div v-else class="small-active-badge ended">Ended</div>

          <h3 class="season-card-name">{{ season.name }}</h3>
          <p class="season-card-description">{{ season.description || 'No description' }}</p>

          <div class="season-card-meta">
            <div class="meta-row">
              <span class="meta-icon">📅</span>
              <span class="meta-text">{{ formatDate(season.startDate) }}</span>
            </div>
            <div v-if="season.endDate" class="meta-row">
              <span class="meta-icon">🏁</span>
              <span class="meta-text">{{ formatDate(season.endDate) }}</span>
            </div>
            <div v-if="seasonPlayerCounts[season.id]" class="meta-row">
              <span class="meta-icon">👥</span>
              <span class="meta-text">{{ seasonPlayerCounts[season.id] }} players</span>
            </div>
          </div>

          <div class="season-card-actions">
            <UButton
              :to="`/leaderboard?season=${season.id}`"
              variant="outline"
              block
            >
              View Leaderboard
            </UButton>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Empty State -->
    <UCard v-if="!loading && allSeasons.length === 0" variant="soft" class="empty-state-card">
      <div class="empty-content">
        <div class="empty-icon">📅</div>
        <h3 class="empty-title">No Seasons Yet</h3>
        <p class="empty-description">
          Seasons haven't been set up yet. Check back soon!
        </p>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Season } from '~/types'

const { user } = useAuth()
const {
  getAllSeasons,
  getActiveSeason,
  isPlayerRegistered,
  getRegisteredPlayers
} = useSeasons()
const { getDocuments, where } = useFirestore()

const loading = ref(true)
const allSeasons = ref<Season[]>([])
const activeSeason = ref<Season | null>(null)
const isRegisteredForActive = ref(false)
const activeSeasonPlayerCount = ref(0)
const seasonPlayerCounts = ref<Record<string, number>>({})

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Load all data
const loadData = async () => {
  loading.value = true
  try {
    // Get all seasons
    const seasons = await getAllSeasons()
    allSeasons.value = seasons

    // Get active season
    const active = await getActiveSeason()
    activeSeason.value = active

    // Check registration status for active season
    if (active && user.value) {
      // Get player document to find playerId
      const players = await getDocuments('players', [
        where('userId', '==', user.value.uid)
      ])

      if (players.length > 0) {
        const playerId = players[0].id
        isRegisteredForActive.value = await isPlayerRegistered(playerId, active.id)
      }
    }

    // Get player counts for all seasons
    for (const season of seasons) {
      const registeredPlayers = await getRegisteredPlayers(season.id)
      seasonPlayerCounts.value[season.id] = registeredPlayers.length

      if (season.isActive) {
        activeSeasonPlayerCount.value = registeredPlayers.length
      }
    }
  } catch (error) {
    console.error('Error loading seasons:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE ================= */

.seasons-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-7xl mx-auto;
}

/* ================= HERO CARD ================= */

.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.season-icon {
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

/* ================= SECTION TITLE ================= */

.section-title {
  @apply text-3xl md:text-4xl font-black text-center mb-8 bg-linear-to-r from-lorwyn-gold-400 via-shadowmoor-magenta-400 to-shadowmoor-purple-500 bg-clip-text text-transparent;
}

/* ================= ACTIVE SEASON ================= */

.active-season-section {
  @apply space-y-6;
}

.active-season-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl relative overflow-hidden;
}

.active-badge {
  @apply absolute -top-1 -right-12 bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 text-white font-black px-16 py-2 rotate-45 text-sm shadow-lg;
}

.season-header {
  @apply mb-6;
}

.season-name {
  @apply text-3xl md:text-4xl font-black bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent mb-2;
}

.season-description {
  @apply text-twilight-blue-200 text-lg;
}

.season-meta {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4 mb-6;
}

.meta-item {
  @apply flex flex-col space-y-1;
}

.meta-label {
  @apply text-sm font-semibold text-twilight-blue-300 uppercase tracking-wider;
}

.meta-value {
  @apply text-2xl font-black text-white;
}

.status-badge {
  @apply inline-block px-4 py-1 rounded-full font-bold text-sm;
}

.status-badge.active {
  @apply bg-green-500/20 text-green-400 border border-green-500/30;
}

/* ================= REGISTRATION SECTION ================= */

.registration-section {
  @apply mt-6 pt-6 border-t border-twilight-blue-700/50;
}

.registered-status {
  @apply bg-green-900/30 border border-green-500/30 rounded-lg p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4;
}

.check-icon {
  @apply text-4xl text-green-400;
}

.registered-title {
  @apply text-xl font-bold text-green-400;
}

.registered-subtitle {
  @apply text-twilight-blue-200;
}

.not-registered-status {
  @apply bg-shadowmoor-magenta-900/30 border border-shadowmoor-magenta-500/30 rounded-lg p-6;
}

.info-icon {
  @apply text-4xl;
}

.not-registered-title {
  @apply text-xl font-bold text-white;
}

.not-registered-subtitle {
  @apply text-twilight-blue-200;
}

.register-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}

.auth-prompt {
  @apply text-center space-y-4 mt-6 pt-6 border-t border-twilight-blue-700/50;
}

.auth-text {
  @apply text-twilight-blue-200;
}

/* ================= ALL SEASONS GRID ================= */

.all-seasons-section {
  @apply space-y-6;
}

.seasons-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.season-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 relative;
}

.season-card.active-card {
  @apply ring-2 ring-lorwyn-gold-500/50;
}

.small-active-badge {
  @apply absolute top-4 right-4 px-3 py-1 rounded-full font-bold text-xs shadow-lg;
}

.small-active-badge {
  @apply bg-green-500/20 text-green-400 border border-green-500/30;
}

.small-active-badge.upcoming {
  @apply bg-blue-500/20 text-blue-400 border border-blue-500/30;
}

.small-active-badge.ended {
  @apply bg-gray-500/20 text-gray-400 border border-gray-500/30;
}

.season-card-name {
  @apply text-2xl font-black text-white mb-2;
}

.season-card-description {
  @apply text-twilight-blue-200 mb-4 min-h-12;
}

.season-card-meta {
  @apply space-y-2 mb-6;
}

.meta-row {
  @apply flex items-center gap-2 text-twilight-blue-200;
}

.meta-icon {
  @apply text-lg;
}

.meta-text {
  @apply text-sm;
}

.season-card-actions {
  @apply mt-auto;
}

/* ================= EMPTY STATE ================= */

.empty-state-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/50 to-twilight-blue-900/50 backdrop-blur-sm;
}

.empty-content {
  @apply text-center py-12 space-y-4;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.empty-title {
  @apply text-2xl font-black text-white;
}

.empty-description {
  @apply text-twilight-blue-300 max-w-md mx-auto;
}
</style>
