'use server';

import { z } from 'zod';
import type { User, UserRole, CodeTransfer } from '@/lib/types';
import { randomBytes } from 'crypto';

// This is a placeholder for server-side actions.
// With the new client-side approach, we might not need firebase-admin here anymore for user creation.
// For now, let's keep it simple and focus on what's needed.
// Note: If we need complex admin actions in the future, we'll have to revisit the server-side authentication.

const userRoles: UserRole[] = ["Admin", "Super", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(userRoles as [string, ...string[]]),
  address: z.string().min(5, { message: 'Address is required.' }),
  shopName: z.string().min(2, { message: 'Shop Name is required.' }),
  dealerCode: z.string().min(1, { message: 'Dealer Code is required.' }),
  createdByUid: z.string().min(1, { message: 'Creator UID is missing.' }),
});

export interface CreateUserState {
  user?: Omit<User, 'hashedPassword' | 'password'>;
  error?: string | null;
}

// This function is now a placeholder. The actual user creation will happen on the client
// and this server action will just validate data and maybe persist to firestore.
// This simplifies the authentication flow significantly.
export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {

  // The actual user creation in Firebase Auth will be handled client-side
  // to avoid server-side admin SDK complexities in this environment.
  // This action can be used to validate and store additional user data in Firestore
  // after the client has successfully created the auth user.
  // For now, we'll just return an error to indicate this flow needs to be fully client-side.

  return {
    error: "User creation is not fully implemented on the server. Please implement client-side user creation with Firebase Auth."
  };
}


export interface DeleteUserState {
  success?: boolean;
  error?: string | null;
}

const DeleteUserSchema = z.object({
  userId: z.string().min(1, { message: 'User ID is required.' }),
});

export async function deleteUserAction(
  data: z.infer<typeof DeleteUserSchema>
): Promise<DeleteUserState> {
  // Deleting users requires the Admin SDK, which we are avoiding for now.
  return { error: 'User deletion is not implemented in this version.' };
}

const ManageCodeBalanceSchema = z.object({
  targetUserId: z.string().min(1),
  actorUid: z.string().min(1),
  quantity: z.number().int().positive({ message: "Quantity must be a positive number." }),
  actionType: z.enum(['assign', 'retrieve']),
});

export interface ManageCodeBalanceState {
  success?: string;
  error?: string | null;
}

function generateUniqueCodes(quantity: number): string[] {
  const codes = new Set<string>();
  while (codes.size < quantity) {
    const code = randomBytes(7).toString('hex'); // 14 hex characters
    codes.add(code);
  }
  return Array.from(codes);
}


export async function manageCodeBalanceAction(
  data: z.infer<typeof ManageCodeBalanceSchema>
): Promise<ManageCodeBalanceState> {
    return { error: "Code balance management is not implemented in this version due to server-side auth complexities." };
}
