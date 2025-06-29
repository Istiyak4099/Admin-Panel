import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore } from '@/lib/firebase-admin';

// IMPORTANT: This is the whitelist of emails allowed to log in as Admin.
// In a real application, you would manage this list in a secure database.
const ADMIN_EMAIL_WHITELIST = [
  'employee1@your-company.com',
  'admin@your-company.com'
  // Add your company's admin emails here
];

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 });
    }

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const email = decodedToken.email;

    if (!email) {
        return NextResponse.json({ error: 'Email not found in Google token.' }, { status: 400 });
    }
    
    if (!ADMIN_EMAIL_WHITELIST.includes(email)) {
      return NextResponse.json(
        { error: 'Access denied. You are not an authorized administrator.' },
        { status: 403 }
      );
    }
    
    const usersRef = firestore.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
        const uid = decodedToken.uid;
        const newUser = {
            uid,
            name: decodedToken.name || 'Admin User',
            email: email,
            role: 'Admin',
            createdAt: new Date().toISOString(),
            status: 'active',
            mobileNumber: '',
            lockerId: null,
            createdByUid: null,
            address: '',
            shopName: 'Admin',
            dealerCode: 'N/A'
        };
        await usersRef.doc(uid).set(newUser);
        console.log(`Created new admin user in Firestore: ${email}`);
    }

    // The client-side SDK has already handled the sign-in.
    // This API route just verifies the user's admin status.
    // Returning success is all that's needed.
    return NextResponse.json({ success: true, message: 'Admin verified successfully.' });

  } catch (error) {
    console.error('Admin Sign-In API error:', error);
    return NextResponse.json(
      { error: 'An internal server error occurred' },
      { status: 500 }
    );
  }
}
