'use server';

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';

const userRoles: UserRole[] = ["Admin", "Super Distributor", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobileNumber: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  email: z.string().email({ message: "Please enter a valid email." }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(userRoles as [string, ...string[]]),
  address: z.string().min(5, { message: 'Address is required.' }),
  shopName: z.string().min(2, { message: 'Shop Name is required.' }),
  dealerCode: z.string().min(1, { message: 'Dealer Code is required.' }),
});

export interface CreateUserState {
  user?: Omit<User, 'hashedPassword'>;
  error?: string | null;
}

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {

  if (!firestore) {
    return { error: serverConfigError };
  }

  const validatedFields = CreateUserSchema.safeParse(data);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return {
      error: firstError || 'Invalid input.',
    };
  }

  try {
    const { name, mobileNumber, email, password, role, address, shopName, dealerCode } = validatedFields.data;

    const usersRef = firestore.collection('users');
    const existingUserSnapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();
    if (!existingUserSnapshot.empty) {
      return { error: 'A user with this mobile number already exists.' };
    }
    const existingEmailSnapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (!existingEmailSnapshot.empty) {
        return { error: 'A user with this email address already exists.' };
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a user in Firebase Auth. The UID will be our single source of truth.
    const userRecord = await admin.auth().createUser({
      email,
      displayName: name,
    });
    const uid = userRecord.uid;

    const newUser: User = {
      uid,
      name,
      mobileNumber,
      email,
      hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      status: 'active',
      createdByUid: 'admin-user-id', // Placeholder for the currently logged-in admin's UID
      lockerId: null,
      address,
      shopName,
      dealerCode,
      codeBalance: 0, // Initialize with zero codes
    };

    // Save the full user profile to the 'users' collection in Firestore
    await usersRef.doc(uid).set(newUser);

    console.log('New user created in Auth and Firestore:', { uid: newUser.uid, name: newUser.name });

    // Don't send the password hash back to the client.
    const { hashedPassword: _, ...userToReturn } = newUser;

    return { user: userToReturn };
  } catch (e: any) {
    console.error('Create User Action Error:', e);
     if (e.code === 'auth/email-already-exists') {
        return { error: 'A user with this email address already exists in Firebase Authentication.' };
    }
    // In a production app, you might want to clean up the created Auth user if the Firestore write fails.
    return { error: e.message || 'An unexpected error occurred. Please try again.' };
  }
}
