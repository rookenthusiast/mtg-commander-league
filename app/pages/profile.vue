<template>
  <div class="profile-page">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="loading-spinner" />
      <p class="loading-text">Loading profile...</p>
    </div>

    <!-- Profile Content -->
    <template v-else-if="playerProfile">
      <!-- Profile Information Card -->
      <UCard variant="soft" class="profile-info-card">
        <template #header>
          <h2 class="section-title">Profile Information</h2>
        </template>

        <div class="profile-content">
          <!-- Email (Read-only) -->
          <div class="form-group">
            <label class="form-label">Email</label>
            <div class="read-only-field">{{ user?.email }}</div>
          </div>

          <!-- Display Name (Editable) -->
          <div class="form-group">
            <label class="form-label">Display Name</label>
            <div v-if="!displayNameForm.isEditing" class="display-name-row">
              <span class="display-name-value">{{ playerProfile.displayName }}</span>
              <UButton variant="outline" size="sm" icon="i-heroicons-pencil" @click="startEditingDisplayName">
                Edit
              </UButton>
            </div>
            <div v-else class="edit-name-row">
              <UInput v-model="displayNameForm.displayName" placeholder="Enter display name" size="lg" class="flex-1" />
              <div class="edit-name-buttons">
                <UButton variant="outline" size="sm" @click="cancelEditingDisplayName"
                  :disabled="displayNameForm.isSaving">
                  Cancel
                </UButton>
                <UButton size="sm" @click="saveDisplayName" :loading="displayNameForm.isSaving" class="save-button">
                  Save
                </UButton>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- My Decks Section -->
      <UCard variant="soft" class="my-decks-card">
        <template #header>
          <div class="decks-header">
            <h2 class="section-title">My Decks ({{ userDecks.length }})</h2>
            <div class="deck-actions">
              <UButton to="/seasons/manage-decks" variant="outline" size="lg" icon="i-heroicons-adjustments-horizontal">
                Manage Season Decks
              </UButton>
              <UButton icon="i-heroicons-plus" size="lg" class="add-deck-button" @click="showAddDeckModal = true">
                Add Deck
              </UButton>
            </div>
          </div>
        </template>

        <!-- Decks Grid -->
        <div v-if="userDecks.length > 0" class="decks-grid">
          <div v-for="deck in userDecks" :key="deck.id" class="deck-card"
            @click="handleDeckClick(deck.id)"
            :class="{ 'active': activeDeckId === deck.id }">
            <!-- Card Art Background -->
            <div class="card-art-wrapper">
              <!-- Loading State -->
              <div v-if="loadingImages[deck.id]" class="card-art-loading">
                <div class="loading-spinner" />
              </div>

              <!-- Card Art -->
              <img v-else-if="commanderImages[deck.id]" :src="commanderImages[deck.id]!" :alt="deck.commander"
                class="card-art" />

              <!-- Fallback Placeholder -->
              <div v-else class="card-art-placeholder">
                🎴
              </div>

              <!-- Dark Overlay Gradient -->
              <div class="card-overlay" />
            </div>

            <!-- Card Content Overlay -->
            <div class="card-overlay-content">
              <!-- Deck Info Stack (hidden when active) -->
              <div v-if="activeDeckId !== deck.id" class="card-info-stack">
                <h3 class="overlay-deck-name">{{ deck.name }}</h3>
                <p class="overlay-commander-name">{{ deck.commander }}</p>

                <!-- Mana Symbols -->
                <div class="overlay-color-identity">
                  <img v-for="color in deck.colors" :key="color" :src="getManaSymbolUrl(color)" :alt="color"
                    :title="color" class="mana-symbol" />
                  <img v-if="deck.colors.length === 0" :src="getManaSymbolUrl('colorless')" alt="Colorless"
                    title="Colorless" class="mana-symbol" />
                </div>

                <!-- Price -->
                <div class="overlay-stat-item">
                  <span class="stat-label-text">Price</span>
                  <span class="stat-value-text">{{ deck.currentPrice ? `€${deck.currentPrice.toFixed(2)}` : 'Calculating...' }}</span>
                </div>

                <!-- Record -->
                <div class="overlay-stat-item">
                  <span class="stat-label-text">Record</span>
                  <span class="stat-value-text">{{ deck.wins }}-{{ deck.games - deck.wins }}</span>
                </div>
              </div>

              <!-- Action Buttons (centered when active) -->
              <div v-if="activeDeckId === deck.id" class="deck-actions-center">
                <div class="action-buttons">
                  <UButton icon="i-heroicons-pencil" size="lg" variant="solid" @click.stop="openEditModal(deck)"
                    class="action-button">
                    Edit
                  </UButton>
                  <UButton v-if="deck.moxfieldUrl" icon="i-heroicons-arrow-top-right-on-square" size="lg"
                    variant="solid" @click.stop="viewDeck(deck)" class="action-button">
                    View List
                  </UButton>
                  <UButton v-if="deck.decklistText" icon="i-heroicons-arrow-path" size="lg" variant="solid"
                    class="action-button" :loading="refreshingPrices[deck.id]" @click.stop="refreshDeckPrice(deck)">
                    Refresh Price
                  </UButton>
                  <UButton icon="i-heroicons-trash" size="lg" color="error" @click.stop="openDeleteModal(deck)"
                    class="action-button">
                    Delete
                  </UButton>
                </div>
              </div>
            </div>

            <!-- Mobile Actions (always visible on mobile) -->
            <div class="deck-actions-mobile">
              <UButton v-if="deck.moxfieldUrl" icon="i-heroicons-arrow-top-right-on-square" size="md"
                variant="solid" @click.stop="viewDeck(deck)" class="mobile-action-btn" />
              <UButton v-if="deck.decklistText" icon="i-heroicons-arrow-path" size="md" variant="solid"
                class="mobile-action-btn" :loading="refreshingPrices[deck.id]" @click.stop="refreshDeckPrice(deck)" />
              <UButton icon="i-heroicons-pencil" size="md" variant="solid" @click.stop="openEditModal(deck)"
                class="mobile-action-btn" />
              <UButton icon="i-heroicons-trash" size="md" color="error" @click.stop="openDeleteModal(deck)"
                class="mobile-action-btn" />
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <div class="empty-icon">🃏</div>
          <h3 class="empty-title">No Decks Yet</h3>
          <p class="empty-description">Start by adding your first Commander deck!</p>
          <UButton size="lg" class="add-deck-button mt-6" @click="showAddDeckModal = true">
            Add Your First Deck
          </UButton>
        </div>
      </UCard>
    </template>

    <!-- Add Deck Modal -->
    <DeckFormModal v-model:is-open="showAddDeckModal" mode="create" :active-season="activeSeason"
      @submit="handleAddDeck" />

    <!-- Edit Deck Modal -->
    <DeckFormModal v-model:is-open="showEditDeckModal" mode="edit" :deck="editingDeck" :active-season="activeSeason"
      @submit="handleEditSubmit" />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal v-model:is-open="showDeleteModal" title="Delete Deck?"
      :message="`Are you sure you want to delete &quot;${deckToDelete?.name}&quot;?`" :is-loading="isDeleting"
      @confirm="confirmDelete" @cancel="showDeleteModal = false" />
  </div>
