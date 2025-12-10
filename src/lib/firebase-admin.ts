import admin from 'firebase-admin';
import type { firestore as AdminFirestore } from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.

export const serverConfigError = "Firebase Admin SDK is not configured. Please add FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY to your .env file or App Hosting secrets.";

interface FirebaseAdmin {
  firestore: AdminFirestore.Firestore;
  auth: admin.auth.Auth;
  app: admin.app.App;
}

let adminInstance: FirebaseAdmin | null = null;

export function getFirebaseAdmin(): FirebaseAdmin {
  if (adminInstance) {
    return adminInstance;
  }

  if (admin.apps.length > 0) {
     const app = admin.apps[0]!;
     adminInstance = {
        firestore: app.firestore(),
        auth: app.auth(),
        app,
     };
     return adminInstance;
  }

  try {
    // Rely on App Hosting's built-in environment variables
    // or variables set in your .env file for local development.
    const credential = admin.credential.applicationDefault();

    const app = admin.initializeApp({
      credential,
    });

    console.log("Firebase Admin SDK initialized successfully.");
    adminInstance = {
        firestore: app.firestore(),
        auth: app.auth(),
        app,
    };
    return adminInstance;

  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
    throw new Error(serverConfigError);
  }
}
