<template>
  <UModal :open="isOpen" @update:open="$emit('update:isOpen', $event)"
    :title="mode === 'create' ? 'Add New Commander Deck' : 'Edit Deck'"
    :description="mode === 'create' ? 'Register a new deck for the Budget Ducks Commander League' : 'Update your deck details'"
    :ui="{ footer: 'flex justify-end gap-3' }">
    <template #body>
      <UForm :state="deckForm" :validate="validateDeck" class="space-y-6">
        <UFormField label="Deck Name" name="name" required help="Give your deck a memorable name">
          <UInput v-model="deckForm.name" placeholder="e.g., Dragon Storm, Elf Tribal" size="lg" class="w-full" />
        </UFormField>

        <UFormField label="Commander" name="commander" required help="Type at least 3 letters to search for commanders">
          <UInputMenu v-model="deckForm.commander" v-model:search-term="commanderSearchTerm"
            :items="commanderSuggestions" :loading="isSearchingCommanders" value-key="value"
            placeholder="e.g., Lathril, Blade of the Elves" size="lg" class="w-full" />
        </UFormField>

        <UFormField label="Color Identity" name="colors" help="Select all colors in your commander's color identity">
          <UCheckboxGroup v-model="deckForm.colors" :items="availableColors" class="w-full" />
        </UFormField>

        <UFormField label="Decklist" name="decklistText" required help="Paste your decklist from Moxfield, MTGGoldfish, or Archidekt. Format: '1 Card Name' per line">
          <UTextarea v-model="deckForm.decklistText" placeholder="1 Sol Ring&#10;1 Command Tower&#10;1 Arcane Signet&#10;..." :rows="8" resize
            class="w-full font-mono text-sm" />
        </UFormField>

        <UFormField label="External Decklist URL" name="decklistUrl"
          help="Optional: Link to your deck on Moxfield, Archidekt, or other deck builder">
          <UInput v-model="deckForm.decklistUrl" placeholder="https://www.moxfield.com/decks/..." size="lg"
            class="w-full" />
        </UFormField>

        <UFormField label="Deck Description" name="description"
          help="Optional: Describe your deck's strategy and playstyle">
          <UTextarea v-model="deckForm.description" placeholder="This deck focuses on..." :rows="3" resize
            class="w-full" />
        </UFormField>
      </UForm>
    </template>

    <template #footer>
      <UButton variant="outline" color="neutral" @click="$emit('update:isOpen', false)" :disabled="isSubmitting">
        Cancel
      </UButton>
      <UButton @click="handleSubmit" :loading="isSubmitting" class="add-deck-submit-button">
        {{ mode === 'create' ? 'Add Deck' : 'Save Changes' }}
      </UButton>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Deck, Season } from '~/types'

interface Props {
  isOpen: boolean
  mode: 'create' | 'edit'
  deck?: Deck | null
  activeSeason: Season | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:isOpen': [value: boolean]
  'submit': [deckData: Partial<Deck>]
}>()

const { searchCommanders } = useScryfall()
const toast = useToast()

const deckForm = reactive({
  name: '',
  commander: '',
  colors: [] as string[],
  decklistText: '',
  decklistUrl: '',
  description: ''
})

const availableColors = [
  { label: 'White (W)', value: 'white' },
  { label: 'Blue (U)', value: 'blue' },
  { label: 'Black (B)', value: 'black' },
  { label: 'Red (R)', value: 'red' },
  { label: 'Green (G)', value: 'green' },
  { label: 'Colorless (C)', value: 'colorless' }
]

const commanderSuggestions = ref<Array<{ label: string; value: string }>>([])
const commanderSearchTerm = ref('')
const isSearchingCommanders = ref(false)
const isSubmitting = ref(false)
let searchTimeout: NodeJS.Timeout | null = null

// Watch for changes in commander search term
watch(commanderSearchTerm, async (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  if (!newValue || newValue.trim().length < 3) {
    commanderSuggestions.value = []
    isSearchingCommanders.value = false
    return
  }

  if (newValue === deckForm.commander) {
    isSearchingCommanders.value = false
    return
  }

  isSearchingCommanders.value = true

  searchTimeout = setTimeout(async () => {
    try {
      const results = await searchCommanders(newValue)
      commanderSuggestions.value = results
    } catch (error) {
      console.error('Error searching commanders:', error)
      commanderSuggestions.value = []
    } finally {
      isSearchingCommanders.value = false
    }
  }, 300)
})

// Pre-fill form when editing
watch(() => props.deck, (newDeck) => {
  if (newDeck && props.mode === 'edit') {
    deckForm.name = newDeck.name
    deckForm.commander = newDeck.commander
    deckForm.colors = [...newDeck.colors]
    deckForm.decklistText = newDeck.decklistText || ''
    deckForm.decklistUrl = newDeck.moxfieldUrl || ''
    deckForm.description = newDeck.description || ''
  }
}, { immediate: true })

// Reset form when modal closes in create mode
watch(() => props.isOpen, (newValue) => {
  if (!newValue && props.mode === 'create') {
    deckForm.name = ''
    deckForm.commander = ''
    deckForm.colors = []
    deckForm.decklistText = ''
    deckForm.decklistUrl = ''
    deckForm.description = ''
  }
})

const validateDeck = (state: typeof deckForm) => {
  const errors = []

  if (!state.name || state.name.trim().length < 2) {
    errors.push({ name: 'name', message: 'Deck name must be at least 2 characters' })
  }

  if (!state.commander || state.commander.trim().length < 2) {
    errors.push({ name: 'commander', message: 'Commander name is required' })
  }

  if (!state.decklistText || state.decklistText.trim() === '') {
    errors.push({ name: 'decklistText', message: 'Decklist is required. Paste your decklist from a deck builder.' })
  } else {
    // Basic validation: check if there are at least a few lines that look like cards
    const lines = state.decklistText.split('\n').filter(line => line.trim().length > 0)
    if (lines.length < 5) {
      errors.push({ name: 'decklistText', message: 'Decklist seems too short. Please paste a complete decklist.' })
    }
  }

  // Optional URL validation
  if (state.decklistUrl && state.decklistUrl.trim() !== '') {
    try {
      new URL(state.decklistUrl)
    } catch {
      errors.push({ name: 'decklistUrl', message: 'Please enter a valid URL (e.g., https://www.moxfield.com/decks/...)' })
    }
  }

  return errors
}

const handleSubmit = async () => {
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
    emit('submit', {
      name: deckForm.name,
      commander: deckForm.commander,
      colors: deckForm.colors,
      decklistText: deckForm.decklistText,
      moxfieldUrl: deckForm.decklistUrl || '',
      description: deckForm.description || ''
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

.add-deck-submit-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}
</style>
