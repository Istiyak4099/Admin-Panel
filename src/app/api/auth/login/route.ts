import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { setCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}

export async function POST(request: NextRequest) {
  try {
    const { mobileNumber, password } = await request.json();

    // 2. Validate fields are present
    if (!mobileNumber || !password) {
      const res = NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
      return setCorsHeaders(res, request);
    }

    // 3. Query Firestore "Dealers" collection
    const snapshot = await db
      .collection("Dealers")
      .where("mobileNumber", "==", mobileNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      const res = NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
      return setCorsHeaders(res, request);
    }

    const doc = snapshot.docs[0];
    const user = doc.data();
    
    // The user document should have a 'hashedPassword' field for secure authentication.
    if (!user.hashedPassword) {
      const res = NextResponse.json(
        { error: "User account is not configured correctly for authentication." },
        { status: 500 }
      );
      return setCorsHeaders(res, request);
    }

    // 4. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      const res = NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
      return setCorsHeaders(res, request);
    }

    // 5. Sign JWT
    const token = jwt.sign(
      { 
       userId: doc.id, 
       mobileNumber: user.mobileNumber,
       name: user.name,
       role: user.role,
       shopName: user.shopName,
       dealerCode: user.dealerCode
     },
     process.env.JWT_SECRET!,
     { expiresIn: "7d" }
    );

    // 6. Return success response
    const response = NextResponse.json(
      { token, userId: doc.id, mobileNumber: user.mobileNumber, role: user.role },
      { status: 200 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    // 7. Error handling
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    const res = NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
    return setCorsHeaders(res, request);
  }
}
