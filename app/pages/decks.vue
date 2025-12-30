<template>
  <div class="decks-page">
    <!-- Hero Section -->
    <UCard variant="soft" class="hero-card">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-6">
          <div class="hidden md:block">
            <div class="deck-icon">🃏</div>
          </div>
          <div>
            <h1 class="hero-title">Commander Decks</h1>
            <p class="hero-subtitle">{{ currentSeasonName }}</p>
          </div>
        </div>
        <UButton
          icon="i-heroicons-plus"
          size="lg"
          class="add-deck-button"
          :disabled="!user"
          @click="showAddDeckModal = true"
        >
          {{ user ? 'Add Deck' : 'Sign In to Add Deck' }}
        </UButton>
      </div>
    </UCard>

    <!-- Filters -->
    <UCard variant="soft" class="filters-card">
      <div class="flex flex-wrap gap-4 items-center justify-between">
        <div class="flex flex-wrap gap-4">
          <UInput v-model="searchQuery" placeholder="Search decks..." icon="i-heroicons-magnifying-glass"
            class="min-w-[250px]" />
          <USelect v-model="selectedColor" :options="colorFilters" placeholder="Filter by Color"
            class="min-w-[180px]" />
          <USelect
            v-model="selectedSeasonId"
            :items="seasonOptions"
            value-key="value"
            placeholder="Filter by Season"
            class="min-w-[200px]"
          />
        </div>
        <UButton variant="outline" @click="refreshDecks" icon="i-heroicons-arrow-path">
          Refresh
        </UButton>
      </div>
    </UCard>

    <!-- Decks Grid -->
    <div v-if="filteredDecks.length > 0" class="decks-section">
      <h2 class="section-title">All Decks</h2>

      <div class="decks-grid">
        <div v-for="deck in filteredDecks" :key="deck.id" class="deck-card"
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

              <!-- Budget -->
              <div class="overlay-stat-item">
                <span class="stat-label-text">Budget</span>
                <span class="stat-value-text">${{ deck.budget }}</span>
              </div>

              <!-- Record -->
              <div class="overlay-stat-item">
                <span class="stat-label-text">Record</span>
                <span class="stat-value-text">{{ deck.wins }}-{{ deck.games - deck.wins }}</span>
              </div>

              <!-- Owner -->
              <div class="overlay-stat-item">
                <span class="stat-label-text">Owner</span>
                <span class="stat-value-text">{{ deck.owner }}</span>
              </div>

              <!-- Season Badge -->
              <div v-if="deck.seasonName" class="season-badge-overlay">
                {{ deck.seasonName }}
              </div>
            </div>

            <!-- Action Buttons (centered when active) -->
            <div v-if="activeDeckId === deck.id" class="deck-actions-center">
              <div class="action-buttons">
                <UButton v-if="canEditDeck(deck)" icon="i-heroicons-pencil" size="lg" variant="solid"
                  @click.stop="openEditModal(deck)" class="action-button">
                  Edit
                </UButton>
                <UButton v-if="deck.decklistUrl" icon="i-heroicons-arrow-top-right-on-square" size="lg"
                  variant="solid" @click.stop="viewDeck(deck)" class="action-button">
                  View List
                </UButton>
                <UButton v-if="canEditDeck(deck)" icon="i-heroicons-trash" size="lg" color="error"
                  @click.stop="openDeleteModal(deck)" class="action-button">
                  Delete
                </UButton>
              </div>
            </div>
          </div>

          <!-- Mobile Actions (always visible on mobile) -->
          <div class="deck-actions-mobile">
            <UButton v-if="deck.decklistUrl" icon="i-heroicons-arrow-top-right-on-square" size="md"
              variant="solid" @click.stop="viewDeck(deck)" class="mobile-action-btn" />
            <UButton v-if="canEditDeck(deck)" icon="i-heroicons-pencil" size="md" variant="solid"
              @click.stop="openEditModal(deck)" class="mobile-action-btn" />
            <UButton v-if="canEditDeck(deck)" icon="i-heroicons-trash" size="md" color="error"
              @click.stop="openDeleteModal(deck)" class="mobile-action-btn" />
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <UCard v-else variant="soft" class="empty-state-card">
      <div class="empty-content">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No Decks Found</h3>
        <p class="empty-description">
          {{ user ? 'Add your first commander deck to get started!' : 'Sign in to add and manage your decks.' }}
        </p>
        <UButton
          size="lg"
          class="add-deck-button mt-6"
          :disabled="!user"
          @click="showAddDeckModal = true"
        >
          {{ user ? 'Add Your First Deck' : 'Sign In to Add Deck' }}
        </UButton>
      </div>
    </UCard>

    <!-- Add Deck Modal -->
    <DeckFormModal
      v-model:is-open="showAddDeckModal"
      mode="create"
      :active-season="activeSeason"
      @submit="handleAddDeck"
    />

    <!-- Edit Deck Modal -->
    <DeckFormModal
      v-model:is-open="showEditDeckModal"
      mode="edit"
      :deck="editingDeck"
      :active-season="activeSeason"
      @submit="handleEditSubmit"
    />

    <!-- Delete Confirmation Modal -->
    <DeleteConfirmationModal
      v-model:is-open="showDeleteModal"
      title="Delete Deck?"
      :message="`Are you sure you want to delete &quot;${deckToDelete?.name}&quot;?`"
      :is-loading="isDeleting"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import type { Season, Deck } from '~/types'

