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
            <p class="hero-subtitle">Browse and manage your budget commander decks</p>
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
        </div>
        <div class="flex gap-2">
          <UButton variant="outline" @click="toggleTestData">
            {{ useTestData ? 'Use Real Data' : 'Use Test Data' }}
          </UButton>
          <UButton variant="outline" @click="refreshDecks" icon="i-heroicons-arrow-path">
            Refresh
          </UButton>
        </div>
      </div>
    </UCard>

    <!-- Decks Grid -->
    <div v-if="filteredDecks.length > 0" class="decks-section">
      <h2 class="section-title">All Decks</h2>

      <div class="decks-grid">
        <div v-for="deck in filteredDecks" :key="deck.id" class="deck-card" @click="viewDeck(deck)">
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
            <!-- Deck Info Stack -->
            <div class="card-info-stack">
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
            </div>
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
    <UModal v-model:open="showAddDeckModal" title="Add New Commander Deck"
      description="Register a new deck for the Budget Ducks Commander League"
      :ui="{ footer: 'flex justify-end gap-3' }">
      <template #body>
        <UForm :state="deckForm" :validate="validateDeck" class="space-y-6" @submit="handleAddDeck">
          <UFormField label="Deck Name" name="name" required help="Give your deck a memorable name">
            <UInput v-model="deckForm.name" placeholder="e.g., Dragon Storm, Elf Tribal" size="lg" class="w-full" />
          </UFormField>

          <UFormField label="Commander" name="commander" required
            help="Type at least 3 letters to search for commanders">
            <UInputMenu v-model="deckForm.commander" v-model:search-term="commanderSearchTerm"
              :items="commanderSuggestions" :loading="isSearchingCommanders" value-key="value"
              placeholder="e.g., Lathril, Blade of the Elves" size="lg" class="w-full" />
          </UFormField>

          <UFormField label="Color Identity" name="colors" help="Select all colors in your commander's color identity">
            <UCheckboxGroup v-model="deckForm.colors" :items="availableColors" class="w-full" />
          </UFormField>

          <UFormField label="Budget (USD)" name="budget" required help="Total deck cost excluding basic lands">
            <UInputNumber v-model="deckForm.budget" :min="0" :step="0.01" placeholder="50.00" size="lg"
              class="w-full" />
          </UFormField>

          <UFormField label="Deck Description" name="description"
            help="Optional: Describe your deck's strategy and playstyle">
            <UTextarea v-model="deckForm.description" placeholder="This deck focuses on..." :rows="3" resize
              class="w-full" />
          </UFormField>

          <UFormField label="Decklist URL" name="decklistUrl"
            help="Optional: Link to Moxfield, Archidekt, or other deck builder">
            <UInput v-model="deckForm.decklistUrl" type="url" placeholder="https://www.moxfield.com/decks/..." size="lg"
              class="w-full" />
          </UFormField>
        </UForm>
      </template>

      <template #footer>
        <UButton variant="outline" color="neutral" @click="showAddDeckModal = false" :disabled="isSubmitting">
          Cancel
        </UButton>
        <UButton @click="handleAddDeck" :loading="isSubmitting" class="add-deck-submit-button">
          Add Deck
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { getDocuments, addDocument } = useFirestore()
const { fetchCommanderImage, searchCommanders } = useScryfall()

const searchQuery = ref('')
const selectedColor = ref('all')
const showAddDeckModal = ref(false)
const isSubmitting = ref(false)
const useTestData = ref(true) // Start with test data

// Commander autocomplete
const commanderSuggestions = ref<Array<{ label: string; value: string }>>([])
const commanderSearchTerm = ref('')
const isSearchingCommanders = ref(false)
let searchTimeout: NodeJS.Timeout | null = null

// Store commander images (deck.id -> image URL)
const commanderImages = ref<Record<string, string | null>>({})
const loadingImages = ref<Record<string, boolean>>({})

const colorFilters = ['all', 'white', 'blue', 'black', 'red', 'green', 'colorless']

