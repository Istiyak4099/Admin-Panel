import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';

const ADMIN_EMAIL = 'admin@lockersystem.com';
const ADMIN_PASSWORD = 'admin123'; // A default password for creation

export async function POST(req: NextRequest) {
  if (!admin.apps.length || !firestore) {
    console.error("Admin Login API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    let userRecord;
    // 1. Find or create the admin user in Firebase Authentication
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Admin user ${ADMIN_EMAIL} not found, creating...`);
        userRecord = await admin.auth().createUser({
          email: ADMIN_EMAIL,
          emailVerified: true,
          password: ADMIN_PASSWORD,
          displayName: 'Admin',
          disabled: false,
        });
        console.log(`Successfully created admin user in Auth: ${userRecord.uid}`);
      } else {
        // Re-throw other auth errors
        throw error;
      }
    }
    
    const uid = userRecord.uid;

    // 2. Ensure the admin user profile exists in Firestore
    const userDocRef = firestore.collection('Users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
        console.log(`Admin user profile not found in Firestore for UID ${uid}, creating...`);
        const adminUserData: User = {
            uid,
            name: userRecord.displayName || 'Admin',
            email: ADMIN_EMAIL,
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
            password: ADMIN_PASSWORD, // Store default password for reference
        };
        await userDocRef.set(adminUserData);
        console.log(`Successfully created admin user profile in Firestore.`);
    }

    // 3. Create a custom token for the client to sign in with
    const customToken = await admin.auth().createCustomToken(uid);

    return NextResponse.json({ customToken });

  } catch (error) {
    console.error('Admin Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
