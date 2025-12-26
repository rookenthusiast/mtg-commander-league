<template>
  <div class="leaderboard-page">
    <!-- Hero Section -->
    <UCard variant="soft" class="hero-card">
      <div class="flex items-center gap-6">
        <div class="hidden md:block">
          <div class="trophy-icon">🏆</div>
        </div>
        <div>
          <h1 class="hero-title">Season Leaderboard</h1>
          <p class="hero-subtitle">Compete for glory in the Lorwyn Commander League</p>
        </div>
      </div>
    </UCard>

    <!-- League Stats -->
    <div class="stats-grid">
      <UCard variant="soft" class="stats-card">
        <div class="stat-label">Total Players</div>
        <div class="stat-value">{{ leagueStats.totalPlayers }}</div>
        <div class="stat-trend">Active this season</div>
      </UCard>

      <UCard variant="soft" class="stats-card">
        <div class="stat-label">Games Played</div>
        <div class="stat-value">{{ leagueStats.totalGames }}</div>
      </UCard>

      <UCard variant="soft" class="stats-card">
        <div class="stat-label">Avg. Win Rate</div>
        <div class="stat-value">{{ leagueStats.avgWinRate }}%</div>
      </UCard>
    </div>

    <!-- Filters -->
    <div class="filters-bar">
      <USelect v-model="selectedSeason" :options="seasons" option-attribute="label" value-attribute="value"
        placeholder="Select Season" class="w-48" />
      <div class="flex gap-2">
        <UButton variant="outline" @click="toggleTestData">
          {{ useTestData ? 'Use Real Data' : 'Use Test Data' }}
        </UButton>
        <UButton variant="outline" @click="refreshLeaderboard" icon="i-heroicons-arrow-path">
          Refresh
        </UButton>
      </div>
    </div>

    <!-- Top 3 Podium -->
    <div v-if="topThree.length > 0" class="podium-section">
      <h2 class="section-title">🏅 Champions Podium 🏅</h2>

      <div class="podium-grid">
        <!-- 2nd Place -->
        <UCard variant="soft" v-if="topThree[1]" class="podium-card second-place">
          <div class="rank-badge silver">2</div>
          <div class="avatar-wrapper">
            <div class="avatar silver-avatar">{{ topThree[1].name.charAt(0) }}</div>
          </div>
          <div class="player-name">{{ topThree[1].name }}</div>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">{{ topThree[1].wins }}</div>
              <div class="stat-label-small">Wins</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ topThree[1].points }}</div>
              <div class="stat-label-small">Points</div>
            </div>
          </div>
          <div class="win-rate-display">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: topThree[1].winRate + '%' }"></div>
            </div>
            <span class="rate-text">{{ topThree[1].winRate }}% Win Rate</span>
          </div>
        </UCard>

        <!-- 1st Place -->
        <UCard variant="soft" v-if="topThree[0]" class="podium-card first-place">
          <div class="rank-badge gold">👑</div>
          <div class="avatar-wrapper">
            <div class="avatar gold-avatar">{{ topThree[0].name.charAt(0) }}</div>
          </div>
          <div class="player-name champion">{{ topThree[0].name }}</div>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">{{ topThree[0].wins }}</div>
              <div class="stat-label-small">Wins</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ topThree[0].points }}</div>
              <div class="stat-label-small">Points</div>
            </div>
          </div>
          <div class="win-rate-display">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: topThree[0].winRate + '%' }"></div>
            </div>
            <span class="rate-text">{{ topThree[0].winRate }}% Win Rate</span>
          </div>
        </UCard>

        <!-- 3rd Place -->
        <UCard variant="soft" v-if="topThree[2]" class="podium-card third-place">
          <div class="rank-badge bronze">3</div>
          <div class="avatar-wrapper">
            <div class="avatar bronze-avatar">{{ topThree[2].name.charAt(0) }}</div>
          </div>
          <div class="player-name">{{ topThree[2].name }}</div>
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-number">{{ topThree[2].wins }}</div>
              <div class="stat-label-small">Wins</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">{{ topThree[2].points }}</div>
              <div class="stat-label-small">Points</div>
            </div>
          </div>
          <div class="win-rate-display">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: topThree[2].winRate + '%' }"></div>
            </div>
            <span class="rate-text">{{ topThree[2].winRate }}% Win Rate</span>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Full Leaderboard Table -->
    <div v-if="remainingPlayers.length > 0" class="table-section">
      <h2 class="section-title">All Competitors</h2>

      <!-- Desktop Table View -->
      <UCard variant="soft" class="hidden md:block table-card">
        <UTable :data="remainingPlayers" :columns="tableColumns" class="leaderboard-table" :ui="{
          tbody: 'divide-y divide-shadowmoor-purple-700/40',
          th: 'text-white font-semibold',
          td: 'text-white',
        }">
          <template #rank-data="{ row }">
            <span class="rank-number">#{{ row.rank }}</span>
          </template>

          <template #name-data="{ row }">
            <div class="player-info">
              <div class="player-avatar-small">{{ row.name.charAt(0) }}</div>
              <span class="player-name-text">{{ row.name }}</span>
            </div>
          </template>

          <template #winRate-data="{ row }">
            <div class="win-rate-column">
              <div class="mini-progress-bar">
                <div class="mini-progress-fill" :style="{ width: row.winRate + '%' }"></div>
              </div>
              <span class="percentage-text">{{ row.winRate }}%</span>
            </div>
          </template>

          <template #points-data="{ row }">
            <span class="points-value">{{ row.points }}</span>
          </template>
        </UTable>
      </UCard>

      <!-- Mobile Card View -->
      <div class="md:hidden mobile-leaderboard-grid">
        <UCard variant="soft" v-for="player in remainingPlayers" :key="player.id" class="mobile-player-card">
          <div class="mobile-card-header">
            <div class="flex items-center gap-3">
              <div class="mobile-rank-badge">#{{ player.rank }}</div>
              <div class="mobile-avatar">{{ player.name.charAt(0) }}</div>
              <div class="mobile-player-name">{{ player.name }}</div>
            </div>
          </div>

          <div class="mobile-stats-grid">
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Games</span>
              <span class="mobile-stat-value">{{ player.games }}</span>
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Wins</span>
              <span class="mobile-stat-value">{{ player.wins }}</span>
            </div>
            <div class="mobile-stat-item">
              <span class="mobile-stat-label">Points</span>
              <span class="mobile-stat-value mobile-points">{{ player.points }}</span>
            </div>
          </div>

          <div class="mobile-win-rate">
            <span class="mobile-stat-label mb-2">Win Rate</span>
            <div class="mobile-progress-wrapper">
              <div class="mobile-progress-bar">
                <div class="mobile-progress-fill" :style="{ width: player.winRate + '%' }"></div>
              </div>
              <span class="mobile-percentage">{{ player.winRate }}%</span>
            </div>
          </div>
        </UCard>
      </div>
    </div>

    <!-- Empty State -->
    <UCard variant="soft" v-if="leaderboard.length === 0" class="empty-state-card">
      <div class="empty-content">
        <div class="empty-icon">⚔️</div>
        <h3 class="empty-title">No Rankings Yet</h3>
        <p class="empty-description">
          The season has just begun. Play your first game to appear on the leaderboard!
        </p>
        <UButton to="/submit-game" size="lg" class="mt-6">
          Submit Your First Game
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { getDocuments, orderBy } = useFirestore()

