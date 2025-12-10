import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";

// This configuration is for the Firebase project: retailer-emi-assist-kiwfo
const firebaseConfig = {
  apiKey: "AIzaSyDzfjJoXHXUxBxV8vQidAz7oFCEy5CSJTI",
  authDomain: "retailer-emi-assist-kiwfo.firebaseapp.com",
  projectId: "retailer-emi-assist-kiwfo",
  storageBucket: "retailer-emi-assist-kiwfo.firebasestorage.app",
  messagingSenderId: "167466574794",
  appId: "1:167466574794:web:9cc8a314845e86594ae533"
};

let firebaseApp: FirebaseApp | null = null;

// Initialize Firebase
if (!getApps().length) {
    firebaseApp = initializeApp(firebaseConfig);
} else {
    firebaseApp = getApp();
}

export { firebaseApp };