const { user } = useAuth()
const { getDocuments, addDocument, updateDocument, deleteDocument, where } = useFirestore()
const { getAllSeasons, getActiveSeason } = useSeasons()
const { fetchCommanderImage } = useScryfall()

const searchQuery = ref('')
const selectedColor = ref('all')
const selectedSeasonId = ref('all')
const showAddDeckModal = ref(false)
const showEditDeckModal = ref(false)
const showDeleteModal = ref(false)
const allSeasons = ref<Season[]>([])
const activeSeason = ref<Season | null>(null)
const currentSeasonName = ref('Loading...')

// Current player tracking
const currentPlayerId = ref<string | null>(null)

// Deck editing/deletion
const editingDeck = ref<Deck | null>(null)
const deckToDelete = ref<Deck | null>(null)
const isDeleting = ref(false)

// Active deck (for showing action buttons)
const activeDeckId = ref<string | null>(null)

// Store commander images (deck.id -> image URL)
const commanderImages = ref<Record<string, string | null>>({})
const loadingImages = ref<Record<string, boolean>>({})

const colorFilters = ['all', 'white', 'blue', 'black', 'red', 'green', 'colorless']

// Computed: Season options for dropdown
const seasonOptions = computed(() => {
  const options = [
    { label: 'All Seasons', value: 'all' },
    ...allSeasons.value.map((season: Season) => ({
      label: season.isActive ? `${season.name} (Active)` : season.name,
      value: season.id
    }))
  ]
  console.log('[Decks] Season options:', options)
  return options
})

const decks = ref<any[]>([])

