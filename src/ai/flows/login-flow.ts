'use server';
/**
 * @fileOverview A flow for handling user login and authentication.
 *
 * - loginFlow - A function that handles the user login process.
 * - LoginInput - The input type for the loginFlow function.
 * - LoginOutput - The return type for the loginFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {getFirestore} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import admin from 'firebase-admin';
import bcrypt from 'bcryptjs';
import type { User } from '@/lib/types';

// Initialize the Firebase Admin App if it hasn't been already.
// Genkit's environment ensures this works reliably.
if (!admin.apps.length) {
    admin.initializeApp();
}
const firestore = getFirestore();
const auth = getAuth();


const LoginInputSchema = z.object({
  mobileNumber: z.string(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

const LoginOutputSchema = z.object({
  customToken: z.string().optional(),
  error: z.string().optional(),
  status: z.number().optional(),
});
export type LoginOutput = z.infer<typeof LoginOutputSchema>;


export const loginFlow = ai.defineFlow(
  {
    name: 'loginFlow',
    inputSchema: LoginInputSchema,
    outputSchema: LoginOutputSchema,
  },
  async ({ mobileNumber, password }) => {
    
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
                adminUserRecord = await auth.createUser({
                    email: adminEmail,
                    displayName: 'Istiyak',
                    password: password
                });
            } else {
                throw error;
            }
        }

        const adminFirestoreDoc = await usersRef.doc(adminUserRecord.uid).get();
        if (!adminFirestoreDoc.exists) {
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
                codeBalance: 99999,
            };
            await usersRef.doc(adminUserRecord.uid).set(adminUserData);
        }
    }

    // Standard user login flow
    const snapshot = await firestore.collection('Dealers').where('mobileNumber', '==', mobileNumber).limit(1).get();

    if (snapshot.empty) {
      return { error: 'Invalid credentials. User not found.', status: 401 };
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;
    userData.uid = userDoc.id;

    const isPasswordValid = userData.hashedPassword ? await bcrypt.compare(password, userData.hashedPassword) : false;

    if (!isPasswordValid) {
      // For the master admin, if hash fails, re-hash and save.
      if (mobileNumber === '01317041181' && password === 'amijanina420') {
         const newHashedPassword = await bcrypt.hash(password, 10);
         await firestore.collection('Dealers').doc(userData.uid).update({ hashedPassword: newHashedPassword });
      } else {
        return { error: 'Invalid credentials. Password incorrect.', status: 401 };
      }
    }
    
    if (userData.status !== 'active') {
      return { error: 'This user account is inactive.', status: 403 };
    }

    try {
      await auth.getUser(userData.uid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
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
    return { customToken: token };
  }
);
