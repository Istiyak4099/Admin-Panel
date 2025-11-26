import * as admin from 'firebase-admin';

// This is a new file to safely initialize firebase-admin
// It checks for environment variables and will only be called by server actions.

let adminApp: admin.app.App | null = null;

export function initializeAdminApp() {
  if (adminApp) {
    return Promise.resolve(adminApp);
  }

  // Check if environment variables are available.
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !privateKey || !clientEmail) {
    throw new Error("Firebase server-side environment variables are not set. The app cannot initialize.");
  }
  
  const serviceAccount: admin.ServiceAccount = {
    projectId: projectId,
    privateKey: privateKey.replace(/\\n/g, '\n'),
    clientEmail: clientEmail,
  };

  if (admin.apps.length > 0) {
    adminApp = admin.app();
  } else {
    adminApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  
  return Promise.resolve(adminApp);
}
