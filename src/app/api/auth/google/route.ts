import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

const ADMIN_EMAIL = 'admin@lockersystem.com';
const ADMIN_PASSWORD = 'admin123';

async function getOrCreateAdminAuthUser(): Promise<admin.auth.UserRecord> {
  try {
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    return userRecord;
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log('Admin user not found in Auth, creating a new one...');
      const userRecord = await admin.auth().createUser({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        displayName: 'Admin',
      });
      console.log('Successfully created new admin user in Auth:', userRecord.uid);
      return userRecord;
    }
    throw error;
  }
}

async function ensureAdminUserInFirestore(uid: string, email: string, name: string): Promise<void> {
  if (!firestore) {
    throw new Error(serverConfigError);
  }
  const userDocRef = firestore.collection('Users').doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    return;
  }
  
  console.log(`Admin user document not found in Firestore for UID ${uid}, creating it...`);
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
    mobileNumber: '0000000000',
  };

  await userDocRef.set(adminUserData);
  console.log(`Created Firestore document for new Admin user: ${uid}`);
}

export async function POST(req: NextRequest) {
  if (!admin.apps.length || !firestore) {
    console.error("Admin Login API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const adminUser = await getOrCreateAdminAuthUser();
    const { uid, email, displayName } = adminUser;

    if (!email) {
        return NextResponse.json({ error: 'Admin email is missing.' }, { status: 500 });
    }

    await ensureAdminUserInFirestore(uid, email, displayName || 'Admin');

    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ customToken });
  } catch (error) {
    console.error('Admin Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
