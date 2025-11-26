"use server";

import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase-admin';
import type { User } from '@/lib/types';


const LoginSchema = z.object({
  mobileNumber: z.string().min(1, { message: 'Mobile number is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export interface LoginState {
  token?: string;
  error?: string | null;
}

export async function loginAction(
  data: z.infer<typeof LoginSchema>
): Promise<LoginState> {
    try {
        await initializeAdminApp();
        const auth = getAuth();
        const firestore = getFirestore();

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
        console.error("Login Action Error:", e);
        return { error: 'Server configuration error. Please try again later.' };
    }
}