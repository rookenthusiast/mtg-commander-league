<template>
  <div class="admin-page">
    <!-- Loading State -->
    <UCard v-if="isLoadingData" variant="soft" class="loading-card">
      <div class="loading-content">
        <div class="loading-spinner" />
        <p class="loading-text">Loading admin dashboard...</p>
      </div>
    </UCard>

    <!-- Admin Dashboard -->
    <div v-else class="admin-dashboard">
      <!-- Hero Header -->
      <UCard variant="soft" class="hero-card">
        <div class="flex items-center gap-6">
          <div class="hidden md:block">
            <div class="admin-icon">⚙️</div>
          </div>
          <div class="flex-1">
            <h1 class="hero-title">Admin Dashboard</h1>
            <p class="hero-subtitle">Manage users, seasons, and league settings</p>
          </div>
        </div>
      </UCard>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <UCard variant="soft" class="stats-card">
          <div class="stat-label">Total Users</div>
          <div class="stat-value">{{ users.length }}</div>
        </UCard>

        <UCard variant="soft" class="stats-card">
          <div class="stat-label">Administrators</div>
          <div class="stat-value">{{ adminCount }}</div>
        </UCard>

        <UCard variant="soft" class="stats-card">
          <div class="stat-label">Active Seasons</div>
          <div class="stat-value">{{ activeSeasonCount }}</div>
        </UCard>

        <UCard variant="soft" class="stats-card">
          <div class="stat-label">Total Seasons</div>
          <div class="stat-value">{{ totalSeasonCount }}</div>
        </UCard>
      </div>

      <!-- User Management Section -->
      <UCard variant="soft" class="section-card">
        <div class="section-header">
          <h2 class="section-title">User Management</h2>
          <UButton
            icon="i-heroicons-arrow-path"
            variant="outline"
            @click="refreshUsers"
            :loading="isLoadingUsers"
          >
            Refresh
          </UButton>
        </div>

        <!-- Users Table (Desktop) -->
        <div class="hidden md:block">
          <UTable
            :data="users"
            :columns="userColumns"
            class="users-table"
            :ui="{
              tbody: 'divide-y divide-shadowmoor-purple-700/40',
              th: 'text-white font-semibold',
              td: 'text-white',
            }"
          >
            <template #email-cell="{ row }">
              <span class="user-email">{{ row.original.email }}</span>
            </template>

            <template #displayName-cell="{ row }">
              <div class="user-info">
                <div class="user-avatar">{{ row.original.displayName.charAt(0).toUpperCase() }}</div>
                <span class="user-name">{{ row.original.displayName }}</span>
              </div>
            </template>

            <template #isAdmin-cell="{ row }">
              <UBadge
                :color="row.original.isAdmin ? 'success' : 'neutral'"
                variant="soft"
                class="admin-badge"
              >
                {{ row.original.isAdmin ? 'Admin' : 'User' }}
              </UBadge>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="date-text">{{ formatDate(row.original.createdAt) }}</span>
            </template>

            <template #actions-cell="{ row }">
              <div class="action-buttons">
                <!-- Role Management -->
                <UButton
                  v-if="!row.original.isAdmin"
                  size="sm"
                  color="success"
                  variant="soft"
                  icon="i-heroicons-arrow-up"
                  @click="handlePromoteUser(row.original)"
                  :disabled="isUpdatingUser"
                >
                  Promote
                </UButton>
                <UButton
                  v-else-if="row.original.id !== user?.uid"
                  size="sm"
                  color="warning"
                  variant="soft"
                  icon="i-heroicons-arrow-down"
                  @click="handleDemoteUser(row.original)"
                  :disabled="isUpdatingUser"
                >
                  Demote
                </UButton>

                <!-- Delete User -->
                <UButton
                  v-if="row.original.id !== user?.uid"
                  size="sm"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-trash"
                  @click="handleDeleteUser(row.original)"
                  :disabled="isDeletingUser"
                >
                  Delete
                </UButton>

                <!-- Current User Badge -->
                <UBadge
                  v-if="row.original.id === user?.uid"
                  color="primary"
                  variant="soft"
                  size="sm"
                >
                  You
                </UBadge>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Users Cards (Mobile) -->
        <div class="md:hidden space-y-4">
          <UCard
            v-for="userItem in users"
            :key="userItem.id"
            variant="soft"
            class="user-mobile-card"
          >
            <div class="mobile-user-header">
              <div class="user-avatar-large">{{ userItem.displayName.charAt(0).toUpperCase() }}</div>
              <div class="flex-1">
                <h3 class="mobile-user-name">{{ userItem.displayName }}</h3>
                <p class="mobile-user-email">{{ userItem.email }}</p>
              </div>
              <UBadge
                :color="userItem.isAdmin ? 'success' : 'neutral'"
                variant="soft"
              >
                {{ userItem.isAdmin ? 'Admin' : 'User' }}
              </UBadge>
            </div>

            <div class="mobile-user-footer">
              <span class="mobile-date">Joined {{ formatDate(userItem.createdAt) }}</span>
              <div class="flex gap-2">
                <UButton
                  v-if="!userItem.isAdmin && userItem.id !== user?.uid"
                  size="sm"
                  color="success"
                  variant="soft"
                  icon="i-heroicons-arrow-up"
                  @click="handlePromoteUser(userItem)"
                  :disabled="isUpdatingUser"
                >
                  Promote
                </UButton>
                <UButton
                  v-else-if="userItem.isAdmin && userItem.id !== user?.uid"
                  size="sm"
                  color="warning"
                  variant="soft"
                  icon="i-heroicons-arrow-down"
                  @click="handleDemoteUser(userItem)"
                  :disabled="isUpdatingUser"
                >
                  Demote
                </UButton>
                <UButton
                  v-if="userItem.id !== user?.uid"
                  size="sm"
                  color="error"
                  variant="soft"
                  icon="i-heroicons-trash"
                  @click="handleDeleteUser(userItem)"
                  :disabled="isDeletingUser"
                >
                  Delete
                </UButton>
                <UBadge
                  v-if="userItem.id === user?.uid"
                  color="primary"
                  variant="soft"
                >
                  You
                </UBadge>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Empty State -->
        <div v-if="users.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <p class="empty-text">No users found</p>
        </div>
      </UCard>

      <!-- Season Management Section -->
      <UCard variant="soft" class="section-card">
        <div class="section-header">
          <h2 class="section-title">Season Management</h2>
          <UButton
            icon="i-heroicons-plus"
            @click="showCreateSeasonModal = true"
          >
            Create New Season
          </UButton>
        </div>

        <div class="seasons-list space-y-3">
          <UCard
            v-for="season in seasons"
            :key="season.id"
            variant="soft"
            class="season-item"
            :class="{ 'active-season': season.isActive }"
          >
            <div class="season-header">
              <div class="flex-1">
                <h3 class="season-name">
                  {{ season.name }}
                  <UBadge v-if="season.isActive" color="success" variant="soft" class="ml-2">
                    Active
                  </UBadge>
                  <UBadge color="neutral" variant="soft" class="ml-2">
                    {{ seasonPlayerCounts[season.id] || 0 }} Players
                  </UBadge>
                </h3>
                <p class="season-dates">
                  {{ formatDate(season.startDate) }} - {{ season.endDate ? formatDate(season.endDate) : 'Ongoing' }}
                </p>
                <p v-if="season.description" class="season-description">{{ season.description }}</p>
              </div>
              <div class="season-actions">
                <UButton
                  size="sm"
                  variant="outline"
                  icon="i-heroicons-users"
                  @click="toggleSeasonPlayers(season.id)"
                >
                  {{ expandedSeasonId === season.id ? 'Hide' : 'View' }} Players
                </UButton>
                <UButton
                  v-if="!season.isActive"
                  size="sm"
                  variant="soft"
                  @click="handleSetActiveSeason(season)"
                >
                  Set as Active
                </UButton>
                <UButton
                  v-if="season.isActive"
                  size="sm"
                  color="warning"
                  variant="soft"
                  @click="handleEndSeason(season)"
                >
                  End Season
                </UButton>
              </div>
            </div>

            <!-- Registered Players List (Expandable) -->
            <div v-if="expandedSeasonId === season.id" class="registered-players-section">
              <div v-if="isLoadingPlayers" class="players-loading">
                <div class="loading-spinner-small" />
                <span>Loading players...</span>
              </div>

              <div v-else-if="seasonPlayers.length === 0" class="no-players">
                <p class="text-twilight-blue-300 text-sm">No players registered for this season</p>
              </div>

              <div v-else class="players-list">
                <div
                  v-for="player in seasonPlayers"
                  :key="player.id"
                  class="player-registration-item"
                >
                  <div class="player-reg-info">
                    <div class="player-reg-avatar">{{ player.displayName.charAt(0).toUpperCase() }}</div>
                    <div class="flex-1">
                      <div class="player-reg-name">{{ player.displayName }}</div>
                      <div class="player-reg-stats">
                        {{ player.gamesPlayed }} games • {{ player.wins }}W-{{ player.losses }}L • {{ player.points }} pts
                      </div>
                    </div>
                  </div>
                  <UButton
                    size="sm"
                    color="error"
                    variant="soft"
                    icon="i-heroicons-user-minus"
                    @click="handleDeregisterPlayer(player, season.id)"
                    :disabled="isDeregisteringPlayer"
                  >
                    Deregister
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Empty State -->
        <div v-if="seasons.length === 0" class="empty-state">
          <div class="empty-icon">📅</div>
          <p class="empty-text">No seasons found</p>
        </div>
      </UCard>
    </div>

    <!-- Delete User Confirmation Modal -->
    <UModal
      v-model:open="showDeleteConfirmModal"
      :ui="{ footer: 'flex justify-end gap-3' }"
    >
      <template #body>
        <div class="space-y-4">
          <div class="text-center">
            <div class="text-6xl mb-4">⚠️</div>
            <h3 class="text-2xl font-black text-white mb-2">Delete User?</h3>
            <p class="text-twilight-blue-300">
              Are you sure you want to delete <strong class="text-white">{{ userToDelete?.displayName }}</strong>?
            </p>
          </div>

          <div class="bg-shadowmoor-purple-800/40 rounded-lg p-4 space-y-2 text-sm">
            <p class="text-twilight-blue-200 font-semibold">This will permanently delete:</p>
            <ul class="list-disc list-inside space-y-1 text-twilight-blue-300">
              <li>User account</li>
              <li>All their decks</li>
              <li>Season statistics</li>
              <li>Player profile</li>
            </ul>
            <p class="text-lorwyn-gold-400 font-semibold mt-3">✓ Game history will be preserved</p>
          </div>

          <div class="bg-error/20 border border-error rounded-lg p-3">
            <p class="text-error text-sm font-semibold">
              ⚠️ This action cannot be undone!
            </p>
          </div>
        </div>
      </template>

      <template #footer>
        <UButton
          variant="outline"
          color="neutral"
          @click="showDeleteConfirmModal = false"
          :disabled="isDeletingUser"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          @click="confirmDeleteUser"
          :loading="isDeletingUser"
        >
          Delete User
        </UButton>
      </template>
    </UModal>

    <!-- Create Season Modal -->
    <UModal
      v-model:open="showCreateSeasonModal"
      title="Create New Season"
      description="Start a new league season"
      :ui="{ footer: 'flex justify-end gap-3' }"
    >
      <template #body>
        <UForm :state="seasonForm" class="space-y-4" @submit="handleCreateSeason">
          <UFormField label="Season Name" name="name" required>
            <UInput
              v-model="seasonForm.name"
              placeholder="e.g., Bloomburrow Season"
              size="lg"
            />
          </UFormField>

          <UFormField label="Slug" name="slug" required help="URL-friendly identifier">
            <UInput
              v-model="seasonForm.slug"
              placeholder="e.g., bloomburrow-season"
              size="lg"
            />
          </UFormField>

          <UFormField label="Description" name="description">
            <UTextarea
              v-model="seasonForm.description"
              placeholder="Optional description of this season..."
              :rows="3"
            />
          </UFormField>

          <UFormField label="Start Date" name="startDate" required>
            <UInput
              v-model="seasonForm.startDate"
              type="date"
              size="lg"
            />
          </UFormField>

          <UFormField label="Set as Active Season" name="isActive">
            <UCheckbox
              v-model="seasonForm.isActive"
              label="This will be the active season"
            />
          </UFormField>
        </UForm>
      </template>

      <template #footer>
        <UButton
          variant="outline"
          color="neutral"
          @click="showCreateSeasonModal = false"
        >
          Cancel
        </UButton>
        <UButton
          @click="handleCreateSeason"
          :loading="isCreatingSeason"
        >
          Create Season
        </UButton>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import type { User, Season, PlayerSeason } from '~/types'

