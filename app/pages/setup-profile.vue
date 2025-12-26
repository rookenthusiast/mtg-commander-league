<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <UCard class="w-full max-w-md">
      <template #header>
        <h1 class="text-2xl font-bold text-center">Complete Your Profile</h1>
      </template>

      <div v-if="!user" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to set up your profile
        </p>
        <UButton to="/auth/login">
          Sign In
        </UButton>
      </div>

      <div v-else-if="isLoading" class="text-center py-8">
        <p class="text-gray-600 dark:text-gray-400">
          Checking your profile...
        </p>
      </div>

      <div v-else-if="profileExists" class="text-center py-8">
        <p class="text-green-600 dark:text-green-400 mb-4">
          Your profile is already set up!
        </p>
        <UButton to="/">
          Go to Dashboard
        </UButton>
      </div>

      <div v-else class="space-y-6">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          It looks like your player profile hasn't been created yet. Let's set it up now!
        </p>

        <form @submit.prevent="handleSetup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Display Name</label>
            <UInput
              v-model="displayName"
              type="text"
              placeholder="Your name"
              required
            />
          </div>

          <UButton
            type="submit"
            block
            size="lg"
            :loading="isSubmitting"
          >
            Create Profile
          </UButton>
        </form>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
const { user } = useAuth()
const { addDocument } = useFirestore()

const displayName = ref('')
const isLoading = ref(true)
const isSubmitting = ref(false)
const profileExists = ref(false)

onMounted(async () => {
  if (user.value) {
    displayName.value = user.value.displayName || ''

    // Check if player profile exists
    const { $db } = useNuxtApp()
    const { collection, query, where, getDocs } = await import('firebase/firestore')

    const playersRef = collection($db, 'players')
    const q = query(playersRef, where('userId', '==', user.value.uid))
    const snapshot = await getDocs(q)

    profileExists.value = !snapshot.empty
  }
  isLoading.value = false
})

const handleSetup = async () => {
  if (!user.value) return

  isSubmitting.value = true
  try {
    const { $db } = useNuxtApp()
    const { doc, setDoc } = await import('firebase/firestore')

    const userId = user.value.uid

    // Create user document
    await setDoc(doc($db, 'users', userId), {
      userId,
      displayName: displayName.value,
      email: user.value.email,
      createdAt: new Date()
    })

    // Create player profile
    await addDocument('players', {
      userId,
      displayName: displayName.value,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0
    })

    // Show success and redirect
    alert('Profile created successfully!')
    navigateTo('/')
  } catch (error: any) {
    console.error('Error creating profile:', error)
    const errorMessage = error?.message || error?.code || 'Unknown error'
    alert(`Error creating profile: ${errorMessage}\n\nPlease check the browser console for details.`)
  } finally {
    isSubmitting.value = false
  }
}
</script>
