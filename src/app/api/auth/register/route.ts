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
    if (!db) {
       return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    const { mobileNumber, password, role = "Retailer", name = "New User" } = await request.json();

    if (!mobileNumber || !password) {
        return NextResponse.json({ error: "Mobile number and password are required" }, { status: 400 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Determine collection
    const collectionName = role === 'Retailer' ? 'Retailers' : 'Dealers';

    // Check if user already exists
    const snapshot = await db.collection(collectionName).where("mobileNumber", "==", mobileNumber).limit(1).get();

    if (!snapshot.empty) {
      return NextResponse.json({ error: "Account already exists" }, { status: 409 });
    }

    // Create new user document
    const docRef = db.collection(collectionName).doc();
    const newUser = {
      uid: docRef.id, // Explicit UID field
      name: name,
      mobileNumber,
      hashedPassword: hashedPassword,
      createdAt: new Date().toISOString(),
      role: role,
      key_balance: 0,
      status: "active",
      shopName: "",
      address: "",
      dealerCode: ""
    };

    await docRef.set(newUser);

    const response = NextResponse.json(
      { message: "Account created successfully", userId: docRef.id, uid: docRef.id },
      { status: 201 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error("Registration error:", error);
    const res = NextResponse.json({ error: "Internal server error" }, { status: 500 });
    return setCorsHeaders(res, request);
  }
}
