
"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';

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
  createdByUid: z.string().nullable(),
});

export interface CreateUserState {
  user?: Omit<User, 'hashedPassword' | 'password'>;
  error?: string | null;
}

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {
    if (!firebaseApp) {
        return { error: "Server configuration error. Cannot connect to Firebase." };
    }
    
    try {
        const auth = getAuth(firebaseApp);
        const firestore = getFirestore(firebaseApp);

        // This uses the client SDK, but in a server action it's running on the server.
        // It's a workaround for environments where the Admin SDK is problematic.
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userRecord = userCredential.user;

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const newUser: Omit<User, 'uid'> = {
            name: data.name,
            email: data.email,
            mobileNumber: data.mobileNumber,
            hashedPassword: hashedPassword,
            role: data.role,
            createdAt: new Date().toISOString(),
            lockerId: null,
            createdByUid: data.createdByUid ?? userRecord.uid,
            status: "active",
            address: data.address,
            shopName: data.shopName,
            dealerCode: data.dealerCode,
            codeBalance: 0,
        };

        await setDoc(doc(firestore, "Dealers", userRecord.uid), newUser);
        
        return { user: { ...newUser, uid: userRecord.uid } };

    } catch (e: any) {
        console.error("Error creating user:", e);
        if (e.code === 'auth/email-already-in-use') {
            return { error: "This email address is already in use by another account." };
        }
        if (e.code === 'auth/phone-number-already-exists') {
            return { error: "This phone number is already in use by another account." };
        }
        return { error: e.message || "An unexpected server error occurred while creating the user." };
    }
}

// Stubs for actions that are not implemented to avoid build errors.
export interface DeleteUserState {
  success?: boolean;
  error?: string | null;
}

export async function deleteUserAction(data: { userId: string }): Promise<DeleteUserState> {
  return { error: "User deletion is not implemented yet." };
}

export interface ManageCodeBalanceState {
  success?: string;
  error?: string | null;
}

export async function manageCodeBalanceAction(data: any): Promise<ManageCodeBalanceState> {
  return { error: "Code balance management is not implemented yet." };
}
