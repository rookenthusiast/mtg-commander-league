import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  type DocumentData,
  type QueryConstraint
} from 'firebase/firestore'

export const useFirestore = () => {
  const { $db } = useNuxtApp()

  // Generic function to get a document
  const getDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc($db, collectionName, docId)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() }
      } else {
        return null
      }
    } catch (error) {
      console.error('Error getting document:', error)
      throw error
    }
  }

  // Generic function to get multiple documents
  const getDocuments = async (
    collectionName: string,
    constraints: QueryConstraint[] = []
  ) => {
    try {
      const collectionRef = collection($db, collectionName)
      const q = constraints.length > 0 ? query(collectionRef, ...constraints) : collectionRef
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    } catch (error) {
      console.error('Error getting documents:', error)
      throw error
    }
  }

  // Generic function to add a document
  const addDocument = async (collectionName: string, data: DocumentData) => {
    try {
      const collectionRef = collection($db, collectionName)
      const docRef = await addDoc(collectionRef, {
        ...data,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      return docRef.id
    } catch (error) {
      console.error('Error adding document:', error)
      throw error
    }
  }

  // Generic function to update a document
  const updateDocument = async (
    collectionName: string,
    docId: string,
    data: DocumentData
  ) => {
    try {
      const docRef = doc($db, collectionName, docId)
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  // Generic function to delete a document
  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc($db, collectionName, docId)
      await deleteDoc(docRef)
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  return {
    getDocument,
    getDocuments,
    addDocument,
    updateDocument,
    deleteDocument,
    // Export Firestore query builders for custom queries
    where,
    orderBy,
    limit,
    increment
  }
}
