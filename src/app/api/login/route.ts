import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  if (!firestore) {
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  try {
    const { mobileNumber, password, role } = await req.json();

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
    // This is the fix: combine the document data with its ID to create a complete user object.
    const userData = { ...userDoc.data(), uid: userDoc.id } as User;

    const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword || '');
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (userData.role === 'Admin') {
      return NextResponse.json(
        { error: 'Admin accounts must use Google Sign-In.' },
        { status: 403 }
      );
    }
    
    // Stricter role check: if a role is specified for the login form, the user's role must match exactly.
    if (role && userData.role !== role) {
       return NextResponse.json(
        { error: `Access denied. You do not have the required '${role}' role.` },
        { status: 403 }
      );
    }


    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403 });
    }

    try {
      await admin.auth().getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If the user exists in Firestore but not in Auth, recreate the Auth record.
        // This ensures data consistency if an Auth user was ever deleted manually.
        await admin.auth().createUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.name,
        });
        console.log(`Created missing Firebase Auth user for UID: ${userData.uid}`);
      } else {
        throw error;
      }
    }

    const token = await admin.auth().createCustomToken(userData.uid);
    
    // Omit the hashedPassword before returning the user object to the client
    const { hashedPassword, ...userToReturn } = userData;

    return NextResponse.json({ customToken: token, user: userToReturn });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