definePageMeta({
  middleware: 'admin'
})

const { user } = useAuth()
const { getAllUsers, promoteToAdmin, demoteFromAdmin } = useAdmin()
const { getAllSeasons, getRegisteredPlayers, deregisterPlayer } = useSeasons()
const { addDocument, updateDocument } = useFirestore()
const toast = useToast()

const users = ref<User[]>([])
const seasons = ref<Season[]>([])
const isLoadingData = ref(true)
const isLoadingUsers = ref(false)
const isUpdatingUser = ref(false)
const isDeletingUser = ref(false)

// Season players management
const expandedSeasonId = ref<string | null>(null)
const seasonPlayers = ref<PlayerSeason[]>([])
const seasonPlayerCounts = ref<Record<string, number>>({})
const isLoadingPlayers = ref(false)
const isDeregisteringPlayer = ref(false)
const showCreateSeasonModal = ref(false)
const isCreatingSeason = ref(false)
const showDeleteConfirmModal = ref(false)
const userToDelete = ref<User | null>(null)

const seasonForm = reactive({
  name: '',
  slug: '',
  description: '',
  startDate: new Date().toISOString().split('T')[0],
  isActive: false
})

const userColumns = [
  {
    id: 'displayName',
    header: 'Name',
    accessorKey: 'displayName'
  },
  {
    id: 'email',
    header: 'Email',
    accessorKey: 'email'
  },
  {
    id: 'isAdmin',
    header: 'Role',
    accessorKey: 'isAdmin'
  },
  {
    id: 'createdAt',
    header: 'Joined',
    accessorKey: 'createdAt'
  },
  {
    id: 'actions',
    header: 'Actions',
    accessorKey: 'actions'
  }
]

