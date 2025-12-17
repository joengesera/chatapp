import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBFU3n5Bc9hdlqnAi29zRFQXHq3r1-2iJE",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "base-65c9c.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "base-65c9c",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "base-65c9c.appspot.com",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "51891989808",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:51891989808:web:14e99ef373b17ed3b6acf5"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
