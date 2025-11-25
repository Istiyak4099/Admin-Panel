import admin from 'firebase-admin';
import type { firestore as AdminFirestore } from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.

let firestore: AdminFirestore.Firestore | null = null;

export const serverConfigError = "Firebase Admin SDK is not configured. The required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing or invalid in your hosting environment settings.";

// Initialize the app only if it hasn't been initialized yet.
if (!admin.apps.length) {
  // Check if the necessary environment variables are set.
  const hasAdminConfig = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasAdminConfig) {
    try {
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key must be parsed correctly, replacing escaped newlines.
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      
      console.log("Firebase Admin SDK initialized successfully.");
      firestore = admin.firestore();
    } catch (error: any) {
      console.error("Firebase Admin SDK initialization error:", error.message);
      // In case of an error, ensure firestore remains null.
      firestore = null;
    }
  } else {
    // If config is missing, log the specific error.
    console.error(serverConfigError);
  }
} else {
  // If the app is already initialized, just get the firestore instance.
  firestore = admin.firestore();
}

export { firestore };