const adminCount = computed(() => users.value.filter(u => u.isAdmin).length)
const activeSeasonCount = computed(() => seasons.value.filter(s => s.isActive).length)
const totalSeasonCount = computed(() => seasons.value.length)

const formatDate = (dateValue: string | any) => {
  // Handle Firestore Timestamp objects
  if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
    return dateValue.toDate().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Handle ISO string dates
  const date = new Date(dateValue)
  if (isNaN(date.getTime())) {
    return 'Unknown'
  }

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const refreshUsers = async () => {
  isLoadingUsers.value = true
  try {
    users.value = await getAllUsers()
  } catch (error) {
    console.error('Error fetching users:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load users',
      color: 'error'
    })
  } finally {
    isLoadingUsers.value = false
  }
}

const handlePromoteUser = async (userToPromote: User) => {
  isUpdatingUser.value = true
  try {
    await promoteToAdmin(userToPromote.id)
    toast.add({
      title: 'User Promoted',
      description: `${userToPromote.displayName} is now an administrator`,
      color: 'success'
    })
    await refreshUsers()
  } catch (error) {
    console.error('Error promoting user:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to promote user',
      color: 'error'
    })
  } finally {
    isUpdatingUser.value = false
  }
}

const handleDemoteUser = async (userToDemote: User) => {
  if (userToDemote.id === user.value?.uid) {
    toast.add({
      title: 'Cannot Demote Yourself',
      description: 'You cannot remove your own admin privileges',
      color: 'warning'
    })
    return
  }

  isUpdatingUser.value = true
  try {
    await demoteFromAdmin(userToDemote.id)
    toast.add({
      title: 'User Demoted',
      description: `${userToDemote.displayName} is no longer an administrator`,
      color: 'success'
    })
    await refreshUsers()
  } catch (error) {
    console.error('Error demoting user:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to demote user',
      color: 'error'
    })
  } finally {
    isUpdatingUser.value = false
  }
}

