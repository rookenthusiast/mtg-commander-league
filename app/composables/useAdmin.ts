import { doc, getDoc, getDocs, updateDoc, collection, query, where } from 'firebase/firestore'
import type { User } from '~/types'

export const useAdmin = () => {
  const { user } = useAuth()
  const { $db } = useNuxtApp()

  const isAdmin = ref(false)
  const isLoading = ref(true)

  /**
   * Check if the current user is an admin
   */
  const checkAdminStatus = async (): Promise<boolean> => {
    if (!user.value) {
      isAdmin.value = false
      isLoading.value = false
      return false
    }

    try {
      const userDocRef = doc($db, 'users', user.value.uid)
      const userDoc = await getDoc(userDocRef)

      if (userDoc.exists()) {
        const userData = userDoc.data()
        isAdmin.value = userData.isAdmin === true
      } else {
        isAdmin.value = false
      }

      isLoading.value = false
      return isAdmin.value
    } catch (error) {
      console.error('Error checking admin status:', error)
      isAdmin.value = false
      isLoading.value = false
      return false
    }
  }

  /**
   * Get all users from Firestore
   */
  const getAllUsers = async (): Promise<User[]> => {
    try {
      const usersRef = collection($db, 'users')
      const querySnapshot = await getDocs(usersRef)

      const users: User[] = []
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User)
      })

      return users
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  }

  /**
   * Promote a user to admin
   */
  const promoteToAdmin = async (userId: string): Promise<void> => {
    try {
      const userDocRef = doc($db, 'users', userId)
      await updateDoc(userDocRef, {
        isAdmin: true,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error promoting user to admin:', error)
      throw error
    }
  }

  /**
   * Demote a user from admin
   */
  const demoteFromAdmin = async (userId: string): Promise<void> => {
    try {
      const userDocRef = doc($db, 'users', userId)
      await updateDoc(userDocRef, {
        isAdmin: false,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error demoting user from admin:', error)
      throw error
    }
  }

  /**
   * Get a user by email
   */
  const getUserByEmail = async (email: string): Promise<User | null> => {
    try {
      const usersRef = collection($db, 'users')
      const q = query(usersRef, where('email', '==', email))
      const querySnapshot = await getDocs(q)

      if (querySnapshot.empty) {
        return null
      }

      const userDoc = querySnapshot.docs[0]
      return { id: userDoc.id, ...userDoc.data() } as User
    } catch (error) {
      console.error('Error fetching user by email:', error)
      throw error
    }
  }

  return {
    isAdmin: readonly(isAdmin),
    isLoading: readonly(isLoading),
    checkAdminStatus,
    getAllUsers,
    promoteToAdmin,
    demoteFromAdmin,
    getUserByEmail
  }
}