</template>

<script setup lang="ts">
import type { Deck, Player, Season } from '~/types'

definePageMeta({
  middleware: 'auth'
})

const { user } = useAuth()
const { getDocuments, updateDocument, addDocument, deleteDocument, where } = useFirestore()
const { getAllSeasons, getActiveSeason } = useSeasons()
const { fetchCommanderImage } = useScryfall()
const { updateDeckPrice } = useDeckVersions()
const toast = useToast()

// State
const isLoading = ref(true)
const playerProfile = ref<Player | null>(null)
const userDecks = ref<Deck[]>([])
const allSeasons = ref<Season[]>([])
const activeSeason = ref<Season | null>(null)

// Display name editing
const displayNameForm = reactive({
  displayName: '',
  isEditing: false,
  isSaving: false
})

// Deck modals
const showAddDeckModal = ref(false)
const showEditDeckModal = ref(false)
const showDeleteModal = ref(false)
const editingDeck = ref<Deck | null>(null)
const deckToDelete = ref<Deck | null>(null)
const isDeleting = ref(false)

// Active deck (for showing action buttons)
const activeDeckId = ref<string | null>(null)

// Commander images
const commanderImages = ref<Record<string, string | null>>({})
const loadingImages = ref<Record<string, boolean>>({})

// Price refresh tracking
const refreshingPrices = ref<Record<string, boolean>>({})