const selectedSeason = ref('current')
const seasons = [
  { label: 'Current Season', value: 'current' },
  { label: '2024 Season 1', value: '2024-season-1' },
  { label: '2024 Season 2', value: '2024-season-2' }
]
const useTestData = ref(true) // Start with test data to show dummy data

interface Player {
  id: string
  name: string
  wins: number
  games: number
  points: number
}

const leaderboard = ref<Player[]>([])
const leagueStats = ref({
  totalPlayers: 0,
  totalGames: 0,
  avgWinRate: 0
})

// Mock test data
const mockPlayers: Player[] = [
  { id: '1', name: 'Aragorn the Ranger', wins: 28, games: 45, points: 142 },
  { id: '2', name: 'Gandalf the Grey', wins: 25, games: 42, points: 135 },
  { id: '3', name: 'Galadriel of Lothlórien', wins: 22, games: 38, points: 128 },
  { id: '4', name: 'Elrond Half-elven', wins: 20, games: 40, points: 118 },
  { id: '5', name: 'Thranduil the Elvenking', wins: 18, games: 35, points: 110 },
  { id: '6', name: 'Círdan the Shipwright', wins: 17, games: 36, points: 105 },
  { id: '7', name: 'Glorfindel of Rivendell', wins: 15, games: 32, points: 98 },
  { id: '8', name: 'Celeborn the Wise', wins: 14, games: 30, points: 92 },
  { id: '9', name: 'Gil-galad the High King', wins: 13, games: 28, points: 87 },
  { id: '10', name: 'Finrod Felagund', wins: 12, games: 27, points: 82 },
  { id: '11', name: 'Lúthien Tinúviel', wins: 11, games: 25, points: 78 },
  { id: '12', name: 'Beren One-hand', wins: 10, games: 24, points: 74 },
  { id: '13', name: 'Fëanor the Smith', wins: 9, games: 22, points: 69 },
  { id: '14', name: 'Fingolfin the Valiant', wins: 8, games: 20, points: 64 },
  { id: '15', name: 'Túrin Turambar', wins: 7, games: 18, points: 58 }
]

