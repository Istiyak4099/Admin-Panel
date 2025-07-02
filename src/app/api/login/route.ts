import { type NextRequest, NextResponse } from 'next/server';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders
  });
}

export async function POST(req: NextRequest) {
  if (!firestore) {
    console.error("Login API Error: Firestore is not initialized.");
    return NextResponse.json({ error: serverConfigError }, { status: 500, headers: corsHeaders });
  }

  try {
    const { mobileNumber, password, role } = await req.json();
    if (!mobileNumber || !password) {
      return NextResponse.json({ error: 'Mobile number and password are required' }, { status: 400, headers: corsHeaders });
    }

    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();
    if (snapshot.empty) {
      return NextResponse.json({ error: 'Invalid credentials. User not found.' }, { status: 401, headers: corsHeaders });
    }

    const userDoc = snapshot.docs[0];
    const docData = userDoc.data();

    if (!docData.hashedPassword || typeof docData.hashedPassword !== 'string') {
        return NextResponse.json({ error: 'User account is not configured for password login.' }, { status: 401, headers: corsHeaders });
    }
    
    const isPasswordValid = await bcrypt.compare(password, docData.hashedPassword);
    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Invalid credentials. Password incorrect.' }, { status: 401, headers: corsHeaders });
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
    
    if (userData.role === 'Admin') {
      return NextResponse.json({ error: 'Admin accounts must use Google Sign-In.' }, { status: 403, headers: corsHeaders });
    }
    if (role && userData.role !== role) {
       return NextResponse.json({ error: `Access denied. You do not have the required '${role}' role.` }, { status: 403, headers: corsHeaders });
    }
    if (userData.status !== 'active') {
      return NextResponse.json({ error: 'This user account is inactive.' }, { status: 403, headers: corsHeaders });
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
    
    return NextResponse.json({ customToken: token }, { headers: corsHeaders });

  } catch (error) {
    console.error('Login API critical error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500, headers: corsHeaders });
  }
}
