import admin from 'firebase-admin';
import type { firestore as AdminFirestore } from 'firebase-admin';

let firestore: AdminFirestore.Firestore | null = null;

export const serverConfigError = "Firebase Admin SDK is not configured. The required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY) are missing or invalid in your hosting environment settings.";

// Initialize the app only if it hasn't been initialized yet.
if (!admin.apps.length) {
  const hasAdminConfig = 
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY;

  if (hasAdminConfig) {
    try {
      const serviceAccount: admin.ServiceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
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
      firestore = null;
    }
  } else {
    console.error(serverConfigError);
  }
} else {
  firestore = admin.firestore();
}

export { firestore };