// Mock test data with real MTG commanders
const mockDecks = [
  { id: '1', name: 'Elf Tribal', commander: 'Lathril, Blade of the Elves', colors: ['green', 'black'], budget: 45, owner: 'Alex', wins: 12, games: 20, decklistUrl: 'https://www.moxfield.com/decks/elf-tribal-example' },
  { id: '2', name: 'Dragon Storm', commander: 'The Ur-Dragon', colors: ['white', 'blue', 'black', 'red', 'green'], budget: 75, owner: 'Jordan', wins: 8, games: 15, decklistUrl: 'https://www.moxfield.com/decks/dragon-storm-example' },
  { id: '3', name: 'Vampire Knights', commander: 'Edgar Markov', colors: ['white', 'black', 'red'], budget: 60, owner: 'Sam', wins: 15, games: 22, decklistUrl: 'https://www.moxfield.com/decks/vampire-knights-example' },
  { id: '4', name: 'Wizard Control', commander: 'Niv-Mizzet, Parun', colors: ['blue', 'red'], budget: 50, owner: 'Taylor', wins: 10, games: 18, decklistUrl: 'https://www.moxfield.com/decks/wizard-control-example' },
  { id: '5', name: 'Zombie Horde', commander: 'The Scarab God', colors: ['blue', 'black'], budget: 55, owner: 'Morgan', wins: 14, games: 21, decklistUrl: 'https://www.moxfield.com/decks/zombie-horde-example' },
  { id: '6', name: 'Angels Rising', commander: 'Giada, Font of Hope', colors: ['white'], budget: 40, owner: 'Casey', wins: 9, games: 16, decklistUrl: 'https://www.moxfield.com/decks/angels-rising-example' },
  { id: '7', name: 'Goblin Mayhem', commander: 'Krenko, Mob Boss', colors: ['red'], budget: 35, owner: 'Riley', wins: 11, games: 19, decklistUrl: 'https://www.moxfield.com/decks/goblin-mayhem-example' },
  { id: '8', name: 'Merfolk Tide', commander: 'Kumena, Tyrant of Orazca', colors: ['green', 'blue'], budget: 48, owner: 'Avery', wins: 7, games: 14, decklistUrl: 'https://www.moxfield.com/decks/merfolk-tide-example' },
  { id: '9', name: 'Cat Tribal', commander: 'Arahbo, Roar of the World', colors: ['green', 'white'], budget: 42, owner: 'Drew', wins: 13, games: 20, decklistUrl: 'https://www.moxfield.com/decks/cat-tribal-example' },
  { id: '10', name: 'Artifact Combo', commander: 'Urza, Lord High Artificer', colors: ['blue'], budget: 70, owner: 'Quinn', wins: 16, games: 23, decklistUrl: 'https://www.moxfield.com/decks/artifact-combo-example' },
  { id: '11', name: 'Dinosaur Stampede', commander: 'Gishath, Sun\'s Avatar', colors: ['red', 'green', 'white'], budget: 58, owner: 'Skyler', wins: 6, games: 12, decklistUrl: 'https://www.moxfield.com/decks/dinosaur-stampede-example' },
  { id: '12', name: 'Sliver Swarm', commander: 'The First Sliver', colors: ['white', 'blue', 'black', 'red', 'green'], budget: 65, owner: 'Jamie', wins: 10, games: 17, decklistUrl: 'https://www.moxfield.com/decks/sliver-swarm-example' }
]

const availableColors = [
  { label: 'White (W)', value: 'white' },
  { label: 'Blue (U)', value: 'blue' },
  { label: 'Black (B)', value: 'black' },
  { label: 'Red (R)', value: 'red' },
  { label: 'Green (G)', value: 'green' },
  { label: 'Colorless (C)', value: 'colorless' }
]

const deckForm = reactive({
  name: '',
  commander: '',
  colors: [] as string[],
  budget: 0,
  description: '',
  decklistUrl: ''
})

// Debounced commander search
const searchCommandersDebounced = async (query: string) => {
  // Clear existing timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  // Only search if query is 3+ characters
  if (!query || query.trim().length < 3) {
    commanderSuggestions.value = []
    isSearchingCommanders.value = false
    return
  }

  // Don't search if the query matches the already selected commander
  if (query === deckForm.commander) {
    isSearchingCommanders.value = false
    return
  }

  // Set loading state
  isSearchingCommanders.value = true

  // Debounce the search
  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchCommanders(query)
      commanderSuggestions.value = results
    } catch (error) {
      console.error('Error searching commanders:', error)
      commanderSuggestions.value = []
    } finally {
      isSearchingCommanders.value = false
    }
  }, 300) // 300ms delay
}

// Watch for changes in commander search term
watch(commanderSearchTerm, (newValue) => {
  console.log('Commander search term changed to:', newValue)
  searchCommandersDebounced(newValue)
})

