
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import * as bcrypt from 'bcryptjs';
import { setCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNumber, password, role = "Distributor", name = "New User" } = await request.json();

    // 1. Validate mobileNumber
    const mobileRegex = /^\+?[1-9]\d{9,14}$/;
    if (!mobileRegex.test(mobileNumber)) {
      const res = NextResponse.json(
        { error: "Invalid mobile number. Include country code e.g. +880XXXXXXXXXX" },
        { status: 400 }
      );
      return setCorsHeaders(res, request);
    }

    // 2. Validate password
    if (!password || password.length < 8) {
      const res = NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
      return setCorsHeaders(res, request);
    }

    // 3. Determine collection
    const collectionName = role === 'Retailer' ? 'Retailers' : 'Dealers';

    // 4. Check if user already exists in Firestore
    const snapshot = await db.collection(collectionName).where("mobileNumber", "==", mobileNumber).limit(1).get();

    if (!snapshot.empty) {
      const res = NextResponse.json(
        { error: "An account with this number already exists" },
        { status: 409 }
      );
      return setCorsHeaders(res, request);
    }

    // 5. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Create new user document
    // NOTE: This route assumes registration is for the Dealer/Retailer themselves
    // In a real scenario, you'd also create them in Firebase Auth here if needed
    const docRef = await db.collection(collectionName).add({
      uid: "", // Will be updated if doc ID is used as UID
      name: name,
      mobileNumber,
      hashedPassword: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true,
      role: role,
      key_balance: 0,
      status: "active",
      shopName: "",
      address: "",
      dealerCode: ""
    });

    // Update the document with its own ID as the UID field for consistency
    await docRef.update({ uid: docRef.id });

    // 7. Return success response
    const response = NextResponse.json(
      { message: "Account created successfully", userId: docRef.id, uid: docRef.id },
      { status: 201 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const res = NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
    return setCorsHeaders(res, request);
  }
}
