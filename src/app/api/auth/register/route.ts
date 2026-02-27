
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
    const { mobileNumber, password } = await request.json();

    // 2. Validate mobileNumber
    const mobileRegex = /^\+?[1-9]\d{9,14}$/;
    if (!mobileRegex.test(mobileNumber)) {
      const res = NextResponse.json(
        { error: "Invalid mobile number. Include country code e.g. +880XXXXXXXXXX" },
        { status: 400 }
      );
      return setCorsHeaders(res, request);
    }

    // 3. Validate password
    if (!password || password.length < 8) {
      const res = NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
      return setCorsHeaders(res, request);
    }

    // 4. Check if user already exists in 'users' collection
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("mobileNumber", "==", mobileNumber).limit(1).get();

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
    const docRef = await usersRef.add({
      mobileNumber,
      hashedPassword: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true,
    });

    // 7. Return success response
    const response = NextResponse.json(
      { message: "Account created successfully", userId: docRef.id },
      { status: 201 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    // 8. Error handling
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const res = NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
    return setCorsHeaders(res, request);
  }
}
