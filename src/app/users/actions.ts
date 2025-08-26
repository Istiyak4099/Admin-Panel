'use server';

import { z } from 'zod';
import type { User, UserRole, CodeTransfer } from '@/lib/types';
import bcrypt from 'bcryptjs';
import { firestore, serverConfigError } from '@/lib/firebase-admin';
import admin from 'firebase-admin';
import { randomBytes } from 'crypto';

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
    const { name, mobileNumber, email, password, role, address, shopName, dealerCode, createdByUid } = validatedFields.data;

    const usersRef = firestore.collection('Dealers');
    const existingUserSnapshot = await usersRef.where('mobileNumber', '==', mobileNumber).limit(1).get();
    if (!existingUserSnapshot.empty) {
      return { error: 'A user with this mobile number already exists.' };
    }
    const existingEmailSnapshot = await usersRef.where('email', '==', email).limit(1).get();
    if (!existingEmailSnapshot.empty) {
        return { error: 'A user with this email address already exists.' };
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

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
      password,
      hashedPassword,
      role,
      createdAt: new Date().toISOString(),
      status: 'active',
      createdByUid,
      lockerId: null,
      address,
      shopName,
      dealerCode,
      codeBalance: 0,
    };

    await usersRef.doc(uid).set(newUser);

    console.log('New user created in Auth and Firestore:', { uid: newUser.uid, name: newUser.name });

    const { hashedPassword: _, password: __, ...userToReturn } = newUser;

    return { user: userToReturn };
  } catch (e: any) {
    console.error('Create User Action Error:', e);
     if (e.code === 'auth/email-already-exists') {
        return { error: 'A user with this email address already exists in Firebase Authentication.' };
    }
    return { error: e.message || 'An unexpected error occurred. Please try again.' };
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
  
  if (!firestore || !admin.apps.length) {
    return { error: serverConfigError };
  }

  const validatedFields = DeleteUserSchema.safeParse(data);

  if (!validatedFields.success) {
    return { error: 'Invalid User ID.' };
  }
  
  const { userId } = validatedFields.data;

  try {
    await admin.auth().deleteUser(userId);
    const userDocRef = firestore.collection('Dealers').doc(userId);
    await userDocRef.delete();
    console.log(`Successfully deleted user ${userId} from Auth and Firestore.`);
    return { success: true };
  } catch (e: any) {
    console.error('Delete User Action Error:', e);
    if (e.code === 'auth/user-not-found') {
        try {
            const userDocRef = firestore.collection('Dealers').doc(userId);
            await userDocRef.delete();
            console.log(`Deleted orphan Firestore user ${userId}. Auth user was already gone.`);
            return { success: true };
        } catch (fsError: any) {
             console.error('Error deleting orphan Firestore user:', fsError);
             return { error: fsError.message || 'An unexpected error occurred while deleting from Firestore.' };
        }
    }
    return { error: e.message || 'An unexpected error occurred.' };
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

function generateUniqueCodes(quantity: number): string[] {
  const codes = new Set<string>();
  while (codes.size < quantity) {
    const code = randomBytes(7).toString('hex'); // 14 hex characters
    codes.add(code);
  }
  return Array.from(codes);
}


export async function manageCodeBalanceAction(
  data: z.infer<typeof ManageCodeBalanceSchema>
): Promise<ManageCodeBalanceState> {
  if (!firestore) {
    return { error: serverConfigError };
  }

  const validatedFields = ManageCodeBalanceSchema.safeParse(data);

  if (!validatedFields.success) {
    const errors = validatedFields.error.flatten().fieldErrors;
    const firstError = Object.values(errors).flat()[0];
    return { error: firstError || 'Invalid input.' };
  }

  const { targetUserId, actorUid, quantity, actionType } = validatedFields.data;

  if (targetUserId === actorUid) {
      return { error: "You cannot transfer codes to yourself." };
  }

  const actorRef = firestore.collection('Dealers').doc(actorUid);
  const targetUserRef = firestore.collection('Dealers').doc(targetUserId);
  const codesRef = firestore.collection('codes');

  try {
    await firestore.runTransaction(async (transaction) => {
      const actorDoc = await transaction.get(actorRef);
      const targetUserDoc = await transaction.get(targetUserRef);

      if (!actorDoc.exists || !targetUserDoc.exists) {
        throw new Error("One or both users not found.");
      }

      const actorData = actorDoc.data() as User;
      const targetUserData = targetUserDoc.data() as User;

      if (actionType === 'assign') {
        if (actorData.role === 'Admin') {
          // ADMIN GENERATION
          const newCodes = generateUniqueCodes(quantity);
          for (const code of newCodes) {
            const newCodeRef = codesRef.doc();
            transaction.set(newCodeRef, {
              code,
              ownerUid: targetUserId,
              generatedByUid: actorUid,
              generatedAt: new Date().toISOString(),
              status: 'available',
            });
          }
          transaction.update(targetUserRef, { codeBalance: admin.firestore.FieldValue.increment(quantity) });
        } else {
          // USER-TO-USER TRANSFER
          if (actorData.codeBalance < quantity) {
            throw new Error(`Insufficient code balance. You have ${actorData.codeBalance}, but tried to assign ${quantity}.`);
          }

          const allCodesOwnedByActorQuery = codesRef.where('ownerUid', '==', actorUid);
          const allCodesOwnedByActorSnapshot = await transaction.get(allCodesOwnedByActorQuery);
          const availableCodes = allCodesOwnedByActorSnapshot.docs.filter(doc => doc.data().status === 'available');

          if (availableCodes.length < quantity) {
            throw new Error(`Not enough available codes to transfer. Found only ${availableCodes.length}.`);
          }

          const codesToTransfer = availableCodes.slice(0, quantity);
          for (const doc of codesToTransfer) {
            transaction.update(doc.ref, { ownerUid: targetUserId });
          }
          transaction.update(actorRef, { codeBalance: admin.firestore.FieldValue.increment(-quantity) });
          transaction.update(targetUserRef, { codeBalance: admin.firestore.FieldValue.increment(quantity) });
        }
      } else { // 'retrieve'
        const allCodesOwnedByUserQuery = codesRef.where('ownerUid', '==', targetUserId);
        const allCodesOwnedByUserSnapshot = await transaction.get(allCodesOwnedByUserQuery);
        const availableCodes = allCodesOwnedByUserSnapshot.docs.filter(doc => doc.data().status === 'available');

        if (availableCodes.length < quantity) {
          throw new Error(`Cannot retrieve ${quantity} codes. User only has ${availableCodes.length} available codes.`);
        }
        
        const codesToProcess = availableCodes.slice(0, quantity);

        if (actorData.role === 'Admin') {
          // ADMIN DELETION
          for (const doc of codesToProcess) {
            transaction.delete(doc.ref);
          }
        } else {
          // USER-TO-USER TRANSFER BACK
          for (const doc of codesToProcess) {
            transaction.update(doc.ref, { ownerUid: actorUid });
          }
          transaction.update(actorRef, { codeBalance: admin.firestore.FieldValue.increment(quantity) });
        }
        transaction.update(targetUserRef, { codeBalance: admin.firestore.FieldValue.increment(-quantity) });
      }

      // Log the transfer
      const transferRef = targetUserRef.collection('transfers').doc();
      const transferDetails: Omit<CodeTransfer, 'id'> = {
        type: actionType,
        from: actionType === 'assign' ? actorData.name : targetUserData.name,
        to: actionType === 'assign' ? targetUserData.name : actorData.name,
        fromUid: actorUid,
        toUid: targetUserId,
        quantity,
        date: new Date().toISOString(),
      };
      transaction.set(transferRef, transferDetails);
    });

    return { success: `Successfully ${actionType === 'assign' ? 'assigned' : 'retrieved'} ${quantity} codes.` };
  } catch (e: any) {
    console.error('Manage Code Balance Action Error:', e);
    return { error: e.message || 'An unexpected error occurred.' };
  }
}
