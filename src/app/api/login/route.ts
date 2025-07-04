import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

async function ensureAdminUserExists(uid: string, email: string): Promise<void> {
  if (!firestore) {
    throw new Error(serverConfigError);
  }
  const userDocRef = firestore.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists) {
    return;
  }

  const adminUserData: User = {
    uid,
    name: 'Admin',
    email,
    mobileNumber: '0000000000',
    password: 'admin123', // Store plain text password for admin
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
  console.log(`Created Firestore document for default Admin user: ${uid}`);
}

export async function POST(req: NextRequest) {
  if (!firestore || !admin.apps.length) {
    console.error("Login API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const { mobileNumber, password } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 });
    }

    // Special handling for default admin
    if (mobileNumber === '0000000000') {
      if (password !== 'admin123') {
        return NextResponse.json({ error: 'Invalid credentials for Admin.' }, { status: 401 });
      }

      const adminEmail = 'admin@lockersystem.com';
      let userRecord;
      try {
        userRecord = await admin.auth().getUserByEmail(adminEmail);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log('Default admin user not found in Auth, creating...');
          userRecord = await admin.auth().createUser({
            email: adminEmail,
            displayName: 'Admin',
          });
        } else {
          throw error;
        }
      }

      await ensureAdminUserExists(userRecord.uid, adminEmail);
      const token = await admin.auth().createCustomToken(userRecord.uid);
      return NextResponse.json({ customToken: token });
    }

    // Standard user login flow
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;
    userData.uid = userDoc.id;

    if (userData.role === 'Admin') {
      return NextResponse.json({ error: 'Please use the default admin mobile number to log in.' }, { status: 403 });
    }

    const isPasswordValid = userData.hashedPassword ? await bcrypt.compare(password, userData.hashedPassword) : false;

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401 });
    }
    
    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403 });
    }

    try {
      await admin.auth().getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.name,
        });
      } else {
        throw error;
      }
    }

    const token = await admin.auth().createCustomToken(userData.uid);
    return NextResponse.json({ customToken: token });

  } catch (error) {
    console.error('Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