// Fetch profile data
const fetchProfileData = async () => {
  if (!user.value) {
    await navigateTo('/auth/login')
    return
  }

  isLoading.value = true
  try {
    // Get player profile
    const players = await getDocuments('players', [
      where('userId', '==', user.value.uid)
    ])

    if (players.length === 0) {
      // No profile found, redirect to setup
      await navigateTo('/setup-profile')
      return
    }

    playerProfile.value = players[0] as Player
    console.log('Profile loaded, playerId:', players[0].id)

    // Get user's decks
    let decks = []
    try {
      decks = await getDocuments('decks', [
        where('ownerId', '==', players[0].id)
      ])
      console.log('Decks fetched for profile:', decks.length, 'decks found')

      // Debug: log first deck if exists
      if (decks.length > 0) {
        console.log('First deck:', decks[0])
      }
    } catch (deckError) {
      console.error('Error fetching decks:', deckError)
      // Continue anyway with empty decks array
      decks = []
    }

    // Sort decks by creation date (newest first)
    const sortedDecks = decks.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toMillis?.() || 0
      const bTime = b.createdAt?.toMillis?.() || 0
      return bTime - aTime
    })

    userDecks.value = sortedDecks
    console.log('Final userDecks count:', userDecks.value.length)

    // Load commander images
    await loadCommanderImages(userDecks.value)
  } catch (error) {
    console.error('Error fetching profile data:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load profile data',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

// Display name editing functions
const startEditingDisplayName = () => {
  displayNameForm.displayName = playerProfile.value?.displayName || ''
  displayNameForm.isEditing = true
}

const cancelEditingDisplayName = () => {
  displayNameForm.displayName = ''
  displayNameForm.isEditing = false
}

const saveDisplayName = async () => {
  const newName = displayNameForm.displayName.trim()

  // Validation
  if (!newName || newName.length < 2) {
    toast.add({
      title: 'Invalid Name',
      description: 'Display name must be at least 2 characters',
      color: 'error'
    })
    return
  }

  if (newName.length > 50) {
    toast.add({
      title: 'Invalid Name',
      description: 'Display name must be less than 50 characters',
      color: 'error'
    })
    return
  }

  displayNameForm.isSaving = true
  try {
    await updateDocument('players', playerProfile.value!.id, {
      displayName: newName
    })

    // Update local state
    if (playerProfile.value) {
      playerProfile.value.displayName = newName
    }

    toast.add({
      title: 'Profile Updated',
      description: 'Your display name has been changed',
      color: 'success'
    })

    displayNameForm.isEditing = false
  } catch (error: any) {
    console.error('Error updating display name:', error)

    if (error.code === 'permission-denied') {
      toast.add({
        title: 'Permission Denied',
        description: 'You do not have permission to update this profile',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to update display name',
        color: 'error'
      })
    }
  } finally {
    displayNameForm.isSaving = false
  }
}

// Deck management functions
const loadCommanderImages = async (decksList: Deck[]) => {
  for (const deck of decksList) {
    if (deck.commander && !commanderImages.value[deck.id]) {
      loadingImages.value[deck.id] = true

      try {
        const imageUrl = await fetchCommanderImage(deck.commander)
        commanderImages.value[deck.id] = imageUrl
      } catch (error) {
        console.error(`Error loading image for ${deck.commander}:`, error)
        commanderImages.value[deck.id] = null
      } finally {
        loadingImages.value[deck.id] = false
      }
    }
  }
}

const getManaSymbolUrl = (color: string): string => {
  const symbolMap: Record<string, string> = {
    white: 'W',
    blue: 'U',
    black: 'B',
    red: 'R',
    green: 'G',
    colorless: 'C'
  }
  const symbol = symbolMap[color.toLowerCase()] || 'C'
  return `https://svgs.scryfall.io/card-symbols/${symbol}.svg`
}

const handleDeckClick = (deckId: string) => {
  // Only allow toggle on desktop (window width >= 768px)
  if (typeof window !== 'undefined' && window.innerWidth >= 768) {
    toggleDeckActions(deckId)
  }
}

const toggleDeckActions = (deckId: string) => {
  if (activeDeckId.value === deckId) {
    activeDeckId.value = null
  } else {
    activeDeckId.value = deckId
  }
}

const viewDeck = (deck: Deck) => {
  if (!deck.moxfieldUrl || deck.moxfieldUrl.trim() === '') {
    toast.add({
      title: 'No Decklist URL',
      description: `${deck.name} doesn't have a decklist URL. Click the edit button to add one.`,
      color: 'warning'
    })
    return
  }

  // Validate URL format
  try {
    new URL(deck.moxfieldUrl)
    window.open(deck.moxfieldUrl, '_blank', 'noopener,noreferrer')
  } catch {
    toast.add({
      title: 'Invalid URL',
      description: `The decklist URL for ${deck.name} is invalid. Click the edit button to fix it.`,
      color: 'error'
    })
  }
}

const openEditModal = (deck: Deck) => {
  editingDeck.value = deck
  showEditDeckModal.value = true
}

const openDeleteModal = (deck: Deck) => {
  deckToDelete.value = deck
  showDeleteModal.value = true
}

const handleAddDeck = async (deckData: Partial<Deck>) => {
  if (!user.value || !playerProfile.value || !activeSeason.value) {
    toast.add({
      title: 'Error',
      description: 'Missing required data',
      color: 'error'
    })
    return
  }

  try {
    const deckId = await addDocument('decks', {
      seasonId: activeSeason.value.id,
      ...deckData,
      ownerId: playerProfile.value.id,
      owner: playerProfile.value.displayName,
      wins: 0,
      games: 0
    })

    // If decklist text is provided, fetch prices from Scryfall
    if (deckData.decklistText && deckId) {
      toast.add({
        title: 'Fetching Prices...',
        description: 'Getting card prices from Scryfall. This may take a minute.',
        color: 'info'
      })

      try {
        await updateDeckPrice({
          deckId: deckId,
          decklistText: deckData.decklistText,
          deckName: deckData.name,
          seasonId: activeSeason.value.id,
          forceUpdate: true
        })

        toast.add({
          title: 'Prices Fetched!',
          description: 'Deck prices have been calculated successfully',
          color: 'success'
        })
      } catch (priceError) {
        console.error('Error fetching prices:', priceError)
        toast.add({
          title: 'Price Fetch Failed',
          description: 'Deck was added but prices could not be fetched. You can try updating prices later.',
          color: 'warning'
        })
      }
    }

    toast.add({
      title: 'Deck Added Successfully!',
      description: `${deckData.name} has been added to your collection`,
      color: 'success'
    })

    showAddDeckModal.value = false
    await fetchProfileData()
  } catch (error) {
    console.error('Error adding deck:', error)
    toast.add({
      title: 'Error Adding Deck',
      description: 'An error occurred. Please try again.',
      color: 'error'
    })
  }
}

const handleEditSubmit = async (deckData: Partial<Deck>) => {
  if (!editingDeck.value) return

  try {
    await updateDocument('decks', editingDeck.value.id, deckData)

    // If decklist text was changed, fetch updated prices
    if (deckData.decklistText && deckData.decklistText !== editingDeck.value.decklistText) {
      toast.add({
        title: 'Fetching Prices...',
        description: 'Getting updated card prices from Scryfall. This may take a minute.',
        color: 'info'
      })

      try {
        await updateDeckPrice({
          deckId: editingDeck.value.id,
          decklistText: deckData.decklistText,
          deckName: deckData.name || editingDeck.value.name,
          seasonId: editingDeck.value.seasonId,
          forceUpdate: true
        })
      } catch (priceError) {
        console.error('Error fetching prices:', priceError)
        toast.add({
          title: 'Price Fetch Failed',
          description: 'Deck was updated but prices could not be fetched.',
          color: 'warning'
        })
      }
    }

    toast.add({
      title: 'Deck Updated',
      description: `${deckData.name} has been updated successfully`,
      color: 'success'
    })

    showEditDeckModal.value = false
    await fetchProfileData()
  } catch (error: any) {
    console.error('Error updating deck:', error)

    if (error.code === 'permission-denied') {
      toast.add({
        title: 'Permission Denied',
        description: 'You do not have permission to edit this deck',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to update deck',
        color: 'error'
      })
    }
  }
}

const confirmDelete = async () => {
  if (!deckToDelete.value) return

  isDeleting.value = true
  try {
    await deleteDocument('decks', deckToDelete.value.id)

    toast.add({
      title: 'Deck Deleted',
      description: 'Your deck has been removed',
      color: 'success'
    })

    showDeleteModal.value = false
    deckToDelete.value = null
    await fetchProfileData()
  } catch (error: any) {
    console.error('Error deleting deck:', error)

    if (error.code === 'permission-denied') {
      toast.add({
        title: 'Permission Denied',
        description: 'You do not have permission to delete this deck',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Error',
        description: 'Failed to delete deck',
        color: 'error'
      })
    }
  } finally {
    isDeleting.value = false
  }
}

const refreshDeckPrice = async (deck: Deck) => {
  if (!deck.decklistText) {
    toast.add({
      title: 'No Decklist',
      description: `${deck.name} doesn't have a decklist. Add a decklist to fetch prices.`,
      color: 'warning'
    })
    return
  }

  refreshingPrices.value[deck.id] = true
  try {
    toast.add({
      title: 'Refreshing Prices',
      description: `Fetching updated prices for ${deck.name}. This may take a minute.`,
      color: 'info'
    })

    const result = await updateDeckPrice({
      deckId: deck.id,
      decklistText: deck.decklistText,
      deckName: deck.name,
      seasonId: deck.seasonId,
      forceUpdate: true
    })

    if (result.updated && result.priceDifference !== null && result.priceDifference !== undefined) {
      const diff = result.priceDifference
      const diffText = diff > 0
        ? `increased by €${Math.abs(diff).toFixed(2)}`
        : diff < 0
          ? `decreased by €${Math.abs(diff).toFixed(2)}`
          : 'remained the same'

      toast.add({
        title: 'Prices Updated',
        description: `${deck.name} price ${diffText}`,
        color: 'success'
      })
    } else {
      toast.add({
        title: 'Prices Refreshed',
        description: `${deck.name} prices have been updated`,
        color: 'success'
      })
    }

    await fetchProfileData()
  } catch (error: any) {
    console.error('Error refreshing prices:', error)
    toast.add({
      title: 'Error Refreshing Prices',
      description: 'Failed to update deck prices. Please try again.',
      color: 'error'
    })
  } finally {
    refreshingPrices.value[deck.id] = false
  }
}

// Handle window resize to clear active deck on mobile
const handleResize = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    activeDeckId.value = null
  }
}

