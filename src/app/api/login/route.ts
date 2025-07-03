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

    const usersRef = firestore.collection('users');

    // Special case for default admin user. This logic is self-contained.
    if (role === 'Admin' && mobileNumber === '0000000000' && password === 'admin123') {
      console.log('Default admin login attempt...');
      const email = 'admin@lockersystem.com';
      let adminAuthUser: admin.auth.UserRecord;

      try {
        adminAuthUser = await admin.auth().getUserByEmail(email);
        console.log(`Found existing admin auth user: ${adminAuthUser.uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          console.log('Admin auth user not found, creating one...');
          adminAuthUser = await admin.auth().createUser({
            email,
            displayName: 'Admin',
          });
          console.log(`Created new admin auth user: ${adminAuthUser.uid}`);
        } else {
          throw error; // Re-throw other auth errors
        }
      }

      const uid = adminAuthUser.uid;
      const userDocRef = usersRef.doc(uid);
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
      console.log('Ensured admin user document exists in Firestore.');

      const token = await admin.auth().createCustomToken(uid);
      return NextResponse.json({ customToken: token });
    }

    // Regular user login flow
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const docData = userDoc.data();

    if (!docData.hashedPassword || typeof docData.hashedPassword !== 'string') {
        return NextResponse.json({ error: 'User account is not configured for password login.' }, { status: 401 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, docData.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401 });
    }

    const userData: User = {
      uid: userDoc.id,
      name: docData.name || 'Unnamed User',
      email: docData.email || 'no-email@example.com',
      mobileNumber: docData.mobileNumber || '',
      password: docData.password,
      hashedPassword: docData.hashedPassword,
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
    
    if (role && userData.role !== role) {
       return NextResponse.json({ error: `Access denied. You do not have the required '${role}' role.` }, { status: 403 });
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
    
    return NextResponse.json({ customToken: token });

  } catch (error) {
    console.error('Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
