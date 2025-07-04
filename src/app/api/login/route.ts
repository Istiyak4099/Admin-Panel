import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

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
    
    // Admins should not use this login route. They must use Google Sign-In.
    if (role === 'Admin') {
        return NextResponse.json({ error: 'Admin login must be done via Google Sign-In.' }, { status: 403 });
    }

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
    const isPasswordValid = userData.hashedPassword ? await bcrypt.compare(password, userData.hashedPassword) : false;

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
