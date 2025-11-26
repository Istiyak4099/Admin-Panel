import * as admin from 'firebase-admin';
import 'dotenv/config';

// This configuration is for the Firebase project: retailer-emi-assist-kiwfo
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

let app: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;
let auth: admin.auth.Auth | null = null;

export async function getFirebaseAdmin() {
  if (app && db && auth) {
    return { app, db, auth };
  }

  if (
    !serviceAccount.projectId ||
    !serviceAccount.clientEmail ||
    !serviceAccount.privateKey
  ) {
    throw new Error(
      'Firebase server-side environment variables are not set. Please check your .env file and hosting configuration.'
    );
  }

  try {
    if (admin.apps.length === 0) {
      app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
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
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}