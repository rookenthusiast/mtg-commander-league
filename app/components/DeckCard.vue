<template>
  <UCard class="hover:shadow-lg transition-shadow cursor-pointer" @click="$emit('click', deck)">
    <div class="space-y-3">
      <!-- Deck Name -->
      <div>
        <h3 class="text-lg font-bold truncate">{{ deck.name }}</h3>
        <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
          Commander: {{ deck.commander }}
        </p>
      </div>

      <!-- Color Identity -->
      <div class="flex items-center gap-2">
        <span
          v-for="color in deck.colors"
          :key="color"
          class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
          :class="getColorClasses(color)"
          :title="color"
        >
          {{ getColorSymbol(color) }}
        </span>
        <span v-if="deck.colors.length === 0" class="text-xs text-gray-500">
          Colorless
        </span>
      </div>

      <!-- Stats -->
      <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
        <div class="text-sm">
          <span class="font-semibold">Budget:</span>
          <span class="text-primary ml-1">${{ deck.budget }}</span>
        </div>
        <div class="text-sm">
          <span class="font-semibold">Record:</span>
          <span class="ml-1">{{ deck.wins }}-{{ deck.games - deck.wins }}</span>
        </div>
      </div>

      <!-- Owner -->
      <div class="text-xs text-gray-500 dark:text-gray-400">
        Owner: {{ deck.owner }}
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Deck, MTGColor } from '~/types'

interface Props {
  deck: Deck
}

defineProps<Props>()
defineEmits<{
  click: [deck: Deck]
}>()

const getColorClasses = (color: string): string => {
  const colorMap: Record<string, string> = {
    white: 'bg-gray-100 border-2 border-gray-300 text-gray-700',
    blue: 'bg-blue-500 text-white',
    black: 'bg-gray-900 text-white border-2 border-gray-600',
    red: 'bg-red-500 text-white',
    green: 'bg-green-500 text-white',
    colorless: 'bg-gray-400 text-white'
  }
  return colorMap[color.toLowerCase()] || 'bg-gray-300 text-gray-700'
}

const getColorSymbol = (color: string): string => {
  const symbolMap: Record<string, string> = {
    white: 'W',
    blue: 'U',
    black: 'B',
    red: 'R',
    green: 'G',
    colorless: 'C'
  }
  return symbolMap[color.toLowerCase()] || '?'
}
</script>
