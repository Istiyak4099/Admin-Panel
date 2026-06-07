import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

try {
  if (!getApps().length) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      const serviceAccount = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey,
      };

      initializeApp({
        credential: cert(serviceAccount),
      });
    } else {
      console.warn("Firebase Admin SDK is initializing without explicit credentials. This is expected in Google Cloud/Vercel environments with ADC, but ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are set if using a service account key.");
      initializeApp();
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

let db: FirebaseFirestore.Firestore;
try {
  db = getFirestore();
} catch (error) {
  console.error("Failed to get Firestore instance:", error);
  db = null as any;
}

export { db };
