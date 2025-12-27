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
          <UButton to="/leaderboard" size="lg">
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
            :disabled="success"
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
import type { Season } from '~/types'

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

// Format date helper
const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
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

    // Check if current user is already registered
    if (user.value) {
      const players = await getDocuments('players', [
        where('userId', '==', user.value.uid)
      ])

      if (players.length > 0) {
        const playerId = players[0].id
        alreadyRegistered.value = await isPlayerRegistered(playerId, active.id)
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

    // Register for season
    await registerPlayerForSeason(playerId, displayName)

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