const handleDeleteUser = (userItem: User) => {
  userToDelete.value = userItem
  showDeleteConfirmModal.value = true
}

const confirmDeleteUser = async () => {
  if (!userToDelete.value) return

  isDeletingUser.value = true
  try {
    const { $db } = useNuxtApp()
    const { collection, query, where, getDocs, deleteDoc, doc } = await import('firebase/firestore')

    const userId = userToDelete.value.id
    const userName = userToDelete.value.displayName

    // 1. Delete user's decks (they own them - no longer relevant)
    const decksRef = collection($db, 'decks')
    const decksQuery = query(decksRef, where('ownerId', '==', userId))
    const decksSnapshot = await getDocs(decksQuery)

    let deletedDecks = 0
    for (const deckDoc of decksSnapshot.docs) {
      await deleteDoc(doc($db, 'decks', deckDoc.id))
      deletedDecks++
    }

    // 2. Delete playerSeasons (stats are specific to this player)
    const playerSeasonsRef = collection($db, 'playerSeasons')
    const playerSeasonsQuery = query(playerSeasonsRef, where('playerId', '==', userId))
    const playerSeasonsSnapshot = await getDocs(playerSeasonsQuery)

    let deletedPlayerSeasons = 0
    for (const psDoc of playerSeasonsSnapshot.docs) {
      await deleteDoc(doc($db, 'playerSeasons', psDoc.id))
      deletedPlayerSeasons++
    }

    // 3. Delete player profile (but preserve game references)
    const playersRef = collection($db, 'players')
    const playersQuery = query(playersRef, where('userId', '==', userId))
    const playersSnapshot = await getDocs(playersQuery)

    for (const playerDoc of playersSnapshot.docs) {
      await deleteDoc(doc($db, 'players', playerDoc.id))
    }

    // 4. Delete user document
    await deleteDoc(doc($db, 'users', userId))

    toast.add({
      title: 'User Deleted',
      description: `${userName} and their data have been removed. ${deletedDecks} deck(s) and ${deletedPlayerSeasons} season record(s) deleted. Game history preserved.`,
      color: 'success'
    })

    // Refresh users list
    await refreshUsers()

    // Close modal
    showDeleteConfirmModal.value = false
    userToDelete.value = null
  } catch (error) {
    console.error('Error deleting user:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to delete user. Please try again.',
      color: 'error'
    })
  } finally {
    isDeletingUser.value = false
  }
}

