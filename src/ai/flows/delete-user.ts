
'use server';
/**
 * @fileoverview A flow for deleting a user from Firebase Authentication and Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getAdminApp(): App {
  const apps = getApps();
  if (apps.length === 0) {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && privateKey) {
      return initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
    // Fallback for environments with ADC (Application Default Credentials)
    return initializeApp();
  }
  return apps[0];
}

const DeleteUserInputSchema = z.object({
  userId: z.string().min(1, 'User ID is required.'),
});

const DeleteUserOutputSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});

export type DeleteUserInput = z.infer<typeof DeleteUserInputSchema>;
export type DeleteUserOutput = z.infer<typeof DeleteUserOutputSchema>;

export async function deleteUser(input: DeleteUserInput): Promise<DeleteUserOutput> {
  return deleteUserFlow(input);
}

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ userId }) => {
    try {
      const app = getAdminApp();
      const auth = getAuth(app);
      const firestore = getFirestore(app);

      // 1. Delete user from Firebase Authentication
      await auth.deleteUser(userId);

      // 2. Delete user's document from Firestore (Check both collections)
      const dealersRef = firestore.collection("Dealers").doc(userId);
      const retailersRef = firestore.collection("Retailers").doc(userId);
      
      const [dealerDoc, retailerDoc] = await Promise.all([
          dealersRef.get(),
          retailersRef.get()
      ]);

      if (dealerDoc.exists) {
          await dealersRef.delete();
      } else if (retailerDoc.exists) {
          await retailersRef.delete();
      }
      
      return { success: true, message: 'Account deleted successfully.' };
    } catch (error: any) {
      console.error('Error in deleteUserFlow:', error);
      throw new Error(error.message || 'An unexpected error occurred during account deletion.');
    }
  }
);
