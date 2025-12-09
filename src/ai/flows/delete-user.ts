'use server';
/**
 * @fileoverview A flow for deleting a user from Firebase Authentication and Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Helper function to initialize the app (avoids multiple initializations)
function getAdminApp() {
  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;
  if (!serviceAccount) {
    throw new Error('The FIREBASE_ADMIN_SDK_CONFIG environment variable is not set.');
  }

  if (admin.apps.length > 0) {
    return admin.app();
  }

  return admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(serviceAccount)),
  });
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
      const adminApp = getAdminApp();
      const auth = adminApp.auth();
      const firestore = adminApp.firestore();

      await auth.deleteUser(userId);
      await firestore.collection("Dealers").doc(userId).delete();
      
      return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
      console.error('Error in deleteUserFlow:', error);
      // It's important to throw the error so the calling action knows it failed.
      throw new Error(error.message || 'An unexpected error occurred during user deletion.');
    }
  }
);
