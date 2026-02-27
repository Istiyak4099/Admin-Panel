import { NextResponse, type NextRequest } from "next/server";
import * as jwt from 'jsonwebtoken';
import { setCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(response, request);
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();

    // 1. If no token provided
    if (!token) {
      const res = NextResponse.json({ error: "Token is required" }, { status: 400 });
      return setCorsHeaders(res, request);
    }

    // 3. Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    
    // 4. If valid
    const response = NextResponse.json({ valid: true, user: decoded }, { status: 200 });
    return setCorsHeaders(response, request);

  } catch (error) {
    // 5. If invalid or expired, jwt.verify throws an error
    const res = NextResponse.json(
      { valid: false, error: "Invalid or expired token" },
      { status: 401 }
    );
    return setCorsHeaders(res, request);
  }
}
