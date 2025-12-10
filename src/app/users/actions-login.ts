"use server";

import { z } from 'zod';
import { getFirestore, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { firebaseApp } from '@/lib/firebase-client';
import type { User } from '@/lib/types';
import * as bcrypt from 'bcryptjs';

const db = firebaseApp ? getFirestore(firebaseApp) : null;

const LoginSchema = z.object({
  mobileNumber: z.string().min(1, 'Mobile number is required.'),
  password: z.string().min(1, 'Password is required.'),
});

export interface LoginState {
  success?: boolean;
  error?: string | null;
  user?: {
    email: string;
    // Do not send password back to client
  };
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  if (!db) {
    return { error: "Server configuration error: Cannot connect to Firebase." };
  }

  const validatedFields = LoginSchema.safeParse({
    mobileNumber: formData.get('mobileNumber'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.mobileNumber?.[0] 
          || validatedFields.error.flatten().fieldErrors.password?.[0]
          || "Invalid input.",
    };
  }

  const { mobileNumber, password } = validatedFields.data;

  try {
    const usersRef = collection(db, 'Dealers');
    const q = query(usersRef, where('mobileNumber', '==', mobileNumber), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { error: 'Invalid mobile number or password.' };
    }

    const userDoc = querySnapshot.docs[0];
    const user = userDoc.data() as User;

    if (!user.hashedPassword) {
        return { error: 'User data is incomplete. Cannot verify password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return { error: 'Invalid mobile number or password.' };
    }
    
    // Password is valid, return user email to client to complete sign-in
    return { 
        success: true, 
        user: { email: user.email }
    };

  } catch (error) {
    console.error("Login action error:", error);
    return { error: 'An unexpected server error occurred.' };
  }
}