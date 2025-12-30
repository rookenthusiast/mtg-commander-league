<template>
  <div
    class="flex flex-col min-h-screen bg-linear-to-br from-shadowmoor-purple-950 via-twilight-blue-950 to-shadowmoor-purple-950">
    <!-- Header Navigation -->
    <header
      class="shrink-0 bg-linear-to-r from-twilight-blue-900/95 via-shadowmoor-purple-900/95 to-twilight-blue-900/95 backdrop-blur-md shadow-2xl z-50">
      <UContainer>
        <div class="flex items-center justify-between h-20">
          <div class="flex items-center space-x-8">
            <!-- Logo -->
            <NuxtLink to="/" class="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <div class="text-4xl transform group-hover:scale-110 transition-transform">🦆</div>
              <div>
                <div
                  class="text-2xl font-black tracking-tight bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent">
                  BUDGET DUCKS
                </div>
                <div class="text-xs text-twilight-blue-300 font-semibold uppercase tracking-wider">
                  Commander League
                </div>
              </div>
            </NuxtLink>
          </div>

          <nav class="hidden md:flex items-center space-x-1">
            <UButton to="/" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
              Home
            </UButton>
            <UButton to="/leaderboard" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
              Leaderboard
            </UButton>
            <UButton to="/seasons" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
              Seasons
            </UButton>
            <UButton to="/decks" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
              Decks
            </UButton>
            <UButton to="/rules" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
              Rules
            </UButton>
            <UButton to="/submit-game"
              class="ml-4 bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg shadow-lorwyn-gold-500/50 border-2 border-lorwyn-gold-400">
              Submit Match
            </UButton>
          </nav>

          <!-- Mobile menu button -->
          <div class="md:hidden">
            <UButton icon="i-heroicons-bars-3" variant="ghost" @click="isMobileMenuOpen = !isMobileMenuOpen" />
          </div>

          <!-- Auth buttons -->
          <div class="hidden md:flex items-center space-x-2">
            <template v-if="user">
              <UButton v-if="isAdmin" to="/admin" variant="ghost"
                class="text-lorwyn-gold-400 hover:text-lorwyn-gold-300 hover:bg-shadowmoor-purple-800 font-semibold"
                icon="i-heroicons-shield-check">
                Admin
              </UButton>
              <UButton to="/profile" variant="ghost"
                class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold">
                Profile
              </UButton>
              <UButton variant="ghost"
                class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 font-semibold"
                @click="handleSignOut">
                Sign Out
              </UButton>
            </template>
            <template v-else>
              <UButton to="/auth/login"
                class="bg-shadowmoor-purple-800 hover:bg-shadowmoor-purple-700 text-white font-semibold border-2 border-shadowmoor-purple-600 hover:border-shadowmoor-magenta-500">
                Sign In
              </UButton>
            </template>
          </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="isMobileMenuOpen"
          class="md:hidden py-4 space-y-2 border-t border-shadowmoor-purple-700 bg-shadowmoor-purple-900">
          <UButton to="/" variant="ghost"
            class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
            Home
          </UButton>
          <UButton to="/leaderboard" variant="ghost"
            class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
            Leaderboard
          </UButton>
          <UButton to="/seasons" variant="ghost"
            class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
            Seasons
          </UButton>
          <UButton to="/decks" variant="ghost"
            class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
            Decks
          </UButton>
          <UButton to="/rules" variant="ghost"
            class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
            Rules
          </UButton>
          <UButton to="/submit-game"
            class="bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 text-white font-bold w-full" block>
            Submit Match
          </UButton>

          <template v-if="user">
            <UButton v-if="isAdmin" to="/admin" variant="ghost"
              class="text-lorwyn-gold-400 hover:text-lorwyn-gold-300 hover:bg-shadowmoor-purple-800 w-full justify-start"
              icon="i-heroicons-shield-check" block>
              Admin
            </UButton>
            <UButton to="/profile" variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block>
              Profile
            </UButton>
            <UButton variant="ghost"
              class="text-twilight-blue-200 hover:text-white hover:bg-shadowmoor-purple-800 w-full justify-start" block
              @click="handleSignOut">
              Sign Out
            </UButton>
          </template>
          <template v-else>
            <UButton to="/auth/login" class="bg-shadowmoor-purple-800 hover:bg-shadowmoor-purple-700 text-white w-full"
              block>
              Sign In
            </UButton>
          </template>
        </div>
      </UContainer>
    </header>

    <!-- Main content -->
    <main class="flex-1 content-center">
      <slot />
    </main>

    <!-- Footer -->
    <footer
      class="shrink-0 relative bg-linear-to-r from-shadowmoor-purple-900 via-twilight-blue-900 to-shadowmoor-purple-900">
      <!-- Top accent line -->

      <UContainer>
        <div class="py-2">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <!-- Logo & Copyright -->
            <div class="flex items-center gap-3">
              <div>
                <div
                  class="text-lg font-bold bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent">
                  BUDGET DUCKS
                </div>
                <p class="text-xs text-twilight-blue-400">
                  &copy; {{ new Date().getFullYear() }} All rights reserved
                </p>
              </div>
            </div>

            <!-- Tech Stack -->
            <div class="text-center md:text-right">
              <p class="text-sm text-twilight-blue-300">
                Powered by <span class="text-lorwyn-gold-400 font-semibold">Nuxt</span> & <span
                  class="text-lorwyn-gold-400 font-semibold">Firebase</span>
              </p>
              <p class="text-xs text-twilight-blue-400 mt-1">
                Lorwyn Season • Commander Format
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </footer>
  </div>
</template>

<script setup lang="ts">
const isMobileMenuOpen = ref(false)
const { user, signOut } = useAuth()
const { isAdmin, checkAdminStatus } = useAdmin()

// Check admin status when user changes
watch(user, async (newUser) => {
  if (newUser) {
    await checkAdminStatus()
  }
}, { immediate: true })

const handleSignOut = async () => {
  await signOut()
  navigateTo('/')
}
</script>
