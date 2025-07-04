import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore, serverConfigError } from '@/lib/firebase-admin';

const ADMIN_EMAIL = 'admin@lockersystem.com';

export async function POST(req: NextRequest) {
  if (!admin.apps.length || !firestore) {
    console.error("Admin Google Auth API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const authorization = req.headers.get('Authorization');
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing bearer token.' }, { status: 401 });
    }

    const idToken = authorization.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    if (decodedToken.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'Access denied. This is an admin-only login.' }, { status: 403 });
    }

    const uid = decodedToken.uid;
    // The user should already exist in Firebase Auth.
    // The user-nav component will handle creating the Firestore doc if it's missing.

    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ customToken });

  } catch (error) {
    console.error('Admin Google Auth API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
