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
      const res = NextResponse.json({ error: "User account is not configured correctly." }, { status: 500 });
      return setCorsHeaders(res, request);
    }

    const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);

    if (!isPasswordValid) {
      const res = NextResponse.json({ error: "Invalid mobile number or password" }, { status: 401 });
      return setCorsHeaders(res, request);
    }

    const token = jwt.sign(
      { 
       userId: userDoc.id, 
       mobileNumber: user.mobileNumber,
       name: user.name,
       role: user.role,
       shopName: user.shopName,
       dealerCode: user.dealerCode,
       collection: foundCollection
     },
     process.env.JWT_SECRET!,
     { expiresIn: "7d" }
    );

    const response = NextResponse.json(
      { token, userId: userDoc.id, mobileNumber: user.mobileNumber, role: user.role },
      { status: 200 }
    );
    return setCorsHeaders(response, request);

  } catch (error) {
    console.error("Login error:", error);
    const res = NextResponse.json({ error: "An internal server error occurred" }, { status: 500 });
    return setCorsHeaders(res, request);
  }
}