const loadSeasons = async () => {
  try {
    seasons.value = await getAllSeasons()
  } catch (error) {
    console.error('Error loading seasons:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to load seasons',
      color: 'error'
    })
  }
}

const handleCreateSeason = async () => {
  if (!seasonForm.name || !seasonForm.slug || !seasonForm.startDate) {
    toast.add({
      title: 'Validation Error',
      description: 'Please fill in all required fields',
      color: 'error'
    })
    return
  }

  isCreatingSeason.value = true
  try {
    // If setting as active, deactivate all other seasons first
    if (seasonForm.isActive) {
      for (const season of seasons.value) {
        if (season.isActive) {
          await updateDocument('seasons', season.id, { isActive: false })
        }
      }
    }

    await addDocument('seasons', {
      name: seasonForm.name,
      slug: seasonForm.slug,
      description: seasonForm.description,
      startDate: seasonForm.startDate,
      endDate: null,
      isActive: seasonForm.isActive
    })

    toast.add({
      title: 'Season Created',
      description: `${seasonForm.name} has been created successfully`,
      color: 'success'
    })

    // Reset form and close modal
    seasonForm.name = ''
    seasonForm.slug = ''
    seasonForm.description = ''
    seasonForm.startDate = new Date().toISOString().split('T')[0]
    seasonForm.isActive = false
    showCreateSeasonModal.value = false

    // Reload seasons
    await loadSeasons()
  } catch (error) {
    console.error('Error creating season:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to create season',
      color: 'error'
    })
  } finally {
    isCreatingSeason.value = false
  }
}

