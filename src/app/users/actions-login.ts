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
    // Check BOTH Dealers and Retailers collections
    let user = null;

    const dq = query(collection(db, 'Dealers'), where('mobileNumber', '==', mobileNumber), limit(1));
    const dealersSnap = await getDocs(dq);
    
    if (!dealersSnap.empty) {
      user = dealersSnap.docs[0].data() as User;
    } else {
      const rq = query(collection(db, 'Retailers'), where('mobileNumber', '==', mobileNumber), limit(1));
      const retailersSnap = await getDocs(rq);
      if (!retailersSnap.empty) {
        user = retailersSnap.docs[0].data() as User;
      }
    }

    if (!user) {
      return { error: 'Invalid mobile number or password.' };
    }

    if (!user.hashedPassword) {
        return { error: 'User data is incomplete. Cannot verify password.' };
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return { error: 'Invalid mobile number or password.' };
    }
    
    return { 
        success: true, 
        user: { email: user.email }
    };

  } catch (error) {
    console.error("Login action error:", error);
    return { error: 'An unexpected server error occurred.' };
  }
}