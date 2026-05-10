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
      console.error("Firebase Admin SDK failed to initialize: Missing environment variables.");
    }
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

let db: FirebaseFirestore.Firestore;
try {
  db = getFirestore();
} catch (error) {
  // If app wasn't initialized, getFirestore throws. We fallback to null 
  // but cast as any to prevent TypeScript errors in files that import db.
  db = null as any;
}

export { db };
