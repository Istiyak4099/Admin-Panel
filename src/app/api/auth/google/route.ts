import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

async function ensureAdminUserInFirestore(uid: string, email: string, name: string): Promise<void> {
  if (!firestore) {
    throw new Error(serverConfigError);
  }
  const userDocRef = firestore.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    // Optional: Update role to Admin if it's not already, for safety.
    if (userDoc.data()?.role !== 'Admin') {
        await userDocRef.update({ role: 'Admin' });
    }
    return;
  }
  
  // Create the admin user document in Firestore if it doesn't exist.
  const adminUserData: User = {
    uid,
    name: name || 'Admin',
    email: email,
    role: 'Admin',
    createdAt: new Date().toISOString(),
    status: 'active',
    createdByUid: null,
    lockerId: null,
    address: 'Admin Center',
    shopName: 'Admin Panel',
    dealerCode: 'ADMIN',
    codeBalance: 99999,
  };

  await userDocRef.set(adminUserData);
  console.log(`Created Firestore document for Admin user: ${uid}`);
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length || !firestore) {
    console.error("Google Auth API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: No token provided' }, { status: 401 });
    }
    const idToken = authHeader.split('Bearer ')[1];

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    if (!email) {
        return NextResponse.json({ error: 'Email not found in token' }, { status: 400 });
    }

    // Ensure the user document exists in Firestore with the Admin role.
    await ensureAdminUserInFirestore(uid, email, name || '');

    // The user is authenticated with Google. Now create a custom token for session management.
    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error('Google Auth API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
