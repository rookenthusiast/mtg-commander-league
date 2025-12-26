<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Hero Header -->
      <div class="login-header">
        <div class="icon-wrapper">
          <span class="icon">🔐</span>
        </div>
        <h1 class="title">Welcome Back</h1>
        <p class="subtitle">Sign in to your Budget Ducks Commander League account</p>
      </div>

      <!-- Login Form Card -->
      <UCard class="login-card">
        <UForm :state="formState" :validate="validate" class="space-y-6" @submit="handleEmailSignIn">
          <!-- Email Field -->
          <UFormField label="Email Address" name="email" required>
            <UInput
              v-model="formState.email"
              type="email"
              placeholder="your@email.com"
              size="xl"
              icon="i-heroicons-envelope"
              autocomplete="email"
              class="w-full"
            />
          </UFormField>

          <!-- Password Field -->
          <UFormField label="Password" name="password" required>
            <UInput
              v-model="formState.password"
              type="password"
              placeholder="Enter your password"
              size="xl"
              icon="i-heroicons-lock-closed"
              autocomplete="current-password"
              class="w-full"
            />
          </UFormField>

          <!-- Submit Button -->
          <UButton
            type="submit"
            block
            size="xl"
            :loading="isLoading"
            class="submit-button"
          >
            Sign In with Email
          </UButton>
        </UForm>

        <!-- Divider -->
        <div class="divider">
          <div class="divider-line" />
          <span class="divider-text">Or continue with</span>
          <div class="divider-line" />
        </div>

        <!-- Google Sign In -->
        <UButton
          block
          variant="outline"
          size="xl"
          :loading="isLoading"
          class="google-button"
          @click="handleGoogleSignIn"
        >
          <template #leading>
            <svg class="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
          </template>
          Sign In with Google
        </UButton>

        <!-- Sign Up Link -->
        <div class="signup-link">
          <span class="signup-text">Don't have an account?</span>
          <NuxtLink to="/auth/register" class="signup-action">
            Sign Up
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signInWithEmail, signInWithGoogle } = useAuth()
const toast = useToast()

const formState = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)

const validate = (state: typeof formState) => {
  const errors = []

  if (!state.email) {
    errors.push({ name: 'email', message: 'Email is required' })
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
    errors.push({ name: 'email', message: 'Please enter a valid email address' })
  }

  if (!state.password) {
    errors.push({ name: 'password', message: 'Password is required' })
  } else if (state.password.length < 6) {
    errors.push({ name: 'password', message: 'Password must be at least 6 characters' })
  }

  return errors
}

const handleEmailSignIn = async () => {
  isLoading.value = true
  try {
    await signInWithEmail(formState.email, formState.password)
    toast.add({
      title: 'Welcome back!',
      description: 'You have successfully signed in.',
      color: 'success'
    })
    navigateTo('/')
  } catch (error: any) {
    console.error('Sign in error:', error)
    toast.add({
      title: 'Sign In Failed',
      description: error?.message || 'Please check your credentials and try again.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  isLoading.value = true
  try {
    await signInWithGoogle()
    toast.add({
      title: 'Welcome back!',
      description: 'You have successfully signed in with Google.',
      color: 'success'
    })
    navigateTo('/')
  } catch (error: any) {
    console.error('Google sign in error:', error)
    toast.add({
      title: 'Sign In Failed',
      description: error?.message || 'Unable to sign in with Google. Please try again.',
      color: 'error'
    })
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
@reference "~/assets/css/main.css";

/* ================= PAGE LAYOUT ================= */

.login-page {
  @apply min-h-screen flex items-center justify-center py-12 px-4;
}

.login-container {
  @apply w-full max-w-md space-y-6;
}

/* ================= HEADER ================= */

.login-header {
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

.login-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl p-8;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.login-card::before {
  content: '';
  @apply absolute inset-0 rounded-lg pointer-events-none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%
  );
}

/* ================= FORM ================= */

:deep(.login-card .space-y-6) {
  @apply relative z-10;
}

/* Update help text color to be more visible */
:deep(.login-card [class*="help"]) {
  @apply text-lorwyn-green-300;
}

:deep(.login-card .text-muted) {
  @apply text-lorwyn-green-300;
}

/* ================= BUTTONS ================= */

.submit-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl;
}

.google-button {
  @apply border-2 border-twilight-blue-600/50 hover:bg-twilight-blue-800/30 hover:border-twilight-blue-500/70 font-semibold text-white transition-all duration-200 hover:scale-[1.02];
}

/* ================= DIVIDER ================= */

.divider {
  @apply relative flex items-center gap-4 my-8;
}

.divider-line {
  @apply flex-1 h-px bg-linear-to-r from-transparent via-twilight-blue-500/50 to-transparent;
}

.divider-text {
  @apply px-4 text-sm font-medium text-twilight-blue-300 bg-transparent;
}

/* ================= SIGN UP LINK ================= */

.signup-link {
  @apply text-center pt-6 border-t border-twilight-blue-700/30;
}

.signup-text {
  @apply text-twilight-blue-300;
}

.signup-action {
  @apply ml-2 font-bold bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent hover:from-lorwyn-gold-300 hover:to-shadowmoor-magenta-300 transition-all duration-200;
}
</style>