const filteredDecks = computed(() => {
  let result = decks.value

  if (searchQuery.value) {
    result = result.filter(deck =>
      deck.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      deck.commander.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  if (selectedColor.value !== 'all') {
    result = result.filter(deck =>
      deck.colors.includes(selectedColor.value)
    )
  }

  if (selectedSeasonId.value !== 'all') {
    result = result.filter(deck =>
      deck.seasonId === selectedSeasonId.value
    )
  }

  return result
})

const getColorClass = (color: string) => {
  const colorMap = {
    white: 'bg-gray-100 border border-gray-300',
    blue: 'bg-blue-500',
    black: 'bg-gray-900 border border-gray-600',
    red: 'bg-red-500',
    green: 'bg-green-500',
    colorless: 'bg-gray-400'
  }
  return colorMap[color.toLowerCase()] || 'bg-gray-300'
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

const viewDeck = (deck: any) => {
  if (!deck.decklistUrl || deck.decklistUrl.trim() === '') {
    toast.add({
      title: 'No Decklist URL',
      description: `${deck.name} doesn't have a decklist URL. ${canEditDeck(deck) ? 'Click the edit button to add one.' : 'Contact the deck owner to add one.'}`,
      color: 'warning'
    })
    return
  }

  // Validate URL format
  try {
    new URL(deck.decklistUrl)
    window.open(deck.decklistUrl, '_blank', 'noopener,noreferrer')
  } catch {
    toast.add({
      title: 'Invalid URL',
      description: `The decklist URL for ${deck.name} is invalid. ${canEditDeck(deck) ? 'Click the edit button to fix it.' : 'Contact the deck owner to fix it.'}`,
      color: 'error'
    })
  }
}

const refreshDecks = async () => {
  await fetchDecks()
}

// Ownership check
const canEditDeck = (deck: any): boolean => {
  return !!user.value && deck.ownerId === currentPlayerId.value
}

// Edit/Delete handlers
const openEditModal = (deck: Deck) => {
  editingDeck.value = deck
  showEditDeckModal.value = true
}

const openDeleteModal = (deck: Deck) => {
  deckToDelete.value = deck
  showDeleteModal.value = true
}

const handleEditSubmit = async (deckData: Partial<Deck>) => {
  if (!editingDeck.value) return

  try {
    await updateDocument('decks', editingDeck.value.id, deckData)

    toast.add({
      title: 'Deck Updated',
      description: `${deckData.name} has been updated successfully`,
      color: 'success'
    })

    showEditDeckModal.value = false
    await refreshDecks()
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
    await refreshDecks()
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

const fetchDecks = async () => {
  try {
    const fetchedDecks = await getDocuments('decks')

    // Add season names to decks
    const decksWithSeasonNames = fetchedDecks.map((deck: any) => {
      const season = allSeasons.value.find((s: Season) => s.id === deck.seasonId)
      return {
        ...deck,
        seasonName: season ? season.name : 'Unknown Season'
      }
    })

    decks.value = decksWithSeasonNames

    // Fetch commander images for all decks
    await loadCommanderImages(decksWithSeasonNames)
  } catch (error) {
    console.error('Error fetching decks:', error)
  }
}

// Watch for season selection changes
watch(selectedSeasonId, (newSeasonId) => {
  const season = allSeasons.value.find((s: Season) => s.id === newSeasonId)
  if (season) {
    currentSeasonName.value = season.name
  } else if (newSeasonId === 'all') {
    currentSeasonName.value = 'All Seasons'
  }
})

const loadCommanderImages = async (decksList: any[]) => {
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

const toast = useToast()

const handleAddDeck = async (deckData: Partial<Deck>) => {
  if (!user.value) {
    toast.add({
      title: 'Authentication Required',
      description: 'You must be signed in to add a deck',
      color: 'error'
    })
    return
  }

  if (!activeSeason.value) {
    toast.add({
      title: 'No Active Season',
      description: 'Cannot add deck without an active season',
      color: 'error'
    })
    return
  }

  if (!currentPlayerId.value) {
    toast.add({
      title: 'Profile Not Found',
      description: 'Please set up your player profile first',
      color: 'error'
    })
    return
  }

  try {
    // Add deck to Firestore with seasonId
    await addDocument('decks', {
      seasonId: activeSeason.value.id,
      ...deckData,
      ownerId: currentPlayerId.value,
      owner: user.value.displayName || 'Anonymous',
      wins: 0,
      games: 0
    })

    // Show success message
    toast.add({
      title: 'Deck Added Successfully!',
      description: `${deckData.name} has been added to your collection`,
      color: 'success'
    })

    // Close modal
    showAddDeckModal.value = false

    // Refresh decks list
    await refreshDecks()
  } catch (error) {
    console.error('Error adding deck:', error)
    toast.add({
      title: 'Error Adding Deck',
      description: 'An error occurred. Please try again.',
      color: 'error'
    })
  }
}

// Handle window resize to clear active deck on mobile
const handleResize = () => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    activeDeckId.value = null
  }
}

onMounted(async () => {
  try {
    // Load all seasons
    const seasons = await getAllSeasons()
    allSeasons.value = seasons

    // Get active season
    const active = await getActiveSeason()
    activeSeason.value = active

    if (active) {
      selectedSeasonId.value = active.id
      currentSeasonName.value = active.name
    } else if (seasons.length > 0) {
      selectedSeasonId.value = 'all'
      currentSeasonName.value = 'All Seasons'
    }

    // Get current player ID for ownership checks
    if (user.value) {
      const players = await getDocuments('players', [
        where('userId', '==', user.value.uid)
      ])
      if (players.length > 0) {
        currentPlayerId.value = players[0].id
      }
    }

    // Load decks
    await fetchDecks()

    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize)
    }
  } catch (error) {
    console.error('Error loading data:', error)
    currentSeasonName.value = 'Error loading seasons'
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

/* ================= PAGE ================= */

.decks-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-7xl mx-auto;
}

/* ================= HERO CARD ================= */

.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.deck-icon {
  @apply text-6xl;
}

.hero-title {
  @apply text-4xl md:text-5xl font-black text-white mb-2;
}

.hero-subtitle {
  @apply text-lg md:text-xl text-twilight-blue-200 font-medium;
}

.add-deck-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}

.add-deck-button:disabled {
  @apply opacity-60 cursor-not-allowed;
  background: linear-gradient(to right, rgb(var(--color-gray-400)), rgb(var(--color-gray-500)));
}

/* ================= FILTERS ================= */

.filters-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

/* ================= SECTION TITLE ================= */

.section-title {
  @apply text-3xl md:text-4xl font-black text-center mb-8 bg-linear-to-r from-lorwyn-gold-400 via-shadowmoor-magenta-400 to-shadowmoor-purple-500 bg-clip-text text-transparent;
}

/* ================= DECKS GRID ================= */

.decks-section {
  @apply space-y-6;
}

.decks-grid {
  @apply grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4;
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

@media (min-width: 768px) {
  .deck-card::before {
    content: '';
    @apply absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none;
    background: linear-gradient(45deg,
        transparent 30%,
        rgba(255, 215, 0, 0.1) 50%,
        transparent 70%);
    background-size: 200% 200%;
    animation: shimmer 3s linear infinite;
    z-index: 10;
  }

  .deck-card:hover::before {
    @apply opacity-100;
  }
}

@keyframes shimmer {
  0% {
    background-position: -100% -100%;
  }

  100% {
    background-position: 100% 100%;
  }
}

/* ================= CARD ART ================= */

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

.loading-spinner {
  @apply w-8 h-8 border-4 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin;
}

/* ================= CARD OVERLAY ================= */

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

/* ================= CARD INFO STACK ================= */

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

/* ================= OVERLAY STATS ================= */

.overlay-stat-item {
  @apply flex flex-col gap-0.5 md:gap-1;
}

.stat-label-text {
  @apply text-[10px] md:text-xs uppercase tracking-wider text-twilight-blue-300 font-semibold;
}

.stat-value-text {
  @apply text-sm md:text-lg text-white font-black;
}

.season-badge-overlay {
  @apply mt-1 md:mt-2 px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-lorwyn-gold-500/20 border border-lorwyn-gold-500/40 text-lorwyn-gold-400 text-[9px] md:text-xs font-bold uppercase tracking-wider inline-block;
}

/* ================= DECK ACTIONS ================= */

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

/* ================= ADD DECK BUTTON ================= */

.add-deck-submit-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}
</style>