const handleSetActiveSeason = async (season: Season) => {
  try {
    // Deactivate all other seasons
    for (const s of seasons.value) {
      if (s.isActive && s.id !== season.id) {
        await updateDocument('seasons', s.id, { isActive: false })
      }
    }

    // Activate this season
    await updateDocument('seasons', season.id, { isActive: true })

    toast.add({
      title: 'Season Activated',
      description: `${season.name} is now the active season`,
      color: 'success'
    })

    await loadSeasons()
  } catch (error) {
    console.error('Error setting active season:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to set active season',
      color: 'error'
    })
  }
}

const handleEndSeason = async (season: Season) => {
  try {
    await updateDocument('seasons', season.id, {
      isActive: false,
      endDate: new Date().toISOString()
    })

    toast.add({
      title: 'Season Ended',
      description: `${season.name} has been ended`,
      color: 'success'
    })

    await loadSeasons()
  } catch (error) {
    console.error('Error ending season:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to end season',
      color: 'error'
    })
  }
}

// Season Player Management
const loadSeasonPlayerCounts = async () => {
  try {
    const counts: Record<string, number> = {}
    for (const season of seasons.value) {
      const players = await getRegisteredPlayers(season.id)
      counts[season.id] = players.length
    }
    seasonPlayerCounts.value = counts
  } catch (error) {
    console.error('Error loading player counts:', error)
  }
}

const toggleSeasonPlayers = async (seasonId: string) => {
  if (expandedSeasonId.value === seasonId) {
    // Collapse
    expandedSeasonId.value = null
    seasonPlayers.value = []
  } else {
    // Expand and load players
    expandedSeasonId.value = seasonId
    isLoadingPlayers.value = true
    try {
      const players = await getRegisteredPlayers(seasonId)
      seasonPlayers.value = players
    } catch (error) {
      console.error('Error loading season players:', error)
      toast.add({
        title: 'Error',
        description: 'Failed to load registered players',
        color: 'error'
      })
    } finally {
      isLoadingPlayers.value = false
    }
  }
}

const handleDeregisterPlayer = async (player: PlayerSeason, seasonId: string) => {
  isDeregisteringPlayer.value = true
  try {
    await deregisterPlayer(player.playerId, seasonId)

    toast.add({
      title: 'Player Deregistered',
      description: `${player.displayName} has been removed from this season`,
      color: 'success'
    })

    // Reload players list
    const players = await getRegisteredPlayers(seasonId)
    seasonPlayers.value = players

    // Update player count
    seasonPlayerCounts.value[seasonId] = players.length
  } catch (error) {
    console.error('Error deregistering player:', error)
    toast.add({
      title: 'Error',
      description: 'Failed to deregister player',
      color: 'error'
    })
  } finally {
    isDeregisteringPlayer.value = false
  }
}

onMounted(async () => {
  // Middleware already checked admin status, so we can load data directly
  try {
    await refreshUsers()
    await loadSeasons()
    await loadSeasonPlayerCounts()
  } catch (error) {
    console.error('Error loading admin data:', error)
  } finally {
    isLoadingData.value = false
  }
})
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE ================= */

.admin-page {
  @apply min-h-screen py-8 px-4 max-w-7xl mx-auto;
}

/* ================= LOADING & ACCESS DENIED ================= */

.loading-card,
.access-denied-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.loading-content,
.access-denied-content {
  @apply text-center py-12 space-y-6;
}

.loading-spinner {
  @apply w-12 h-12 border-4 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin mx-auto;
}

