<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-md">
      <!-- Card Header with gradient -->
      <div class="bg-linear-to-r from-periwinkle-600 to-midnight-violet-600 dark:from-periwinkle-900 dark:to-midnight-violet-900 rounded-t-2xl p-8 text-center shadow-xl">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <span class="text-4xl">✨</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Join the League</h1>
        <p class="text-lavender-mist-100 dark:text-periwinkle-200">Create your account to start playing</p>
      </div>

      <UCard class="rounded-t-none bg-white/80 dark:bg-orchid-900/80 backdrop-blur-sm border border-orchid-100 dark:border-orchid-800 border-t-0 shadow-xl">
        <div class="space-y-6">
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label class="block text-sm font-semibold mb-2 text-orchid-900 dark:text-midnight-violet-200">Display Name</label>
              <UInput
                v-model="displayName"
                type="text"
                placeholder="Your name"
                size="lg"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 text-orchid-900 dark:text-midnight-violet-200">Email</label>
              <UInput
                v-model="email"
                type="email"
                placeholder="your@email.com"
                size="lg"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 text-orchid-900 dark:text-midnight-violet-200">Password</label>
              <UInput
                v-model="password"
                type="password"
                placeholder="••••••••"
                size="lg"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-semibold mb-2 text-orchid-900 dark:text-midnight-violet-200">Confirm Password</label>
              <UInput
                v-model="confirmPassword"
                type="password"
                placeholder="••••••••"
                size="lg"
                required
              />
            </div>

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              class="bg-linear-to-r from-periwinkle-600 to-midnight-violet-600 hover:from-periwinkle-700 hover:to-midnight-violet-700 shadow-md font-semibold"
            >
              Create Account
            </UButton>
          </form>

          <div class="text-center text-sm pt-2">
            <span class="text-berry-blush-600 dark:text-berry-blush-400">Already have an account?</span>
            <NuxtLink to="/auth/login" class="text-midnight-violet-600 dark:text-midnight-violet-400 font-semibold ml-1 hover:underline">
              Sign In
            </NuxtLink>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signUp } = useAuth()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)

const handleRegister = async () => {
  if (password.value !== confirmPassword.value) {
    alert('Passwords do not match')
    return
  }

  if (password.value.length < 6) {
    alert('Password must be at least 6 characters')
    return
  }

  isLoading.value = true
  try {
    await signUp(email.value, password.value, displayName.value)
    navigateTo('/')
  } catch (error) {
    console.error('Registration error:', error)
    alert('Error creating account. Please try again.')
  } finally {
    isLoading.value = false
  }
}
</script>