const tableColumns = [
  {
    id: 'rank',
    header: 'Rank',
    accessorKey: 'rank'
  },
  {
    id: 'name',
    header: 'Player',
    accessorKey: 'name'
  },
  {
    id: 'games',
    header: 'Games',
    accessorKey: 'games'
  },
  {
    id: 'wins',
    header: 'Wins',
    accessorKey: 'wins'
  },
  {
    id: 'winRate',
    header: 'Win Rate',
    accessorKey: 'winRate'
  },
  {
    id: 'points',
    header: 'Points',
    accessorKey: 'points'
  }
]

const topThree = computed(() => {
  return leaderboard.value.slice(0, 3).map((player: Player) => ({
    ...player,
    winRate: player.games > 0 ? ((player.wins / player.games) * 100).toFixed(1) : '0.0'
  }))
})

const remainingPlayers = computed(() => {
  return leaderboard.value.slice(3).map((player: Player, index: number) => ({
    ...player,
    rank: index + 4,
    winRate: player.games > 0 ? ((player.wins / player.games) * 100).toFixed(1) : '0.0'
  }))
})

const calculateStats = (players: Player[]) => {
  const totalGames = players.reduce((sum: number, p: Player) => sum + p.games, 0)
  const totalWins = players.reduce((sum: number, p: Player) => sum + p.wins, 0)

  leagueStats.value = {
    totalPlayers: players.length,
    totalGames: totalGames,
    avgWinRate: totalGames > 0 ? parseFloat(((totalWins / totalGames) * 100).toFixed(1)) : 0
  }
}

const loadTestData = () => {
  leaderboard.value = [...mockPlayers]
  calculateStats(mockPlayers)
}

const toggleTestData = () => {
  useTestData.value = !useTestData.value
  if (useTestData.value) {
    loadTestData()
  } else {
    refreshLeaderboard()
  }
}

const refreshLeaderboard = async () => {
  if (useTestData.value) {
    loadTestData()
    return
  }

  try {
    const players = await getDocuments('players', [
      orderBy('points', 'desc')
    ])

    leaderboard.value = players.map((player: any) => ({
      id: player.id,
      name: player.displayName,
      wins: player.wins || 0,
      games: player.gamesPlayed || 0,
      points: player.points || 0
    }))

    calculateStats(leaderboard.value)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
  }
}

// Load test data on mount to show dummy data immediately
onMounted(() => {
  if (useTestData.value) {
    loadTestData()
  } else {
    refreshLeaderboard()
  }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE ================= */

.leaderboard-page {
  @apply min-h-screen py-8 px-4 space-y-8 max-w-7xl mx-auto;
}

/* ================= HERO CARD ================= */

.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.trophy-icon {
  @apply text-6xl;
}

.hero-title {
  @apply text-4xl md:text-5xl font-black text-white mb-2;
}

.hero-subtitle {
  @apply text-lg md:text-xl text-twilight-blue-200 font-medium;
}

/* ================= STATS GRID ================= */

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.stats-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl;
}

.stat-label {
  @apply text-sm font-semibold text-twilight-blue-300 uppercase tracking-wider mb-2;
}

.stat-value {
  @apply text-4xl md:text-5xl font-black bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent;
}

.stat-trend {
  @apply text-sm text-twilight-blue-200 font-medium mt-1;
}

/* ================= FILTERS BAR ================= */

.filters-bar {
  @apply flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4;
}

/* ================= SECTION TITLE ================= */

.section-title {
  @apply text-3xl md:text-4xl font-black text-center mb-8 bg-linear-to-r from-lorwyn-gold-400 via-shadowmoor-magenta-400 to-shadowmoor-purple-500 bg-clip-text text-transparent;
}

/* ================= PODIUM ================= */

.podium-section {
  @apply flex flex-col gap-4;
}

.podium-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6;
}

.podium-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl text-center space-y-4 relative;
}

