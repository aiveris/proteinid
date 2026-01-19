import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists, if not create one
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          created_at: new Date().toISOString()
        });
      }
      
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign up with email
  const signUp = async (email, password, name) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile
      await setDoc(doc(db, 'users', result.user.uid), {
        name,
        email,
        created_at: new Date().toISOString()
      });
      
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  // Sign in with email
  const signIn = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Load user profile
  const loadUserProfile = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserProfile(userSnap.data());
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        loadUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signInWithGoogle,
    signUp,
    signIn,
    logout,
    loadUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
