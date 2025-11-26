"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeAdminApp } from '@/lib/firebase-admin';

// All firebase-admin related code has been removed as it was causing server configuration errors.
// The login logic will be handled on the client-side for now to bypass the environment variable issue.
// This file will be updated with correct server actions as we build out features.

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
    try {
        await initializeAdminApp();
        const auth = getAuth();
        const firestore = getFirestore();

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({
            email: data.email,
            password: data.password,
            displayName: data.name,
            phoneNumber: `+91${data.mobileNumber}` // Assuming Indian phone numbers
        });

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser: Omit<User, 'uid'> = {
            name: data.name,
            email: data.email,
            mobileNumber: data.mobileNumber,
            hashedPassword: hashedPassword,
            role: data.role,
            createdAt: new Date().toISOString(),
            lockerId: null,
            createdByUid: data.createdByUid,
            status: "active",
            address: data.address,
            shopName: data.shopName,
            dealerCode: data.dealerCode,
            codeBalance: 0,
        };

        // Create user document in Firestore
        await firestore.collection("Dealers").doc(userRecord.uid).set(newUser);
        
        return { user: { ...newUser, uid: userRecord.uid } };

    } catch (e: any) {
        console.error("Error creating user:", e);
        // Provide more specific error messages
        if (e.code === 'auth/email-already-exists') {
            return { error: "This email address is already in use by another account." };
        }
        if (e.code === 'auth/phone-number-already-exists') {
            return { error: "This phone number is already in use by another account." };
        }
        return { error: e.message || "An unexpected error occurred while creating the user." };
    }
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
