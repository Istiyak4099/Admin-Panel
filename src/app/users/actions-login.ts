"use server";

import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import * as admin from 'firebase-admin';
import type { User } from '@/lib/types';

const LoginSchema = z.object({
  mobileNumber: z.string().min(1, { message: 'Mobile number is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export interface LoginState {
  token?: string;
  error?: string | null;
}

// Helper function to initialize the app (avoids multiple initializations)
const initializeAdminApp = () => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (!projectId || !privateKey || !clientEmail) {
        throw new Error("Firebase server-side environment variables are not set.");
    }

    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: credential.cert({ projectId, privateKey, clientEmail }),
        });
    }
    return admin;
};

export async function loginAction(
  data: z.infer<typeof LoginSchema>
): Promise<LoginState> {
    try {
        const adminApp = initializeAdminApp();
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);

        // 1. Find user by mobile number in Firestore
        const usersRef = firestore.collection('Dealers');
        const q = usersRef.where('mobileNumber', '==', data.mobileNumber).limit(1);
        const querySnapshot = await q.get();

        if (querySnapshot.empty) {
            return { error: 'Invalid mobile number or password.' };
        }

        const userDoc = querySnapshot.docs[0];
        const user = { uid: userDoc.id, ...userDoc.data() } as User;

        // 2. Verify password
        if (!user.hashedPassword) {
            return { error: 'User data is incomplete. Cannot verify password.' };
        }
        const isPasswordValid = await bcrypt.compare(data.password, user.hashedPassword);

        if (!isPasswordValid) {
            return { error: 'Invalid mobile number or password.' };
        }

        // 3. Create a custom token
        const customToken = await auth.createCustomToken(user.uid);

        return { token: customToken };

    } catch (e: any) {
        console.error("Login Action Error:", e.message);
        return { error: 'An unexpected server error occurred. Please check server logs.' };
    }
}
