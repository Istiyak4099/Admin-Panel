import admin from 'firebase-admin';
import type { firestore as AdminFirestore } from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.
// It will not throw an error on startup if credentials are missing,
// but any operation attempting to use the uninitialized 'firestore' instance will fail.

let firestore: AdminFirestore.Firestore | null = null;

export const serverConfigError = "Firebase Admin SDK is not configured. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env file.";

const hasAdminConfig = 
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasAdminConfig) {
  if (!admin.apps.length) {
    try {
      const serviceAccount: admin.ServiceAccount = {
        projectId: "retailer-emi-assist-kiwfo",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      };

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("Firebase Admin SDK initialized successfully.");
      firestore = admin.firestore();
    } catch (error: any) {
      console.error("Firebase Admin SDK initialization error:", error.message);
      // Let the app run, but firestore will be null, and dependent operations will fail.
    }
  } else {
    // Use the already initialized app.
    firestore = admin.firestore();
  }
} else {
    // Only show this warning in development
    if (process.env.NODE_ENV !== 'production') {
        console.warn(serverConfigError);
    }
}

export { firestore };