// Validation function
const validateDeck = (state: typeof deckForm) => {
  const errors = []

  if (!state.name || state.name.trim().length < 2) {
    errors.push({ name: 'name', message: 'Deck name must be at least 2 characters' })
  }

  if (!state.commander || state.commander.trim().length < 2) {
    errors.push({ name: 'commander', message: 'Commander name is required' })
  }

  if (state.budget === null || state.budget === undefined || state.budget < 0) {
    errors.push({ name: 'budget', message: 'Budget must be a positive number' })
  }

  if (state.decklistUrl && state.decklistUrl.trim() !== '') {
    try {
      new URL(state.decklistUrl)
    } catch {
      errors.push({ name: 'decklistUrl', message: 'Please enter a valid URL' })
    }
  }

  return errors
}

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

const viewDeck = (deck: any) => {
  // Open deck URL in new tab if available
  if (deck.decklistUrl) {
    window.open(deck.decklistUrl, '_blank', 'noopener,noreferrer')
  } else {
    // Fallback: could open a modal or detail page
    console.log('No decklist URL for deck:', deck)
  }
}

const loadTestData = async () => {
  decks.value = [...mockDecks]
  await loadCommanderImages(mockDecks)
}

const toggleTestData = () => {
  useTestData.value = !useTestData.value
  refreshDecks()
}

const refreshDecks = async () => {
  if (useTestData.value) {
    await loadTestData()
  } else {
    await fetchDecks()
  }
}

const fetchDecks = async () => {
  try {
    const fetchedDecks = await getDocuments('decks')
    decks.value = fetchedDecks

    // Fetch commander images for all decks
    await loadCommanderImages(fetchedDecks)
  } catch (error) {
    console.error('Error fetching decks:', error)
  }
}

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

const resetDeckForm = () => {
  deckForm.name = ''
  deckForm.commander = ''
  deckForm.colors = []
  deckForm.budget = 0
  deckForm.description = ''
  deckForm.decklistUrl = ''
}

const handleAddDeck = async () => {
  if (!user.value) {
    toast.add({
      title: 'Authentication Required',
      description: 'You must be signed in to add a deck',
      color: 'error'
    })
    return
  }

  // Validate form
  const errors = validateDeck(deckForm)
  if (errors.length > 0) {
    toast.add({
      title: 'Validation Error',
      description: errors[0].message,
      color: 'error'
    })
    return
  }

  isSubmitting.value = true
  try {
    // Get player profile to link deck to player
    const { $db } = useNuxtApp()
    const { collection, query, where, getDocs } = await import('firebase/firestore')

    const playersRef = collection($db, 'players')
    const q = query(playersRef, where('userId', '==', user.value.uid))
    const playerSnapshot = await getDocs(q)

    if (playerSnapshot.empty) {
      toast.add({
        title: 'Profile Not Found',
        description: 'Please set up your player profile first',
        color: 'error'
      })
      return
    }

    const playerDoc = playerSnapshot.docs[0]
    const playerId = playerDoc.id

    // Add deck to Firestore
    await addDocument('decks', {
      name: deckForm.name,
      commander: deckForm.commander,
      colors: deckForm.colors,
      budget: deckForm.budget,
      description: deckForm.description || '',
      decklistUrl: deckForm.decklistUrl || '',
      ownerId: playerId,
      owner: user.value.displayName || 'Anonymous',
      wins: 0,
      games: 0
    })

    // Show success message
    toast.add({
      title: 'Deck Added Successfully!',
      description: `${deckForm.name} has been added to your collection`,
      color: 'success'
    })

    // Reset form and close modal
    resetDeckForm()
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
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  if (useTestData.value) {
    loadTestData()
  } else {
    fetchDecks()
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
  @apply grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4;
}

.deck-card {
  @apply relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105;
  aspect-ratio: 3 / 4;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

.deck-card:hover {
  box-shadow:
    0 0 30px rgba(255, 215, 0, 0.4),
    0 0 60px rgba(255, 105, 180, 0.3),
    0 8px 16px rgba(0, 0, 0, 0.5);
}

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
  @apply absolute inset-0 p-4 flex flex-col justify-end;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
}

/* ================= CARD INFO STACK ================= */

.card-info-stack {
  @apply flex flex-col gap-3;
}

.overlay-deck-name {
  @apply text-lg md:text-xl font-black text-white leading-tight;
}

.overlay-commander-name {
  @apply text-sm md:text-base text-twilight-blue-200 font-semibold leading-tight;
}

.overlay-color-identity {
  @apply flex items-center gap-2 flex-wrap;
}

.mana-symbol {
  @apply w-7 h-7 md:w-8 md:h-8;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8));
}

/* ================= OVERLAY STATS ================= */

.overlay-stat-item {
  @apply flex flex-col gap-1;
}

.stat-label-text {
  @apply text-xs uppercase tracking-wider text-twilight-blue-300 font-semibold;
}

.stat-value-text {
  @apply text-base md:text-lg text-white font-black;
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
