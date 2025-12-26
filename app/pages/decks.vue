<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="bg-linear-to-r from-periwinkle-600 to-midnight-violet-600 dark:from-periwinkle-900 dark:to-midnight-violet-900 rounded-2xl p-8 shadow-xl">
      <div class="flex items-center justify-between flex-wrap gap-4">
        <div class="flex items-center gap-4">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm">
            <span class="text-4xl">🃏</span>
          </div>
          <div>
            <h1 class="text-3xl font-bold text-white">Decks</h1>
            <p class="text-lavender-mist-100 dark:text-periwinkle-200">Browse Commander Decks</p>
          </div>
        </div>
        <UButton
          v-if="user"
          icon="i-heroicons-plus"
          size="lg"
          class="bg-white text-periwinkle-700 hover:bg-lavender-mist-50 shadow-lg font-semibold"
          @click="showAddDeckModal = true"
        >
          Add Deck
        </UButton>
      </div>
    </div>

    <UCard class="bg-white/80 dark:bg-orchid-900/80 backdrop-blur-sm border border-orchid-100 dark:border-orchid-800 shadow-xl">
      <div class="space-y-6">
        <!-- Filters -->
        <div class="flex flex-wrap gap-4">
          <UInput
            v-model="searchQuery"
            placeholder="Search decks..."
            icon="i-heroicons-magnifying-glass"
            class="min-w-[250px]"
          />
          <USelect
            v-model="selectedColor"
            :options="colorFilters"
            placeholder="Filter by Color"
            class="min-w-[180px]"
          />
        </div>

        <!-- Decks Grid -->
        <div v-if="filteredDecks.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="deck in filteredDecks"
            :key="deck.id"
            class="group bg-linear-to-br from-white to-lavender-mist-50 dark:from-orchid-800 dark:to-periwinkle-800 rounded-xl border-2 border-orchid-100 dark:border-orchid-700 p-5 hover:shadow-2xl hover:border-orchid-300 dark:hover:border-midnight-violet-600 transition-all duration-300"
          >
            <div class="space-y-4">
              <div>
                <h3 class="text-xl font-bold text-orchid-900 dark:text-midnight-violet-200 group-hover:text-midnight-violet-700 dark:group-hover:text-midnight-violet-300 transition-colors">
                  {{ deck.name }}
                </h3>
                <p class="text-sm text-berry-blush-700 dark:text-berry-blush-400 mt-1">
                  Commander: <span class="font-semibold">{{ deck.commander }}</span>
                </p>
              </div>

              <div class="flex items-center gap-2">
                <span
                  v-for="color in deck.colors"
                  :key="color"
                  class="w-7 h-7 rounded-full ring-2 ring-white dark:ring-orchid-900 shadow-md"
                  :class="getColorClass(color)"
                  :title="color"
                />
              </div>

              <div class="flex items-center justify-between text-sm bg-lavender-mist-50/50 dark:bg-orchid-900/50 rounded-lg p-3">
                <span class="text-berry-blush-700 dark:text-berry-blush-400">
                  Budget: <span class="font-bold text-midnight-violet-700 dark:text-midnight-violet-400">${{ deck.budget }}</span>
                </span>
                <span class="text-berry-blush-700 dark:text-berry-blush-400">
                  <span class="font-semibold text-orchid-700 dark:text-periwinkle-400">{{ deck.owner }}</span>
                </span>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-orchid-100 dark:border-orchid-700">
                <span class="text-sm font-medium text-berry-blush-700 dark:text-berry-blush-400">
                  Record: <span class="text-midnight-violet-700 dark:text-midnight-violet-400 font-bold">{{ deck.wins }}-{{ deck.games - deck.wins }}</span>
                </span>
                <UButton
                  size="xs"
                  variant="ghost"
                  class="text-midnight-violet-600 dark:text-midnight-violet-400 hover:bg-orchid-100 dark:hover:bg-orchid-700"
                  @click="viewDeck(deck)"
                >
                  View Details
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-12">
          <div class="inline-flex items-center justify-center w-20 h-20 rounded-full bg-lavender-mist-100 dark:bg-orchid-800 mb-4">
            <span class="text-4xl">🔍</span>
          </div>
          <p class="text-berry-blush-600 dark:text-berry-blush-400 font-medium">
            {{ user ? 'No decks found. Add your first deck!' : 'No decks found. Sign in to add decks.' }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- Add Deck Modal -->
    <UModal v-model="showAddDeckModal">
      <UCard>
        <template #header>
          <h3 class="text-xl font-bold">Add New Deck</h3>
        </template>

        <form @submit.prevent="handleAddDeck" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Deck Name</label>
            <UInput
              v-model="deckForm.name"
              placeholder="My Awesome Deck"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Commander</label>
            <UInput
              v-model="deckForm.commander"
              placeholder="Card Name"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Colors</label>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="color in availableColors"
                :key="color.value"
                class="flex items-center gap-2 cursor-pointer"
              >
                <input
                  v-model="deckForm.colors"
                  type="checkbox"
                  :value="color.value"
                  class="rounded"
                />
                <span class="text-sm">{{ color.label }}</span>
              </label>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Budget ($)</label>
            <UInput
              v-model.number="deckForm.budget"
              type="number"
              min="0"
              step="0.01"
              placeholder="50.00"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Deck Description (Optional)
            </label>
            <UTextarea
              v-model="deckForm.description"
              placeholder="Describe your deck strategy..."
              :rows="3"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">
              Decklist URL (Optional)
            </label>
            <UInput
              v-model="deckForm.decklistUrl"
              type="url"
              placeholder="https://..."
            />
          </div>

          <div class="flex gap-4">
            <UButton
              type="submit"
              :loading="isSubmitting"
              block
            >
              Add Deck
            </UButton>
            <UButton
              type="button"
              variant="outline"
              @click="showAddDeckModal = false"
              block
            >
              Cancel
            </UButton>
          </div>
        </form>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { getDocuments, addDocument } = useFirestore()

const searchQuery = ref('')
const selectedColor = ref('all')
const showAddDeckModal = ref(false)
const isSubmitting = ref(false)

const colorFilters = ['all', 'white', 'blue', 'black', 'red', 'green', 'colorless']

const availableColors = [
  { value: 'white', label: 'White (W)' },
  { value: 'blue', label: 'Blue (U)' },
  { value: 'black', label: 'Black (B)' },
  { value: 'red', label: 'Red (R)' },
  { value: 'green', label: 'Green (G)' },
  { value: 'colorless', label: 'Colorless (C)' }
]

const deckForm = ref({
  name: '',
  commander: '',
  colors: [] as string[],
  budget: 0,
  description: '',
  decklistUrl: ''
})

const decks = ref([])

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

const viewDeck = (deck: any) => {
  // TODO: Navigate to deck detail page or open modal
  console.log('Viewing deck:', deck)
}

const fetchDecks = async () => {
  try {
    const fetchedDecks = await getDocuments('decks')
    decks.value = fetchedDecks
  } catch (error) {
    console.error('Error fetching decks:', error)
  }
}

const handleAddDeck = async () => {
  if (!user.value) {
    alert('You must be signed in to add a deck')
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
      alert('Player profile not found. Please set up your profile first.')
      return
    }

    const playerDoc = playerSnapshot.docs[0]
    const playerId = playerDoc.id

    // Add deck to Firestore
    await addDocument('decks', {
      name: deckForm.value.name,
      commander: deckForm.value.commander,
      colors: deckForm.value.colors,
      budget: deckForm.value.budget,
      description: deckForm.value.description,
      decklistUrl: deckForm.value.decklistUrl,
      ownerId: playerId,
      owner: user.value.displayName,
      wins: 0,
      games: 0
    })

    // Reset form and close modal
    deckForm.value = {
      name: '',
      commander: '',
      colors: [],
      budget: 0,
      description: '',
      decklistUrl: ''
    }
    showAddDeckModal.value = false

    // Refresh decks list
    await fetchDecks()

    alert('Deck added successfully!')
  } catch (error) {
    console.error('Error adding deck:', error)
    alert('Error adding deck. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchDecks()
})
</script>
