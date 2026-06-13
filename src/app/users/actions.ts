
"use server";

import { z } from 'zod';
import type { User, UserRole } from '@/lib/types';
import * as bcrypt from 'bcryptjs';
import { getFirestore, doc, setDoc, runTransaction, collection, addDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { getAuth as getClientAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseApp } from '@/lib/firebase-client';
import { deleteUser } from '@/ai/flows/delete-user';
import { db as adminDb, auth as adminAuth } from "@/lib/firebase-admin";

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
  createdByUid: z.string().nullable(),
});

export interface CreateUserState {
  user?: User;
  error?: string | null;
}

export async function createUserAction(
  data: z.infer<typeof CreateUserSchema>
): Promise<CreateUserState> {
    if (!firebaseApp) {
        return { error: "Server configuration error. Cannot connect to Firebase." };
    }
    
    try {
        const auth = getClientAuth(firebaseApp);
        const firestore = getFirestore(firebaseApp);

        // 1. Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userRecord = userCredential.user;

        // 2. Hash password for Firestore storage
        const hashedPassword = await bcrypt.hash(data.password, 10);

        // 3. Prepare User object
        const newUser: User = {
            uid: userRecord.uid,
            name: data.name,
            email: data.email,
            mobileNumber: data.mobileNumber,
            password: data.password,
            hashedPassword: hashedPassword,
            role: data.role as UserRole,
            createdAt: new Date().toISOString(),
            lockerId: null,
            createdByUid: data.createdByUid ?? userRecord.uid,
            status: "active",
            address: data.address,
            shopName: data.shopName,
            dealerCode: data.dealerCode,
            key_balance: 0,
        };

        const collectionName = data.role === 'Retailer' ? 'Retailers' : 'Dealers';
        
        await setDoc(doc(firestore, collectionName, userRecord.uid), newUser);
        
        return { user: newUser };

    } catch (e: any) {
        console.error("Error creating dealer:", e);
        if (e.code === 'auth/email-already-in-use') {
            return { error: "This email address is already in use by another account." };
        }
        return { error: e.message || "An unexpected server error occurred." };
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
            // Find Actor (Manager performing action)
            let actorRef = doc(db, "Dealers", actorUid);
            let actorDoc = await transaction.get(actorRef);
            if (!actorDoc.exists()) {
                actorRef = doc(db, "Retailers", actorUid);
                actorDoc = await transaction.get(actorRef);
            }

            // Find Target (User receiving or giving keys)
            let targetRef = doc(db, "Dealers", targetUserId);
            let targetDoc = await transaction.get(targetRef);
            if (!targetDoc.exists()) {
                targetRef = doc(db, "Retailers", targetUserId);
                targetDoc = await transaction.get(targetRef);
            }

            if (!actorDoc.exists() || !targetDoc.exists()) {
                throw new Error("One or both accounts not found.");
            }

            const actorData = actorDoc.data() as User;
            const targetData = targetDoc.data() as User;
            const transferDate = new Date().toISOString();

            // Determine Source and Destination based on actionType
            // Assign: Actor -> Target (Keys moving from manager to subordinate)
            // Retrieve: Target -> Actor (Keys moving from subordinate to manager)
            const sourceRef = actionType === 'assign' ? actorRef : targetRef;
            const sourceData = actionType === 'assign' ? actorData : targetData;
            const destRef = actionType === 'assign' ? targetRef : actorRef;
            const destData = actionType === 'assign' ? targetData : actorData;

            // Check if Source has enough balance
            // Enforce balance check for all roles including Admin
            if ((sourceData.key_balance || 0) < quantity) {
                throw new Error(`${sourceData.name} has insufficient key balance.`);
            }

            // Calculate new balances
            const newSourceBalance = (sourceData.key_balance || 0) - quantity;
            const newDestBalance = (destData.key_balance || 0) + quantity;

            // Perform updates
            transaction.update(sourceRef, { key_balance: newSourceBalance });
            transaction.update(destRef, { key_balance: newDestBalance });

            const historyPayload = {
                type: actionType === 'assign' ? 'assigned' : 'retrieved',
                from: sourceData.name,
                to: destData.name,
                fromUid: actionType === 'assign' ? actorUid : targetUserId,
                toUid: actionType === 'assign' ? targetUserId : actorUid,
                quantity,
                date: transferDate
            };

            // Log history in target user's sub-collection
            const transferRef = doc(collection(targetRef, "transfers"));
            transaction.set(transferRef, historyPayload);

            // Log in global history
            const globalHistoryRef = doc(collection(db, "KeyHistory"));
            transaction.set(globalHistoryRef, historyPayload);
        });
        return { success: `Successfully ${actionType}ed ${quantity} keys.` };
    } catch (error: any) {
        console.error(`Error managing key balance:`, error);
        return { error: error.message || "An unexpected error occurred." };
    }
}

