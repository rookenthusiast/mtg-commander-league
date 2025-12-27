export default defineNuxtRouteMiddleware(async (to, from) => {
  // Wait for auth to initialize on client side
  if (process.client) {
    const { user } = useAuth()
    const { $auth } = useNuxtApp()

    // Wait for Firebase auth to be ready
    await new Promise<void>((resolve) => {
      if (user.value) {
        resolve()
      } else {
        const unsubscribe = $auth.onAuthStateChanged((firebaseUser) => {
          unsubscribe()
          resolve()
        })
      }
    })

    // Now check if user is authenticated
    if (!user.value) {
      return navigateTo('/auth/login')
    }

    // Then check if user is admin
    const { checkAdminStatus } = useAdmin()
    const isAdmin = await checkAdminStatus()

    if (!isAdmin) {
      return navigateTo('/')
    }
  }
})
