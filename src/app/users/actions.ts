"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';

// All firebase-admin related code has been removed as it was causing server configuration errors.
// The login logic will be handled on the client-side for now to bypass the environment variable issue.
// This file will be updated with correct server actions as we build out features.

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
  // This server action is temporarily disabled to prevent server configuration errors.
  // The login logic has been moved to the credentials-login-form.tsx component.
  console.error("loginAction is called but is not implemented correctly. This should be handled on the client.");
  return { error: 'Login is not configured correctly. Please contact support.' };
}


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

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {
    // This action still depends on firebase-admin and will fail.
    // It needs to be refactored to use client-side SDK calls or a properly configured server environment.
    // For now, focusing on the login flow.
    return { error: "User creation is not implemented in this version due to server-side auth complexities." };
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
   return { error: "User deletion is not implemented in this version." };
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

export async function manageCodeBalanceAction(
  data: z.infer<typeof ManageCodeBalanceSchema>
): Promise<ManageCodeBalanceState> {
    return { error: "Code balance management is not implemented in this version due to server-side auth complexities." };
}
