<template>
  <UCard>
    <div class="flex items-center space-x-4">
      <div class="flex-shrink-0">
        <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">
          {{ initials }}
        </div>
      </div>

      <div class="flex-1 min-w-0">
        <p class="text-lg font-semibold truncate">
          {{ player.displayName }}
        </p>
        <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{{ player.wins }} wins</span>
          <span>•</span>
          <span>{{ player.games }} games</span>
          <span>•</span>
          <span>{{ winRate }}% win rate</span>
        </div>
      </div>

      <div class="text-right">
        <div class="text-2xl font-bold text-primary">
          {{ player.points }}
        </div>
        <div class="text-xs text-gray-500">points</div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import type { Player } from '~/types'

interface Props {
  player: Player
}

const props = defineProps<Props>()

const initials = computed(() => {
  const names = props.player.displayName.split(' ')
  if (names.length >= 2) {
    return `${names[0][0]}${names[1][0]}`.toUpperCase()
  }
  return props.player.displayName.substring(0, 2).toUpperCase()
})

const winRate = computed(() => {
  if (props.player.games === 0) return 0
  return ((props.player.wins / props.player.games) * 100).toFixed(1)
})
</script>