// Load data on mount
onMounted(async () => {
  try {
    // Load seasons first
    const seasons = await getAllSeasons()
    allSeasons.value = seasons

    const active = await getActiveSeason()
    activeSeason.value = active

    // Then load profile data
    await fetchProfileData()

    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    isLoading.value = false
  }
})

// Clean up resize listener
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', handleResize)
  }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

.profile-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-7xl mx-auto;
}

/* Loading */
.loading-container {
  @apply flex flex-col items-center justify-center py-20;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin mb-4;
}

.loading-text {
  @apply text-lg text-twilight-blue-200;
}

/* Profile Info Card */
.profile-info-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.section-title {
  @apply text-2xl md:text-3xl font-black text-white;
}

.profile-content {
  @apply space-y-6 mt-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply text-sm font-semibold text-twilight-blue-200 uppercase tracking-wide;
}

.read-only-field {
  @apply text-lg text-white font-medium;
}

.display-name-row {
  @apply flex items-center gap-4;
}

.display-name-value {
  @apply text-lg text-white font-medium flex-1;
}

.edit-name-row {
  @apply flex flex-col sm:flex-row gap-3;
}

.edit-name-buttons {
  @apply flex gap-2;
}

.save-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold;
}

/* My Decks Card */
.my-decks-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.decks-header {
  @apply flex items-center justify-between flex-wrap gap-4;
}

