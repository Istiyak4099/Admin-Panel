
import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

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

    const usersRef = firestore.collection('users');

    // Special case for master admin credentials to ensure an admin can always be created.
    if (mobileNumber === '0000000000' && password === 'password') {
        let masterAdminSnapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();
        if (masterAdminSnapshot.empty) {
            console.log("Master admin credentials used for first time. Creating default admin user.");
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Create user in Firebase Auth
            const userRecord = await admin.auth().createUser({
                email: 'admin@emilocker.system',
                displayName: 'Default Admin',
            });
            const uid = userRecord.uid;

            // Create user document in Firestore
            const adminUserData: Omit<User, 'password'> & { password?: string } = {
                uid,
                name: 'Default Admin',
                email: 'admin@emilocker.system',
                mobileNumber,
                password, // Store plain text for visibility as per existing app logic
                hashedPassword,
                role: 'Admin',
                createdAt: new Date().toISOString(),
                status: 'active',
                createdByUid: null,
                lockerId: null,
                address: 'System HQ',
                shopName: 'Admin Control',
                dealerCode: 'ROOT',
                codeBalance: 99999, // Admins can generate infinite codes
            };
            
            await usersRef.doc(uid).set(adminUserData);
            console.log("Default Admin user created successfully with UID:", uid);
        }
    }

    // Standard user login flow
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;
    userData.uid = userDoc.id;

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
        // This case handles users that exist in Firestore but not in Auth.
        // It's a fallback to ensure system integrity.
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