.first-place {
  @apply md:order-2 md:scale-110 md:-translate-y-4;
}

.second-place {
  @apply md:order-1;
}

.third-place {
  @apply md:order-3;
}

.rank-badge {
  @apply absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-black text-xl shadow-lg;
}

.rank-badge.gold {
  @apply bg-linear-to-br from-lorwyn-gold-400 to-lorwyn-gold-600 text-shadowmoor-purple-950;
}

.rank-badge.silver {
  @apply bg-linear-to-br from-gray-300 to-gray-500 text-gray-900;
}

.rank-badge.bronze {
  @apply bg-linear-to-br from-orange-400 to-orange-600 text-white;
}

.avatar-wrapper {
  @apply flex justify-center;
}

.avatar {
  @apply w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black;
}

.gold-avatar {
  @apply bg-linear-to-br from-lorwyn-gold-400 to-lorwyn-gold-600 text-shadowmoor-purple-950;
}

.silver-avatar {
  @apply bg-linear-to-br from-gray-300 to-gray-500 text-gray-900;
}

.bronze-avatar {
  @apply bg-linear-to-br from-orange-400 to-orange-600 text-white;
}

.player-name {
  @apply text-2xl font-black text-white;
}

.player-name.champion {
  @apply text-transparent bg-clip-text bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400;
}

.stats-row {
  @apply flex justify-center gap-8;
}

.stat-item {
  @apply text-center;
}

.stat-number {
  @apply text-3xl font-black text-white;
}

.stat-label-small {
  @apply text-xs uppercase text-twilight-blue-300 font-semibold tracking-wider;
}

.win-rate-display {
  @apply space-y-2;
}

.progress-bar {
  @apply w-full h-3 bg-shadowmoor-purple-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 transition-all duration-500;
}

.rate-text {
  @apply text-sm font-semibold text-twilight-blue-200;
}

/* ================= TABLE ================= */

.table-section {
  @apply space-y-6;
}

.table-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl overflow-hidden;
}

.rank-number {
  @apply text-lg font-bold text-white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.player-info {
  @apply flex items-center gap-3;
}

.player-avatar-small {
  @apply w-10 h-10 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold shadow-lg;
}

.player-name-text {
  @apply font-semibold text-white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.win-rate-column {
  @apply flex items-center gap-3;
}

.mini-progress-bar {
  @apply w-24 h-2.5 bg-shadowmoor-purple-900/70 rounded-full overflow-hidden backdrop-blur-sm;
}

.mini-progress-fill {
  @apply h-full bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 shadow-lg;
}

.percentage-text {
  @apply text-sm font-bold text-white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.points-value {
  @apply text-lg font-black text-transparent bg-clip-text bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
}

/* Fallback for browsers that don't support bg-clip-text */
@supports not (background-clip: text) {
  .points-value {
    @apply text-lorwyn-gold-400;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  }
}

/* ================= MOBILE LEADERBOARD ================= */

.mobile-leaderboard-grid {
  @apply space-y-4;
}

.mobile-player-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.02];
}

.mobile-card-header {
  @apply pb-4;
}

.mobile-rank-badge {
  @apply px-3 py-1 rounded-full bg-linear-to-r from-shadowmoor-purple-700/50 to-twilight-blue-800/50 text-twilight-blue-200 font-bold text-sm backdrop-blur-sm;
}

.mobile-avatar {
  @apply w-12 h-12 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold text-lg shadow-lg;
}

.mobile-player-name {
  @apply font-bold text-white text-lg flex-1;
}

.mobile-stats-grid {
  @apply grid grid-cols-3 gap-4 py-4;
}

.mobile-stat-item {
  @apply text-center space-y-1;
}

.mobile-stat-label {
  @apply text-xs uppercase text-twilight-blue-300 font-semibold tracking-wider block;
}

.mobile-stat-value {
  @apply text-2xl font-black text-white block;
}

.mobile-points {
  @apply text-transparent bg-clip-text bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400;
}

.mobile-win-rate {
  @apply pt-4 space-y-2;
}

.mobile-progress-wrapper {
  @apply flex items-center gap-3;
}

.mobile-progress-bar {
  @apply flex-1 h-3 bg-shadowmoor-purple-700/50 rounded-full overflow-hidden backdrop-blur-sm;
}

.mobile-progress-fill {
  @apply h-full bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 shadow-lg;
}

.mobile-percentage {
  @apply text-sm font-bold text-twilight-blue-200 min-w-12 text-right;
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
</style>
