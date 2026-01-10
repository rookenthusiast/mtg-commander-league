<template>
  <div class="deck-updater">
    <UCard variant="soft" class="updater-card">
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-white">Deck Price</h3>
          <UButton
            v-if="activeVersion"
            icon="i-heroicons-clock"
            size="sm"
            variant="ghost"
            @click="showHistory = !showHistory"
          >
            {{ showHistory ? 'Hide' : 'Show' }} History
          </UButton>
        </div>
      </template>

      <!-- Current Price Display -->
      <div v-if="activeVersion" class="current-price-section">
        <div class="price-display">
          <div class="price-amount">
            €{{ activeVersion.totalPrice.toFixed(2) }}
          </div>
          <div class="price-meta">
            <span class="card-count">{{ activeVersion.cardCount }} cards</span>
            <span class="separator">•</span>
            <span class="version-number">v{{ activeVersion.versionNumber }}</span>
          </div>
        </div>

        <div class="last-updated">
          <span class="label">Last updated:</span>
          <span class="date">{{ formatDate(activeVersion.lockedAt) }}</span>
        </div>

        <div v-if="activeVersion.notes" class="version-notes">
          <span class="notes-icon">💬</span>
          <span class="notes-text">{{ activeVersion.notes }}</span>
        </div>
      </div>

      <!-- No Version Yet -->
      <div v-else class="no-version">
        <div class="icon">📊</div>
        <p>No price data yet. Check for updates to fetch from Scryfall.</p>
      </div>

      <!-- Check for Updates Button -->
      <div class="update-actions">
        <UButton
          :loading="checking"
          :disabled="checking || updating"
          block
          icon="i-heroicons-arrow-path"
          @click="checkForUpdates"
        >
          {{ checking ? 'Checking...' : 'Check for Updates' }}
        </UButton>
      </div>

      <!-- Update Available Banner -->
      <div v-if="updateAvailable" class="update-banner">
        <div class="banner-content">
          <span class="icon">⚠️</span>
          <div class="message">
            <strong>Update Available</strong>
            <p>Decklist has been modified</p>
          </div>
        </div>
        <UButton
          color="primary"
          size="sm"
          @click="showUpdateModal = true"
        >
          Update Now
        </UButton>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <span class="icon">⚠️</span>
        <p>{{ error }}</p>
      </div>
    </UCard>

    <!-- Version History (collapsible) -->
    <div v-if="showHistory" class="history-section">
      <DeckVersionHistory :deck-id="deckId" />
    </div>

    <!-- Update Confirmation Modal -->
    <UModal v-model="showUpdateModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Update Deck Version</h3>
        </template>

        <div class="modal-content">
          <p class="mb-4">
            Create a new version with current Scryfall prices?
          </p>

          <UFormGroup label="Notes (optional)" class="mb-4">
            <UTextarea
              v-model="updateNotes"
              placeholder="e.g., Updated for tournament"
              :rows="3"
            />
          </UFormGroup>
        </div>

        <template #footer>
          <div class="flex justify-end gap-2">
            <UButton
              variant="ghost"
              @click="showUpdateModal = false"
            >
              Cancel
            </UButton>
            <UButton
              color="primary"
              :loading="updating"
              @click="confirmUpdate"
            >
              Update
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { DeckVersion } from '~/types'

const props = defineProps<{
  deckId: string
  decklistText: string
  deckName: string
}>()

const emit = defineEmits<{
  updated: [version: DeckVersion]
}>()

const { updateDeckPrice, getActiveVersion } = useDeckVersions()
const toast = useToast()

const activeVersion = ref<DeckVersion | null>(null)
const checking = ref(false)
const updating = ref(false)
const updateAvailable = ref(false)
const showUpdateModal = ref(false)
const showHistory = ref(false)
const updateNotes = ref('')
const error = ref('')

// Load active version on mount
const loadActiveVersion = async () => {
  try {
    error.value = ''
    const version = await getActiveVersion(props.deckId)
    activeVersion.value = version
  } catch (err: any) {
    console.error('Error loading active version:', err)
    error.value = 'Failed to load deck version'
  }
}

