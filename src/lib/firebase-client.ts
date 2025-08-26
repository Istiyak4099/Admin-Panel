import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: "retailer-emi-assist-kiwfo.firebaseapp.com",
  projectId: "retailer-emi-assist-kiwfo",
  storageBucket: "retailer-emi-assist-kiwfo.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let firebaseApp: FirebaseApp | null = null;

// A more robust check to ensure all necessary config values are present.
const isConfigProvided =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY_HERE');


if (isConfigProvided) {
    if (!getApps().length) {
        firebaseApp = initializeApp(firebaseConfig);
    } else {
        firebaseApp = getApp();
    }
} else {
    // This will help in debugging by showing a clear message in the browser console.
    if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
        console.error("Firebase client configuration is invalid or incomplete. Please ensure all NEXT_PUBLIC_FIREBASE_* variables are correctly populated in your .env file.");
    }
}

export { firebaseApp };
