<template>
  <div class="submit-game-page">
    <div class="submit-game-container">
      <!-- Hero Header -->
      <div class="submit-game-header">
        <div class="icon-wrapper">
          <span class="icon">⚔️</span>
        </div>
        <h1 class="title">Submit Game Result</h1>
        <p class="subtitle">{{ currentSeasonName }}</p>
      </div>

      <!-- Not Signed In State -->
      <UCard v-if="!user" class="submit-game-card">
        <div class="sign-in-prompt">
          <div class="prompt-icon">🔐</div>
          <h3 class="prompt-title">Sign In Required</h3>
          <p class="prompt-text">
            Please sign in to submit game results
          </p>
          <UButton to="/auth/login" size="xl" class="prompt-button">
            Sign In
          </UButton>
        </div>
      </UCard>

      <!-- Submit Game Form -->
      <UCard v-else class="submit-game-card">
        <!-- No Active Season Warning -->
        <div v-if="!activeSeason" class="no-players-warning">
          <div class="warning-icon">📅</div>
          <h3 class="warning-title">No Active Season</h3>
          <p class="warning-text">
            There is no active season at the moment. Please contact the league administrator.
          </p>
          <UButton to="/seasons" variant="outline" size="lg" class="mt-4">
            View All Seasons
          </UButton>
        </div>

        <!-- No Players Warning -->
        <div v-else-if="availablePlayers.length === 0" class="no-players-warning">
          <div class="warning-icon">⚠️</div>
          <h3 class="warning-title">No Registered Players</h3>
          <p class="warning-text">
            No players are registered for {{ activeSeason.name }}. Players need to register for the season before you can submit game results.
          </p>
          <UButton to="/seasons/register" variant="outline" size="lg" class="mt-4">
            Register for Season
          </UButton>
        </div>

        <UForm v-else :state="formState" :validate="validate" class="space-y-8" @submit="handleSubmit">
          <!-- Game Date -->
          <UFormField label="Game Date" name="date" required>
            <UInput
              v-model="formState.date"
              type="date"
              size="xl"
              icon="i-heroicons-calendar"
              class="w-full"
            />
          </UFormField>

          <!-- Players Selection -->
          <div class="players-section">
            <label class="section-label">
              Players (Select 3-4 players)
            </label>
            <div class="space-y-4">
              <div
                v-for="(player, index) in formState.players"
                :key="index"
                class="player-row"
              >
                <div class="player-number">{{ index + 1 }}</div>
                <div class="player-fields">
                  <UFormField label="Player" :name="`players[${index}].playerId`" class="flex-1">
                    <USelect
                      v-model="formState.players[index].playerId"
                      :items="availablePlayers"
                      value-key="value"
                      placeholder="Select Player"
                      size="xl"
                      class="w-full"
                      @update:model-value="onPlayerChange(index)"
                    />
                  </UFormField>
                  <UFormField label="Deck" :name="`players[${index}].deckId`" class="flex-1">
                    <USelect
                      v-model="formState.players[index].deckId"
                      :items="getPlayerDecks(formState.players[index].playerId)"
                      value-key="value"
                      placeholder="Select Deck"
                      size="xl"
                      class="w-full"
                      :disabled="!formState.players[index].playerId"
                    />
                  </UFormField>
                </div>
                <UButton
                  v-if="formState.players.length > 3"
                  icon="i-heroicons-trash"
                  color="error"
                  variant="ghost"
                  size="xl"
                  class="remove-button"
                  @click="removePlayer(index)"
                />
              </div>
            </div>

            <UButton
              v-if="formState.players.length < 4"
              icon="i-heroicons-plus"
              variant="outline"
              size="lg"
              class="add-player-button"
              @click="addPlayer"
            >
              Add Player
            </UButton>
          </div>

          <!-- Winner Selection -->
          <UFormField label="Winner" name="winnerId" required>
            <USelect
              v-model="formState.winnerId"
              :items="playerOptions"
              value-key="value"
              placeholder="Select Winner"
              size="xl"
              icon="i-heroicons-trophy"
              class="w-full"
            />
          </UFormField>

          <!-- Game Notes -->
          <UFormField
            label="Game Notes (Optional)"
            name="notes"
            help="Any notable plays, combos, or interesting moments"
          >
            <UTextarea
              v-model="formState.notes"
              placeholder="Describe what happened during the game..."
              :rows="4"
              size="xl"
              class="w-full"
            />
          </UFormField>

          <!-- Turn Count -->
          <UFormField
            label="Turn Count (Optional)"
            name="turnCount"
            help="How many turns did the game last?"
          >
            <UInput
              v-model.number="formState.turnCount"
              type="number"
              :min="1"
              placeholder="e.g., 8"
              size="xl"
              icon="i-heroicons-arrow-path"
              class="w-full"
            />
          </UFormField>

          <!-- Submit Buttons -->
          <div class="button-group">
            <UButton
              type="submit"
              size="xl"
              :loading="isSubmitting"
              :disabled="!isFormValid"
              class="submit-button"
            >
              Submit Game
            </UButton>
            <UButton
              type="button"
              variant="outline"
              size="xl"
              class="reset-button"
              @click="resetForm"
            >
              Reset
            </UButton>
          </div>
        </UForm>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Season } from '~/types'

