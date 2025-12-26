<template>
  <div class="space-y-6">
    <UCard>
      <template #header>
        <h1 class="text-2xl font-bold">Submit Game Result</h1>
      </template>

      <div v-if="!user" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to submit game results
        </p>
        <UButton to="/auth/login">
          Sign In
        </UButton>
      </div>

      <form v-else @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Game Date -->
        <div>
          <label class="block text-sm font-medium mb-2">Game Date</label>
          <UInput
            v-model="form.date"
            type="date"
            required
          />
        </div>

        <!-- Players Selection -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Players (Select 2-4 players)
          </label>
          <div class="space-y-2">
            <div
              v-for="(player, index) in form.players"
              :key="index"
              class="flex items-center gap-2"
            >
              <USelect
                v-model="form.players[index].playerId"
                :options="availablePlayers"
                placeholder="Select Player"
                class="flex-1"
              />
              <USelect
                v-model="form.players[index].deckId"
                :options="getPlayerDecks(form.players[index].playerId)"
                placeholder="Select Deck"
                class="flex-1"
              />
              <UButton
                v-if="form.players.length > 2"
                icon="i-heroicons-trash"
                color="red"
                variant="ghost"
                @click="removePlayer(index)"
              />
            </div>
          </div>

          <UButton
            v-if="form.players.length < 4"
            icon="i-heroicons-plus"
            variant="outline"
            class="mt-2"
            @click="addPlayer"
          >
            Add Player
          </UButton>
        </div>

        <!-- Winner Selection -->
        <div>
          <label class="block text-sm font-medium mb-2">Winner</label>
          <USelect
            v-model="form.winnerId"
            :options="playerOptions"
            placeholder="Select Winner"
            required
          />
        </div>

        <!-- Placement (for 3-4 player games) -->
        <div v-if="form.players.length >= 3">
          <label class="block text-sm font-medium mb-2">Final Placement</label>
          <div class="space-y-2">
            <div
              v-for="(player, index) in form.players"
              :key="index"
              class="flex items-center gap-2"
            >
              <span class="w-8 text-center font-semibold">{{ index + 1 }}</span>
              <USelect
                v-model="form.placements[index]"
                :options="playerOptions"
                placeholder="Select Player"
              />
            </div>
          </div>
        </div>

        <!-- Game Notes -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Game Notes (Optional)
          </label>
          <UTextarea
            v-model="form.notes"
            placeholder="Any notable plays, combos, or interesting moments..."
            :rows="4"
          />
        </div>

        <!-- Turn Count -->
        <div>
          <label class="block text-sm font-medium mb-2">
            Turn Count (Optional)
          </label>
          <UInput
            v-model.number="form.turnCount"
            type="number"
            min="1"
            placeholder="How many turns did the game last?"
          />
        </div>

        <!-- Submit Button -->
        <div class="flex gap-4">
          <UButton
            type="submit"
            size="lg"
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            Submit Game
          </UButton>
          <UButton
            type="button"
            variant="outline"
            size="lg"
            @click="resetForm"
          >
            Reset
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()

const isSubmitting = ref(false)

const form = ref({
  date: new Date().toISOString().split('T')[0],
  players: [
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' }
  ],
  winnerId: '',
  placements: [],
  notes: '',
  turnCount: null
})

const { getDocuments } = useFirestore()

const availablePlayers = ref([])
const availableDecks = ref([])

const playerOptions = computed(() => {
  return form.value.players
    .filter(p => p.playerId)
    .map(p => ({
      value: p.playerId,
      label: getPlayerName(p.playerId)
    }))
})

const isFormValid = computed(() => {
  return (
    form.value.players.length >= 2 &&
    form.value.players.every(p => p.playerId && p.deckId) &&
    form.value.winnerId
  )
})

const addPlayer = () => {
  if (form.value.players.length < 4) {
    form.value.players.push({ playerId: '', deckId: '' })
  }
}

const removePlayer = (index: number) => {
  form.value.players.splice(index, 1)
}

const getPlayerDecks = (playerId: string) => {
  // Filter decks by player
  return availableDecks.value.filter(deck => deck.ownerId === playerId)
}

const getPlayerName = (playerId: string) => {
  const player = availablePlayers.value.find(p => p.value === playerId)
  return player?.label || ''
}

const handleSubmit = async () => {
  isSubmitting.value = true

  try {
    const { addDocument, updateDocument, increment } = useFirestore()

    // Submit game to Firestore
    const gameId = await addDocument('games', {
      date: form.value.date,
      players: form.value.players,
      winnerId: form.value.winnerId,
      placements: form.value.placements,
      notes: form.value.notes,
      turnCount: form.value.turnCount
    })

    // Update player stats
    for (const gamePlayer of form.value.players) {
      const isWinner = gamePlayer.playerId === form.value.winnerId

      // Update player document
      await updateDocument('players', gamePlayer.playerId, {
        gamesPlayed: increment(1),
        wins: isWinner ? increment(1) : increment(0),
        losses: !isWinner ? increment(1) : increment(0),
        points: increment(isWinner ? 3 : 1) // 3 points for win, 1 for participation
      })

      // Update deck stats
      if (gamePlayer.deckId) {
        await updateDocument('decks', gamePlayer.deckId, {
          games: increment(1),
          wins: isWinner ? increment(1) : increment(0)
        })
      }
    }

    // Show success message
    alert('Game submitted successfully!')

    // Reset form
    resetForm()
  } catch (error) {
    console.error('Error submitting game:', error)
    alert('Error submitting game. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  form.value = {
    date: new Date().toISOString().split('T')[0],
    players: [
      { playerId: '', deckId: '' },
      { playerId: '', deckId: '' }
    ],
    winnerId: '',
    placements: [],
    notes: '',
    turnCount: null
  }
}

onMounted(async () => {
  try {
    // Fetch players from Firestore
    const players = await getDocuments('players')
    availablePlayers.value = players.map((player: any) => ({
      value: player.id,
      label: player.displayName
    }))

    // Fetch decks from Firestore
    const decks = await getDocuments('decks')
    availableDecks.value = decks.map((deck: any) => ({
      value: deck.id,
      label: `${deck.name} (${deck.commander})`,
      ownerId: deck.ownerId
    }))
  } catch (error) {
    console.error('Error fetching data:', error)
  }
})
</script>
