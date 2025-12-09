
import * as admin from 'firebase-admin';

let adminApp: admin.app.App | null = null;

export async function getAdminApp() {
  if (adminApp) {
    return adminApp;
  }

  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;

  if (!serviceAccount) {
    console.warn("FIREBASE_ADMIN_SDK_CONFIG is not set. Admin features will not work.");
    return null;
  }

  try {
    if (admin.apps.length === 0) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
      });
    } else {
      adminApp = admin.app();
    }
    return adminApp;
  } catch (e) {
    console.error("Failed to initialize Firebase Admin SDK", e);
    return null;
  }
}