// Check for updates
const checkForUpdates = async () => {
  checking.value = true
  error.value = ''
  updateAvailable.value = false

  try {
    const result = await updateDeckPrice({
      decklistText: props.decklistText,
      deckId: props.deckId,
      deckName: props.deckName,
      forceUpdate: false
    })

    if (result.updated) {
      // New version was created automatically
      await loadActiveVersion()

      toast.add({
        title: 'Deck Updated',
        description: result.message,
        color: 'success'
      })

      emit('updated', result.version!)
    } else {
      // No updates needed
      toast.add({
        title: 'No Updates',
        description: result.message,
        color: 'info'
      })
    }
  } catch (err: any) {
    console.error('Error checking for updates:', err)
    error.value = err.message || 'Failed to check for updates'

    toast.add({
      title: 'Error',
      description: error.value,
      color: 'error'
    })
  } finally {
    checking.value = false
  }
}

// Confirm manual update
const confirmUpdate = async () => {
  updating.value = true
  error.value = ''

  try {
    const result = await updateDeckPrice({
      decklistText: props.decklistText,
      deckId: props.deckId,
      deckName: props.deckName,
      forceUpdate: true,
      notes: updateNotes.value || undefined
    })

    await loadActiveVersion()

    toast.add({
      title: 'Deck Updated',
      description: result.message,
      color: 'success'
    })

    showUpdateModal.value = false
    updateAvailable.value = false
    updateNotes.value = ''

    emit('updated', result.version!)
  } catch (err: any) {
    console.error('Error updating deck:', err)
    error.value = err.message || 'Failed to update deck'

    toast.add({
      title: 'Error',
      description: error.value,
      color: 'error'
    })
  } finally {
    updating.value = false
  }
}

// Format date helper
const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadActiveVersion()
})
</script>

<style scoped>
.deck-updater {
  @apply space-y-4;
}

.updater-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

/* Current Price Section */
.current-price-section {
  @apply space-y-4;
}

.price-display {
  @apply text-center py-6;
}

.price-amount {
  @apply text-5xl font-black text-white mb-2;
  background: linear-gradient(135deg, #FFD700 0%, #D946EF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.price-meta {
  @apply flex items-center justify-center gap-2 text-twilight-blue-300 text-sm;
}

.separator {
  @apply text-twilight-blue-500;
}

.last-updated {
  @apply flex items-center justify-between text-sm text-twilight-blue-300 px-4 py-2 bg-shadowmoor-purple-800/30 rounded-lg;
}

.label {
  @apply font-semibold;
}

.version-notes {
  @apply flex items-start gap-2 text-sm text-twilight-blue-200 px-4 py-2 bg-twilight-blue-900/30 rounded-lg border border-twilight-blue-700/30;
}

.notes-icon {
  @apply text-lg;
}

/* No Version State */
.no-version {
  @apply text-center py-8 space-y-4;
}

.no-version .icon {
  @apply text-5xl;
}

.no-version p {
  @apply text-twilight-blue-300;
}

/* Update Actions */
.update-actions {
  @apply mt-6;
}

/* Update Banner */
.update-banner {
  @apply flex items-center justify-between gap-4 p-4 mt-4 bg-lorwyn-gold-500/10 border border-lorwyn-gold-500/30 rounded-lg;
}

.banner-content {
  @apply flex items-start gap-3;
}

.banner-content .icon {
  @apply text-2xl;
}

.banner-content .message strong {
  @apply text-lorwyn-gold-400 font-bold;
  display: block;
}

.banner-content .message p {
  @apply text-twilight-blue-300 text-sm mt-1;
}

/* Error Message */
.error-message {
  @apply flex items-start gap-3 p-4 mt-4 bg-red-900/20 border border-red-500/30 rounded-lg;
}

.error-message .icon {
  @apply text-2xl;
}

.error-message p {
  @apply text-red-400 text-sm;
}

/* Modal */
.modal-content {
  @apply py-4;
}
</style>
