'use server';

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';

const userRoles: UserRole[] = ["Admin", "Super Distributor", "Distributor", "Retailer"];

const CreateUserSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  role: z.enum(userRoles as [string, ...string[]]),
});

export interface CreateUserState {
  user?: User;
  error?: string | null;
}

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {
  const validatedFields = CreateUserSchema.safeParse(data);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    return {
      error: errors.name?.[0] || errors.email?.[0] || errors.role?.[0] || 'Invalid input.',
    };
  }

  try {
    const newUser: User = {
      // NOTE: This is not a production-ready way to generate IDs.
      id: `USR-${Math.random().toString(36).substring(2, 5).toUpperCase()}`,
      name: validatedFields.data.name,
      email: validatedFields.data.email,
      role: validatedFields.data.role,
      createdAt: new Date().toLocaleDateString('en-CA'), // YYYY-MM-DD format
      lockerId: null,
    };

    // In a real app, you would save this to a database.
    // The new user will not persist in the table displayed on the page.
    console.log('New user created:', newUser);

    return { user: newUser };
  } catch (e) {
    console.error(e);
    return { error: 'An unexpected error occurred. Please try again.' };
  }
}
