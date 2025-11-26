import * as admin from 'firebase-admin';
import 'dotenv/config';

let app: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

// Helper function to lazily initialize Firebase Admin
export async function getFirebaseAdmin() {
  if (app && db && auth) {
    return { app, db, auth };
  }

  // Check if environment variables are set
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error(
      'Firebase server-side environment variables are not set. Please check your .env file and hosting configuration.'
    );
  }

  // Sanitize the private key
  const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

  try {
    if (admin.apps.length === 0) {
      app = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: privateKey,
        }),
      });
    } else {
      app = admin.apps[0];
    }

    if (!app) {
      throw new Error('Firebase Admin initialization failed.');
    }

    db = admin.firestore(app);
    auth = admin.auth(app);

    return { app, db, auth };
    
  } catch (error: any) {
    console.error('Firebase Admin Initialization Error:', error);
    // Re-throw a more user-friendly error
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}
