
import { type NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdmin, serverConfigError } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = getFirebaseAdmin();
  } catch (error) {
     console.error("Login API Error:", error);
     return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

  const { firestore, auth } = admin;

  try {
    const { mobileNumber, password } = await req.json();

    if (!mobileNumber || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400 });
    }

    // Special case for master admin credentials
    if (mobileNumber === '01317041181' && password === 'amijanina420') {
        const adminEmail = 'abdulhadiistiyak@gmail.com';
        const usersRef = firestore.collection('Dealers');
        let adminUserRecord;

        try {
            // Check if user exists in Firebase Auth first
            adminUserRecord = await auth.getUserByEmail(adminEmail);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // If user does not exist in Auth, create them
                const hashedPassword = await bcrypt.hash(password, 10);
                adminUserRecord = await auth.createUser({
                    email: adminEmail,
                    displayName: 'Istiyak',
                    password: password // Set initial password for Auth user
                });
                console.log("Created master admin in Firebase Auth with UID:", adminUserRecord.uid);
                 // We also need to store the hashed password in our own db
                await usersRef.doc(adminUserRecord.uid).set({ hashedPassword }, { merge: true });

            } else {
                // For other auth errors, fail the request
                throw error;
            }
        }

        // At this point, we have an Auth user. Now check Firestore.
        const adminFirestoreDoc = await usersRef.doc(adminUserRecord.uid).get();
        if (!adminFirestoreDoc.exists) {
            console.log("Master admin document not found in Firestore. Creating it now.");
            const hashedPassword = await bcrypt.hash(password, 10);
            const adminUserData: Omit<User, 'password' | 'uid'> = {
                name: 'Istiyak',
                email: adminEmail,
                mobileNumber,
                hashedPassword,
                role: 'Admin',
                createdAt: new Date().toISOString(),
                status: 'active',
                createdByUid: null,
                lockerId: null,
                address: 'dhaka',
                shopName: 'Admin Control',
                dealerCode: 'ROOT',
                codeBalance: 99999, // Admins can generate infinite codes
            };
            await usersRef.doc(adminUserRecord.uid).set(adminUserData);
            console.log("Created master admin document in Firestore.");
        }
    }

    // Standard user login flow
    const snapshot = await firestore.collection('Dealers').where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;
    userData.uid = userDoc.id;

    const isPasswordValid = userData.hashedPassword ? await bcrypt.compare(password, userData.hashedPassword) : false;

    if (!isPasswordValid) {
      // For the master admin, if hash fails, re-hash and save. This handles first-time login where hash may not exist yet.
      if (mobileNumber === '01317041181' && password === 'amijanina420') {
         const newHashedPassword = await bcrypt.hash(password, 10);
         await firestore.collection('Dealers').doc(userData.uid).update({ hashedPassword: newHashedPassword });
      } else {
        return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401 });
      }
    }
    
    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is a inactive.' }, { status: 403 });
    }

    try {
      await auth.getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // This case handles users that exist in Firestore but not in Auth.
        // It's a fallback to ensure system integrity.
        await auth.createUser({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.name,
        });
      } else {
        throw error;
      }
    }

    const token = await auth.createCustomToken(userData.uid);
    return NextResponse.json({ customToken: token });

  } catch (error) {
    console.error('Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