const { user } = useAuth()
const { getDocuments, addDocument, updateDocument, increment, where } = useFirestore()
const { getActiveSeason, getRegisteredPlayers, updatePlayerStats } = useSeasons()
const { getActiveVersion } = useDeckVersions()
const toast = useToast()

const isSubmitting = ref(false)
const activeSeason = ref<Season | null>(null)
const currentSeasonName = ref('Loading...')

const formState = reactive({
  date: new Date().toISOString().split('T')[0],
  players: [
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' }
  ],
  winnerId: '',
  notes: '',
  turnCount: null as number | null
})

const availablePlayers = ref<Array<{ value: string; label: string }>>([])
const availableDecks = ref<Array<{ value: string; label: string; ownerId: string }>>([])

const playerOptions = computed(() => {
  return formState.players
    .filter(p => p.playerId)
    .map(p => ({
      value: p.playerId,
      label: getPlayerName(p.playerId)
    }))
})

const isFormValid = computed(() => {
  return (
    formState.players.length >= 3 &&
    formState.players.every(p => p.playerId && p.deckId) &&
    formState.winnerId
  )
})

const validate = (state: typeof formState) => {
  const errors = []

  if (!state.date) {
    errors.push({ name: 'date', message: 'Game date is required' })
  }

  state.players.forEach((player, index) => {
    if (!player.playerId) {
      errors.push({ name: `players[${index}].playerId`, message: 'Player is required' })
    }
    if (!player.deckId) {
      errors.push({ name: `players[${index}].deckId`, message: 'Deck is required' })
    }
  })

  if (!state.winnerId) {
    errors.push({ name: 'winnerId', message: 'Winner selection is required' })
  }

  return errors
}

const addPlayer = () => {
  if (formState.players.length < 4) {
    formState.players.push({ playerId: '', deckId: '' })
  }
}

const removePlayer = (index: number) => {
  if (formState.players.length > 3) {
    formState.players.splice(index, 1)
  }
}

const onPlayerChange = (index: number) => {
  // Clear deck selection when player changes
  formState.players[index].deckId = ''
}

const getPlayerDecks = (playerId: string) => {
  if (!playerId) return []
  return availableDecks.value.filter(deck => deck.ownerId === playerId)
}

const getPlayerName = (playerId: string) => {
  const player = availablePlayers.value.find(p => p.value === playerId)
  return player?.label || ''
}

