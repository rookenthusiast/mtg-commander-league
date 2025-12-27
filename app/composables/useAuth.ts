import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  updateProfile,
  type User,
} from "firebase/auth";

export const useAuth = () => {
  const { $auth } = useNuxtApp();
  const user = useState<User | null>("user", () => null);

  // Initialize auth state listener
  if (import.meta.client) {
    onAuthStateChanged($auth, (firebaseUser) => {
      user.value = firebaseUser;
    });
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        $auth,
        email,
        password
      );
      user.value = userCredential.user;
      return userCredential.user;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        $auth,
        email,
        password
      );

      // Update profile with display name
      if (userCredential.user) {
        await updateProfile(userCredential.user, { displayName });

        // Create user document in Firestore
        const { addDocument } = useFirestore();
        const { $db } = useNuxtApp();
        const { doc, setDoc } = await import("firebase/firestore");

        const userId = userCredential.user.uid;

        // Create user document
        await setDoc(doc($db, "users", userId), {
          userId,
          displayName,
          email,
          createdAt: new Date(),
        });

        // Create player profile
        await addDocument("players", {
          userId,
          displayName,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          points: 0,
        });
      }

      user.value = userCredential.user;
      return userCredential.user;
    } catch (error) {
      console.error("Sign up error:", error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup($auth, provider);

      // Check if this is a new user and create documents if needed
      if (result.user) {
        const { $db } = useNuxtApp();
        const { doc, getDoc, setDoc } = await import("firebase/firestore");
        const { addDocument } = useFirestore();

        const userId = result.user.uid;
        const userDocRef = doc($db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        // If user document doesn't exist, create it and player profile
        if (!userDoc.exists()) {
          const displayName = result.user.displayName || "Anonymous";
          const email = result.user.email || "";

          // Create user document
          await setDoc(userDocRef, {
            userId,
            displayName,
            email,
            createdAt: new Date(),
          });

          // Create player profile
          await addDocument("players", {
            userId,
            displayName,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
            points: 0,
          });
        }
      }

      user.value = result.user;
      return result.user;
    } catch (error) {
      console.error("Google sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut($auth);
      user.value = null;
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  };

  return {
    user: readonly(user),
    signInWithEmail,
    signUp,
    signInWithGoogle,
    signOut,
  };
};
