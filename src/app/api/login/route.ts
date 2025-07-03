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
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();

    // Special case: Create default admin if it doesn't exist on first login attempt
    if (snapshot.empty && role === 'Admin' && mobileNumber === '0000000000' && password === 'admin123') {
      console.log('Default admin user not found, creating one...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const email = 'admin@lockersystem.com';
      let uid = '';

      try {
        // Check if auth user exists to prevent re-creation error
        const existingAuthUser = await admin.auth().getUserByEmail(email);
        uid = existingAuthUser.uid;
        console.log(`Admin auth user already exists with UID: ${uid}`);
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create if it doesn't exist
          const adminAuthUser = await admin.auth().createUser({
            email,
            displayName: 'Admin',
          });
          uid = adminAuthUser.uid;
          console.log(`Created new admin auth user with UID: ${uid}`);
        } else {
          // Re-throw other auth errors
          throw error;
        }
      }

      const newAdminUser: User = {
        uid,
        name: 'Admin',
        mobileNumber: '0000000000',
        email: email,
        password: 'admin123', // Store plain text password for admin visibility
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

      await usersRef.doc(uid).set(newAdminUser);
      console.log('Default admin user document created in Firestore.');
      
      // Directly create the token and return, avoiding a re-fetch that can fail due to index delay.
      const token = await admin.auth().createCustomToken(newAdminUser.uid);
      return NextResponse.json({ customToken: token });
    }


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
