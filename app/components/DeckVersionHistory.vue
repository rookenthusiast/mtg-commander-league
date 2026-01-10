<template>
  <UCard variant="soft" class="version-history-card">
    <template #header>
      <h3 class="text-lg font-bold text-white">Version History</h3>
    </template>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading versions...</p>
    </div>

    <!-- Versions List -->
    <div v-else-if="versions.length > 0" class="versions-list">
      <div
        v-for="version in versions"
        :key="version.id"
        class="version-card"
        :class="{ active: version.isActive }"
      >
        <div class="version-header">
          <div class="version-info">
            <span class="version-number">v{{ version.versionNumber }}</span>
            <span v-if="version.isActive" class="badge active-badge">
              Current
            </span>
            <span v-if="version.gamesCount && version.gamesCount > 0" class="badge games-badge">
              {{ version.gamesCount }} {{ version.gamesCount === 1 ? 'game' : 'games' }}
            </span>
          </div>
          <span class="version-date">{{ formatDate(version.lockedAt) }}</span>
        </div>

        <div class="version-body">
          <div class="price-section">
            <div class="price">€{{ version.totalPrice.toFixed(2) }}</div>
            <div
              v-if="getPriceChange(version)"
              :class="['price-change', getPriceChangeClass(version)]"
            >
              {{ getPriceChange(version) }}
            </div>
          </div>

          <div class="meta">
            <span class="card-count">{{ version.cardCount }} cards</span>
            <span v-if="version.notes" class="notes">
              💬 {{ version.notes }}
            </span>
          </div>
        </div>

        <UButton
          size="sm"
          variant="outline"
          block
          @click="viewDetails(version.id)"
        >
          View Details
        </UButton>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else class="empty-state">
      <div class="icon">📊</div>
      <p>No version history yet</p>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { DeckVersion } from '~/types'

const props = defineProps<{
  deckId: string
}>()

const { getDeckVersions } = useDeckVersions()
const router = useRouter()

const versions = ref<DeckVersion[]>([])
const loading = ref(true)

// Load versions
const loadVersions = async () => {
  loading.value = true

  try {
    const fetchedVersions = await getDeckVersions(props.deckId, true)
    versions.value = fetchedVersions
  } catch (error) {
    console.error('Error loading versions:', error)
  } finally {
    loading.value = false
  }
}

// Calculate price change from previous version
const getPriceChange = (version: DeckVersion) => {
  const prevVersion = versions.value.find(
    (v) => v.versionNumber === version.versionNumber - 1
  )

  if (!prevVersion) return ''

  const diff = version.totalPrice - prevVersion.totalPrice
  const sign = diff > 0 ? '+' : ''
  return `${sign}€${diff.toFixed(2)}`
}

// Get CSS class for price change
const getPriceChangeClass = (version: DeckVersion) => {
  const prevVersion = versions.value.find(
    (v) => v.versionNumber === version.versionNumber - 1
  )

  if (!prevVersion) return ''

  const diff = version.totalPrice - prevVersion.totalPrice
  return diff > 0 ? 'increase' : 'decrease'
}

// Format date
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// View version details
const viewDetails = (versionId: string) => {
  router.push(`/decks/${props.deckId}/versions/${versionId}`)
}

onMounted(() => {
  loadVersions()
})
</script>

<style scoped>
.version-history-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

/* Loading */
.loading-state {
  @apply text-center py-8 space-y-4;
}

.spinner {
  @apply w-8 h-8 border-4 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin mx-auto;
}

.loading-state p {
  @apply text-twilight-blue-300;
}

/* Versions List */
.versions-list {
  @apply space-y-3;
}

.version-card {
  @apply p-4 bg-shadowmoor-purple-800/30 rounded-lg border border-twilight-blue-700/30 transition-all;
}

.version-card.active {
  @apply border-lorwyn-gold-500/50 bg-shadowmoor-purple-800/50;
}

.version-header {
  @apply flex items-center justify-between mb-3;
}

.version-info {
  @apply flex items-center gap-2;
}

.version-number {
  @apply text-lg font-bold text-white;
}

.badge {
  @apply px-2 py-0.5 rounded-full text-xs font-semibold;
}

.active-badge {
  @apply bg-lorwyn-gold-500/20 text-lorwyn-gold-400 border border-lorwyn-gold-500/40;
}

.games-badge {
  @apply bg-twilight-blue-500/20 text-twilight-blue-300 border border-twilight-blue-500/40;
}

.version-date {
  @apply text-sm text-twilight-blue-400;
}

.version-body {
  @apply mb-3;
}

.price-section {
  @apply flex items-center gap-3 mb-2;
}

.price {
  @apply text-2xl font-bold text-white;
}

.price-change {
  @apply text-sm font-semibold px-2 py-1 rounded;
}

.price-change.increase {
  @apply bg-red-500/20 text-red-400;
}

.price-change.decrease {
  @apply bg-green-500/20 text-green-400;
}

.meta {
  @apply flex flex-col gap-1 text-sm text-twilight-blue-300;
}

.notes {
  @apply text-xs text-twilight-blue-400;
}

/* Empty State */
.empty-state {
  @apply text-center py-8 space-y-4;
}

.empty-state .icon {
  @apply text-5xl;
}

.empty-state p {
  @apply text-twilight-blue-300;
}
</style>
