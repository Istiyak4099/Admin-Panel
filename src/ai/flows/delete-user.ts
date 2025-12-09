
/**
 * @fileoverview A flow for deleting a user from Firebase Authentication and Firestore.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as admin from 'firebase-admin';

// Initialize the app if it's not already initialized.
if (admin.apps.length === 0) {
  admin.initializeApp();
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

const deleteUserFlow = ai.defineFlow(
  {
    name: 'deleteUserFlow',
    inputSchema: DeleteUserInputSchema,
    outputSchema: DeleteUserOutputSchema,
  },
  async ({ userId }) => {
    try {
      const auth = admin.auth();
      const firestore = admin.firestore();

      // 1. Delete user from Firebase Authentication
      await auth.deleteUser(userId);

      // 2. Delete user's document from Firestore
      await firestore.collection("Dealers").doc(userId).delete();
      
      return { success: true, message: 'User deleted successfully.' };
    } catch (error: any) {
      console.error('Error in deleteUserFlow:', error);
      // It's important to throw the error so the calling action knows it failed.
      throw new Error(error.message || 'An unexpected error occurred during user deletion.');
    }
  }
);
