'use server';

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import bcrypt from 'bcryptjs';

// In a real app, you would import and use your firestore instance
// to check for existing mobile numbers and save the new user.
// import { firestore } from '@/lib/firebase-admin';

const userRoles: UserRole[] = ["Admin", "Super Distributor", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  mobile_number: z.string().min(10, { message: 'Please enter a valid mobile number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(userRoles as [string, ...string[]]),
});

export interface CreateUserState {
  user?: Omit<User, 'password'>; // Don't send password hash back to client
  error?: string | null;
}

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {
  const validatedFields = CreateUserSchema.safeParse(data);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    // Return the first error message
    const firstError = Object.values(errors).flat()[0];
    return {
      error: firstError || 'Invalid input.',
    };
  }

  try {
    const { name, mobile_number, password, role } = validatedFields.data;

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser: User = {
      // NOTE: This is not a production-ready way to generate IDs.
      id: `USR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      name,
      mobile_number,
      password: hashedPassword,
      role,
      createdAt: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
      status: 'active', // Default to active for new users
      parentId: 'admin-user-id', // In a real app, you would get the current logged-in user's ID here
      lockerId: null,
    };

    // In a real app, you would save this to a database like Firestore.
    // e.g., await firestore.collection('users').doc(newUser.id).set(newUser);
    // For this demo, the new user will not persist in the table displayed on the page.
    console.log('New user created (this would be saved to Firestore):', newUser);

    // Don't send the password hash back to the client.
    const { password: _, ...userToReturn } = newUser;

    return { user: userToReturn };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
