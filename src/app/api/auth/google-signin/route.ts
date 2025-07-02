import { type NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { firestore, serverConfigError } from '@/lib/firebase-admin';

// IMPORTANT: This is the whitelist of emails allowed to log in as Admin.
// In a real application, you would manage this list in a secure database.
const ADMIN_EMAIL_WHITELIST = [
  'employee1@your-company.com',
  'admin@your-company.com'
  // Add your company's admin emails here
];

export async function POST(req: NextRequest) {
  if (!firestore) {
    return NextResponse.json({ error: serverConfigError }, { status: 500 });
  }

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
    
    /*
    // FOR TESTING: Temporarily disabled admin whitelist. 
    // Any Google account can now log in as an admin.
    // To re-enable, uncomment this block.
    if (!ADMIN_EMAIL_WHITELIST.includes(email)) {
      return NextResponse.json(
        { error: 'Access denied. You are not an authorized administrator.' },
        { status: 403 }
      );
    }
    */
    
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

    return NextResponse.json({ success: true, message: 'Admin verified successfully.' });

  } catch (error) {
    console.error('Admin Sign-In API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
