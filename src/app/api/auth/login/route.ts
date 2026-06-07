import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { getAuth } from "firebase-admin/auth";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { setCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}

export async function POST(request: NextRequest) {
  try {
    if (!db) {
      console.error("Firebase Admin SDK failed to initialize — check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars");
      const res = NextResponse.json(
        { error: "Server configuration error. Authentication service unavailable." },
        { status: 500 }
      );
      return setCorsHeaders(res, request);
    }

    const body = await request.json();
    const mobileNumber = body.mobileNumber?.trim();
    const password = body.password;

    if (!mobileNumber || !password) {
      const res = NextResponse.json({ error: "All fields are required" }, { status: 400 });
      return setCorsHeaders(res, request);
    }

    // Check both Dealers and Retailers collections
    let userDoc = null;
    let foundCollection = '';

    // Try Dealers first
    const dealersSnapshot = await db.collection("Dealers").where("mobileNumber", "==", mobileNumber).limit(1).get();
    if (!dealersSnapshot.empty) {
      userDoc = dealersSnapshot.docs[0];
      foundCollection = 'Dealers';
    } else {
      // Try Retailers if not found in Dealers
      const retailersSnapshot = await db.collection("Retailers").where("mobileNumber", "==", mobileNumber).limit(1).get();
      if (!retailersSnapshot.empty) {
        userDoc = retailersSnapshot.docs[0];
        foundCollection = 'Retailers';
      }
    }

    if (!userDoc) {
      const res = NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
      return setCorsHeaders(res, request);
    }

    const user = userDoc.data();

    if (!user.hashedPassword) {
      const res = NextResponse.json(
        { error: "User account is not configured for password authentication." },
        { status: 403 }
      );
      return setCorsHeaders(res, request);
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      const res = NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
      return setCorsHeaders(res, request);
    }

    // Generate a JWT for your own API tracking if needed
    const token = jwt.sign(
      {
        userId: userDoc.id,
        mobileNumber: user.mobileNumber,
        name: user.name,
        role: user.role,
        collection: foundCollection
      },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    // Generate a Firebase Custom Token so the Android app can log in natively
    let firebaseToken = "";
    try {
      firebaseToken = await getAuth().createCustomToken(userDoc.id);
    } catch (authError) {
      console.error("Failed to generate Firebase Custom Token:", authError);
    }

    const response = NextResponse.json(
      { 
        token, 
        firebaseToken, 
        userId: userDoc.id, 
        mobileNumber: user.mobileNumber, 
        role: user.role,
        name: user.name
      },
      { status: 200 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const res = NextResponse.json(
      { error: `An internal server error occurred: ${errorMessage}` },
      { status: 500 }
    );
    return setCorsHeaders(res, request);
  }
}
