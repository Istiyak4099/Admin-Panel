import { type NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { mobileNumber, password } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json(
        { error: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;

    const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword || '');
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (userData.role !== 'Retailer') {
      return NextResponse.json(
        { error: 'Login is restricted. Only Retailer accounts are allowed.' },
        { status: 403 }
      );
    }

    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403 });
    }

    // Self-healing: Ensure a Firebase Auth user exists for this UID.
    // This handles cases where a user might have been created in Firestore but not in Auth.
    try {
      await admin.auth().getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await admin.auth().createUser({
          uid: userData.uid,
          displayName: userData.name,
        });
        console.log(`Created missing Firebase Auth user for UID: ${userData.uid}`);
      } else {
        throw error; // Re-throw other auth errors
      }
    }

    // Generate a custom token for the user to sign in with on the client.
    const token = await admin.auth().createCustomToken(userData.uid);

    return NextResponse.json({ customToken: token });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
