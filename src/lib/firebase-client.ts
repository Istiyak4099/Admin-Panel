import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY_IS_PRIVATE_AND_SHOULD_NOT_BE_SHARED",
  authDomain: "retailer-emi-assist-kiwfo.firebaseapp.com",
  projectId: "retailer-emi-assist-kiwfo",
  storageBucket: "retailer-emi-assist-kiwfo.appspot.com",
  messagingSenderId: "108152427958",
  appId: "1:108152427958:web:b1d796791924b6c4f0b224"
};

let firebaseApp: FirebaseApp | null = null;

// A more robust check to ensure all necessary config values are present.
const isConfigProvided =
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  !firebaseConfig.apiKey.includes('YOUR_API_KEY');


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
