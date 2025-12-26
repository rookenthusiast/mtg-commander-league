<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Hero Header -->
      <div class="register-header">
        <div class="icon-wrapper">
          <span class="icon">✨</span>
        </div>
        <h1 class="title">Join the League</h1>
        <p class="subtitle">Create your Budget Ducks Commander League account</p>
      </div>

      <!-- Register Form Card -->
      <UCard class="register-card">
        <UForm :state="formState" :validate="validate" class="space-y-6" @submit="handleRegister">
          <!-- Display Name Field -->
          <UFormField label="Display Name" name="displayName" required>
            <UInput
              v-model="formState.displayName"
              type="text"
              placeholder="Your name"
              size="xl"
              icon="i-heroicons-user"
              autocomplete="name"
              class="w-full"
            />
          </UFormField>

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
          <UFormField label="Password" name="password" required help="Must be at least 6 characters">
            <UInput
              v-model="formState.password"
              type="password"
              placeholder="Create a password"
              size="xl"
              icon="i-heroicons-lock-closed"
              autocomplete="new-password"
              class="w-full"
            />
          </UFormField>

          <!-- Confirm Password Field -->
          <UFormField label="Confirm Password" name="confirmPassword" required>
            <UInput
              v-model="formState.confirmPassword"
              type="password"
              placeholder="Confirm your password"
              size="xl"
              icon="i-heroicons-lock-closed"
              autocomplete="new-password"
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
            Create Account
          </UButton>
        </UForm>

        <!-- Sign In Link -->
        <div class="signin-link">
          <span class="signin-text">Already have an account?</span>
          <NuxtLink to="/auth/login" class="signin-action">
            Sign In
          </NuxtLink>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
const { signUp } = useAuth()
const toast = useToast()

const formState = reactive({
  displayName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isLoading = ref(false)

const validate = (state: typeof formState) => {
  const errors = []

  if (!state.displayName) {
    errors.push({ name: 'displayName', message: 'Display name is required' })
  } else if (state.displayName.length < 2) {
    errors.push({ name: 'displayName', message: 'Display name must be at least 2 characters' })
  }

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

  if (!state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'Please confirm your password' })
  } else if (state.password !== state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'Passwords do not match' })
  }

  return errors
}

const handleRegister = async () => {
  isLoading.value = true
  try {
    await signUp(formState.email, formState.password, formState.displayName)
    toast.add({
      title: 'Welcome to the League!',
      description: 'Your account has been created successfully.',
      color: 'success'
    })
    navigateTo('/')
  } catch (error: any) {
    console.error('Registration error:', error)

    let errorMessage = 'Unable to create account. Please try again.'

    // Handle common Firebase auth errors
    if (error?.code === 'auth/email-already-in-use') {
      errorMessage = 'This email is already registered. Please sign in instead.'
    } else if (error?.code === 'auth/weak-password') {
      errorMessage = 'Password is too weak. Please choose a stronger password.'
    } else if (error?.code === 'auth/invalid-email') {
      errorMessage = 'Invalid email address.'
    }

    toast.add({
      title: 'Registration Failed',
      description: error?.message || errorMessage,
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

.register-page {
  @apply min-h-screen flex items-center justify-center py-12 px-4;
}

.register-container {
  @apply w-full max-w-md space-y-6;
}

/* ================= HEADER ================= */

.register-header {
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

.register-card {
  @apply bg-linear-to-br from-shadowmoor-purple-900/80 to-twilight-blue-900/80 backdrop-blur-sm shadow-2xl p-8;
  border: 1px solid rgba(139, 92, 246, 0.2);
}

.register-card::before {
  content: '';
  @apply absolute inset-0 rounded-lg pointer-events-none;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.05) 0%,
    transparent 50%
  );
}

/* ================= FORM ================= */

:deep(.register-card .space-y-6) {
  @apply relative z-10;
}

/* Update help text color to be more visible */
:deep(.register-card [class*="help"]) {
  @apply text-lorwyn-green-300;
}

:deep(.register-card .text-muted) {
  @apply text-lorwyn-green-300;
}

/* ================= BUTTONS ================= */

.submit-button {
  @apply bg-linear-to-r from-lorwyn-gold-500 to-shadowmoor-magenta-500 hover:from-lorwyn-gold-600 hover:to-shadowmoor-magenta-600 text-white font-bold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl;
}

/* ================= SIGN IN LINK ================= */

.signin-link {
  @apply text-center pt-6 border-t border-twilight-blue-700/30;
}

.signin-text {
  @apply text-twilight-blue-300;
}

.signin-action {
  @apply ml-2 font-bold bg-linear-to-r from-lorwyn-gold-400 to-shadowmoor-magenta-400 bg-clip-text text-transparent hover:from-lorwyn-gold-300 hover:to-shadowmoor-magenta-300 transition-all duration-200;
}
</style>
