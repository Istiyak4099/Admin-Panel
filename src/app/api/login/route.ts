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
    const docData = userDoc.data();

    // Ensure a complete user object is constructed, providing default values for any potentially missing fields.
    // This prevents an incomplete object from being sent, which was the root cause of the issue.
    const userData: User = {
      uid: userDoc.id,
      name: docData.name || 'Unnamed User',
      email: docData.email || 'no-email@example.com',
      mobileNumber: docData.mobileNumber || '',
      hashedPassword: docData.hashedPassword, // This is required for the password check
      role: docData.role || 'Retailer',
      createdAt: docData.createdAt || new Date().toISOString(),
      status: docData.status || 'inactive',
      createdByUid: docData.createdByUid || null,
      lockerId: docData.lockerId || null,
      address: docData.address || '',
      shopName: docData.shopName || 'N/A',
      dealerCode: docData.dealerCode || 'N/A',
      codeBalance: docData.codeBalance || 0,
    };
    
    if (!userData.hashedPassword) {
        return NextResponse.json({ error: 'User account is not configured for password login.' }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, userData.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (userData.role === 'Admin') {
      return NextResponse.json(
        { error: 'Admin accounts must use Google Sign-In.' },
        { status: 403 }
      );
    }
    
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
    
    const { hashedPassword, ...userToReturn } = userData;

    return NextResponse.json({ customToken: token, user: userToReturn });

  } catch (error) {
    console.error('Login API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: `An internal server error occurred: ${errorMessage}` },
      { status: 500 }
    );
  }
}
