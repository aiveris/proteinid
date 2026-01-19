// Firebase Configuration
// Get these values from: https://console.firebase.google.com/
// Project Settings → General → Your apps → Firebase SDK snippet → Config

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDO2KKaSOkiEHXOyveV2LaMZsFZ967EIBo",
  authDomain: "proteinid-a1c04.firebaseapp.com",
  projectId: "proteinid-a1c04",
  storageBucket: "proteinid-a1c04.firebasestorage.app",
  messagingSenderId: "143725902311",
  appId: "1:143725902311:web:3082d43eec92c81fac2542",
  measurementId: "G-C7HKP1XXB2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Configure Google Provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app;
