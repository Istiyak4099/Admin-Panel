import admin from 'firebase-admin';

// This file initializes the Firebase Admin SDK for server-side operations.
// It reads credentials from environment variables defined in `.env`.
// Ensure that the service account has the necessary permissions for Firestore.

if (!admin.apps.length) {
  try {
    const serviceAccount: admin.ServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // The private key must be correctly formatted.
      // In .env, the key should be a single line string.
      // We replace `\\n` with `\n` to ensure newlines are handled correctly here.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error) {
    if (process.env.NODE_ENV !== 'production' && (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY)) {
        // Re-throw a more helpful error to stop execution and guide the user.
        throw new Error("Firebase Admin SDK failed to initialize. Please make sure that FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY are correctly set in your .env file.");
    }
    // Re-throw original error if it's not a config issue
    throw error;
  }
}

export const firestore = admin.firestore();
