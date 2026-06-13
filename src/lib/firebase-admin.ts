import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initializes and returns the Firebase Admin App instance.
 * Supports both explicit service account credentials and Application Default Credentials.
 */
function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    } catch (error) {
      console.error("Failed to initialize Admin SDK with service account:", error);
    }
  }

  // Fallback to Application Default Credentials (ADC)
  return initializeApp();
}

const adminApp = getAdminApp();

export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
export { adminApp };
