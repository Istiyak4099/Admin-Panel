
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { mobileNumber, password } = await request.json();

    // 2. Validate mobileNumber
    const mobileRegex = /^\+?[1-9]\d{9,14}$/;
    if (!mobileRegex.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Invalid mobile number. Include country code e.g. +880XXXXXXXXXX" },
        { status: 400 }
      );
    }

    // 3. Validate password
    if (!password || password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // 4. Check if user already exists
    const usersRef = db.collection("users");
    const snapshot = await usersRef.where("mobileNumber", "==", mobileNumber).limit(1).get();

    if (!snapshot.empty) {
      return NextResponse.json(
        { error: "An account with this number already exists" },
        { status: 409 }
      );
    }

    // 5. Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Create new user document
    const docRef = await usersRef.add({
      mobileNumber,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      isVerified: true,
    });

    // 7. Return success response
    return NextResponse.json(
      { message: "Account created successfully", userId: docRef.id },
      { status: 201 }
    );

  } catch (error) {
    // 8. Error handling
    console.error("Registration error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}