export async function requestKeysAction(retailerUid: string, quantity: number) {
    if (!firebaseApp) return { error: "Firebase not initialized." };
    const db = getFirestore(firebaseApp);
    try {
        await addDoc(collection(db, "KeyRequests"), {
            retailerUid,
            quantity,
            status: "pending",
            timestamp: serverTimestamp(),
        });
        return { success: "Key request submitted successfully." };
    } catch (e: any) {
        return { error: e.message || "Failed to submit request." };
    }
}

export async function fulfillKeyRequestAction(requestId: string, actorUid: string, targetUserId: string, quantity: number) {
    const result = await manageCodeBalanceAction({
        targetUserId,
        actorUid,
        quantity,
        actionType: 'assign'
    });

    if (result.success) {
        if (!firebaseApp) return { error: "Firebase not initialized." };
        const db = getFirestore(firebaseApp);
        await updateDoc(doc(db, "KeyRequests", requestId), { status: "completed" });
    }
    return result;
}

export async function rejectKeyRequestAction(requestId: string, reason: string) {
    if (!firebaseApp) return { error: "Firebase not initialized." };
    const db = getFirestore(firebaseApp);
    try {
        await updateDoc(doc(db, "KeyRequests", requestId), {
            status: "rejected",
            rejectionReason: reason,
        });
        return { success: "Request rejected successfully." };
    } catch (e: any) {
        return { error: e.message || "Failed to reject request." };
    }
}

export async function deleteUserAction({ userId }: { userId: string }) {
  try {
    const result = await deleteUser({ userId });
    if (result.success) {
      return { success: result.message };
    }
    return { error: result.message };
  } catch (error: any) {
    console.error("Error in deleteUserAction:", error);
    return { error: error.message || "An unexpected error occurred during account deletion." };
  }
}

export async function updatePasswordAction(userId: string, currentPassword: string, newPassword: string) {
    try {
        // 1. Fetch user to verify current password
        const dealerDoc = await adminDb.collection("Dealers").doc(userId).get();
        let userDoc = dealerDoc;
        let collectionName = "Dealers";

        if (!userDoc.exists) {
            const retailerDoc = await adminDb.collection("Retailers").doc(userId).get();
            userDoc = retailerDoc;
            collectionName = "Retailers";
        }

        if (!userDoc.exists) {
            return { error: "User profile not found." };
        }

        const userData = userDoc.data() as User;

        // 2. Verify current password
        const isCurrentValid = await bcrypt.compare(currentPassword, userData.hashedPassword);
        if (!isCurrentValid) {
            return { error: "The current password you entered is incorrect." };
        }

        // 3. Update in Firebase Authentication
        await adminAuth.updateUser(userId, {
            password: newPassword,
        });

        // 4. Update in Firestore
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await adminDb.collection(collectionName).doc(userId).update({
            password: newPassword,
            hashedPassword: hashedNewPassword
        });

        return { success: "Password updated successfully." };
    } catch (error: any) {
        console.error("Error updating password:", error);
        return { error: error.message || "An unexpected error occurred during the password update." };
    }
}