.loading-text {
  @apply text-xl text-twilight-blue-200 font-medium;
}

.denied-icon {
  @apply text-6xl mb-4;
}

.denied-title {
  @apply text-3xl font-black text-white;
}

.denied-text {
  @apply text-twilight-blue-300 text-lg max-w-md mx-auto;
}

.back-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg;
}

/* ================= DASHBOARD ================= */

.admin-dashboard {
  @apply space-y-8;
}

/* ================= HERO CARD ================= */

.hero-card {
  @apply bg-linear-to-r from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.admin-icon {
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
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4;
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

/* ================= SECTION CARD ================= */

.section-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl;
}

.section-header {
  @apply flex items-center justify-between mb-6;
}

.section-title {
  @apply text-2xl md:text-3xl font-black text-white;
}

/* ================= USER TABLE ================= */

.user-email {
  @apply text-twilight-blue-200;
}

.user-info {
  @apply flex items-center gap-3;
}

.user-avatar {
  @apply w-10 h-10 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold shadow-lg;
}

.user-name {
  @apply font-semibold text-white;
}

.date-text {
  @apply text-twilight-blue-200 text-sm;
}

.action-buttons {
  @apply flex gap-2;
}

/* ================= MOBILE USER CARDS ================= */

.user-mobile-card {
  @apply bg-linear-to-br from-shadowmoor-purple-800/60 to-twilight-blue-800/60 backdrop-blur-sm;
}

.mobile-user-header {
  @apply flex items-start gap-3 mb-4;
}

.user-avatar-large {
  @apply w-12 h-12 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold text-lg shadow-lg;
}

.mobile-user-name {
  @apply text-lg font-bold text-white;
}

.mobile-user-email {
  @apply text-sm text-twilight-blue-300;
}

.mobile-user-footer {
  @apply flex items-center justify-between pt-3 border-t border-twilight-blue-700/30;
}

.mobile-date {
  @apply text-sm text-twilight-blue-300;
}

/* ================= SEASONS ================= */

.seasons-list {
  @apply mt-4;
}

.season-item {
  @apply bg-linear-to-br from-shadowmoor-purple-800/60 to-twilight-blue-800/60 backdrop-blur-sm;
}

.season-item.active-season {
  @apply ring-2 ring-lorwyn-gold-500/50;
}

.season-header {
  @apply flex items-start justify-between gap-4;
}

.season-name {
  @apply text-xl font-bold text-white flex items-center;
}

.season-dates {
  @apply text-sm text-twilight-blue-300 mt-1;
}

.season-description {
  @apply text-sm text-twilight-blue-200 mt-2;
}

.season-actions {
  @apply flex gap-2;
}

/* ================= REGISTERED PLAYERS ================= */

.registered-players-section {
  @apply mt-4 pt-4 border-t border-twilight-blue-700/30;
}

.players-loading {
  @apply flex items-center justify-center gap-3 py-6 text-twilight-blue-300;
}

.loading-spinner-small {
  @apply w-6 h-6 border-2 border-twilight-blue-300 border-t-lorwyn-gold-400 rounded-full animate-spin;
}

.no-players {
  @apply py-6 text-center;
}

.players-list {
  @apply space-y-2;
}

.player-registration-item {
  @apply flex items-center justify-between gap-4 p-3 rounded-lg bg-shadowmoor-purple-900/40 hover:bg-shadowmoor-purple-900/60 transition-colors;
}

.player-reg-info {
  @apply flex items-center gap-3 flex-1;
}

.player-reg-avatar {
  @apply w-10 h-10 rounded-full bg-linear-to-br from-shadowmoor-purple-600 to-shadowmoor-magenta-600 flex items-center justify-center text-white font-bold shadow-lg;
}

.player-reg-name {
  @apply font-semibold text-white;
}

.player-reg-stats {
  @apply text-sm text-twilight-blue-300;
}

/* ================= EMPTY STATE ================= */

.empty-state {
  @apply text-center py-12;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.empty-text {
  @apply text-twilight-blue-300 text-lg;
}
</style>