const handleSubmit = async () => {
  if (!activeSeason.value) {
    toast.add({
      title: 'No Active Season',
      description: 'Cannot submit game without an active season.',
      color: 'error'
    })
    return
  }

  isSubmitting.value = true

  try {
    // Fetch active versions for all decks and lock prices
    const playersWithVersions = await Promise.all(
      formState.players.map(async (player) => {
        try {
          const activeVersion = await getActiveVersion(player.deckId)

          return {
            ...player,
            deckVersionId: activeVersion?.id || null,
            deckPriceAtGame: activeVersion?.totalPrice || null
          }
        } catch (error) {
          console.error(`Error fetching version for deck ${player.deckId}:`, error)
          // If version fetch fails, still include the player but without version data
          return {
            ...player,
            deckVersionId: null,
            deckPriceAtGame: null
          }
        }
      })
    )

    // Submit game to Firestore with seasonId and locked versions
    await addDocument('games', {
      seasonId: activeSeason.value.id,
      date: formState.date,
      players: playersWithVersions,
      winnerId: formState.winnerId,
      notes: formState.notes,
      turnCount: formState.turnCount
    })

    // Update playerSeason stats (not player stats)
    for (const gamePlayer of formState.players) {
      const isWinner = gamePlayer.playerId === formState.winnerId

      // Update playerSeason stats
      await updatePlayerStats(
        gamePlayer.playerId,
        activeSeason.value.id,
        {
          gamesPlayed: increment(1) as any,
          wins: isWinner ? increment(1) as any : increment(0) as any,
          losses: !isWinner ? increment(1) as any : increment(0) as any,
          points: increment(isWinner ? 3 : 1) as any // 3 points for win, 1 for participation
        }
      )

      // Update deck stats
      if (gamePlayer.deckId) {
        await updateDocument('decks', gamePlayer.deckId, {
          games: increment(1),
          wins: isWinner ? increment(1) : increment(0)
        })
      }
    }

    // Show success message
    toast.add({
      title: 'Game Submitted!',
      description: 'Match results have been recorded successfully with locked deck prices.',
      color: 'success'
    })

    // Reset form
    resetForm()
  } catch (error: any) {
    console.error('Error submitting game:', error)
    toast.add({
      title: 'Submission Failed',
      description: error?.message || 'Unable to submit game. Please try again.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}

const resetForm = () => {
  formState.date = new Date().toISOString().split('T')[0]
  formState.players = [
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' },
    { playerId: '', deckId: '' }
  ]
  formState.winnerId = ''
  formState.notes = ''
  formState.turnCount = null
}

onMounted(async () => {
  try {
    // Get active season
    const season = await getActiveSeason()
    activeSeason.value = season

    if (!season) {
      currentSeasonName.value = 'No Active Season'
      return
    }

    currentSeasonName.value = season.name

    // Fetch players registered for the current season
    const registeredPlayers = await getRegisteredPlayers(season.id)
    availablePlayers.value = registeredPlayers.map((playerSeason: any) => ({
      value: playerSeason.playerId,
      label: playerSeason.displayName
    }))

    // Fetch all decks that are registered for this season
    // We need to get all playerSeasons for this season, extract registered deck IDs, then fetch those decks
    const allPlayerSeasons = await getDocuments('playerSeasons', [
      where('seasonId', '==', season.id)
    ])

    // Collect all registered deck IDs from all players
    const registeredDeckIds = new Set<string>()
    allPlayerSeasons.forEach((ps: any) => {
      if (ps.registeredDeckIds && Array.isArray(ps.registeredDeckIds)) {
        ps.registeredDeckIds.forEach((deckId: string) => registeredDeckIds.add(deckId))
      }
    })

    // Fetch all decks (we'll filter client-side since Firestore doesn't support 'in' queries with large arrays efficiently)
    const allDecks = await getDocuments('decks', [])

    // Filter to only registered decks
    const seasonDecks = allDecks.filter((deck: any) => registeredDeckIds.has(deck.id))

    availableDecks.value = seasonDecks.map((deck: any) => ({
      value: deck.id,
      label: `${deck.name} (${deck.commander})`,
      ownerId: deck.ownerId
    }))
  } catch (error) {
    console.error('Error fetching data:', error)
    currentSeasonName.value = 'Error loading season'
    toast.add({
      title: 'Error Loading Data',
      description: 'Unable to load season data. Please refresh the page.',
      color: 'error'
    })
  }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE LAYOUT ================= */

.submit-game-page {
  @apply min-h-screen py-12 px-4;
}

.submit-game-container {
  @apply w-full max-w-3xl mx-auto space-y-6;
}

/* ================= HEADER ================= */

.submit-game-header {
  @apply text-center space-y-4;
}

.icon-wrapper {
  @apply inline-flex items-center justify-center w-20 h-20 rounded-full mx-auto;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.3),
    rgba(168, 85, 247, 0.3)
  );
  backdrop-filter: blur(10px);
  box-shadow:
    0 8px 32px rgba(139, 92, 246, 0.2),
    inset 0 1px 2px rgba(255, 255, 255, 0.1);
}

.icon {
  @apply text-5xl;
}

.title {
  @apply text-4xl md:text-5xl font-black bg-linear-to-r from-lorwyn-gold-400 via-shadowmoor-magenta-400 to-shadowmoor-purple-500 bg-clip-text text-transparent;
}

.subtitle {
  @apply text-base md:text-lg text-twilight-blue-200 font-medium;
}

/* ================= CARD ================= */

.submit-game-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl p-8;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.submit-game-card::before {
  content: '';
  @apply absolute inset-0 rounded-lg pointer-events-none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%
  );
}

/* ================= FORM ================= */

:deep(.submit-game-card .space-y-8) {
  @apply relative z-10;
}

/* Update help text color to be more visible */
:deep(.submit-game-card [class*="help"]) {
  @apply text-lorwyn-green-300;
}

:deep(.submit-game-card .text-muted) {
  @apply text-lorwyn-green-300;
}

/* ================= SIGN IN PROMPT ================= */

.sign-in-prompt {
  @apply text-center py-12 space-y-6;
}

.prompt-icon {
  @apply text-6xl mb-4;
}

.prompt-title {
  @apply text-2xl font-black text-white;
}

.prompt-text {
  @apply text-twilight-blue-300 text-lg;
}

.prompt-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl;
}

/* ================= SECTIONS ================= */

.players-section {
  @apply space-y-4;
}

.section-label {
  @apply block text-base font-bold text-white mb-4;
}

.player-row {
  @apply flex flex-col sm:flex-row items-start gap-3 p-4 rounded-lg bg-twilight-blue-800/30 border border-twilight-blue-700/30;
}

.player-number {
  @apply flex items-center justify-center w-10 h-10 rounded-full bg-linear-to-br from-lorwyn-gold-500/30 to-shadowmoor-magenta-500/30 text-white font-black text-lg shrink-0;
}

.player-fields {
  @apply flex flex-col sm:flex-row gap-3 flex-1 w-full;
}

.remove-button {
  @apply sm:mt-6 self-end sm:self-start;
}

.add-player-button {
  @apply border-2 border-twilight-blue-600/50 hover:bg-twilight-blue-800/30 hover:border-twilight-blue-500/70 font-semibold text-white transition-all duration-200;
}

/* ================= NO PLAYERS WARNING ================= */

.no-players-warning {
  @apply text-center py-12 space-y-6;
}

.warning-icon {
  @apply text-6xl mb-4;
}

.warning-title {
  @apply text-2xl font-black text-white;
}

.warning-text {
  @apply text-twilight-blue-300 text-lg max-w-md mx-auto;
}

/* ================= BUTTONS ================= */

.button-group {
  @apply flex flex-col sm:flex-row gap-4 pt-4;
}

.submit-button {
  @apply flex-1 bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl;
}

.reset-button {
  @apply flex-1 border-2 border-twilight-blue-600/50 hover:bg-twilight-blue-800/30 hover:border-twilight-blue-500/70 font-semibold text-white transition-all duration-200;
}
</style>
