import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

async function ensureAdminUser(uid: string, email: string): Promise<User> {
  if (!firestore) {
    throw new Error(serverConfigError);
  }
  const userDocRef = firestore.collection('users').doc(uid);
  const userDoc = await userDocRef.get();

  if (userDoc.exists()) {
    return userDoc.data() as User;
  }

  console.log('Admin user document not found in Firestore, creating one...');
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const adminUserData: User = {
    uid,
    name: 'Admin',
    mobileNumber: '0000000000',
    email,
    password: 'admin123',
    hashedPassword,
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
  console.log('Created admin user document in Firestore.');
  return adminUserData;
}

export async function POST(req: NextRequest) {
  if (!firestore) {
    console.error("Login API Error:", serverConfigError);
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const { mobileNumber, password, role } = await req.json();
    if (!mobileNumber || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 });
    }

    // Special path for the default admin user.
    // This is more robust for first-time setup.
    if (role === 'Admin' && mobileNumber === '0000000000' && password === 'admin123') {
        console.log('Default admin login attempt...');
        const email = 'admin@lockersystem.com';
        let adminAuthUser: admin.auth.UserRecord;

        try {
          adminAuthUser = await admin.auth().getUserByEmail(email);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            console.log('Admin auth user not found, creating one...');
            adminAuthUser = await admin.auth().createUser({ email, displayName: 'Admin' });
          } else {
            // Re-throw other auth errors
            throw error;
          }
        }
        
        // Ensure the Firestore document exists for this user
        await ensureAdminUser(adminAuthUser.uid, email);
        
        const token = await admin.auth().createCustomToken(adminAuthUser.uid);
        return NextResponse.json({ customToken: token });
    }

    // Standard login path for all other users
    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;
    userData.uid = userDoc.id;

    // Role check
    if (role && userData.role !== role) {
      return NextResponse.json({ error: `Access denied. You do not have the required '${role}' role.` }, { status: 403 });
    }

    // Password validation
    let isPasswordValid = false;
    if (userData.hashedPassword) {
      isPasswordValid = await bcrypt.compare(password, userData.hashedPassword);
    } else {
       return NextResponse.json({ error: 'User account is not configured for password login.' }, { status: 401 });
    }

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401 });
    }
    
    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403 });
    }

    // Ensure user exists in Firebase Auth for token generation, create if missing
    try {
      await admin.auth().getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log(`Auth user not found for ${userData.email}, creating one...`);
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
