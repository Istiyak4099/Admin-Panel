import * as admin from 'firebase-admin';

// This configuration is for the Firebase project: retailer-emi-assist-kiwfo

// Ensure that the environment variables are set in your deployment environment.
const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

let adminApp: admin.app.App | null = null;

export function initializeAdminApp() {
  if (!adminApp) {
    if (admin.apps.length > 0) {
      adminApp = admin.app();
    } else {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    }
  }
  return adminApp;
}
