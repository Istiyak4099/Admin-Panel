import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export async function POST(request: NextRequest) {
  try {
    const { mobileNumber, password } = await request.json();

    // 2. Validate fields are present
    if (!mobileNumber || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 3. Query Firestore "Dealers" collection
    const snapshot = await db
      .collection("Dealers")
      .where("mobileNumber", "==", mobileNumber)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
    }

    const doc = snapshot.docs[0];
    const user = doc.data();
    
    // The user document should have a 'hashedPassword' field for secure authentication.
    if (!user.hashedPassword) {
      return NextResponse.json(
        { error: "User account is not configured correctly for authentication." },
        { status: 500 }
      );
    }

    // 4. Compare password
    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid mobile number or password" },
        { status: 401 }
      );
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
    return NextResponse.json(
      { token, userId: doc.id, mobileNumber: user.mobileNumber, role: user.role },
      { status: 200 }
    );

  } catch (error) {
    // 7. Error handling
    console.error("Login error:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `An internal server error occurred: ${errorMessage}` }, { status: 500 });
  }
}
