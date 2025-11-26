"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';

// This is a placeholder for server-side actions.
// With the new client-side approach, we might not need firebase-admin here anymore for user creation.
// For now, let's keep it simple and focus on what's needed.
// Note: If we need complex admin actions in the future, we'll have to revisit the server-side authentication.

// --- Admin App Initialization ---
// This is a critical change to ensure the Admin SDK initializes correctly.
// We are now loading the credentials from environment variables.
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

function getFirebaseAdmin(): { auth: ReturnType<typeof getAuth>, db: ReturnType<typeof getFirestore> } {
  if (getApps().length > 0) {
    const app = getApps()[0] as App;
    return { auth: getAuth(app), db: getFirestore(app) };
  }

  if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
    throw new Error('Firebase server-side environment variables are not set.');
  }

  const app = initializeApp({
    credential: cert(serviceAccount),
  });
  return { auth: getAuth(app), db: getFirestore(app) };
}


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
    const { db, auth } = getFirebaseAdmin();

    const usersRef = db.collection('Dealers');
    const q = usersRef.where('mobileNumber', '==', data.mobileNumber);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return { error: 'Invalid mobile number or password.' };
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data() as User;

    if (!user.hashedPassword) {
      return { error: 'User does not have a password set. Please contact an administrator.' };
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.hashedPassword);

    if (!isPasswordValid) {
      return { error: 'Invalid mobile number or password.' };
    }

    const customToken = await auth.createCustomToken(userDoc.id, { role: user.role });

    return { token: customToken };

  } catch (e: any) {
    console.error('Login action error:', e);
    // Provide a more user-friendly error message
    if (e.message.includes('environment variables')) {
        return { error: 'Server configuration error. Please contact support.' };
    }
    return { error: e.message || 'An unexpected server error occurred.' };
  }
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
    try {
        const { auth, db } = getFirebaseAdmin();
        const { email, password, name, mobileNumber, role, address, shopName, dealerCode, createdByUid } = data;

        // Check for existing user by mobile or email in Firestore
        const usersRef = db.collection('Dealers');
        const mobileQuery = usersRef.where('mobileNumber', '==', mobileNumber);
        const emailQuery = usersRef.where('email', '==', email);

        const [mobileSnapshot, emailSnapshot] = await Promise.all([
            mobileQuery.get(),
            emailQuery.get()
        ]);

        if (!mobileSnapshot.empty) {
            throw new Error('A user with this mobile number already exists.');
        }
        if (!emailSnapshot.empty) {
            throw new Error('A user with this email address already exists.');
        }

        // Create user in Firebase Auth
        const userRecord = await auth.createUser({ email, password });
        const newAuthUser = userRecord;

        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user data for Firestore
        const newUser: Omit<User, 'uid'> = {
            name,
            mobileNumber,
            email,
            hashedPassword, // Store the hashed password
            role,
            createdAt: new Date().toISOString(),
            status: 'active',
            createdByUid: createdByUid,
            lockerId: null,
            address,
            shopName,
            dealerCode,
            codeBalance: 0,
        };

        // Save user data to Firestore
        await db.collection('Dealers').doc(newAuthUser.uid).set(newUser);
        
        return { user: { ...newUser, uid: newAuthUser.uid } };

    } catch (error: any) {
        let errorMessage = "An unexpected error occurred during user creation.";
         if (error.code) {
            switch (error.code) {
                case 'auth/email-already-exists':
                    errorMessage = "This email is already associated with an account.";
                    break;
                case 'auth/weak-password':
                    errorMessage = "The password is too weak. Please choose a stronger password.";
                    break;
                default:
                    errorMessage = `Server error: ${error.message}`;
            }
        } else if (error.message) {
             errorMessage = error.message;
        }
        return { error: errorMessage };
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
   try {
    const { auth, db } = getFirebaseAdmin();
    const { userId } = data;

    await auth.deleteUser(userId);
    await db.collection('Dealers').doc(userId).delete();

    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'Failed to delete user.' };
  }
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
