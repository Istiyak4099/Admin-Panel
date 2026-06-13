import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Initializes and returns the Firebase Admin App instance.
 * Centralized for all server-side operations (Actions, API Routes, Genkit Flows).
 */
function getAdminApp(): App {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "retailer-emi-assist-kiwfo";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If we have full service account credentials, use them explicitly
  if (projectId && clientEmail && privateKey) {
    try {
      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } catch (error) {
      console.error("Failed to initialize Admin SDK with service account:", error);
    }
  }

  // Fallback to Application Default Credentials (ADC)
  // We still pass the projectId to help the SDK identify the target project in managed environments
  return initializeApp({
    projectId,
  });
}

const adminApp = getAdminApp();

export const db = getFirestore(adminApp);
export const auth = getAuth(adminApp);
export { adminApp };
