<template>
  <div class="flex items-center justify-center min-h-[60vh]">
    <div class="w-full max-w-md">
      <!-- Card Header with gradient -->
      <div class="bg-linear-to-r from-orchid-600 to-midnight-violet-600 dark:from-orchid-900 dark:to-midnight-violet-900 rounded-t-2xl p-8 text-center shadow-xl">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
          <span class="text-4xl">🔐</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p class="text-lavender-mist-100 dark:text-periwinkle-200">Sign in to your account</p>
      </div>

      <UCard class="rounded-t-none bg-white/80 dark:bg-orchid-900/80 backdrop-blur-sm border border-orchid-100 dark:border-orchid-800 border-t-0 shadow-xl">
        <div class="space-y-6">
          <form @submit.prevent="handleEmailSignIn" class="space-y-4">
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

            <UButton
              type="submit"
              block
              size="lg"
              :loading="isLoading"
              class="bg-linear-to-r from-orchid-600 to-midnight-violet-600 hover:from-orchid-700 hover:to-midnight-violet-700 shadow-md font-semibold"
            >
              Sign In with Email
            </UButton>
          </form>

          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-orchid-200 dark:border-orchid-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-white dark:bg-orchid-900 text-berry-blush-600 dark:text-berry-blush-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          <UButton
            block
            variant="outline"
            size="lg"
            @click="handleGoogleSignIn"
            :loading="isLoading"
            class="border-2 border-orchid-300 dark:border-orchid-700 hover:bg-orchid-50 dark:hover:bg-orchid-800 font-semibold"
          >
            <template #leading>
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            </template>
            Sign In with Google
          </UButton>

          <div class="text-center text-sm pt-2">
            <span class="text-berry-blush-600 dark:text-berry-blush-400">Don't have an account?</span>
            <NuxtLink to="/auth/register" class="text-midnight-violet-600 dark:text-midnight-violet-400 font-semibold ml-1 hover:underline">
              Sign Up
            </NuxtLink>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signInWithEmail, signInWithGoogle } = useAuth()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleEmailSignIn = async () => {
  isLoading.value = true
  try {
    await signInWithEmail(email.value, password.value)
    navigateTo('/')
  } catch (error) {
    console.error('Sign in error:', error)
    alert('Error signing in. Please check your credentials.')
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  isLoading.value = true
  try {
    await signInWithGoogle()
    navigateTo('/')
  } catch (error) {
    console.error('Google sign in error:', error)
    alert('Error signing in with Google.')
  } finally {
    isLoading.value = false
  }
}
</script>
