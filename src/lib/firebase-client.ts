import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;

// A simple check to see if the values look like they've been replaced.
const isConfigProvided = firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('YOUR_API_KEY_HERE');

if (isConfigProvided) {
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
} else {
    // This will help in debugging by showing a clear message in the browser console.
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.warn("Firebase client configuration is invalid or missing. Please ensure your .env file is correctly populated with values from your Firebase project settings.");
    }
}

export { firebaseApp };
