
"use server";

import { z } from 'zod';
import type { User, UserRole, GeneratedCode } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getFirestore, doc, setDoc, getDoc, writeBatch, runTransaction, collection, serverTimestamp as firestoreServerTimestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';

// Use a dynamic import for firebase-admin to avoid issues in client-side bundles
let admin: typeof import('firebase-admin') | null = null;
let adminApp: import('firebase-admin').app.App | null = null;

async function initializeAdmin() {
  if (!admin) {
    admin = await import('firebase-admin');
    const serviceAccount = process.env.FIREBASE_ADMIN_SDK_CONFIG;
    if (serviceAccount) {
      if (!admin.apps.length) {
        adminApp = admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(serviceAccount)),
        });
      } else {
        adminApp = admin.app();
      }
    } else {
        console.warn("FIREBASE_ADMIN_SDK_CONFIG is not set. Admin features like user deletion will not work.");
    }
  }
  return { admin, adminApp };
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


export interface DeleteUserState {
  success?: boolean;
  error?: string | null;
}

export async function deleteUserAction(data: { userId: string }): Promise<DeleteUserState> {
  const { adminApp } = await initializeAdmin();
  if (!adminApp) {
    return { error: "Server admin not initialized. Cannot delete user." };
  }
  try {
    const auth = adminApp.auth();
    const firestore = adminApp.firestore();

    await auth.deleteUser(data.userId);
    await firestore.collection("Dealers").doc(data.userId).delete();

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return { error: error.message || "An unexpected error occurred during user deletion." };
  }
}

const ManageCodeBalanceSchema = z.object({
    targetUserId: z.string(),
    actorUid: z.string(),
    quantity: z.number().int().positive(),
    actionType: z.enum(['assign', 'retrieve']),
});

export interface ManageCodeBalanceState {
  success?: string;
  error?: string | null;
}

export async function manageCodeBalanceAction(data: z.infer<typeof ManageCodeBalanceSchema>): Promise<ManageCodeBalanceState> {
    const validation = ManageCodeBalanceSchema.safeParse(data);
    if (!validation.success) {
        return { error: "Invalid data provided." };
    }

    if (!firebaseApp) return { error: "Firebase not initialized." };
    const db = getFirestore(firebaseApp);
    const { targetUserId, actorUid, quantity, actionType } = validation.data;

    try {
        await runTransaction(db, async (transaction) => {
            const actorRef = doc(db, "Dealers", actorUid);
            const targetRef = doc(db, "Dealers", targetUserId);
            
            const [actorDoc, targetDoc] = await Promise.all([
                transaction.get(actorRef),
                transaction.get(targetRef)
            ]);

            if (!actorDoc.exists() || !targetDoc.exists()) {
                throw new Error("One or both users not found.");
            }

            const actorData = actorDoc.data() as User;
            const targetData = targetDoc.data() as User;
            const transferDate = new Date().toISOString();

            if (actionType === 'assign') {
                if (actorData.role !== 'Admin' && (actorData.codeBalance < quantity)) {
                    throw new Error("Insufficient code balance to assign.");
                }
                
                // If actor is Admin, generate new codes
                if (actorData.role === 'Admin') {
                    const codesBatch = writeBatch(db);
                    for (let i = 0; i < quantity; i++) {
                        const codeId = doc(collection(db, 'codes')).id;
                        const newCode: Omit<GeneratedCode, 'id'> = {
                            code: codeId.substring(0, 8).toUpperCase(),
                            ownerUid: targetUserId,
                            generatedByUid: actorUid,
                            generatedAt: transferDate,
                            status: 'available',
                        };
                        codesBatch.set(doc(db, 'codes', codeId), newCode);
                    }
                    await codesBatch.commit();
                } else {
                    // Transfer ownership of existing codes
                    const codesQuery = collection(db, 'codes');
                    const q = query(codesQuery, where('ownerUid', '==', actorUid), where('status', '==', 'available'), limit(quantity));
                    const codesSnapshot = await getDocs(q);
                    if (codesSnapshot.size < quantity) {
                        throw new Error("Not enough available codes to transfer.");
                    }
                    const codesBatch = writeBatch(db);
                    codesSnapshot.forEach(codeDoc => {
                        codesBatch.update(codeDoc.ref, { ownerUid: targetUserId });
                    });
                    await codesBatch.commit();
                }

                if (actorData.role !== 'Admin') {
                    transaction.update(actorRef, { codeBalance: actorData.codeBalance - quantity });
                }
                transaction.update(targetRef, { codeBalance: targetData.codeBalance + quantity });

                const transferRef = doc(collection(targetRef, "transfers"));
                transaction.set(transferRef, {
                    type: 'assigned',
                    from: actorData.name,
                    to: targetData.name,
                    fromUid: actorUid,
                    toUid: targetUserId,
                    quantity,
                    date: transferDate
                });

            } else { // actionType is 'retrieve'
                if (targetData.codeBalance < quantity) {
                    throw new Error("Target user has insufficient balance to retrieve.");
                }

                // Transfer ownership of existing codes back
                const codesQuery = collection(db, 'codes');
                const q = query(codesQuery, where('ownerUid', '==', targetUserId), where('status', '==', 'available'), limit(quantity));
                const codesSnapshot = await getDocs(q);
                 if (codesSnapshot.size < quantity) {
                    throw new Error("Not enough available codes to retrieve.");
                }
                const codesBatch = writeBatch(db);
                codesSnapshot.forEach(codeDoc => {
                    codesBatch.update(codeDoc.ref, { ownerUid: actorUid });
                });
                await codesBatch.commit();
                
                if (actorData.role !== 'Admin') {
                    transaction.update(actorRef, { codeBalance: actorData.codeBalance + quantity });
                }
                transaction.update(targetRef, { codeBalance: targetData.codeBalance - quantity });

                const transferRef = doc(collection(targetRef, "transfers"));
                transaction.set(transferRef, {
                    type: 'retrieved',
                    from: targetData.name,
                    to: actorData.name,
                    fromUid: targetUserId,
                    toUid: actorUid,
                    quantity,
                    date: transferDate
                });
            }
        });
        return { success: `Successfully ${actionType}ed ${quantity} codes.` };
    } catch (error: any) {
        console.error(`Error managing code balance:`, error);
        return { error: error.message || "An unexpected server error occurred." };
    }
}
