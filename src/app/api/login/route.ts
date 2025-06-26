import { type NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const { mobile_number, password } = await req.json();

    if (!mobile_number || !password) {
      return NextResponse.json(
        { error: 'Mobile number and password are required' },
        { status: 400 }
      );
    }

    const usersRef = firestore.collection('users');
    const snapshot = await usersRef.where('mobile_number', '==', mobile_number).limit(1).get();

    if (snapshot.empty) {
      // Use a generic error message for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;

    const isPasswordValid = await bcrypt.compare(password, userData.password || '');
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

    // Login successful
    // Omit the password hash from the response payload
    const { password: _, ...userToReturn } = userData;

    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: userDoc.id,
        ...userToReturn,
      },
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