.deck-actions {
  @apply flex flex-col sm:flex-row gap-3;
}

.add-deck-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}

/* Decks Grid */
.decks-grid {
  @apply grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mt-6;
}

.deck-card {
  @apply relative rounded-xl overflow-hidden transition-all duration-300;
  aspect-ratio: 3 / 4;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  cursor: default; /* No pointer cursor on mobile */
}

@media (min-width: 768px) {
  .deck-card {
    @apply cursor-pointer;
  }

  .deck-card:hover {
    transform: scale(1.05);
    box-shadow:
      0 0 30px rgba(255, 215, 0, 0.4),
      0 0 60px rgba(255, 105, 180, 0.3),
      0 8px 16px rgba(0, 0, 0, 0.5);
  }
}

/* Card Art */
.card-art-wrapper {
  @apply absolute inset-0;
}

.card-art {
  @apply w-full h-full object-cover;
}

.card-art-placeholder {
  @apply w-full h-full flex items-center justify-center text-6xl bg-linear-to-br from-shadowmoor-purple-700 to-twilight-blue-800;
}

.card-art-loading {
  @apply w-full h-full flex items-center justify-center bg-linear-to-br from-shadowmoor-purple-700 to-twilight-blue-800;
}

.card-overlay {
  @apply absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent;
}

