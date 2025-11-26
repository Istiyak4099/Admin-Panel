"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { credential } from 'firebase-admin';
import * as admin from 'firebase-admin';

// Helper function to initialize the app (avoids multiple initializations)
const initializeAdminApp = () => {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    // Check if the essential environment variables are set.
    // If not, we cannot initialize the admin app.
    if (!projectId || !privateKey || !clientEmail) {
        if (admin.apps.length === 0) { // Only check if no app is initialized
            console.error("Firebase server-side environment variables are not set. Cannot initialize admin app.");
            return null;
        }
        return admin.app(); // Return existing app if already initialized
    }
    
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: credential.cert({ projectId, privateKey, clientEmail }),
        });
    }
    return admin.app();
};


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
    const adminApp = initializeAdminApp();
    if (!adminApp) {
        return { error: "Server configuration error. Cannot connect to Firebase." };
    }
    
    try {
        const auth = getAuth(adminApp);
        const firestore = getFirestore(adminApp);

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
        if (e.code === 'auth/email-already-exists') {
            return { error: "This email address is already in use by another account." };
        }
        if (e.code === 'auth/phone-number-already-exists') {
            return { error: "This phone number is already in use by another account." };
        }
        return { error: e.message || "An unexpected server error occurred while creating the user." };
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
   return { error: "User deletion is not implemented yet." };
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
    return { error: "Code balance management is not implemented yet." };
}