.card-overlay-content {
  @apply absolute inset-0 flex flex-col justify-end;
  padding: 0.75rem;
  padding-top: 3rem; /* Extra padding at top for edit/delete buttons */
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

@media (min-width: 768px) {
  .card-overlay-content {
    @apply p-4;
    padding-top: 1rem;
  }
}

/* Card Info */
.card-info-stack {
  @apply flex flex-col gap-2 md:gap-3;
}

.overlay-deck-name {
  @apply text-base md:text-xl font-black text-white leading-tight line-clamp-2;
}

.overlay-commander-name {
  @apply text-xs md:text-base text-twilight-blue-200 font-semibold leading-tight line-clamp-1;
}

.overlay-color-identity {
  @apply flex items-center gap-1.5 md:gap-2 flex-wrap;
}

.mana-symbol {
  @apply w-6 h-6 md:w-8 md:h-8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
}

.overlay-stat-item {
  @apply flex flex-col gap-0.5 md:gap-1;
}

.stat-label-text {
  @apply text-[10px] md:text-xs uppercase tracking-wider text-twilight-blue-300 font-semibold;
}

.stat-value-text {
  @apply text-sm md:text-lg text-white font-black;
}

/* Deck Actions - Mobile Buttons (Stacked Vertically) */
.deck-actions-mobile {
  @apply absolute top-2 right-2 flex flex-col gap-2 z-20;
  /* Only visible on mobile */
  display: flex;
}

.mobile-action-btn {
  @apply shadow-lg;
  min-width: 44px; /* Minimum touch target size */
  min-height: 44px;
}

@media (min-width: 768px) {
  .deck-actions-mobile {
    @apply hidden;
  }
}

/* Deck Actions - Centered (Desktop) */
.deck-actions-center {
  @apply absolute inset-0 flex flex-col items-center justify-center z-30;
  background: rgba(100, 100, 100, 0.5); /* Semi-transparent grey overlay */
  backdrop-filter: blur(4px);
  padding: 2rem 1rem;
  display: none; /* Hidden on mobile */
}

@media (min-width: 768px) {
  .deck-actions-center {
    @apply flex;
  }
}

.action-buttons {
  @apply flex flex-col gap-3 w-full max-w-xs;
}

.action-button {
  @apply w-full bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}

/* Active deck card state */
.deck-card.active {
  @apply cursor-default;
}

@media (min-width: 768px) {
  .deck-card.active {
    transform: scale(1.05);
    box-shadow:
      0 0 30px rgba(255, 215, 0, 0.6),
      0 0 60px rgba(255, 105, 180, 0.4),
      0 8px 16px rgba(0, 0, 0, 0.5);
  }
}

/* Empty State */
.empty-state {
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
